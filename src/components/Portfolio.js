import {Link} from 'react-router-dom';

const Portfolio = () =>{
    return (
        <div className="Portfolio">
            <h1>Your Portfolio</h1>
            <p>You have no tickers.</p>
            <Link to="/search">Find a ticker</Link>
        </div>
    );
};

export default Portfolio;