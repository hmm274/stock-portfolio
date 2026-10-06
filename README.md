# Stock Portfolio

A full-stack stock portfolio application for tracking stocks, viewing market data and financial news, and generating machine-learning-based BUY, HOLD, or SELL recommendations.

**Live Demo:** https://stock-portfolio-seven-rust.vercel.app

## Overview

Stock Portfolio is a full-stack web application that allows users to create an account, search for publicly traded companies, build a personal portfolio, visualize historical price data, read market news, and generate stock recommendations using a machine learning model trained on historical market data.

The application uses React for the frontend, FastAPI for the backend, Supabase for authentication and persistent portfolio storage, Alpha Vantage for market data and news, and Yahoo Finance data for the recommendation model.

## Features

- User authentication with Supabase
- Persistent user portfolios
- Stock symbol search
- Daily and weekly historical price data
- Interactive stock price charts
- Company-specific financial news
- General market news
- Portfolio dashboard with recent price charts and price changes
- Machine-learning-based BUY, HOLD, and SELL recommendations
- Recommendation confidence and model test accuracy
- Row Level Security (RLS) for user data
- Server-side proxy for Alpha Vantage requests to protect API credentials
- Responsive React interface

## Tech Stack

### Frontend

- React 18
- React Router
- Axios
- Chart.js
- react-chartjs-2
- Supabase JavaScript SDK

### Backend

- Python
- FastAPI
- Uvicorn
- NumPy
- scikit-learn
- yfinance
- Requests
- python-dotenv

### Infrastructure and APIs

- Supabase — authentication and database
- Alpha Vantage — stock search, historical prices, and financial news
- Yahoo Finance / yfinance — historical data for recommendation model
- Vercel — frontend deployment
- Render — backend deployment

## Architecture

```text
                         ┌──────────────────┐
                         │      React       │
                         │      Vercel      │
                         └────────┬─────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
                   ▼                             ▼
          ┌────────────────┐           ┌─────────────────┐
          │    Supabase    │           │     FastAPI     │
          │ Auth + Database│           │     Render      │
          └────────────────┘           └────────┬────────┘
                                                │
                                  ┌─────────────┴─────────────┐
                                  │                           │
                                  ▼                           ▼
                         ┌────────────────┐           ┌──────────────┐
                         │ Alpha Vantage  │           │   yfinance   │
                         │ Prices + News  │           │ ML Training  │
                         └────────────────┘           └──────────────┘
```

The React frontend never receives the Alpha Vantage API key. Market-data requests are sent to the FastAPI backend, which communicates with Alpha Vantage using a server-side environment variable.

Supabase Row Level Security policies restrict database operations so authenticated users can access only their own profile and portfolio data.

## Machine Learning Recommendations

For each requested stock, the recommendation endpoint trains a neural-network classifier using up to two years of daily historical price data.

For each requested stock, the backend engineers the following features:

- 1-day return
- 5-day return
- 20-day return
- 20-day volatility
- 60-day volatility
- 20-day vs. 50-day moving-average trend

A target is generated using the stock's return over the following 30 trading days:

| Future Return | Classification |
| --- | --- |
| ≤ -5% | SELL |
| Between -5% and +5% | HOLD |
| ≥ +5% | BUY |

The model uses scikit-learn's `MLPClassifier` with two hidden layers:

```text
Input → 64 neurons → 32 neurons → BUY / HOLD / SELL
```

The dataset is split chronologically, with 75% used for training and 25% for testing. Features are standardized using `StandardScaler`, and class balancing is applied during training.

For each stock, the API returns a recommendation, confidence score, and model test accuracy.

Example:

```json
{
  "symbol": "AAPL",
  "recommendation": "BUY",
  "confidence": 0.72,
  "model_accuracy": 0.61
}
```

> The recommendation system is an experimental machine-learning feature and is not intended to provide financial advice.

## API

The FastAPI backend exposes endpoints for market data, financial news, and machine-learning recommendations.

### Backend Status

```http
GET /
```

Returns the current backend status.

### Search Stocks

```http
GET /stocks/search?keywords=apple
```

Searches for stock symbols through Alpha Vantage.

### Historical Prices

```http
GET /stocks/{symbol}/prices?timeframe=daily
```

Supported timeframes:

- `daily`
- `weekly`

