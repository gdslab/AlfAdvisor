import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './MapLegend.css';
import { createColorScale } from './colorScale';

export default function Legend({ minmax, title = 'Legend', units = '' }) {
  const map = useMap();
  const legendRef = useRef(null);          
  const [collapsed, setCollapsed] = useState(false);

  // ---------- create control only once ----------
  if (!legendRef.current) {
    legendRef.current = L.control({ position: 'bottomright' });
    legendRef.current.onAdd = () =>
      L.DomUtil.create('div', 'info legend-container');
    legendRef.current.addTo(map);
  }

  // ---------- update HTML whenever data / state changes ----------
  useEffect(() => {
    const [min, max] = minmax;
    const avg = (min + max) / 2;
    const colorScale = createColorScale(min, max);
    const steps = 100;

    const unitStr = title === 'Yield' ? '(kg m⁻²)' : '(%)';

    // build gradient string
    const gradientStops = Array.from({ length: steps + 1 }, (_, i) => {
      const value = min + ((max - min) * i) / steps;
      const pct = (i * 100) / steps;
      return `${colorScale(value)} ${pct}%`;
    }).join(', ');

    // build inner HTML
    const html = `
      <div class="legend-header">
        <button
          class="legend-toggle"
          aria-expanded="${!collapsed}"
          aria-controls="legend-body"
        >
          ${title} ${unitStr}  
        </button>
      </div>
      <div id="legend-body" class="legend-body ${
        collapsed ? 'collapsed' : ''
      }">
        <div class="legend-bar" style="background:linear-gradient(to right,${gradientStops})"></div>
        <div class="legend-labels">
          <span>${min.toFixed(2)}${units}</span>
          <span>${avg.toFixed(2)}${units}</span>
          <span>${max.toFixed(2)}${units}</span>
        </div>
      </div>
    `;

    legendRef.current.getContainer().innerHTML = html;

    legendRef.current
      .getContainer()
      .querySelector('.legend-toggle')
      .addEventListener('click', () => setCollapsed((c) => !c));
  }, [minmax, collapsed, map, title, units]);

  return null;
}
