import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: any[];
  title?: string;
}

export const TransactionPieChart: React.FC<ChartProps> = ({ data }) => {
  const categories = Array.from(new Set(data.filter(t => t.type === 'expense').map(t => t.category)));
  const values = categories.map(cat => 
    data.filter(t => t.type === 'expense' && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0)
  );

  const chartData = {
    labels: categories,
    datasets: [{
      data: values,
      backgroundColor: [
        '#8b5cf6', // brand-purple
        '#3b82f6', // blue-500
        '#10b981', // emerald-500
        '#f43f5e', // rose-500
        '#f59e0b', // amber-500
        '#6366f1', // indigo-500
        '#27272a', // zinc-800
      ],
      borderWidth: 2,
      borderColor: '#050505',
      hoverOffset: 15
    }]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#a1a1aa', // zinc-400
          font: { family: 'Inter', size: 10, weight: 'bold' as any }
        }
      },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as any },
        bodyFont: { size: 12 },
        usePointStyle: true,
      }
    },
    maintainAspectRatio: false,
    cutout: '75%'
  };

  return <Pie data={chartData} options={options} />;
};

export const MonthlyTrendChart: React.FC<ChartProps> = ({ data }) => {
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });

  const incomeData = last6Months.map(month => 
    data.filter(t => t.type === 'income' && t.date?.toDate().toISOString().startsWith(month))
        .reduce((sum, t) => sum + t.amount, 0)
  );

  const expenseData = last6Months.map(month => 
    data.filter(t => t.type === 'expense' && t.date?.toDate().toISOString().startsWith(month))
        .reduce((sum, t) => sum + t.amount, 0)
  );

  const chartData = {
    labels: last6Months.map(m => new Date(m).toLocaleDateString('en-US', { month: 'short' })),
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#8b5cf6', // brand-purple
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointStyle: 'circle',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#18181b',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#71717a', font: { family: 'JetBrains Mono', size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 11, weight: 'bold' as any } }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return <Line data={chartData} options={options} />;
};
