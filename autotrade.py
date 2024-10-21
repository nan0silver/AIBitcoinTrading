import os
import requests  # 공포 탐욕 지수 API 호출을 위한 requests 라이브러리
from dotenv import load_dotenv
import pyupbit
import pandas as pd
import ta  # ta 라이브러리 사용
import json
from openai import OpenAI
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from datetime import datetime
import base64
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
import sqlite3  # SQLite for storing trade data


load_dotenv()

def fetch_past_reflections():
    """
    최근 거래에 대한 reflection 데이터를 가져오는 함수
    """
    conn = sqlite3.connect('ai_trading.db')
    cursor = conn.cursor()
    
    # 최근 5개의 reflection 데이터를 가져옴
    cursor.execute('SELECT reflection FROM trades WHERE reflection IS NOT NULL ORDER BY timestamp DESC LIMIT 5')
    past_reflections = cursor.fetchall()

    # 가져온 데이터를 정리
    reflections = [reflection[0] for reflection in past_reflections if reflection[0]]
    
    conn.close()
    return reflections

# SQLite 관련 함수 정의
def initialize_database():
    conn = sqlite3.connect('ai_trading.db')  # 데이터베이스 파일 생성/연결
    cursor = conn.cursor()
    
    # 매매 기록 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            decision TEXT,
            reason TEXT,
            percentage INTEGER,
            btc_balance REAL,
            krw_balance REAL,
            btc_avg_buy_price REAL,
            btc_krw_price REAL,
            reflection TEXT 
        )
    ''')
    conn.commit()
    conn.close()

def insert_trade(timestamp, decision, reason, percentage, btc_balance, krw_balance, btc_avg_buy_price, btc_krw_price):
    conn = sqlite3.connect('ai_trading.db')
    cursor = conn.cursor()

    # reflection 컬럼을 포함하고 기본값을 NULL로 삽입
    cursor.execute('''
        INSERT INTO trades (timestamp, decision, reason, percentage, btc_balance, krw_balance, btc_avg_buy_price, btc_krw_price, reflection)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (timestamp, decision, reason, percentage, btc_balance, krw_balance, btc_avg_buy_price, btc_krw_price, None))  # 기본값 None

    conn.commit()
    conn.close()


# SQLite 데이터베이스 초기화
initialize_database()

from openai import OpenAI
import json

def generate_reflection():
    conn = sqlite3.connect('ai_trading.db')
    cursor = conn.cursor()

    # 최근 매매 기록을 가져옴 (예: 5건)
    cursor.execute('SELECT * FROM trades ORDER BY timestamp DESC LIMIT 5')
    recent_trades = cursor.fetchall()

    # 최신 시장 데이터를 가져옴
    current_price = pyupbit.get_current_price("KRW-BTC")
    fear_greed_data = get_fear_and_greed_index()

    # AI 클라이언트 초기화
    client = OpenAI()

    for trade in recent_trades:
        trade_id, timestamp, decision, reason, percentage, btc_balance, krw_balance, btc_avg_buy_price, btc_krw_price, reflection = trade
        
        # 이미 반성 일기가 존재하는지 확인
        if reflection:
            #print(f"Trade {trade_id} already has a reflection, skipping.")
            continue  # 이미 작성된 경우에는 생략

        # 매매 후 BTC 가격 변화 분석
        price_change = ((current_price - btc_krw_price) / btc_krw_price) * 100
        
        # AI에게 전달할 메시지 작성
        prompt = f"""
        You are an expert Bitcoin investor. Please analyze the following trade data and current market conditions. Write a reflection journal that explains the trade decision, its outcome, and what could be improved in future decisions:

        Trade ID: {trade_id}
        Timestamp: {timestamp}
        Decision: {decision}
        Reason: {reason}
        Percentage: {percentage}%
        BTC balance: {btc_balance}
        KRW balance: {krw_balance}
        BTC average buy price: {btc_avg_buy_price}
        BTC price at trade: {btc_krw_price}
        Current BTC price: {current_price}
        Price change since trade: {price_change:.2f}%
        Fear and Greed Index: {fear_greed_data['value']} ({fear_greed_data['classification']})

        Reflect on whether the decision to {decision} was correct or incorrect. Provide suggestions for improving future decisions based on the market conditions and the Fear and Greed Index.
        """

        # OpenAI GPT-4 API를 호출하여 반성 일기를 생성
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[{
                "role": "user",
                "content": prompt
            }],
        )

        # GPT가 생성한 반성 일기를 가져옴
        reflection_entry = response.choices[0].message.content

        # reflection 컬럼에 일기 업데이트
        cursor.execute('''
            UPDATE trades
            SET reflection = ?
            WHERE id = ?
        ''', (reflection_entry, trade_id))
        print(f"Reflection added for trade {trade_id}: {reflection_entry[:100]}...")  # 일부 출력

    conn.commit()
    conn.close()



