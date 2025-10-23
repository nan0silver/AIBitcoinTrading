import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getMarketData, getFearGreedIndex, connectMarketWebSocket } from '../services/api';

const MarketInfo = () => {
  const [marketData, setMarketData] = useState(null);
  const [fearGreed, setFearGreed] = useState(null);
  const [realtimePrice, setRealtimePrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 데이터 로드
    const fetchData = async () => {
      try {
        const [market, fg] = await Promise.all([
          getMarketData(),
          getFearGreedIndex(),
        ]);
        setMarketData(market);
        setFearGreed(fg);
        setRealtimePrice(market.current_price);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // WebSocket 연결
    const ws = connectMarketWebSocket((data) => {
      if (data.type === 'market_update') {
        setRealtimePrice(data.data.price);
      }
    });

    // 정기적으로 데이터 새로고침 (공포-탐욕 지수는 자주 변하지 않으므로)
    const interval = setInterval(fetchData, 60000); // 1분마다

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const formatPrice = (price) => {
    if (!price) return '₩0';
    return `₩${formatNumber(price)}`;
  };

  const getFearGreedColor = (value) => {
    if (value <= 25) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (value <= 45) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    if (value <= 55) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    if (value <= 75) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
  };

  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  const change24h = marketData?.change_24h || 0;
  const isPositive = change24h >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 비트코인 현재가 */}
      <div className="stat-card card-hover">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Bitcoin (BTC)
          </h3>
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
        </div>
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPrice(realtimePrice)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          <span className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{change24h?.toFixed(2)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">24h</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            24h 거래량: {marketData?.volume_24h ? formatNumber(marketData.volume_24h) : 'N/A'} BTC
          </p>
        </div>
      </div>

      {/* 공포-탐욕 지수 */}
      <div className="stat-card card-hover">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Fear & Greed Index
          </h3>
        </div>
        {fearGreed ? (
          <>
            <div className="mb-2">
              <p className="text-5xl font-bold text-gray-900 dark:text-white">
                {fearGreed.value}
              </p>
            </div>
            <div className="mt-2">
              <span className={`inline-block px-4 py-2 rounded-full font-semibold text-sm ${getFearGreedColor(fearGreed.value)}`}>
                {fearGreed.classification}
              </span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${fearGreed.value}%`,
                    backgroundColor: fearGreed.value <= 25 ? '#dc2626' :
                                     fearGreed.value <= 45 ? '#ea580c' :
                                     fearGreed.value <= 55 ? '#ca8a04' :
                                     fearGreed.value <= 75 ? '#16a34a' : '#059669'
                  }}
                ></div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">데이터를 불러올 수 없습니다</p>
        )}
      </div>

      {/* 실시간 상태 */}
      <div className="stat-card card-hover">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            실시간 상태
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">데이터 소스</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Upbit</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">마지막 업데이트</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleTimeString('ko-KR')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">시장 상태</span>
            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
              OPEN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInfo;
