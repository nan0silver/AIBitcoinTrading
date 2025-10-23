# 🚀 빠른 시작 가이드

## ⚠️ 중요: 거래 실행 여부

### 대시보드는 **조회 전용**입니다!

| 항목 | 대시보드 (backend + frontend) | autotrade.py |
|------|------------------------------|--------------|
| **실제 거래** | ❌ 없음 | ✅ 있음 (실제 매수/매도) |
| **시장 조회** | ✅ 가능 | ✅ 가능 |
| **거래 내역** | ✅ 읽기만 | ✅ 읽기/쓰기 |
| **돈 움직임** | ❌ 없음 | ⚠️ **실제로 돈이 움직임** |

**안전하게 사용하려면:**
```bash
# 조회만 하고 싶을 때 (안전)
python backend/main.py       # 백엔드만 실행
npm run dev --prefix frontend # 프론트엔드만 실행

# 실제 거래를 원할 때 (주의!)
python autotrade.py  # ⚠️ 이것만 실제 거래 실행
```

---

## 📋 사전 준비

### 1. 필수 소프트웨어 설치

- **Python 3.11+**
- **Node.js 18+**
- **pip** (Python 패키지 매니저)
- **npm** (Node 패키지 매니저)

### 2. API 키 발급 (선택사항)

대시보드만 사용하려면 API 키 없이도 가능하지만, 일부 기능은 제한됩니다.

| API | 필수 여부 | 용도 |
|-----|----------|------|
| Upbit | ❌ 선택 | 포트폴리오, 거래 내역 (없으면 샘플 데이터 사용) |
| OpenAI | ❌ 선택 | AI 반성 일기 생성 (없어도 대시보드 작동) |
| SerpAPI | ❌ 선택 | 뉴스 수집 (없어도 대시보드 작동) |

---

## 🎯 30초 빠른 시작 (API 키 없이)

### 1단계: 데이터베이스 초기화

```bash
# 프로젝트 디렉토리로 이동
cd AIBitcoinTrading

# 데이터베이스 초기화 + 샘플 데이터 추가
cd backend
python3 init_db.py
```

**질문이 나오면:**
- "샘플 데이터를 추가하시겠습니까?" → **y** 입력

### 2단계: 백엔드 실행

```bash
# 가상 환경 생성 (한 번만)
python3 -m venv venv

# 가상 환경 활성화
source venv/bin/activate  # macOS/Linux
# Windows: venv\Scripts\activate

# 패키지 설치
pip install fastapi uvicorn websockets pyupbit pandas pydantic requests

# 서버 실행
python main.py
```

✅ **백엔드 실행 확인**: `http://localhost:8000` 접속

### 3단계: 프론트엔드 실행

**새 터미널을 열고:**

```bash
cd AIBitcoinTrading/frontend

# 패키지 설치 (한 번만)
npm install

# 개발 서버 실행
npm run dev
```

✅ **프론트엔드 접속**: `http://localhost:5173`

---

## 🔑 API 키와 함께 사용하기 (실제 데이터)

### 1단계: 환경 변수 설정

```bash
# 루트 디렉토리로 이동
cd AIBitcoinTrading

# .env.example을 복사하여 .env 생성
cp .env.example .env

# .env 파일 편집
nano .env  # 또는 code .env (VS Code)
```

**.env 파일 예시:**
```bash
UPBIT_ACCESS_KEY=your_actual_access_key_here
UPBIT_SECRET_KEY=your_actual_secret_key_here
OPENAI_API_KEY=sk-your_actual_openai_key_here
SERP_API_KEY=your_actual_serp_key_here
```

### 2단계: 백엔드 재실행

```bash
cd backend
source venv/bin/activate
python main.py
```

이제 **실제 포트폴리오 데이터**가 표시됩니다!

---

## 🎨 대시보드 기능

### 조회 가능한 정보

1. **실시간 BTC 가격** (WebSocket)
2. **공포-탐욕 지수**
3. **포트폴리오 잔고** (API 키 필요)
4. **기술적 지표** (RSI, MACD, 볼린저 밴드)
5. **가격 차트** (1시간/1일 봉)
6. **거래 히스토리** (DB에서 읽기)
7. **AI 의사결정 로그** (DB에서 읽기)
8. **거래 통계**

