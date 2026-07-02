/** Client-side AI background removal before profile upload. */
export async function cutOutProfileImage(file: File): Promise<File> {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(file, {
    output: { format: "image/png", quality: 0.92 },
  });

  const base = file.name.replace(/\.[^.]+$/, "") || "profile";
  return new File([blob], `${base}-cutout.png`, { type: "image/png" });
}
