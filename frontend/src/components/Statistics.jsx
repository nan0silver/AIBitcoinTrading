import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { getStatistics } from '../services/api';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStatistics();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        setLoading(false);
      }
    };

    fetchStats();

    // 30초마다 업데이트
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">거래 통계</h2>
        <p className="text-gray-500">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  // 파이 차트 데이터 준비
  const chartData = Object.entries(stats.decision_counts || {}).map(([decision, count]) => ({
    name: decision.toUpperCase(),
    value: count,
  }));

  const COLORS = {
    BUY: '#10b981',
    SELL: '#ef4444',
    HOLD: '#6b7280',
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <BarChart2 className="w-6 h-6 text-blue-500" />
        거래 통계
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 파이 차트 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            거래 결정 분포
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
          )}
        </div>

        {/* 통계 정보 */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 거래 수</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total_trades}
            </p>
          </div>

          {Object.entries(stats.decision_counts || {}).map(([decision, count]) => (
            <div
              key={decision}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {decision}
                </span>
                <span className="text-2xl font-bold" style={{ color: COLORS[decision.toUpperCase()] }}>
                  {count}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / stats.total_trades) * 100}%`,
                      backgroundColor: COLORS[decision.toUpperCase()],
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {stats.first_trade_date && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">첫 거래</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(stats.first_trade_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">마지막 거래</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(stats.last_trade_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
