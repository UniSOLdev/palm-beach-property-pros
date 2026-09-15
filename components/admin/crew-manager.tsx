"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { archiveCrewMember, saveCrewMember } from "@/lib/admin/actions/crew";

type CrewListRow = {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  default_pay_rate: number;
  pay_rate_unit: string;
  referral_bonus_flat?: number;
  referral_bonus_percent?: number;
  notes: string | null;
};

type CrewForm = {
  name: string;
  phone: string;
  role: string;
  default_pay_rate: number;
  pay_rate_unit: string;
  referral_bonus_flat: number;
  referral_bonus_percent: number;
  notes: string;
};

const emptyForm: CrewForm = {
  name: "",
  phone: "",
  role: "",
  default_pay_rate: 0,
  pay_rate_unit: "hour",
  referral_bonus_flat: 25,
  referral_bonus_percent: 0,
  notes: "",
};

export function CrewManager({ initial }: { initial: CrewListRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CrewForm>(emptyForm);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEdit(row: CrewListRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      phone: row.phone ?? "",
      role: row.role ?? "",
      default_pay_rate: Number(row.default_pay_rate) || 0,
      pay_rate_unit: row.pay_rate_unit ?? "hour",
      referral_bonus_flat: Number(row.referral_bonus_flat ?? 25),
      referral_bonus_percent: Number(row.referral_bonus_percent ?? 0),
      notes: row.notes ?? "",
    });
    setShowForm(true);
    setError("");
  }

  function submit() {
    startTransition(async () => {
      try {
        setError("");
        await saveCrewMember({ id: editingId ?? undefined, ...form });
        setShowForm(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function archive(id: string) {
    if (!confirm("Archive this crew member?")) return;
    startTransition(async () => {
      try {
        setError("");
        await archiveCrewMember(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Archive failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openCreate} className="admin-btn">
          + Add crew member
        </button>
        <Link href="/admin/hub" className="admin-btn-secondary no-underline">
          Open Employee Hub
        </Link>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {showForm ? (
        <div className="admin-card space-y-3">
          <h2 className="font-bold text-navy">{editingId ? "Edit crew" : "New crew member"}</h2>
          <label className="block text-sm font-semibold text-navy">
            Name *
            <input
              className="admin-input mt-1 w-full"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            Phone
            <input
              className="admin-input mt-1 w-full"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            Role
            <input
              className="admin-input mt-1 w-full"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Lead, helper, detail…"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-navy">
              Pay rate
              <input
                className="admin-input mt-1 w-full"
                type="number"
                min={0}
                step="0.01"
                value={form.default_pay_rate}
                onChange={(e) => setForm((f) => ({ ...f, default_pay_rate: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-sm font-semibold text-navy">
              Per
              <select
                className="admin-input mt-1 w-full"
                value={form.pay_rate_unit}
                onChange={(e) => setForm((f) => ({ ...f, pay_rate_unit: e.target.value }))}
              >
                <option value="hour">Hour</option>
                <option value="job">Job</option>
                <option value="day">Day</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-navy">
              Referral bonus ($)
              <input
                className="admin-input mt-1 w-full"
                type="number"
                min={0}
                step="1"
                value={form.referral_bonus_flat}
                onChange={(e) => setForm((f) => ({ ...f, referral_bonus_flat: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-sm font-semibold text-navy">
              Referral % (optional)
              <input
                className="admin-input mt-1 w-full"
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={form.referral_bonus_percent}
                onChange={(e) => setForm((f) => ({ ...f, referral_bonus_percent: Number(e.target.value) }))}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-navy">
            Notes
            <textarea
              className="admin-input mt-1 min-h-[72px] w-full"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={submit} className="admin-btn flex-1">
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <ul className="space-y-3">
        {initial.map((row) => (
          <li key={row.id} className="admin-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">{row.name}</p>
                <p className="text-xs text-charcoal/60">
                  {[row.role, row.phone].filter(Boolean).join(" · ") || "—"}
                </p>
                {Number(row.default_pay_rate) > 0 ? (
                  <p className="mt-1 text-xs text-charcoal/50">
                    ${Number(row.default_pay_rate).toFixed(2)}/{row.pay_rate_unit ?? "hour"}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => openEdit(row)} className="admin-btn-secondary px-3 py-1.5 text-xs">
                  Edit
                </button>
                <button type="button" onClick={() => archive(row.id)} className="admin-btn-secondary px-3 py-1.5 text-xs">
                  Archive
                </button>
              </div>
            </div>
            {row.notes ? <p className="mt-2 text-xs text-charcoal/70">{row.notes}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
