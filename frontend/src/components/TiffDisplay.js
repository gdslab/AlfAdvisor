// import { useEffect, useRef } from "react";
// import proj4 from "proj4";
// import { useLeafletContext } from "@react-leaflet/core";
// import { useMap } from "react-leaflet";
// import parseGeoraster from "georaster";
// import GeoRasterLayer from "georaster-layer-for-leaflet";
// import chroma from "chroma-js";

// window.proj4 = proj4;

// const TiffDisplay = ({ url, min = 0, max = 1, opacity = 1  }) => {
// const geoTiffLayerRef = useRef();
// const context = useLeafletContext();
// const map = useMap();

// useEffect(() => {
// const container = context.layerContainer || context.map;
// fetch(`${process.env.REACT_APP_HOST_NAME}/${url}`, {
// })
// .then((response) => {
//     console.log("response",response);
//     return response.arrayBuffer()}
//     )
// .then((arrayBuffer) => {
//     console.log("Array buffer is:",arrayBuffer)
//     parseGeoraster(arrayBuffer).then((georaster) => {
//         const min = georaster.mins[0];
//         const range = georaster.ranges[0];
//         const scale = chroma.scale('Spectral').domain([1, 0]);
//         const options = {
//         pixelValuesToColorFn: function (pixelValues) {
//         var pixelValue = pixelValues[0]; 
//         if (pixelValue === 0) return null;
//         const scaledPixelValue = (pixelValue - min) / range;
//         const color = scale(scaledPixelValue).hex();
//         return color;
//             },
//             resolution: 256,
//             opacity: 1
//         }
//         options.georaster = georaster;
//         geoTiffLayerRef.current = new GeoRasterLayer(options);
//         container.addLayer(geoTiffLayerRef.current);
//         })
//     }).catch((error)=>{
//         console.log("Error:",error);
//     })
//     return () => {
//     };
// }, [context, url, map, min, max]);

// return null;
// };

// export default TiffDisplay;
// // ##################

// import { useEffect, useRef } from "react";
// import proj4 from "proj4";
// import { useLeafletContext } from "@react-leaflet/core";
// import { useMap } from "react-leaflet";
// import parseGeoraster from "georaster";
// import GeoRasterLayer from "georaster-layer-for-leaflet";
// import chroma from "chroma-js";

// window.proj4 = proj4;

// const TiffDisplay = ({ url, min = 0, max = 1, opacity = 1 }) => {
//   const geoTiffLayerRef = useRef();
//   const context = useLeafletContext();
//   const map = useMap();

//   useEffect(() => {
//     const container = context.layerContainer || context.map;

//     fetch(`${process.env.REACT_APP_HOST_NAME}/${url}`)
//       .then((response) => response.arrayBuffer())
//       .then((arrayBuffer) => {
//         parseGeoraster(arrayBuffer).then((georaster) => {
//           // Use the props `min` and `max`, not georaster.mins
//           const scale = chroma.scale("Spectral").domain([min, max]);

//           const options = {
//             pixelValuesToColorFn: function (pixelValues) {
//               const pixelValue = pixelValues[0];
//               if (pixelValue === null || isNaN(pixelValue)) return null;
//               const color = scale(pixelValue).hex();
//               return color;
//             },
//             resolution: 256,
//             opacity: opacity,
//             georaster: georaster,
//           };

//           if (geoTiffLayerRef.current) {
//             map.removeLayer(geoTiffLayerRef.current);
//           }

//           geoTiffLayerRef.current = new GeoRasterLayer(options);
//           container.addLayer(geoTiffLayerRef.current);
//         });
//       })
//       .catch((error) => {
//         console.error("GeoTIFF loading error:", error);
//       });

//     return () => {
//       if (geoTiffLayerRef.current) {
//         map.removeLayer(geoTiffLayerRef.current);
//       }
//     };
//   }, [context, url, map, min, max, opacity]);

//   return null;
// };

// export default TiffDisplay;

