"use client";

import { AboutPhotosEditor } from "@/components/admin/editors/about-photos-editor";
import { ProfileImageEditor } from "@/components/admin/editors/profile-image-editor";
import { SiteLanguagesPanel } from "@/components/admin/editors/site-languages-panel";
import type { EducationEntry, ExperienceEntry, SiteInfo, SiteStat } from "@/lib/data";

import {
  AdminBadge,
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminSection,
  AdminTextarea,
  CommaListInput,
  LinesListInput,
} from "../ui";

type Props = {
  data: SiteInfo;
  onChange: (data: SiteInfo) => void;
  onTranslationsSaved?: () => void | Promise<void>;
  readOnly?: boolean;
};

function updateSkills(
  data: SiteInfo,
  group: keyof SiteInfo["skills"],
  items: string[],
): SiteInfo {
  return {
    ...data,
    skills: { ...data.skills, [group]: items },
  };
}

type SiteSkills = SiteInfo["skills"];

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatExperienceMonth(value?: string): string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return "";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function experiencePeriod(startDate?: string, endDate?: string, current?: boolean): string {
  const start = formatExperienceMonth(startDate);
  if (!start) return "";
  const end = current ? "Present" : formatExperienceMonth(endDate);
  return end ? `${start} — ${end}` : start;
}

