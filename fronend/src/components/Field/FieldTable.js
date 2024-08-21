import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import useToken from '../Authentication/hooks/useToken';
import './FieldTable.css';
import Popup from '../Popup';
import { useLocation } from 'react-router-dom';

const deffield = [
    { id: null, name: null, lat: null, lng: null, boundary_path: null },
]

export default function FieldTable(props) {
    const [field, setField] = useState(deffield)
    const token = useToken();
    const farm_id = props.id
    const farm_name = props.name
    const farm_latitude = props.lat
    const farm_longitude = props.lon

    const [buttonPopup, setButtonPopup] = useState(false)
    const [newFieldName, setNewFieldName] = useState("")

    const fieldHandler = async (e) => {
        const response = await fetch('/alfalfa/' + farm_id + '/field/read/?token=' + token, {
            method: 'GET',
            headers: {
                "Content-type": "application/json",
                "Authorization": 'Bearer ' + token
            },
        }
        );
        const field = await response.json();
        setField(field);
    }

    const DeleteFieldHandler = async (fieldID) => {
        try {
            const deleteFarm = await fetch('/alfalfa/' + farm_id + '/field/' + fieldID + '/delete?token=' + token, {
                method: 'DELETE',
                headers: {
                    "Content-type": "application/json",
                    "Authorization": 'Bearer ' + token
                },
            });
            const delete_farm = await deleteFarm.json();
            if (deleteFarm.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fieldHandler();
    }, []);

    return (
        <div>
            <div className="FieldTable">
                <tbody>
                    <tr>
                        <th className='field-header'>#</th>
                        <th className='field-header'>Name</th>
                        <th className='field-header'></th>
                        <th className='field-header'>Action</th>
                        <th className='field-header'></th>
                    </tr>
                    {field.map((val, key) => (
                        <tr key={key}>
                            <td>{key + 1}</td>
                            {/* <td>{props.name}</td> */}
                            <td>{val.name}</td>
                            <td><Link to={`/${farm_id}/field/${val.id}`} state={{farmID: farm_id, farmName:farm_name, id: val.id, name: val.name, fieldLat: val.lat, fieldLon: val.lon, coordinates: val.boundary_path }}><button className='field-btn btn-open'>Open</button></Link></td>
                            <td><Link to={`/${farm_id}/field/${val.id}/edit`} state={{ farmID: farm_id, id: val.id, name: val.name, Lat:val.lat, Lon:val.lon, coordinates: val.boundary_path }}><button className=' field-btn btn-edit'>Edit</button></Link></td>
                            <td><button className='field-btn btn-delete' onClick={(e) => DeleteFieldHandler(val.id)}>Delete</button></td>
                        </tr>
                    ))
                    }
                </tbody>
            </div>
            <button className='new-field' onClick={() => setButtonPopup(true)}> Add Field</button>
            <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <div className='new-field-title'>Creating New Field</div>
                <div className='new-field-button-container'>
                    <Link to={`/${farm_id}/newField/Draw`} state={{  farmID: farm_id, farmLat: farm_latitude, farmLon: farm_longitude }}> <button className='draw-field'> Draw on the map </button></Link>
                    <Link to={`/${farm_id}/newField/Upload`} state={{  farmID: farm_id, farmLat: farm_latitude, farmLon: farm_longitude }}> <button className='upload-field'> Upload shapefile </button></Link>
                </div>
            </Popup>
        </div>
    )
}





