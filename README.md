# Bitcoin AI 자동매매 시스템

## 시스템 흐름도

### 데이터 수집 → 지표 계산 → AI 결정 → 거래 실행 → 데이터베이스에 기록

1. 현재 투자 상태 조회
- 현재 보유 BTC, KRW

2. 오더북(호가 데이터) 조회

3. 차트 데이터 조회 및 보조지표 추가
- 30일 일봉 데이터 & 24시간 시간봉 데이터
- open, high, low, close, volume, value
    - 시가, 고가, 저가, 종가, 거래량, 거래대금
- bb_mavg, bb_hband, bb_lband
    - 볼린저밴드 중간선, 볼린저밴드 상단, 볼린저밴드 하단
- rsi, macd, macd_signal, macd_diff
    - 상대 강도 지수 (Relative Strength Index), 
    - 이동평균 수렴·확산 지표 (Moving Average Convergence Divergence)
    - MACD 시그널선
    - MACD 차이 (MACD Histogram)
- sma_20, ema_12
    - 단순 이동평균 20일 (Simple Moving Average 20)
    - 지수 이동평균 12일 (Exponential Moving Average 12)

4. 공포 탐욕 지수
- 시장 심리를 나타낸 지표
- fear-greed data [value, classification]

5. 최신 뉴스 헤드라인과 시간 정보
- 최신 헤드라인 5개와 published date

6. 차트 이미지 데이터
- 이동평균선, 볼린저 밴드, MACD 데이터 추가

7. 유튜브 자막 데이터
