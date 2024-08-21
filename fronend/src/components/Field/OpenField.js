import React, { useEffect, useState, useRef } from "react";
import { LayersControl, MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { useLocation } from "react-router-dom";
import { OpenFieldGeoman } from "./OpenFieldGeoman";
import { LatLon } from 'geodesy/mgrs';
import TiffDisplay from "../TiffDisplay";
import { getLocalStorage } from '../Authentication/hooks/localStorage';
import useToken from "../Authentication/hooks/useToken";
import './OpenField.css'
import Popup from "../Popup";
import FieldCharts from "../Charts/FieldCharts";
import '../Layout.css'
import Breadcrumb from "../Breadcrumbs";
import EconomicModel from "./EconomicModel"
import getMgrsTiles from "./GetMGRS";

const limeOptions = { color: 'red' }


function OpenField(props) {
    const token = useToken();
    const mapRef = useRef(null);
    const location = useLocation();
    const userID = getLocalStorage('userID');
    const dateRef = useRef();

    const farmID = location.state?.farmID;
    const farmName = location.state?.farmName;
    const fieldID = location.state?.id;
    const fieldName = location.state?.name;
    const field_lat = location.state?.fieldLat;
    const field_lon = location.state?.fieldLon;
    const coordinates = location.state?.coordinates;

    const [images, setImages] = useState(['']);
    const [YQdata, setYQdata] = useState({});
    const [show, setShow] = useState(false);
    const [runModel, setRunModel] = useState(false);
    const field = JSON.parse(coordinates);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState();
    const [processing, setProcessing] = useState(false);
    const [selectedDate, setSelectedDate] = useState();
    console.log("This is date", selectedDate)

    const breadcrumbItems = [
        { label: 'Home', link: '/' },
        { label: 'Farms', link: '/farm' },
        { label: `${farmName}`, link: `/${farmID}/fields`, state: { farmName: farmName, farmID: farmID, farmLat: field_lat, farmLon: field_lon } },
        { label: `${fieldName}`, link: `/${farmID}/field/${fieldID}` },
    ];

    const julianToDate = (julianDate) => {
        const year = parseInt(julianDate.substring(0, 4), 10);
        const dayOfYear = parseInt(julianDate.substring(4), 10);

        const date = new Date(year, 0);
        date.setDate(dayOfYear);

        const month = date.getMonth() + 1; // Adding 1 to adjust month
        const day = date.getDate();

        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return formattedDate;
    }

    const YieldQualityModel = async () => {
        const latLongP = new LatLon(field_lat, field_lon);
        const utmCoord = latLongP.toUtm();
        const mgrsGRef = utmCoord.toMgrs();
        const mgrsStr = mgrsGRef.toString();
        console.log("tileID are:", mgrsGRef)
        const baseTileID = mgrsStr.replace(" ", "").substring(0, 5);
        const tileIDs = [baseTileID]; // Start with the base tile
        <getMgrsTiles latitude={field_lat} longitude={field_lon} />

        try {
            setProcessing(true)
            const model = await fetch('/alfalfa/yieldModel/model/', {
                method: "POST",
                body: JSON.stringify({
                    tile_id: tileIDs,
                    user_id: userID,
                    farm_id: farmID,
                    field_id: fieldID,
                    boundary: coordinates,
                    SelectedDate: selectedDate
                }),
                headers: {
                    "Content-type": "application/json",
                }
            });
            if (!model.ok) {
                throw new Error('Network response was not ok');
              }
                const model_response = await model.json();
                const { image_path, data } = model_response;
                const filteredImagePaths = image_path.filter(imageName => {
                    return imageName.includes('gap1') && ['Yield', 'CP', 'ADF', 'NDF', 'NDFD'].some(keyword => imageName.includes(keyword));
                });
                const uniqueImagePaths = [...new Set(filteredImagePaths)];
                
                // Set the state with the received data
                setProcessing(false)
                setImages(uniqueImagePaths);
                setYQdata(data);

                const savePromises = uniqueImagePaths.map(async (imageName) => {
                    console.log('image name is', imageName);
                    const start = imageName.length - 11;
                    const end = imageName.length - 4;
                    const julianDate = imageName.slice(start, end);
                    const formattedDate = julianToDate(julianDate)

                    const save_result = await fetch(`/alfalfa/${farmID}/field/${fieldID}/images?token=${token}`, {
                        method: 'POST',
                        body: JSON.stringify({
                            date: formattedDate,
                            path: `${imageName}`,
                        }),
                        headers: {
                            "Content-type": "application/json",
                            "Authorization": 'Bearer ' + token
                        }
                    });

                    if (!save_result.ok) {
                        const errorData = await save_result.json();
                        console.log("Failed to save the image:", errorData.message || "Unknown error");
                        return null;
                    }
                    return save_result.json();
                });
                await Promise.all(savePromises);
                setRunModel(true)
                setShow(true)
                
                if (mapRef.current) {
                    mapRef.current.invalidateSize(); // Refresh and re-render the map
                }
        } catch (error) {
            console.error('Error processing the HLS Handler:', error);
            setErrorMessage(error)
            setButtonPopup(true)
            setProcessing(false)
        }
    };

    const PopupHandler = () => {
        return (
            <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <div className='error-message'>{errorMessage}</div>
            </Popup>)
    }

    const TiffOverlayComponent = ({ imagePath }) => {
        const regex = /(.*)_(.*)_gap1.tif/;
        const matches = imagePath.match(regex);

        let name = '';
        if (matches) {
            name = matches[2]; // Extracted name part
        }

        return (
            <div className="map-container">
                <LayersControl.Overlay name={`${name}`} >
                    <TiffDisplay url={imagePath} opacity={1} />
                </LayersControl.Overlay>
            </div>);
    };

    return (
        <>
            <div>
                <Breadcrumb items={breadcrumbItems} />
            </div>
            <div className="layout-container">
                <MapContainer
                    ref={mapRef}
                    bounds={field}
                    className='layout-map'
                >
                    <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />  'roadmap', 'satellite', 'terrain'

                    <OpenFieldGeoman />
                    <LayersControl >
                        <LayersControl.Overlay checked={true} name="Field_boundary" >
                            <Polygon pathOptions={limeOptions} positions={field} />
                        </LayersControl.Overlay>
                        {show && images.map((image, index) => (
                            console.log('it works up to here'),
                            <TiffOverlayComponent key={index} imagePath={image} />
                        ))}
                    </LayersControl>
                </MapContainer>
                <PopupHandler />
                <div className="layout-box">
                    <FieldCharts />
                    <div className="yield-input-container">
                        <div className="box-heading-yield"> Estimate Yield and Quality </div>
                        <div className="yield-quality-input" >
                            <label className="question" >What day you are planning to cut?</label>
                            <input
                                className="question"
                                type="date"
                                id="dateValue"
                                ref={dateRef}
                                autoComplete="off"
                                onChange={(e) => setSelectedDate(e.target.value)}
                                value={selectedDate}
                                required
                            />
                            {selectedDate ? (<button className="done-btn-YQ" onClick={YieldQualityModel} > Run Model </button>) : (<button className="not-active-button"> Run Model </button>)}
                        </div>
                        {processing ? (<div className="processing">Processing...</div>) : null}
                    </div>
                    <EconomicModel YQdata={YQdata} latitude={field_lat} longitude={field_lon} />
                </div>
            </div>
        </>
    );
};

export default OpenField;