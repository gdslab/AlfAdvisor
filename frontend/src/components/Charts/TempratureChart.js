import React from 'react'
import { Line } from 'react-chartjs-2'
import { format, addHours, startOfHour, setHours, addDays } from 'date-fns';
import { registerables } from 'chart.js';
import './FieldCharts.css'
import 'chartjs-adapter-date-fns'

export default function TempratureChart({ y }) {
    const now = startOfHour(new Date());
    const x = Array.from({ length: y.length }, (_, i) => addHours(now, i));

    const data = {
        labels: x,
        datasets: [{
            label: "Temprature",
            data: y,
            backgroundColor: "rgba(233, 96, 28, 0.2)",
            borderColor: "rgba(175, 50, 100,1)",
            tension: 0.1,
            yID: 'y',
            fill: true,
        },],
    }

    // Generate daily annotations for midnight of each day
    const generateDailyAnnotations = () => {
        const annotations = {};
        const startDate = now;
        const endDate = addHours(now, y.length - 1);
        let currentDate = setHours(new Date(startDate), 24);

        let index = 1;
        while (currentDate <= endDate) {
            annotations[`annotation${index}`] = {
                type: 'line',
                borderColor: 'rgba(0, 0, 0, 0.4)',
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
            <Line
                data={data}
                options={
                    {
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                            title: {
                                display: false,
                                text: "Temperature",
                            },
                            tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function (context) {
                                        let label = 'Temprature';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += context.raw;
                                        return label + ' °F';
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
                                suggestedMin: 10,
                                suggestedMax: 40,
                                position: 'left',
                                stepSize: 10,
                                ticks: {
                                    callback: function (value) {
                                        return value + '°'
                                    },
                                },
                                title: {
                                    display: true,
                                    text: "Temprature (°F)"
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
                                    unit: "day",
                                    stepSize: 1,
                                    displayFormats: {
                                        hour: "MMM d, h a",
                                    },
                                    tooltipFormat: "MMM d, h a",
                                },
                                grid: {
                                    display: true,
                                    drawOnChartArea: true,
                                    color: (context) => {
                                        const hour = new Date(context.tick.value).getHours();
                                        return hour === 0 || hour === 12 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)';
                                    },
                                },
                                ticks: {
                                    maxRotation: 40,
                                    source: 'auto',
                                    autoSkip: false,
                                    
                                    callback: function (val, index) {
                                        const date = new Date(val);
                                        return format(date, "MMM d, h a");
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
