import React, { useEffect, useState } from 'react'
import useToken from '../Authentication/hooks/useToken';
import jwt from 'jwt-decode'
import './Farm.css';
import { Link } from 'react-router-dom';
import Popup from '../Popup';

const deffarm = [
    { id: null, lat: null, lon: null, field_name: null },
]

export const Farm = (props) => {
    const [farm, setFarm] = useState(deffarm)
    // const [newFarm, setNewFarm] = useState("")
    // const [success, setSuccess] = useState(null)
    // const [buttonPopup, setButtonPopup] = useState(false)
    const token = useToken();


    const farmHandler = async (e) => {
        const response = await fetch('/alfalfa/farm/read/?token=' + token, {
            method: 'GET',
            headers: {
                "Content-type": "application/json",
                "Authorization": 'Bearer ' + token
            },
        }
        );
        const farm = await response.json();
        setFarm(farm);
    }

    const DeleteFarmHandler = async (event) => {
        try {
            const deleteFarm = await fetch('/alfalfa/farm/' + event + '/delete?token=' + token,{
                method: 'DELETE',
                headers: {
                    "Content-type": "application/json",
                    "Authorization": 'Bearer ' + token
                },
            });
            const delete_farm = await deleteFarm.json();
            
            if (deleteFarm.ok) {
                // Refresh the page after successful deletion
                window.location.reload();
              }
        }catch (error) {
            console.log(error);
        }
    };


    useEffect(() => {
        farmHandler()
    },[])

    return (
        <div>
            <div className="FarmTable">
                <tbody>
                <tr>
                    <th className='header'>#</th>
                    <th className='header'>Name</th>
                    <th className='header'></th>
                    <th className='header'>Action</th>
                    <th className='header'></th>
                </tr>
                    {farm.map((val, key) => (
                        <tr key={key}>
                            <td>{key + 1}</td>
                            <td className='item'>{val.name}</td>
                            <td><Link to={`/${val.id}/fields`} state={{farmName: val.name, farmID: val.id, farmLat: val.lat, farmLon: val.lon}}><button className='btn btn-open'>Open</button></Link></td>
                            <td><Link to={`/farm/${val.id}/edit`} state={{farmName: val.name, farmID: val.id, farmLat: val.lat, farmLon: val.lon}}><button className='btn btn-edit'>Edit</button></Link></td>
                            <td><button className='btn btn-delete' onClick={(e) => DeleteFarmHandler(val.id)}>Delete</button></td>
                        </tr>
                    ))
                    }
                </tbody>
            </div>
            <a href='/newFarm/' ><button className='new-farm'> Add Farm</button> </a> 
            {/* <button className='new-farm' onClick={() => setButtonPopup(true) }> New Farm</button> */}
            {/* <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
                <h3>Creating New Farm</h3>
                <div className='box-name' > Farm Name: </div>
                <input className='input-name' onChange={(e) => setNewFarm(e.target.value)}></input>
                <div className='success' > { success ? "Farm " + newFarm + " is created!" : "" } </div>
                <button className='farm-submit' onClick={NewFarmHandler}> Create </button>
            </Popup> */}
        </div>
    )
}



