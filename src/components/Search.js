import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY;

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

        const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (data["Information"]) {
                setStatement("API call limit reached. Please try later.");
                setSearchResults([]);
            } else if (data && data.bestMatches && data.bestMatches.length > 0) {
                setSearchResults(data.bestMatches);
                setStatement("");
            } else {
                setSearchResults([]);
                setStatement(`No results found for ${query}`);
            }
        } catch (error) {
            setStatement(`Error fetching data: ${error.message}`);
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