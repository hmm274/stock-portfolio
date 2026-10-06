import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Search = () => {
    const [symbol, setSymbol] = useState("");
    const [statement, setStatement] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSymbols = async () => {
        const query = symbol.trim().toUpperCase();

        if (query.length < 2) {
            setSearchResults([]);
            setStatement("Enter at least 2 characters");
            return;
        }

        setLoading(true);
        setStatement(`Searching for ${query}...`);

        const url = `${BACKEND_URL}/stocks/search?keywords=${encodeURIComponent(query)}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (data && data.bestMatches && data.bestMatches.length > 0) {
                setSearchResults(data.bestMatches);
                setStatement("");
            } else {
                setSearchResults([]);
                setStatement(`No results found for ${query}`);
            }
        } catch (error) {
            if (error.response?.status === 429) {
                setStatement("Market data API rate limit reached. Please try again later.");
            } else {
                setStatement(
                    error.response?.data?.detail ||
                    "Unable to search for stocks. Please try again later."
                );
            }

            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Search">
            <input
                value={symbol}
                placeholder="Search"
                onChange={(e) => setSymbol(e.target.value)}
            />
            <button onClick={fetchSymbols}>Search</button>
            {loading && <p>Loading...</p>}
            <p>{statement}</p>

            <ul>
                {searchResults.length > 0 &&
                    searchResults.map((result, idx) => (
                        <li key={idx}>
                            <Link to={`/stock/${result['1. symbol']}`}>
                                {result['1. symbol']} - {result['2. name']}
                            </Link>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
};

export default Search;