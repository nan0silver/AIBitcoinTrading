import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// API 함수들
export const getTrades = async (limit = 100) => {
  const response = await api.get(`/api/trades?limit=${limit}`);
  return response.data;
};

export const getTradeById = async (id) => {
  const response = await api.get(`/api/trades/${id}`);
  return response.data;
};

export const getStatistics = async () => {
  const response = await api.get('/api/statistics');
  return response.data;
};

export const getPortfolio = async () => {
  const response = await api.get('/api/portfolio');
  return response.data;
};

export const getMarketData = async () => {
  const response = await api.get('/api/market');
  return response.data;
};

export const getTechnicalIndicators = async () => {
  const response = await api.get('/api/indicators');
  return response.data;
};

export const getFearGreedIndex = async () => {
  const response = await api.get('/api/fear-greed');
  return response.data;
};

export const getReflections = async (limit = 5) => {
  const response = await api.get(`/api/reflections?limit=${limit}`);
  return response.data;
};

export const getOHLCVData = async (interval = 'day', count = 30) => {
  const response = await api.get(`/api/chart/ohlcv?interval=${interval}&count=${count}`);
  return response.data;
};

// WebSocket 연결 함수
export const connectMarketWebSocket = (onMessage, onError) => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/market`);

  ws.onopen = () => {
    console.log('Market WebSocket connected');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log('Market WebSocket disconnected');
  };

  return ws;
};

export const connectTradesWebSocket = (onMessage, onError) => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/trades`);

  ws.onopen = () => {
    console.log('Trades WebSocket connected');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log('Trades WebSocket disconnected');
  };

  return ws;
};

export default api;
