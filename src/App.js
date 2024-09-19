import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Homepage from './Homepage';
import Portfolio from './Portfolio';
import StockDetails from './StockDetails';
import NotFound from './NotFound';
import supabase from './SupabaseClient';
import Signup from './Signup';
import Login from './Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Supabase Authentication Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription on unmount
    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Homepage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/" /> : <Signup />} />
          <Route
            path="/portfolio"
            element={user ? <Portfolio /> : <Navigate to="/login" />}
          />
          <Route
            path="/stock/:symbol"
            element={user ? <StockDetails /> : <Navigate to="/login" />}
          />
          <Route 
            path="*" 
            element={user ? <NotFound /> : <Navigate to ="/login" />} />
          <Route path="/test/:symbol" element={<StockDetails />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
