import React, { useEffect, useState } 
from "react"; import CyberpunkAuth from 
"./components/CyberpunkAuth"; import 
Dashboard from "./components/Dashboard"; 
import { authApi } from 
"./api/supabaseAuth"; import { supabase 
} from "./api/supabaseClient";
const pendingScreenStyle = { minHeight: 
  "100vh", display: "flex", 
  flexDirection: "column", alignItems: 
  "center", justifyContent: "center", 
  gap: 16, background: "#05070c", color: 
  "#d7e6e6", fontFamily: "monospace", 
  padding: 24, textAlign: "center",
};
function PendingApprovalScreen({ 
onLogout }) {
  return ( <div 
    style={pendingScreenStyle}>
      <p style={{ color: "#ffb000", 
      fontSize: 13, letterSpacing: 
      "0.1em" }}>ACCESS PENDING</p> <p 
      style={{ fontSize: 13, maxWidth: 
      360, lineHeight: 1.6, color: 
      "#7fa8ab" }}>
        Your account is verified but 
        hasn't been approved by an admin 
        yet. Check back once you've been 
        notified, or contact whoever 
        invited you.
      </p> 
<button
  onClick={onLogout}
  style={{
    background: "transparent",
    border: "1px solid rgba(255,56,96,0.4)",
    color: "#ff6f93",
    fontFamily: "Poppins, sans-serif"
  }}
>
  Logout
</button> </div> );
}
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
  const handleLogout = async () => { 
    await authApi.logout(); 
    setUser(null);
  };
  if (loading) { return ( <div style={{ 
        minHeight: "100vh", display: 
        "flex", alignItems: "center", 
        justifyContent: "center", 
        background: "#05070c", color: 
        "#7fa8ab", fontFamily: 
        "monospace", fontSize: 12, 
        letterSpacing: "0.08em",
      }}>
        LOADING… </div> );
  }
  if (user && !user.approved) { return 
    <PendingApprovalScreen 
    onLogout={handleLogout} />;
  }
  if (user) { return <Dashboard 
    user={user} onLoggedOut={() => 
    setUser(null)} />;
  }
  return <CyberpunkAuth />;
}
