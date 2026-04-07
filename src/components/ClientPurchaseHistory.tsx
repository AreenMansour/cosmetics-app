"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProductCatalogItem {
  id: string;
  category: string;
  name: string;
}

interface ClientPurchase {
  id: string;
  client_id: string;
  product_catalog_id: string | null;
  product_name: string;
  product_category: string | null;
  price: number;
  note: string | null;
  purchase_date: string;
  created_at: string;
}

interface Props {
  clientId: string;
}

export default function ClientPurchaseHistory({ clientId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [useFreeText, setUseFreeText] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [customProductName, setCustomProductName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}.${m}.${y}`;
  });

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, ProductCatalogItem[]> = {};

    for (const item of catalog) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }

    return groups;
  }, [catalog]);

  const fetchPurchases = useCallback(async () => {
    const { data, error } = await supabase
      .from("client_purchases")
      .select("*")
      .eq("client_id", clientId)
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch purchases error:", error);
      return;
    }

    setPurchases(data || []);
  }, [supabase, clientId]);

  const fetchCatalog = useCallback(async () => {
    const { data, error } = await supabase
      .from("product_catalog")
      .select("id, category, name")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Fetch catalog error:", error);
      return;
    }

    setCatalog(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchPurchases();
    fetchCatalog();
  }, [fetchPurchases, fetchCatalog]);

  useEffect(() => {
    const channel = supabase
      .channel(`client-purchases-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_purchases",
          filter: `client_id=eq.${clientId}`,
        },
        async () => {
          await fetchPurchases();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, clientId, fetchPurchases]);

  const resetForm = () => {
    setUseFreeText(false);
    setSelectedCatalogId("");
    setCustomProductName("");
    setCustomCategory("");
    setPrice("");
    setNote("");
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setPurchaseDate(`${day}.${m}.${y}`);
  };

  const handleSave = async () => {
    let productName = "";
    let productCategory = "";
    let productCatalogId: string | null = null;

    if (useFreeText) {
      productName = customProductName.trim();
      productCategory = customCategory.trim();
    } else {
      const selected = catalog.find((item) => item.id === selectedCatalogId);
      if (!selected) {
        alert("יש לבחור מוצר מהרשימה או לעבור לטקסט חופשי");
        return;
      }
      productName = selected.name;
      productCategory = selected.category;
      productCatalogId = selected.id;
    }

    if (!productName) {
      alert("יש להזין שם מוצר");
      return;
    }

    if (price === "" || Number(price) < 0) {
      alert("יש להזין עלות מוצר תקינה");
      return;
    }

    const { error } = await supabase.from("client_purchases").insert([
      {
        client_id: clientId,
        product_catalog_id: productCatalogId,
        product_name: productName,
        product_category: productCategory || null,
        price: Number(price),
        note: note.trim(),
        purchase_date: purchaseDate,
      },
    ]);

    if (error) {
      console.error("Save purchase error:", error);
      alert("שגיאה בשמירת הרכישה");
      return;
    }

    setModalOpen(false);
    resetForm();
    await fetchPurchases();
  };
  const handleEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("client_purchases")
      .select("*")
      .eq("id", id);
    if (error) {
      console.error("Edit purchase error:", error);
      return;
    }
    setModalOpen(true);
    setUseFreeText(false);
    setSelectedCatalogId(data[0].product_catalog_id || "");
    setCustomProductName(data[0].product_name || "");
    setCustomCategory(data[0].product_category || "");
    setPrice(data[0].price || "");
    setNote(data[0].note || "");
  };
  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את הרכישה הזאת?")) return;

    const { error } = await supabase
      .from("client_purchases")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete purchase error:", error);
      return;
    }

    await fetchPurchases();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        {/* <h3
          className="text-base font-semibold mb-3"
          style={{ color: "var(--color-text-secondary)" }}
        >
          היסטוריית רכישות ({purchases.length})
        </h3> */}

        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
          style={{
            background: "var(--color-primary)",
            color: "white",
          }}
        >
          + הוספת רכישה
        </button>
      </div>

      {purchases.length === 0 ? (
        <p
          className="text-sm text-center py-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          אין רכישות עדיין
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
                  <th className="text-right py-3 px-3 w-[140px]">קטגוריה</th>
                  <th className="text-right py-3 px-3">שם מוצר</th>
                  <th className="text-right py-3 px-3 w-[120px]">עלות</th>
                  <th className="text-right py-3 px-3">הערה</th>
                  <th className="text-right py-3 px-3 w-[110px]">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    style={{
                      borderBottom: "1px solid var(--color-border-light)",
                    }}
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      {new Date(
                        purchase.purchase_date + "T00:00:00",
                      ).toLocaleDateString("he-IL")}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {purchase.product_category || "-"}
                    </td>
                    <td className="py-3 px-3 font-medium break-words">
                      {purchase.product_name}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {purchase.price} ₪
                    </td>
                    <td className="py-3 px-3 break-words">
                      {purchase.note || "-"}
                    </td>
                    <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(purchase.id)}
                          className="cursor-pointer btn-ghost text-xs p-1 rounded"
                          title="עריכה"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="cursor-pointer btn-ghost text-xs p-1 rounded"
                          title="מחיקה"
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
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="rounded-xl p-4"
                style={{
                  background: "white",
                  border: "1px solid var(--color-border-light)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div
                      className="text-base font-semibold break-words"
                      style={{ color: "var(--color-text)" }}
                    >
                      {purchase.product_name}
                    </div>
                    <div
                      className="text-sm mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {purchase.product_category || "ללא קטגוריה"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="text-xs px-2 py-1 rounded-lg btn-ghost cursor-pointer"
                      title="עריכה"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(purchase.id)}
                      className="text-xs px-2 py-1 rounded-lg btn-ghost cursor-pointer"
                      title="מחיקה"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
                  <div style={{ color: "var(--color-text-muted)" }}>תאריך</div>
                  <div
                    className="text-left ltr"
                    style={{ color: "var(--color-text)" }}
                  >
                    {new Date(
                      purchase.purchase_date + "T00:00:00",
                    ).toLocaleDateString("he-IL")}
                  </div>

                  <div style={{ color: "var(--color-text-muted)" }}>עלות</div>
                  <div
                    className="text-left"
                    style={{ color: "var(--color-text)" }}
                  >
                    {purchase.price} ש״ח
                  </div>

                  <div style={{ color: "var(--color-text-muted)" }}>הערה</div>
                  <div
                    className="text-left break-words"
                    style={{ color: "var(--color-text)" }}
                  >
                    {purchase.note || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-primary)" }}
            >
              הוספת רכישה
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="free-text-product"
                  type="checkbox"
                  checked={useFreeText}
                  onChange={(e) => {
                    setUseFreeText(e.target.checked);
                    setSelectedCatalogId("");
                  }}
                />
                <label htmlFor="free-text-product" className="text-sm">
                  להזין מוצר בטקסט חופשי
                </label>
              </div>

              {!useFreeText ? (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    שם המוצר
                  </label>
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => setSelectedCatalogId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg input-field"
                  >
                    <option value="">בחר מוצר</option>
                    {Object.entries(groupedCatalog).map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      קטגוריה
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg input-field"
                      placeholder="למשל: סרומים"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      שם המוצר
                    </label>
                    <input
                      type="text"
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg input-field"
                      placeholder="שם מוצר ידני"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  עלות המוצר
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^\d*\.?\d*$/.test(value)) {
                      setPrice(value)
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg ltr input-field"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  תאריך רכישה
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg ltr input-field"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  הערה
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg input-field"
                  placeholder="הערה על הרכישה..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 rounded-lg font-medium btn-primary"
                >
                  שמור
                </button>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 rounded-lg font-medium btn-secondary"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