function experienceDuration(startDate?: string, endDate?: string, current?: boolean): string {
  if (!startDate) return "Select a start month";
  const resolvedEnd = current ? currentMonthValue() : endDate;
  if (!resolvedEnd) return "Select an end month";

  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = resolvedEnd.split("-").map(Number);
  const months = (endYear - startYear) * 12 + endMonth - startMonth + 1;
  if (months <= 0) return "End month must be after the start month";

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return [
    years ? `${years} ${years === 1 ? "year" : "years"}` : "",
    remainingMonths
      ? `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function updateStat(data: SiteInfo, index: number, patch: Partial<SiteStat>): SiteInfo {
  const stats = [...data.stats];
  stats[index] = { ...stats[index], ...patch };
  return { ...data, stats };
}

function updateExperience(
  data: SiteInfo,
  index: number,
  patch: Partial<ExperienceEntry>,
): SiteInfo {
  const experience = [...data.experience];
  experience[index] = { ...experience[index], ...patch };
  return { ...data, experience };
}

function updateEducation(
  data: SiteInfo,
  index: number,
  patch: Partial<EducationEntry>,
): SiteInfo {
  const education = [...data.education];
  education[index] = { ...education[index], ...patch };
  return { ...data, education };
}

export function SiteEditor({ data, onChange, onTranslationsSaved, readOnly }: Props) {
  const disabled = readOnly;

  return (
    <div className="admin-editor-stack">
      <AdminSection title="Profile & contact" description="Hero, footer, and contact details">
        <div className="admin-form-grid">
          <AdminField
            label="Full name"
            hint="Used in all languages unless you enable a separate Arabic name below"
          >
            <AdminInput
              value={data.name ?? ""}
              onChange={(name) => onChange({ ...data, name })}
              placeholder="Abdul Rauf"
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Arabic name" className="admin-span-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={data.useArabicDisplayName ?? false}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...data,
                    useArabicDisplayName: e.target.checked,
                    ...(e.target.checked && !data.nameAr?.trim() ? { nameAr: data.name } : {}),
                  })
                }
              />
              Use a different name when the site is in Arabic
            </label>
            {data.useArabicDisplayName ? (
              <div className="mt-3">
                <AdminInput
                  value={data.nameAr ?? ""}
                  onChange={(nameAr) => onChange({ ...data, nameAr })}
                  placeholder="عبدالرؤف"
                  disabled={disabled}
                />
              </div>
            ) : (
              <span className="admin-hint mt-2 block">
                The full name above is shown in English, Arabic, and German.
              </span>
            )}
          </AdminField>
          <AdminField label="Email">
            <AdminInput
              value={data.email}
              onChange={(email) => onChange({ ...data, email })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Phone">
            <AdminInput
              value={data.phone ?? ""}
              onChange={(phone) => onChange({ ...data, phone })}
              placeholder="+923001234567"
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="WhatsApp" hint="Used for WhatsApp button — can match phone">
            <AdminInput
              value={data.whatsapp ?? ""}
              onChange={(whatsapp) => onChange({ ...data, whatsapp })}
              placeholder="+923001234567"
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="LinkedIn">
            <AdminInput
              value={data.linkedin}
              onChange={(linkedin) => onChange({ ...data, linkedin })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="GitHub">
            <AdminInput
              value={data.github}
              onChange={(github) => onChange({ ...data, github })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Instagram">
            <AdminInput
              value={data.instagram ?? ""}
              onChange={(instagram) => onChange({ ...data, instagram })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Location">
            <AdminInput
              value={data.location}
              onChange={(location) => onChange({ ...data, location })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Role / headline" className="admin-span-2">
            <AdminInput
              value={data.role}
              onChange={(role) => onChange({ ...data, role })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField
            label="Hero rotating titles"
            hint="Comma-separated — typewriter animation under your name"
            className="admin-span-2"
          >
            <CommaListInput
              items={data.heroRoles ?? []}
              onChange={(heroRoles) => onChange({ ...data, heroRoles })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Availability" className="admin-span-2">
            <AdminInput
              value={data.availability}
              onChange={(availability) => onChange({ ...data, availability })}
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Bio" className="admin-span-full">
            <AdminTextarea
              value={data.bio}
              onChange={(bio) => onChange({ ...data, bio })}
              rows={3}
              disabled={disabled}
            />
          </AdminField>
        </div>
      </AdminSection>

      <ProfileImageEditor
        profileImage={data.profileImage}
        profileModel={data.profileModel}
        onChange={({ profileImage, profileModel }) => {
          const next = { ...data };
          if (profileImage) next.profileImage = profileImage;
          else delete next.profileImage;
          if (profileModel) next.profileModel = profileModel;
          else delete next.profileModel;
          onChange(next);
        }}
        readOnly={disabled}
      />

      <SiteLanguagesPanel
        data={data}
        onChange={onChange}
        onTranslated={async (site) => {
          onChange(site);
          await onTranslationsSaved?.();
        }}
        readOnly={disabled}
      />

      <AboutPhotosEditor
        images={data.aboutImages}
        onChange={(aboutImages) => onChange({ ...data, aboutImages })}
        readOnly={disabled}
      />

      <AdminSection title="Map" description="Optional location pin on contact section">
        <div className="admin-form-grid">
          <AdminField label="Latitude">
            <AdminInput
              type="number"
              value={String(data.map?.latitude ?? "")}
              onChange={(v) =>
                onChange({
                  ...data,
                  map: {
                    latitude: Number(v) || 0,
                    longitude: data.map?.longitude ?? 0,
                    zoom: data.map?.zoom,
                    label: data.map?.label,
                  },
                })
              }
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Longitude">
            <AdminInput
              type="number"
              value={String(data.map?.longitude ?? "")}
              onChange={(v) =>
                onChange({
                  ...data,
                  map: {
                    latitude: data.map?.latitude ?? 0,
                    longitude: Number(v) || 0,
                    zoom: data.map?.zoom,
                    label: data.map?.label,
                  },
                })
              }
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Zoom">
            <AdminInput
              type="number"
              value={String(data.map?.zoom ?? 14)}
              onChange={(v) =>
                onChange({
                  ...data,
                  map: {
                    latitude: data.map?.latitude ?? 0,
                    longitude: data.map?.longitude ?? 0,
                    zoom: Number(v) || 14,
                    label: data.map?.label,
                  },
                })
              }
              disabled={disabled}
            />
          </AdminField>
          <AdminField label="Map label">
            <AdminInput
              value={data.map?.label ?? ""}
              onChange={(label) =>
                onChange({
                  ...data,
                  map: {
                    latitude: data.map?.latitude ?? 0,
                    longitude: data.map?.longitude ?? 0,
                    zoom: data.map?.zoom ?? 14,
                    label,
                  },
                })
              }
              disabled={disabled}
            />
          </AdminField>
        </div>
      </AdminSection>

      <AdminSection
        title="Stats"
        action={
          !disabled ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-xs"
              onClick={() =>
                onChange({
                  ...data,
                  stats: [...data.stats, { value: "0", label: "New stat" }],
                })
              }
            >
              + Add stat
            </button>
          ) : null
        }
      >
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>Label</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {data.stats.map((stat, i) => (
                <tr key={i}>
                  <td>
                    <AdminInput
                      value={stat.value}
                      onChange={(value) => onChange(updateStat(data, i, { value }))}
                      disabled={disabled}
                    />
                  </td>
                  <td>
                    <AdminInput
                      value={stat.label}
                      onChange={(label) => onChange(updateStat(data, i, { label }))}
                      disabled={disabled}
                    />
                  </td>
                  <td>
                    {!disabled ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-ghost admin-btn-danger text-xs px-2 py-1"
                        onClick={() =>
                          onChange({
                            ...data,
                            stats: data.stats.filter((_, idx) => idx !== i),
                          })
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <AdminSection title="Skills" description="Comma-separated — type freely, saves when you click away">
        <div className="admin-form-grid admin-form-grid-2">
          {(Object.keys(data.skills) as (keyof SiteSkills)[]).map((group) => (
            <AdminField key={group} label={group.toUpperCase()}>
              <CommaListInput
                items={data.skills[group]}
                onChange={(items) => onChange(updateSkills(data, group, items))}
                rows={4}
                disabled={disabled}
              />
            </AdminField>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Experience"
        action={
          !disabled ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-xs"
              onClick={() =>
                onChange({
                  ...data,
                  experience: [
                    ...data.experience,
                    {
                      role: "Role",
                      company: "Company",
                      period: `${formatExperienceMonth(currentMonthValue())} — Present`,
                      startDate: currentMonthValue(),
                      endDate: "",
                      current: true,
                      location: "Remote",
                      bullets: ["Achievement"],
                      tech: ["Tech"],
                      published: true,
                    },
                  ],
                })
              }
            >
              + Add role
            </button>
          ) : null
        }
      >
        <div className="admin-stack">
          {data.experience.map((exp, i) => (
            <div key={i} className="admin-subcard">
              <div className="admin-subcard-head">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {exp.role || "Untitled role"} · {exp.company || "Company"}
                  </span>
                  <AdminBadge tone={exp.published !== false ? "success" : "muted"}>
                    {exp.published !== false ? "Visible" : "Hidden"}
                  </AdminBadge>
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger text-xs px-2 py-1"
                    onClick={() =>
                      onChange({
                        ...data,
                        experience: data.experience.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="admin-form-grid admin-form-grid-2 mt-3">
                <AdminField label="Role">
                  <AdminInput
                    value={exp.role}
                    onChange={(role) => onChange(updateExperience(data, i, { role }))}
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField label="Company">
                  <AdminInput
                    value={exp.company}
                    onChange={(company) => onChange(updateExperience(data, i, { company }))}
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField label="Start month">
                  <AdminInput
                    type="month"
                    value={exp.startDate ?? ""}
                    onChange={(startDate) =>
                      onChange(
                        updateExperience(data, i, {
                          startDate,
                          period: experiencePeriod(startDate, exp.endDate, exp.current) || exp.period,
                        }),
                      )
                    }
                    max={currentMonthValue()}
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField label="End month">
                  <AdminInput
                    type="month"
                    value={exp.endDate ?? ""}
                    onChange={(endDate) =>
                      onChange(
                        updateExperience(data, i, {
                          endDate,
                          period: experiencePeriod(exp.startDate, endDate, false) || exp.period,
                        }),
                      )
                    }
                    min={exp.startDate}
                    max={currentMonthValue()}
                    disabled={disabled || exp.current === true}
                  />
                </AdminField>
                <AdminField label="Current position">
                  <AdminCheckbox
                    label="I currently work here"
                    checked={exp.current === true}
                    onChange={(current) =>
                      onChange(
                        updateExperience(data, i, {
                          current,
                          endDate: current ? "" : exp.endDate,
                          period:
                            experiencePeriod(exp.startDate, exp.endDate, current) || exp.period,
                        }),
                      )
                    }
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField
                  label="Period shown on site"
                  hint={exp.startDate ? "Automatically generated from the selected months" : "Select a start month to replace this legacy period"}
                >
                  <div className="admin-input flex min-h-10 items-center">
                    {experiencePeriod(exp.startDate, exp.endDate, exp.current) || exp.period}
                  </div>
                </AdminField>
                <AdminField label="Calculated duration">
                  <div className="admin-input flex min-h-10 items-center font-medium text-primary">
                    {experienceDuration(exp.startDate, exp.endDate, exp.current)}
                  </div>
                </AdminField>
                <AdminField label="Location">
                  <AdminInput
                    value={exp.location}
                    onChange={(location) => onChange(updateExperience(data, i, { location }))}
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField label="Visibility">
                  <AdminCheckbox
                    label="Show on site"
                    checked={exp.published !== false}
                    onChange={(published) => onChange(updateExperience(data, i, { published }))}
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField label="Bullets" hint="One per line — saves when you click away" className="admin-span-full">
                  <LinesListInput
                    items={exp.bullets}
                    onChange={(bullets) => onChange(updateExperience(data, i, { bullets }))}
                    rows={4}
                    disabled={disabled}
                  />
                </AdminField>
                <AdminField label="Tech stack" hint="Comma-separated" className="admin-span-full">
                  <CommaListInput
                    items={exp.tech}
                    onChange={(tech) => onChange(updateExperience(data, i, { tech }))}
                    multiline={false}
                    disabled={disabled}
                  />
                </AdminField>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Education"
        action={
          !disabled ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-xs"
              onClick={() =>
                onChange({
                  ...data,
                  education: [
                    ...data.education,
                    {
                      degree: "Degree",
                      year: "2025",
                      institution: "Institution",
                      type: "degree",
                    },
                  ],
                })
              }
            >
              + Add entry
            </button>
          ) : null
        }
      >
        <p className="mb-4 text-xs text-muted-foreground">
          Types: <strong className="text-muted-foreground">formal education</strong>,{" "}
          <strong className="text-muted-foreground">certificate</strong>,{" "}
          <strong className="text-muted-foreground">course</strong>,{" "}
          <strong className="text-muted-foreground">training (workshop)</strong>
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Degree</th>
                <th>Institution</th>
                <th>Year</th>
                <th>Type</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.education.map((edu, i) => (
                <tr key={i}>
                  <td>
                    <AdminInput
                      value={edu.degree}
                      onChange={(degree) => onChange(updateEducation(data, i, { degree }))}
                      disabled={disabled}
                    />
                  </td>
                  <td>
                    <AdminInput
                      value={edu.institution}
                      onChange={(institution) =>
                        onChange(updateEducation(data, i, { institution }))
                      }
                      disabled={disabled}
                    />
                  </td>
                  <td className="w-24">
                    <AdminInput
                      value={edu.year}
                      onChange={(year) => onChange(updateEducation(data, i, { year }))}
                      disabled={disabled}
                    />
                  </td>
                  <td className="w-32">
                    <select
                      className="admin-input admin-select"
                      value={edu.type}
                      onChange={(e) =>
                        onChange(
                          updateEducation(data, i, {
                            type: e.target.value as EducationEntry["type"],
                          }),
                        )
                      }
                      disabled={disabled}
                    >
                      <option value="degree">Formal education</option>
                      <option value="certificate">Certificate</option>
                      <option value="course">Course</option>
                      <option value="training">Training (workshop)</option>
                    </select>
                  </td>
                  <td>
                    {!disabled ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger text-xs px-2 py-1"
                        onClick={() =>
                          onChange({
                            ...data,
                            education: data.education.filter((_, idx) => idx !== i),
                          })
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <AdminSection title="Hobbies" description="Comma-separated">
        <CommaListInput
          items={data.hobbies}
          onChange={(hobbies) => onChange({ ...data, hobbies })}
          multiline={false}
          disabled={disabled}
        />
      </AdminSection>
    </div>
  );
}
