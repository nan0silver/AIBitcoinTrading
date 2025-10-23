import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Sparkles, DollarSign } from 'lucide-react';
import { requestAIAnalysis, executeManualTrade, executeAITrade } from '../services/api';

const AITradingPanel = () => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tradeParams, setTradeParams] = useState({ decision: 'buy', percentage: 50 });
  const [tradeResult, setTradeResult] = useState(null);

  // AI 분석 요청
  const handleAIAnalysis = async (includeBalance = false) => {
    setLoading(true);
    setAiAnalysis(null);
    setTradeResult(null);

    try {
      const response = await requestAIAnalysis(includeBalance);
      if (response.success) {
        setAiAnalysis(response.data);
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
      setAiAnalysis({
        error: true,
        message: error.response?.data?.detail || 'AI 분석 요청에 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 수동 거래 실행
  const handleManualTrade = async () => {
    setTradeLoading(true);
    setTradeResult(null);

    try {
      const response = await executeManualTrade(tradeParams.decision, tradeParams.percentage);
      setTradeResult(response);
      setShowConfirmModal(false);

      // 성공 시 AI 분석 초기화 (다시 분석해야 하므로)
      if (response.success) {
        setAiAnalysis(null);
      }
    } catch (error) {
      console.error('거래 실행 실패:', error);
      setTradeResult({
        success: false,
        message: error.response?.data?.detail || '거래 실행에 실패했습니다.'
      });
    } finally {
      setTradeLoading(false);
    }
  };

  // AI 자동 거래 실행
  const handleAIAutoTrade = async () => {
    setTradeLoading(true);
    setTradeResult(null);

    try {
      const response = await executeAITrade();
      setTradeResult({
        success: response.success,
        message: response.trade_result.message,
        ai_analysis: response.ai_analysis
      });
      setShowConfirmModal(false);

      // 최신 AI 분석 결과 업데이트
      if (response.ai_analysis) {
        setAiAnalysis(response.ai_analysis);
      }
    } catch (error) {
      console.error('AI 자동 거래 실패:', error);
      setTradeResult({
        success: false,
        message: error.response?.data?.detail || 'AI 자동 거래 실행에 실패했습니다.'
      });
    } finally {
      setTradeLoading(false);
    }
  };

  const getDecisionColor = (decision) => {
    if (decision === 'buy') return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    if (decision === 'sell') return 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
  };

  const getDecisionIcon = (decision) => {
    if (decision === 'buy') return <TrendingUp className="w-5 h-5" />;
    if (decision === 'sell') return <TrendingDown className="w-5 h-5" />;
    return <DollarSign className="w-5 h-5" />;
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          AI 거래 어시스턴트
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          AI에게 현재 시장 상황을 분석하게 하거나 직접 거래를 실행하세요
        </p>
      </div>

      {/* AI 분석 요청 버튼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleAIAnalysis(false)}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Brain className="w-5 h-5" />
          {loading ? 'AI 분석 중...' : 'AI 분석 요청 (일반)'}
        </button>

        <button
          onClick={() => handleAIAnalysis(true)}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Brain className="w-5 h-5" />
          {loading ? 'AI 분석 중...' : 'AI 분석 요청 (잔고 포함)'}
        </button>
      </div>

      {/* AI 분석 결과 */}
      {aiAnalysis && !aiAnalysis.error && (
        <div className={`p-6 rounded-xl border-2 mb-6 ${getDecisionColor(aiAnalysis.decision)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getDecisionIcon(aiAnalysis.decision)}
              <h3 className="text-xl font-bold uppercase">{aiAnalysis.decision}</h3>
            </div>
            <span className="text-2xl font-bold">{aiAnalysis.percentage}%</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold mb-1">AI 분석 근거:</p>
              <p className="text-sm leading-relaxed">{aiAnalysis.reason}</p>
            </div>

            <div className="pt-3 border-t border-current/20 flex items-center justify-between text-sm">
              <span>분석 시점 가격</span>
              <span className="font-bold">₩{aiAnalysis.current_price?.toLocaleString('ko-KR')}</span>
            </div>

            <div className="pt-3 border-t border-current/20 text-xs opacity-75">
              {new Date(aiAnalysis.timestamp).toLocaleString('ko-KR')}
            </div>
          </div>

          {/* AI 추천대로 거래 실행 버튼 */}
          <button
            onClick={() => {
              setTradeParams({ decision: aiAnalysis.decision, percentage: aiAnalysis.percentage });
              setShowConfirmModal(true);
            }}
            disabled={tradeLoading}
            className="w-full mt-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg border-2 border-current hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            ⚡ AI 추천대로 거래 실행
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {aiAnalysis && aiAnalysis.error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg mb-6">
          <p className="text-red-700 dark:text-red-400">{aiAnalysis.message}</p>
        </div>
      )}

      {/* 수동 거래 패널 */}
      <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">수동 거래</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              거래 유형
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['buy', 'sell', 'hold'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTradeParams({ ...tradeParams, decision: type })}
                  className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    tradeParams.decision === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              거래 비율: {tradeParams.percentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={tradeParams.percentage}
              onChange={(e) => setTradeParams({ ...tradeParams, percentage: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={tradeLoading || tradeParams.decision === 'hold'}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <AlertTriangle className="w-5 h-5" />
            거래 실행
          </button>
        </div>
      </div>

      {/* 거래 결과 */}
      {tradeResult && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          tradeResult.success
            ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
        }`}>
          <p className="font-semibold">{tradeResult.success ? '✅ 거래 성공' : '❌ 거래 실패'}</p>
          <p className="text-sm mt-1">{tradeResult.message}</p>
        </div>
      )}

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-yellow-500">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">거래 확인</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                다음 거래를 실행하시겠습니까?
              </p>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">거래 유형:</span>
                  <span className="font-bold text-gray-900 dark:text-white uppercase">{tradeParams.decision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">거래 비율:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{tradeParams.percentage}%</span>
                </div>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                ⚠️ 주의: 실제 거래가 실행됩니다!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleManualTrade}
                disabled={tradeLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {tradeLoading ? '실행 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITradingPanel;
