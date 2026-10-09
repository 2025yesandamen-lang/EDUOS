/**
 * Safe JSON reader helper for fetch Response objects.
 * Prevents "Unexpected token '<', '<html>...' is not valid JSON" errors
 * when endpoints return HTML (404, 502, 503, proxy errors, or server fallbacks).
 */
export async function safeReadJson<T = any>(res: Response, fallbackValue?: T): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const errorText = await res.text().catch(() => "");
    if (!res.ok) {
      const match = errorText.match(/<title>(.*?)<\/title>/i);
      const title = match ? match[1] : res.statusText;
      throw new Error(title ? `Server error (${res.status}: ${title})` : `Server responded with status ${res.status}`);
    }
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw new Error(`Unexpected non-JSON response from server (${res.status}).`);
  }

  try {
    return await res.json();
  } catch (parseErr: any) {
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw new Error(`Failed to parse response as JSON: ${parseErr.message}`);
  }
}
