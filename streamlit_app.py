import sqlite3
import pandas as pd
import streamlit as st
import plotly.express as px

# DB 연결 함수
def get_trades_data():
    conn = sqlite3.connect('ai_trading.db')  # SQLite 데이터베이스에 연결
    query = "SELECT * FROM trades"           # trades 테이블의 모든 데이터를 조회하는 쿼리
    df = pd.read_sql(query, conn)            # SQL 쿼리를 사용해 데이터프레임으로 변환
    conn.close()                             # DB 연결 종료
    return df

# Streamlit 앱의 제목
st.title("AI Trading Dashboard")

# 데이터 가져오기
df_trades = get_trades_data()

# 기본 통계
st.header('Basic Statistics')
st.write(f"Total number of trades: {len(df_trades)}")
st.write(f"First trade date: {df_trades['timestamp'].min()}")
st.write(f"Last trade date: {df_trades['timestamp'].max()}")

# 데이터프레임을 테이블로 표시
st.subheader("Trades Data")
st.dataframe(df_trades)  # Streamlit의 dataframe 함수로 데이터 출력

# 거래 결정 분포
st.header('Trade Decision Distribution')
decision_counts = df_trades['decision'].value_counts()
fig = px.pie(values=decision_counts.values, names=decision_counts.index, title='Trade Decisions')
st.plotly_chart(fig)


# reflection 칼럼만 따로 보기
st.subheader("Trade Reflections")
st.write(df_trades[["id", "reflection"]])
