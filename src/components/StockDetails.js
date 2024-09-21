import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_KEY = process.env.REACT_APP_API_KEY;

const StockDetails = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({});
  const [timeFrame, setTimeFrame] = useState('5min'); // State to hold selected time frame
  const [newsData, setNewsData] = useState([]);
  
  // Function to check if the market is open
  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const hour = now.getHours(); // 0 to 23

    // Market is open from Monday to Friday, 9:30 AM to 4:00 PM (Eastern Time)
    const isWeekday = day >= 1 && day <= 5;
    const isOpenHour = hour >= 9 && hour < 16;

    return isWeekday && isOpenHour;
  };

  const fetchStockData = useCallback(async () => {
    // Adjust the API function based on the selected time frame
    const functionType =
      timeFrame === '1day'
        ? 'TIME_SERIES_DAILY'
        : timeFrame === '1week'
        ? 'TIME_SERIES_WEEKLY'
        : 'TIME_SERIES_INTRADAY';

    const interval = timeFrame === '5min' ? '&interval=5min' : '';

    const url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}${interval}&apikey=${API_KEY}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      // Check for rate limit or error message in the response
      if (data['Error Message'] || data['Information']) {
        setError(
          'Unable to fetch stock data. ' + (data['Error Message'] || data['Information'])
        );
        setLoading(false);
        return; // Exit early if there's an error
      }

      setStockData(data);

      const timeSeriesKey =
        timeFrame === '1day' ? 'Time Series (Daily)' : timeFrame === '1week' ? 'Weekly Time Series' : 'Time Series (5min)';

      prepareChartData(data[timeSeriesKey]);
      setLoading(false); // Set loading to false after successful fetch
    } catch (err) {
      setError('Error fetching stock data: ' + err.message);
      setLoading(false); // Ensure loading is set to false if there's an error
    }
  }, [symbol, timeFrame]);

  const fetchNewsData = useCallback(async()=>{
    const newsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;

    try{
      const response = await axios.get(newsUrl);
      const data = response.data;

      if(data && data.feed){
        const formattedNews = data.feed.slice(0, 5).map(article => ({
          title: article.title,
          summary: article.summary,
          url: article.url,
          date: formatArticleDate(article.time_published) // Format the date
        }));
        setNewsData(formattedNews);
      } else{
        setNewsData([]);
      }

    } catch(error){
      setNewsData("Error fetching data: "+error.message);
    }
  }, [symbol]);
  const formatArticleDate = (rawDate) => {
    const year = rawDate.slice(0, 4);
    const month = rawDate.slice(4, 6);
    const day = rawDate.slice(6, 8);
    const time = rawDate.slice(9, 13);
    
    return `${year}-${month}-${day} ${time.slice(0, 2)}:${time.slice(2)}`; // Format as "YYYY-MM-DD HH:MM"
  };

  const prepareChartData = (timeSeries) => {
    const dates = Object.keys(timeSeries).slice(0, 30).reverse();
    const prices = dates.map((date) => timeSeries[date]['4. close']);

    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Closing Price (USD)',
          data: prices,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1,
        },
      ],
    });
  };

  useEffect(() => {
    // Fetch initial stock data
    fetchStockData();

    fetchNewsData();

    // Set an interval to fetch stock data every 30 seconds when the market is open
    const interval = setInterval(() => {
      if (isMarketOpen()) {
        fetchStockData();
      }
    }, 30000); // 30000ms = 30 seconds

    // Clean up the interval when the component is unmounted
    return () => clearInterval(interval);
  }, [symbol, timeFrame, fetchStockData, fetchNewsData]);

  // Show loading state
  if (loading) return <p>Loading stock data...</p>;

  // Handle error state
  if (error) return <p>{error}</p>;

  // Destructure stock data for display
  const timeSeries = stockData['Time Series (5min)'] || stockData['Time Series (Daily)'] || stockData['Weekly Time Series'];
  const lastDate = Object.keys(timeSeries)[0];
  const lastData = timeSeries[lastDate];

  const currentPrice = lastData['4. close'];
  const highPrice = lastData['2. high'];
  const lowPrice = lastData['3. low'];
  const openPrice = lastData['1. open'];
  const volume = lastData['5. volume'];

  return (
    <div className="StockDetails">
      <h1>Stock Details for {symbol.toUpperCase()}</h1>
      <div className="item">
        <div>
          <label htmlFor="timeFrame">Select Time Frame: </label>
          <select
            id="timeFrame"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
          >
            <option value="5min">5 Minutes</option>
            <option value="1day">1 Day</option>
            <option value="1week">1 Week</option>
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
      </div>
    </div>
  );
};

export default StockDetails;