import React, { useEffect, useState, useRef } from "react";
import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { NewFarmGeoman } from "./NewFarmGeoman";

const limeOptions = { color: 'red' }


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
                <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} /> 
                <NewFarmGeoman />
            </MapContainer>
        </div>
    );
};

export default FarmNew;