import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, Marker, Popup, Polygon, useMapEvent, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { Link, useLocation } from "react-router-dom";
import L from "leaflet";
import useToken from "../Authentication/hooks/useToken";
import FieldTable from "./FieldTable";
import { AllFieldsGeoman } from "./AllFieldsGeoman";
import "../Layout.css";
import Breadcrumb from "../Breadcrumbs";

const limeOptions = { color: "red" };

function AllFields() {
    const token = useToken();
    const location = useLocation();

    const farm_name = location.state?.farmName;
    const farm_id = location.state?.farmID;
    const farm_lat = location.state?.farmLat;
    const farm_lon = location.state?.farmLon;

    const [fields, setFields] = useState([]);
    const [mapBounds, setMapBounds] = useState(null);
    const [zoom, setZoom] = useState(5);

    const customMarkerIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
    });

    const breadcrumbItems = [
        { label: "Home", link: "/" },
        { label: "Farms", link: "/farm" },
        { label: farm_name, link: `/${farm_id}/fields` },
    ];

    const fetchFields = useCallback(async () => {
        try {
            const response = await fetch(`/alfalfa/${farm_id}/field/read/`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Error fetching fields: ${response.statusText}`);

            const fieldsData = await response.json();
            setFields(fieldsData);

            // Calculate map bounds
            let bounds;
            if (fieldsData.length > 1) {
                const coordinates = fieldsData.map(field => [field.lat, field.lon]);
                bounds = L.latLngBounds(coordinates).pad(0.1);
            } 
            else if (fieldsData.length === 1) {
                bounds = L.latLngBounds(JSON.parse(fieldsData[0].boundary_path)).pad(0.1);
            } 
            else {
                bounds = L.latLngBounds([[farm_lat + 0.5, farm_lon + 0.5], [farm_lat - 0.5, farm_lon - 0.5]]);
            }

            setMapBounds(bounds);
        } catch (error) {
            console.error("Error fetching fields:", error);
        }
    }, [farm_id, farm_lat, farm_lon, token]);

    const deleteFieldHandler = async (fieldID) => {
        try {
            const response = await fetch(`/alfalfa/${farm_id}/field/${fieldID}/delete`, {
                method: "DELETE",
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete field");

            setFields(prevFields => prevFields.filter(field => field.id !== fieldID));
        } catch (error) {
            console.error("Error deleting field:", error);
        }
    };

    const GetZoomLevel = () => {
        useMapEvent("zoomend", (e) => setZoom(e.target.getZoom()));
        return null;
    };

    useEffect(() => {
        if (!mapBounds) fetchFields();
    }, [mapBounds]);

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />
            <div className="layout-container">
                {mapBounds ? (
                    <MapContainer bounds={mapBounds} className="layout-map">
                        <GetZoomLevel />
                        <WMSTileLayer
                        attribution="USGS The National Map: Orthoimagery. Data refreshed December, 2021."
                        url="https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer"
                        format="image/png"
                        layers="0"
                        transparent={true}
                        maxNativeZoom={16}
                        maxZoom={24}
                    />
                    
                        <AllFieldsGeoman />
                        {fields.map(field => (
                            <React.Fragment key={field.id}>
                                {zoom < 14 && (
                                    <Marker position={[field.lat, field.lon]} icon={customMarkerIcon}>
                                        <Popup>
                                            <div style={{ width: "120px", height: "170px" }}>
                                                <div className="FarmNameTitle">{field.name}</div>
                                                <Link to={`/${farm_id}/field/${field.id}`} state={{ farmID: farm_id, farmName: farm_name, id: field.id, name: field.name, fieldLat: field.lat, fieldLon: field.lon, coordinates: field.boundary_path }}>
                                                    <button className="btn btn-open">Open</button>
                                                </Link>
                                                <Link to={`/${farm_id}/field/${field.id}/edit`} state={{ farmID: farm_id, farmName: farm_name, farmLat: farm_lat, farmLon: farm_lon, id: field.id, name: field.name, Lat: field.lat, Lon: field.lon, coordinates: field.boundary_path }}>
                                                    <button className="btn btn-edit">Edit</button>
                                                </Link>
                                                <button className="btn btn-delete" onClick={() => deleteFieldHandler(field.id)}>Delete</button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                                <Polygon pathOptions={limeOptions} positions={JSON.parse(field.boundary_path)}>
                                    <Popup>
                                        <div style={{ width: "120px", height: "170px" }}>
                                            <div className="FarmNameTitle">{field.name}</div>
                                            <Link to={`/${farm_id}/field/${field.id}`} state={{ farmID: farm_id, farmName: farm_name, id: field.id, name: field.name, fieldLat: field.lat, fieldLon: field.lon, coordinates: field.boundary_path }}>
                                                <button className="btn btn-open">Open</button>
                                            </Link>
                                            <Link to={`/${farm_id}/field/${field.id}/edit`} state={{ farmID: farm_id, farmName: farm_name, farmLat: farm_lat, farmLon: farm_lon, id: field.id, name: field.name, Lat: field.lat, Lon: field.lon, coordinates: field.boundary_path }}>
                                                <button className="btn btn-edit">Edit</button>
                                            </Link>
                                            <button className="btn btn-delete" onClick={() => deleteFieldHandler(field.id)}>Delete</button>
                                        </div>
                                    </Popup>
                                </Polygon>
                            </React.Fragment>
                        ))}
                    </MapContainer>
                ) : (
                    <div>Loading Fields...</div>
                )}
                <div className="layout-box">
                    <FieldTable id={farm_id} name={farm_name} lat={farm_lat} lon={farm_lon} />
                </div>
            </div>
        </>
    );
}

export default AllFields;
