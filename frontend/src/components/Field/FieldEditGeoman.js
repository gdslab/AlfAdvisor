import { useEffect } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";


export const FieldEditGeoman = (props) => {
    const context = useLeafletContext();

    useEffect(() => {
        const leafletContainer = context.layerContainer || context.map;

        leafletContainer.pm.addControls({
            drawMarker: false,
            drawPolyline:false,
            drawRectangle:false,
            drawPolygon:false,
            drawText:false,
            drawCircle:false,
            drawCircleMarker:false,
            rotateMode:false,
            removalMode:false,
            cutPolygon: false,
            editControls: true,
            dragMode:false
        });

        leafletContainer.pm.setGlobalOptions({ pmIgnore: false });
        leafletContainer.pm.toggleGlobalEditMode();
        leafletContainer.pm.globalEditModeEnabled(true)


        leafletContainer.on("pm:globaleditmodetoggled", (e) => {
            e.map.eachLayer(function (layer) {
                if ( layer.hasOwnProperty("_latlngs") ) {
                    const coordinates = layer.toGeoJSON().geometry.coordinates[0]
                    const transformed_Boundary = coordinates.map((coordinate) => [coordinate[1], coordinate[0]]);
                    props.onUpdatedBoundary(e.map._lastCenter.lat, e.map._lastCenter.lng, transformed_Boundary)
                }
                });
        })

        return () => {
            leafletContainer.pm.removeControls();
            leafletContainer.pm.setGlobalOptions({ pmIgnore: true });

        };
    }, [context]);

    return null;
};


