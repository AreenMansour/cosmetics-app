"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AddTreatmentModal from "@/components/AddTreatmentModal";
import ClientPhotos from "@/components/ClientPhotos";
import ClientPurchaseHistory from "@/components/ClientPurchaseHistory";

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Treatment {
  id: string;
  client_id: string;
  date: string;
  type: string;
  description: string;
  notes: string;
  price: string;
  product: string;
}

export default function ClientCardPage() {
  const params = useParams();
  const clientId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [client, setClient] = useState<Client | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  const [editingClient, setEditingClient] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [clientSectionOpen, setClientSectionOpen] = useState(true);
  const [purchasesSectionOpen, setPurchasesSectionOpen] = useState(true);
  const [treatmentsSectionOpen, setTreatmentsSectionOpen] = useState(true);
  const [photosSectionOpen, setPhotosSectionOpen] = useState(true);

  const fetchData = useCallback(async () => {
    const [clientRes, treatmentsRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase
        .from("treatments")
        .select("*")
        .eq("client_id", clientId)
        .order("date", { ascending: false }),
    ]);

    if (clientRes.error) {
      console.error("Fetch client error:", clientRes.error);
    } else if (clientRes.data) {
      setClient(clientRes.data);
    }

    if (treatmentsRes.error) {
      console.error("Fetch treatments error:", treatmentsRes.error);
    } else {
      setTreatments(treatmentsRes.data || []);
    }
  }, [supabase, clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveTreatment = async (data: {
    date: string;
    type: string;
    description: string;
    notes: string;
    price: string;
    product: string;
  }) => {
    let error = null;

    if (editingTreatment) {
      const result = await supabase
        .from("treatments")
        .update(data)
        .eq("id", editingTreatment.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("treatments")
        .insert([{ ...data, client_id: clientId }]);

      error = result.error;
    }

    if (error) {
      console.error("Save treatment error:", error);
      return;
    }

    setModalOpen(false);
    setEditingTreatment(null);
    await fetchData();
  };

  const handleDeleteTreatment = async (id: string) => {
    if (!confirm("למחוק טיפול זה?")) return;

    const { error } = await supabase.from("treatments").delete().eq("id", id);

    if (error) {
      console.error("Delete treatment error:", error);
      return;
    }

    await fetchData();
  };

  const startEditClient = () => {
    if (!client) return;
    setEditName(client.name);
    setEditPhone(client.phone);
    setEditingClient(true);
  };

  const saveClientEdit = async () => {
    const { error } = await supabase
      .from("clients")
      .update({
        name: editName,
        phone: editPhone,
      })
      .eq("id", clientId);

    if (error) {
      console.error("Save client error:", error);
      return;
    }

    setEditingClient(false);
    await fetchData();
  };

  const sectionCardStyle = {
    background: "white",
    border: "1px solid var(--color-border-light)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  } as const;

  const sectionToggleButtonStyle = {
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border-light)",
    background: "white",
  } as const;

  const renderToggleButton = (
    isOpen: boolean,
    onClick: () => void,
    label: string
  ) => (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg text-base cursor-pointer transition-colors duration-200 flex items-center justify-center"
      style={sectionToggleButtonStyle}
      aria-label={isOpen ? `סגור ${label}` : `פתח ${label}`}
      title={isOpen ? "סגור" : "פתח"}
      type="button"
    >
      {isOpen ? "⌄" : "›"}
    </button>
  );

  if (!client) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="animate-spin w-8 h-8 rounded-full border-3"
          style={{
            borderColor: "var(--color-border)",
            borderTopColor: "var(--color-primary)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* פרטי לקוח */}
      <div className="rounded-xl p-5" style={sectionCardStyle}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            פרטי לקוח
          </h3>
        </div>

        {clientSectionOpen &&
          (editingClient ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none text-lg font-bold"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text)",
                }}
              />
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none text-sm ltr"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-text-muted)",
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveClientEdit}
                  className="px-4 py-1.5 rounded-lg text-white text-sm font-medium cursor-pointer"
                  style={{ background: "var(--color-primary)" }}
                  type="button"
                >
                  שמור
                </button>
                <button
                  onClick={() => setEditingClient(false)}
                  className="px-4 py-1.5 rounded-lg text-sm cursor-pointer"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                  type="button"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  {client.name}
                </h2>
                <p
                  className="text-sm ltr mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  מספר טלפון: {client.phone}
                </p>
              </div>

              <button
                onClick={startEditClient}
                className="text-sm px-3 py-1 rounded-lg cursor-pointer transition-colors duration-200 shrink-0"
                style={{
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border-light)",
                }}
                type="button"
              >
                ✏️
              </button>
            </div>
          ))}
      </div>

      {/* היסטוריית רכישות */}
      <div className="rounded-xl p-5" style={sectionCardStyle}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            היסטוריית רכישות
          </h3>

          {renderToggleButton(
            purchasesSectionOpen,
            () => setPurchasesSectionOpen((prev) => !prev),
            "היסטוריית רכישות"
          )}
        </div>

        {purchasesSectionOpen && <ClientPurchaseHistory clientId={clientId} />}
      </div>

      {/* היסטוריית טיפולים */}
      <div className="rounded-xl p-5" style={sectionCardStyle}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            היסטוריית טיפולים ({treatments.length})
          </h3>

          {renderToggleButton(
            treatmentsSectionOpen,
            () => setTreatmentsSectionOpen((prev) => !prev),
            "היסטוריית טיפולים"
          )}
        </div>

        {treatmentsSectionOpen && (
          <>
            <div className="mb-4">
              <button
                onClick={() => {
                  setEditingTreatment(null);
                  setModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  color: "white",
                }}
                type="button"
              >
                + הוספת טיפול
              </button>
            </div>

            {treatments.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: "var(--color-text-muted)" }}
              >
                אין טיפולים עדיין
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div
                  className="hidden md:block overflow-x-auto rounded-xl"
                  style={{ border: "1px solid var(--color-border-light)" }}
                >
                  <table className="w-full text-sm table-fixed">
                    <thead style={{ background: "var(--color-bg)" }}>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--color-border-light)",
                        }}
                      >
                        <th className="text-right py-3 px-3 w-[140px]">תאריך</th>
                        <th className="text-right py-3 px-3 w-[140px]">
                          סוג טיפול
                        </th>
                        <th className="text-right py-3 px-3">פירוט</th>
                        <th className="text-right py-3 px-3">הערות</th>
                        <th className="text-right py-3 px-3 w-[120px]">מחיר</th>
                        <th className="text-right py-3 px-3 w-[140px]">
                          מוצר/קרם
                        </th>
                        <th className="text-right py-3 px-3 w-[110px]">
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments.map((treatment) => (
                        <tr
                          key={treatment.id}
                          style={{
                            borderTop: "1px solid var(--color-border-light)",
                          }}
                        >
                          <td className="py-3 px-3 whitespace-nowrap">
                            {new Date(
                              treatment.date + "T00:00:00"
                            ).toLocaleDateString("he-IL")}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {treatment.type}
                          </td>
                          <td className="py-3 px-3 break-words">
                            {treatment.description || "-"}
                          </td>
                          <td className="py-3 px-3 break-words">
                            {treatment.notes || "-"}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {treatment.price ? `${treatment.price} ₪` : "-"}
                          </td>
                          <td className="py-3 px-3 break-words">
                            {treatment.product || "-"}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingTreatment(treatment);
                                  setModalOpen(true);
                                }}
                                className="text-xs px-2 py-1 rounded-lg btn-ghost cursor-pointer"
                                type="button"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTreatment(treatment.id)
                                }
                                className="text-xs px-2 py-1 rounded-lg btn-ghost cursor-pointer"
                                type="button"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="rounded-xl p-4"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border-light)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div
                            className="text-base font-semibold break-words"
                            style={{ color: "var(--color-text)" }}
                          >
                            {treatment.type}
                          </div>
                          <div
                            className="text-sm mt-1 break-words"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {treatment.description || "ללא פירוט"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingTreatment(treatment);
                              setModalOpen(true);
                            }}
                            className="text-xs px-2 py-1 rounded-lg btn-ghost cursor-pointer"
                            type="button"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteTreatment(treatment.id)
                            }
                            className="text-xs px-2 py-1 rounded-lg btn-ghost cursor-pointer"
                            type="button"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
                        <div style={{ color: "var(--color-text-muted)" }}>
                          תאריך
                        </div>
                        <div className="text-left ltr">
                          {new Date(
                            treatment.date + "T00:00:00"
                          ).toLocaleDateString("he-IL")}
                        </div>

                        <div style={{ color: "var(--color-text-muted)" }}>
                          הערות
                        </div>
                        <div className="text-left break-words">
                          {treatment.notes || "-"}
                        </div>

                        <div style={{ color: "var(--color-text-muted)" }}>
                          מחיר
                        </div>
                        <div className="text-left">
                          {treatment.price ? `${treatment.price} ש״ח` : "-"}
                        </div>

                        <div style={{ color: "var(--color-text-muted)" }}>
                          מוצר/קרם
                        </div>
                        <div className="text-left break-words">
                          {treatment.product || "-"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* תמונות לפני / אחרי */}
      <div className="rounded-xl p-5" style={sectionCardStyle}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            תמונות לפני / אחרי
          </h3>

          {renderToggleButton(
            photosSectionOpen,
            () => setPhotosSectionOpen((prev) => !prev),
            "תמונות לפני / אחרי"
          )}
        </div>

        {photosSectionOpen && <ClientPhotos clientId={clientId} />}
      </div>

      <AddTreatmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTreatment(null);
        }}
        onSave={handleSaveTreatment}
        initial={
          editingTreatment
            ? {
                date: editingTreatment.date,
                type: editingTreatment.type,
                description: editingTreatment.description,
                notes: editingTreatment.notes,
                price: editingTreatment.price,
                product: editingTreatment.product,
              }
            : null
        }
      />
    </div>
  );
}