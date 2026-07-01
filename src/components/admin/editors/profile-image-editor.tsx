"use client";

import { useRef, useState } from "react";

import { AdminBadge, AdminField, AdminInput, AdminSection } from "../ui";

const FALLBACK = "/me.jpg";

type Props = {
  image: string;
  depthMap?: string;
  onImageChange: (value: string) => void;
  onDepthMapChange: (value: string) => void;
  readOnly?: boolean;
};

function ProfilePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const display = src.trim() || FALLBACK;

  return (
    <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-2xl border-2 border-primary/40 bg-card shadow-lg">
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

export function ProfileImageEditor({
  image,
  depthMap = "",
  onImageChange,
  onDepthMapChange,
  readOnly,
}: Props) {
  const disabled = readOnly;
  const profileInputRef = useRef<HTMLInputElement>(null);
  const depthInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"profile" | "depth" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const upload = async (file: File, kind: "profile" | "depth") => {
    setBusy(kind);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);

      const res = await fetch("/api/admin/profile-image", { method: "POST", body });
      const data = (await res.json()) as {
        error?: string;
        profileImage?: string;
        profileDepthMap?: string;
      };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      if (data.profileImage) onImageChange(data.profileImage);
      if (data.profileDepthMap !== undefined) onDepthMapChange(data.profileDepthMap);

      setMessage(
        kind === "profile"
          ? "Profile photo uploaded. Hero and navbar updated."
          : "Depth map uploaded for stronger 3D effect.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
      if (kind === "profile" && profileInputRef.current) profileInputRef.current.value = "";
      if (kind === "depth" && depthInputRef.current) depthInputRef.current.value = "";
    }
  };

  return (
    <AdminSection
      title="Profile photo"
      description="Upload your portrait for the hero 3D card and navbar avatar."
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
        <ProfilePreview src={image} />
        <div className="min-w-[min(100%,20rem)] flex-1 space-y-4">
          {image ? (
            <div className="flex items-center gap-2">
              <AdminBadge tone="success">Live</AdminBadge>
              <span className="text-xs text-muted-foreground">{image}</span>
            </div>
          ) : null}

          <label className="admin-field">
            <span className="admin-label">
              {image ? "Replace profile photo" : "Upload profile photo"}
            </span>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={disabled || busy !== null}
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, "profile");
              }}
            />
            <span className="admin-hint">JPG, PNG, or WebP · max 3 MB · saved to public/profile/</span>
          </label>

          <AdminField label="Or set image path manually">
            <AdminInput
              value={image}
              onChange={onImageChange}
              placeholder="/profile/avatar.jpg"
              disabled={disabled}
            />
          </AdminField>

          <label className="admin-field">
            <span className="admin-label">Upload AI depth map (optional)</span>
            <input
              ref={depthInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={disabled || busy !== null}
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, "depth");
              }}
            />
            <span className="admin-hint">
              Optional grayscale depth from{" "}
              <a
                href="https://www.immersity.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Immersity AI
              </a>
            </span>
          </label>

          <AdminField
            label="Depth map path (optional)"
            hint="Auto-filled after upload, or set manually."
          >
            <AdminInput
              value={depthMap}
              onChange={onDepthMapChange}
              placeholder="/profile/depth.png"
              disabled={disabled}
            />
          </AdminField>
        </div>
      </div>

      {busy ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Uploading {busy === "profile" ? "profile photo" : "depth map"}…
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
