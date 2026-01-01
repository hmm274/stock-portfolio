from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.utils.class_weight import compute_class_weight

app = FastAPI()

# Allow React to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "backend running"}

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

        upper = df["future_return"].quantile(0.7)
        lower = df["future_return"].quantile(0.3)

        df["target"] = 1  # HOLD
        df.loc[df["future_return"] > upper, "target"] = 2  # BUY
        df.loc[df["future_return"] < lower, "target"] = 0  # SELL

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
            max_iter=800,
            random_state=42,
        )

        model.fit(X_train, y_train)

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