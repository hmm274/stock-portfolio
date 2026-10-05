from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.utils.class_weight import compute_class_weight
import requests
import os

ALPHAVANTAGE_KEY = os.getenv("ALPHAVANTAGE_KEY")

if not ALPHAVANTAGE_KEY:
    raise RuntimeError("ALPHAVANTAGE_KEY is not configured")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://stock-portfolio-seven-rust.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "backend running"}

@app.get("/stocks/search")
def search_stocks(keywords: str):
    response = requests.get(
        "https://www.alphavantage.co/query",
        params={
            "function": "SYMBOL_SEARCH",
            "keywords": keywords,
            "apikey": ALPHAVANTAGE_KEY,
        },
        timeout=10,
    )

    response.raise_for_status()
    return response.json()

@app.get("/stocks/{symbol}/prices")
def stock_prices(symbol: str, timeframe: str = "daily"):
    function = (
        "TIME_SERIES_WEEKLY"
        if timeframe == "weekly"
        else "TIME_SERIES_DAILY"
    )

    response = requests.get(
        "https://www.alphavantage.co/query",
        params={
            "function": function,
            "symbol": symbol.upper(),
            "apikey": ALPHAVANTAGE_KEY,
        },
        timeout=10,
    )

    response.raise_for_status()
    return response.json()

@app.get("/news")
def news(symbol: str | None = None):
    params = {
        "function": "NEWS_SENTIMENT",
        "apikey": ALPHAVANTAGE_KEY,
    }

    if symbol:
        params["tickers"] = symbol.upper()

    response = requests.get(
        "https://www.alphavantage.co/query",
        params=params,
        timeout=10,
    )

    response.raise_for_status()
    return response.json()

@app.post("/recommend")
def recommend(symbols: list[str]):
    results = []

    for symbol in symbols:
        df = yf.download(symbol, period="2y", interval="1d", progress=False)

        if len(df) < 150:
            continue

        # ===== FEATURES =====
        df["return_1"] = df["Close"].pct_change()
        df["return_5"] = df["Close"].pct_change(5)
        df["return_20"] = df["Close"].pct_change(20)

        df["volatility_20"] = df["return_1"].rolling(20).std()
        df["volatility_60"] = df["return_1"].rolling(60).std()

        df["ma_20"] = df["Close"].rolling(20).mean()
        df["ma_50"] = df["Close"].rolling(50).mean()
        close = df["Close"].squeeze()
        df["trend"] = (df["ma_20"] - df["ma_50"]) / close

        # ===== TARGET =====
        df["future_return"] = df["Close"].shift(-30) / df["Close"] - 1

        BUY_TH = 0.05
        SELL_TH = -0.05

        df["target"] = 1
        df.loc[df["future_return"] >= BUY_TH, "target"] = 2
        df.loc[df["future_return"] <= SELL_TH, "target"] = 0

        df = df.dropna()

        X = df[
            [
                "return_1",
                "return_5",
                "return_20",
                "volatility_20",
                "volatility_60",
                "trend",
            ]
        ]
        y = df["target"]

        # ===== TRAIN / TEST SPLIT =====
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, shuffle=False, test_size=0.25
        )

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        # ===== CLASS BALANCING =====
        weights = compute_class_weight(
            class_weight="balanced",
            classes=np.unique(y_train),
            y=y_train
        )
        class_weights = dict(enumerate(weights))

        # ===== MODEL =====
        model = MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            alpha=0.0005,
            learning_rate_init=0.001,
            max_iter=2000,
            early_stopping=True,
            validation_fraction=0.15,
            n_iter_no_change=20,
            random_state=42,
        )

        model.fit(X_train, y_train, sample_weight=np.vectorize(class_weights.get)(y_train))

        # ===== ACCURACY =====
        acc = accuracy_score(y_test, model.predict(X_test))

        # ===== LATEST PREDICTION =====
        latest_features = scaler.transform(X.tail(1))
        probs = model.predict_proba(latest_features)[0]
        pred_class = int(np.argmax(probs))
        confidence = float(np.max(probs))

        label_map = {0: "SELL", 1: "HOLD", 2: "BUY"}

        results.append({
            "symbol": symbol,
            "recommendation": label_map[pred_class],
            "confidence": round(confidence, 3),
            "model_accuracy": round(acc, 3),
        })
    return {"recommendations": results}