import Papa from 'papaparse';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function sanitizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const newRow: Record<string, unknown> = {};
    for (const key in row) {
      const val = row[key];
      if (typeof val === 'bigint') {
        newRow[key] = val <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(val) : val.toString();
      } else {
        newRow[key] = val;
      }
    }
    return newRow;
  });
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export function downloadCsv(rows: Record<string, unknown>[], columns: string[], filename: string) {
  const csv = Papa.unparse({
    fields: columns,
    data: rows
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
export function safeStringify(obj: unknown, indent?: number): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'bigint') {
      // If it's a small enough bigint, convert to number, otherwise string
      return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString();
    }
    return value;
  }, indent);
}
