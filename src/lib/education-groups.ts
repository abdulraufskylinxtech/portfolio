import type { EducationEntry, EducationType } from "@/lib/data";

export const FORMAL_EDUCATION_TYPES: EducationType[] = ["degree"];
export const CERTIFICATE_TYPES: EducationType[] = ["certificate"];
export const COURSE_TYPES: EducationType[] = ["course"];
export const TRAINING_TYPES: EducationType[] = ["training"];

export const QUALIFICATION_EDUCATION_TYPES: EducationType[] = [
  "certificate",
  "course",
  "training",
];

export function sortEducationByYearDesc(items: EducationEntry[]): EducationEntry[] {
  return [...items].sort((a, b) => Number(b.year) - Number(a.year));
}

function filterByTypes(education: EducationEntry[], types: EducationType[]) {
  return sortEducationByYearDesc(education.filter((item) => types.includes(item.type)));
}

export function groupEducation(education: EducationEntry[]) {
  return {
    formal: filterByTypes(education, FORMAL_EDUCATION_TYPES),
    certificates: filterByTypes(education, CERTIFICATE_TYPES),
    courses: filterByTypes(education, COURSE_TYPES),
    trainings: filterByTypes(education, TRAINING_TYPES),
  };
}
