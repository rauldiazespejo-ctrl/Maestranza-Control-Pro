"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartDatum {
  name: string;
  value: number;
  fill: string;
}

interface WorkOrderStatusChartProps {
  data: ChartDatum[];
}

export function WorkOrderStatusChart({ data }: WorkOrderStatusChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,213,220,0.12)" />
          <XAxis
            dataKey="name"
            stroke="#C8D5DC"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "rgba(200,213,220,0.2)" }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            stroke="#C8D5DC"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgba(200,213,220,0.2)" }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(200,213,220,0.06)" }}
            contentStyle={{
              backgroundColor: "#16163F",
              border: "1px solid rgba(200,213,220,0.12)",
              borderRadius: "6px",
              color: "#FFFFFF",
            }}
            itemStyle={{ color: "#FFFFFF" }}
            formatter={(value) => [`${value} órdenes`, "Cantidad"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
