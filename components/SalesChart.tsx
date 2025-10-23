import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SalesData } from '../types';
// FIX: Corrected import path for useTheme hook from './ThemeContext'
import { useTheme } from './ThemeContext';

interface SalesChartProps {
  data: SalesData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280'; // gray-400 vs gray-500
  const tooltipBg = theme === 'dark' ? '#1F2937' : '#FFFFFF'; // gray-800 vs white
  const tooltipBorder = theme === 'dark' ? '#374151' : '#E5E7EB'; // gray-700 vs gray-200

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-96 dark:bg-gray-800 dark:text-gray-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 dark:text-gray-100">Productos Más Vendidos</h3>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                    dataKey="name" 
                    angle={-25}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12, fill: tickColor }} 
                />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} />
                <Tooltip 
                    cursor={{fill: 'rgba(0, 122, 255, 0.1)'}}
                    contentStyle={{ borderRadius: '0.5rem', border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg }} 
                    labelStyle={{ color: tickColor }}
                />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="ventas" fill="#007AFF" name="Nro. de Ventas" barSize={30} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;