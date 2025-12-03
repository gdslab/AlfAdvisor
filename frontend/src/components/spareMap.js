import { useEffect, useState } from "react";
import { MapContainer, Polygon, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Geoman } from "./Geoman";

const limeOptions = { color: 'red' }


function Map(props) {
    let [lat, setLat] = useState(43.7844);
    let [lng, setLng] = useState(-88.7879);
    const areaZoom = 15;
    const selectedField = props;
    const [bound, setBound] = useState([[40.247023761991, -85.1477937991536], [40.2497809190028, -85.15238864772765]])
    const [files, setFiles] = useState();
    const [fieldName, setFieldName] = useState('')

    const getFileHandler = (e) => {
        setFiles(e.target.files);
        console.log(e.target.files.name)
    }


    const submitHandler = async (event) => {
        event.preventDefault()

        const data = new FormData();
        for (let i = 0; i < files.length; i++) {
            data.append(`files`, files[i])
        }

        const requestOptions = {
            method: "POST",
            body: data,
        };

        const response = await fetch("/api/" + fieldName, requestOptions);
        const result = await response.json();
        console.log(result);
        setAreaZoom("15");
        setSelectedField(result.coordinates);
        const latitude = result.coordinates[0][0]
        const lngitude = result.coordinates[0][1]
        setLat(latitude);
        setLng(lngitude);
        
    };

    useEffect(() => {
        console.log("MyMap", areaZoom);
        submitHandler()
    }, [selectedField]);


    const VisualizationHandler = async (e) => {
        e.preventDefault()

        const get_boundries = await fetch("/alfalfa/boundry/", {
            method: "GET",
        })
        const boundary = await get_boundries.json();

        const updateBound = (a, b, c, d) => {
            const newBound = [...bound];
            newBound[0][0] = a;
            newBound[0][1] = b;
            newBound[1][0] = c;
            newBound[1][1] = d;
            setBound(newBound);
        };

        console.log("After", bound)
        updateBound(boundary[1], boundary[2], boundary[3], boundary[0])

        setAreaZoom("15");
        const latitude = boundary[1]
        const lngitude = boundary[2]
        setLat(latitude);
        setLng(lngitude);

    }
    useEffect(() => {
        VisualizationHandler();
    }, [bound, areaZoom])

    const ChangeView = () => {
        const map = useMap();
        map.setView([lat, lng], areaZoom);
    }

    return (
        <div style={{ paddingLeft: '10%', paddingRight: '10%', paddingTop: '10px', paddingBottom: '20px' }}>
            <MapContainer
                // ref = {useMap}
                center={[lat, lng]}
                zoom={areaZoom}
                style={{ height: "70%", width: "100%" }}>
                <ChangeView />
                <ReactLeafletGoogleLayer apiKey='AIzaSyCETUJibrALaAG8K9uwR759V7hHd6GnnGA' type={'hybrid'} />  'roadmap', 'satellite', 'terrain'
                <Polygon pathOptions={limeOptions} zoom={areaZoom} positions={selectedField} />
                <Geoman />
            </MapContainer>

            <div>
                <div style={{ color: 'black', textAlign: 'left' }}>Upload your field boundary:</div>
                <form>
                    <input onChange={getFileHandler} name="shapefileUpload" type="file" accept=".shp, .shx,.dbf, .prj" multiple style={{ color: 'black', textAlign: 'left' }}></input>
                    <input type="text" onChange={(e) => setFieldName(e.target.value)} value={fieldName}/>
                    <button onClick={submitHandler}>Uplaod</button>
                </form>
            </div>
            <div style={{ display: "none" }}>
            </div>
        </div>
    );
};

export default Map;