import React, { useState } from "react"; 
import { ShieldCheck, LogOut, KeyRound, 
UserPlus, Terminal, Copy, Check } from 
"lucide-react"; import { authApi } from 
"../api/supabaseAuth"; const BRAND = {
  footer: "Blikvibes Login Page", 
  productName: "NEXUS // ACCESS 
  TERMINAL",
};
export default function Dashboard({ 
user, onLoggedOut }) {
  const [loggingOut, setLoggingOut] = 
  useState(false); const handleLogout = 
  async () => {
    setLoggingOut(true); await 
    authApi.logout(); 
    setLoggingOut(false); 
    onLoggedOut?.();
  };
  return ( <div className="dash-root"> 
      <div className="dash-scanlines" 
      aria-hidden="true" /> <main 
      className="dash-stage">
        <div className="dash-card"> 
          <header 
          className="dash-header">
            <div 
            className="dash-header-title">
              <Terminal size={18} 
              aria-hidden="true" /> 
              <h1>{BRAND.productName}</h1>
            </div> <button type="button" 
            className="dash-logout" 
            onClick={handleLogout} 
            disabled={loggingOut}>
              <LogOut size={14} 
              aria-hidden="true" /> 
              {loggingOut ? "Logging 
              out…" : "Logout"}
            </button> </header> <section 
          className="dash-profile" 
          aria-label="Your profile">
            <p 
            className="dash-welcome">Welcome 
            back, {user.username}</p> 
            <dl 
            className="dash-info-grid">
              <div> <dt>Email</dt> 
                <dd>{user.email}</dd>
              </div> <div> <dt>Role</dt> 
                <dd>
                  <span 
                  className={`dash-badge 
                  dash-badge-${user.role}`}>{user.role}</span>
                </dd> </div> <div> 
                <dt>Email verified</dt> 
                <dd>
                  {user.emailVerified ? 
                  (
                    <span 
                    className="dash-verified">
                      <ShieldCheck 
                      size={13} 
                      aria-hidden="true" 
                      /> Verified
                    </span> ) : ( <span 
                    className="dash-unverified">Not 
                    verified</span>
                  )} </dd> </div> </dl> 
          </section> {user.role === 
          "admin" && <AdminPanel />}
        </div> </main> <footer 
      className="dash-footer">{BRAND.footer}</footer> 
      <style>{`
        .dash-root { position: relative; 
          min-height: 100vh; width: 
          100%; background: #05070c; 
          color: #d7e6e6; font-family: 
          'Space Mono', 'JetBrains 
          Mono', ui-monospace, 
          monospace;
        }
        .dash-scanlines { position: 
          absolute; inset: 0; 
          pointer-events: none; 
          background: 
          repeating-linear-gradient(
            to bottom, rgba(176, 38, 
            255,0.035) 0px, rgba(176, 
            38, 255,0.035) 1px, 
            transparent 2px, transparent 
            4px
          ); mix-blend-mode: overlay;
        }
        .dash-stage { position: 
          relative; min-height: 100vh; 
          display: flex; align-items: 
          flex-start; justify-content: 
          center; padding: 24px;
        }
        .dash-card { width: 100%; 
          max-width: 480px; background: 
          rgba(8, 12, 18, 0.9); border: 
          1px solid rgba(176, 38, 255, 
          0.35); border-radius: 6px; 
          padding: 24px 22px; 
          box-shadow: 0 20px 60px 
          rgba(0,0,0,0.6), 0 0 40px 
          rgba(176, 38, 255,0.08); 
          margin-top: 40px;
        }
        .dash-header { display: flex; 
          align-items: center; 
          justify-content: 
          space-between; border-bottom: 
          1px solid rgba(176, 38, 255, 
          0.2); padding-bottom: 16px; 
          margin-bottom: 20px;
        }
        .dash-header-title { display: 
          flex; align-items: center; 
          gap: 8px; color: #ffb000;
        }
        .dash-header-title h1 { 
          font-size: 12px; 
          letter-spacing: 0.12em; 
          font-weight: 700; margin: 0;
        }
        .dash-logout { display: flex; 
          align-items: center; gap: 6px; 
          background: transparent; 
          border: 1px solid 
          rgba(255,56,96,0.4); color: 
          #ff6f93;
          font-family: inherit; 
          font-size: 11px; 
          letter-spacing: 0.06em; 
          padding: 7px 12px; 
          border-radius: 4px; cursor: 
          pointer;
        }
        .dash-logout:disabled { opacity: 
        0.6; cursor: progress; } 
        .dash-welcome {
          font-size: 15px; color: 
          #e8f4f4;
          margin: 0 0 16px;
        }
        .dash-info-grid { display: grid; 
          grid-template-columns: 1fr 
          1fr; gap: 14px; margin: 0 0 
          8px;
        }
        .dash-info-grid dt { font-size: 
          9.5px; letter-spacing: 0.1em; 
          text-transform: uppercase; 
          color: #7fa8ab; margin-bottom: 
          4px;
        }
        .dash-info-grid dd { margin: 0; 
          font-size: 13px; color: 
          #e8f4f4;
          word-break: break-word;
        }
        .dash-badge { display: 
          inline-block; font-size: 10px; 
          letter-spacing: 0.08em; 
          text-transform: uppercase; 
          padding: 3px 9px; 
          border-radius: 3px; 
          font-weight: 700;
        }
        .dash-badge-user { background: 
        rgba(176, 38, 255,0.15); color: 
        #b026ff; }
        .dash-badge-admin { background: 
        rgba(255,176,0,0.15); color: 
        #ffb000; }
        .dash-verified { display: 
        inline-flex; align-items: 
        center; gap: 4px; color: 
        #39ff88; font-size: 12px; }
        .dash-unverified { color: 
        #ff6f93; font-size: 12px; }
        .dash-footer { position: 
          relative; text-align: center; 
          padding: 14px; font-size: 
          10px; letter-spacing: 0.12em; 
          color: #3f5a5d;
        }
      `}</style> </div> );
}
function AdminPanel() { const 
  [inviteResult, setInviteResult] = 
  useState(null); const [inviteError, 
  setInviteError] = useState(null); 
  const [generating, setGenerating] = 
  useState(false); const [copied, 
  setCopied] = useState(false); const 
  [promoteEmail, setPromoteEmail] = 
  useState(""); const [promoteStatus, 
  setPromoteStatus] = useState(null); 
  const [promoting, setPromoting] = 
  useState(false); const 
  handleGenerateInvite = async () => {
    setGenerating(true); 
    setInviteError(null); 
    setInviteResult(null); try {
      const result = await 
      authApi.createInvite(168); 
      setInviteResult(result);
    } catch (err) {
      setInviteError(err instanceof 
      Error ? err.message : "Something 
      went wrong.");
    } finally {
      setGenerating(false);
    }
  };
  const handleCopy = async () => { if 
    (!inviteResult) return; try {
      await 
      navigator.clipboard.writeText(inviteResult.inviteCode); 
      setCopied(true); setTimeout(() => 
      setCopied(false), 2000);
    } catch {
      // Clipboard API can fail/be 
      // unavailable — the code is still 
      // shown on screen for manual 
      // copy, so this is a soft 
      // failure.
    }
  };
  const handlePromote = async (e) => { 
    e.preventDefault(); 
    setPromoting(true); 
    setPromoteStatus(null); try {
      const result = await 
      authApi.promoteToAdmin(promoteEmail.trim()); 
      setPromoteStatus({ type: 
      "success", message: result.message 
      });
      setPromoteEmail("");
    } catch (err) {
      setPromoteStatus({ type: "error", 
      message: err instanceof Error ? 
      err.message : "Something went 
      wrong." });
    } finally {
      setPromoting(false);
    }
  };
  return ( <section 
    className="dash-admin" 
    aria-label="Admin tools">
      <h2 
      className="dash-admin-title">Admin 
      tools</h2> <div 
      className="dash-admin-block">
        <p className="dash-admin-label"> 
          <KeyRound size={13} 
          aria-hidden="true" /> Generate 
          invite code
        </p> <button type="button" 
        className="dash-btn" 
        onClick={handleGenerateInvite} 
        disabled={generating}>
          {generating ? "Generating…" : 
          "Generate 7-day invite"}
        </button> {inviteError && <p 
        className="dash-err">{inviteError}</p>} 
        {inviteResult && (
          <div 
          className="dash-invite-result">
            <code>{inviteResult.inviteCode}</code> 
            <button type="button" 
            onClick={handleCopy} 
            aria-label="Copy invite 
            code">
              {copied ? <Check size={14} 
              /> : <Copy size={14} />}
            </button> </div> )} </div> 
      <div className="dash-admin-block">
        <p className="dash-admin-label"> 
          <UserPlus size={13} 
          aria-hidden="true" /> Promote 
          a user to admin
        </p> <form 
        onSubmit={handlePromote} 
        className="dash-promote-form">
          <input type="email" 
            placeholder="user@example.com" 
            value={promoteEmail} 
            onChange={(e) => 
            setPromoteEmail(e.target.value)} 
            required aria-label="Email 
            to promote"
          /> <button type="submit" 
          className="dash-btn" 
          disabled={promoting}>
            {promoting ? "…" : 
            "Promote"}
          </button> </form> 
        {promoteStatus && (
          <p 
          className={promoteStatus.type 
          === "error" ? "dash-err" : 
          "dash-ok"}>{promoteStatus.message}</p>
        )} </div> <style>{` .dash-admin 
        {
          margin-top: 20px; padding-top: 
          18px; border-top: 1px solid 
          rgba(255,176,0,0.2);
        }
        .dash-admin-title { font-size: 
          11px; letter-spacing: 0.1em; 
          text-transform: uppercase; 
          color: #ffb000; margin: 0 0 
          14px;
        }
        .dash-admin-block { 
        margin-bottom: 16px; } 
        .dash-admin-label {
          display: flex; align-items: 
          center; gap: 6px; font-size: 
          11.5px; color: #7fa8ab; 
          margin: 0 0 8px;
        }
        .dash-btn { background: 
          linear-gradient(180deg, 
          #ffb000, #d68f00);
          border: none; border-radius: 
          4px; color: #100b00; 
          font-family: inherit; 
          font-weight: 700; font-size: 
          11.5px; letter-spacing: 
          0.06em; padding: 9px 14px; 
          cursor: pointer;
        }
        .dash-btn:disabled { opacity: 
        0.6; cursor: progress; } 
        .dash-invite-result {
          display: flex; align-items: 
          center; gap: 8px; margin-top: 
          10px; background: 
          rgba(0,0,0,0.35); border: 1px 
          solid rgba(57,255,136,0.3); 
          border-radius: 4px; padding: 
          8px 10px;
        }
        .dash-invite-result code { flex: 
          1; font-size: 11px; color: 
          #39ff88;
          word-break: break-all;
        }
        .dash-invite-result button { 
          background: transparent; 
          border: none; color: #39ff88; 
          cursor: pointer; flex-shrink: 
          0;
        }
        .dash-promote-form { display: 
          flex; gap: 8px;
        }
        .dash-promote-form input { flex: 
          1; background: 
          rgba(0,0,0,0.35); border: 1px 
          solid rgba(176, 38, 255,0.25); 
          border-radius: 4px; padding: 
          8px 10px; color: #e8f4f4; 
          font-family: inherit; 
          font-size: 12px;
        }
        .dash-err { color: #ff6f93; 
        font-size: 11px; margin: 8px 0 
        0; } .dash-ok { color: #39ff88; 
        font-size: 11px; margin: 8px 0 
        0; }
      `}</style> </section> );
}
