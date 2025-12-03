// DataStatisticsCharts.js
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/* ---------- constants ---------- */
const KEYS = ['ADF', 'CP', 'NDF', 'NDFD', 'Yield'];

const COLORS = {
  ADF: '#1f77b4', // blue
  CP: '#2ca02c', // green
  NDF: '#9467bd', // purple
  NDFD: '#ff7f0e', // orange
  Yield: '#d62728', // red
};

const todayLabels = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
});

/* ---------- helpers ---------- */
const calcStats = (arr = []) => {
  if (!arr?.length) return { min: null, mean: null, max: null };
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const mean = arr.reduce((a, v) => a + v, 0) / arr.length;
  return { min, mean, max };
};

const makeTooltip =
  (unit, colour) =>
  ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const { min, mean, max } = payload[0].payload;
    const fmt = (v) => (v == null ? '–' : v.toFixed(2));

    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 4,
          paddingTop: 10,
          paddingLeft: 4,
          fontSize: '0.7rem',
          color: '#000',
          width: 200,
          whiteSpace: 'nowrap',
          lineHeight: 1.35,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: colour }}>{label}</p>
        <p style={{ margin: 0 }}>
          Min: {fmt(min)} {unit}
        </p>
        <p style={{ margin: 0 }}>
          Mean: {fmt(mean)} {unit}
        </p>
        <p style={{ margin: 0 }}>
          Max: {fmt(max)} {unit}
        </p>
      </div>
    );
  };

/* ---------- main component ---------- */
const DataStatisticsCharts = ({ YQdata }) => {
  const daysArray = Array.isArray(YQdata)
    ? YQdata
    : YQdata && typeof YQdata === 'object'
    ? Object.values(YQdata)
    : [];

  /* build series for each key */
  const seriesByKey = useMemo(() => {
    const out = {};
    KEYS.forEach((key) => {
      out[key] = daysArray.map((d, i) => {
        const stats = calcStats(d?.[key]);

        if (key === 'Yield') {
          ['min', 'mean', 'max'].forEach((k) => {
            if (stats[k] != null) stats[k] = stats[k] * 4.04686;
          });
        }

        return {
          date: todayLabels[i],
          ...stats,
          range:
            stats.max != null && stats.min != null
              ? stats.max - stats.min
              : null,
        };
      });
    });
    return out;
  }, [daysArray]);

  function getYDomain(data) {
    if (!data || data.length === 0) return [0, 1];

    const minVal = Math.min(...data.map((d) => d.min));
    const maxVal = Math.max(...data.map((d) => d.max));

    // Add slight padding so the chart lines aren't glued to the edges
    const pad = 1;

    const yMin = Math.max(0, Math.floor(minVal) - pad);
    const yMax = Math.ceil(maxVal) + pad;

    return [yMin, yMax];
    }

  if (daysArray.length < 7) return <p>No data available for all 7 days.</p>;

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {KEYS.map((key) => {
        const colour = COLORS[key];
        const unit = key === 'Yield' ? 'Ton acre⁻¹' : '%';

        console.log('seriesByKey[key]', seriesByKey[key]);

        return (
          <div key={key}>
            <h4 className="mb-2 text-lg font-semibold text-center">{key}</h4>

            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={seriesByKey[key]}
                margin={{ top: 16, right: 48, left: 8, bottom: 8 }}
              >
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="4 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 13 }}
                  tickLine={false}
                  axisLine={{ stroke: '#999' }}
                />
                <YAxis
                  allowDataOverflow
                  type="number"
                  tick={{ fontSize: 13 }}
                  tickLine={false}
                  tickFormatter={(value) => value.toFixed(1)}
                  axisLine={{ stroke: '#999' }}
                  domain={getYDomain(seriesByKey[key])}
                  label={{
                    value: unit,
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: {
                      fill: '#000',
                      fontSize: 15,
                      fontWeight: 500,
                      textAnchor: 'middle',
                    },
                  }}
                />
                <Tooltip
                  content={makeTooltip(unit, colour)}
                  cursor={{ stroke: colour, strokeOpacity: 0.2 }}
                />

                <Area
                  type="basis"
                  dataKey="min"
                  stackId="band"
                  stroke="none"
                  fillOpacity={0}
                />
                <Area
                  type="basis"
                  dataKey="range"
                  stackId="band"
                  stroke="none"
                  fill={colour + '2e'}
                  isAnimationActive={false}
                />

                <Line
                  type="basis"
                  dataKey="mean"
                  stroke={colour}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, stroke: '#fff', strokeWidth: 1 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

export default DataStatisticsCharts;
