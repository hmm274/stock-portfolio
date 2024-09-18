import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Homepage from './Homepage';
import Portfolio from './Portfolio';
import StockDetails from './StockDetails';
import NotFound from './NotFound';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/stock/:symbol" element={<StockDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
