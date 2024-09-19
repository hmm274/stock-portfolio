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
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event); // Check the event
      console.log('Session:', session);   // Check the session object
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
            path="/stock/:symbol"
            element={user ? <StockDetails /> : <Navigate to="/" />}
          />
          <Route 
            path="*" 
            element={user ? <NotFound /> : <Navigate to ="/" />} />
          <Route path="/test/:symbol" element={<StockDetails />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
