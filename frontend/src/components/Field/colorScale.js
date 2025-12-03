// colorScale.js
import * as d3 from 'd3';

export const createColorScale = (
  min,
  max,
  { palette = d3.interpolateTurbo, reverse = false } = {}
) => {
  let lo = Number(min);
  let hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return () => 'rgba(0,0,0,0)';
  }
  if (hi <= lo) hi = lo + 1e-9; 

  const domain = reverse ? [hi, lo] : [lo, hi];

  return d3
    .scaleSequential(palette)
    .domain(domain)
    .clamp(true); 
};
