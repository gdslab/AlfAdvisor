import React from 'react';
import classes from './DocumentationYQ.module.css';

import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

import flowchartImage from './Images/flowchart.png';
import satelliteModelPerformanceImage from './Images/satellite_model_performance.png';
import temperatureModelPerformanceImage from './Images/temperature_model_performance.png'

const Documentation_yieldQuality = () => {
    return (
        <div className={classes.documentation}>
            <h1>Web-Based Alfalfa Yield and Quality Prediction</h1>

            <div className={classes.heading2}>1. Model Flowchart</div>
            <p>
            Real-time alfalfa yield and quality traits are predicted by integrating two satellite-based models and an air-temperature (Ta) driven model. Two satellite-based models include one from Sentinel-1 and the other from Sentinel-2.
            Multisource satellite data are employed here because improved observation frequency can be obtained compared to a single sensor. Real-time Ta data are used in the Ta-driven model.
            Note that all Sentinel-1 and clear-sky Sentinel-2 satellite data within a gap of &le; 6 days are employed to predict alfalfa yield/quality on the query date. On the other hand, if Sentinel-1 and clear-sky Sentinel-2 data are unavailable within a gap of &le; 6 days, a Ta-driven algorithm is employed.
            
            Figure 1 presents a flowchart of web-based alfalfa monitoring. There are generally four cases:
            <ul>
            <li>Only Sentinel-1 data</li>
            <li>Only Sentinel-2 data</li>
            <li>Sentinel-1 and Sentinel-2 data</li>
            <li>No satellite data</li>
            </ul>
            </p>


            <div className={classes.figure}>
                <img src={flowchartImage} alt="Flowchart of web-based alfalfa monitoring" />
                <p className={classes.figcaption}>Figure 1. Flowchart of web-based alfalfa monitoring.</p>
            </div>

            <div className={classes.heading2}>1.1	Flowchart descriptions</div>
            <ol>
                <li>Farmer enters the inquiry date (<strong>T<sub>0</sub></strong>).</li>
                <li>
                    Compare the inquiry date and today’s date (<strong>&Delta;T<sub>m</sub> = T<sub>0</sub> – today’s date</strong>): if <strong>&Delta;T<sub>m</sub></strong> is greater than six, throw a reminder because this tool only predicts alfalfa yield/quality within the next six days; otherwise, go to the next step.
                </li>
                <li>Search all satellite data within six days, including Sentinel-1 and clear-sky Sentinel-2 data.</li>
                <li>
                If available satellite data are found, satellite-based models will be used to predict alfalfa yield/quality and there are three cases:
                    <ul>
                        <li><strong>Case I Only Sentinel-1:</strong>  
                        <p>Although Sentinel-1A has a nominal temporal resolution of 12-days, there may be multiple observations within six days due to overlapping area among adjacent tiles. In this case, Sentinel-1 data are used to predict alfalfa yield/quality. Multiple Sentinel-1 observations will generate multiple predictions, and the final predicted value is the average of multiple predictions.</p>
                        </li>
                        <li><strong>Case II Only Sentinel-2 data are available:</strong>
                        <p>There may be multiple Sentinel-2 observations within six days due to overlapped area and a spatial resolution of 5-days. In this case, Sentinel-2 data are used to predict alfalfa yield/quality. Multiple Sentinel-2 observations will generate multiple predictions, and the final predicted value is the average of multiple predictions.</p></li>
                        <li><strong>Case III Both Sentinel-1 and Sentinel-2 data are available: </strong>
                        <p>This case is a combination of cases I and II. Alfalfa yield/quality are first predicted using Sentinel-1 and Sentinel-2 data, respectively. The final predicted value is the average of predictions from both Sentinel-1 and Sentinel-2 data.</p></li>
                        <li><strong>Case IV No satellite data available:</strong>
                        <p>If satellite data cannot be found, a Ta driven model will be employed.</p></li>
                    </ul>
                </li>
            </ol>

            <div className={classes.heading2}>2. Data Sources</div>
            <p>The model integrates multiple datasets:</p>
            <ul>
                <li>
                    <strong>Sentinel-1 </strong> GRD data from Google Earth Engine: <a href="https://code.earthengine.google.com/">Google Earth Engine</a>
                </li>
                <li>
                    <strong>Sentinel-2 </strong> data from Harmonized Landsat Sentinel-2 (HLS) v2.0 product : <a href="https://search.earthdata.nasa.gov/search">Harmonized Landsat Sentinel-2 (HLS) v2.0</a>
                </li>
                <li>
                    <strong>Real-time 3-km Temperature (Ta) </strong> data from NOAA High Resolution Rapid Refresh (HRRR) model system : <a href="https://console.cloud.google.com/storage/browser/high-resolution-rapid-refresh">NOAA HRRR Model</a>
                </li>
            </ul>

            <div className={classes.heading2}>3. Modeling Details</div>
            <p>
            Satellite-based and Ta driven models are used together for predicting alfalfa yield/quality.
            </p>

            <div className={classes.heading2}>3.1. Satellite-Based Models: </div>
            <p>
            There are three cases, including only Sentinel-1 data; only Sentinel-2 data; Sentinel-1 and Sentinel-2 data.
            </p>

            <h4>3.1.1. Case I: Sentinel-1 Model</h4>
            <p>Sentinel-1 model is used in this case, and predictions from Sentinel-1 data are derived as follows:</p>
            <p className={classes.equation}>
                <BlockMath math={ '\\text{Prediction}_{S1} = f(\\text{Gap}, \\sigma_{VV}, \\sigma_{VH}, \\sigma_{VH - VV}, \\text{RVI}, \\text{Incidence Angle})'} />
            </p>
            <p>where:</p>
            <ul>
                <li>Prediction is predicted yield/quality from Sentinel-1 data.</li>
                <li>
                    σ<sub>VV</sub>, σ<sub>VH</sub>: Backscatter coefficients for the VV and VH polarization in dB.
                </li>
                <li>RVI: Radar Vegetation Index (Nasirzadehdizaji et al., 2019).</li>
                <li>Gap: Time difference between satellite image acquisition and query date.</li>
            </ul>

            <h4>3.1.2. Case II: Sentinel-2 Model</h4>
            <p>The Sentinel-2 model uses multiple vegetation indices:</p>
            <div className={classes.equation}>
                <BlockMath math={'\\text{Prediction}_{S2} = f(\\text{Gap}, \\text{NDVI}, \\text{EVI2}, \\text{NIRv}, \\text{NDWI}, \\text{RedE1}, \\text{RedE2}, \\text{RedE3}  \\text{Solar-viewing Angles})'} />
            </div>
            <p>where:</p>
            <ul>
                <li>NDVI: Normalized Difference Vegetation Index (Tucker, 1979).</li>
                <li>EVI2: Enhanced Vegetation Index 2 (EVI2) (Jiang et al., 2008).</li>
                <li>NIRv: Near-Infrared Reflectance of Vegetation (NIRv) (Badgley et al., 2017).</li>
                <li>NDWI: Normalized Difference Water Index (NDWI) (Gao, 1996).</li>
                <li>RedE1, RedE2, and RedE3 are three red edge reflectance of Sentinel-2</li>
                <li>Solar-viewing angles include solar zenith angle (SZA), solar azimuth angle (SAA), viewing zenith angle (VZA), and viewing azimuth angle (VAA)</li>
            </ul>

            <h4>3.1.3. Case III: Combined Sentinel-1 & Sentinel-2</h4>
            <p>In this case, Sentinel-1 and Sentinel-2 models are used together, and the final prediction is the average of predictions from both Sentinel-1 and Sentinel-2 data:</p>
            <p className={classes.equation}>
                <BlockMath math = {'\\text{Prediction} = \\frac{\\text{Prediction}_{S1} + \\text{Prediction}_{S2}}{2}'} />
            </p>

            <div className={classes.heading2}>4. Temperature (Ta) Driven Model</div>
            <p>
                When no satellite data is available, the model uses real-time temperature data. Daily minimum and maximum air temperature (Ta_min/Ta_max) data are used in a Ta driven model to predict alfalfa yield/quality. Then, alfalfa yield/ quality can be predicted as follows:
            </p>
            <p className={classes.equation}>
                <BlockMath math={'\\text{Prediction}_{Ta} = f(\\text{Ta}_{\\min},\\, \\text{Ta}_{\\max},\\, \\text{Gap})'} />
            </p>
            <p>where:</p>
            <ul>
                <li>Ta<sub>min</sub>: Minimum daily temperature.</li>
                <li>Ta<sub>max</sub>: Maximum daily temperature.</li>
                <li>Gap: Difference between query date and temperature data acquisition.</li>
            </ul>

            <div className={classes.heading2}>5. Performance of Satellite-based Model</div>
            <p>Figure A1 shows the validation results of predicted alfalfa yield and quality traits using combined Sentinel-1 and Sentinel-2 data, and it is observed that satellite-based models have reasonable accuracy in predicting yield, crude protein (CP), acid detergent fiber (ADF), neutral detergent fiber (NDF), and slow fiber digestibility (NDFD).</p>

            <div className={classes.figure}>
                <img src={satelliteModelPerformanceImage} alt="Satellite-based model performance" />
                <p className={classes.figcaption}>
                    Figure A1. 10-fold cross-validation results of satellite-based models using Sentinel-1 and Sentinel-2 data.
                </p>
            </div>

            <div className={classes.heading2}>6. Performance of of Ta Driven Model</div>
            <p>Figure A2 shows the validation results from a Ta driven model, and the results show that alfalfa yield and quality traits are predicted with acceptable accuracy. Because spatio-temporally continuous Ta can be derived from NOAA HRRR data. It means that a field sample will generate seven modeling samples for developing Ta driven model when the gap is set to less than 6-days. Thus, the final sample number is 4,053 (N = 579 × 7).</p>

            <div className={classes.figure}>
                <img src={temperatureModelPerformanceImage} alt="Temperature-based model performance" />
                <p className={classes.figcaption}>
                    Figure A2. 10-fold cross-validation results of a Ta driven model for predicting alfalfa yield and quality traits.
                </p>
            </div>

            <div className={classes.heading2}>7. References</div>
            <ul>
                <li>
                    Badgley, G., Field, C.B., &amp; Berry, J.A. (2017). Canopy near-infrared reflectance and terrestrial photosynthesis. <i>Science Advances, 3(3)</i>, e1602244.
                </li>
                <li>
                    Gao, B.-C. (1996). NDWI—A normalized difference water index for remote sensing of vegetation liquid water from space. <i>Remote Sensing of Environment, 58(3)</i>, 257-266.
                </li>
                <li>
                    Jiang, Z., Huete, A., Didan, K., &amp; Miura, T. (2008). Development of a two-band enhanced vegetation index without a blue band. <i>Remote Sensing of Environment, 112(10)</i>, 3833-3845.
                </li>
                <li>
                    Nasirzadehdizaji, R., et al. (2019). Sensitivity analysis of multi-temporal Sentinel-1 SAR parameters to crop height and canopy coverage. <i>Applied Sciences, 9(4)</i>, 655.
                </li>
                <li>
                    Tucker, C.J. (1979). Red and photographic infrared linear combinations for monitoring vegetation. <i>Remote Sensing of Environment, 8(2)</i>, 127-150.
                </li>
            </ul>
        </div>
    );
};

export default Documentation_yieldQuality;
