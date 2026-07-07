"use client";

import { useRef, useState } from "react";

import { AdminBadge, AdminButton, AdminSection } from "../ui";

type ProfileAssets = {
  profileImage?: string | null;
  profileModel?: string | null;
};

type Props = {
  profileImage?: string | null;
  profileModel?: string | null;
  readOnly?: boolean;
  onChange: (assets: ProfileAssets) => void;
};

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const hint = text.trim().slice(0, 80);
    throw new Error(
      hint
        ? `Server error (${res.status}): ${hint}`
        : `Upload failed (${res.status}). File may be too large.`,
    );
  }
}

export function ProfileImageEditor({
  profileImage,
  profileModel,
  readOnly,
  onChange,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  const image = profileImage?.trim() || "";
  const model = profileModel?.trim() || "";
  const disabled = readOnly || busy;

  const uploadImage = async (file: File) => {
    setBusy(true);
    setMessage("Uploading image…");
    setError("");
    setPreviewFailed(false);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/profile-image", { method: "POST", body });
      const data = await parseApiResponse<{ error?: string; profileImage?: string | null }>(res);

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange({ profileImage: data.profileImage ?? null, profileModel: model || null });
      setMessage("Profile image saved. Used on hero (when no 3D model) and navbar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setMessage("");
    } finally {
      setBusy(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const uploadModel = async (file: File) => {
    setBusy(true);
    setMessage("Uploading 3D model…");
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/profile-model", { method: "POST", body });
      const data = await parseApiResponse<{ error?: string; profileModel?: string | null }>(res);

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange({ profileImage: image || null, profileModel: data.profileModel ?? null });
      setMessage("3D model live on hero — visitors can drag to rotate.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setMessage("");
    } finally {
      setBusy(false);
      if (modelInputRef.current) modelInputRef.current.value = "";
    }
  };

  const removeImage = async () => {
    if (!window.confirm("Remove the profile image?")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/profile-image", { method: "DELETE" });
      const data = await parseApiResponse<{ error?: string; profileImage?: string | null }>(res);

      if (!res.ok) throw new Error(data.error ?? "Remove failed");

      onChange({ profileImage: null, profileModel: model || null });
      setPreviewFailed(false);
      setMessage("Profile image removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  const removeModel = async () => {
    if (!window.confirm("Remove the 3D model? Hero will show the photo instead.")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/profile-model", { method: "DELETE" });
      const data = await parseApiResponse<{ error?: string; profileModel?: string | null }>(res);

      if (!res.ok) throw new Error(data.error ?? "Remove failed");

      onChange({ profileImage: image || null, profileModel: null });
      setMessage("3D model removed. Hero shows photo again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSection
      title="Profile portrait"
      description="Option 1: photo for navbar + hero fallback. Option 2: .glb 3D model for interactive hero (replaces photo on home page)."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Option 1 — Image */}
        <div className="admin-subcard">
          <div className="admin-subcard-head">
            <div>
              <p className="font-medium text-foreground">Option 1 — Photo</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, GIF · navbar + hero fallback</p>
            </div>
            {image ? <AdminBadge tone="success">Live</AdminBadge> : null}
          </div>

          {image ? (
            <>
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]">
                {previewFailed ? (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt="Profile preview"
                    className="mx-auto h-40 w-full object-contain object-bottom"
                    onError={() => setPreviewFailed(true)}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={image} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-ghost text-xs">
                  View
                </a>
                <AdminButton variant="danger" onClick={() => void removeImage()} disabled={disabled}>
                  Remove
                </AdminButton>
              </div>
            </>
          ) : (
            <p className="admin-empty mt-3">No photo yet.</p>
          )}

          <label className="admin-field mt-4">
            <span className="admin-label">{image ? "Replace photo" : "Upload photo"}</span>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              disabled={disabled}
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            <span className="admin-hint">Max 5 MB</span>
          </label>
        </div>

        {/* Option 2 — 3D GLB */}
        <div className="admin-subcard">
          <div className="admin-subcard-head">
            <div>
              <p className="font-medium text-foreground">Option 2 — 3D model (.glb)</p>
              <p className="mt-1 text-xs text-muted-foreground">Meshy / Blender export · interactive hero</p>
            </div>
            {model ? <AdminBadge tone="success">3D Live</AdminBadge> : null}
          </div>

          {model ? (
            <>
              <p className="mt-3 break-all rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {model}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={model} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-ghost text-xs">
                  Download .glb
                </a>
                <AdminButton variant="danger" onClick={() => void removeModel()} disabled={disabled}>
                  Remove
                </AdminButton>
              </div>
            </>
          ) : (
            <p className="admin-empty mt-3">No 3D model yet. Hero shows photo only.</p>
          )}

          <label className="admin-field mt-4">
            <span className="admin-label">{model ? "Replace 3D model" : "Upload .glb model"}</span>
            <input
              ref={modelInputRef}
              type="file"
              accept=".glb,model/gltf-binary"
              disabled={disabled}
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadModel(file);
              }}
            />
            <span className="admin-hint">GLB only · max 20 MB · Blender: File → Export → glTF Binary</span>
          </label>
        </div>
      </div>

      {model ? (
        <p className="mt-4 text-xs text-muted-foreground">
          When a 3D model is uploaded, the home hero shows the interactive model instead of the photo. Navbar still uses the photo.
        </p>
      ) : null}

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
