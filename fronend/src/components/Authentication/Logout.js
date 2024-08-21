import React from 'react'
import { Link, redirect } from 'react-router-dom'

const Logout = () => {
    const removeHndler = () =>{
        localStorage.removeItem('Token');
        localStorage.removeItem('FirstName');
        localStorage.removeItem('LastName');
    }
    
  return (<a href='/' onClick={removeHndler}>Logout</a>);
}

export default Logout;
