import React from 'react'

export default function ProgressBar(props) {
    const progressBarStyle = {
        width: `${props.percentage}%`,
        backgroundColor: '#4caf50',
        borderRadius: '5px',
        transition: 'width 0.3s',
        height: '100%',
      };

  return (
    <div style={{ width: '100%', height: '30px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
      <div style={progressBarStyle}></div>
    </div>
  )
}
