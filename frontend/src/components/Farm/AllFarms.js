// import React, { useEffect, useState, useRef } from "react";
// import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet-draw/dist/leaflet.draw.css";
// import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
// import '@geoman-io/leaflet-geoman-free';
// import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
// import { Farm } from "./Farm";
// import { FarmGeoman } from "./FarmGoeman";
// import L from 'leaflet';
// import useToken from "../Authentication/hooks/useToken";
// import { Link } from "react-router-dom";
// import '../Layout.css'

// const limeOptions = { color: 'red' }


// function AllFarms() {
//     const token = useToken();
//     const [Farms, setFarms] = useState()
//     const [farmsFetched, setFarmsFetched] = useState(false);
//     const [mapBounds, setMapBounds] = useState(null);

//     const customMarkerIcon = L.icon({
//         iconUrl: 'https://www.clker.com/cliparts/l/g/L/A/A/C/blue-marker-black-border-fit.svg',
//         iconSize: [40, 65], 
//         iconAnchor: [16, 32],
//     });

//     const farmHandler = async () => {
//         try {
//             const response = await fetch('/alfalfa/farm/read/?token=' + token, {
//                 method: 'GET',
//                 headers: {
//                     "Content-type": "application/json",
//                     "Authorization": 'Bearer ' + token
//                 },
//             });
//             const farmsData = await response.json();
//             setFarms(farmsData);

//             if (farmsData.length > 1) {
//                 const farmCoordinates = farmsData.map((farm) => [farm.lat, farm.lon]);
//                 const bounds = L.latLngBounds(farmCoordinates);
//                 setMapBounds(bounds);
//                 setFarmsFetched(true);

//             } else if (farmsData.length == 1) {
//                 const oneFarm = farmsData[0];

//                 const farmCoordinates = [[oneFarm.lat + 0.5, oneFarm.lon + 0.5], [oneFarm.lat - 0.5, oneFarm.lon - 0.5]];
//                 const bounds = L.latLngBounds(farmCoordinates);
//                 setMapBounds(bounds);
//                 setFarmsFetched(true);

//             } else {
//                 const USBound = L.latLngBounds([25.396308, -125.000000], [49.384358, -70.934570]);
//                 setMapBounds(USBound);
//                 setFarmsFetched(true);
//             }


//         } catch (error) {
//             console.log(error);
//         }
//     };

//     const DeleteFarmHandler = async (event) => {
//         console.log(event)
//         try {
//             const deleteFarm = await fetch('/alfalfa/farm/' + event + '/delete?token=' + token, {
//                 method: 'DELETE',
//                 headers: {
//                     "Content-type": "application/json",
//                     "Authorization": 'Bearer ' + token
//                 },
//             });
//             const delete_farm = await deleteFarm.json();

//             if (deleteFarm.ok) {

//                 window.location.reload();
//             }
//         } catch (error) {
//             console.log(error);
//         }
//     };


//     useEffect(() => {
//         if (!mapBounds) {
//             farmHandler();
//         }
//     })


//     return (
//         <div className="layout-container">
//             {farmsFetched ? (
//                 <MapContainer
//                     className="layout-map"
//                     bounds={[mapBounds]}
//                 >
//                     <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />
//                     <FarmGeoman />
//                     {Farms.map((farm) => (
//                         <Marker
//                             key={farm.id}
//                             position={[farm.lat, farm.lon]}
//                             icon={customMarkerIcon}
//                         >
//                             <Popup>
//                                 <div style={{ height: '50px' }} className="FarmNameTitle">{farm.name}</div>
//                                 <div style={{ width: '120px', height: '50px' }}><Link to={`/${farm.id}/fields`} state={{ farmName: farm.name, farmID: farm.id, farmLat: farm.lat, farmLon: farm.lon }}><button className='btn btn-open'>Open</button></Link></div>
//                                 <div><Link to={`/farm/${farm.id}/edit`} state={{ farmName: farm.name, farmID: farm.id, farmLat: farm.lat, farmLon: farm.lon }}><button className='btn btn-edit'>Edit</button></Link></div>
//                                 <div><button className='btn btn-delete' onClick={(e) => DeleteFarmHandler(farm.id)}>Delete</button></div>
//                             </Popup>
//                         </Marker>
//                     ))}
//                 </MapContainer>
//             ) : (<div>Loading farms...</div> 
//             )}
//             <div className="layout-box" >
//                 <Farm />
//             </div>
//         </div>
//     );
// };

// export default AllFarms;


import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from "react-leaflet-google-layer";
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

            // if (farmsData.length > 0) {
            //     const farmCoordinates = farmsData.map(farm => [farm.lat, farm.lon]);
            //     bounds = L.latLngBounds(farmCoordinates).pad(0.1);
            // } else {
            //     // Default to the US bounds
            //     bounds = L.latLngBounds([[25.396308, -125.000000], [49.384358, -70.934570]]);
            // }

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
                    <ReactLeafletGoogleLayer
                        apiKey="AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA"
                        type="hybrid"
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
