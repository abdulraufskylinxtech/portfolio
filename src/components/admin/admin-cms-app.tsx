"use client";

import { useCallback, useEffect, useState } from "react";

import { BlogEditor } from "@/components/admin/editors/blog-editor";
import { ContactsEditor } from "@/components/admin/editors/contacts-editor";
import { CvEditor } from "@/components/admin/editors/cv-editor";
import { ProjectsEditor } from "@/components/admin/editors/projects-editor";
import { SiteEditor } from "@/components/admin/editors/site-editor";
import type { ContentKey } from "@/lib/content-store";
import type { BlogPost, Project, SiteInfo } from "@/lib/data";
import type { ContactSubmission } from "@/lib/contact-submissions";
import ThemeToggle from "@/components/ThemeToggle";

type AdminTabKey = ContentKey | "cv";

const NAV: { key: AdminTabKey; label: string; file: string; icon: string }[] = [
  { key: "site", label: "Site info", file: "data/site.json", icon: "◎" },
  { key: "cv", label: "Upload CV", file: "public/cv/resume.pdf", icon: "↓" },
  { key: "projects", label: "Projects", file: "data/projects.json", icon: "◫" },
  { key: "blog", label: "Blog", file: "data/blog-posts.json", icon: "✎" },
  { key: "contacts", label: "Inbox", file: "data/contact-submissions.json", icon: "✉" },
];

type StorageMode = "local" | "github" | "readonly";
type ViewMode = "visual" | "json";

type SessionState = {
  configured: boolean;
  authenticated: boolean;
  readOnlyHosting: boolean;
  storageMode: StorageMode;
};

function contentKeyForTab(tab: AdminTabKey): ContentKey {
  return tab === "cv" ? "site" : tab;
}

function normalizeAdminContent(key: ContentKey, raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  switch (key) {
    case "projects":
      return {
        projects: Array.isArray((raw as { projects?: unknown }).projects)
          ? (raw as { projects: Project[] }).projects
          : [],
      };
    case "blog":
      return {
        posts: Array.isArray((raw as { posts?: unknown }).posts)
          ? (raw as { posts: BlogPost[] }).posts
          : [],
      };
    case "contacts":
      return {
        submissions: Array.isArray((raw as { submissions?: unknown }).submissions)
          ? (raw as { submissions: ContactSubmission[] }).submissions
          : [],
      };
    default:
      return raw;
  }
}

