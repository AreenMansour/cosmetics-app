"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import AddAppointmentModal from "@/components/AddAppointmentModal";

interface Appointment {
  id: string;
  client_name: string;
  treatment_type: string;
  date: string;
  time: string;
}

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTH_NAMES = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(time: string): string {
  return time?.slice(0, 5) || "";
}

export default function DiaryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [tomorrowAppts, setTomorrowAppts] = useState<Appointment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1);
  }, [selectedMonth, selectedYear]);

  const monthStart = useMemo(() => {
    const d = new Date(currentMonth);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentMonth]);

  const monthDays = useMemo(() => {
    const days: Date[] = [];
    const d = new Date(monthStart);

    while (d <= monthEnd) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    return days;
  }, [monthStart, monthEnd]);
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []
  
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1)
    const startDay = firstDayOfMonth.getDay() // 0 = Sunday
  
    // רווחים לפני תחילת החודש
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
  
    // ימי החודש
    const lastDate = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(selectedYear, selectedMonth, i))
    }
  
    return days
  }, [selectedMonth, selectedYear])

  const fetchAppointments = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .gte("date", toLocalDate(monthStart))
      .lte("date", toLocalDate(monthEnd))
      .order("date")
      .order("time");

    if (error) {
      console.error("Fetch appointments error:", error);
      return;
    }

    setAppointments(data || []);
  }, [supabase, monthStart, monthEnd]);

  const fetchClientNames = useCallback(async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("name")
      .order("name");

    if (error) {
      console.error("Fetch client names error:", error);
      return;
    }

    setClientNames(data?.map((c) => c.name) || []);
  }, [supabase]);

  const fetchTomorrow = useCallback(async () => {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const dateStr = toLocalDate(tomorrow);

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("date", dateStr)
      .order("time");

    if (error) {
      console.error("Tomorrow fetch error:", error);
      return;
    }

    setTomorrowAppts(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchAppointments();
    fetchClientNames();
  }, [fetchAppointments, fetchClientNames]);

  useEffect(() => {
    fetchTomorrow();
  }, [fetchTomorrow]);

  useEffect(() => {
    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        async () => {
          await fetchAppointments();
          await fetchTomorrow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchAppointments, fetchTomorrow]);

  const openAddForDay = (dateStr: string) => {
    setEditingAppt(null);
    setPreselectedDate(dateStr);
    setModalOpen(true);
  };

  const handleSave = async (data: {
    client_name: string;
    treatment_type: string;
    date: string;
    time: string;
  }) => {
    let error = null;

    if (editingAppt) {
      const result = await supabase
        .from("appointments")
        .update(data)
        .eq("id", editingAppt.id);

      error = result.error;
    } else {
      const result = await supabase.from("appointments").insert([data]);
      error = result.error;
    }

    if (error) {
      console.error("Save appointment error:", error);
      return;
    }

    setModalOpen(false);
    setEditingAppt(null);

    await fetchAppointments();
    await fetchTomorrow();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק תור זה?")) return;

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      console.error("Delete appointment error:", error);
      return;
    }

    await fetchAppointments();
    await fetchTomorrow();
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const todayStr = toLocalDate(new Date());

  return (
    <div className="space-y-4">
      {tomorrowAppts.length > 0 ? (
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, #ffe7ea, #FDF2D0)",
            border: "1px solid var(--color-primary-light)",
          }}
        >
          <p
            className="font-semibold mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            תזכורת: יש לך {tomorrowAppts.length} תורים מחר
          </p>
          <div className="space-y-1">
            {tomorrowAppts.map((appt) => (
              <p
                key={appt.id}
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {formatTime(appt.time)} - {appt.client_name} (
                {appt.treatment_type})
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-center text-gray-400">אין תורים למחר</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="text-2xl cursor-pointer bg-transparent border-none p-2 transition-colors duration-200"
          style={{ color: "var(--color-text-secondary)" }}
        >
          →
        </button>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-2 py-1 rounded-lg input-field text-sm"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2 py-1 rounded-lg input-field text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        <button
          onClick={nextMonth}
          className="text-2xl cursor-pointer bg-transparent border-none p-2 transition-colors duration-200"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ←
        </button>
      </div>
      <div className="hidden md:grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium">
  {DAY_NAMES.map((day) => (
    <div key={day} style={{ color: "var(--color-text-muted)" }}>
      {day}
    </div>
  ))}
</div>
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
      {calendarDays.map((day, i) => {
    if (!day) {
      return <div key={i} />
    }

    const dateStr = toLocalDate(day)
    const isToday = dateStr === todayStr
    const dayAppts = appointments.filter(a => a.date === dateStr)

    return (
      <div
        key={i}
        className="rounded-xl p-3 min-h-[160px]"
        style={{
          background: isToday
            ? "linear-gradient(to bottom, #FFF8E7, white)"
            : "white",
          border: isToday
            ? "2px solid var(--color-primary)"
            : "1px solid var(--color-border-light)",
        }}
      >
        <div className="text-right mb-2">
          <div
            className="text-sm font-semibold"
            style={{
              color: isToday
                ? "var(--color-primary)"
                : "var(--color-text)",
            }}
          >
            {day.getDate()}
          </div>
        </div>

              <div className="space-y-1.5">
                {dayAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="group rounded-lg p-2 text-xs transition-all duration-200"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border-light)",
                    }}
                  >
                    <div
                      className="font-medium ltr"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {formatTime(appt.time)}
                    </div>
                    <div className="font-medium">{appt.client_name}</div>
                    <div style={{ color: "var(--color-text-muted)" }}>
                      {appt.treatment_type}
                    </div>
                    
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => {
                          setEditingAppt(appt);
                          setModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(appt.id)}
                        className="text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => openAddForDay(dateStr)}
                className="w-full mt-2 py-1 rounded-lg text-xs cursor-pointer transition-all duration-200 opacity-40 hover:opacity-100"
                style={{
                  border: "1px dashed var(--color-border)",
                  color: "var(--color-primary)",
                  background: "transparent",
                }}
              >
                +
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {monthDays.map((day, i) => {
          const dateStr = toLocalDate(day);
          const isToday = dateStr === todayStr;
          const dayAppts = appointments.filter((a) => a.date === dateStr);

          return (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: isToday
                  ? "linear-gradient(to bottom, #FFF8E7, white)"
                  : "white",
                border: isToday
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border-light)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold"
                    style={{
                      color: isToday
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    }}
                  >
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <button
                  onClick={() => openAddForDay(dateStr)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer transition-all duration-200"
                  style={{ background: "var(--color-primary)", color: "white" }}
                >
                  +
                </button>
              </div>

              {dayAppts.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  -
                </p>
              ) : (
                <div className="space-y-2">
                  {dayAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between rounded-lg p-2"
                      style={{ background: "var(--color-bg)" }}
                    >
                      <div>
                        <span
                          className="text-sm font-medium ltr"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {formatTime(appt.time)}
                        </span>
                        <span className="text-sm mr-2">{appt.client_name}</span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          ({appt.treatment_type})
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingAppt(appt);
                            setModalOpen(true);
                          }}
                          className="text-xs p-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="text-xs p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="fab"
        onClick={() => {
          setEditingAppt(null);
          setPreselectedDate(null);
          setModalOpen(true);
        }}
      >
        +
      </button>

      <AddAppointmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAppt(null);
        }}
        onSave={handleSave}
        initial={
          editingAppt
            ? {
                client_name: editingAppt.client_name,
                treatment_type: editingAppt.treatment_type,
                date: editingAppt.date,
                time: editingAppt.time,
              }
            : null
        }
        clientNames={clientNames}
        defaultDate={preselectedDate}
      />
    </div>
  );
}