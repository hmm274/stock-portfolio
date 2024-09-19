import React, { useState } from 'react';
import supabase from './SupabaseClient';
import {Link} from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if(password!==confirmPassword){
        setError("Passwords do not match");
        return;
    }
    if(email===""||password===""||confirmPassword===""){
        setError("Please fill out all fields");
        return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else alert('Sign up successful! Please verify your email');
  };

  return (
    <div className="login-box">
        <form onSubmit={handleSignUp}>
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
        <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <p>Already have an account? <br />Log in <Link to="/Login">here</Link></p>
        <button type="submit">Sign Up</button>
        {error && <p>{error}</p>}
        </form>
    </div>
  );
};

export default SignUp;