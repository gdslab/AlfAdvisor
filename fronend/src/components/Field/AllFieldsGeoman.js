import { useEffect, useState } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import useToken from "../Authentication/hooks/useToken";


export const AllFieldsGeoman = (props) => {
    const token = useToken()
    const context = useLeafletContext();
    const [boundry, setBoundry] = useState()
    const [coordinates, setCoordinates] = useState('')
    const [Lat, setLat] = useState('')
    const [Lng, setLng] = useState('')

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


