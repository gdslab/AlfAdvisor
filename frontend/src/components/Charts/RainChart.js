import React, { useEffect } from 'react';
import { Bar } from 'react-chartjs-2'
import { format, addHours, startOfHour, setHours, addDays } from 'date-fns';
import { registerables } from 'chart.js';
import 'chartjs-adapter-date-fns'

export default function RainChart({ y }) {
    const now = startOfHour(new Date());
    const x = Array.from({ length: y.length }, (_, i) => addHours(now, i));

    const data = {
        labels: x,
        datasets: [{
            label: "Precipitation (rain + showers + snow)",
            data: y,
            backgroundColor: "rgba(11, 22, 255, 0.5)",
            borderColor: "rgba(11, 22, 215, 1)",
            borderWidth: 1,
            tension: 0.1,
            yID: 'y',
            fill: true,
        },],
    }

    const generateDailyAnnotations = () => {
        const annotations = {};
        const startDate = now;
        const endDate = addHours(now, y.length - 1);
        let currentDate = setHours(new Date(startDate), 24);

        let index = 1;
        while (currentDate <= endDate) {
            annotations[`annotation${index}`] = {
                type: 'line',
                borderColor: 'rgba(0, 0, 0, 0.5)',
                borderWidth: 2.5,
                scaleID: 'x',
                value: currentDate.getTime(),
            };

            currentDate = addDays(currentDate, 1); 
            index++;
        }
        return annotations;
    };

    const dailyAnnotations = generateDailyAnnotations();

    return (
        <div className='chart-container'>
            <Bar
                data={data}
                options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                        title: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function (context) {
                                    return `Precipitation: ${context.raw} inch`;
                                }
                            },
                        },
                        legend: {
                            display: true,
                            position: "top",
                            align: "end",
                        },
                        annotation: {
                            annotations: dailyAnnotations,
                        },
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            suggestedMin: 0,
                            suggestedMax: 1,
                            position: 'left',
                            ticks: {
                                callback: (value) => value,
                            },
                            title: {
                                display: true,
                                text: "Precipitation (inch)",
                            },
                            grid: {
                                display: false,
                            },
                        },
                        x: {
                            type: "time",
                            offset: false,
                            min: now.getTime(), // Start from the current time
                            max: x[x.length - 1].getTime(), // End at the last timestamp in x
                            time: {
                                unit: "day",
                                displayFormats: {
                                    hour: "MMM d, h a",
                                },
                                tooltipFormat: "MMM d, h a",
                            },
                            grid: {
                                display: true,
                                color: (context) => {
                                    if (context.tick && context.tick.value) {
                                        const hour = new Date(context.tick.value).getHours();
                                        return hour === 0 || hour === 12 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)';
                                    }
                                    return '';
                                },
                            },
                            ticks: {
                                maxRotation: 40,
                                callback: function (val) {
                                    const date = new Date(val);
                                    return format(date, "MMM d, h a");
                                },
                            },
                        }
                    }
                }}
            />
        </div>
    );
}
