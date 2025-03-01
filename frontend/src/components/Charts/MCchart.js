import React from 'react'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns';
import annotationPlugin from 'chartjs-plugin-annotation'
import { AnnotationOptions } from 'chartjs-plugin-annotation';
import { PartialEventContext } from 'chartjs-plugin-annotation';

export default function MCchart({ x, y, threshold }) {
    const data_MC = {
        labels: x,
        datasets: [
            {
                label: "Moisture Content (Wet basis)",
                data: y,
                fill: true,
                backgroundColor: "rgba(252,51,55,0.2)",
                borderColor: "rgba(155,51,55,1)",
                tension: 0.1,
                yID: 'y',

            },
        ],
    }

    const midnight = new Date().setHours(24, 0, 0, 0);
    const midnight2 = new Date().setHours(48, 0, 0, 0);
    const midnight3 = new Date().setHours(72, 0, 0, 0);

    const thresholdLine = {
        type: 'line',
        borderColor: 'black',
        borderWidth: 3,
        scaleID: 'y',
        value: threshold/100
      };
    
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
                data={data_MC}
                options={
                    {
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: "top",
                                align: "end",
                            },
                            annotation: {
                                annotations: {
                                    thresholdLine,
                                    annotation1,
                                    annotation2,
                                    annotation3,
                                }
                            },
                        },

                        scales: {
                            y: {
                                type: 'linear',
                                suggestedMin: 0,
                                suggestedMax: 0.9,
                                position: 'left',
                                stepSize: 0.1,
                                ticks: {
                                    callback: function (value, index) {
                                        return `${Math.round(value * 100)}%`;
                                    },
                                },
                                title: {
                                    display: true,
                                    text: "Moisture Content Wet Basis (Ww/Wt)"
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
                                    tooltipFormat: "MM/dd  HH:mm a",
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
                                gridLines: {
                                    color: "rgba(0, 0, 0, 0.1)", 
                                    borderDash: [5, 5],
                                },
                            },
                        },
                    }
                }
            />
        </div>
    )
}
