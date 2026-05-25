export type ExportValue = string | number | boolean | null | undefined;

export type ExportRow = Record<string, ExportValue>;

function escapeCsvValue(value: ExportValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  const asText = String(value);
  if (asText.includes(',') || asText.includes('"') || asText.includes('\n')) {
    return `"${asText.replace(/"/g, '""')}"`;
  }

  return asText;
}

export function rowsToCsv(rows: ExportRow[]): string {
  if (!rows.length) {
    return 'No data\n';
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
  });

  return lines.join('\n');
}

function downloadContent(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows: ExportRow[], fileName: string) {
  downloadContent(rowsToCsv(rows), fileName, 'text/csv;charset=utf-8');
}

export function downloadJson(data: unknown, fileName: string) {
  downloadContent(JSON.stringify(data, null, 2), fileName, 'application/json;charset=utf-8');
}