### Financial News

```http
GET /news
```

Returns general financial news.

```http
GET /news?symbol=AAPL
```

Returns news associated with a specific ticker.

### Generate Recommendations

```http
POST /recommend
Content-Type: application/json
```

Example request:

```json
["AAPL", "MSFT", "NVDA"]
```

Example response:

```json
{
  "recommendations": [
    {
      "symbol": "AAPL",
      "recommendation": "BUY",
      "confidence": 0.72,
      "model_accuracy": 0.61
    }
  ]
}
```

## Security

### Supabase Row Level Security

Supabase Row Level Security is enabled for user and portfolio data.

Authenticated users can only:

- View their own profile
- Create and update their own profile
- View their own portfolio
- Add stocks to their own portfolio
- Remove stocks from their own portfolio

Authorization is based on the authenticated Supabase user UUID.

### API Key Protection

The Alpha Vantage API key is stored only on the backend as:

```env
ALPHAVANTAGE_KEY=
```

The frontend sends market-data requests to FastAPI instead of directly contacting Alpha Vantage.

The backend also sanitizes Alpha Vantage error responses so API credentials contained in upstream error messages are never forwarded to the browser.

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/hmm274/stock-portfolio.git
cd stock-portfolio
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_KEY=your_supabase_publishable_key
REACT_APP_BACKEND_URL=http://localhost:8000
ALPHAVANTAGE_KEY=your_alpha_vantage_api_key
```

The Supabase publishable/anon key is used by the frontend. Never place a Supabase service-role or secret key in a `REACT_APP_*` variable.

The Alpha Vantage API key is loaded by the FastAPI backend using `python-dotenv` and is not exposed to the frontend.

### 4. Install Backend Dependencies

```bash
pip install -r src/backend/requirements.txt
```

### 5. Start the Backend

```bash
python -m uvicorn src.backend.recommend:app --reload
```

The API will run at:

```text
http://localhost:8000
```

### 6. Start the Frontend

In another terminal:

```bash
npm start
```

The application will run at:

```text
http://localhost:3000
```

## Environment Variables

### Frontend

| Variable | Description |
| --- | --- |
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_KEY` | Supabase publishable/anon key |
| `REACT_APP_BACKEND_URL` | FastAPI backend URL |

### Backend

| Variable | Description |
| --- | --- |
| `ALPHAVANTAGE_KEY` | Alpha Vantage API key used only by the backend |

`ALPHAVANTAGE_KEY` must never use the `REACT_APP_` prefix because Create React App embeds variables with that prefix into the browser bundle.

## Project Structure

```text
stock-portfolio/
├── public/
├── src/
│   ├── backend/
│   │   ├── recommend.py
│   │   └── requirements.txt
│   │
│   ├── components/
│   │   ├── GeneralNews.js
│   │   ├── Homepage.js
│   │   ├── Login.js
│   │   ├── NotFound.js
│   │   ├── Portfolio.js
│   │   ├── Search.js
│   │   ├── Signup.js
│   │   ├── StockDetails.js
│   │   ├── SupabaseClient.js
│   │   └── getUserDetails.js
│   │
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Deployment

The application is deployed using two services:

- **Frontend:** Vercel
- **Backend:** Render

The production frontend communicates with the Render-hosted FastAPI API. CORS is configured on the backend to permit requests from the deployed Vercel application and the local development server.

## Limitations

- Alpha Vantage's free API tier is limited to 25 requests per day.
- Recommendation models are trained on demand, so generation can take several seconds.
- Historical market behavior does not guarantee future performance.
- The recommendation model is intended as a machine-learning demonstration rather than a production trading system.

## Future Improvements

- Cache market data to reduce Alpha Vantage API usage and avoid unnecessary repeated requests.
- Cache trained recommendation models instead of retraining a model for every request.
- Add portfolio quantities, purchase prices, profit/loss calculations, and overall portfolio performance tracking.
- Expand the recommendation model with additional technical indicators and evaluate alternative machine learning models.
- Add benchmark comparisons and more detailed model evaluation metrics.
- Improve loading states for backend startup delays.
- Add automated frontend and backend tests.
- Add support for additional portfolio analytics and visualizations.

## Disclaimer

This project is for educational and demonstration purposes only. Stock recommendations generated by the application do not constitute financial advice.
