import { useState, useEffect } from 'react';
import axios from 'axios';
import supabase from './SupabaseClient';

const API_KEY = process.env.ALPHAVANTAGE_KEY;

const Profits = () => {
    const [display, setDisplay] = useState(false);
    const [ticker, setTicker] = useState("");
    const [purchasePrice, setPurchasePrice] = useState("");
    const [numShares, setNumShares] = useState("");
    const [user, setUser] = useState(null);
    const [output, setOutput] = useState([]); // Initialize as an empty array
    const [currentPrices, setCurrentPrices] = useState({}); // Store current prices for each ticker
    const [totalProfit, setTotalProfit] = useState(0); // Store total profit

    // Fetch user session on component mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            }
        };
        getUser();
    }, []);

    // Add new purchase record
    const addPurchase = async () => {
        if (user) {
            const { data, error } = await supabase
                .from('purchases')
                .insert([
                    {
                        user_id: user.id,
                        ticker_symbol: ticker,
                        purchase_price: purchasePrice,
                        num_shares: numShares
                    }
                ]);

            if (error) {
                console.log("Error adding data: " + error.message);
            } else {
                console.log("Record added successfully:", data);
                fetchPurchases(); // Refetch purchases after adding a new one
            }
        }
    };

    // Fetch user's purchases when user is defined
    const fetchPurchases = async () => {
        if (user) {
            const { data, error } = await supabase
                .from("purchases")
                .select("*")
                .eq('user_id', user.id);

            if (error) {
                console.log("Error fetching data: " + error.message);
            } else {
                console.log("Fetched purchases successfully:", data);
                setOutput(data); // Store fetched purchases
                fetchCurrentPricesForAllTickers(data); // Fetch prices for all tickers
            }
        }
    };

    // Fetch current prices for all unique tickers
    const fetchCurrentPricesForAllTickers = async (purchases) => {
        const uniqueTickers = [...new Set(purchases.map(purchase => purchase.ticker_symbol))];
        const prices = {};
        let totalProfit = 0; // To calculate the total profit

        for (const ticker of uniqueTickers) {
            const price = await fetchCurrentPrice(ticker);
            if (price) {
                prices[ticker] = price;
                // Calculate profit for each purchase
                purchases.forEach((purchase) => {
                    if (purchase.ticker_symbol === ticker) {
                        const profit = (Number(price) - Number(purchase.purchase_price)) * Number(purchase.num_shares);
                        totalProfit += profit; // Add to total profit
                    }
                });
            }
        }
        setCurrentPrices(prices);
        setTotalProfit(totalProfit); // Set the total profit
    };

    // Fetch current price of a single stock using Alpha Vantage API
    const fetchCurrentPrice = async (ticker) => {
        try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&apikey=${API_KEY}`;
            const response = await axios.get(url);
            const timeSeries = response.data['Time Series (5min)'];
            if (timeSeries) {
                const latestTime = Object.keys(timeSeries)[0]; // Get the most recent timestamp
                const latestPrice = timeSeries[latestTime]['4. close']; // Get the latest closing price
                return latestPrice;
            }
        } catch (error) {
            console.log("Error fetching stock price: ", error);
            return null;
        }
    };

    useEffect(() => {
        if (user) {
            fetchPurchases();
        }
    }, [user]); // Only run when `user` is defined

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        await addPurchase();
        setTicker("");
        setPurchasePrice("");
        setNumShares("");
    };

    return (
        <div>
            <br />
            <button onClick={() => setDisplay(!display)}>Add details</button>

            {display && (
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Ticker Symbol"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                    /><br />
                    <input
                        type="number"
                        placeholder="Purchase Price"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                    /><br />
                    <input
                        type="number"
                        placeholder="Number of Shares"
                        value={numShares}
                        onChange={(e) => setNumShares(e.target.value)}
                    /><br />
                    <button type="submit">Enter</button>
                </form>
            )}

            <br />
            {/* Display fetched purchases */}
            {output.length > 0 ? (
                <div>
                    <h3>Your Purchases:</h3>
                    <ul>
                        {output.map((purchase) => (
                            <li key={purchase.id}>
                                Ticker: {purchase.ticker_symbol} | 
                                Purchase Price: {purchase.purchase_price} | 
                                Shares: {purchase.num_shares} | 
                                {/* Display the current price if available */}
                                Current Price: {currentPrices[purchase.ticker_symbol] ? `$${Number(currentPrices[purchase.ticker_symbol]).toFixed(2)}` : "Fetching..."} | 
                                Profit: {currentPrices[purchase.ticker_symbol] ? `$${((Number(currentPrices[purchase.ticker_symbol]) - Number(purchase.purchase_price)) * Number(purchase.num_shares)).toFixed(2)}` : "Fetching..."}
                            </li>
                        ))}
                    </ul>
                    <h3>Total Profit: ${totalProfit.toFixed(2)}</h3>
                </div>
            ) : (
                <p>No purchases found.</p>
            )}
        </div>
    );
};

export default Profits;
