import { ColumnType } from './types';

/**
 * Infers the data type for a single column based on a sample of values.
 */
export function inferColumnType(values: string[]): ColumnType {
  if (values.length === 0) return 'unknown';

  const nonNullValues = values.filter(v => v !== null && v !== undefined && v.trim() !== '');
  if (nonNullValues.length === 0) return 'string';

  const types = nonNullValues.map(v => guessType(v));
  
  // Count counts of each type
  const counts: Record<ColumnType, number> = {
    number: 0,
    date: 0,
    boolean: 0,
    string: 0,
    unknown: 0
  };

  types.forEach(t => counts[t]++);

  // Logic: if most are numbers, it's a number, etc.
  if (counts.number > nonNullValues.length * 0.8) return 'number';
  if (counts.date > nonNullValues.length * 0.8) return 'date';
  if (counts.boolean > nonNullValues.length * 0.8) return 'boolean';
  
  return 'string';
}

function guessType(val: string): ColumnType {
  const trimmed = val.trim();
  if (trimmed === '') return 'unknown';

  // Number check
  if (!isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed))) return 'number';

  // Boolean check
  const low = trimmed.toLowerCase();
  if (['true', 'false', 'yes', 'no', '1', '0'].includes(low)) return 'boolean';

  // Date check
  const date = new Date(trimmed);
  if (!isNaN(date.getTime()) && trimmed.length >= 6) {
    // Basic regex to avoid common strings that Date() parses but aren't dates (like "123456")
    const datePattern = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/; // matches 2023-01-01 or 01/01/23
    const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/; // matches ISO
    if (datePattern.test(trimmed) || isoPattern.test(trimmed)) {
      return 'date';
    }
  }

  return 'string';
}
