"use client";

import { useState } from "react";

import type { BlogPost } from "@/lib/data";

import {
  AdminBadge,
  AdminButton,
  AdminCheckbox,
  AdminDateTimePicker,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminSection,
  AdminSelect,
  AdminTextarea,
  CommaListInput,
  formatDate,
} from "../ui";

type BlogFile = { posts: BlogPost[] };

type Props = {
  data: BlogFile;
  onChange: (data: BlogFile) => void;
  readOnly?: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function newPost(): BlogPost {
  const id = String(Date.now());
  return {
    id,
    title: "New post",
    slug: `post-${id}`,
    excerpt: "",
    content: "",
    tags: [],
    post_type: "general",
    featured_image_url: null,
    published: false,
    created_at: new Date().toISOString(),
  };
}

export function BlogEditor({ data, onChange, readOnly }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const disabled = readOnly;
  const posts = data.posts ?? [];
  const selected = posts.find((p) => p.id === selectedId) ?? null;

  const updatePost = (id: string, patch: Partial<BlogPost>) => {
    onChange({
      posts: posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  return (
    <div className="admin-editor-stack">
      <AdminSection
        title="Blog posts"
        description={`${posts.length} post(s)`}
        action={
          !disabled ? (
            <AdminButton
              variant="ghost"
              onClick={() => {
                const post = newPost();
                onChange({ posts: [post, ...posts] });
                setSelectedId(post.id);
              }}
            >
              + New post
            </AdminButton>
          ) : null
        }
      >
        {posts.length === 0 ? (
          <AdminEmptyState title="No blog posts" description="Create your first article." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-clickable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Published</th>
                  <th>Date</th>
                  <th className="w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className={selectedId === post.id ? "admin-row-active" : ""}
                    onClick={() => setSelectedId(post.id)}
                  >
                    <td className="font-medium text-foreground">{post.title}</td>
                    <td>
                      <AdminBadge>{post.post_type}</AdminBadge>
                    </td>
                    <td>
                      <AdminBadge tone={post.published ? "success" : "muted"}>
                        {post.published ? "Yes" : "Draft"}
                      </AdminBadge>
                    </td>
                    <td className="text-xs text-muted-foreground">{formatDate(post.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!disabled ? (
                        <AdminButton
                          variant="danger"
                          onClick={() => {
                            onChange({ posts: posts.filter((p) => p.id !== post.id) });
                            if (selectedId === post.id) setSelectedId(null);
                          }}
                        >
                          Delete
                        </AdminButton>
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
          title={`Edit: ${selected.title}`}
          action={
            <AdminButton variant="ghost" onClick={() => setSelectedId(null)}>
              Close
            </AdminButton>
          }
        >
          <div className="admin-form-grid">
            <AdminField label="Title">
              <AdminInput
                value={selected.title}
                onChange={(title) => {
                  const slug = selected.slug.startsWith("post-")
                    ? slugify(title)
                    : selected.slug;
                  updatePost(selected.id, { title, slug });
                }}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Slug">
              <AdminInput
                value={selected.slug}
                onChange={(slug) => updatePost(selected.id, { slug: slugify(slug) })}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Post type">
              <AdminSelect
                value={selected.post_type}
                onChange={(post_type) => updatePost(selected.id, { post_type })}
                options={[
                  { value: "general", label: "General" },
                  { value: "tutorial", label: "Tutorial" },
                  { value: "news", label: "News" },
                ]}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Created at">
              <AdminDateTimePicker
                value={selected.created_at.slice(0, 16)}
                onChange={(v) =>
                  updatePost(selected.id, {
                    created_at: v ? new Date(v).toISOString() : selected.created_at,
                  })
                }
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Published">
              <AdminCheckbox
                label="Visible on site"
                checked={selected.published}
                onChange={(published) => updatePost(selected.id, { published })}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Featured image URL" className="admin-span-full">
              <AdminInput
                value={selected.featured_image_url ?? ""}
                onChange={(featured_image_url) =>
                  updatePost(selected.id, {
                    featured_image_url: featured_image_url || null,
                  })
                }
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Excerpt" className="admin-span-full">
              <AdminTextarea
                value={selected.excerpt}
                onChange={(excerpt) => updatePost(selected.id, { excerpt })}
                rows={2}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Tags" hint="Comma-separated" className="admin-span-full">
              <CommaListInput
                items={selected.tags}
                onChange={(tags) => updatePost(selected.id, { tags })}
                multiline={false}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Content (Markdown)" className="admin-span-full">
              <AdminTextarea
                value={selected.content}
                onChange={(content) => updatePost(selected.id, { content })}
                rows={14}
                mono
                disabled={disabled}
              />
            </AdminField>
          </div>
        </AdminSection>
      ) : null}
    </div>
  );
}
