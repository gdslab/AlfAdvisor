import React, { useEffect, useState, useRef } from "react";
import { MapContainer, Marker, Popup, Polygon, TileLayer, useMap, useMapEvent } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Link } from "react-router-dom";
import useToken from "../Authentication/hooks/useToken";
import { useLocation } from "react-router-dom";
import L from 'leaflet';
import FieldTable from "./FieldTable";
import { AllFieldsGeoman } from "./AllFieldsGeoman";
import '../Layout.css'
import Breadcrumb from "../Breadcrumbs";

const limeOptions = { color: 'red' }


function AllFields () {
    const token = useToken();
    const location = useLocation();
    const farm_name = location.state?.farmName;
    const farm_id = location.state?.farmID;
    const farm_lat = location.state?.farmLat;
    const farm_lon = location.state?.farmLon;
    const [Fields, setFields] = useState([])
    const [fieldssFetched, setfieldssFetched] = useState(false);
    const [mapBounds, setMapBounds] = useState(null);
    const mapRef = useRef();
    const [zoom, setZoom] = useState(5)


    const customMarkerIcon = L.icon({
        iconUrl: 'https://www.clker.com/cliparts/l/g/L/A/A/C/blue-marker-black-border-fit.svg',
        iconSize: [40, 65],
        iconAnchor: [16, 32],
    });

    const breadcrumbItems = [
        { label: 'Home', link: '/' },
        { label: 'Farms', link: '/farm'},
        { label: `${farm_name}`, link: `/${farm_id}/fields` },
    ];


    const fieldHandler = async (e) => {
        const response = await fetch('/alfalfa/' + farm_id + '/field/read/?token=' + token, {
            method: 'GET',
            headers: {
                "Content-type": "application/json",
                "Authorization": 'Bearer ' + token
            },
        }
        );
        const fieldsData = await response.json();
        console.log('this is the problematic field data',fieldsData)
        setFields(fieldsData);

        if (fieldsData.length > 1) {
            const fieldCoordinates = fieldsData.map((field) => [field.lat, field.lon]);
            const bounds = L.latLngBounds(fieldCoordinates);
            setMapBounds(bounds);

        } else if (fieldsData.length === 1) {
            const oneField = fieldsData[0];
            const bounds = L.latLngBounds(JSON.parse(oneField.boundary_path));
            setMapBounds(bounds);

        } else {
            const USBound = L.latLngBounds([farm_lat + 0.5, farm_lon + 0.5], [farm_lat - 0.5, farm_lon - 0.5]);
            setMapBounds(USBound);
        }
        setfieldssFetched(true);
    };

    const DeleteFieldHandler = async (fieldID) => {
        try {
            const deleteFarm = await fetch('/alfalfa/' + farm_id + '/field/' + fieldID + '/delete?token=' + token, {
                method: 'DELETE',
                headers: {
                    "Content-type": "application/json",
                    "Authorization": 'Bearer ' + token
                },
            });
            const delete_farm = await deleteFarm.json();
            if (deleteFarm.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.log(error);
        }
    };


    const GetZoomLevel = () => {
        const map = useMapEvent({
            zoomend: () => {
                // Update the zoom level whenever it changes
                setZoom(map.getZoom());
            }
        })
        return null
    }

    useEffect(() => {
        if (!mapBounds) {
            fieldHandler();
        }
    })

    return (
        <>
            <div>
                <Breadcrumb items={breadcrumbItems} />
            </div>
            <div className="layout-container ">
                {fieldssFetched ? (
                    <MapContainer
                        bounds={[mapBounds]}
                        className='layout-map'
                    >
                        <GetZoomLevel />
                        <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />
                        <AllFieldsGeoman />
                        {Fields.map((field) => (
                            <>
                                {zoom < 14 ?
                                    (<Marker
                                        key={field.id} // Make sure to provide a unique key for each marker
                                        position={[field.lat, field.lon]} // Use the latitude and longitude from the farm object
                                        icon={customMarkerIcon}>
                                        <Popup>
                                            <div style={{ height: '50px' }} className="FarmNameTitle">{field.name}</div>
                                            <div style={{ width: '120px', height: '50px' }}><Link to={`/${farm_id}/field/${field.id}`} state={{ farmID: farm_id, farmName:farm_name,  id: field.id, name: field.name, fieldLat: field.lat, fieldLon: field.lon, coordinates: field.boundary_path }}><button className='btn btn-open'>Open</button></Link></div>
                                            <div><Link to={`/${farm_id}/field/${field.id}/edit`} state={{ farmID: farm_id, farmName: farm_name, farmLat: farm_lat, farmLon: farm_lon, id: field.id, name: field.name, Lat: field.lat, Lon: field.lon, coordinates: field.boundary_path }}><button className='btn btn-edit'>Edit</button></Link></div>
                                            <td><button className='field-btn btn-delete' onClick={(e) => DeleteFieldHandler(field.id)}>Delete</button></td>
                                        </Popup>
                                    </Marker>) : null}
                                <Polygon pathOptions={limeOptions} positions={JSON.parse(field.boundary_path)}>
                                    <Popup>
                                        <div style={{ height: '50px' }} className="FarmNameTitle">{field.name}</div>
                                        <div style={{ width: '120px', height: '50px' }}><Link to={`/${farm_id}/field/${field.id}`} state={{ farmID: farm_id, farmName:farm_name, id: field.id, name: field.name, fieldLat: field.lat, fieldLon: field.lon, coordinates: field.boundary_path }}><button className='btn btn-open'>Open</button></Link></div>
                                        <div><Link to={`/${farm_id}/field/${field.id}/edit`} state={{ farmID: farm_id, farmName: farm_name, farmLat: farm_lat, farmLon: farm_lon, id: field.id, name: field.name, Lat: field.lat, Lon: field.lon, coordinates: field.boundary_path }}><button className='btn btn-edit'>Edit</button></Link></div>
                                        <td><button className='field-btn btn-delete' onClick={(e) => DeleteFieldHandler(field.id)}>Delete</button></td>
                                    </Popup>
                                </Polygon>
                            </>
                        ))}
                    </MapContainer>
                ) : (
                    <div>Loading Fields...</div> // Show a loading message while farms are being fetched
                )}

                <div className="layout-box " >
                    <FieldTable id={farm_id} name={farm_name} lat={farm_lat} lon={farm_lon} />
                </div>
            </div>
        </>
    );
}
export default AllFields;