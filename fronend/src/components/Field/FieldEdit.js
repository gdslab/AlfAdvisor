import React, { useRef, useEffect } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { Link } from "react-router-dom";
import useToken from '../Authentication/hooks/useToken';
import { MapContainer, Marker, Popup, Polygon, TileLayer, useMap } from "react-leaflet";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import { FieldEditGeoman } from './FieldEditGeoman';


const limeOptions = {
  color: 'yellow',
  fillColor: 'blue',    // Inside (fill) color
  fillOpacity: 0.8,
}

export default function FieldEdit() {
  const token = useToken();
  const polygonRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [fieldName, setFieldName] = useState(location.state?.name);

  const fieldID = location.state?.id;
  const farmID = location.state?.farmID;
  const farmName = location.state?.farmName;
  const farmLat = location.state?.farmLat;
  const farmLon = location.state?.farmLon;
  const [boundary, setBoundary] = useState(location.state?.coordinates);
  const [latitude, setLatitude] = useState(location.state?.Lat);
  const [longitude, setLongitude] = useState(location.state?.Lon);
  


  const fieldRef = useRef(null);

  useEffect(() => {
    if (fieldRef.current) { fieldRef.current.focus() };
  }, [fieldName])

  const BoundaryIsUpdated = (lat, long, bound) => {
    setPopupVisible(true)
    setLatitude (lat)
    setLongitude (long)
    setBoundary(JSON.stringify(bound))
  }

  const UpdateFieldHandler = () => {
    return (
      <>
        <div className='farm-name-title'>Field Name:</div>
        <input
          type="text"
          className='update-farm-name'
          placeholder={fieldName}
          autoComplete="off"
          ref={fieldRef}
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          required
        >
        </input>
        <button className='submit-update-farm' onClick={EditFieldHandler}>Update</button>
      </>
    )
  };

  const EditFieldHandler = async () => {
    try {
      const create_field = await fetch('/alfalfa/' + farmID + '/field/' + fieldID + '/update?token=' + token, {
        method: 'PUT',
        body: JSON.stringify({
          name: fieldName,
          lat: latitude, 
          lon: longitude, 
          boundary_path: boundary,
        }),
        headers: {
          "Content-type": "application/json",
          "Authorization": 'Bearer ' + token
        }
      });
      const newField = await create_field.json()
      if (newField == null) {
        navigate(`/${farmID}/fields`,
                {
                    state: { farmID: farmID, farmName: farmName, farmLat: farmLat, farmLon: farmLon }
                })
      }
    } catch (error) {
      console.log(error)
    }
  }


  return (
    <div className='layout-container'>
      <MapContainer
        className='layout-edit-map'
        bounds={[JSON.parse(boundary)]}
      >
        <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />
        <FieldEditGeoman onUpdatedBoundary={BoundaryIsUpdated} />
        <Polygon
          ref={polygonRef}
          pathOptions={limeOptions}
          positions={JSON.parse(boundary)}
          eventHandlers={{
            click: () => {
              setPopupVisible(!isPopupVisible)
            },
          }}
        />
        {isPopupVisible && (<Popup
          position={polygonRef.current?.getBounds()?.getCenter()}
          onClose={() => setPopupVisible(false)} >
          <UpdateFieldHandler />
        </Popup>)}
      </MapContainer>
    </div>
  )
}
