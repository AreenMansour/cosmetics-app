"use client";

import { useState, useEffect } from "react";

interface TreatmentData {
  date: string;
  type: string;
  description: string;
  notes: string;
  product: string;
  price: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TreatmentData) => void;
  initial?: TreatmentData | null;
}

export default function AddTreatmentModal({
  isOpen,
  onClose,
  onSave,
  initial,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [product, setProduct] = useState("");

  useEffect(() => {
    if (initial) {
      setDate(initial.date);
      setType(initial.type);
      setDescription(initial.description);
      setNotes(initial.notes);
      setPrice(initial.price);
      setProduct(initial.product);
    } else {
      setDate(today);
      setType("");
      setDescription("");
      setNotes("");
      setPrice("");
      setProduct("");
    }
  }, [initial, isOpen, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ date, type, description, notes, price, product });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          {initial ? "עריכת טיפול" : "טיפול חדש"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              תאריך
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              סוג טיפול
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg input-field"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              פירוט
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg input-field"
              style={{ resize: "vertical" }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              הערות
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg input-field"
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                מחיר
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
                מוצר/קרם
              </label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-lg input-field"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg font-medium btn-primary"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg font-medium btn-secondary"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
