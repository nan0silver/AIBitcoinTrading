import { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getTrades, connectTradesWebSocket } from '../services/api';

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const data = await getTrades(20);
        setTrades(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        setLoading(false);
      }
    };

    fetchTrades();

    // WebSocket 연결 (새로운 거래 실시간 수신)
    const ws = connectTradesWebSocket((data) => {
      if (data.type === 'new_trade') {
        setTrades((prev) => [data.data, ...prev.slice(0, 19)]);
      }
    });

    return () => {
      ws.close();
    };
  }, []);

  const getDecisionBadge = (decision) => {
    const styles = {
      buy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      sell: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      hold: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
    };

    const icons = {
      buy: <TrendingUp className="w-4 h-4" />,
      sell: <TrendingDown className="w-4 h-4" />,
      hold: <Minus className="w-4 h-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${styles[decision]}`}>
        {icons[decision]}
        {decision.toUpperCase()}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price) return '₩0';
    return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(price))}`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 8,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <History className="w-6 h-6 text-blue-500" />
        거래 내역
      </h2>

      {trades.length === 0 ? (
        <p className="text-gray-500 text-center py-8">거래 내역이 없습니다</p>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getDecisionBadge(trade.decision)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(trade.timestamp).toLocaleString('ko-KR')}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {trade.percentage}%
                </span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                {trade.reason}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">BTC 잔고</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(trade.btc_balance)} BTC
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">KRW 잔고</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(trade.krw_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">평균 매입가</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(trade.btc_avg_buy_price)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">거래가</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(trade.btc_krw_price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
