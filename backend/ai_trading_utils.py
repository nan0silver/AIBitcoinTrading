"""
AI 거래 분석 및 실행을 위한 유틸리티 함수들
autotrade.py의 로직을 API 형태로 제공
"""
import os
from dotenv import load_dotenv
import pyupbit
import pandas as pd
import requests
from openai import OpenAI
from datetime import datetime
from typing import Dict, Optional
import json

load_dotenv()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_fear_and_greed_index() -> Optional[Dict]:
    """공포-탐욕 지수 조회"""
    try:
        url = "https://api.alternative.me/fng/?limit=1"
        response = requests.get(url, timeout=10)
        data = response.json()

        if 'data' in data and len(data['data']) > 0:
            return {
                'value': int(data['data'][0]['value']),
                'classification': data['data'][0]['value_classification']
            }
    except Exception as e:
        print(f"공포-탐욕 지수 조회 실패: {e}")
    return None

def get_bitcoin_news() -> str:
    """최신 비트코인 뉴스 조회"""
    try:
        serp_api_key = os.getenv("SERP_API_KEY")
        if not serp_api_key:
            return "뉴스 API 키가 설정되지 않았습니다."

        url = "https://serpapi.com/search.json"
        params = {
            "q": "btc",
            "tbm": "nws",
            "api_key": serp_api_key
        }

        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        news_results = data.get("news_results", [])
        headlines = [item.get("title", "") for item in news_results[:5]]

        return "\n".join(headlines) if headlines else "뉴스를 가져올 수 없습니다."
    except Exception as e:
        print(f"뉴스 조회 실패: {e}")
        return "뉴스 조회에 실패했습니다."

def calculate_technical_indicators(df: pd.DataFrame) -> Dict:
    """기술적 지표 계산"""
    try:
        # 간단한 이동평균 계산
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()

        # 볼린저 밴드
        df['bb_mavg'] = df['close'].rolling(window=20).mean()
        df['bb_std'] = df['close'].rolling(window=20).std()
        df['bb_hband'] = df['bb_mavg'] + (df['bb_std'] * 2)
        df['bb_lband'] = df['bb_mavg'] - (df['bb_std'] * 2)

        # RSI 계산
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))

        # MACD 계산
        ema_12 = df['close'].ewm(span=12, adjust=False).mean()
        ema_26 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd'] = ema_12 - ema_26
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()

        latest = df.iloc[-1]

        return {
            'rsi': float(latest['rsi']) if pd.notna(latest['rsi']) else None,
            'macd': float(latest['macd']) if pd.notna(latest['macd']) else None,
            'macd_signal': float(latest['macd_signal']) if pd.notna(latest['macd_signal']) else None,
            'bb_upper': float(latest['bb_hband']) if pd.notna(latest['bb_hband']) else None,
            'bb_middle': float(latest['bb_mavg']) if pd.notna(latest['bb_mavg']) else None,
            'bb_lower': float(latest['bb_lband']) if pd.notna(latest['bb_lband']) else None,
            'sma_20': float(latest['sma_20']) if pd.notna(latest['sma_20']) else None,
            'ema_12': float(latest['ema_12']) if pd.notna(latest['ema_12']) else None
        }
    except Exception as e:
        print(f"기술적 지표 계산 실패: {e}")
        return {}

