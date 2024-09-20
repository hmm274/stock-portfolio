import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_KEYS = [
    process.env.REACT_APP_API_KEY, process.env.REACT_APP_API_KEY_1, process.env.REACT_APP_API_KEY_2, 
    process.env.REACT_APP_API_KEY_3, process.env.REACT_APP_API_KEY_4, process.env.REACT_APP_API_KEY_5, 
    process.env.REACT_APP_API_KEY_6, process.env.REACT_APP_API_KEY_7, process.env.REACT_APP_API_KEY_8, 
    process.env.REACT_APP_API_KEY_9
];

const Search = () => {
    const [symbol, setSymbol] = useState("");
    const [statement, setStatement] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [apiIndex, setApiIndex] = useState(0); // Index to track the current API key
    const [retry, setRetry] = useState(false); // Retry after switching API key
    const [keysExhausted, setKeysExhausted] = useState(false); // Track if all API keys are used up
    const [keyUsageCount, setKeyUsageCount] = useState(0); // Track the number of API keys tried

    // Function to rotate API key
    const rotateApiKeys = useCallback(() => {
        const nextIndex = (apiIndex + 1) % API_KEYS.length;
        setApiIndex(nextIndex);
        setRetry(true); // Trigger retry after rotating the key

        // Update the key usage counter
        setKeyUsageCount((prevCount) => prevCount + 1);
        // Check if all keys have been exhausted
        if (keyUsageCount + 1 >= API_KEYS.length) {
            setKeysExhausted(true);
        }
    },[apiIndex,keyUsageCount]);

    // Function to fetch ticker symbols
    useEffect(() => {
        const fetchSymbols = async () => {
            // Prevent further API calls if all keys are exhausted
            if (keysExhausted) {
                setStatement("All API keys have been exhausted. Please try again later.");
                return;
            }

            if (symbol.trim() === "") {
                setSearchResults([]);
                setStatement("");
                return;
            }

            setStatement(`Finding results for ${symbol}...`);
            const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${API_KEYS[apiIndex]}`;

            try {
                const response = await axios.get(url);
                const data = response.data;

                // If API limit is reached, rotate API key
                if (data["Information"]) {
                    setStatement("API call limit reached. Switching API key...");
                    rotateApiKeys();
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
    }, [symbol, apiIndex, retry, keysExhausted, rotateApiKeys]); // Add `keysExhausted` to the dependency array

    return (
        <div className="Search">
            <input
                value={symbol}
                placeholder="Search"
                onChange={(e) => {
                    setSymbol(e.target.value);
                    setRetry(false); // Reset retry when user types new input
                }}
                disabled={keysExhausted} // Disable input if all keys are exhausted
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