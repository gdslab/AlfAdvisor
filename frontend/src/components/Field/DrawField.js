import { MapContainer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { useLocation } from "react-router-dom";
import { DrawFieldGeoman } from "./DrawFieldGeoman";


function DrawField() {
    const location = useLocation();

    const farmID = location.state?.farmID;
    const farmLat = location.state?.farmLat;
    const farmLon = location.state?.farmLon;

    return (
        <div className="layout-container">
            <MapContainer
                center={[farmLat, farmLon]}
                zoom={10}
                className='layout-edit-map'
            >
                <WMSTileLayer
                    attribution="USGS The National Map: Orthoimagery. Data refreshed December, 2021."
                    url="https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer"
                    format="image/png" layers="0" transparent maxNativeZoom={16} maxZoom={24}
                />
                <DrawFieldGeoman FarmID={farmID} FarmLat={farmLat} FarmLon={farmLon} />
            </MapContainer>
        </div>
    );
};

export default DrawField;