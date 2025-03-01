import React from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css'; 

const Breadcrumb = ({ items }) => {
  return (
    <nav>
      <ul className="breadcrumb">
        {items.map((item, index) => (
          <li key={index}>
            {index === items.length - 1 ? (
                <span>
              <span className="breadcrumb-divider">{'>'}</span> 
              <span className="breadcrumb-text" onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>{item.label}</span>
              </span>
            ) : (   
            <Link to={item.link} state={item.state}>
              {index === 0 && <i className="fa fa-home" />} 
              {index !== 0 && index < items.length -1 && <span className="breadcrumb-divider">{'>'}</span>}
              {index !== 0 && <i className="fa fa-folder" />}
              <span className="breadcrumb-text" onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>{item.label}</span>
            </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
