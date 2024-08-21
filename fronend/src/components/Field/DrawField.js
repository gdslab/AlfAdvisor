import React, { useEffect, useState, useRef } from "react";
import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { useLocation } from "react-router-dom";
import { DrawFieldGeoman } from "./DrawFieldGeoman";

const limeOptions = { color: 'red' }


function DrawField () {
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
                <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />  'roadmap', 'satellite', 'terrain'
                <DrawFieldGeoman FarmID={farmID} FarmLat={farmLat} FarmLon={farmLon} />
            </MapContainer>
        </div>
    );
};

export default DrawField;