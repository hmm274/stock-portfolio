import React, { useState } from 'react';
import supabase from './SupabaseClient';
import {Link, useNavigate} from 'react-router-dom';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (userError) {
        setError(userError.message);
        return;
      }

      const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: userId, name, email }]);

      if (dbError) {
        setError(dbError.message);
      } else {
        navigate('/');
      }
    }
  };


  return (
    <div className="login-box signup">
        <form onSubmit={handleSignUp}>
        <h1>Welcome to your Stock Portfolio!</h1>
        <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
        /><br />
        <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        /><br />
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