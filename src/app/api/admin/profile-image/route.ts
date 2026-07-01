import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  updateSiteProfileFields,
  validateDepthMapFile,
  validateProfileImageFile,
  writeDepthMapFile,
  writeProfileImageFile,
} from "@/lib/profile-image-storage";

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
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  if (kind !== "profile" && kind !== "depth") {
    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  }

  const validationError =
    kind === "profile" ? validateProfileImageFile(file) : validateDepthMapFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (kind === "profile") {
      const profileImage = await writeProfileImageFile(buffer, file.name);
      const site = await updateSiteProfileFields({ profileImage });
      return NextResponse.json({
        ok: true,
        kind,
        profileImage,
        profileDepthMap: site.profileDepthMap ?? "",
      });
    }

    const profileDepthMap = await writeDepthMapFile(buffer, file.name);
    const site = await updateSiteProfileFields({ profileDepthMap });
    return NextResponse.json({
      ok: true,
      kind,
      profileImage: site.profileImage ?? "",
      profileDepthMap,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload image" },
      { status: 503 },
    );
  }
}
