import React from 'react'
import { useEffect, useState, useRef } from "react";
import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import useToken from "../Authentication/hooks/useToken";
import { useLocation } from "react-router-dom";
import { UploadFieldGeoman } from './UploadField_Geoman';
import { useNavigate } from "react-router-dom";
import './UpdateField.css'
import Popup from '../Popup';


const limeOptions = {
  color: 'yellow',
  fillColor: 'blue',
  fillOpacity: 0.8,
}


function UploadField(props) {
  const token = useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [areaZoom, setAreaZoom] = useState(10);
  const [selectedField, setSelectedField] = useState('')
  const [buttonPopup, setButtonPopup] = useState(false)

  const farmID = location.state?.farmID;
  const farmLatitude = location.state?.farmLat;
  const farmLongitude = location.state?.farmLon;
  const [lat, setLat] = useState(farmLatitude);
  const [lon, setLon] = useState(farmLongitude);
  const [newFieldName, setNewFieldName] = useState()
  const fieldRef = useRef(null);

  useEffect(() => {
    if (fieldRef.current) { fieldRef.current.focus() };
  }, [newFieldName])


  const getFileHandler = (e) => {
    setFiles(e.target.files);
  }

  const UploadHandler = async (event) => {
    event.preventDefault()
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append(`files`, files[i])
    }

    const response = await fetch("/alfalfa/api/", {
      method: "POST",
      body: data,
    });
    const result = await response.json();
    setAreaZoom(14)
    setSelectedField(result.coordinates);
    setLat(result.coordinates[0][0])
    setLon(result.coordinates[0][1])
  };

  const NewFieldHandler = async () => {

    try {
      const shapefile_exist = await fetch('/alfalfa/' + farmID + '/field/check_shapefile_exists?token=' + token, {
        method: 'POST',
        body: JSON.stringify({
          boundary_path: JSON.stringify(selectedField),
        }),
        headers: {
          "Content-type": "application/json",
          "Authorization": 'Bearer ' + token
        }
      });
      const field_exist = await shapefile_exist.json();
      if (field_exist == null) {
        const create_field = await fetch('/alfalfa/' + farmID + '/field/create?token=' + token, {
          method: 'POST',
          body: JSON.stringify({
            name: newFieldName,
            lat: lat,
            lon: lon,
            boundary_path: JSON.stringify(selectedField),
          }),
          headers: {
            "Content-type": "application/json",
            "Authorization": 'Bearer ' + token
          }
        });
        const newField = await create_field.json()
        if (newField == null) {
          navigate(`/${farmID}/fields`, { // Perform the redirection when the field is successfully created
            state: {
              farmID: farmID,
              farmLat: farmLatitude,
              farmLon: farmLongitude,
            },
          });

        }
      } else {
        console.log(field_exist.detail)
        setButtonPopup(true)
        setErrorMessage(field_exist.detail)
      }
    } catch (error) {
      console.log(error)
      setErrorMessage(error)
      setButtonPopup(true)
    }
  }

  const UploadFieldHandler = () => {
    return (
      <>
        <div className='box'>
          <div className='field-name-title'> Upload all necessary files for field shapeflie (.shp, .shx, .dbf, .prj) </div>
          <div>
            <input className='choose-file-btn' onChange={getFileHandler} type="file" accept=".shp, .shx,.dbf, .prj" multiple />
            <button className='Upload-btn' onClick={UploadHandler}> Upload </button>
          </div>
          <div className='field-name-title'> Enter Field Name:</div>
          <input
            type='text'
            autoComplete="off"
            ref={fieldRef}
            value={newFieldName}
            placeholder='Enter field name'
            onChange={(e) => setNewFieldName(e.target.value)}
            required
          />
          <button className='add-field-btn' onClick={NewFieldHandler}>Add Field</button>
        </div>
      </>
    )
  };

  const PopupHandler = () => {
    return (
      <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
        <div className='error-message'>{errorMessage}</div>
      </Popup>)
  }

  const ChangeView = () => {
    const map = useMap();
    map.setView([lat, lon], areaZoom);
  }

  return (
    <div className='layout-container'>
      <MapContainer
        center={[lat, lon]}
        zoom={areaZoom}
        className='layout-map'>
        <ChangeView />
        <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />  'roadmap', 'satellite', 'terrain'
        <UploadFieldGeoman FarmID={farmID} />
        <Polygon pathOptions={limeOptions} zoom={areaZoom} positions={selectedField} />
      </MapContainer>
      <div className='layout-box'>
        <UploadFieldHandler />
        <PopupHandler />
      </div>
    </div>
  );
};

export default UploadField





