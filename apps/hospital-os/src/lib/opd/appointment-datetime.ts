/** Build a stable ISO timestamp from calendar date + local time string (24h or 12h). */
export function toAppointmentIso(dateYmd: string, timeStr: string): string {
  const date = dateYmd.trim();
  const time = timeStr.trim();
  if (!date) return new Date().toISOString();

  const match24 = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/);
  if (match24) {
    const hours = match24[1].padStart(2, '0');
    const minutes = match24[2];
    const seconds = match24[3] ?? '00';
    const parsed = new Date(`${date}T${hours}:${minutes}:${seconds}`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const parsed12 = new Date(`${date}T${time}`);
  if (!Number.isNaN(parsed12.getTime())) return parsed12.toISOString();

  const parsedSpace = new Date(`${date} ${time}`);
  if (!Number.isNaN(parsedSpace.getTime())) return parsedSpace.toISOString();

  return new Date().toISOString();
}
