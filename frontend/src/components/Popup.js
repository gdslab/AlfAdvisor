import React from 'react'
import './Popup.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';


export default function Popup(props) {
  const closeHandler = async () => {
    props.setTrigger(false)
    window.location.reload();
  }

  return (props.trigger) ? (
    <div className='popup'>
      <div className='popup-inner'>
        <button className='close-btn' onClick={closeHandler} >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        {props.children}
      </div>
    </div>
  ) : "";
}
