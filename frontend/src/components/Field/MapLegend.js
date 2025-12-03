import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './MapLegend.css';
import { createColorScale } from './colorScale';
import { transformRange } from './bandTransform';

export default function Legend({ minmax, title = 'Legend', units = '' }) {
  const map = useMap();
  const ctrlRef = useRef(null); 
  const containerRef = useRef(null);          
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => {
      const el = L.DomUtil.create('div', 'info legend-container');
      containerRef.current = el;
      return el;
    };
    ctrl.addTo(map);
    ctrlRef.current = ctrl;

    return () => {
      if (ctrlRef.current) {
        ctrlRef.current.remove();
        ctrlRef.current = null;
        containerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!ctrlRef.current || !containerRef.current) return;
    if (!Array.isArray(minmax) || minmax.length !== 2) return;

    const [minRaw, maxRaw] = minmax.map(Number);
    if (!isFinite(minRaw) || !isFinite(maxRaw)) return;

    const [min, max] = transformRange(title, [minRaw, maxRaw]);
    const mid = (min + max) / 2;
    console.log('Legend', min, max)

    const colorScale = createColorScale(min, max);
    const steps = 100;
    const gradientStops = Array.from({ length: steps + 1 }, (_, i) => {
      const v = min + (i / steps) * (max - min);
      return `${colorScale(v)} ${(i / steps) * 100}%`;
    }).join(', ');

    const headerUnits = units || (title === 'Yield' ? 'ton/ac' : '%');

    const minLabel = min.toFixed(2);
    const midLabel = mid.toFixed(2);
    const maxLabel = max.toFixed(2);

    containerRef.current.innerHTML = `
      <div class="legend-header">
        <button class="legend-toggle" aria-expanded="${!collapsed}" aria-controls="legend-body">
          ${title} (${headerUnits})
        </button>
      </div>
      <div id="legend-body" class="legend-body ${collapsed ? 'collapsed' : ''}">
        <div class="legend-bar" style="background: linear-gradient(to right, ${gradientStops})"></div>
        <div class="legend-labels">
          <span>${minLabel}</span>
          <span>${midLabel}</span>
          <span>${maxLabel}</span>
        </div>
      </div>
    `;

    const btn = containerRef.current.querySelector('.legend-toggle');
    const onToggle = () => setCollapsed(c => !c);
    btn?.addEventListener('click', onToggle);
    return () => btn?.removeEventListener('click', onToggle);
  }, [minmax, title, units, collapsed]);

  useEffect(() => {
    if (!Array.isArray(minmax) || minmax.length !== 2) return;
    const [min, max] = minmax.map(Number);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;
    map.fire('legend:range-change', { band: title, min, max });
  }, [map, title, minmax]);

  return null;
}