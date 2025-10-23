import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Bitcoin, DollarSign, RefreshCw } from 'lucide-react';
import { getLivePortfolio } from '../services/api';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await getLivePortfolio();
        setPortfolio(data);
        setIsLive(data.is_live || false);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
        setLoading(false);
      }
    };

    fetchPortfolio();

    // 30초마다 업데이트
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 8,
    }).format(num);
  };

  const formatKRW = (num) => {
    if (!num) return '₩0';
    return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(num))}`;
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          포트폴리오
        </h2>
        <p className="text-gray-500">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const isProfitable = portfolio.profit_loss >= 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Wallet className="w-6 h-6 text-blue-500" />
          포트폴리오
        </h2>
        {isLive && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
            <RefreshCw className="w-3 h-3 animate-spin" />
            실시간 Upbit 데이터
          </div>
        )}
      </div>

      {/* 총 자산 */}
      <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">총 자산 가치</p>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {formatKRW(portfolio.total_value_krw)}
        </p>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${isProfitable ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-xl font-semibold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {isProfitable ? '+' : ''}{formatKRW(portfolio.profit_loss)}
          </span>
          <span className={`text-lg font-semibold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            ({isProfitable ? '+' : ''}{portfolio.profit_loss_percentage?.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* 자산 상세 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BTC 보유량 */}
        <div className="p-5 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <Bitcoin className="w-5 h-5 text-orange-500" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">BTC 보유량</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatNumber(portfolio.current_btc_balance)} BTC
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ≈ {formatKRW(portfolio.current_btc_balance * portfolio.current_btc_price)}
          </p>
        </div>

        {/* KRW 잔고 */}
        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">KRW 잔고</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatKRW(portfolio.current_krw_balance)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            현금 보유분
          </p>
        </div>

        {/* 평균 매입가 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            BTC 평균 매입가
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatKRW(portfolio.btc_avg_buy_price)}
          </p>
        </div>

        {/* 현재 BTC 가격 */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            현재 BTC 가격
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatKRW(portfolio.current_btc_price)}
          </p>
        </div>
      </div>

      {/* 초기 투자금 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">초기 투자금</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatKRW(portfolio.initial_value_krw)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
