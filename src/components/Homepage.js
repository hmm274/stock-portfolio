import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './SupabaseClient';
import getUserDetails from './getUserDetails';
import GeneralNews from './GeneralNews';

const Homepage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [name, setName] = useState("Guest");

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error fetching session:', error);
            } else {
                setCurrentUser(session?.user);
    
                if (session?.user) {
                    const nameData = await getUserDetails("name");
                    if (nameData && nameData.length > 0 && nameData[0]?.name) {
                        setName(nameData[0].name.charAt(0).toUpperCase() + nameData[0].name.slice(1));
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
            <h1>Welcome to Your Stock Portfolio, {name}!</h1>
            <p>Manage your investments and track stock prices in real-time.</p>

            <div className="homepage-links">
                {currentUser ? (
                    <div>
                        <button onClick={() => navigate("/portfolio")} className="homepage-button">View Portfolio</button><br />
                        <button onClick={handleLogout} className="homepage-button">Log Out</button>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => navigate("/signup")} className="homepage-button">Sign Up</button><br />
                        <button onClick={() => navigate("/login")} className="homepage-button">Log In</button>
                    </div>
                )}
            </div>
            <GeneralNews />
        </div>
    );
};

export default Homepage;
