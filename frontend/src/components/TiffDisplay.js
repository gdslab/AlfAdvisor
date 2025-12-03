import { useEffect, useRef } from 'react';
import proj4 from 'proj4';
import { useLeafletContext } from '@react-leaflet/core';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import { createColorScale } from './Field/colorScale';
import { transformValue, transformRange } from './Field/bandTransform';
import * as d3 from 'd3-color';

window.proj4 = proj4;

const TiffDisplay = ({ url, band, minMax, opacity = 1 }) => {
  const layerRef   = useRef(null);
  const { map, layerContainer } = useLeafletContext();
  const container  = layerContainer || map;

  useEffect(() => {
    if (layerRef.current) {
      container.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!Array.isArray(minMax) || minMax.length !== 2) {
      console.warn('TiffDisplay: missing or invalid minMax; layer not rendered.');
      return;
    }

    const [minIn, maxIn] = minMax.map(Number);
     if (!Number.isFinite(minIn) || !Number.isFinite(maxIn)) {
      console.warn('TiffDisplay: min/max not finite; layer not rendered.');
      return;
    }

    const [zMin, zMax] = transformRange(band, [minIn, maxIn]);
    const scale = createColorScale(zMin, zMax);

    const run = async () => {
      const resp   = await fetch(`${process.env.REACT_APP_HOST_NAME}/${url}`);
      const buffer = await resp.arrayBuffer();
      const raster = await parseGeoraster(buffer);

      const noDataSet = new Set(
        Array.isArray(raster.noDataValues)
          ? raster.noDataValues
          : (raster.noDataValue != null ? [raster.noDataValue] : [])
      ); 

      const layer = new GeoRasterLayer({
        georaster : raster,
        opacity,
        resolution: 256,
        pixelValuesToColorFn: ([raw]) => {
          if (raw == null || Number.isNaN(raw) || noDataSet.has(raw)) return null;
          const val = transformValue(band, raw);
          if (val == null || Number.isNaN(val)) return null;
          return d3.color(scale(val)).formatHex(); 
        },
      });

      layerRef.current = layer;
      container.addLayer(layer);
    };

    run().catch((e) => console.error('TiffDisplay error:', e));

    return () => {
      if (layerRef.current) {container.removeLayer(layerRef.current);
        layerRef.current = null;}
    };
  }, [url, band, minMax, opacity, container]);

  return null;    
};

export default TiffDisplay;
