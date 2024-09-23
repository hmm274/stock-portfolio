import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from './SupabaseClient';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_KEY = process.env.REACT_APP_API_KEY;

const StockDetails = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({});
  const initialTimeframe = symbol.includes('.') ? '1day' : '5min';
  const [timeFrame, setTimeFrame] = useState(initialTimeframe); // State to hold selected time frame
  const [newsData, setNewsData] = useState([]);
  const [priceDifference, setPriceDifference] = useState(null);
  const [stockAdded, setStockAdded] = useState(false);
  const [user, setUser] = useState(null);
  const externalStock = symbol.includes('.') ? false : true;

  // Check if the stock is in the user's portfolio
  const checkIfStockIsAdded = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('portfolio')
      .select('stock_symbol')
      .eq('user_id', userId)
      .eq('stock_symbol', symbol);

    if (error) {
      console.error('Error checking portfolio:', error.message);
    } else {
      if (data.length > 0) {
        setStockAdded(true); // Stock already in portfolio
      }
    }
  },[symbol]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        checkIfStockIsAdded(session.user.id);
      }
    };
    getUser();
  }, [symbol, checkIfStockIsAdded]);

  const addStock = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('portfolio')
        .insert([{ user_id: user.id, stock_symbol: symbol }]);

      if (error) {
        console.error('Error adding stock:', error.message);
      } else {
        console.log('Stock added:', data);
        setStockAdded(true);
      }
    }
  };

  const removeStock = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('portfolio')
        .delete()
        .match({ user_id: user.id, stock_symbol: symbol });

      if (error) {
        console.error('Error removing stock:', error.message);
      } else {
        console.log('Stock removed:', data);
        setStockAdded(false);
      }
    }
  };

  const fetchStockData = useCallback(async () => {
    const functionType = timeFrame === '1day' ? 'TIME_SERIES_DAILY' : timeFrame === '1week' ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_INTRADAY';
    const interval = timeFrame === '5min' ? '&interval=5min' : '';
    const url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}${interval}&apikey=${API_KEY}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      if (data['Error Message'] || data['Information']) {
        setError('Unable to fetch stock data. ' + (data['Error Message'] || data['Information']));
        setLoading(false);
        return;
      }

      setStockData(data);
      const timeSeriesKey = timeFrame === '1day' ? 'Time Series (Daily)' : timeFrame === '1week' ? 'Weekly Time Series' : 'Time Series (5min)';
      prepareChartData(data[timeSeriesKey]);
      setLoading(false);
    } catch (err) {
      setError('Error fetching stock data: ' + err.message);
      setLoading(false);
    }
  }, [symbol, timeFrame]);

  const fetchNewsData = useCallback(async () => {
    const newsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;

    try {
      const response = await axios.get(newsUrl);
      const data = response.data;

      if (data && data.feed) {
        const formattedNews = data.feed.slice(0, 5).map((article) => ({
          title: article.title,
          summary: article.summary,
          url: article.url,
          date: formatArticleDate(article.time_published),
        }));
        setNewsData(formattedNews);
      } else {
        setNewsData([]);
      }
    } catch (error) {
      setNewsData('Error fetching data: ' + error.message);
    }
  }, [symbol]);

  const formatArticleDate = (rawDate) => {
    const year = rawDate.slice(0, 4);
    const month = rawDate.slice(4, 6);
    const day = rawDate.slice(6, 8);
    const time = rawDate.slice(9, 13);
    return `${year}-${month}-${day} ${time.slice(0, 2)}:${time.slice(2)}`;
  };

  const prepareChartData = (timeSeries) => {
    const dates = Object.keys(timeSeries).slice(0, 30).reverse();
    const prices = dates.map((date) => timeSeries[date]['4. close']);
    const difference = prices[prices.length - 1] - prices[0];
    setPriceDifference(difference);
    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Closing Price (USD)',
          data: prices,
          borderColor: difference > 0 ? 'rgba(0,255,0,1)' : difference < 0 ? 'rgba(255,0,0,1)' : 'rgba(0,200,255,1)',
          backgroundColor: difference > 0 ? 'rgba(0,255,0,0.2)' : difference < 0 ? 'rgba(255,0,0,0.2)' : 'rgba(0,200,255,0.2)',
          fill: true,
          tension: 0.1,
        },
      ],
    });
  };

  useEffect(() => {
    fetchStockData();
    fetchNewsData();

    const interval = setInterval(() => {
      if (isMarketOpen()) {
        fetchStockData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol, timeFrame, fetchStockData, fetchNewsData]);

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  };

  if (loading) return <p>Loading stock data...</p>;
  if (error) return <p>{error}</p>;

  const timeSeries = stockData['Time Series (5min)'] || stockData['Time Series (Daily)'] || stockData['Weekly Time Series'];
  const lastDate = Object.keys(timeSeries)[0];
  const lastData = timeSeries[lastDate];
  const currentPrice = lastData['4. close'];
  const highPrice = lastData['2. high'];
  const lowPrice = lastData['3. low'];
  const openPrice = lastData['1. open'];
  const volume = lastData['5. volume'];

  return (
    <div>
      <div className="header">
        <Link to="/search" className="link-1">Back to Search</Link>
        <Link to="/portfolio" className="link-2">To your Portfolio</Link>
      </div>
      <div className="StockDetails">
        <h1>Stock Details for {symbol.toUpperCase()}</h1>
        {stockAdded ? (
          <button className="remove" onClick={removeStock}>
            Remove
          </button>
        ) : (
          <button className="add" onClick={addStock}>
            Add
          </button>
        )}
        {<div className="item">
          <div>
            <label htmlFor="timeFrame">Select Time Interval: </label>
            <select
              id="timeFrame"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              {externalStock ?
                (<><option value="5min">5 Minutes</option>
                <option value="1day">1 Day</option>
                <option value="1week">1 Week</option></>)
                :
                (<><option value="1day">1 Day</option>
                <option value="1week">1 Week</option></>)
              }
            </select>
          </div>
          <hr />
          <div className="stock-info">
            <h2>Price Information</h2>
            <p>
              <strong>Current Price:</strong> ${currentPrice}
            </p>
            <p>
              <strong>Open Price:</strong> ${openPrice}
            </p>
            <p>
              <strong>Day's High:</strong> ${highPrice}
            </p>
            <p>
              <strong>Day's Low:</strong> ${lowPrice}
            </p>
            <p>
              <strong>Volume:</strong> {volume}
            </p>
            <p>
              <strong>Profit Margin:</strong> {priceDifference<0 ? `-$${(-priceDifference).toFixed(2)}` : (`$${priceDifference.toFixed(2)}`)}
            </p>
          </div>
          <hr />
          <div>
            <h2>Historical Data</h2>
            <Line style={{ minWidth: '500px',height:'auto',minHeight:'350px',maxWidth:'100%', margin: 'auto' }} data={chartData} />
          </div>
          <hr />
          <div className="news-section">
            <h2>Relevant News</h2>
            {newsData.length > 0 ? (
              <ul>
                {newsData.map((article, index) => (
                  <li key={index}>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                    <p>{article.summary}</p>
                    <p><strong>Published on:</strong> {article.date}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No news available for {symbol}.</p>
            )
            }
          </div>
        </div>}
      </div>
    </div>
  );
};

export default StockDetails;