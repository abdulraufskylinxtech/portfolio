"use client";

import { useRef, useState } from "react";

import { AdminBadge, AdminButton, AdminSection } from "../ui";
import { cutOutProfileImage } from "@/lib/profile-image-cutout";

type Props = {
  profileImage?: string | null;
  readOnly?: boolean;
  onChange: (profileImage: string | null) => void;
};

export function ProfileImageEditor({ profileImage, readOnly, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  const image = profileImage?.trim() || "";
  const disabled = readOnly || busy;

  const upload = async (file: File) => {
    setBusy(true);
    setMessage("");
    setError("");
    setPreviewFailed(false);

    try {
      setMessage("Removing background with AI…");
      let prepared = file;
      try {
        prepared = await cutOutProfileImage(file);
      } catch {
        prepared = file;
        setMessage("AI cutout skipped — uploading original image…");
      }

      const body = new FormData();
      body.append("file", prepared);

      const res = await fetch("/api/admin/profile-image", { method: "POST", body });
      const data = (await res.json()) as { error?: string; profileImage?: string | null };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange(data.profileImage ?? null);
      setMessage(
        prepared !== file
          ? "AI cutout saved — drag the hero portrait to rotate it."
          : "Profile image uploaded and saved.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove the profile image from the site?")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/profile-image", { method: "DELETE" });
      const data = (await res.json()) as { error?: string; profileImage?: string | null };

      if (!res.ok) throw new Error(data.error ?? "Remove failed");

      onChange(data.profileImage ?? null);
      setPreviewFailed(false);
      setMessage("Profile image removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSection
      title="Profile image"
      description="Hero portrait with AI background removal. Re-upload to refresh the 3D cutout."
    >
      {image ? (
        <div className="admin-subcard">
          <div className="admin-subcard-head">
            <div>
              <p className="font-medium text-foreground">Current profile image</p>
              <p className="mt-1 text-xs text-muted-foreground">Shown on the home hero and navbar</p>
            </div>
            <AdminBadge tone="success">Live</AdminBadge>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]">
            {previewFailed ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Preview unavailable
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Profile preview"
                className="mx-auto h-52 w-full max-w-xs object-contain object-bottom"
                onError={() => setPreviewFailed(true)}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-ghost text-xs"
            >
              View full size
            </a>
            <AdminButton variant="danger" onClick={() => void remove()} disabled={disabled}>
              Remove image
            </AdminButton>
          </div>
        </div>
      ) : (
        <p className="admin-empty">No profile image yet. Upload one below.</p>
      )}

      <div className="mt-4">
        <label className="admin-field">
          <span className="admin-label">
            {image ? "Replace profile image" : "Upload profile image"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            disabled={disabled}
            className="admin-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <span className="admin-hint">
            JPG, PNG, WebP, or GIF · max 5 MB · AI removes the background automatically
          </span>
        </label>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
