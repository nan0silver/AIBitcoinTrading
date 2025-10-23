import { useState } from 'react';
import { Moon, Sun, Activity } from 'lucide-react';
import MarketInfo from './components/MarketInfo';
import Portfolio from './components/Portfolio';
import PriceChart from './components/PriceChart';
import TradeHistory from './components/TradeHistory';
import TechnicalIndicators from './components/TechnicalIndicators';
import AIDecisions from './components/AIDecisions';
import Statistics from './components/Statistics';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 초기 다크모드 설정
  if (darkMode) {
    document.documentElement.classList.add('dark');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Bitcoin Trading Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  실시간 AI 기반 비트코인 자동 거래 모니터링
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-6 h-6 text-yellow-500" />
              ) : (
                <Moon className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 시장 정보 카드 */}
          <section>
            <MarketInfo />
          </section>

          {/* 포트폴리오 & 가격 차트 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Portfolio />
            <PriceChart />
          </section>

          {/* 기술적 지표 */}
          <section>
            <TechnicalIndicators />
          </section>

          {/* 통계 */}
          <section>
            <Statistics />
          </section>

          {/* AI 의사결정 & 거래 내역 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AIDecisions />
            <TradeHistory />
          </section>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 AI Bitcoin Trading Dashboard. Powered by GPT-4o & Upbit API
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                실시간 연결됨
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
