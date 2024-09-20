import {useState, useEffect} from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';

const API_KEY = process.env.REACT_APP_API_KEY;

const Search = ()=>{
    const [symbol, setSymbol] = useState("");
    const [statement, setStatement] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect (()=>{
        const fetchSymbols = async () =>{
            if(symbol.trim()===""){
                setSearchResults([]);
                setStatement("");
                return;
            }
            setStatement("Finding results for "+symbol+"..");
            const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${API_KEY}`;

            try{
                const response = await axios.get(url);
                const data = response.data;
                if(data && data.bestMatches){
                    setSearchResults(data.bestMatches);
                } else{
                    setSearchResults([]);
                    setStatement("No results found for "+symbol);
                }
            } catch(error){
                setStatement("Error fetching data. "+error.message);
            }
        }

        const delayDebounceFn = setTimeout(()=>{
            fetchSymbols();
        },500);

        return ()=>clearTimeout(delayDebounceFn);
    },[symbol]);

    return(
        <div className="Search">
            <input value={symbol} placeholder="Search" onChange={(e)=>{setSymbol(e.target.value)}}></input>
            <p>{statement}</p>

            <ul>
                {searchResults.length > 0 &&
                searchResults.map((result, index) => (
                <li key={index}>
                    <Link to={`/stock/${result['1. symbol']}`}>
                        {result['1. symbol']} - {result['2. name']}
                    </Link>
                </li>
                ))}
            </ul>
        </div>
    );
}

export default Search;