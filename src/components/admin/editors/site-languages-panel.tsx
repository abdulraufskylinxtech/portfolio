"use client";

import { Check, ChevronDown, Languages, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SiteInfo } from "@/lib/data";
import { LOCALE_CATALOG } from "@/lib/locale-catalog";
import {
  addLocaleToSite,
  getAddableLocales,
  getDefaultLocaleCode,
  getEnabledLocales,
  getTranslatableLocaleCodes,
  removeLocaleFromSite,
} from "@/lib/site-locales";
import { AdminBadge, AdminSection } from "../ui";

type Props = {
  data: SiteInfo;
  onChange: (data: SiteInfo) => void;
  onTranslated: (site: SiteInfo) => void | Promise<void>;
  readOnly?: boolean;
};

function flagCountryCode(flag: string): string | null {
  const points = Array.from(flag, (character) => character.codePointAt(0) ?? 0);
  if (points.length !== 2 || points.some((point) => point < 0x1f1e6 || point > 0x1f1ff)) {
    return null;
  }
  return points.map((point) => String.fromCharCode(point - 0x1f1e6 + 97)).join("");
}

function LanguageIcon({ flag, code }: { flag: string; code: string }) {
  const countryCode = flagCountryCode(flag);

  if (countryCode) {
    return (
      <span
        className="h-[18px] w-6 shrink-0 rounded-sm border border-white/15 bg-cover bg-center shadow-sm"
        style={{ backgroundImage: `url(https://flagcdn.com/24x18/${countryCode}.png)` }}
        role="img"
        aria-label={`${code.toUpperCase()} flag`}
      />
    );
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[9px] font-bold uppercase text-primary">
      {code}
    </span>
  );
}

