import { useEffect, useState, useRef } from 'react';
import { useLocation } from "react-router-dom";
import './FarmEdit.css';
import useToken from '../Authentication/hooks/useToken';
import { MapContainer, Marker, Popup, WMSTileLayer } from 'react-leaflet';
import { FarmGeoman } from "./FarmGoeman";
import L from 'leaflet';

export default function FarmEdit() {
  const token = useToken();
  const location = useLocation();
  const farmID = location.state?.farmID;
  const latitude = location.state?.farmLat;
  const longitude = location.state?.farmLon;
  const [farmName, setFarmName] = useState(location.state?.farmName)
  const [isPopupVisible, setPopupVisible] = useState();
  const [Lat, setLat] = useState(latitude);
  const [Lng, setLng] = useState(longitude);
  const [mapIsReady, setMapIsReady] = useState(false);

  const farmRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (farmRef.current) { farmRef.current.focus() };
  }, [farmName])

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.openPopup()
    };
  }, [mapIsReady]);


  const customMarkerIcon = L.icon({
    iconUrl: 'https://www.clker.com/cliparts/l/g/L/A/A/C/blue-marker-black-border-fit.svg',
    iconSize: [40, 65],
    iconAnchor: [16, 32], 
  });


  const EditFarmHnadler = async () => {
    try {
      const CreateFarm = await fetch('/alfalfa/farm/' + farmID + '/update?token=' + token, {
        method: 'PUT',
        body: JSON.stringify({
          name: farmName,
          lat: Lat,
          lon: Lng,
        }),
        headers: {
          "Content-type": "application/json",
          "Authorization": 'Bearer ' + token
        },
      });
      const Update_farm = await CreateFarm.json();

      if (Update_farm == null) {
        return (
          <div className='loading'>
            <div>Loading ....</div>
            <br />
            <div className='hide'>
              {window.location.href = "/farm"}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.log(error);
    }
  };


  const UpdatePopupHandler = () => {
    return (
      <>
        <div className='farm-name-title'>Farm Name:</div>
        <input
          type="text"
          className='update-farm-name'
          placeholder={farmName}
          autoComplete="off"
          ref={farmRef}
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          required
        >
        </input>
        <button className='submit-update-farm' onClick={EditFarmHnadler}>Update</button>
      </>
    )
  };


  return (

    <div className='layout-container'>
      <MapContainer
        whenReady={(map) => {
          mapRef.current = map;
          setMapIsReady(true);
        }}
        className='layout-edit-map'
        center={[Lat, Lng]}
        zoom={13}
      >
        <WMSTileLayer
                                attribution="USGS The National Map: Orthoimagery. Data refreshed December, 2021."
                                url="https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer"
                                format="image/png" layers="0" transparent maxNativeZoom={16} maxZoom={24}
                            />
        <FarmGeoman />
        <Marker
          ref={markerRef}
          key={farmID} 
          position={[Lat, Lng]} 
          icon={customMarkerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              setPopupVisible(true);
              setLat(e.target._latlng.lat);
              setLng(e.target._latlng.lng);
            },
          }}
        >
          <Popup>
            {isPopupVisible ? (<UpdatePopupHandler />) : (<div className='drag-message-container'>Drag the marker to update the position.</div>)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

