import { AdminPageHeader, Card } from "@/components/admin/ui";
import { saveBusinessSettingsAction } from "@/lib/admin/actions";
import { getBusinessSettings } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function SettingsPage() {
  const s = await getBusinessSettings();
  const useDb = isSupabaseServerConfigured();

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Brand, terms, and payment defaults flow into quotes, invoices, and client pages."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Business profile">
          {useDb ? (
            <form action={saveBusinessSettingsAction} className="grid gap-4 text-sm">
              {s.id ? <input type="hidden" name="id" value={s.id} /> : null}
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Business name</span>
                <input name="business_name" defaultValue={s.businessName} required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</span>
                <input name="phone" defaultValue={s.phone} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</span>
                <input name="email" type="email" defaultValue={s.email} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Website</span>
                <input name="website" defaultValue={s.website} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address / service area</span>
                <input name="address" defaultValue={s.address} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Google review link</span>
                <input name="google_review_url" defaultValue={s.googleReviewUrl} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Logo URL</span>
                <input name="logo_url" defaultValue={s.logoUrl ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Default invoice terms</span>
                <textarea name="default_invoice_terms" rows={4} defaultValue={s.defaultInvoiceTerms} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Default quote terms</span>
                <textarea name="default_quote_terms" rows={4} defaultValue={s.defaultQuoteTerms} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment methods accepted (comma-separated)</span>
                <input
                  name="payment_methods_accepted"
                  defaultValue={s.paymentMethodsAccepted.join(", ")}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
                />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Brand primary</span>
                <input name="brand_primary" defaultValue={s.brandPrimary} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Brand accent</span>
                <input name="brand_accent" defaultValue={s.brandAccent} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
              </label>
              <button type="submit" className="btn-primary">
                Save settings
              </button>
            </form>
          ) : (
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Business name</dt>
                <dd className="mt-1 font-semibold text-navy">{s.businessName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</dt>
                <dd className="mt-1 text-charcoal">{s.phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</dt>
                <dd className="mt-1 text-charcoal">{s.email}</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card title="Terms & payments (read-only preview)">
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Default invoice terms</div>
              <p className="mt-2 leading-relaxed text-charcoal/80">{s.defaultInvoiceTerms}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Default quote terms</div>
              <p className="mt-2 leading-relaxed text-charcoal/80">{s.defaultQuoteTerms}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment methods accepted</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.paymentMethodsAccepted.map((p) => (
                  <span key={p} className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-navy">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Brand colors" className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-navy/10 p-4">
              <div className="h-12 w-12 rounded-xl shadow-inner" style={{ background: s.brandPrimary }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Primary navy</div>
                <div className="font-mono text-sm text-navy">{s.brandPrimary}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-navy/10 p-4">
              <div className="h-12 w-12 rounded-xl shadow-inner" style={{ background: s.brandAccent }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Accent leaf</div>
                <div className="font-mono text-sm text-navy">{s.brandAccent}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
