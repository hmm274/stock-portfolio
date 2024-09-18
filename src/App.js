import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Homepage from './Homepage';
import Portfolio from './Portfolio';
import StockDetails from './StockDetails';
import NotFound from './NotFound';
import supabase from './SupabaseClient';
import Signup from './Signup';
import Login from './Login';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Supabase Authentication Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth State Changed:', event, session); // Debug log
      setUser(session?.user ?? null);
    });

    // Cleanup subscription on unmount
    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, []);

  console.log('Current User:', user); // Debug log

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/portfolio"
            element={user ? <Portfolio /> : <Navigate to="/login" />}
          />
          <Route
            path="/stock/:symbol"
            element={user ? <StockDetails /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
