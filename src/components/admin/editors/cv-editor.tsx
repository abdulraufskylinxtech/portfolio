"use client";

import { useRef, useState } from "react";

import { AdminBadge, AdminField, AdminInput, AdminSection } from "@/components/admin/ui";
import type { SiteCv } from "@/lib/data";

type Props = {
  cv?: SiteCv | null;
  readOnly?: boolean;
  onChange: (cv: SiteCv | null) => void;
};

export function CvEditor({ cv, readOnly, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/cv", { method: "POST", body });
      const data = (await res.json()) as { error?: string; cv?: SiteCv };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange(data.cv ?? null);
      setMessage("CV uploaded and saved to the site.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete the CV file from the site?")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/cv", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) throw new Error(data.error ?? "Delete failed");

      onChange(null);
      setMessage("CV removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-editor-stack">
      <AdminSection
        title="Resume / CV"
        description="Upload a PDF. It is saved to public/cv/ and linked from the navbar for visitors."
      >
        {cv?.url ? (
          <div className="admin-subcard">
            <div className="admin-subcard-head">
              <div>
                <p className="font-medium text-foreground">{cv.filename}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cv.uploadedAt
                    ? `Uploaded ${new Date(cv.uploadedAt).toLocaleString()}`
                    : "Ready on the live site"}
                </p>
              </div>
              <AdminBadge tone="success">Live</AdminBadge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={cv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-ghost text-xs"
              >
                View PDF
              </a>
              <a href={cv.url} download={cv.filename} className="admin-btn admin-btn-ghost text-xs">
                Download
              </a>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy || readOnly}
                className="admin-btn admin-btn-danger text-xs"
              >
                Delete CV
              </button>
            </div>
          </div>
        ) : (
          <p className="admin-empty">No CV uploaded yet. Add a PDF below.</p>
        )}

        <div className="mt-4">
          <label className="admin-field">
            <span className="admin-label">{cv ? "Replace CV (PDF)" : "Upload CV (PDF)"}</span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy || readOnly}
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <span className="admin-hint">Max 5 MB. Saved locally or committed to GitHub on Vercel.</span>
          </label>
        </div>

        {cv ? (
          <AdminField label="Button label (optional)" className="mt-4">
            <AdminInput
              value={cv.label ?? ""}
              onChange={(label) => onChange({ ...cv, label: label || undefined })}
              disabled={readOnly}
              placeholder="Resume"
            />
            <span className="admin-hint">
              Shown in the navbar. Click &quot;Save changes&quot; after editing the label.
            </span>
          </AdminField>
        ) : null}

        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </AdminSection>
    </div>
  );
}
