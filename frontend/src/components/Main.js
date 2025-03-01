import React from 'react';
import './Main.css'
import './Images/Yield.jpg'

const Page = () => {
    return (
        <>
            <div style={{ color: 'black' }}>
                <h1 className='heading'>Welcome to web-based cyber-platform to estimate alfalfa
                    yield and quality to support harvest scheduling</h1>
                <div style={{ display: 'flex' }}>
                    <div className='intro'> This is a free public cyberplatform (AlfAdvisor) which will provide alfalfa
                        growers with economically optimum harvesting recommendations. The platform will
                        include explicit consideration of alfalfa growth and quality changes,
                        drying rates and weather-related risks incurred during harvest.
                        <h3 className='title'>Objectives</h3>
                        <h4>Objective 1:</h4>
                        <p> Develop models to estimate alfalfa yield, quality and drying rate in real-time
                            by combining satellite imagery and environmental factors to inform harvesting time.
                        </p>
                        <h4>Objective 2:</h4>
                        <p>Develop a decision-making model to provide economically optimum harvest
                            scheduling during the growing season.</p>
                        <h4>Objective 3:</h4>
                        <p> Create a web-based cyber-platform to disseminate tools for free public use</p>
                    </div>
                    <img className='image' src="https://cms-static.wehaacdn.com/hayandforage-com/images/Screen-Shot-2023-02-09-at-9-59-45-AM__1.6455.jpg" alt="yield" />
                </div>
            </div>
            <div className='image'>
                <p> HeLLo</p>

            </div>
        </>
    );
}

export default Page;