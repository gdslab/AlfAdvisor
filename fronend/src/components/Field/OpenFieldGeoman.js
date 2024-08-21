import { useEffect, useState, useRef } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import proj4 from "proj4";
import { useMap } from "react-leaflet";

window.proj4 = proj4;


export const OpenFieldGeoman = () => {
    const geoTiffLayerRef = useRef();
    const context = useLeafletContext();
    const map = useMap();

    useEffect(() => {
        const leafletContainer = context.layerContainer || context.map;

        leafletContainer.pm.addControls({
            drawMarker: false,
            drawPolyline:false,
            drawRectangle:false,
            drawPolygon:false,
            drawCircle:false,
            drawCircleMarker:false,
            drawText:false,
            editControls: false,
        });

        leafletContainer.pm.setGlobalOptions({ pmIgnore: false });

        return () => {
            leafletContainer.pm.removeControls();
            leafletContainer.pm.setGlobalOptions({ pmIgnore: true });

        };
    }, [context]);

    return null;
};


