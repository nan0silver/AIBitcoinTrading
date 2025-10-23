"""
데이터베이스 초기화 스크립트
빈 ai_trading.db를 생성하고 테이블을 초기화합니다.
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = "../ai_trading.db"

def initialize_database():
    """데이터베이스 초기화"""

    # 기존 DB 파일 존재 여부 확인
    db_exists = os.path.exists(DB_PATH)

    if db_exists:
        print(f"⚠️  기존 데이터베이스 파일이 존재합니다: {DB_PATH}")
        response = input("기존 데이터를 유지하고 테이블만 확인하시겠습니까? (y/n): ")
        if response.lower() != 'y':
            print("❌ 취소되었습니다.")
            return

    # 데이터베이스 연결
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # trades 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            decision TEXT NOT NULL,
            reason TEXT NOT NULL,
            percentage INTEGER NOT NULL,
            btc_balance REAL NOT NULL,
            krw_balance REAL NOT NULL,
            btc_avg_buy_price REAL NOT NULL,
            btc_krw_price REAL NOT NULL,
            reflection TEXT
        )
    ''')

    conn.commit()

    # 데이터 확인
    cursor.execute('SELECT COUNT(*) FROM trades')
    count = cursor.fetchone()[0]

    if count == 0:
        print("\n✅ 데이터베이스가 성공적으로 초기화되었습니다!")
        print(f"📁 파일 위치: {os.path.abspath(DB_PATH)}")
        print("\n💡 현재 거래 내역이 없습니다.")
        print("\n다음 중 하나를 수행하세요:")
        print("  1. autotrade.py를 실행하여 실제 거래 데이터 생성")
        print("  2. 아래 옵션으로 샘플 데이터 추가")

        response = input("\n샘플 데이터를 추가하시겠습니까? (y/n): ")
        if response.lower() == 'y':
            add_sample_data(cursor, conn)
    else:
        print(f"\n✅ 데이터베이스가 정상적으로 연결되었습니다!")
        print(f"📊 총 거래 내역: {count}건")
        print(f"📁 파일 위치: {os.path.abspath(DB_PATH)}")

    conn.close()

def add_sample_data(cursor, conn):
    """샘플 데이터 추가 (테스트용)"""

    sample_trades = [
        {
            'timestamp': '2025-01-15 09:00:00',
            'decision': 'buy',
            'reason': 'RSI가 30 이하로 과매도 구간 진입. 공포-탐욕 지수 25(극도의 공포)로 매수 기회 포착.',
            'percentage': 50,
            'btc_balance': 0.01,
            'krw_balance': 5000000,
            'btc_avg_buy_price': 95000000,
            'btc_krw_price': 95000000,
            'reflection': 'RSI 과매도 신호를 근거로 매수를 결정했으나, 단기 하락 추세를 충분히 고려하지 못했습니다. 다음에는 추세선 분석을 함께 고려해야 합니다.'
        },
        {
            'timestamp': '2025-01-15 14:00:00',
            'decision': 'hold',
            'reason': '현재 시장이 횡보 중이며 명확한 추세가 없음. 변동성이 낮아 관망 필요.',
            'percentage': 0,
            'btc_balance': 0.01,
            'krw_balance': 5000000,
            'btc_avg_buy_price': 95000000,
            'btc_krw_price': 96000000,
            'reflection': '횡보장에서 적절하게 보류 결정을 내렸습니다. 불필요한 거래를 피한 것이 좋았습니다.'
        },
        {
            'timestamp': '2025-01-15 18:00:00',
            'decision': 'sell',
            'reason': 'RSI 75로 과매수 구간 진입. 단기 저항선(98M)에 도달하여 일부 매도로 수익 실현.',
            'percentage': 30,
            'btc_balance': 0.007,
            'krw_balance': 7940000,
            'btc_avg_buy_price': 95000000,
            'btc_krw_price': 98000000,
            'reflection': '적절한 타이밍에 일부 매도하여 약 3%의 수익을 실현했습니다. 전량 매도가 아닌 일부만 매도한 것이 좋은 선택이었습니다.'
        },
        {
            'timestamp': '2025-01-16 09:00:00',
            'decision': 'buy',
            'reason': '전날 조정을 거쳐 다시 매수 타이밍 도래. MACD 골든크로스 발생.',
            'percentage': 40,
            'btc_balance': 0.011,
            'krw_balance': 4000000,
            'btc_avg_buy_price': 96000000,
            'btc_krw_price': 97000000,
            'reflection': 'MACD 골든크로스를 신호로 매수했으나, 거래량 증가 여부를 확인하지 못했습니다. 기술적 지표와 함께 거래량 분석이 필요합니다.'
        },
        {
            'timestamp': '2025-01-16 14:00:00',
            'decision': 'hold',
            'reason': '상승 추세 유지 중이나 급등 후 단기 조정 가능성. 추가 관망.',
            'percentage': 0,
            'btc_balance': 0.011,
            'krw_balance': 4000000,
            'btc_avg_buy_price': 96000000,
            'btc_krw_price': 99000000,
            'reflection': '상승 추세에서 적절하게 보유를 결정했습니다. 추가 상승 여력을 남겨둔 것이 좋았습니다.'
        }
    ]

    for trade in sample_trades:
        cursor.execute('''
            INSERT INTO trades (timestamp, decision, reason, percentage,
                              btc_balance, krw_balance, btc_avg_buy_price,
                              btc_krw_price, reflection)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            trade['timestamp'],
            trade['decision'],
            trade['reason'],
            trade['percentage'],
            trade['btc_balance'],
            trade['krw_balance'],
            trade['btc_avg_buy_price'],
            trade['btc_krw_price'],
            trade['reflection']
        ))

    conn.commit()

    print(f"\n✅ {len(sample_trades)}건의 샘플 데이터가 추가되었습니다!")
    print("\n📊 샘플 데이터 요약:")
    print(f"  - 매수(buy): 2건")
    print(f"  - 매도(sell): 1건")
    print(f"  - 보유(hold): 2건")
    print("\n이제 대시보드에서 데이터를 확인할 수 있습니다!")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 AI Bitcoin Trading - 데이터베이스 초기화")
    print("=" * 60)
    print()

    initialize_database()

    print("\n" + "=" * 60)
    print("완료!")
    print("=" * 60)
