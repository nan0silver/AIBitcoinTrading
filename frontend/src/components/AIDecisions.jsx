import { useState, useEffect } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { getReflections } from '../services/api';

const AIDecisions = () => {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        const data = await getReflections(10);
        setReflections(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch reflections:', error);
        setLoading(false);
      }
    };

    fetchReflections();

    // 30초마다 업데이트
    const interval = setInterval(fetchReflections, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getDecisionColor = (decision) => {
    const colors = {
      buy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      sell: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      hold: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600',
    };
    return colors[decision] || colors.hold;
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <Brain className="w-6 h-6 text-blue-500" />
        AI 의사결정 분석
      </h2>

      {reflections.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">아직 AI 분석 내역이 없습니다</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            거래가 실행되면 AI의 의사결정 분석이 여기에 표시됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reflections.map((item) => {
            const isExpanded = expandedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`rounded-lg border-2 overflow-hidden transition-all ${getDecisionColor(item.decision)}`}
              >
                <div
                  className="p-4 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg uppercase">
                        {item.decision}
                      </span>
                      <span className="text-sm opacity-75">
                        {new Date(item.timestamp).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>

                  {!isExpanded && item.reflection && (
                    <p className="text-sm line-clamp-2 opacity-80">
                      {item.reflection.substring(0, 100)}...
                    </p>
                  )}
                </div>

                {isExpanded && item.reflection && (
                  <div className="px-4 pb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI 분석
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {item.reflection}
                      </p>
                    </div>
                  </div>
                )}

                {isExpanded && !item.reflection && (
                  <div className="px-4 pb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        이 거래에 대한 AI 분석이 아직 생성되지 않았습니다
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIDecisions;
