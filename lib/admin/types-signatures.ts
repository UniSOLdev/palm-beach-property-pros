export type SigningDocumentType = "invoice" | "quote" | "change_order" | "work_authorization";

export type SigningRequestRow = {
  id: string;
  token: string;
  document_type: SigningDocumentType;
  document_public_id: string;
  document_id: string | null;
  title: string;
  status: "pending" | "signed" | "declined" | "expired" | "void";
  signer_name: string | null;
  signature_type: "typed" | "drawn" | null;
  signature_data: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  signed_at: string | null;
  expires_at: string | null;
  audit_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
