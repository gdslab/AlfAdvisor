import React from 'react';
import classes from './DocumentationYQ.module.css';

import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

const Documentation_EconomicModel = () => {
    return (
        <div className={classes.documentation}>
            <h1>Economic and Drying Rate Model Documentation</h1>
            <p>
                This documentation outlines how the economic model and drying model function within the Alfadvisor web application. The drying model is included because drying rates influence the economic recommendations for alfalfa harvest.
                </p>

                <p>
                In Alfadvisor, a farmer begins by specifying the field where their alfalfa is grown. The application creates a raster of 30×30 meter pixels across that field. It then queries and combines the latest available optical imagery from the Sentinel-1, Sentinel-2, Landsat, and PlanetScope satellite constellations. These data, together with air temperature, serve as inputs to a random forest machine learning model. The model predicts, per pixel, the following variables: yield (kg/m²), crude protein (CP, % DM), neutral detergent fiber (NDF, % DM), acid detergent fiber (ADF, % DM), and neutral detergent fiber digestibility (NDFD, % NDF). Projections are generated for the current day plus six additional days, covering a total seven-day horizon.
                </p>

                <p>
                Alfadvisor uses these yield and quality estimates to calculate forage value via the Milk2016 calculation (Undersander, 2016), expressed in cwt of milk. The application can also estimate an economic return if the alfalfa is sold as hay on the market, based on a computed Relative Feed Value (RFV). While the Milk2016 approach calculates milk production from forage on a per-pixel basis and then sums across the field, the market-based approach uses a single, field-wide RFV. This is derived by aggregating pixel-level ADF and NDF values (weighted by their dry-matter yield) to obtain one RFV for the entire harvest area.
                </p>

                <p>
                Both the RFV and milk-from-forage calculations are performed for each day within the seven-day window. The farmer’s input prices are applied to estimate revenue from either selling hay or feeding cows for milk production. If the farmer omits prices or RFV thresholds, Alfadvisor falls back on default values. Expected losses from rain events and tedding operations are factored in as percentage reductions. The results are not intended as exact revenue predictions but rather to highlight the relative economic outcomes of different cutting dates.
                </p>

                <p>
                For weather data, Alfadvisor retrieves a ten-day, hourly forecast from the National Oceanic and Atmospheric Administration (NOAA) using the Open-Meteo API. Forecast variables include two-meter air temperature (<em>T<sub>h</sub></em>, °C), soil moisture (<em>SM<sub>h</sub></em>, % dry basis), solar insolation (<em>SI<sub>h</sub></em>, W/m²), expected precipitation (mm), and probability of precipitation (%). From these, Alfadvisor calculates the hourly drying rate (<em>DR<sub>h</sub></em>) for both tedded and untedded hay over the ten-day period. The drying rate equation is based on the work of Rotz and Chen (1985).
                </p>

            <p className={classes.equation}>
            <BlockMath math={'\\text{DR}_h = \\frac{\\text{SI} + 5.42\\,T_h}{66.4\\,\\text{SM}_h + \\text{SD}\\bigl(2.06 - 0.97\\,1_{(\\mathrm{DAY}=1)}\\bigr)\\,1.55 + 3037}'} />
            </p>
            <p>
            Equation 1 is adapted from equation [4] of Rotz and Chen (1985) by assuming the application rate (AR) of chemical conditioner is zero and the dry bulb temperature equals the two-meter air temperature (DB = T). The swath density (SD, g/m2) is calculated as the dry matter yield if the hay is tedded, and twice the dry-matter yield if it is not tedded. 
            We interpret this estimated rate as the drying rate when there is no precipitation and assume, when there is precipitation, the drying rate is zero. This allows us to use the hourly probability of precipitation (P_h [R]) to calculate the expected dry down for each hour using a probability weighted rate equation adapted from equation [2] in Rotz and Chen (1985).
            </p>

            <div className={classes.equation}>
                <BlockMath math={'E[M_{h+1}] = M_h\\bigl((1 - P_h [R])\\,e^{-DR_h} + P_h [R]\\bigr)'} />
            </div>

            <p>
            The expected dry down over a multiple hour period (t) is then calculated as:
            </p>
            
            <div className={classes.equation}>
                <BlockMath math={'E[M_{t+1}] = M_t \\prod_{h \\in t} \\bigl((1 - P_h [R])\\, e^{-DR_h} + P_h [R]\\bigr)'} />
            </div>

            <p>
            In this formulation, equation 2 is applied in a loop starting at the cutting time (assumed to be 8 a.m. for morning harvests and 12 p.m. for afternoon harvests) until the moisture content reaches the target moisture provided as input by the farmer. The number of hours it takes to reach the target moisture is the drying window. 
            Moisture content values used in these equations are on a dry basis (M_db). For initial versions of the program, we assume a starting moisture content of 300 percent dry basis (equal to 75 percent wet basis). Farmers generally use wet basis values (M_wb). The user’s target moisture content will be taken as input in percent wet basis and converted to dry basis with the following equation.
            </p>

            <p className={classes.equation}>
                <BlockMath math = {'M_{\\text{db}} = \\frac{M_{\\text{wb}}}{1 - M_{\\text{wb}}}'} />
            </p>

            <p>
            Once the drying window is determined, the NOAA data is used to calculate the total expected rain in the drying window. The expected rain is calculated as the sum of the expected rain for each hour over the drying window. 
            </p>
            

            <div className={classes.heading2}>Providing Cutting Recommendations</div>
            <p>
            The goal of the Alfadvisor application is to provide farmers with improved information to aid with optimizing their cutting decision over the short horizon. To this end, the application will provide for each half day over the seven-day horizon (1) the expected value of a cutting taken on that day after losses from rain and added costs from management (as dollars from milk when used as feed or as dollars from direct sale), (2)  the expected Relative Feed Value of the cutting, (3) the total expected amount of rain in the drying window, and (4) the probability of rain in the drying window. 
            In this version of the program, the probability of rain does not factor into the expected yields. The program assumes there is some threshold of acceptable precipitation in the drying window. For days where cutting would lead to a drying window with precipitation that exceeds the threshold, a warning is returned for that day to discourage cutting. In this formulation, the optimal cutting day is then the day with the highest expected value of hay that does not have rain exceeding the threshold in the drying window. When there is expected rain in the drying window, losses from rain are included in the expected value. However, currently the program does not extend the drying window due to rewetting. Future improvements to the application should consider rewetting. 
            </p>

            <div className={classes.heading2}>Functions</div>
            <p>The following functions are used to carry out the calculations discussed above.</p>

            {/* --- Inserted Text Starts --- */}
      <p>
        <strong>TDM Calculation:</strong> takes as input the dry matter yield in kilograms per square meter and the pixel area in square meters. It uses the values to calculate and return the total short tons of dry matter for the pixel.
      </p>
      <p>
        <strong>RFV Calculation:</strong> takes as input the acid detergent fiber (ADF) and neutral detergent fiber (NDF) of the alfalfa as determined by the ML yield-quality model and returns the relative feed value (RFV) for the hay.
      </p>
      <p>
        <strong>Field TDM Calculation:</strong> takes as input the data frame with the yield and quality data and the pixel area. It uses the yield data for each pixel and the <em>TDM_calc</em> function to calculate the tons of dry matter in each pixel and sums over all pixels to return the total TDM of hay in the harvested area.
      </p>
      <p>
        <strong>Field RFV Calculation:</strong> takes the data frame with the yield and quality data as input and calculates a weighted average of the relative feed value for the whole field using the <em>RFV_calc</em> function. The weighted average RFV for the field is returned.
      </p>
      <p>
        <strong>Milk TDM Calculation:</strong> takes as input the crude protein (CP), neutral detergent fiber (NDF), and the neutral detergent fiber digestibility (NDFD) and uses assumed values for other nutrient contents. These values are used in the Milk2016 calculation to determine the milk per ton of dry matter produced in pounds per TDM.
      </p>
      <p>
        <strong>Market Value:</strong> takes as input the RFV, TDM, and price of hay for each quality bracket and returns the expected revenues from selling the hay for a single pixel. The RFV quality brackets for hay at market are assumed to be poor quality if RFV is less than 124, good quality if RFV is between 124 and 150, and premium quality if RFV is greater than 150. Prices are provided by the farmer.
      </p>
      <p>
        <strong>Feed Value:</strong> takes as input the CP, NDF, NDFD, TDM, and price of milk ($/cwt), uses the <em>milkTDM_calc</em> function to calculate the milk produced, and returns the expected revenues for a pixel of harvested hay from milk production after feeding the hay to a lactating cow.
      </p>
      <p>
        <strong>Total Milk Value Calculation:</strong> takes the data frame with the yield and quality data and the price of milk ($/cwt) and calculates the revenue from milk for each pixel using the <em>feed_value</em> function and sums over all pixels to get the total revenues from milk for the harvested area.
      </p>
      <p>
        <strong>Total Market Value:</strong> takes the data frame with the yield and quality data and a vector of hay prices for each RFV quality bracket, uses the <em>RFV_calc</em> function to get the RFV for each pixel then calculates the weighted average RFV for the field. The <em>market_value</em> function is then used to get the revenues from each pixel at the average RFV of the field and these values are summed to get total revenue from selling the harvested hay.
      </p>
      <p>
        <strong>Drying Rate Calculation:</strong> takes as input the soil moisture, the solar radiation, the temperature, a Boolean equal to 1 if the farmer plans to ted, the dry matter yield, and the cut time as input. These values are used to calculate the drying rate for each hour.
      </p>
      <p>
        <strong>Hour Drydown Calculation:</strong> takes as input the initial moisture content of the hay, the drying rate for a single hour, and the probability of precipitation and calculates and returns the decrease in moisture content of the hay over the hour. It is assumed that if it rains, the dry down for that hour is 0.
      </p>
      <p>
        <strong>Drying Window Calculation:</strong> takes as input the initial moisture content of the hay, the drying rate for a single hour, the probability of precipitation, the cut time, and the target moisture content. It uses the <em>hour_drydown_calc</em> function to calculate the drydown in each hour and stops when it reaches the target moisture. It returns the time when the target moisture is reached.
      </p>
      <p>
        <strong>Expected Precip Calculation:</strong> takes as input the cut time, the collection time, and a vector of expected precipitation for each hour and returns the total expected precipitation over the drying window.
      </p>
      <p>
        <strong>Daily Drying Window Calculation:</strong> takes as input the starting moisture content, the soil moisture, the solar radiation, the temperature, the yields, the hourly precipitation, the probability of precipitation, the target moisture, and the Boolean equal to 1 if the farmer will ted. It uses the <em>drying_rate_calc</em>, <em>drying_window_calc</em>, and <em>expected_precip_calc</em> functions to calculate and return the drying window and expected precipitation in the drying window for cutting the alfalfa on each half day over the 7-day horizon. It thus returns 14 values in each vector representing the values for a cut at 8 AM and a cut at noon on each day.
      </p>

      {/* --- Reference Section --- */}
      <div className={classes.heading2}> References</div>
      <ul>
        <li>
          Rotz, C. A &amp; Yi Chen. (1985). Alfalfa Drying Model for the Field Environment.
          <i>Transactions of the ASAE, 28(5)</i>, 1686–1691. 
          <a href="https://doi.org/10.13031/2013.32500">https://doi.org/10.13031/2013.32500</a>
        </li>
        <li>
          Undersander, D., Combs, D., &amp; Shaver, J. R. (2016). 
          <i> Milk2016: Combining Yield and Quality into a Single Term.</i> 
          University of Wisconsin Madison Extension.
        </li>
      </ul>

            
        </div>
    );
};

export default Documentation_EconomicModel;
