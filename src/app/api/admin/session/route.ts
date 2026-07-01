import { NextResponse } from "next/server";

import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getStorageMode, isReadOnlyHosting } from "@/lib/content-store";

export async function GET() {
  const authenticated = await isAdminAuthenticated();

  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated,
    readOnlyHosting: isReadOnlyHosting(),
    storageMode: getStorageMode(),
  });
}