class AIDecision(BaseModel):
    decision: str  # either "buy", "sell", or "hold"
    reason: str    # explanation of the decision
    percentage: int

def get_youtube_transcript(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = transcript_list.find_transcript(['ko'])  # Fetch Korean transcript
        transcript_data = transcript.fetch()
        full_text = " ".join([entry['text'] for entry in transcript_data])
        return full_text
    except Exception as e:
        print(f"Error fetching transcript: {str(e)}")
        return None


def capture_chart_image():

    # ## 로컬용
    # # 크롬 옵션 설정
    # chrome_options = Options()
    # chrome_options.add_argument("--headless")  # 브라우저를 보이지 않게 실행

    # # ChromeDriver 설정
    # service = Service(ChromeDriverManager().install())
    # driver = webdriver.Chrome(service=service, options=chrome_options)


    ## EC2 서버용
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # 헤드리스 모드 사용
        # chrome_options.add_argument("--no-sandbox")
        # chrome_options.add_argument("--disable-dev-shm-usage")
        # chrome_options.add_argument("--disable-gpu") - 기존코드 가져옴

        service = Service('/usr/bin/chromedriver')  # Specify the path to the ChromeDriver executable

        # Initialize the WebDriver with the specified options
        driver = webdriver.Chrome(service=service, options=chrome_options)

    except Exception as e:
        print(f"ChromeDriver 생성 중 오류 발생: {e}")
        

    try:
        # 웹 페이지 열기
        url = "https://upbit.com/full_chart?code=CRIX.UPBIT.KRW-BTC"
        driver.get(url)

        # 페이지가 완전히 로드될 때까지 기다림
        time.sleep(2)  # 페이지 로딩 대기

        # 전체 화면으로 전환
        driver.fullscreen_window()

        # 1. 지표 버튼 클릭
        indicator_button_xpath = "/html/body/div[1]/div[2]/div[3]/span/div/div/div[1]/div/div/cq-menu[3]"
        indicator_button = driver.find_element(By.XPATH, indicator_button_xpath)
        ActionChains(driver).move_to_element(indicator_button).click().perform()

        # 2-1. 볼린저 밴드 선택 (지표 목록에서 볼린저 밴드 추가 버튼 클릭)
        time.sleep(2)  # 버튼이 뜨는 시간을 잠시 대기
        bollinger_band_xpath = "/html/body/div[1]/div[2]/div[3]/span/div/div/div[1]/div/div/cq-menu[3]/cq-menu-dropdown/cq-scroll/cq-studies/cq-studies-content/cq-item[15]"
        bollinger_band_button = driver.find_element(By.XPATH, bollinger_band_xpath)
        ActionChains(driver).move_to_element(bollinger_band_button).click().perform()

        # 1. 지표 버튼 클릭
        indicator_button_xpath = "/html/body/div[1]/div[2]/div[3]/span/div/div/div[1]/div/div/cq-menu[3]"
        indicator_button = driver.find_element(By.XPATH, indicator_button_xpath)
        ActionChains(driver).move_to_element(indicator_button).click().perform()

        # 2-2. MACD 선택 (지표 목록에서 볼린저 밴드 추가 버튼 클릭)
        macd_xpath = "/html/body/div[1]/div[2]/div[3]/span/div/div/div[1]/div/div/cq-menu[3]/cq-menu-dropdown/cq-scroll/cq-studies/cq-studies-content/cq-item[53]"
        macd_button = driver.find_element(By.XPATH, macd_xpath)
        ActionChains(driver).move_to_element(macd_button).click().perform()

        # 3. 스크린샷 찍기 전에 대기
        time.sleep(1)  # 지표 적용 후 기다림

        screenshot_png = driver.get_screenshot_as_png()  # 스크린샷을 PNG 바이너리로 얻음
        encoded_image = base64.b64encode(screenshot_png).decode('utf-8')  # Base64로 인코딩
        print("screenshot saved")

        
        return encoded_image

    finally:
        # 드라이버 종료
        driver.quit()


def get_latest_news():
    """
    SerpApi를 사용하여 최신 뉴스 헤드라인과 시간 정보를 가져오는 함수 (최대 5개)
    """
    api_key = os.getenv("SERP_API_KEY")  # .env 파일에 저장된 API 키 사용
    params = {
        "q": "btc",  # 비트코인 관련 최신 뉴스 검색어 변경
        "tbm": "nws",  # 뉴스 모드
        "api_key": api_key,
    }
    url = "https://serpapi.com/search.json"
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # HTTP 에러 발생 시 예외 발생
        news_data = response.json()

        # 뉴스 헤드라인과 시간 정보를 가져옴
        headlines_with_time = [
            (news['title'], news.get('date', 'No date information')) 
            for news in news_data.get('news_results', [])
        ]
        return headlines_with_time[:5]  # 최대 5개의 뉴스만 반환

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")  # HTTP 에러 처리
    except Exception as err:
        print(f"An error occurred: {err}")  # 일반 에러 처리
    return None

def get_fear_and_greed_index():
    """
    공포 탐욕 지수를 API로부터 가져오는 함수
    """
    url = "https://api.alternative.me/fng/?limit=1"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        fear_greed_value = data['data'][0]['value']
        fear_greed_classification = data['data'][0]['value_classification']
        return {
            'value': fear_greed_value,
            'classification': fear_greed_classification
        }
    else:
        print(f"Error fetching Fear and Greed Index: {response.status_code}")
        return None

def add_technical_indicators(df):
    """
    주어진 데이터프레임에 보조지표 추가 (ta 라이브러리 사용)
    """
    # NaN 값이 있는 행을 제거
    df = df.dropna()

    # Bollinger Bands
    bb_indicator = ta.volatility.BollingerBands(close=df["close"], window=20, window_dev=2)
    df['bb_mavg'] = bb_indicator.bollinger_mavg()
    df['bb_hband'] = bb_indicator.bollinger_hband()
    df['bb_lband'] = bb_indicator.bollinger_lband()

    # RSI
    df['rsi'] = ta.momentum.RSIIndicator(close=df['close'], window=14).rsi()

    # MACD
    macd_indicator = ta.trend.MACD(close=df['close'], window_slow=26, window_fast=12, window_sign=9)
    df['macd'] = macd_indicator.macd()
    df['macd_signal'] = macd_indicator.macd_signal()
    df['macd_diff'] = macd_indicator.macd_diff()

    # Simple Moving Average (SMA 20)
    df['sma_20'] = ta.trend.SMAIndicator(close=df['close'], window=20).sma_indicator()

    # Exponential Moving Average (EMA 12)
    df['ema_12'] = ta.trend.EMAIndicator(close=df['close'], window=12).ema_indicator()

    return df

# AI 자동매매 시스템 함수
def ai_trading():
    # Upbit 객체 생성
    access = os.getenv("UPBIT_ACCESS_KEY")
    secret = os.getenv("UPBIT_SECRET_KEY")
    upbit = pyupbit.Upbit(access, secret)

    # 1. 현재 투자 상태 조회
    all_balances = upbit.get_balances()
    filtered_balances = [balance for balance in all_balances if balance['currency'] in ['BTC', 'KRW']]
    
    # 2. 오더북(호가 데이터) 조회
    orderbook = pyupbit.get_orderbook("KRW-BTC")
    
    # 3. 차트 데이터 조회 및 보조지표 추가
    # 30일 일봉 데이터
    df_daily = pyupbit.get_ohlcv("KRW-BTC", interval="day", count=30)
    df_daily = add_technical_indicators(df_daily)  # 일봉 데이터에 보조지표 추가
    
    # 24시간 시간봉 데이터
    df_hourly = pyupbit.get_ohlcv("KRW-BTC", interval="minute60", count=24)
    df_hourly = add_technical_indicators(df_hourly)  # 시간봉 데이터에 보조지표 추가

    # 4. 공포 탐욕 지수 가져오기
    fear_greed_data = get_fear_and_greed_index()
    if fear_greed_data is not None:
        print(f"Fear and Greed Index: {fear_greed_data['value']} ({fear_greed_data['classification']})")
    
    # 5. 최신 뉴스 헤드라인과 시간 정보 가져오기
    latest_news = get_latest_news()
    if latest_news:
        print("Latest Bitcoin News Headlines:")
        for i, (headline, date) in enumerate(latest_news, 1):
            print(f"{i}. {headline} (Published on: {date})")

    # 6. 차트 이미지 Base64 가져오기 (1번 코드 활용)
    chart_image_base64 = capture_chart_image()

    # 7. Fetch YouTube transcript data
    # youtube_transcript = get_youtube_transcript("KSsA92e0GK8")
    # if youtube_transcript:
    #     print("YouTube Transcript Data:")
    #     print(youtube_transcript)
    f = open("strategy.txt", "r", encoding="utf-8")
    youtube_transcript = f.read()
    f.close()


    # 8. 과거 매매에 대한 reflection 데이터를 가져옴
    past_reflections = fetch_past_reflections()


    # AI에게 데이터 제공하고 판단 받기
    client = OpenAI()

    response = client.chat.completions.create(
    model="gpt-4o-2024-08-06",
    messages=[
        {
            "role": "system",
            "content": """You are an expert in Bitcoin investing. Analyze the provided data including technical indicators, the Fear and Greed Index, and the latest Bitcoin news headlines. Tell me whether to buy, sell, or hold at the moment. Consider the following indicators in your analysis:
            - Bollinger Bands (bb_mavg, bb_hband, bb_lband)
            - RSI (rsi)
            - MACD (macd, macd_signal, macd_diff)
            - Moving Averages (sma_20, ema_12)
            - Fear and Greed Index (value, classification)
            - Latest Bitcoin News Headlines with publication time
            - YouTube Transcript Data
            - Chart Data (Image)
            - Past Trade Reflections: {past_reflections}

            You must cross-check any signals from the indicators against the strategies outlined in the video transcript. If the indicators suggest one action but the strategies in the video suggest caution, prioritize the video’s advice. Your decision must align with the video’s guidance, ensuring that the trading strategies within the video are applied as closely as possible.

            
            Respond in JSON format with three fields: 'decision', 'reason', and 'percentage'. 
            The 'percentage' field should be a number between 0 and 100, 
            representing the percentage of your available KRW to use for a 'buy' decision or the percentage of your BTC to sell for a 'sell' decision."""
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"Current investment status: {json.dumps(filtered_balances)}\n"
                        f"Orderbook: {json.dumps(orderbook)}\n"
                        f"Daily OHLCV with indicators (30 days): {df_daily.to_json()}\n"
                        f"Hourly OHLCV with indicators (24 hours): {df_hourly.to_json()}\n"
                        f"Fear and Greed Index: {fear_greed_data}\n"
                        f"Latest News Headlines: {latest_news}\n"
                        f"YouTube Transcript: {youtube_transcript}"
                    ),

                    #"text": f"Current investment status: {json.dumps(filtered_balances)}\nOrderbook: {json.dumps(orderbook)}\nDaily OHLCV with indicators (30 days): {df_daily.to_json()}\nHourly OHLCV with indicators (24 hours): {df_hourly.to_json()}\nFear and Greed Index: {fear_greed_data}\nLatest News Headlines: {latest_news}\nYouTube Transcript: {youtube_transcript}",
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{chart_image_base64}"
                    }
                }
            ]
        }
    ],
    response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "BitcoinInvestmentDecision",  # Adding a name to the schema
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "decision": {"type": "string", "enum": ["buy", "sell", "hold"]},
                        "reason": {"type": "string"},
                        "percentage": {"type": "integer"}
                    },
                    "required": ["decision", "reason", "percentage"],
                    "additionalProperties": False
                }
            }
        }
    )
    # Getting structured response
    result = AIDecision.model_validate_json(response.choices[0].message.content)

    print(f"### AI Decision: {result.decision.upper()} ###")
    print(f"### Reason: {result.reason} ###")

    # Handling AI's decision
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Handling AI's decision
    if result.decision == "buy":
        my_krw = upbit.get_balance("KRW")
        percentage = result.percentage
        
        # Ensure the percentage is between 0 and 100
        if 0 <= percentage <= 100:
            amount_to_buy = my_krw * (percentage / 100) * 0.9995
            if amount_to_buy > 5000:  # Ensure minimum order size
                print(f"### Buy Order Executed: {amount_to_buy} KRW worth of BTC ###")
                print(upbit.buy_market_order("KRW-BTC", amount_to_buy))
            else:
                print("### Buy Order Failed: Insufficient KRW (less than 5000 KRW) ###")
        else:
            print(f"Invalid percentage: {percentage}")

    elif result.decision == "sell":
        my_btc = upbit.get_balance("BTC")  # Get BTC balance
        percentage = result.percentage
        
        # Ensure the percentage is between 0 and 100
        if 0 <= percentage <= 100:
            amount_to_sell = my_btc * (percentage / 100)
            current_price = pyupbit.get_orderbook(ticker="KRW-BTC")['orderbook_units'][0]["ask_price"]
            value_in_krw = amount_to_sell * current_price  # Convert BTC to KRW value

            if value_in_krw > 5000:  # Ensure minimum order size
                print(f"### Sell Order Executed: {amount_to_sell} BTC worth of {value_in_krw} KRW ###")
                print(upbit.sell_market_order("KRW-BTC", amount_to_sell))
            else:
                print("### Sell Order Failed: Insufficient BTC (less than 5000 KRW worth) ###")
        else:
            print(f"Invalid percentage: {percentage}")

    elif result.decision == "hold":
        print("### Hold Position ###")

    # 거래 실행 여부와 관계없이 현재 잔고 조회
    time.sleep(1)  # API 호출 제한을 고려하여 잠시 대기
    balances = upbit.get_balances()
    btc_balance = next((float(balance['balance']) for balance in balances if balance['currency'] == 'BTC'), 0)
    krw_balance = next((float(balance['balance']) for balance in balances if balance['currency'] == 'KRW'), 0)
    btc_avg_buy_price = next((float(balance['avg_buy_price']) for balance in balances if balance['currency'] == 'BTC'), 0)
    current_btc_price = pyupbit.get_current_price("KRW-BTC")

    # 거래 정보 로깅
    insert_trade(timestamp, result.decision, result.reason,  result.percentage,
              btc_balance, krw_balance, btc_avg_buy_price, current_btc_price)
    
    # 매매 후 반성 일기 작성
    generate_reflection()



# Main loop
while True:
    try:
        ai_trading()
        time.sleep(3600 * 4)  # 4시간마다 실행
    except Exception as e:
        print(f"An error occurred: {e}")
        time.sleep(300)  # 오류 발생 시 5분 후 재시도


#ai_trading()
