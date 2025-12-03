import './EconomicModel.css';
import { useState } from "react";
import { Bar } from 'react-chartjs-2';
import { format, addDays } from 'date-fns';
import {
  Chart, CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
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

function EconomicModel({ YQdata, latitude, longitude, cuttingTime }) {
  const YQ_data = YQdata
  const cutTime = cuttingTime
  const [market, setMarket] = useState('sell');
  const [milkPrice, setMilkPrice] = useState(0);
  const [tedding, setTedding] = useState('no');
  const [initialMoisture, setInitialMoisture] = useState(90);
  const [targetMoisture, setTargetMoisture] = useState(10);
  const [plotKey, setPlotKey] = useState(0);
  const lat = latitude;
  const lon = longitude;
  const [isVisible, setIsVisible] = useState(false);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [data, setData] = useState({
    dryData: [],
    TDM: [],
    RFV: [],
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
        dryData: [...responseData.dryData],
        TDM: responseData.total_dry_matter.flatMap(item => [item, item]),
        RFV: [...responseData.relative_feed_value],
        expPrecip: [...responseData.expPrecip],
        netRev: [...responseData.netRev]
      });

      setPlotKey(prevKey => prevKey + 1)
      setIsVisible(true)
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const cut_day = Math.round((new Date(cutTime) - now.setHours(0, 0, 0, 0))/(1000 * 3600 * 24))

  const labels = [];
  const totalDays = 7;

  for (let i = 0; i < totalDays; i++) {
    const day = addDays(startDate, i);

    // Midnight (00:00)
    const midnightTime = new Date(day);
    midnightTime.setHours(0, 0, 0, 0);
    labels.push(midnightTime);

    // 8 AM
    const morningTime = new Date(day);
    morningTime.setHours(8, 0, 0, 0);
    labels.push(morningTime);

    // 12 PM
    const noonTime = new Date(day);
    noonTime.setHours(12, 0, 0, 0);
    labels.push(noonTime);
  }

  const expPrecipData = [];
  const dryData = [];

  // Assuming data.expPrecip and data.dryData have 14 data points (2 per day at 8 AM and 12 PM)
  let dataIndex = 0;

  for (let i = 0; i < labels.length; i++) {
    const labelDate = labels[i];
    const hour = labelDate.getHours();

    if (hour === 8 || hour === 12) {
      // At 8 AM or 12 PM, we have data
      expPrecipData.push(data.expPrecip[dataIndex]);
      dryData.push(data.dryData[dataIndex]);
      dataIndex++;
    } else if (hour === 0) {
      expPrecipData.push(null); // No precipitation data at midnight

      let prevData, nextData;

      // Handle the first midnight (no previous data)
      if (dataIndex === 0) {
        prevData = data.dryData[dataIndex]; // Use current data point
      } else {
        prevData = data.dryData[dataIndex - 1];
      }

      // Handle the last midnight (no next data)
      if (dataIndex >= data.dryData.length) {
        nextData = data.dryData[dataIndex - 1];
      } else {
        nextData = data.dryData[dataIndex];
      }

      const avgData = (prevData + nextData) / 2;
      dryData.push(avgData);
    }
  }

  const dryDataAndPrecipData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Expected Precipitation',
        data: expPrecipData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      },
      {
        type: 'line',
        label: 'Drying Time',
        data: dryData,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y1'
      }
    ]
  };

  const generateDailyAnnotations = () => {
    const annotations = {};
    const totalDays = 7; // Number of days
    let currentDate = new Date(startDate);

    for (let i = 0; i <= totalDays; i++) {
      const annotationDate = addDays(startDate, i);
      annotations[`annotation${i}`] = {
        type: 'line',
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        scaleID: 'x',
        value: annotationDate.getTime(),
      };
    }
    return annotations;
  };

  const dailyAnnotations = generateDailyAnnotations();

  const dryDataAndPrecipOptions = {
    // maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            let value = context.parsed.y;

            if (typeof value === 'number') {
              value = value.toFixed(2);
            }
            if (context.dataset.type === 'bar') {
              return `${label}: ${value} inch`;
            } else {
              return `${label}: ${value} days`;
            }
          },
        },
      },
      annotation: {
        annotations: dailyAnnotations,
      },
    },
    scales: {
      x: {
        type: 'time',
        offset: false,
        time: {
          unit: 'hour',
          stepSize: 12,
          displayFormats: {
            day: 'MMM d, h a',
          },
          tooltipFormat: 'MMM d, h a',
        },
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 40,
          source: 'data',
          callback: function (value, index, ticks) {
            const tickValue = ticks[index].value;
            const date = new Date(tickValue);
            const hour = date.getHours();
            if (hour === 0) {
              return format(date, 'MMM d');
            } else {
              return format(date, 'h a');
            }
          },
          font: function (context) {
            const date = new Date(context.tick.value);
            const hour = date.getHours();
            if (hour === 0) {
              return {
                weight: 'bold',
              };
            } else {
              return {};
            }
          },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Expected Precipitation (in)',
        },
        grid: {
          display: false,
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Drying Time (day)',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const YieldData = [];
  const NetRevData = [];
  let Index = 0;

  for (let i = 0; i < labels.length; i++) {
    const labelDate = labels[i];
    const hour = labelDate.getHours();

    if (hour === 8 || hour === 12) {
      // At 8 AM or 12 PM, we have data
      YieldData.push(data.TDM[Index]);
      NetRevData.push(data.netRev[Index]);
      Index++;
    } else if (hour === 0) {
      YieldData.push(null);

      let prevData, nextData;

      if (Index === 0) {
        prevData = data.netRev[Index];
      } else {
        prevData = data.netRev[Index - 1];
      }

      if (Index >= data.netRev.length) {
        nextData = data.netRev[Index - 1];
      } else {
        nextData = data.netRev[Index];
      }

      const avgData = (prevData + nextData) / 2;
      NetRevData.push(avgData);
    }
  }

  const yieldAndNetRevData = {
    labels,
    datasets: [
      {
        label: 'Yield',
        data: YieldData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.9)',
        fill: false,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Net Revenue',
        data: NetRevData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      }
    ]
  };

  const yieldAndNetRevOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            let value = context.parsed.y;

            if (typeof value === 'number') {
              value = value.toFixed(2);
            }

            if (context.dataset.label === 'Yield') {
              return `${label}: ${value} Ton`;
            } else {
              return `${label}: $${value}`;
            }
          },
        },
      },
      annotation: {
        annotations: dailyAnnotations,
      },
    },
    scales: {
      x: {
        type: 'time',
        offset: false,
        time: {
          unit: 'hour',
          stepSize: 4,
          displayFormats: {
            hour: 'MMM d, h a',
          },
          tooltipFormat: 'MMM d, h a',
        },
        ticks: {
          autoSkip: false,
          source: 'data',
          callback: function (value, index, ticks) {
            const tickValue = ticks[index].value;
            const date = new Date(tickValue);
            const hour = date.getHours();
            if (hour === 0) {
              return format(date, 'MMM d');
            } else {
              return format(date, 'h a');
            }
          },
          font: function (context) {
            const date = new Date(context.tick.value);
            const hour = date.getHours();
            if (hour === 0) {
              return {
                weight: 'bold',
              };
            } else {
              return {};
            }
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Yield of Dry Matter (Ton)',
        },
        grid: {
          display: false,
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Net Revenue ($)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
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
          <label>Milk Price ($/cwt):</label>
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
          <div style={{
              textAlign: 'center',
              fontSize: '1rem',  /* ~20 px */
              fontWeight: 600,
              marginTop: '2rem',
              marginBottom: '0.5rem',
              color: 'black'
            }} >Drying Time and Expected Precipitation</div>
          <Bar key={plotKey} options={dryDataAndPrecipOptions} data={dryDataAndPrecipData} />
          <div className="notification_advise">
            If you cut your hay at <strong>{cutTime}</strong>, the values in this plot at that time represent the following:
            <br />
            - <strong style={{ color: 'rgb(255, 99, 132)' }}>Expected Precipitation</strong>: <strong> {data.expPrecip[cut_day+2].toFixed(2)} inches </strong>
            <br />
            - <strong style={{ color: 'rgb(54, 162, 235)' }}>Drying Time</strong>: <strong> {Math.abs(Math.round(data.dryData[cut_day + 2]))} days </strong>
          </div>

          <div style={{
              textAlign: 'center',
              fontSize: '1rem',  /* ~20 px */
              fontWeight: 600,
              marginTop: '2rem',
              marginBottom: '0.5rem',
              color: 'black'
            }}>Yield and Net Revenue</div>
          <Bar key={plotKey + 1} options={yieldAndNetRevOptions} data={yieldAndNetRevData} />
          <div className="notification_advise">
            If you cut your hay at <strong>{cuttingTime}</strong>, the values in this plot at that time represent the following:
            <br />
            - <strong style={{ color: 'rgb(75, 192, 152)' }}>Yield</strong> : <strong>  {data.TDM[cut_day+2].toFixed(2)} Ton </strong>
            <br />
            - <strong style={{ color: 'rgb(255, 99, 132)' }}>Net Revenue</strong>: <strong>  ${data.netRev[cut_day + 2].toFixed(2)} </strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default EconomicModel;



