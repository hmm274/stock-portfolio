import React, { useState, useEffect, useRef } from 'react';
import supabase from './SupabaseClient'; // Import your Supabase client
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const API_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY;

const Portfolio = () => {
  const hasFetchedRef = useRef(false);
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartsData, setChartsData] = useState({});
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fetch the portfolio tickers when the component mounts
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchPortfolio = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const user = session.user;
        if (!user) {
          setError('No user found');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('portfolio')
          .select('stock_symbol')
          .eq('user_id', user.id);

        if (error) throw error;

        setTickers(data);

        const results = {};

        for (const { stock_symbol } of data) {
          try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock_symbol}&apikey=${API_KEY}`;
            const response = await axios.get(url);
            const timeSeries = response.data['Time Series (Daily)'];

            if (timeSeries) {
              const dates = Object.keys(timeSeries).slice(0, 7).reverse();
              const allDates = Object.keys(timeSeries).slice(0, 30).reverse();
              const prices = dates.map(date => timeSeries[date]['4. close']);
              const allPrices = allDates.map(date => timeSeries[date]['4. close']);

              results[stock_symbol] = {
                dates,
                prices,
                priceDifference: allPrices[allPrices.length - 1] - allPrices[0],
                currentPrice: allPrices[allPrices.length - 1]
              };
            }

            // ⏱️ RATE LIMIT SAFETY
            await sleep(1200);

          } catch (err) {
            console.error(`Error fetching ${stock_symbol}`, err);
          }
        }

        // ✅ SET ALL CHARTS AT ONCE
        setChartsData(results);
        setLoading(false);

      } catch (error) {
        setError('Error fetching portfolio: ' + error.message);
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // Handle loading state
  if (loading) return <p>Loading your portfolio...</p>;

  // Handle error state
  if (error) return <p>{error}</p>;

  return (
    <div className="Portfolio">
      <h1>Your Portfolio</h1>
      {tickers.length > 0 ? (
        <div>
          {tickers.map((ticker, index) => (
            <Link to={"/stock/"+ticker.stock_symbol.toUpperCase()}>
                <div key={index} className="ticker-container">
                <b>{ticker.stock_symbol.toUpperCase()}</b>
                {chartsData[ticker.stock_symbol] ? (
                    <div>
                    <div className="chart-wrapper">
                        <Line
                        style={{ minWidth: '40px',height:'auto',maxHeight:'100px',maxWidth:'100px', margin: 'auto' }}
                        data={{
                            labels: chartsData[ticker.stock_symbol].dates,
                            datasets: [
                            {
                                data: chartsData[ticker.stock_symbol].prices,
                                borderColor: chartsData[ticker.stock_symbol].priceDifference>0 ? 'rgba(0,255,0,1)' : (chartsData[ticker.stock_symbol].priceDifference<0 ? 'rgba(255,0,0,1)' : 'rgba(0,200,255,1)'),
                                backgroundColor: chartsData[ticker.stock_symbol].priceDifference>0 ? 'rgba(0,255,0,0.2)' : (chartsData[ticker.stock_symbol].priceDifference<0 ? 'rgba(255,0,0,0.2)' : 'rgba(0,200,255,0.2)'),
                                fill: true,
                                tension: 0.1,
                                pointRadius:0
                            },
                            ],
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                            legend: {
                                display: false, // Remove chart legend
                            },
                            tooltip: {
                                enabled: false
                            }
                            },
                            scales: {
                            x: {
                                display: false, // Hide X axis
                            },
                            y: {
                                display: false, // Hide Y axis
                            },
                            },
                        }}
                        />
                    </div>
                    <b style={{color:chartsData[ticker.stock_symbol].priceDifference>0 ? 'rgba(0,255,0,1)' : (chartsData[ticker.stock_symbol].priceDifference<0 ? 'rgb(255,0,0)' : 'rgb(0,200,255)')}}>
                        {chartsData[ticker.stock_symbol].priceDifference >= 0 ? '+' : '-'}{Math.abs(chartsData[ticker.stock_symbol].priceDifference).toFixed(2)}
                    </b><br />
                    <b style={{color:'rgba(255,255,255,1)'}}>
                        {Math.abs(chartsData[ticker.stock_symbol].currentPrice).toFixed(2)}
                    </b>
                    </div>
                ) : (
                    <p>Loading chart...</p>
                )}
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>You have no tickers added yet.</p>
      )}
      <br />
      <Link to="/search">Find a ticker</Link>
    </div>
  );
};

export default Portfolio;