// ////////////////////
// import { useEffect, useRef } from 'react';
// import proj4 from 'proj4';
// import { useLeafletContext } from '@react-leaflet/core';
// import { useMap } from 'react-leaflet';
// import parseGeoraster from 'georaster';
// import GeoRasterLayer from 'georaster-layer-for-leaflet';
// import { createColorScale } from './Field/colorScale';

// window.proj4 = proj4;  // required by georaster-layer

// const TiffDisplay = ({ url, min, max, opacity = 1 }) => {
//   const layerRef = useRef(null);
//   const { map, layerContainer } = useLeafletContext();
//   const mapInstance = useMap();               // keeps React-Leaflet happy
//   const container = layerContainer || map;    // leaflet 1 vs 2 compatibility

//   useEffect(() => {
//     // remove any previous layer when url / scale changes
//     if (layerRef.current) {
//       container.removeLayer(layerRef.current);
//       layerRef.current = null;
//     }

//     // fetch & render the new TIFF
//     const fetchTiff = async () => {
//       const response = await fetch(
//         `${process.env.REACT_APP_HOST_NAME}/${url}`
//       );
//       const arrayBuffer = await response.arrayBuffer();
//       const georaster = await parseGeoraster(arrayBuffer);

//       // fall back to dataset stats if caller didn't pass min/max
//       const zMin = min ?? georaster.mins[0];
//       const zMax = max ?? georaster.maxs[0];

//       const scale = createColorScale(zMin, zMax);  // <- identical to legend

//       const geoLayer = new GeoRasterLayer({
//         georaster,
//         opacity,
//         resolution: 256,
//         pixelValuesToColorFn: values => {
//           const value = values[0];
//           if (value == null || Number.isNaN(value)) return null; // nodata
//           // clamp & map to colour
//           const clamped = Math.min(Math.max(value, zMin), zMax);
//           return scale(clamped);
//         },
//       });

//       layerRef.current = geoLayer;
//       container.addLayer(geoLayer);
//     };

//     fetchTiff().catch(console.error);

//     // cleanup
//     return () => {
//       if (layerRef.current) {
//         container.removeLayer(layerRef.current);
//         layerRef.current = null;
//       }
//     };
//   }, [url, min, max, opacity, container]);

//   return null; // nothing to render; layer is added directly to Leaflet
// };

// export default TiffDisplay;


import { useEffect, useRef } from 'react';
import proj4 from 'proj4';
import { useLeafletContext } from '@react-leaflet/core';
import { useMap } from 'react-leaflet';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import { createColorScale } from './Field/colorScale';
import * as d3 from 'd3-color';

window.proj4 = proj4;

const TiffDisplay = ({ url, minMax, opacity = 1 }) => {
  const layerRef   = useRef(null);
  const { map, layerContainer } = useLeafletContext();
  const leafletMap = useMap();                         // keep context happy
  const container  = layerContainer || map;
  console.log('this is min and max', minMax)

  useEffect(() => {
    // -------- remove any previous layer --------
    if (layerRef.current) {
      container.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const run = async () => {
      const resp   = await fetch(`${process.env.REACT_APP_HOST_NAME}/${url}`);
      const buffer = await resp.arrayBuffer();
      const raster = await parseGeoraster(buffer);

      const zMin   = (minMax[0] ?? raster.mins[0]) * 1.0;
      const zMax   = (minMax[1] ?? raster.maxs[0]) * 1.0;
      const scale  = createColorScale(zMin, zMax);    // SAME scale as legend

      const layer = new GeoRasterLayer({
        georaster : raster,
        opacity,
        resolution: 256,
        pixelValuesToColorFn: ([v]) => {
          if (v == null || Number.isNaN(v)) return null;   // nodata
          const clamped = Math.min(Math.max(v, zMin), zMax);
          // Turbo → '#rrggbb'
          return d3.color(scale(clamped)).formatHex();
        },
      });

      layerRef.current = layer;
      container.addLayer(layer);
    };

    run().catch(console.error);

    return () => {
      if (layerRef.current) container.removeLayer(layerRef.current);
    };
  }, [url, minMax, opacity, container]);

  return null;     // Leaflet handles the drawing
};

export default TiffDisplay;
