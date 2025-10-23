from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

class Trade(BaseModel):
    """거래 모델"""
    id: int
    timestamp: str
    decision: str
    reason: str
    percentage: int
    btc_balance: float
    krw_balance: float
    btc_avg_buy_price: float
    btc_krw_price: float
    reflection: Optional[str] = None

class TradeStatistics(BaseModel):
    """거래 통계 모델"""
    total_trades: int
    decision_counts: Dict[str, int]
    first_trade_date: Optional[str]
    last_trade_date: Optional[str]
    latest_trade: Optional[Dict]

class PortfolioPerformance(BaseModel):
    """포트폴리오 성과 모델"""
    current_btc_balance: float
    current_krw_balance: float
    btc_avg_buy_price: float
    current_btc_price: float
    total_value_krw: float
    initial_value_krw: float
    profit_loss: float
    profit_loss_percentage: float

class MarketData(BaseModel):
    """실시간 시장 데이터"""
    current_price: float
    timestamp: str
    change_24h: Optional[float] = None
    volume_24h: Optional[float] = None

class TechnicalIndicators(BaseModel):
    """기술적 지표"""
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    sma_20: Optional[float] = None
    ema_12: Optional[float] = None

class FearGreedIndex(BaseModel):
    """공포-탐욕 지수"""
    value: int
    classification: str
    timestamp: str

class AIDecision(BaseModel):
    """AI 의사결정 로그"""
    timestamp: str
    decision: str
    reason: str
    percentage: int
    confidence: Optional[float] = None
