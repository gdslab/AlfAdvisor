// colorScale.js
import * as d3 from 'd3';

export const createColorScale = (min, max) =>
  d3.scaleSequential()
    .domain([min, max])
    .interpolator(d3.interpolateTurbo);
