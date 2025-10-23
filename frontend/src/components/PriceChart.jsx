import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getOHLCVData } from '../services/api';

const PriceChart = () => {
  const [chartData, setChartData] = useState([]);
  const [interval, setInterval] = useState('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const count = interval === 'day' ? 30 : interval === 'minute60' ? 24 : 60;
        const response = await getOHLCVData(interval, count);

        const formattedData = response.data.map((item) => ({
          time: new Date(item.index).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: interval !== 'day' ? 'numeric' : undefined,
          }),
          price: Math.round(item.close),
          high: Math.round(item.high),
          low: Math.round(item.low),
          volume: item.volume,
        }));

        setChartData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [interval]);

  const formatPrice = (value) => {
    return `₩${new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(value)}`;
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          가격 차트
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setInterval('minute60')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              interval === 'minute60'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            1시간
          </button>
          <button
            onClick={() => setInterval('day')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              interval === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            1일
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [`₩${new Intl.NumberFormat('ko-KR').format(value)}`, '가격']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* 가격 범위 정보 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">최저가</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatPrice(Math.min(...chartData.map(d => d.low)))}
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">최고가</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatPrice(Math.max(...chartData.map(d => d.high)))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
