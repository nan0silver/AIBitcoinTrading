#!/bin/bash

# AI Bitcoin Trading 실행 스크립트
# 사용법: ./run_autotrade.sh

echo "🤖 AI Bitcoin Auto Trading 시작"
echo "================================"

# 가상환경 활성화
if [ -d "backend/venv" ]; then
    echo "✅ 가상환경 활성화 중..."
    source backend/venv/bin/activate
else
    echo "❌ 가상환경이 없습니다. 먼저 설치하세요:"
    echo "   cd backend && python3 -m venv venv"
    exit 1
fi

# 필요한 패키지 확인
echo "📦 패키지 확인 중..."
pip list | grep -q "openai" || echo "⚠️  openai 패키지가 필요합니다: pip install openai"
pip list | grep -q "selenium" || echo "⚠️  selenium 패키지가 필요합니다: pip install selenium"

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "❌ .env 파일이 없습니다!"
    echo "   cp .env.example .env"
    echo "   그리고 API 키를 입력하세요."
    exit 1
fi

echo ""
echo "⚠️  주의: 실제 거래가 실행됩니다!"
echo "계속하려면 Enter, 취소하려면 Ctrl+C"
read

echo ""
echo "🚀 autotrade.py 실행 중..."
python autotrade.py
