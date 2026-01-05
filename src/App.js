import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Homepage from './components/Homepage';
import Portfolio from './components/Portfolio';
import StockDetails from './components/StockDetails';
import NotFound from './components/NotFound';
import supabase from './components/SupabaseClient';
import Signup from './components/Signup';
import Login from './components/Login';
import Search from './components/Search';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
  
    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, []);
  

  return (
    <div className="App">
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/" /> : <Signup />} />
          <Route
            path="/portfolio"
            element={user ? <Portfolio /> : <Navigate to="/" />}
          />
          <Route
            path="/search"
            element={user ? <Search /> : <Navigate to="/" />} />
          <Route
            path="/stock/:symbol"
            element={user ? <StockDetails /> : <Navigate to="/" />}
          />
          <Route 
            path="*" 
            element={user ? <NotFound /> : <Navigate to ="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
