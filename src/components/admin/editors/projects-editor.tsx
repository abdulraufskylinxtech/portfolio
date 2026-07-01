"use client";

import { useState } from "react";

import type { Project } from "@/lib/data";

import {
  AdminBadge,
  AdminButton,
  AdminCheckbox,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminSection,
  AdminTextarea,
  CommaListInput,
  LinesListInput,
} from "../ui";

type ProjectsFile = { projects: Project[] };

type Props = {
  data: ProjectsFile;
  onChange: (data: ProjectsFile) => void;
  readOnly?: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function newProject(): Project {
  const id = `project-${Date.now()}`;
  return {
    id,
    title: "New project",
    slug: id,
    description: "",
    tags: [],
    apis: [],
    highlights: [],
    live_link: null,
    github_link: null,
    images: [],
    published: false,
  };
}

export function ProjectsEditor({ data, onChange, readOnly }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const disabled = readOnly;
  const projects = data.projects ?? [];
  const selected = projects.find((p) => p.id === selectedId) ?? null;

  const updateProject = (id: string, patch: Partial<Project>) => {
    onChange({
      projects: projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  return (
    <div className="admin-editor-stack">
      <AdminSection
        title="Projects"
        description={`${projects.length} project(s)`}
        action={
          !disabled ? (
            <AdminButton
              variant="ghost"
              onClick={() => {
                const project = newProject();
                onChange({ projects: [project, ...projects] });
                setSelectedId(project.id);
              }}
            >
              + New project
            </AdminButton>
          ) : null
        }
      >
        {projects.length === 0 ? (
          <AdminEmptyState title="No projects yet" description="Add your first portfolio project." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-clickable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th className="w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className={selectedId === project.id ? "admin-row-active" : ""}
                    onClick={() => setSelectedId(project.id)}
                  >
                    <td className="font-medium text-foreground">{project.title}</td>
                    <td className="font-mono text-xs text-muted-foreground">{project.slug}</td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {project.tags.slice(0, 3).join(", ")}
                        {project.tags.length > 3 ? "…" : ""}
                      </span>
                    </td>
                    <td>
                      <AdminBadge tone={project.published ? "success" : "muted"}>
                        {project.published ? "Published" : "Draft"}
                      </AdminBadge>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!disabled ? (
                        <AdminButton
                          variant="danger"
                          onClick={() => {
                            onChange({
                              projects: projects.filter((p) => p.id !== project.id),
                            });
                            if (selectedId === project.id) setSelectedId(null);
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
                  const slug =
                    selected.slug.startsWith("project-") || selected.slug === slugify(selected.title)
                      ? slugify(title)
                      : selected.slug;
                  updateProject(selected.id, { title, slug });
                }}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Slug">
              <AdminInput
                value={selected.slug}
                onChange={(slug) => updateProject(selected.id, { slug: slugify(slug) })}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="ID" hint="Unique identifier">
              <AdminInput
                value={selected.id}
                onChange={(id) => updateProject(selected.id, { id })}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Published">
              <AdminCheckbox
                label="Visible on site"
                checked={selected.published}
                onChange={(published) => updateProject(selected.id, { published })}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Description" className="admin-span-full">
              <AdminTextarea
                value={selected.description}
                onChange={(description) => updateProject(selected.id, { description })}
                rows={3}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Tags" hint="Comma-separated" className="admin-span-full">
              <CommaListInput
                items={selected.tags}
                onChange={(tags) => updateProject(selected.id, { tags })}
                multiline={false}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="APIs / integrations" hint="Comma-separated" className="admin-span-full">
              <CommaListInput
                items={selected.apis}
                onChange={(apis) => updateProject(selected.id, { apis })}
                multiline={false}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Highlights" hint="One per line" className="admin-span-full">
              <LinesListInput
                items={selected.highlights}
                onChange={(highlights) => updateProject(selected.id, { highlights })}
                rows={4}
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Live URL">
              <AdminInput
                value={selected.live_link ?? ""}
                onChange={(live_link) =>
                  updateProject(selected.id, { live_link: live_link || null })
                }
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="GitHub URL">
              <AdminInput
                value={selected.github_link ?? ""}
                onChange={(github_link) =>
                  updateProject(selected.id, { github_link: github_link || null })
                }
                disabled={disabled}
              />
            </AdminField>
            <AdminField label="Images" hint="One URL or path per line" className="admin-span-full">
              <LinesListInput
                items={selected.images}
                onChange={(images) => updateProject(selected.id, { images })}
                rows={3}
                disabled={disabled}
              />
            </AdminField>
          </div>
        </AdminSection>
      ) : null}
    </div>
  );
}
