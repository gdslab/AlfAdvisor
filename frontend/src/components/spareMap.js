import React, { useEffect, useState, useRef } from "react";
import { MapContainer, Polygon, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Geoman } from "./Geoman";
import { map } from "leaflet";
// import { bounds } from "leaflet";
// import Myimage from "../Data/result.jpg";
import WeatherData from "./WeatherData";
// import Table from "./Table";

const limeOptions = { color: 'red' }


function Map(props) {
    let [lat, setLat] = useState(43.7844);
    let [lng, setLng] = useState(-88.7879);
    const areaZoom = 15;
    const selectedField = props
    // let [selectedField, setSelectedField] = useState('');
    const [image, setImage] = useState(Myimage)
    const [transparent, setTransparent] = useState('0')
    const [bound, setBound] = useState([[40.247023761991, -85.1477937991536], [40.2497809190028, -85.15238864772765]])
    const [isfield, setIsField] = useState(false)
    const [files, setFiles] = useState();
    const mapRef = useRef();
    const [coordinates, setcordinates] = useState()
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

        const save_field = await fetch("/alfalfa/field/create", {
            method : "POST",
            body: JSON.stringify({
                field_name: fieldName,
                lon: lng, // Replace with the actual longitude value
                lat: lat, // Replace with the actual latitude value
                boundary_path: "../data/" + fieldName + "json", // Replace with the actual boundary path value
            }),
            headers : {
                "Content-type": "application/json",
            },
        })
        
    };

    useEffect(() => {
        console.log("MyMap", areaZoom);
        submitHandler()
    }, [selectedField]);


    // const AddFieldHandler = async (event) => {
    //     event.preventDefault();
    //     const Send_field_name = await fetch ("/field/create", {
    //         method : "POST",
    //         body : fieldName,
    //         headers : {
    //             "Content-type": "application/json",
    //         },
    //     })
    // };

    const VisualizationHandler = async (e) => {
        e.preventDefault()

        const get_boundries = await fetch("/alfalfa/boundry/", {
            method: "GET",
        })
        const boundary = await get_boundries.json();
        // setImage(Myimage)
        setTransparent(1)

        const updateBound = (a, b, c, d) => {
            // Create a copy of the 2D array
            const newBound = [...bound];
            // Update the value at the specified row and column index
            newBound[0][0] = a;
            newBound[0][1] = b;
            newBound[1][0] = c;
            newBound[1][1] = d;
            // Set the new state
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

    // const update_coor = (f) => {
    //     // val.preventDefault()
    //     setSelectedField(f)
    //     console.log('coming from field handler')
    //     // setSelectedField(c)
    // }

    const ChangeView = () => {
        const map = useMap();
        map.setView([lat, lng], areaZoom);
        // return null;
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
                {/* <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            /> */}
                <Polygon pathOptions={limeOptions} zoom={areaZoom} positions={selectedField} />

                <Geoman />
                {/* <ImageOverlay bounds={bound} url={image} opacity={transparent} zIndex={12} /> */}
            </MapContainer>

            <div>
                <div style={{ color: 'black', textAlign: 'left' }}>Upload your field boundary:</div>
                <form>
                    <input onChange={getFileHandler} name="shapefileUpload" type="file" accept=".shp, .shx,.dbf, .prj" multiple style={{ color: 'black', textAlign: 'left' }}></input>
                    <input type="text" onChange={(e) => setFieldName(e.target.value)} value={fieldName}/>
                    <button onClick={submitHandler}>Uplaod</button>
                    {/* <button onClick={AddFieldHandler}>Add this field</button> */}
                    {/* <button onClick={VisualizationHandler} > Show Yield Forecast</button> */}
                </form>
            </div>
            <div style={{ display: "none" }}>
                {/* <Table update_coor={update_coor} /> */}
                {/* < onGetData={() => this.fieldHandler()}/> */}
            </div>
        </div>
    );
};

export default Map;