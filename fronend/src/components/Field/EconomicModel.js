import './EconomicModel.css';
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart, registerables, CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import MCchart from "../Charts/MCchart";
import DryRateChart from "../Charts/DryRateChart";
import 'chartjs-adapter-date-fns';

Chart.register(annotationPlugin,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function EconomicModel({ YQdata, latitude, longitude }) {
  const YQ_data = YQdata
  const [market, setMarket] = useState('sell');
  const [milkPrice, setMilkPrice] = useState(0);
  const [tedding, setTedding] = useState('no');
  const [initialMoisture, setInitialMoisture] = useState(90);
  const [targetMoisture, setTargetMoisture] = useState(10);
  // const location = useLocation();
  // const selectedField = location.state?.coordinates;
  const lat = latitude;
  const lon = longitude;
  console.log('this is longitude', latitude)
  console.log('this is longitude', longitude)
  const [isVisible, setIsVisible] = useState(false);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [data, setData] = useState({
    dryData: [],
    TDM : [],
    RFV : [],
    expPrecip: [],
    netRev: []
  });

  // Define the function to fetch data
  const DryingRateHandler = async () => {
    try {
      const response = await fetch('/alfalfa/EconomicModel/EconomicModel/', {
        method: 'POST',
        body: JSON.stringify({
          time_zone: timeZone,
          latitude: lat,
          longitude: lon,
          initial_moisture: initialMoisture,
          target_moisture: targetMoisture,
          market: market,
          tedding: tedding,
          milk_price: milkPrice,
          YQ_data: YQ_data
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      setData({
        dryData: responseData.dryData,
        TDM: responseData.total_dry_matter.flatMap(item => [item, item]),
        RFV : responseData.relative_feed_value,
        expPrecip: responseData.expPrecip,
        netRev: responseData.netRev
      });

      setIsVisible(true)
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    DryingRateHandler();
  }, []);

  const labels = Array.from({ length: 14 }, (_, i) => `Day ${Math.floor(i / 2) + 1}, ${i % 2 === 0 ? 'AM' : 'PM'}`);

  const dryDataAndPrecipData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Expected Precipitation',
        data: data.expPrecip,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      },
      {
        type: 'line',
        label: 'Drying Rate',
        data: data.dryData,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y1'
      }
    ]
  };

  const yieldAndNetRevData = {
    labels,
    datasets: [
      {
        label: 'Yield',
        data: data.TDM,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: false,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Net Revenue',
        data: data.netRev,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    scales: {
      y: { type: 'linear', display: true, position: 'left' },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } },
    },
  };

  return (
    <div className="EconomicModel">
      <div className="box-heading"> Run Economic Model </div>
      <div className="input-group">
        <label>Market:</label>
        <select value={market} onChange={e => setMarket(e.target.value)}>
          <option className='option' value="sell">Sell</option>
          <option value="feed">Feed</option>
        </select>
      </div>

      {market === 'feed' && (
        <div className="input-group">
          <label>Milk Price ($):</label>
          <input
            type="number"
            value={milkPrice}
            onChange={e => setMilkPrice(e.target.value)}
            placeholder="Enter milk price"
          />
        </div>
      )}

      <div className="input-group">
        <label>Tedding:</label>
        <select value={tedding} onChange={e => setTedding(e.target.value)}>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      <div className="inputDryRate">
        <div className="labels">
          <label>Initial Moisture Content(%):</label>
          <input
            type="number"
            value={initialMoisture}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue >= 0 && inputValue <= 100) {
                setInitialMoisture(inputValue);
              }
            }}
          />
        </div>

        <div className="labels">
          <label>Target Moisture Content(%):</label>
          <input
            type="number"
            value={targetMoisture}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue >= 0 && inputValue <= 100) {
                setTargetMoisture(inputValue);
              }
            }}
          />
        </div>

        {initialMoisture && targetMoisture ? (
          <button className="submit-btn" onClick={DryingRateHandler}>Show Results</button>
        ) : (
          <button className="submit-Not-Active">Show Results</button>
        )}
      </div>
      {isVisible && (
        <div className="graphs" >
          <h2>Dry Data and Expected Precipitation</h2>
          <Bar options={options} data={dryDataAndPrecipData} />
          <h2>Yield and Net Revenue</h2>
          <Bar data={yieldAndNetRevData} options={options} />
        </div>
      )}
    </div>
  );
}

export default EconomicModel;


