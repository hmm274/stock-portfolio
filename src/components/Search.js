import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_KEY = process.env.ALPHAVANTAGE_KEY;

const Search = () => {
    const [symbol, setSymbol] = useState("");
    const [statement, setStatement] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [retry, setRetry] = useState(false); // Retry after switching API key

    // Function to fetch ticker symbols
    useEffect(() => {
        const fetchSymbols = async () => {

            if (symbol.trim() === "") {
                setSearchResults([]);
                setStatement("");
                return;
            }

            setStatement(`Finding results for ${symbol}...`);
            const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${API_KEY}`;

            try {
                const response = await axios.get(url);
                const data = response.data;

                // If API limit is reached, rotate API key
                if (data["Information"]) {
                    setStatement("API call limit reached. Please try later.");
                    return;
                }

                // Handle valid results
                if (data && data.bestMatches) {
                    setSearchResults(data.bestMatches);
                    setStatement(""); // Clear statement on success
                } else {
                    setSearchResults([]);
                    setStatement(`No results found for ${symbol}`);
                }

            } catch (error) {
                setStatement(`Error fetching data: ${error.message}`);
            }
        };

        // Debounce to avoid making too many API requests on fast input
        const delayDebounceFn = setTimeout(() => {
            fetchSymbols();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [symbol, retry]); 

    return (
        <div className="Search">
            <input
                value={symbol}
                placeholder="Search"
                onChange={(e) => {
                    setSymbol(e.target.value);
                    setRetry(false); // Reset retry when user types new input
                }}
            />
            <p>{statement}</p>

            <ul>
                {searchResults.length > 0 &&
                    searchResults.map((result, idx) => (
                        <li key={idx}>
                            <Link to={`/stock/${result['1. symbol']}`}>
                                {result['1. symbol']} - {result['2. name']}
                            </Link>
                        </li>
                    ))}
            </ul>
        </div>
    );
};

export default Search;