import React from 'react'
import { Bar } from 'react-chartjs-2'
import { format } from 'date-fns';
import { registerables } from 'chart.js';
import 'chartjs-adapter-date-fns'

export default function RainChart({ x, y }) {
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

    const midnight = new Date().setHours(24, 0, 0, 0);
    const midnight2 = new Date().setHours(48, 0, 0, 0);
    const midnight3 = new Date().setHours(72, 0, 0, 0);

    const annotation = {
        type: 'line',
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 3,
        scaleID: 'x',
        value: midnight
    };

    const annotation2 = {
        type: 'line',
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 3,
        scaleID: 'x',
        value: midnight2
    };

    const annotation3 = {
        type: 'line',
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 3,
        scaleID: 'x',
        value: midnight3
    };

    return (
        <div className='chart-container'>
            <Bar
                data={data}
                options={
                    {
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                            title: {
                                display: false,
                                text: "Precipitation (rain + showers + snow)",
                            },
                            legend: {
                                display: true,
                                position: "top",
                                align: "end",
                            },
                            annotation: {
                                annotations: {
                                    annotation,
                                    annotation2,
                                    annotation3,
                                }
                            },
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                suggestedMin: 0,
                                suggestedMax: 10,
                                position: 'left',
                                stepSize: 10,
                                ticks: {
                                    callback: function (value, index) {
                                        return value + ''
                                    },
                                },
                                title: {
                                    display: true,
                                    text: "Precipitation (mm)"
                                },
                                grid: {
                                    display: false
                                }
                            },
                            x: {
                                type: "time",
                                title: {
                                    display: false,
                                    text: "time",
                                },
                                time: {
                                    unit: "hour",
                                    displayFormats: {
                                        hour: "h a",
                                    },
                                    tooltipFormat: "h a",
                                    parser: function (value) {
                                        return format(new Date(value), "yyyy-MM-dd HH:mm:ss");
                                    },
                                    adapter: {
                                        date: new Date(),
                                    },
                                },
                                grid: {
                                    offset: false,
                                    display: true,
                                    stepSize: 10,
                                },
                                ticks: {
                                    maxRotation: 40,
                                    callback: function (val, index) {
                                        const hour = new Date(val).getHours();
                                        return hour % 3 === 0 ? format(new Date(val), "h a") : null;
                                    }
                                },
                            }
                        }
                    }
                }
            />
        </div>
    )
}