### 실행 불가능한 기능

- ❌ 매수/매도 주문
- ❌ 잔고 변경
- ❌ AI 자동 거래 실행

---

## 🤖 실제 자동 거래 실행하기 (주의!)

### ⚠️ 경고
**실제 돈이 움직입니다!** 테스트는 소액으로 진행하세요.

```bash
# 대시보드는 그대로 두고, 새 터미널에서 실행
cd AIBitcoinTrading

# 자동 거래 봇 실행 (실제 거래 발생!)
python autotrade.py
```

**거래가 실행되면:**
- 대시보드에서 **실시간으로 확인 가능**
- 거래 내역이 자동으로 DB에 저장됨
- WebSocket으로 즉시 업데이트

---

## 🐛 트러블슈팅

### 500 Internal Server Error

**원인:** 데이터베이스 파일 없음

**해결:**
```bash
cd backend
python init_db.py  # 샘플 데이터와 함께 DB 생성
```

### CORS 에러

**원인:** 프론트엔드와 백엔드 포트 불일치

**해결:**
- 백엔드: `http://localhost:8000`
- 프론트엔드: `http://localhost:5173`
- `frontend/src/services/api.js`에서 `API_BASE_URL` 확인

### WebSocket 연결 실패

**원인:** 백엔드 미실행

**해결:**
```bash
cd backend
python main.py  # 백엔드 먼저 실행
```

### TailwindCSS 에러

**원인:** PostCSS 플러그인 버전 문제

**해결:**
```bash
cd frontend
npm install @tailwindcss/postcss
npm run dev
```

---

## 📊 데이터 흐름

```
┌─────────────────┐
│   autotrade.py  │ ← 실제 거래 실행 (선택)
│  (AI 자동 거래)  │
└────────┬────────┘
         │ 거래 데이터 저장
         ↓
┌─────────────────┐
│  ai_trading.db  │ ← SQLite 데이터베이스
│   (거래 내역)    │
└────────┬────────┘
         │ 읽기 전용
         ↓
┌─────────────────┐
│  backend/       │ ← FastAPI 서버
│  main.py        │   (조회 API + WebSocket)
└────────┬────────┘
         │ REST API / WebSocket
         ↓
┌─────────────────┐
│  frontend/      │ ← React 대시보드
│  (브라우저)      │   (시각화 + 모니터링)
└─────────────────┘
```

---

## 🔄 일상적인 사용법

### 조회만 하고 싶을 때

```bash
# 터미널 1: 백엔드
cd backend && source venv/bin/activate && python main.py

# 터미널 2: 프론트엔드
cd frontend && npm run dev

# 브라우저: http://localhost:5173
```

### 자동 거래와 함께 사용할 때

```bash
# 터미널 1: 백엔드
cd backend && python main.py

# 터미널 2: 프론트엔드
cd frontend && npm run dev

# 터미널 3: 자동 거래 봇
python autotrade.py  # ⚠️ 실제 거래 발생

# 브라우저: http://localhost:5173 (실시간 모니터링)
```

---

## ✅ 체크리스트

시작하기 전에 확인하세요:

- [ ] Python 3.11+ 설치 확인 (`python3 --version`)
- [ ] Node.js 18+ 설치 확인 (`node --version`)
- [ ] 데이터베이스 초기화 (`python backend/init_db.py`)
- [ ] 백엔드 실행 (`http://localhost:8000` 접속 확인)
- [ ] 프론트엔드 실행 (`http://localhost:5173` 접속 확인)
- [ ] (선택) .env 파일 설정 (실제 데이터 사용 시)

---

## 📞 도움이 필요하신가요?

- **전체 문서**: [DASHBOARD_README.md](./DASHBOARD_README.md)
- **GitHub Issues**: 문제 보고
- **API 문서**: `http://localhost:8000/docs` (백엔드 실행 후)

즐거운 트레이딩 되세요! 🚀
