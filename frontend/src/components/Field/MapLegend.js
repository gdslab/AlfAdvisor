// // Legend.js
// import { useEffect } from 'react';
// import { useMap } from 'react-leaflet';
// import L from 'leaflet';
// import './MapLegend.css';

// function Legend({ min, max, colorScale }) {
//   const map = useMap();

//   useEffect(() => {
//     const legend = L.control({ position: 'bottomright' });

//     legend.onAdd = function () {
//       const div = L.DomUtil.create('div', 'info legend');

//       // Create a container for gradient and labels
//       const gradientContainer = document.createElement('div');
//       gradientContainer.className = 'legend-gradient-container';

//       // Create min and max labels
//       const minLabel = document.createElement('span');
//       minLabel.className = 'legend-label';
//       minLabel.textContent = min.toFixed(2);

//       const maxLabel = document.createElement('span');
//       maxLabel.className = 'legend-label';
//       maxLabel.textContent = max.toFixed(2);

//       // Create the gradient bar
//       const gradientBar = document.createElement('div');
//       gradientBar.className = 'legend-gradient';

//       // Generate gradient colors
//       const gradientColors = [];
//       const steps = 10; // Number of color stops in the gradient

//       for (let i = 0; i <= steps; i++) {
//         const value = min + ((max - min) * i) / steps;
//         const color = colorScale(value);
//         const percent = (i * 100) / steps;
//         gradientColors.push(`${color} ${percent}%`);
//       }

//       // Set the background of the gradient bar
//       gradientBar.style.background = `linear-gradient(to right, ${gradientColors.join(', ')})`;

//       // Assemble the gradient container
//       gradientContainer.appendChild(minLabel);
//       gradientContainer.appendChild(gradientBar);
//       gradientContainer.appendChild(maxLabel);

//       div.appendChild(gradientContainer);

//       return div;
//     };

//     legend.addTo(map);

//     // Cleanup the control when the component unmounts
//     return () => {
//       legend.remove();
//     };
//   }, [map, min, max, colorScale]);

//   return null;
// }

// export default Legend;


import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './MapLegend.css';

function Legend({ min, max, colorScale }) {
    const map = useMap();
    const avg = (min + max) / 2; 

    useEffect(() => {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');

            // Create a container for gradient and labels
            const gradientContainer = document.createElement('div');
            gradientContainer.className = 'legend-gradient-container';

            // Create labels
            const minLabel = document.createElement('span');
            minLabel.className = 'legend-label';
            minLabel.textContent = `Min: ${min.toFixed(2)}`;

            const avgLabel = document.createElement('span');
            avgLabel.className = 'legend-label';
            avgLabel.textContent = `Avg: ${avg.toFixed(2)}`;

            const maxLabel = document.createElement('span');
            maxLabel.className = 'legend-label';
            maxLabel.textContent = `Max: ${max.toFixed(2)}`;

            // Create the gradient bar
            const gradientBar = document.createElement('div');
            gradientBar.className = 'legend-gradient';

            // Generate smooth gradient colors
            const gradientColors = [];
            const steps = 100;

            for (let i = 0; i <= steps; i++) {
                const value = min + ((max - min) * i) / steps;
                const color = colorScale(value);
                const percent = (i * 100) / steps;
                gradientColors.push(`${color} ${percent}%`);
            }

            // rainbow gradient
            gradientBar.style.background = `linear-gradient(to right, ${gradientColors.join(', ')})`;

            // Assemble the gradient container
            gradientContainer.appendChild(minLabel);
            gradientContainer.appendChild(gradientBar);
            gradientContainer.appendChild(avgLabel);
            gradientContainer.appendChild(maxLabel);

            div.appendChild(gradientContainer);
            return div;
        };

        legend.addTo(map);

        // Cleanup on unmount
        return () => {
            legend.remove();
        };
    }, [map, min, max, avg, colorScale]);

    return null;
}

export default Legend;
