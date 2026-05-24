import { SIGNED_DOCUMENTS_BUCKET } from "@/lib/quotes/constants";
import { logPipelineError } from "@/lib/pipeline/logger";
import { createServiceClient } from "@/lib/supabase/service";

async function signedUrlForPath(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(SIGNED_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    logPipelineError("public signed doc url failed", error ?? new Error("no url"), {
      step: "signedUrlForPath",
      details: { path },
    });
    return null;
  }

  return data.signedUrl;
}

export async function getPublicQuoteDocumentUrls(quote: {
  approval_status: string;
  client_signature_url: string | null;
  signed_pdf_url: string | null;
}) {
  if (quote.approval_status !== "signed") {
    return { signaturePreviewUrl: null, pdfDownloadUrl: null };
  }

  const [signaturePreviewUrl, pdfDownloadUrl] = await Promise.all([
    signedUrlForPath(quote.client_signature_url),
    signedUrlForPath(quote.signed_pdf_url),
  ]);

  return { signaturePreviewUrl, pdfDownloadUrl };
}
