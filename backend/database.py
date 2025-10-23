import sqlite3
import pandas as pd
from typing import List, Dict, Optional
from datetime import datetime

DB_PATH = "../ai_trading.db"

def get_db_connection():
    """데이터베이스 연결 생성"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_all_trades(limit: Optional[int] = None) -> List[Dict]:
    """모든 거래 내역 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM trades ORDER BY timestamp DESC"
    if limit:
        query += f" LIMIT {limit}"

    cursor.execute(query)
    trades = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return trades

def get_trade_by_id(trade_id: int) -> Optional[Dict]:
    """특정 거래 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM trades WHERE id = ?", (trade_id,))
    trade = cursor.fetchone()
    conn.close()

    return dict(trade) if trade else None

def get_trade_statistics() -> Dict:
    """거래 통계 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 총 거래 수
    cursor.execute("SELECT COUNT(*) as total FROM trades")
    total_trades = cursor.fetchone()["total"]

    # 결정별 거래 수
    cursor.execute("""
        SELECT decision, COUNT(*) as count
        FROM trades
        GROUP BY decision
    """)
    decision_counts = {row["decision"]: row["count"] for row in cursor.fetchall()}

    # 첫 거래와 마지막 거래
    cursor.execute("SELECT MIN(timestamp) as first, MAX(timestamp) as last FROM trades")
    dates = cursor.fetchone()

    # 최근 거래
    cursor.execute("SELECT * FROM trades ORDER BY timestamp DESC LIMIT 1")
    latest_trade = cursor.fetchone()
    latest_trade_dict = dict(latest_trade) if latest_trade else None

    conn.close()

    return {
        "total_trades": total_trades,
        "decision_counts": decision_counts,
        "first_trade_date": dates["first"],
        "last_trade_date": dates["last"],
        "latest_trade": latest_trade_dict
    }

def get_portfolio_performance() -> Dict:
    """포트폴리오 성과 계산"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 최근 거래 정보
    cursor.execute("SELECT * FROM trades ORDER BY timestamp DESC LIMIT 1")
    latest = cursor.fetchone()

    if not latest:
        conn.close()
        return {
            "current_btc_balance": 0,
            "current_krw_balance": 0,
            "btc_avg_buy_price": 0,
            "current_btc_price": 0,
            "total_value_krw": 0,
            "profit_loss": 0,
            "profit_loss_percentage": 0
        }

    # 첫 거래 정보 (초기 투자금)
    cursor.execute("SELECT * FROM trades ORDER BY timestamp ASC LIMIT 1")
    first = cursor.fetchone()

    conn.close()

    latest_dict = dict(latest)
    first_dict = dict(first)

    current_btc = latest_dict.get("btc_balance", 0)
    current_krw = latest_dict.get("krw_balance", 0)
    avg_buy_price = latest_dict.get("btc_avg_buy_price", 0)
    current_price = latest_dict.get("btc_krw_price", 0)

    # 현재 총 자산 (KRW 기준)
    total_value = current_krw + (current_btc * current_price)

    # 초기 투자금
    initial_value = first_dict.get("krw_balance", 0) + (first_dict.get("btc_balance", 0) * first_dict.get("btc_krw_price", 0))

    # 손익
    profit_loss = total_value - initial_value if initial_value > 0 else 0
    profit_loss_pct = (profit_loss / initial_value * 100) if initial_value > 0 else 0

    return {
        "current_btc_balance": current_btc,
        "current_krw_balance": current_krw,
        "btc_avg_buy_price": avg_buy_price,
        "current_btc_price": current_price,
        "total_value_krw": total_value,
        "initial_value_krw": initial_value,
        "profit_loss": profit_loss,
        "profit_loss_percentage": profit_loss_pct
    }

def get_recent_reflections(limit: int = 5) -> List[Dict]:
    """최근 AI 반성 일기 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, timestamp, decision, reflection
        FROM trades
        WHERE reflection IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,))

    reflections = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return reflections
