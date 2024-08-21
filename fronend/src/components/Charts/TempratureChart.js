import React from 'react'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns';
import { registerables } from 'chart.js';
import './FieldCharts.css'
import 'chartjs-adapter-date-fns'

export default function TempratureChart({ x, y }) {
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

    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    const midnight = new Date().setHours(24, 0, 0, 0);
    const midnight2 = new Date().setHours(48, 0, 0, 0);
    const midnight3 = new Date().setHours(72, 0, 0, 0);

    const date1 = new Date();
    const day1 = date1.getDate();
    const month1 = date1.getMonth();

    const date2 = new Date(date1.getTime() + oneDayInMilliseconds);
    const day2 = date2.getDate();
    const month2 = date2.getMonth();

    const date3 = new Date(date1.getTime() + 2 * oneDayInMilliseconds);
    const day3 = date3.getDate();
    const month3 = date3.getMonth();

    const date4 = new Date(date1.getTime() + 3 * oneDayInMilliseconds);
    const day4 = date4.getDate();
    const month4 = date4.getMonth();


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

    const label1 = {
        type: 'label',
        xValue: new Date().setHours(17, 0, 0, 0),
        yValue: 30,
        backgroundColor: 'rgba(245,245,245)',
        content: [month[month1] + ' ' + day1],
        font: {
            size: 20
        }
    }

    const label2 = {
        type: 'label',
        xValue: new Date().setHours(36, 0, 0, 0),
        yValue: 30,
        backgroundColor: 'rgba(245,245,245)',
        content: [month[month2] + ' ' + day2],
        font: {
            size: 20
        }
    }

    const label3 = {
        type: 'label',
        xValue: new Date().setHours(60, 0, 0, 0),
        yValue: 30,
        backgroundColor: 'rgba(245,245,245)',
        content: [month[month3] + ' ' + day3],
        font: {
            size: 20
        }
    }

    const label4 = {
        type: 'label',
        xValue: new Date().setHours(84, 0, 0, 0),
        yValue: 30,
        backgroundColor: 'rgba(245,245,245)',
        content: [month[month4] + ' ' + day4],
        font: {
            size: 20
        }
    }


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
                                    annotation,
                                    annotation2,
                                    annotation3,
                                    label1,
                                    label2,
                                    label3,
                                    label4,
                                }
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
                                    callback: function (value, index) {
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
                                    unit: "hour",
                                    displayFormats: {
                                        hour: "h a",
                                    },
                                    tooltipFormat: "h a",
                                    parser: function (val) {
                                        return format(new Date(val), "yyyy-MM-dd HH:mm:ss");
                                    },
                                    adapter: {
                                        date: new Date(),
                                    },
                                },
                                grid: {
                                    offset: false,
                                    display: true,
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
