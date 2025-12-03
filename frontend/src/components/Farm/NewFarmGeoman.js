import { useEffect } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import useToken from "../Authentication/hooks/useToken";
import L from 'leaflet';
import "leaflet/dist/leaflet.css"; 
import './NewFarmGeoman.css'
import { useNavigate } from "react-router-dom";



export const NewFarmGeoman = (props) => {
    const token = useToken()
    const navigate = useNavigate();
    const context = useLeafletContext();

    useEffect(() => {
        const leafletContainer = context.layerContainer || context.map;

        leafletContainer.pm.addControls({
            drawMarker: true,
            drawPolyline:false,
            drawRectangle:false,
            drawPolygon:false,
            drawCircle:false,
            drawCircleMarker:false,
            drawText:false,
            editControls: false,
        });

        const customMarkerIcon = L.icon({
            iconUrl: 'https://www.clker.com/cliparts/l/g/L/A/A/C/blue-marker-black-border-fit.svg',
            iconSize: [40, 65],
            iconAnchor: [16, 32], 
        });

        leafletContainer.pm.enableDraw('Marker', {
            markerStyle: {
                icon: customMarkerIcon,
                opacity: 1,
                draggable: true,
                pmIgnore: true, // Add this option to ignore Geoman default message
            }
        });

        leafletContainer.pm.disableDraw('Marker');


        leafletContainer.on("pm:create", (e) => {
            const [lng, lat] = e.layer.toGeoJSON().geometry.coordinates;

            const popupContent = document.createElement("div");
            const titleParagraph = document.createElement("p");
            titleParagraph.textContent = `Farm Name:`;
            titleParagraph.classList.add("FarmNameTitle"); 
            popupContent.appendChild(titleParagraph);

            const farmNameInput = document.createElement("input");
            farmNameInput.placeholder = "Enter Farm Name";
            farmNameInput.classList.add("inputFarmName");
            popupContent.appendChild(farmNameInput);

            const doneButton = document.createElement("button");
            doneButton.textContent = "Add Farm";
            doneButton.classList.add("SubmitNewFarm"); 
            doneButton.addEventListener("click", () => {
                const farmName = farmNameInput.value;
                NewFarmHandler(farmName, lng, lat);
                e.layer.closePopup();
            });
            popupContent.appendChild(doneButton);
          
            // Set the popup content
            e.layer.bindPopup(popupContent).openPopup();
            leafletContainer.pm.disableDraw("Marker");
        }
        );

        return () => {
            leafletContainer.pm.removeControls();
            leafletContainer.pm.setGlobalOptions({ pmIgnore: true });

        };
    }, [context]);


    const NewFarmHandler = async (farmName, Lng, Lat) => {
        try {
            const create_farm = await fetch('/alfalfa/farm/create?token=' + token , {
                method: 'POST',
                body: JSON.stringify({
                    name: farmName,
                    lon: Lng, 
                    lat: Lat, 
                }),
                headers: {
                    "Content-type": "application/json",
                    "Authorization": 'Bearer ' + token
                }
            });
            const newField = await create_farm.json()
            if (newField == null) {
                navigate("/farm/")
              }
        } catch (error) {
            console.log(error)
        }
    }


    return null;
};


