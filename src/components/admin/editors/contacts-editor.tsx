"use client";

import { useState } from "react";

import type { ContactSubmission } from "@/lib/contact-submissions";

import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminSection,
  formatDate,
} from "../ui";

type ContactsFile = { submissions: ContactSubmission[] };

type Props = {
  data: ContactsFile;
  onChange: (data: ContactsFile) => void;
  readOnly?: boolean;
};

export function ContactsEditor({ data, onChange, readOnly }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const disabled = readOnly;
  const submissions = data.submissions ?? [];
  const selected = submissions.find((s) => s.id === selectedId) ?? null;
  const unread = submissions.filter((s) => !s.read).length;

  const updateSubmission = (id: string, patch: Partial<ContactSubmission>) => {
    onChange({
      submissions: submissions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  return (
    <div className="admin-editor-stack">
      <AdminSection
        title="Contact inbox"
        description={
          unread > 0
            ? `${submissions.length} message(s) · ${unread} unread`
            : `${submissions.length} message(s)`
        }
      >
        {submissions.length === 0 ? (
          <AdminEmptyState
            title="No messages yet"
            description="Submissions from the contact form appear here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-clickable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Email sent</th>
                  <th>Status</th>
                  <th className="w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className={`${selectedId === sub.id ? "admin-row-active" : ""} ${!sub.read ? "admin-row-unread" : ""}`}
                    onClick={() => {
                      setSelectedId(sub.id);
                      if (!sub.read && !disabled) {
                        updateSubmission(sub.id, { read: true });
                      }
                    }}
                  >
                    <td className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="font-medium text-foreground">{sub.name}</td>
                    <td>
                      <a
                        href={`mailto:${sub.email}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sub.email}
                      </a>
                    </td>
                    <td>
                      <AdminBadge tone={sub.email_sent ? "success" : "warning"}>
                        {sub.email_sent ? "Sent" : "Not sent"}
                      </AdminBadge>
                    </td>
                    <td>
                      <AdminBadge tone={sub.read ? "muted" : "default"}>
                        {sub.read ? "Read" : "New"}
                      </AdminBadge>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!disabled ? (
                        <div className="flex gap-1">
                          <AdminButton
                            variant="ghost"
                            onClick={() => updateSubmission(sub.id, { read: !sub.read })}
                          >
                            {sub.read ? "Unread" : "Read"}
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() => {
                              onChange({
                                submissions: submissions.filter((s) => s.id !== sub.id),
                              });
                              if (selectedId === sub.id) setSelectedId(null);
                            }}
                          >
                            Delete
                          </AdminButton>
                        </div>
                      ) : null}
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
          title={`Message from ${selected.name}`}
          action={
            <AdminButton variant="ghost" onClick={() => setSelectedId(null)}>
              Close
            </AdminButton>
          }
        >
          <dl className="admin-detail-list">
            <div>
              <dt>From</dt>
              <dd>
                {selected.name} ·{" "}
                <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                  {selected.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{formatDate(selected.created_at)}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd className="admin-message-body">{selected.message}</dd>
            </div>
          </dl>
        </AdminSection>
      ) : null}
    </div>
  );
}
