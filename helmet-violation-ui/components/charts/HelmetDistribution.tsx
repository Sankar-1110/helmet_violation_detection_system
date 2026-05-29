"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { name: string; value: number }[];
}

export default function HelmetDistribution({ data }: Props) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-sm font-medium mb-4">
        Helmet vs No Helmet
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#DC2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
