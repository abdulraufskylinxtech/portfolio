"use client";

import { useState } from "react";

import { AdminButton, AdminField, AdminInput, AdminSection } from "../ui";

const MAX_PHOTOS = 3;
const FALLBACK = "/me.jpg";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  readOnly?: boolean;
};

function PhotoPreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const display = src.trim() || FALLBACK;

  return (
    <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={failed ? FALLBACK : display}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function AboutPhotosEditor({ images, onChange, readOnly }: Props) {
  const disabled = readOnly;
  const slots = images.length > 0 ? images.slice(0, MAX_PHOTOS) : [FALLBACK];

  const updateSlot = (index: number, value: string) => {
    const next = [...slots];
    next[index] = value;
    onChange(next.slice(0, MAX_PHOTOS));
  };

  const addSlot = () => {
    if (slots.length >= MAX_PHOTOS) return;
    onChange([...slots, ""]);
  };

  const removeSlot = (index: number) => {
    const next = slots.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [FALLBACK]);
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <AdminSection
      title="About photos"
      description={`Stack of up to ${MAX_PHOTOS} photos on the About section (left card). First photo is the main one.`}
    >
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Add image files to the <code className="admin-code">public/</code> folder in your project,
        then reference them here as paths like <code className="admin-code">/me.jpg</code> or{" "}
        <code className="admin-code">/about-office.jpg</code>. On Vercel, commit new images to
        GitHub and redeploy (or push via git).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((src, index) => (
          <div
            key={`photo-slot-${index}`}
            className="rounded-xl border border-border/80 bg-card/40 p-3"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Photo {index + 1}
              {index === 1 ? " · center (main)" : ""}
            </p>
            <PhotoPreview src={src} />
            <AdminField label="Image path" className="mt-3">
              <AdminInput
                value={src}
                onChange={(value) => updateSlot(index, value)}
                placeholder="/me.jpg"
                disabled={disabled}
              />
            </AdminField>
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
                  disabled={index === slots.length - 1}
                >
                  →
                </AdminButton>
                <AdminButton variant="danger" onClick={() => removeSlot(index)}>
                  Remove
                </AdminButton>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {!disabled && slots.length < MAX_PHOTOS ? (
        <div className="mt-4">
          <AdminButton variant="ghost" onClick={addSlot}>
            + Add photo ({slots.length}/{MAX_PHOTOS})
          </AdminButton>
        </div>
      ) : null}
    </AdminSection>
  );
}
