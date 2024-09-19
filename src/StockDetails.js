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
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
  
    try {
      const response = await axios.get(url);
      const data = response.data;
  
      // Check for rate limit or error message in the response
      if (data['Error Message'] || data['Information']) {
        setError('Unable to fetch stock data. ' + (data['Error Message'] || data['Information']));
        setLoading(false);
        return; // Exit early if there's an error
      }
  
      setStockData(data);
      prepareChartData(data['Time Series (5min)']);
      setLoading(false); // Set loading to false after successful fetch
    } catch (err) {
      setError('Error fetching stock data: ' + err.message);
      setLoading(false); // Ensure loading is set to false if there's an error
    }
  }, [symbol]);
  
  

  const prepareChartData = (timeSeries) => {
    const dates = Object.keys(timeSeries).slice(0, 30).reverse();
    const prices = dates.map(date => timeSeries[date]['4. close']);

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

    // Set an interval to fetch stock data every 30 seconds when the market is open
    const interval = setInterval(() => {
      if (isMarketOpen()) {
        fetchStockData();
      }
    }, 30000); // 30000ms = 30 seconds

    // Clean up the interval when the component is unmounted
    return () => clearInterval(interval);
  }, [symbol, fetchStockData]);

  // Show loading state
  if (loading) return <p>Loading stock data...</p>;

  // Handle error state
  if (error) return <p>{error}</p>;

  // Destructure stock data for display
  const timeSeries = stockData['Time Series (5min)'];
  const lastDate = Object.keys(timeSeries)[0];
  const lastData = timeSeries[lastDate];

  const currentPrice = lastData['4. close'];
  const highPrice = lastData['2. high'];
  const lowPrice = lastData['3. low'];
  const openPrice = lastData['1. open'];
  const volume = lastData['5. volume'];

  return (
    <div>
      <h1>Stock Details for {symbol.toUpperCase()}</h1>
      <div className="stock-info">
        <h2>Price Information</h2>
        <p><strong>Current Price:</strong> ${currentPrice}</p>
        <p><strong>Open Price:</strong> ${openPrice}</p>
        <p><strong>Day's High:</strong> ${highPrice}</p>
        <p><strong>Day's Low:</strong> ${lowPrice}</p>
        <p><strong>Volume:</strong> {volume}</p>

        <h2>Historical Data</h2>
        <div style={{ maxWidth: '700px', margin: 'auto' }}>
          <Line data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default StockDetails;