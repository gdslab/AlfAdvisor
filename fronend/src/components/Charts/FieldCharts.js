import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import './FieldCharts.css';
import TempratureChart from "./TempratureChart";
import RainChart from "./RainChart";

Chart.register(annotationPlugin);

const FieldCharts = () => {
  const location = useLocation();
  const coordinates = location.state?.coordinates ? JSON.parse(location.state.coordinates) : [0, 0];
  const [Lat, Lng] = coordinates[0];
  const [temperature, setTemperature] = useState([]);
  const [rain, setRain] = useState([]);
  const [xAxes, setXAxez] = useState([]);
  const [isRainAbove2, setIsRainAbove2] = useState(false);

  useEffect(() => {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchWeatherData = async () => {
      const urls = [
        `https://api.open-meteo.com/v1/gfs?latitude=${Lat}&longitude=${Lng}&hourly=temperature_2m,precipitation&temperature_unit=fahrenheit&forecast_days=6&timezone=${timeZone}`,
        // `https://api.open-meteo.com/v1/gfs?latitude=${Lat}&longitude=${Lng}&hourly=soil_moisture_0_to_10cm,direct_radiation&forecast_days=6&timezone=${encodeURIComponent(timeZone)}`
      ];

      const [weatherData, extraData] = await Promise.all(urls.map(url => fetch(url).then(res => res.json())));

      const { hourly: { time, temperature_2m, precipitation } = {}} = weatherData || {};
      if (!time || !temperature_2m || !precipitation) {
        throw new Error("Incomplete weather data received");
      }
      const now = new Date();
      const futureTimes = time.map(t => new Date(t)).filter(date => date > now);

      setXAxez(futureTimes);
      setTemperature(temperature_2m.slice(time.length - futureTimes.length));
      setRain(precipitation.slice(time.length - futureTimes.length));
      setIsRainAbove2(precipitation.some(n => n > 2));
    };

    fetchWeatherData();

    return () => {
      setTemperature([]);
      setRain([]);
      setXAxez([]);
      setIsRainAbove2(false);
    };
  }, [Lat, Lng]);  // Dependency array includes coordinates to re-fetch if they change

  return (
    <div className="all-charts">
      <div className="chart-header">
        <div className="box-heading"> Weather Information </div>
      </div>
      <div className="graphs">
        {xAxes.length > 0 && temperature.length > 0 && rain.length > 0 && (
          <>
            <TempratureChart x={xAxes} y={temperature} />
            <RainChart x={xAxes} y={rain} />
            {isRainAbove2 && (
              <div className="notification-box">
                Model may not be accurate due to the rain.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FieldCharts;