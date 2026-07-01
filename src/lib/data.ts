export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  apis: string[];
  highlights: string[];
  live_link: string | null;
  github_link: string | null;
  images: string[];
  published: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  post_type: string;
  featured_image_url: string | null;
  published: boolean;
  created_at: string;
}

export interface SiteStat {
  value: string;
  label: string;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
  tech: string[];
  published: boolean;
}

export function isExperiencePublished(entry: ExperienceEntry): boolean {
  return entry.published !== false;
}

export type EducationType = "degree" | "certificate" | "course" | "training";

export interface EducationEntry {
  degree: string;
  year: string;
  institution: string;
  type: EducationType;
}

export interface SiteSkills {
  frontend: string[];
  backend: string[];
  devops: string[];
  aiml: string[];
}

export interface SiteMap {
  latitude: number;
  longitude: number;
  zoom?: number;
  label?: string;
}

export interface SiteCv {
  url: string;
  filename: string;
  label?: string;
  uploadedAt?: string;
}

export interface SiteInfo {
  email: string;
  whatsapp?: string;
  linkedin: string;
  github: string;
  instagram?: string;
  location: string;
  bio: string;
  role: string;
  availability: string;
  /** Hero + navbar portrait (path under public/, e.g. /me.jpg) */
  profileImage?: string;
  /** Optional AI depth map (grayscale) for true 3D portrait — e.g. /profile-depth.png */
  profileDepthMap?: string;
  aboutImages: string[];
  cv?: SiteCv | null;
  map?: SiteMap;
  stats: SiteStat[];
  skills: SiteSkills;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  hobbies: string[];
}

const DEFAULT_PROFILE_IMAGE = "/me.jpg";

export function getProfileImage(site: Pick<SiteInfo, "profileImage" | "aboutImages">): string {
  const fromProfile = site.profileImage?.trim();
  if (fromProfile) return fromProfile;
  const fromAbout = site.aboutImages?.map((src) => src.trim()).find(Boolean);
  if (fromAbout) return fromAbout;
  return DEFAULT_PROFILE_IMAGE;
}
