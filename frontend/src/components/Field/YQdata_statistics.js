// import React from "react";
// import "./DataStatisticsTable.css"; // Import CSS styles

// const DataStatisticsTable = ({ YQdata }) => {
//     let dataArray = [];

//     if (Array.isArray(YQdata)) {
//         dataArray = YQdata;
//         } else if (typeof YQdata === "object" && YQdata !== null) {
//         dataArray = Object.values(YQdata); 
//         }  
//   if ( dataArray.length < 7) {
//     return <p>No data available for all 7 days.</p>;
//   }

//   // Allowed keys for statistics
//   const allowedKeys = ["ADF", "CP", "NDF", "NDFD", "Yield"];

//   // Function to compute statistics
//   const computeStats = (arr) => {
//     if (!Array.isArray(arr) || arr.length === 0) {
//       return { min: "-", mean: "-", max: "-", std: "-", avgPerAcre: "-" };
//     }

//     const min = Math.min(...arr);
//     const max = Math.max(...arr);
//     const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
//     const std = Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length);
    
//     // Convert mean to average per acre (assuming 900 m² per data point)
//     const avgPerAcre = mean * (4046.86 / 900);

//     return { min, mean, max, std, avgPerAcre };
//   };

//   return (
//     <div className="table-container">
//       {dataArray.map((dayData, index) => (
//         <div className="table" key={index}>
//           <h3>Day {index}</h3>
//           <table className="stats-table">
//             <thead>
//               <tr>
//                 <th>Key</th>
//                 <th>Min</th>
//                 <th>Mean</th>
//                 <th>Max</th>
//                 <th>Std Dev</th>
//                 <th>Avg per Acre</th>
//               </tr>
//             </thead>
//             <tbody>
//               {allowedKeys.map((key) => {
//                 const imageData = dayData[key];

//                 if (!Array.isArray(imageData) || imageData.length === 0) {
//                   return (
//                     <tr key={key}>
//                       <td>{key}</td>
//                       <td colSpan="5" className="no-data">No data available</td>
//                     </tr>
//                   );
//                 }

//                 const { min, mean, max, std, avgPerAcre } = computeStats(imageData);

//                 return (
//                   <tr key={key}>
//                     <td>{key}</td>
//                     <td>{typeof min === "number" ? min.toFixed(2) : min}</td>
//                     <td>{typeof mean === "number" ? mean.toFixed(2) : mean}</td>
//                     <td>{typeof max === "number" ? max.toFixed(2) : max}</td>
//                     <td>{typeof std === "number" ? std.toFixed(2) : std}</td>
//                     <td>{typeof avgPerAcre === "number" ? avgPerAcre.toFixed(2) : avgPerAcre}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default DataStatisticsTable;


import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Area } from "recharts";

const DataStatisticsCharts = ({ YQdata }) => {
  let dataArray = [];

  if (Array.isArray(YQdata)) {
    dataArray = YQdata;
  } else if (typeof YQdata === "object" && YQdata !== null) {
    dataArray = Object.values(YQdata);
  }

  if (dataArray.length < 7) {
    return <p>No data available for all 7 days.</p>;
  }

  // Allowed keys except avgPerAcre (handled separately)
  const allowedKeys = ["ADF", "CP", "NDF", "NDFD", "Yield"];

  // Function to compute statistics
  const computeStats = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return { min: null, mean: null, max: null, avgPerAcre: null };
    }

    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const avgPerAcre = mean * (4046.86 / 900); 

    return { min, mean, max, avgPerAcre };
  };

  // Generate dates for the next 7 days
  const generateDates = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    });
  };

  const dates = generateDates();

  // Transform data for charts
  const chartData = dates.map((date, index) => {
    const dayData = dataArray[index] || {};
    const stats = allowedKeys.reduce((acc, key) => {
      const imageData = dayData[key] || [];
      const { min, mean, max, avgPerAcre } = computeStats(imageData);

      acc[key] = { min, mean, max, avgPerAcre };
      return acc;
    }, {});

    return {
      date,
      ...Object.fromEntries(allowedKeys.map((key) => [key, stats[key].mean])),
      ...Object.fromEntries(allowedKeys.map((key) => [`${key}_min`, stats[key].min])),
      ...Object.fromEntries(allowedKeys.map((key) => [`${key}_max`, stats[key].max])),
      Yield_avgPerAcre: stats["Yield"].avgPerAcre, 
    };
  });

  return (
    <div>
      {/* Plots for each parameter except Yield per Acre */}
      {allowedKeys.filter(key => key !== "Yield").map((key) => (
        <div key={key} style={{ marginBottom: "20px" }}>
          <h3>{key} Variation Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {/* Shaded area for min-max range */}
              <Area type="monotone" dataKey={`${key}_mean`} stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              <Line type="monotone" dataKey={`${key}_mean`} stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey={`${key}_min`} stroke="red" strokeDasharray="5 5" />
              <Line type="monotone" dataKey={`${key}_max`} stroke="red" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}

      {/* Separate plot for Yield Average Per Acre */}
      <div>
        <h3>Average Per Acre Yield</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="Yield_avgPerAcre" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
            <Line type="monotone" dataKey="Yield_avgPerAcre" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DataStatisticsCharts;

