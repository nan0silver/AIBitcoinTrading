from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import asyncio
import pyupbit
import pandas as pd
import requests
from datetime import datetime
import json

from models import (
    Trade, TradeStatistics, PortfolioPerformance,
    MarketData, TechnicalIndicators, FearGreedIndex, AIDecision
)
from database import (
    get_all_trades, get_trade_by_id, get_trade_statistics,
    get_portfolio_performance, get_recent_reflections
)

app = FastAPI(title="AI Bitcoin Trading Dashboard API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ==================== REST API 엔드포인트 ====================

@app.get("/")
async def root():
    """API 루트"""
    return {
        "message": "AI Bitcoin Trading Dashboard API",
        "version": "1.0.0",
        "endpoints": {
            "trades": "/api/trades",
            "statistics": "/api/statistics",
            "portfolio": "/api/portfolio",
            "market": "/api/market",
            "indicators": "/api/indicators",
            "fear-greed": "/api/fear-greed",
            "reflections": "/api/reflections"
        }
    }

@app.get("/api/trades", response_model=List[Dict])
async def get_trades(limit: int = 100):
    """거래 내역 조회"""
    try:
        trades = get_all_trades(limit=limit)
        return trades
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trades/{trade_id}", response_model=Dict)
async def get_trade(trade_id: int):
    """특정 거래 조회"""
    trade = get_trade_by_id(trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade

@app.get("/api/statistics", response_model=TradeStatistics)
async def get_statistics():
    """거래 통계 조회"""
    try:
        stats = get_trade_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio", response_model=PortfolioPerformance)
async def get_portfolio():
    """포트폴리오 성과 조회"""
    try:
        performance = get_portfolio_performance()
        return performance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market", response_model=MarketData)
async def get_market_data():
    """실시간 시장 데이터 조회"""
    try:
        current_price = pyupbit.get_current_price("KRW-BTC")

        # 24시간 변화율 계산
        df = pyupbit.get_ohlcv("KRW-BTC", interval="day", count=2)
        if df is not None and len(df) >= 2:
            yesterday_close = df.iloc[-2]['close']
            change_24h = ((current_price - yesterday_close) / yesterday_close) * 100
        else:
            change_24h = None

        # 24시간 거래량
        if df is not None and len(df) >= 1:
            volume_24h = df.iloc[-1]['volume']
        else:
            volume_24h = None

        return MarketData(
            current_price=current_price,
            timestamp=datetime.now().isoformat(),
            change_24h=change_24h,
            volume_24h=volume_24h
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/indicators", response_model=TechnicalIndicators)
async def get_technical_indicators():
    """기술적 지표 조회 (간단한 계산)"""
    try:
        # 일봉 데이터로 기술적 지표 계산
        df = pyupbit.get_ohlcv("KRW-BTC", interval="day", count=30)

        if df is None or len(df) == 0:
            raise HTTPException(status_code=500, detail="Failed to fetch market data")

        # 간단한 이동평균 계산
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()

        # 볼린저 밴드 (간단한 계산)
        df['bb_mavg'] = df['close'].rolling(window=20).mean()
        df['bb_std'] = df['close'].rolling(window=20).std()
        df['bb_hband'] = df['bb_mavg'] + (df['bb_std'] * 2)
        df['bb_lband'] = df['bb_mavg'] - (df['bb_std'] * 2)

        # RSI 계산 (간단한 버전)
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))

        # MACD 계산 (간단한 버전)
        ema_12 = df['close'].ewm(span=12, adjust=False).mean()
        ema_26 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd'] = ema_12 - ema_26
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()

        # 최신 값 추출
        latest = df.iloc[-1]

        return TechnicalIndicators(
            rsi=float(latest['rsi']) if pd.notna(latest['rsi']) else None,
            macd=float(latest['macd']) if pd.notna(latest['macd']) else None,
            macd_signal=float(latest['macd_signal']) if pd.notna(latest['macd_signal']) else None,
            bb_upper=float(latest['bb_hband']) if pd.notna(latest['bb_hband']) else None,
            bb_middle=float(latest['bb_mavg']) if pd.notna(latest['bb_mavg']) else None,
            bb_lower=float(latest['bb_lband']) if pd.notna(latest['bb_lband']) else None,
            sma_20=float(latest['sma_20']) if pd.notna(latest['sma_20']) else None,
            ema_12=float(latest['ema_12']) if pd.notna(latest['ema_12']) else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fear-greed", response_model=FearGreedIndex)
async def get_fear_greed():
    """공포-탐욕 지수 조회"""
    try:
        url = "https://api.alternative.me/fng/?limit=1"
        response = requests.get(url, timeout=10)
        data = response.json()

        if 'data' in data and len(data['data']) > 0:
            fng_data = data['data'][0]
            return FearGreedIndex(
                value=int(fng_data['value']),
                classification=fng_data['value_classification'],
                timestamp=fng_data['timestamp']
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch Fear & Greed Index")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reflections")
async def get_reflections(limit: int = 5):
    """최근 AI 반성 일기 조회"""
    try:
        reflections = get_recent_reflections(limit=limit)
        return reflections
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chart/ohlcv")
async def get_ohlcv_data(interval: str = "day", count: int = 30):
    """OHLCV 차트 데이터 조회"""
    try:
        valid_intervals = ["minute1", "minute3", "minute5", "minute10", "minute15",
                          "minute30", "minute60", "minute240", "day", "week", "month"]

        if interval not in valid_intervals:
            raise HTTPException(status_code=400, detail=f"Invalid interval. Must be one of {valid_intervals}")

        df = pyupbit.get_ohlcv("KRW-BTC", interval=interval, count=count)

        if df is None or len(df) == 0:
            raise HTTPException(status_code=500, detail="Failed to fetch OHLCV data")

        # DataFrame을 JSON으로 변환
        df_reset = df.reset_index()
        df_reset['index'] = df_reset['index'].astype(str)

        return {
            "interval": interval,
            "count": len(df),
            "data": df_reset.to_dict(orient='records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== WebSocket 엔드포인트 ====================

@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    """실시간 시장 데이터 스트림"""
    await manager.connect(websocket)
    try:
        while True:
            # 실시간 가격 데이터
            current_price = pyupbit.get_current_price("KRW-BTC")

            # 데이터 전송
            await websocket.send_json({
                "type": "market_update",
                "data": {
                    "price": current_price,
                    "timestamp": datetime.now().isoformat()
                }
            })

            await asyncio.sleep(1)  # 1초마다 업데이트

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.websocket("/ws/trades")
async def websocket_trades(websocket: WebSocket):
    """실시간 거래 내역 스트림"""
    await manager.connect(websocket)
    try:
        last_trade_id = None

        while True:
            # 최신 거래 확인
            stats = get_trade_statistics()
            latest_trade = stats.get('latest_trade')

            if latest_trade and latest_trade.get('id') != last_trade_id:
                last_trade_id = latest_trade.get('id')

                # 새로운 거래 전송
                await websocket.send_json({
                    "type": "new_trade",
                    "data": latest_trade
                })

            await asyncio.sleep(5)  # 5초마다 체크

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
