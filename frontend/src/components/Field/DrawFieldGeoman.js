import React from 'react';
import { useEffect, useState } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import useToken from "../Authentication/hooks/useToken";
import { useNavigate } from "react-router-dom";


export const DrawFieldGeoman = (props) => {
    const token = useToken()
    const context = useLeafletContext();
    const [boundry, setBoundry] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const leafletContainer = context.layerContainer || context.map;

        leafletContainer.pm.addControls({
            drawMarker: false,
            editControls: false,
            drawPolyline: false,
            drawText: false,
            drawCircle: false,
            drawCircleMarker: false,
        });


        leafletContainer.pm.setGlobalOptions({ pmIgnore: false });

        leafletContainer.on("pm:create", (e) => {
            const boundary_coordinates = e.layer.toGeoJSON().geometry.coordinates[0]
            setBoundry(e.layer.toGeoJSON().geometry.coordinates[0])

            const transformedBoundary = transform_LngLat_To_LatLng(boundary_coordinates);
            const center = calculateFieldCenter(boundary_coordinates);
            const shape = e;

            shape.layer.on("pm:edit", (e) => {
                setBoundry(e.layer.toGeoJSON().geometry.coordinates[0])
                const event = e;
            });

            const popupContent = document.createElement("div");
            const titleParagraph = document.createElement("p");
            titleParagraph.textContent = `Field Name:`;
            titleParagraph.classList.add("FarmNameTitle");
            popupContent.appendChild(titleParagraph);

            const fieldameInput = document.createElement("input");
            fieldameInput.placeholder = "Enter Field Name";
            fieldameInput.classList.add("inputFarmName");
            popupContent.appendChild(fieldameInput);

            const doneButton = document.createElement("button");
            doneButton.textContent = "Add Field";
            doneButton.classList.add("SubmitNewFarm");
            doneButton.addEventListener("click", () => {
                const fieldName = fieldameInput.value;
                NewFieldHandler(fieldName, center, transformedBoundary);
                e.layer.closePopup();
            });
            popupContent.appendChild(doneButton);

            e.layer.bindPopup(popupContent).openPopup();
        }
        );

        return () => {
            leafletContainer.pm.removeControls();
            leafletContainer.pm.setGlobalOptions({ pmIgnore: true });

        };
    }, [context]);


    const transform_LngLat_To_LatLng = (coordinates) => {
        const transformed_Boundary = coordinates.map((coordinate) => [coordinate[1], coordinate[0]]);
        return transformed_Boundary
    };

    const calculateFieldCenter = (boundry) => {
        let sumLat = 0;
        let sumLng = 0;

        for (const coordinate of boundry) {
            sumLat += coordinate[1];
            sumLng += coordinate[0]; 
        }
        const centerLat = sumLat / boundry.length;
        const centerLng = sumLng / boundry.length;

        return { lat: centerLat, lng: centerLng };
    }


    const NewFieldHandler = async (name, center, bound) => {

        try {
            const create_field = await fetch('/alfalfa/' + props.FarmID + '/field/create?token=' + token, {
                method: 'POST',
                body: JSON.stringify({
                    name: name,
                    lat: center.lat,
                    lon: center.lng,
                    boundary_path: JSON.stringify(bound),
                }),
                headers: {
                    "Content-type": "application/json",
                    "Authorization": 'Bearer ' + token
                }
            });
            const newField = await create_field.json()
            if (newField == null) {
                navigate(`/${props.FarmID}/fields`,
                {
                    state: { farmID: props.FarmID,
                             farmLat: props.FarmLat,
                             farmLon: props.FarmLon }
                })
                
                return (
                    <div className='loading'>
                        <div >Loading ....</div>
                    </div>
                )
            }
        } catch (error) {
            console.log(error)
        }
    }

    return null;
};


