
// =============================================================
// FILE: src/components/charts/MonthlyBar.jsx
// PURPOSE: Bar chart showing monthly fee collection vs due
//          for the admin dashboard. Shows last 6 months trend.
//          Props: data = [{ month, collected, due }]
// =============================================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer as RC,
} from "recharts";

export const MonthlyBar = ({ data = [], title = "Monthly Collection" }) => {
  if (!data.length) {
    return (
      <div className="chart-card">
        <p className="chart-title">{title}</p>
        <div className="fee-chart-empty">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <p className="chart-title">{title}</p>
      <RC width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="collected" name="Collected" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="due"       name="Total Due" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </RC>
    </div>
  );
};