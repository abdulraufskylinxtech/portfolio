import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  buildCvMeta,
  deleteCvFile,
  updateSiteCv,
  validateCvFile,
  writeCvFile,
} from "@/lib/cv-storage";

export async function DELETE() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteCvFile();
    const site = await updateSiteCv(null);
    return NextResponse.json({ ok: true, cv: site.cv ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete CV" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }

  const validationError = validateCvFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeCvFile(buffer);
    const cv = buildCvMeta(file.name);
    const site = await updateSiteCv(cv);
    return NextResponse.json({ ok: true, cv: site.cv });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload CV" },
      { status: 503 },
    );
  }
}
