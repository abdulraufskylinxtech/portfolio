"use client";

import { useRef, useState } from "react";

import { AdminButton, AdminSection } from "../ui";
import { MAX_ABOUT_PHOTOS } from "@/lib/about-images";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  readOnly?: boolean;
};

function PhotoPreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (!src.trim() || failed) {
    return (
      <div className="flex h-36 w-full items-center justify-center rounded-lg border border-dashed border-border bg-card/60 text-xs text-muted-foreground">
        Preview unavailable
      </div>
    );
  }

  return (
    <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function AboutPhotosEditor({ images, onChange, readOnly }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const disabled = readOnly || busy;
  const photos = images.map((src) => src.trim()).filter(Boolean).slice(0, MAX_ABOUT_PHOTOS);

  const upload = async (file: File) => {
    if (photos.length >= MAX_ABOUT_PHOTOS) {
      setError(`You can only add up to ${MAX_ABOUT_PHOTOS} photos.`);
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/about-images", { method: "POST", body });
      const data = (await res.json()) as { error?: string; aboutImages?: string[] };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange(data.aboutImages ?? []);
      setMessage("Photo uploaded and saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (url: string) => {
    if (!window.confirm("Remove this photo from the About section?")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/about-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { error?: string; aboutImages?: string[] };

      if (!res.ok) throw new Error(data.error ?? "Remove failed");

      onChange(data.aboutImages ?? []);
      setMessage("Photo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setMessage("Order updated. Click Save changes to keep the new order.");
    setError("");
  };

  const openFilePicker = () => {
    if (disabled || photos.length >= MAX_ABOUT_PHOTOS) return;
    inputRef.current?.click();
  };

  return (
    <AdminSection
      title="About photos"
      description={`Upload up to ${MAX_ABOUT_PHOTOS} photos for the About section stack. First photo is the main one.`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {photos.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">No photos yet. Add one below.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((src, index) => (
            <div
              key={src}
              className="rounded-xl border border-border/80 bg-card/40 p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Photo {index + 1}
                {photos.length > 1 && index === 1 ? " · center (main)" : ""}
              </p>
              <PhotoPreview src={src} />
              {!disabled ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  <AdminButton
                    variant="ghost"
                    onClick={() => moveSlot(index, -1)}
                    disabled={index === 0}
                  >
                    ←
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    onClick={() => moveSlot(index, 1)}
                    disabled={index === photos.length - 1}
                  >
                    →
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => void remove(src)}>
                    Remove
                  </AdminButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!readOnly && photos.length < MAX_ABOUT_PHOTOS ? (
        <div className="mt-4">
          <AdminButton variant="ghost" onClick={openFilePicker} disabled={disabled}>
            {busy ? "Uploading…" : `+ Add photo (${photos.length}/${MAX_ABOUT_PHOTOS})`}
          </AdminButton>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG, WebP, or GIF · max 5 MB each
          </p>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
