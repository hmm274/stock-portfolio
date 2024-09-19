import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './SupabaseClient';
import getUserDetails from './getUserDetails';

const Homepage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [name, setName] = useState("Guest");

    useEffect(() => {
        // Fetch the session to get the user
        const fetchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error fetching session:', error);
            } else {
                console.log("Fetched session:", session); // Check if session is being fetched correctly
                setCurrentUser(session?.user);
    
                if (session?.user) {
                    // Fetch the user's name from the database
                    const nameData = await getUserDetails("name");
                    
                    console.log("User name data:", nameData); // Check what data is returned
                    
                    // Check if we got the name data and set it
                    if (nameData && nameData.length > 0 && nameData[0]?.name) {
                        setName(nameData[0].name);
                        console.log("Name set to:", nameData[0].name); // Ensure name is set correctly
                    }
                }
            }
        };

        fetchSession();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <div className="homepage">
            <h1>Welcome to Your Stock Portfolio, {name}</h1>
            <p>Manage your investments and track stock prices in real-time.</p>

            <div className="homepage-links">
                <button onClick={() => navigate("/portfolio")} className="homepage-button">View Portfolio</button>
                {currentUser ? (
                    <button onClick={handleLogout} className="homepage-button">Log Out</button>
                ) : (
                    <div>
                        <button onClick={() => navigate("/signup")} className="homepage-button">Sign Up</button>
                        <button onClick={() => navigate("/login")} className="homepage-button">Log In</button>
                    </div>
                )}
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
