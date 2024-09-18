import {useParams} from 'react-router-dom';

const StockDetails = ()=>{
    const {symbol} = useParams();
    return <h1>Details for {symbol}</h1>;
};

export default StockDetails;