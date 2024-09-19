import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './SupabaseClient';

const Homepage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
      const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        setCurrentUser(data.session?.user);
      };
  
      fetchSession();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Optionally, navigate to the login page or homepage after logout
        navigate("/login");
    };

    return (
        <div className="homepage">
        <h1>Welcome to Your Stock Portfolio</h1>
        <p>Manage your investments and track stock prices in real-time.</p>

        <div className="homepage-links">
            <button onClick={()=>navigate("/portfolio")} className="homepage-button">View Portfolio</button>
            <>
            {currentUser ?
                (<button onClick={handleLogout} className="homepage-button">Log Out</button>)
            :
                (<div><button onClick={()=>navigate("/signup")} className="homepage-button">Sign Up</button>
                <button onClick={()=>navigate("/login")} className="homepage-button">Log In</button></div>)
            }
            </>
        </div>
        <h2>Features</h2>
        <ul>
            <li>Real-time stock data</li>
            <li>Historical price charts</li>
            <li>Track your investments</li>
            <li>Easy-to-use interface</li>
        </ul>
        </div>
    );
};

export default Homepage;
