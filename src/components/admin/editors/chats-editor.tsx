"use client";

import { useState } from "react";

import type { ChatSession } from "@/lib/chat-sessions";

import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminSection,
  formatDate,
} from "../ui";

type ChatsFile = { sessions: ChatSession[] };

type Props = {
  data: ChatsFile;
  onChange: (data: ChatsFile) => void;
  readOnly?: boolean;
};

function shortenAgent(ua?: string): string {
  if (!ua) return "—";
  if (ua.length <= 48) return ua;
  return `${ua.slice(0, 45)}…`;
}

export function ChatsEditor({ data, onChange, readOnly }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const disabled = readOnly;
  const sessions = data.sessions ?? [];
  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const unread = sessions.filter((s) => !s.read).length;

  const updateSession = (id: string, patch: Partial<ChatSession>) => {
    onChange({
      sessions: sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const deleteSession = (id: string) => {
    if (!window.confirm("Delete this chat session?")) return;
    onChange({ sessions: sessions.filter((s) => s.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="admin-editor-stack">
      <AdminSection
        title="Chat sessions"
        description={
          unread > 0
            ? `${sessions.length} session(s) · ${unread} unread`
            : `${sessions.length} visitor chat session(s)`
        }
      >
        {sessions.length === 0 ? (
          <AdminEmptyState
            title="No chats yet"
            description="When visitors use the AI assistant, their conversations appear here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-clickable">
              <thead>
                <tr>
                  <th>Last active</th>
                  <th>Questions</th>
                  <th>Preview</th>
                  <th>Locale</th>
                  <th>Visitor</th>
                  <th>Status</th>
                  <th className="w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`${selectedId === session.id ? "admin-row-active" : ""} ${!session.read ? "admin-row-unread" : ""}`}
                    onClick={() => {
                      setSelectedId(session.id);
                      if (!session.read && !disabled) {
                        updateSession(session.id, { read: true });
                      }
                    }}
                  >
                    <td className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(session.updated_at)}
                    </td>
                    <td>{session.message_count}</td>
                    <td className="max-w-xs truncate text-sm text-foreground">
                      {session.preview || "—"}
                    </td>
                    <td className="text-xs uppercase text-muted-foreground">
                      {session.locale || "—"}
                    </td>
                    <td className="max-w-[10rem] truncate text-xs text-muted-foreground" title={session.user_agent}>
                      {shortenAgent(session.user_agent)}
                    </td>
                    <td>
                      {session.read ? (
                        <AdminBadge tone="muted">Read</AdminBadge>
                      ) : (
                        <AdminBadge tone="default">New</AdminBadge>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <AdminButton
                        type="button"
                        variant="danger"
                        disabled={disabled}
                        onClick={() => deleteSession(session.id)}
                      >
                        Delete
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {selected ? (
        <AdminSection
          title="Conversation"
          description={`Session ${selected.id.slice(0, 8)}… · started ${formatDate(selected.started_at)}`}
        >
          <div className="space-y-3 text-sm">
            {selected.page_url ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Page:</span> {selected.page_url}
              </p>
            ) : null}
            {selected.referrer ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Referrer:</span> {selected.referrer}
              </p>
            ) : null}
            {selected.user_agent ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Browser:</span> {selected.user_agent}
              </p>
            ) : null}
          </div>

          <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-4">
            {selected.messages.map((message, index) => (
              <div
                key={`${message.created_at}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-primary/20 text-foreground"
                      : "bg-card text-foreground"
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {message.role === "user" ? "Visitor" : "Assistant"} · {formatDate(message.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminSection>
      ) : null}
    </div>
  );
}
