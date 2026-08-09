const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeNumericInput(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/٫/g, '.')
    .replace(/[٬,\s]/g, '');
}

export function parseNumericInput(value: unknown, fallback = 0) {
  const normalized = normalizeNumericInput(value);
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseIntegerInput(value: unknown, fallback = 0) {
  return Math.trunc(parseNumericInput(value, fallback));
}

export function parseOptionalIntegerInput(value: unknown) {
  return normalizeNumericInput(value) === '' ? null : parseIntegerInput(value);
}
