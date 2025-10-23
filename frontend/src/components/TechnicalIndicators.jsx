import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { getTechnicalIndicators } from '../services/api';

const TechnicalIndicators = () => {
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const data = await getTechnicalIndicators();
        setIndicators(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch indicators:', error);
        setLoading(false);
      }
    };

    fetchIndicators();

    // 1분마다 업데이트
    const interval = setInterval(fetchIndicators, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPrice = (num) => {
    if (!num) return 'N/A';
    return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(num))}`;
  };

  const getRSIColor = (rsi) => {
    if (!rsi) return 'text-gray-500';
    if (rsi < 30) return 'text-green-500'; // 과매도 (매수 신호)
    if (rsi > 70) return 'text-red-500';   // 과매수 (매도 신호)
    return 'text-yellow-500';              // 중립
  };

  const getRSILabel = (rsi) => {
    if (!rsi) return '데이터 없음';
    if (rsi < 30) return '과매도';
    if (rsi > 70) return '과매수';
    return '중립';
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">기술적 지표</h2>
        <p className="text-gray-500">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <BarChart3 className="w-6 h-6 text-blue-500" />
        기술적 지표
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* RSI */}
        <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            RSI (14)
          </p>
          <p className={`text-3xl font-bold mb-1 ${getRSIColor(indicators.rsi)}`}>
            {formatNumber(indicators.rsi)}
          </p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            indicators.rsi < 30
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : indicators.rsi > 70
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}>
            {getRSILabel(indicators.rsi)}
          </span>
        </div>

        {/* MACD */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            MACD
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(indicators.macd)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Signal: {formatNumber(indicators.macd_signal)}
          </p>
        </div>

        {/* 볼린저 밴드 상단 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            볼린저 밴드 (상단)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(indicators.bb_upper)}
          </p>
        </div>

        {/* 볼린저 밴드 중간 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            볼린저 밴드 (중간)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(indicators.bb_middle)}
          </p>
        </div>

        {/* 볼린저 밴드 하단 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            볼린저 밴드 (하단)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(indicators.bb_lower)}
          </p>
        </div>

        {/* SMA 20 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            SMA (20일)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(indicators.sma_20)}
          </p>
        </div>

        {/* EMA 12 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            EMA (12일)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(indicators.ema_12)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnicalIndicators;
