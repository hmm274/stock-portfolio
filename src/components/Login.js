import React, { useState } from 'react';
import supabase from './SupabaseClient';
import {Link, useNavigate} from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if(email===""||password===""){
        setError("Please fill out all fields");
    }
    if (error) setError(error.message);
    else{
        alert('Login successful!');
        navigate('/');
    };
  };

  return (
    <div className="login-box">
        <form onSubmit={handleLogin}>
            <h1>Welcome to your Stock Portfolio!</h1>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <p>Don't have an account? <br /> Sign up <Link to="/Signup">here</Link></p>
            <button type="submit">Login</button>
            {error && <p>{error}</p>}
        </form>
    </div>
  );
};

export default Login;