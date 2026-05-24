"use client";

import { useRef, useState, useTransition } from "react";
import { submitDocumentSignature } from "@/lib/admin/actions/signatures";

const LEGAL =
  "By signing below, I agree this electronic signature is the legal equivalent of my handwritten signature.";

export function DocumentSignatureForm({
  token,
  title,
  alreadySigned,
  signerName: existingName,
}: {
  token: string;
  title: string;
  alreadySigned: boolean;
  signerName?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [name, setName] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(alreadySigned);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="rounded-2xl bg-leaf/20 px-6 py-8 text-center">
        <p className="text-xl font-bold text-navy">Signature recorded</p>
        <p className="mt-2 text-sm text-charcoal/80">Thank you, {(existingName ?? name) || "signer"}.</p>
      </div>
    );
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0C2340";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function submit() {
    setError("");
    const signer = name.trim();
    if (!signer) {
      setError("Enter your full legal name.");
      return;
    }

    let signature_data = signer;
    if (mode === "drawn") {
      const canvas = canvasRef.current;
      if (!canvas) {
        setError("Draw your signature.");
        return;
      }
      signature_data = canvas.toDataURL("image/png");
    }

    startTransition(async () => {
      try {
        await submitDocumentSignature({
          token,
          signer_name: signer,
          signature_type: mode,
          signature_data,
        });
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save signature");
      }
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="text-sm text-charcoal/80">{LEGAL}</p>

      <div className="flex gap-2">
        <button
          type="button"
          className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold ${mode === "typed" ? "bg-navy text-white" : "bg-sky/40 text-navy"}`}
          onClick={() => setMode("typed")}
        >
          Type name
        </button>
        <button
          type="button"
          className={`min-h-[44px] flex-1 rounded-xl text-sm font-semibold ${mode === "drawn" ? "bg-navy text-white" : "bg-sky/40 text-navy"}`}
          onClick={() => setMode("drawn")}
        >
          Draw signature
        </button>
      </div>

      <label className="block text-sm font-semibold text-navy">
        Full legal name
        <input
          className="mt-2 w-full min-h-[52px] rounded-xl border border-navy/20 px-4 text-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Jane Client"
        />
      </label>

      {mode === "drawn" ? (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={320}
            height={120}
            className="w-full touch-none rounded-xl border border-navy/20 bg-white"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={() => setDrawing(false)}
            onPointerLeave={() => setDrawing(false)}
          />
          <button type="button" className="text-sm font-semibold text-ocean" onClick={clearCanvas}>
            Clear drawing
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button type="button" className="admin-btn w-full min-h-[52px]" disabled={pending} onClick={submit}>
        {pending ? "Saving…" : "Sign document"}
      </button>
    </div>
  );
}