export function AdminCmsApp() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeKey, setActiveKey] = useState<AdminTabKey>("site");
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [content, setContent] = useState<unknown>(null);
  const [loadedKey, setLoadedKey] = useState<AdminTabKey | null>(null);
  const [jsonEditor, setJsonEditor] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = (await res.json()) as SessionState;
    setSession(data);
    return data;
  }, []);

  const applyLoadedData = useCallback((key: AdminTabKey, data: unknown) => {
    const normalized = normalizeAdminContent(contentKeyForTab(key), data);
    setContent(normalized);
    setJsonEditor(JSON.stringify(normalized, null, 2));
    setLoadedKey(key);
    setDirty(false);
  }, []);

  const loadFile = useCallback(
    async (key: AdminTabKey) => {
      setBusy(true);
      setError("");
      setStatus("");
      setContent(null);
      setLoadedKey(null);
      setJsonEditor("");

      try {
        const res = await fetch(`/api/admin/content/${contentKeyForTab(key)}`);
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to load file");
        }
        const body = (await res.json()) as { data: unknown };
        applyLoadedData(key, body.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setBusy(false);
      }
    },
    [applyLoadedData],
  );

  useEffect(() => {
    void loadSession().then((data) => {
      if (data.authenticated) void loadFile("site");
    });
  }, [loadFile, loadSession]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setBusy(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Login failed");
      }

      setPassword("");
      const data = await loadSession();
      if (data.authenticated) await loadFile(activeKey);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession((prev) => (prev ? { ...prev, authenticated: false } : prev));
    setContent(null);
    setLoadedKey(null);
    setJsonEditor("");
  };

  const handleNavChange = (key: AdminTabKey) => {
    if (dirty && !window.confirm("You have unsaved changes. Switch anyway?")) return;
    setActiveKey(key);
    if (key === "cv" && loadedKey === "cv" && content !== null) return;
    if (key !== "cv" && key === loadedKey && content !== null) return;
    void loadFile(key);
  };

  const handleContentChange = (data: unknown) => {
    setContent(data);
    setJsonEditor(JSON.stringify(data, null, 2));
    setDirty(true);
  };

  const handleJsonChange = (text: string) => {
    setJsonEditor(text);
    setDirty(true);
  };

  const handleSwitchToJson = () => {
    if (content !== null) setJsonEditor(JSON.stringify(content, null, 2));
    setViewMode("json");
  };

  const handleSwitchToVisual = () => {
    try {
      const parsed = JSON.parse(jsonEditor) as unknown;
      setContent(parsed);
      setViewMode("visual");
      setError("");
    } catch {
      setError("Fix JSON syntax before switching to visual editor.");
    }
  };

  const getPayload = (): unknown | null => {
    if (viewMode === "json") {
      try {
        return JSON.parse(jsonEditor) as unknown;
      } catch {
        setError("Invalid JSON — check commas, quotes, and brackets.");
        return null;
      }
    }
    return content;
  };

  const handleSave = async () => {
    const parsed = getPayload();
    if (parsed === null) return;

    setBusy(true);
    setError("");
    setStatus("");

    try {
      const res = await fetch(`/api/admin/content/${contentKeyForTab(activeKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Save failed");

      applyLoadedData(activeKey, parsed);
      setStatus("Saved successfully. Refresh the public site to see changes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const renderVisualEditor = () => {
    if (content === null || loadedKey !== activeKey) {
      return <p className="text-muted-foreground">{busy ? "Loading…" : "No data loaded."}</p>;
    }

    const readOnly = session?.readOnlyHosting ?? false;

    switch (activeKey) {
      case "site":
        return (
          <SiteEditor
            data={content as SiteInfo}
            onChange={handleContentChange}
            readOnly={readOnly}
          />
        );
      case "cv":
        return (
          <CvEditor
            cv={(content as SiteInfo).cv}
            onChange={(cv) => handleContentChange({ ...(content as SiteInfo), cv: cv ?? undefined })}
            readOnly={readOnly}
          />
        );
      case "projects":
        return (
          <ProjectsEditor
            data={content as { projects: Project[] }}
            onChange={handleContentChange}
            readOnly={readOnly}
          />
        );
      case "blog":
        return (
          <BlogEditor
            data={content as { posts: BlogPost[] }}
            onChange={handleContentChange}
            readOnly={readOnly}
          />
        );
      case "contacts":
        return (
          <ContactsEditor
            data={content as { submissions: ContactSubmission[] }}
            onChange={handleContentChange}
            readOnly={readOnly}
          />
        );
      default:
        return null;
    }
  };

  if (!session) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading admin…</p>
      </div>
    );
  }

  if (!session.configured) {
    return (
      <div className="admin-shell admin-main-only">
        <h1 className="text-2xl font-semibold">Portfolio admin</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Set <code className="admin-code">ADMIN_PASSWORD</code> in your{" "}
          <code className="admin-code">.env</code> file, then restart the dev server.
        </p>
      </div>
    );
  }

  if (!session.authenticated) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center p-6">
        <form onSubmit={handleLogin} className="admin-login-card">
          <h1 className="text-xl font-semibold">Portfolio admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your portfolio content.</p>
          <label className="admin-field mt-6" htmlFor="password">
            <span className="admin-label">Password</span>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              autoComplete="current-password"
              required
            />
          </label>
          {loginError ? <p className="mt-3 text-sm text-red-400">{loginError}</p> : null}
          <button type="submit" disabled={busy} className="admin-btn admin-btn-primary mt-6 w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  const activeNav = NAV.find((item) => item.key === activeKey)!;

  return (
    <div className="admin-shell admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-brand-dot" />
          <div>
            <p className="font-semibold text-foreground">Portfolio CMS</p>
            <p className="text-xs text-muted-foreground">JSON-backed</p>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavChange(item.key)}
              className={`admin-nav-item ${item.key === activeKey ? "admin-nav-item-active" : ""}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <a href="/" className="admin-nav-item">
            View live site →
          </a>
          <button type="button" onClick={handleLogout} className="admin-nav-item text-muted-foreground">
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1 className="text-xl font-semibold">{activeNav.label}</h1>
            <p className="text-xs text-muted-foreground">
              <code className="admin-code">{activeNav.file}</code>
              {dirty ? <span className="ml-2 text-accent">· Unsaved changes</span> : null}
            </p>
          </div>
          <div className="admin-topbar-actions">
            <ThemeToggle />
            <div className="admin-view-toggle">
              {activeKey !== "cv" ? (
                <>
                  <button
                    type="button"
                    className={viewMode === "visual" ? "active" : ""}
                    onClick={() => (viewMode === "json" ? handleSwitchToVisual() : setViewMode("visual"))}
                  >
                    Visual
                  </button>
                  <button
                    type="button"
                    className={viewMode === "json" ? "active" : ""}
                    onClick={handleSwitchToJson}
                  >
                    JSON
                  </button>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || session.readOnlyHosting}
              className="admin-btn admin-btn-primary"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </header>

        {session.storageMode === "github" ? (
          <div className="admin-banner admin-banner-success">
            GitHub storage active — saves commit to your repo on serverless hosting.
          </div>
        ) : null}

        {session.storageMode === "readonly" ? (
          <div className="admin-banner admin-banner-warn">
            Read-only hosting. Add GitHub env vars to enable saving on Vercel.
          </div>
        ) : null}

        <div className="admin-content">
          {viewMode === "visual" ? (
            renderVisualEditor()
          ) : loadedKey === activeKey ? (
            <textarea
              className="admin-json-editor"
              value={jsonEditor}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
              aria-label="JSON editor"
            />
          ) : (
            <p className="text-muted-foreground">{busy ? "Loading…" : "No data loaded."}</p>
          )}
        </div>

        {status ? <p className="admin-toast admin-toast-success">{status}</p> : null}
        {error ? <p className="admin-toast admin-toast-error">{error}</p> : null}
      </div>
    </div>
  );
}