export function SiteLanguagesPanel({ data, onChange, onTranslated, readOnly }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pickCode, setPickCode] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  const defaultLocale = getDefaultLocaleCode(data);
  const enabled = getEnabledLocales(data);
  const addable = useMemo(() => getAddableLocales(data), [data]);
  const filteredAddable = useMemo(() => {
    const query = languageSearch.trim().toLocaleLowerCase();
    if (!query) return addable;
    return addable.filter((entry) =>
      `${entry.code} ${entry.label} ${entry.nativeName}`.toLocaleLowerCase().includes(query),
    );
  }, [addable, languageSearch]);
  const selectedLanguage = addable.find((entry) => entry.code === pickCode);
  const translatable = getTranslatableLocaleCodes(data);

  useEffect(() => {
    if (!pickerOpen) return;
    const closePicker = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", closePicker);
    return () => document.removeEventListener("pointerdown", closePicker);
  }, [pickerOpen]);

  const updatedAt = data.translationsUpdatedAt
    ? new Date(data.translationsUpdatedAt).toLocaleString()
    : null;

  const translateLocales = async (locales: string[], label: string) => {
    if (locales.length === 0) return;
    setBusy(label);
    setMessage("");
    setError("");

    try {
      let latestSite = data;

      for (let index = 0; index < locales.length; index += 1) {
        const locale = locales[index];
        setMessage(`Translating ${locale.toUpperCase()} (${index + 1}/${locales.length})…`);

        const res = await fetch("/api/admin/translate-site", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locales: [locale] }),
        });
        const body = (await res.json()) as {
          error?: string;
          translations?: SiteInfo["translations"];
          translationsUpdatedAt?: string;
        };

        if (!res.ok) {
          throw new Error(
            `${locale.toUpperCase()} failed after ${index} completed: ${body.error ?? "Translation failed"}`,
          );
        }

        latestSite = {
          ...latestSite,
          translations: body.translations,
          translationsUpdatedAt: body.translationsUpdatedAt,
        };
        await onTranslated(latestSite);
      }

      setMessage(`AI translations saved for ${locales.length} language(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setBusy(null);
    }
  };

  const handleAddLanguage = () => {
    if (!pickCode) return;
    onChange(addLocaleToSite(data, pickCode));
    setPickCode("");
    setLanguageSearch("");
    setPickerOpen(false);
    setMessage(`Added ${pickCode.toUpperCase()}. Save changes, then generate AI translation.`);
    setError("");
  };

  const handleRemove = (code: string) => {
    if (!window.confirm(`Remove ${code.toUpperCase()} from the site language switcher?`)) return;
    onChange(removeLocaleFromSite(data, code));
  };

  return (
    <AdminSection
      title="Languages"
      description="Add languages for the public switcher. English is the source — AI generates hero/about text for each added language."
    >
      <div className="space-y-3">
        {enabled.map((locale) => {
          const isDefault = locale.code === defaultLocale;
          const ready = Boolean(data.translations?.[locale.code]?.role);
          return (
            <div
              key={locale.code}
              className="admin-subcard flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <LanguageIcon flag={locale.flag} code={locale.code} />
                <div>
                  <p className="font-medium text-foreground">
                    {locale.nativeName}{" "}
                    <span className="text-xs text-muted-foreground">({locale.code})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{locale.label}</p>
                </div>
                {isDefault ? (
                  <AdminBadge tone="warning">Source</AdminBadge>
                ) : ready ? (
                  <AdminBadge tone="success">AI ready</AdminBadge>
                ) : (
                  <AdminBadge tone="muted">Needs AI</AdminBadge>
                )}
              </div>

              {!isDefault ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy) || readOnly}
                    className="admin-btn admin-btn-ghost text-xs"
                    onClick={() => void translateLocales([locale.code], locale.code)}
                  >
                    {busy === locale.code ? "Translating…" : "Generate AI"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy) || readOnly}
                    className="admin-btn admin-btn-danger text-xs"
                    onClick={() => handleRemove(locale.code)}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {updatedAt ? (
        <p className="mt-3 text-xs text-muted-foreground">Last AI run: {updatedAt}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div ref={pickerRef} className="admin-field relative min-w-[14rem] flex-1">
          <span className="admin-label">Add language</span>
          <button
            type="button"
            disabled={readOnly || addable.length === 0}
            className="admin-input flex min-h-10 items-center justify-between gap-3 text-start disabled:cursor-not-allowed"
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
            aria-haspopup="listbox"
          >
            <span className="flex min-w-0 items-center gap-2">
              {selectedLanguage ? (
                <LanguageIcon flag={selectedLanguage.flag} code={selectedLanguage.code} />
              ) : (
                <Languages className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              )}
              <span className="truncate">
                {selectedLanguage
                  ? `${selectedLanguage.label} — ${selectedLanguage.nativeName}`
                  : addable.length === 0
                    ? "All catalog languages added"
                    : "Select a language…"}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition ${pickerOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {pickerOpen ? (
            <div className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="sticky top-0 z-10 border-b border-border bg-card p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    value={languageSearch}
                    onChange={(event) => setLanguageSearch(event.target.value)}
                    placeholder="Search by language name or code…"
                    className="admin-input ps-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto overscroll-contain p-1" role="listbox">
                {filteredAddable.length ? (
                  filteredAddable.map((entry) => (
                    <button
                      key={entry.code}
                      type="button"
                      role="option"
                      aria-selected={entry.code === pickCode}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition hover:bg-primary/10"
                      onClick={() => {
                        setPickCode(entry.code);
                        setPickerOpen(false);
                        setLanguageSearch("");
                      }}
                    >
                      <LanguageIcon flag={entry.flag} code={entry.code} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {entry.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.nativeName} · {entry.code}
                        </span>
                      </span>
                      {entry.code === pickCode ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No matching language found.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!pickCode || readOnly}
          className="admin-btn admin-btn-primary"
          onClick={handleAddLanguage}
        >
          Add language
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy) || readOnly || translatable.length === 0}
          className="admin-btn admin-btn-primary"
          onClick={() => void translateLocales(translatable, "all")}
        >
          {busy === "all" ? "Translating all…" : "Generate AI for all enabled languages"}
        </button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        After adding a language, click <strong>Save changes</strong>, then generate AI. This
        translates <strong>all UI labels</strong> (nav, buttons, sections) and your portfolio
        content (hero, about, footer).
      </p>

      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer">
          Worldwide ISO language catalog ({LOCALE_CATALOG.length})
        </summary>
        <p className="mt-2">
          {LOCALE_CATALOG.map((entry) => entry.code).join(", ")}
        </p>
      </details>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
