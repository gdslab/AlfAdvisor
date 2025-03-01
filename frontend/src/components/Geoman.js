import { useEffect, useState } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import WeatherData from "./WeatherData";
import useToken from "./Authentication/hooks/useToken";


export const Geoman = (props) => {
    const token = useToken()
    const context = useLeafletContext();
    const [boundry, setBoundry] = useState()
    const [coordinates, setCoordinates] = useState('')
    const [Lat, setLat] = useState('')
    const [Lng, setLng] = useState('')

    useEffect(() => {
        const leafletContainer = context.layerContainer || context.map;

        leafletContainer.pm.addControls({
            drawMarker: false,
            editControls: true,
        });

        leafletContainer.pm.setGlobalOptions({ pmIgnore: false });

        leafletContainer.on("pm:create", (e) => {
            setBoundry(e.layer.toGeoJSON())
            const shape = e;


            // enable editing of circle
            shape.layer.pm.enable();
            leafletContainer.pm
                .getGeomanLayers(true)
                .bindPopup("i am whole")
                .openPopup();
            leafletContainer.pm
                .getGeomanLayers()
                .map((layer, index) => layer.bindPopup(`figure N° ${index}`));
            shape.layer.on("pm:edit", (e) => {
                const event = e;
            });
        }
        );

        leafletContainer.on("pm:remove", (e) => {
        });

        return () => {
            leafletContainer.pm.removeControls();
            leafletContainer.pm.setGlobalOptions({ pmIgnore: true });

        };
    }, [context]);

    const GetCoordinates = async (en) => {
        try {
            const response = await fetch("/FieldBoundary/", {
                method: 'POST',
                body: JSON.stringify(boundry),
                headers: {
                    "Content-type": "application/json",
                }
            });
            const coor = await response.json()
            setCoordinates(coor)
            setLat(boundry.geometry.coordinates[0][0][1])
            setLng(boundry.geometry.coordinates[0][0][0])
        } catch (error) {
            console.log(error)
        }
    }  

    const CreateField = async () => {
        try {
            const create_field = await fetch('/' + props.FarmID + '/field/create?token=' + token , {
                method: 'POST',
                body: JSON.stringify({
                    name: props.FieldName,
                    lon: Lng, // Replace with the actual longitude value
                    lat: Lat, // Replace with the actual latitude value
                    boundary_path: coordinates,
                }),
                headers: {
                    "Content-type": "application/json",
                    "Authorization": 'Bearer ' + token
                }
            });
            const newField = await create_field.json()
            if (newField == null) {
              }
        } catch (error) {
            console.log(error)
        }
    }


    useEffect(() => {
        GetCoordinates();
    }, [boundry])

    useEffect (()=> {
        CreateField();
    },[Lat,Lng])

    return null;
};


