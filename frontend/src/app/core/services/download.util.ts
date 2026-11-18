/** Trigger a browser download for an in-memory Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Best-effort filename from a Content-Disposition header. */
export function filenameFromDisposition(
  disposition: string | null | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}
