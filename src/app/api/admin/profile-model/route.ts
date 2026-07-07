import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readContentFile } from "@/lib/content-store";
import {
  removeProfileModel,
  uploadProfileModel,
  validateProfileModelFile,
} from "@/lib/profile-model-storage";
import { removeProfileImage } from "@/lib/profile-image-storage";
import type { SiteInfo } from "@/lib/data";

export async function DELETE() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const site = await removeProfileModel();
    return NextResponse.json({
      ok: true,
      profileModel: site.profileModel ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove profile model" },
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
    return NextResponse.json({ error: "Missing .glb model file" }, { status: 400 });
  }

  const validationError = validateProfileModelFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const before = (await readContentFile("site")) as SiteInfo;
    const hadImage = Boolean(before.profileImage?.trim());
    const buffer = Buffer.from(await file.arrayBuffer());
    let site = await uploadProfileModel(file, buffer);
    if (hadImage) site = await removeProfileImage();
    return NextResponse.json({
      ok: true,
      profileImage: site.profileImage ?? null,
      profileModel: site.profileModel ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload profile model" },
      { status: 503 },
    );
  }
}
