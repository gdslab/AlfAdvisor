import React, { useState, useEffect } from 'react';


const ProcessingComponent = () => {
    const [dots, setDots] = useState('');
  
    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => (prev.length < 3 ? prev + '.' : ''));
      }, 500); // Update every 500ms
  
      return () => clearInterval(interval); // Clean up on unmount
    }, []);
  
    return (
      <div className="processing">Processing{dots}</div>
    );
  };


export default ProcessingComponent;