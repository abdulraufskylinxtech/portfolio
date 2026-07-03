export async function readApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text.trim()) {
    throw new Error(`Empty server response (${res.status})`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 413) {
      throw new Error("File too large. Use an image under 5 MB.");
    }
    const snippet = text.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(snippet || `Request failed (${res.status})`);
  }
}
