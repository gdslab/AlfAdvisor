import React from 'react'
import { Link, redirect } from 'react-router-dom'
import classes from '../NavigationBar.module.css'

const Logout = () => {
    const removeHndler = () =>{
        localStorage.removeItem('Token');
        localStorage.removeItem('FirstName');
        localStorage.removeItem('LastName');
    }
    
  return (<a href='/' onClick={removeHndler} className={classes.navLink}>Logout</a>);
}

export default Logout;
