import { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { Farm } from "./Farm";
import { FarmGeoman } from "./FarmGoeman";
import L from "leaflet";
import useToken from "../Authentication/hooks/useToken";
import { Link } from "react-router-dom";
import "../Layout.css";

function AllFarms() {
    const token = useToken();
    const [farms, setFarms] = useState(null);
    const [farmsFetched, setFarmsFetched] = useState(false);
    const [mapBounds, setMapBounds] = useState(null);

    // Reliable Leaflet Default Icon
    const customMarkerIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
    });

    const fetchFarms = async () => {
        try {
            const response = await fetch(`/alfalfa/farm/read/?token=${token}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error fetching farms: ${response.statusText}`);
            }

            const farmsData = await response.json();
            setFarms(farmsData);

            let bounds;
            bounds = L.latLngBounds([[25.396308, -125.000000], [49.384358, -70.934570]]);

            setMapBounds(bounds);
            setFarmsFetched(true);
        } catch (error) {
            console.error("Error fetching farms:", error);
        }
    };

    const deleteFarmHandler = async (farmId) => {
        try {
            const response = await fetch(`/alfalfa/farm/${farmId}/delete?token=${token}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete farm");
            }

            setFarms(prevFarms => prevFarms.filter(farm => farm.id !== farmId));
        } catch (error) {
            console.error("Error deleting farm:", error);
        }
    };

    useEffect(() => {
        if (!farmsFetched) {
            fetchFarms();
        }
    }, [mapBounds]);

    return (
        <div className="layout-container">
            {farmsFetched ? (
                <MapContainer className="layout-map" bounds={mapBounds}>
                    <WMSTileLayer
                        attribution="USGS The National Map: Orthoimagery. Data refreshed December, 2021."
                        url="https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer"
                        format="image/png" layers="0" transparent maxNativeZoom={16} maxZoom={24}
                    />
                    <FarmGeoman />
                    {farms?.map(farm => (
                        <Marker key={farm.id} position={[farm.lat, farm.lon]} icon={customMarkerIcon}>
                            <Popup>
                                <div style={{ height: "50px" }} className="FarmNameTitle">{farm.name}</div>
                                <div style={{ width: "120px", height: "50px" }}>
                                    <Link to={`/${farm.id}/fields`} state={{ farmName: farm.name, farmID: farm.id, farmLat: farm.lat, farmLon: farm.lon }}>
                                        <button className="btn btn-open">Open</button>
                                    </Link>
                                </div>
                                <div>
                                    <Link to={`/farm/${farm.id}/edit`} state={{ farmName: farm.name, farmID: farm.id, farmLat: farm.lat, farmLon: farm.lon }}>
                                        <button className="btn btn-edit">Edit</button>
                                    </Link>
                                </div>
                                <div>
                                    <button className="btn btn-delete" onClick={() => deleteFarmHandler(farm.id)}>
                                        Delete
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            ) : (
                <div>Loading farms...</div>
            )}
            <div className="layout-box">
                <Farm />
            </div>
        </div>
    );
}

export default AllFarms;