def get_ai_trading_decision(include_balance: bool = False) -> Dict:
    """
    AI 거래 분석 실행

    Args:
        include_balance: True면 실제 잔고 정보 포함, False면 분석만

    Returns:
        {
            'decision': 'buy' | 'sell' | 'hold',
            'reason': '의사결정 근거',
            'percentage': 0-100,
            'current_price': 현재가,
            'confidence': 신뢰도(선택)
        }
    """
    try:
        # 1. 현재 시장 데이터 수집
        current_price = pyupbit.get_current_price("KRW-BTC")

        # 2. OHLCV 데이터
        df_daily = pyupbit.get_ohlcv("KRW-BTC", interval="day", count=30)
        df_hourly = pyupbit.get_ohlcv("KRW-BTC", interval="minute60", count=24)

        # 3. 기술적 지표 계산
        indicators = calculate_technical_indicators(df_daily)

        # 4. 공포-탐욕 지수
        fear_greed = get_fear_and_greed_index()

        # 5. 뉴스
        news = get_bitcoin_news()

        # 6. 잔고 정보 (선택적)
        balance_info = ""
        if include_balance:
            try:
                access = os.getenv("UPBIT_ACCESS_KEY")
                secret = os.getenv("UPBIT_SECRET_KEY")
                if access and secret:
                    upbit = pyupbit.Upbit(access, secret)
                    balances = upbit.get_balances()

                    btc_balance = 0
                    krw_balance = 0
                    btc_avg_buy_price = 0

                    for b in balances:
                        if b['currency'] == 'BTC':
                            btc_balance = float(b['balance'])
                            btc_avg_buy_price = float(b['avg_buy_price'])
                        elif b['currency'] == 'KRW':
                            krw_balance = float(b['balance'])

                    balance_info = f"\n현재 보유 자산:\n- BTC: {btc_balance:.8f} (평균 매입가: {btc_avg_buy_price:,.0f}원)\n- KRW: {krw_balance:,.0f}원"
            except Exception as e:
                print(f"잔고 조회 실패: {e}")

        # 7. AI 프롬프트 구성
        prompt = f"""
당신은 비트코인 투자 전문가입니다. 아래 데이터를 분석하여 투자 결정을 내려주세요.

## 현재 시장 상황
- 현재 BTC 가격: {current_price:,.0f}원
- 공포-탐욕 지수: {fear_greed['value'] if fear_greed else 'N/A'} ({fear_greed['classification'] if fear_greed else 'N/A'})

## 기술적 지표
- RSI (14): {indicators.get('rsi', 'N/A')}
- MACD: {indicators.get('macd', 'N/A')}
- MACD Signal: {indicators.get('macd_signal', 'N/A')}
- 볼린저 밴드 상단: {indicators.get('bb_upper', 'N/A'):,.0f if indicators.get('bb_upper') else 'N/A'}
- 볼린저 밴드 중간: {indicators.get('bb_middle', 'N/A'):,.0f if indicators.get('bb_middle') else 'N/A'}
- 볼린저 밴드 하단: {indicators.get('bb_lower', 'N/A'):,.0f if indicators.get('bb_lower') else 'N/A'}
- SMA (20일): {indicators.get('sma_20', 'N/A'):,.0f if indicators.get('sma_20') else 'N/A'}
- EMA (12일): {indicators.get('ema_12', 'N/A'):,.0f if indicators.get('ema_12') else 'N/A'}

## 최신 뉴스
{news}

{balance_info}

다음 형식으로 답변해주세요:
{{
    "decision": "buy" 또는 "sell" 또는 "hold",
    "reason": "상세한 분석 근거 (2-3문장)",
    "percentage": 0-100 사이의 숫자 (매수/매도 시 자산의 몇 %를 사용할지)
}}

주의사항:
- RSI가 30 이하면 과매도(매수 고려), 70 이상이면 과매수(매도 고려)
- MACD가 시그널선을 상향 돌파하면 매수 신호, 하향 돌파하면 매도 신호
- 공포-탐욕 지수가 낮을수록 매수 기회, 높을수록 매도 고려
- 볼린저 밴드 하단 근처는 매수, 상단 근처는 매도 고려
"""

        # 8. OpenAI API 호출
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 비트코인 투자 전문가입니다. 데이터를 분석하여 JSON 형식으로만 답변하세요."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        result['current_price'] = current_price
        result['timestamp'] = datetime.now().isoformat()

        return result

    except Exception as e:
        print(f"AI 분석 실패: {e}")
        return {
            'decision': 'hold',
            'reason': f'AI 분석 중 오류 발생: {str(e)}',
            'percentage': 0,
            'current_price': pyupbit.get_current_price("KRW-BTC"),
            'timestamp': datetime.now().isoformat()
        }

def execute_trade(decision: str, percentage: int) -> Dict:
    """
    실제 거래 실행

    Args:
        decision: 'buy' | 'sell' | 'hold'
        percentage: 0-100 (자산의 몇 %를 거래할지)

    Returns:
        {
            'success': bool,
            'message': str,
            'order_info': dict (주문 정보)
        }
    """
    try:
        access = os.getenv("UPBIT_ACCESS_KEY")
        secret = os.getenv("UPBIT_SECRET_KEY")

        if not access or not secret:
            return {
                'success': False,
                'message': 'Upbit API 키가 설정되지 않았습니다.',
                'order_info': None
            }

        upbit = pyupbit.Upbit(access, secret)

        if decision == "buy":
            # 매수
            krw = upbit.get_balance("KRW")
            if krw is None:
                return {'success': False, 'message': 'KRW 잔고 조회 실패', 'order_info': None}

            amount_to_buy = krw * (percentage / 100) * 0.9995  # 수수료 고려

            if amount_to_buy < 5000:
                return {'success': False, 'message': f'주문 금액이 최소 금액(5,000원)보다 작습니다. (금액: {amount_to_buy:,.0f}원)', 'order_info': None}

            order = upbit.buy_market_order("KRW-BTC", amount_to_buy)

            return {
                'success': True,
                'message': f'매수 주문 완료: {amount_to_buy:,.0f}원',
                'order_info': order
            }

        elif decision == "sell":
            # 매도
            btc = upbit.get_balance("BTC")
            if btc is None:
                return {'success': False, 'message': 'BTC 잔고 조회 실패', 'order_info': None}

            amount_to_sell = btc * (percentage / 100)
            current_price = pyupbit.get_current_price("KRW-BTC")
            value_in_krw = amount_to_sell * current_price

            if value_in_krw < 5000:
                return {'success': False, 'message': f'주문 금액이 최소 금액(5,000원)보다 작습니다. (금액: {value_in_krw:,.0f}원)', 'order_info': None}

            order = upbit.sell_market_order("KRW-BTC", amount_to_sell)

            return {
                'success': True,
                'message': f'매도 주문 완료: {amount_to_sell:.8f} BTC (약 {value_in_krw:,.0f}원)',
                'order_info': order
            }

        else:  # hold
            return {
                'success': True,
                'message': '보유 결정 - 거래 없음',
                'order_info': None
            }

    except Exception as e:
        return {
            'success': False,
            'message': f'거래 실행 실패: {str(e)}',
            'order_info': None
        }
