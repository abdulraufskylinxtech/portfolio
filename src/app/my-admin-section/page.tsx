import type { Metadata } from "next";

import { AdminCmsApp } from "@/components/admin/admin-cms-app";

import "./admin.css";

export const metadata: Metadata = {
  title: "Content Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminCmsApp />;
}
