import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import KanbanBoard from "./components/KanbanBoard";
import Auth from "./components/Auth";
import Spinner from "./components/Spinner";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.log("No user logged in");
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return (
    <div className="App">
      <KanbanBoard user={user} onLogout={() => setUser(null)} />
    </div>
  );
}

export default App;
