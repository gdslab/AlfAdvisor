import { useRef } from "react";
import { MapContainer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { NewFarmGeoman } from "./NewFarmGeoman";


function FarmNew() {
    const lat = 39.0;
    const lng = -97.0;
    const areaZoom = 5;
    const mapRef = useRef();


    return (
        <div className="layout-container">
            <MapContainer
                center={[lat, lng]}
                zoom={areaZoom}
                className='layout-edit-map'
            >
                <WMSTileLayer
                    attribution="USGS The National Map: Orthoimagery. Data refreshed December, 2021."
                    url="https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer"
                    format="image/png" layers="0" transparent maxNativeZoom={16} maxZoom={24}
                />
                <NewFarmGeoman />
            </MapContainer>
        </div>
    );
};

export default FarmNew;