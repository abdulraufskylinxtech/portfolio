"use client";

import { useState } from "react";

import type { SiteInfo } from "@/lib/data";
import { AdminBadge, AdminSection } from "../ui";

type Props = {
  data: SiteInfo;
  onTranslated: (site: SiteInfo) => void | Promise<void>;
  readOnly?: boolean;
};

export function SiteTranslationsPanel({ data, onTranslated, readOnly }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasAr = Boolean(data.translations?.ar?.role);
  const hasDe = Boolean(data.translations?.de?.role);
  const updatedAt = data.translationsUpdatedAt
    ? new Date(data.translationsUpdatedAt).toLocaleString()
    : null;

  const translate = async () => {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/translate-site", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        error?: string;
        translations?: SiteInfo["translations"];
        translationsUpdatedAt?: string;
      };

      if (!res.ok) throw new Error(body.error ?? "Translation failed");

      await onTranslated({
        ...data,
        translations: body.translations,
        translationsUpdatedAt: body.translationsUpdatedAt,
      });
      setMessage("Arabic and German translations saved. Refresh the live site and switch language.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSection
      title="AI translations"
      description="Generate Arabic and German copies of your name, role, bio, hero titles, availability, stats, and hobbies using Groq AI."
    >
      <div className="flex flex-wrap items-center gap-2">
        <AdminBadge tone={hasAr ? "success" : "muted"}>Arabic {hasAr ? "ready" : "missing"}</AdminBadge>
        <AdminBadge tone={hasDe ? "success" : "muted"}>German {hasDe ? "ready" : "missing"}</AdminBadge>
        {updatedAt ? (
          <span className="text-xs text-muted-foreground">Last generated: {updatedAt}</span>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Edit your English content above, save, then click generate. Visitors see the matching language when
        they switch EN / AR / DE.
      </p>

      <button
        type="button"
        onClick={() => void translate()}
        disabled={busy || readOnly}
        className="admin-btn admin-btn-primary mt-4"
      >
        {busy ? "Translating with AI…" : "Generate Arabic & German with AI"}
      </button>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
