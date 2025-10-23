# AI Bitcoin Trading Dashboard

실시간 AI 기반 비트코인 자동 거래 모니터링 대시보드

## 🎨 주요 기능

### 📊 실시간 모니터링
- **실시간 BTC 가격**: WebSocket을 통한 1초 단위 가격 업데이트
- **공포-탐욕 지수**: 시장 심리 실시간 추적
- **기술적 지표**: RSI, MACD, 볼린저 밴드 등

### 💼 포트폴리오 관리
- 현재 BTC/KRW 잔고 확인
- 총 자산 가치 및 수익률 계산
- 평균 매입가 vs 현재가 비교

### 📈 차트 & 시각화
- 인터랙티브 가격 차트 (1시간/1일 봉)
- 거래 통계 파이 차트
- 반응형 디자인 (모바일/태블릿/데스크톱)

### 🤖 AI 의사결정 로그
- AI의 매수/매도/보유 결정 내역
- 각 결정에 대한 상세 근거
- AI 반성 일기 (과거 거래 학습)

### 📜 거래 히스토리
- 전체 거래 내역 조회
- 각 거래의 상세 정보 (잔고, 가격 등)

## 🚀 설치 및 실행

### 1. 백엔드 서버 실행

```bash
# 백엔드 디렉토리로 이동
cd backend

# Python 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

백엔드 서버가 `http://localhost:8000`에서 실행됩니다.

### 2. 프론트엔드 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 3. 브라우저에서 접속

브라우저에서 `http://localhost:5173`을 열면 대시보드를 볼 수 있습니다!

## 📁 프로젝트 구조

```
AIBitcoinTrading/
├── backend/                    # FastAPI 백엔드
│   ├── main.py                 # API 서버 메인
│   ├── models.py               # Pydantic 데이터 모델
│   ├── database.py             # SQLite 연결 및 쿼리
│   └── requirements.txt        # Python 의존성
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── MarketInfo.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   ├── PriceChart.jsx
│   │   │   ├── TradeHistory.jsx
│   │   │   ├── TechnicalIndicators.jsx
│   │   │   ├── AIDecisions.jsx
│   │   │   └── Statistics.jsx
│   │   ├── services/
│   │   │   └── api.js          # API 클라이언트
│   │   ├── App.jsx             # 메인 앱
│   │   └── index.css           # TailwindCSS 스타일
│   ├── package.json
│   └── tailwind.config.js
│
├── autotrade.py                # 자동 거래 봇 (기존)
├── ai_trading.db               # SQLite 데이터베이스
└── DASHBOARD_README.md         # 이 파일
```

## 🛠 기술 스택

### 백엔드
- **FastAPI**: 고성능 비동기 Python 웹 프레임워크
- **WebSocket**: 실시간 데이터 스트리밍
- **SQLite**: 경량 데이터베이스
- **pyupbit**: Upbit 거래소 API 클라이언트
- **pandas & ta**: 기술적 지표 계산

### 프론트엔드
- **React 18**: UI 라이브러리
- **Vite**: 빠른 개발 서버
- **TailwindCSS**: 유틸리티 우선 CSS 프레임워크
- **Recharts**: 리액트 차트 라이브러리
- **Axios**: HTTP 클라이언트
- **lucide-react**: 아이콘 라이브러리

## 🎯 API 엔드포인트

### REST API
- `GET /api/trades` - 거래 내역 조회
- `GET /api/statistics` - 거래 통계
- `GET /api/portfolio` - 포트폴리오 정보
- `GET /api/market` - 실시간 시장 데이터
- `GET /api/indicators` - 기술적 지표
- `GET /api/fear-greed` - 공포-탐욕 지수
- `GET /api/reflections` - AI 반성 일기
- `GET /api/chart/ohlcv` - OHLCV 차트 데이터

### WebSocket
- `ws://localhost:8000/ws/market` - 실시간 가격 스트림
- `ws://localhost:8000/ws/trades` - 실시간 거래 내역

## 🎨 디자인 특징

### 다크 모드 지원
- 헤더 우측 상단의 태양/달 아이콘으로 전환 가능
- 시스템 설정에 따라 자동 적용

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 모두 최적화
- 그리드 레이아웃으로 다양한 화면 크기 지원

### 실시간 애니메이션
- 가격 변동 시 부드러운 전환 효과
- 로딩 스켈레톤 UI
- Pulse 애니메이션으로 실시간 상태 표시

## 📊 대시보드 구성

1. **상단 헤더**
   - 로고 및 제목
   - 다크/라이트 모드 토글

2. **시장 정보 카드** (3개)
   - Bitcoin 현재가 & 24시간 변동률
   - 공포-탐욕 지수
   - 실시간 연결 상태

3. **포트폴리오 & 가격 차트**
   - 총 자산 가치 및 수익률
   - BTC/KRW 잔고
   - 인터랙티브 가격 차트

4. **기술적 지표**
   - RSI, MACD, 볼린저 밴드
   - SMA, EMA

5. **거래 통계**
   - 거래 결정 분포 (파이 차트)
   - 매수/매도/보유 횟수

6. **AI 의사결정 & 거래 내역**
   - AI 반성 일기 (확장/축소 가능)
   - 전체 거래 히스토리

## 🔧 환경 설정

### 백엔드
백엔드는 기존 `autotrade.py`와 동일한 `.env` 파일을 사용합니다:
```
UPBIT_ACCESS_KEY=your_key
UPBIT_SECRET_KEY=your_secret
OPENAI_API_KEY=your_key
SERP_API_KEY=your_key
```

### 데이터베이스
`ai_trading.db` 파일이 자동으로 생성되며, `autotrade.py`와 공유됩니다.

## 🚦 사용 가이드

### 자동 거래 봇과 함께 사용하기

1. **터미널 1**: 자동 거래 봇 실행
   ```bash
   python autotrade.py
   ```

2. **터미널 2**: 백엔드 서버 실행
   ```bash
   cd backend
   python main.py
   ```

3. **터미널 3**: 프론트엔드 실행
   ```bash
   cd frontend
   npm run dev
   ```

이제 대시보드에서 AI의 실시간 거래를 모니터링할 수 있습니다!

## 🔍 트러블슈팅

### 백엔드가 시작되지 않을 때
- `ai_trading.db` 파일이 있는지 확인
- Python 의존성이 모두 설치되었는지 확인
- 포트 8000이 사용 중인지 확인

### 프론트엔드가 백엔드에 연결되지 않을 때
- 백엔드가 `http://localhost:8000`에서 실행 중인지 확인
- 브라우저 콘솔에서 CORS 오류 확인
- `src/services/api.js`의 `API_BASE_URL` 확인

### WebSocket 연결 실패
- 백엔드 서버가 정상 실행 중인지 확인
- 방화벽 설정 확인

## 📝 라이센스

이 프로젝트는 기존 AI Bitcoin Trading 프로젝트의 확장입니다.

## 🙏 크레딧

- **Upbit API**: 실시간 시장 데이터
- **Alternative.me**: Fear & Greed Index
- **OpenAI GPT-4o**: AI 의사결정 엔진
