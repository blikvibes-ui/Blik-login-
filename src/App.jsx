import React, { useEffect, useState } 
from "react"; import CyberpunkAuth from 
"./components/CyberpunkAuth"; import 
Dashboard from "./components/Dashboard"; 
import { authApi } from 
"./api/supabaseAuth"; import { supabase 
} from "./api/supabaseClient";
export default function App() { const 
  [user, setUser] = useState(null); // 
  PublicUser | null const [loading, 
  setLoading] = useState(true); 
  useEffect(() => {
    let active = true; 
    authApi.me().then((u) => {
      if (active) { setUser(u); 
        setLoading(false);
      }
    });
    // Fires automatically whenever 
    // CyberpunkAuth calls 
    // signInWithPassword or signOut — 
    // that's how logging in inside the 
    // auth screen makes this component 
    // swap to the dashboard without 
    // CyberpunkAuth needing to know App 
    // exists at all.
    const { data: subscription } = 
    supabase.auth.onAuthStateChange(async 
    (_event, session) => {
      if (!session) { setUser(null); 
        return;
      }
      const u = await authApi.me(); 
      setUser(u);
    });
    return () => { active = false; 
      subscription.subscription.unsubscribe();
    };
  }, []);
  if (loading) { return ( <div style={{ 
        minHeight: "100vh", display: 
        "flex", alignItems: "center", 
        justifyContent: "center", 
        background: "#05070c", color: 
        "#7fa8ab", fontFamily: 
        "ui-monospace, monospace", 
        fontSize: 12, letterSpacing: 
        "0.08em",
      }}>
        LOADING… </div> );
  }
  if (user) { return <Dashboard 
    user={user} onLoggedOut={() => 
    setUser(null)} />;
  }
  return <CyberpunkAuth />;
}
