import React from 'react'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns';
import 'chartjs-adapter-date-fns';

export default function DryRateChart({ x, y }) {
    const data = {
        labels: x,
        datasets: [{
            label: "Drying Rate",
            data: y,
            backgroundColor: "rgba(0,0,255,0.2)",
            borderColor: "rgba(0,0,150,1)",
            tension: 0.1,
            yID: 'y',
            fill: true,
        },],
    }

    const midnight = new Date().setHours(24, 0, 0, 0);
    const midnight2 = new Date().setHours(48, 0, 0, 0);
    const midnight3 = new Date().setHours(72, 0, 0, 0);

    const annotation1 = {
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
            <Line
                data={data}
                options={
                    {
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                            title: {
                                display: false,
                                text: "Drying Rate",
                            },
                            legend: {
                                display: true,
                                position: "top",
                                align: "end",
                            },
                            annotation: {
                                annotations: {
                                    annotation1,
                                    annotation2,
                                    annotation3,
                                }
                            },
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                suggestedMin: 0.0,
                                suggestedMax: 20,
                                position: 'left',
                                stepSize: 1,
                                ticks: {
                                    callback: function (value, index) {
                                        return value + '%'
                                    },
                                },
                                title: {
                                    display: true,
                                    text: "Drying Rate (1/hr)" 
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
