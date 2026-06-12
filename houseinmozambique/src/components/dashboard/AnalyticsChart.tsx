'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface ChartDataPoint {
  date: string;
  properties: number;
  agents: number;
  inquiries: number;
  revenue: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Properties & Agents Trend */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#f2f4f6]">
          <h3 className="text-lg font-black text-[#002045] mb-6 tracking-tight">
            Activity Trend (30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
              <XAxis dataKey="date" stroke="#74777f" style={{ fontSize: '12px' }} />
              <YAxis stroke="#74777f" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #f2f4f6',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="properties" 
                stroke="#845326" 
                strokeWidth={2}
                dot={{ fill: '#845326', r: 4 }}
                activeDot={{ r: 6 }}
                name="Properties Listed"
              />
              <Line 
                type="monotone" 
                dataKey="agents" 
                stroke="#002045" 
                strokeWidth={2}
                dot={{ fill: '#002045', r: 4 }}
                activeDot={{ r: 6 }}
                name="New Agents"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#f2f4f6]">
          <h3 className="text-lg font-black text-[#002045] mb-6 tracking-tight">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
              <XAxis dataKey="date" stroke="#74777f" style={{ fontSize: '12px' }} />
              <YAxis stroke="#74777f" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #f2f4f6',
                  borderRadius: '12px'
                }}
                formatter={(value) => `$${(value as number).toLocaleString()}`}
              />
              <Bar 
                dataKey="revenue" 
                fill="#fab983" 
                radius={[8, 8, 0, 0]}
                name="Revenue (MZN)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inquiries Chart */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#f2f4f6]">
        <h3 className="text-lg font-black text-[#002045] mb-6 tracking-tight">
          Inquiries Received
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
            <XAxis dataKey="date" stroke="#74777f" style={{ fontSize: '12px' }} />
            <YAxis stroke="#74777f" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #f2f4f6',
                borderRadius: '12px'
              }}
            />
            <Bar 
              dataKey="inquiries" 
              fill="#845326" 
              radius={[8, 8, 0, 0]}
              name="Inquiries"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
