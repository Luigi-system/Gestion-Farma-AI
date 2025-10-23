import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow';
}

const colorClasses = {
    blue: 'bg-blue-100 text-clinical-blue dark:bg-blue-900/50',
    green: 'bg-green-100 text-pharmacy-green dark:bg-green-900/50',
    red: 'bg-red-100 text-red-500 dark:bg-red-900/50',
    yellow: 'bg-yellow-100 text-yellow-500 dark:bg-yellow-900/50'
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center dark:bg-gray-800 dark:hover:border-gray-600 dark:border-transparent dark:border">
      <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;