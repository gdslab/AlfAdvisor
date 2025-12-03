// bandTransform.js
export function bandFactor(band) {
  return String(band).toLowerCase() === "yield" ? 4.45 : 1;
}

export function transformValue(band, v) {
  if (v == null || Number.isNaN(v)) return null;
  return v * bandFactor(band);
}

export function transformRange(band, minmax) {
  const [a, b] = minmax.map(Number);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const f = bandFactor(band);
  return [lo * f, hi * f];
}
