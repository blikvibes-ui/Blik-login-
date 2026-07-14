import React, { useEffect, useRef, 
useState, useCallback, useId } from 
"react"; import * as THREE from "three"; 
import { ShieldCheck, Lock, Mail, User, 
KeyRound, AlertCircle, Terminal } from 
"lucide-react"; import { authApi } from 
"../api/supabaseAuth";
// ---- Shared brand config (mirrors 
// /public/branding.config.json in the 
// real codebase) ----
const BRAND = { footer: "Blikvibes Login 
  Page", productName: "NEXUS // ACCESS 
  TERMINAL",
};
// TODO(you): replace this placeholder 
// mark with your real logo. Drop the 
// asset at src/assets/logo.svg in the 
// frontend repo, then swap the 
// <Terminal> icon in the header below 
// for <img src={logoUrl} 
// alt={BRAND.productName} height={18} 
// />. Until then, <Terminal> is a 
// stand-in so the header isn't blank. 
// --------------------------------------------------------------------------- 
// 3D autonomous background — vanilla 
// three.js (kept deliberately 
// lightweight: ~600 points + one 
// wireframe grid, capped pixel ratio, 
// paused off-screen). 
// ---------------------------------------------------------------------------
function useTerminalScene(containerRef) 
{
  useEffect(() => { const el = 
    containerRef.current; if (!el) 
    return; const scene = new 
    THREE.Scene(); scene.fog = new 
    THREE.FogExp2(0x05070c, 0.045); 
    const camera = new 
    THREE.PerspectiveCamera(55, 
    el.clientWidth / el.clientHeight, 
    0.1, 100); camera.position.set(0, 
    2.4, 9); camera.lookAt(0, 0, 0); 
    const renderer = new 
    THREE.WebGLRenderer({ antialias: 
    true, alpha: true }); 
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 
    1.5)); 
    renderer.setSize(el.clientWidth, 
    el.clientHeight); 
    el.appendChild(renderer.domElement);
    // Wireframe grid "floor" — the 
    // classic terminal city grid
    const grid = new 
    THREE.GridHelper(40, 40, 0xb026ff, 
    0x0b2b33); grid.position.y = -2.2; 
    grid.material.transparent = true; 
    grid.material.opacity = 0.35; 
    scene.add(grid);
    // Floating data nodes (instanced 
    // points, cheap on the GPU)
    const NODE_COUNT = 600; const 
    positions = new 
    Float32Array(NODE_COUNT * 3); const 
    speeds = new 
    Float32Array(NODE_COUNT); for (let i 
    = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() 
      - 0.5) * 26; positions[i * 3 + 1] 
      = Math.random() * 10 - 2; 
      positions[i * 3 + 2] = 
      (Math.random() - 0.5) * 26; 
      speeds[i] = 0.05 + Math.random() * 
      0.15;
    }
    const geo = new 
    THREE.BufferGeometry(); 
    geo.setAttribute("position", new 
    THREE.BufferAttribute(positions, 
    3)); const mat = new 
    THREE.PointsMaterial({
      color: 0xffb000, size: 0.05, 
      transparent: true, opacity: 0.85, 
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, 
    mat); scene.add(points);
    // A handful of larger "beacon" 
    // nodes with soft glow rings
    const beacons = new THREE.Group(); 
    for (let i = 0; i < 9; i++) {
      const ring = new THREE.Mesh( new 
        THREE.RingGeometry(0.05, 0.09, 
        24), new 
        THREE.MeshBasicMaterial({ color: 
        0xb026ff, transparent: true, 
        opacity: 0.6, side: 
        THREE.DoubleSide })
      ); 
      ring.position.set((Math.random() - 
      0.5) * 18, Math.random() * 6 - 1, 
      (Math.random() - 0.5) * 18); 
      ring.lookAt(camera.position); 
      beacons.add(ring);
    }
    scene.add(beacons); let raf = null; 
    let visible = true; const clock = 
    new THREE.Clock(); function 
    animate() {
      if (!visible) return; const t = 
      clock.getElapsedTime(); const pos 
      = geo.attributes.position; for 
      (let i = 0; i < NODE_COUNT; i++) {
        pos.array[i * 3 + 1] += 
        speeds[i] * 0.01; if 
        (pos.array[i * 3 + 1] > 8) 
        pos.array[i * 3 + 1] = -2;
      }
      pos.needsUpdate = true; 
      camera.position.x = Math.sin(t * 
      0.05) * 3; camera.position.z = 9 + 
      Math.cos(t * 0.05) * 1.5; 
      camera.lookAt(0, 0.5, 0); 
      beacons.children.forEach((b, i) => 
      {
        b.material.opacity = 0.35 + 
        Math.sin(t * 1.5 + i) * 0.25; 
        b.lookAt(camera.position);
      });
      renderer.render(scene, camera); 
      raf = 
      requestAnimationFrame(animate);
    }
    animate(); const onResize = () => { 
      if (!el) return; camera.aspect = 
      el.clientWidth / el.clientHeight; 
      camera.updateProjectionMatrix(); 
      renderer.setSize(el.clientWidth, 
      el.clientHeight);
    };
    const onVisibility = () => { visible 
      = document.visibilityState === 
      "visible"; if (visible) animate();
    };
    window.addEventListener("resize", 
    onResize); 
    document.addEventListener("visibilitychange", 
    onVisibility); return () => {
      cancelAnimationFrame(raf); 
      window.removeEventListener("resize", 
      onResize); 
      document.removeEventListener("visibilitychange", 
      onVisibility); geo.dispose(); 
      mat.dispose(); 
      grid.geometry.dispose(); 
      grid.material.dispose(); 
      beacons.children.forEach((b) => {
        b.geometry.dispose(); 
        b.material.dispose();
      });
      renderer.dispose(); if 
      (el.contains(renderer.domElement)) 
      el.removeChild(renderer.domElement);
    };
  }, [containerRef]);
}
// --------------------------------------------------------------------------- 
// Generic, non-enumerating field error 
// helper (prevents "user not found" vs 
// "wrong password" style leaks — always 
// the same message class). 
// ---------------------------------------------------------------------------
function validate(view, fields) { const 
  errors = {}; if (!fields.email || 
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) 
  { errors.email = "Enter a valid email 
    address.";
  }
  if (!fields.password || 
  fields.password.length < 8) {
    errors.password = "Password must be 
    at least 8 characters.";
  }
  if (view === "register") { if 
    (!fields.username || 
    fields.username.trim().length < 3) {
      errors.username = "Username must 
      be at least 3 characters.";
    }
    if (fields.confirm !== 
    fields.password) {
      errors.confirm = "Passwords do not 
      match.";
    }
  }
  return errors;
}
export default function CyberpunkAuth() 
{
  const sceneRef = useRef(null); 
  useTerminalScene(sceneRef); const 
  [view, setView] = useState("login"); 
  // 'login' | 'register'
  const [spinning, setSpinning] = 
  useState(false); const [spinClass, 
  setSpinClass] = useState(""); const 
  [fields, setFields] = useState({ 
  email: "", password: "", username: "", 
  confirm: "" }); const [errors, 
  setErrors] = useState({}); const 
  [status, setStatus] = useState(null); 
  // { type: 'error'|'success', message 
  }
  const [submitting, setSubmitting] = 
  useState(false); const liveRegionId = 
  useId(); const switchView = 
  useCallback(
    (next) => { if (spinning || next === 
      view) return; setSpinning(true); 
      setStatus(null); setErrors({}); 
      setSpinClass("spin-out"); 
      window.setTimeout(() => {
        setView(next); 
        setSpinClass("spin-in"); 
        window.setTimeout(() => {
          setSpinClass(""); 
          setSpinning(false);
        }, 480);
      }, 480);
    },
    [spinning, view] ); const onChange = 
  (e) => {
    const { name, value } = e.target; 
    setFields((f) => ({ ...f, [name]: 
    value }));
  };
  const onSubmit = async (e) => { 
    e.preventDefault(); const errs = 
    validate(view, fields); 
    setErrors(errs); if 
    (Object.keys(errs).length > 0) {
      setStatus({ type: "error", 
      message: "Please resolve the 
      highlighted fields." }); return;
    }
    setSubmitting(true); 
    setStatus(null); try {
      if (view === "login") { await 
        authApi.login({ email: 
        fields.email, password: 
        fields.password }); setStatus({ 
        type: "success", message: 
        "Access granted. Session 
        established." });
      } else {
        const result = await 
        authApi.register({
          username: fields.username, 
          email: fields.email, password: 
          fields.password,
        });
        setStatus({ type: "success", 
        message: result.message });
      }
    } catch (err) {
      setStatus({ type: "error", 
      message: err instanceof Error ? 
      err.message : "Something went 
      wrong." });
    } finally {
      setSubmitting(false);
    }
  };
  return ( <div className="cyb-root"> 
      <div ref={sceneRef} 
      className="cyb-scene" 
      aria-hidden="true" /> <div 
      className="cyb-scanlines" 
      aria-hidden="true" /> <main 
      className="cyb-stage">
        <div className={`cyb-card 
        ${spinClass}`}>
          <header 
          className="cyb-header">
            <Terminal size={18} 
            aria-hidden="true" /> 
            <h1>{BRAND.productName}</h1>
          </header> <nav 
          className="cyb-tabs" 
          role="tablist" 
          aria-label="Authentication 
          mode">
            <button type="button" 
              role="tab" 
              aria-selected={view === 
              "login"} className={view 
              === "login" ? "active" : 
              ""} onClick={() => 
              switchView("login")}
            >
              Login </button> <button 
              type="button" role="tab" 
              aria-selected={view === 
              "register"} 
              className={view === 
              "register" ? "active" : 
              ""} onClick={() => 
              switchView("register")}
            >
              Create Account </button> 
          </nav> <form 
          onSubmit={onSubmit} noValidate 
          aria-describedby={liveRegionId}>
            {view === "register" && ( 
              <Field
                label="Username" 
                name="username" 
                icon={<User size={16} 
                aria-hidden="true" />} 
                value={fields.username} 
                onChange={onChange} 
                error={errors.username} 
                autoComplete="username"
              /> )} <Field label="Email" 
              name="email" type="email" 
              icon={<Mail size={16} 
              aria-hidden="true" />} 
              value={fields.email} 
              onChange={onChange} 
              error={errors.email} 
              autoComplete="email"
            /> <Field label="Password" 
              name="password" 
              type="password" 
              icon={<Lock size={16} 
              aria-hidden="true" />} 
              value={fields.password} 
              onChange={onChange} 
              error={errors.password} 
              autoComplete={view === 
              "login" ? 
              "current-password" : 
              "new-password"}
            /> {view === "register" && ( 
              <Field
                label="Confirm password" 
                name="confirm" 
                type="password" 
                icon={<KeyRound 
                size={16} 
                aria-hidden="true" />} 
                value={fields.confirm} 
                onChange={onChange} 
                error={errors.confirm} 
                autoComplete="new-password"
              /> )} <button 
            type="submit" 
            className="cyb-submit" 
            disabled={submitting}>
              {submitting ? 
              "Authenticating…" : view 
              === "login" ? "Login" : 
              "Create Account"}
            </button> <div 
            id={liveRegionId} 
            role="status" 
            aria-live="polite" 
            className="cyb-status-region">
              {status && ( <p 
                className={`cyb-status 
                cyb-status-${status.type}`}>
                  {status.type === 
                  "error" && 
                  <AlertCircle size={14} 
                  aria-hidden="true" />} 
                  {status.type === 
                  "success" && 
                  <ShieldCheck size={14} 
                  aria-hidden="true" />} 
                  {status.message}
                </p> )} </div> </form> 
          <p className="cyb-rbac-note">
            Anyone can create an account 
            — an admin must approve it 
            before you can access the 
            dashboard. New accounts are 
            always provisioned as{" "} 
            <code>role:user</code>; 
            <code>role:admin</code> is 
            granted server-side only, 
            never client-selectable.
          </p> </div> </main> <footer 
      className="cyb-footer">{BRAND.footer}</footer> 
      <style>{`
        .cyb-root { position: relative; 
          min-height: 100vh; width: 
          100%; background: #05070c; 
          color: #d7e6e6; font-family: 
          'Space Mono', 'JetBrains 
          Mono', ui-monospace, 
          monospace; overflow: hidden;
        }
        .cyb-scene { position: absolute; 
          inset: 0; z-index: 0;
        }
        .cyb-scanlines { position: 
          absolute; inset: 0; z-index: 
          1; pointer-events: none; 
          background: 
          repeating-linear-gradient(
            to bottom, rgba(176, 38, 
            255,0.035) 0px, rgba(176, 
            38, 255,0.035) 1px, 
            transparent 2px, transparent 
            4px
          ); mix-blend-mode: overlay;
        }
        .cyb-stage { position: relative; 
          z-index: 2; min-height: 100vh; 
          display: flex; align-items: 
          center; justify-content: 
          center; padding: 24px; 
          perspective: 1400px;
        }
        .cyb-card { width: 100%; 
          max-width: 380px; background: 
          rgba(8, 12, 18, 0.82); border: 
          1px solid rgba(176, 38, 255, 
          0.35); border-radius: 6px; 
          padding: 28px 26px 22px; 
          box-shadow: 0 0 0 1px 
          rgba(255,176,0,0.06), 0 20px 
          60px rgba(0,0,0,0.6), 0 0 40px 
          rgba(176, 38, 255,0.08); 
          backdrop-filter: blur(6px); 
          transform-style: preserve-3d; 
          transition: transform 0.48s 
          cubic-bezier(0.34, 1.56, 0.64, 
          1), opacity 0.48s ease;
        }
        .cyb-card.spin-out { transform: 
          rotateY(180deg) 
          translateX(60px); opacity: 0;
        }
        .cyb-card.spin-in { animation: 
          spinIn 0.48s 
          cubic-bezier(0.34, 1.56, 0.64, 
          1) forwards;
        }
        @keyframes spinIn { from { 
          transform: rotateY(-180deg) 
          translateX(-60px); opacity: 0; 
          }
          to { transform: rotateY(0deg) 
          translateX(0); opacity: 1; }
        }
        .cyb-header { display: flex; 
          align-items: center; gap: 8px; 
          color: #ffb000; margin-bottom: 
          18px;
        }
        .cyb-header h1 { font-size: 
          13px; letter-spacing: 0.14em; 
          font-weight: 700; margin: 0;
        }
        .cyb-tabs { display: flex; 
          border: 1px solid rgba(176, 
          38, 255,0.25); border-radius: 
          4px; overflow: hidden; 
          margin-bottom: 20px;
        }
        .cyb-tabs button { flex: 1; 
          background: transparent; 
          border: none; color: #7fa8ab; 
          font-family: inherit; 
          font-size: 12px; 
          letter-spacing: 0.08em; 
          padding: 10px 6px; cursor: 
          pointer;
        }
        .cyb-tabs button.active { 
          background: rgba(176, 38, 
          255,0.12); color: #b026ff;
        }
        .cyb-tabs button:focus-visible, 
        .cyb-submit:focus-visible, 
        .cyb-field input:focus-visible {
          outline: 2px solid #ffb000; 
          outline-offset: 2px;
        }
        .cyb-field { margin-bottom: 
          14px;
        }
        .cyb-field label { display: 
          block; font-size: 10px; 
          letter-spacing: 0.1em; color: 
          #7fa8ab;
          margin-bottom: 5px; 
          text-transform: uppercase;
        }
        .cyb-field-input { display: 
          flex; align-items: center; 
          gap: 8px; border: 1px solid 
          rgba(176, 38, 255,0.25); 
          border-radius: 4px; padding: 
          9px 10px; background: 
          rgba(0,0,0,0.35);
        }
        .cyb-field-input svg { color: 
        #b026ff; flex-shrink: 0; }
        .cyb-field input { background: 
          transparent; border: none; 
          color: #e8f4f4; font-family: 
          inherit; font-size: 13px; 
          width: 100%; outline: none;
        }
        .cyb-field.has-error 
        .cyb-field-input {
          border-color: #ff2d6b;
        }
        .cyb-field-error { color: 
          #ff6f93;
          font-size: 10.5px; margin-top: 
          4px;
        }
        .cyb-submit { width: 100%; 
          background: 
          linear-gradient(180deg, 
          #ffb000, #d68f00);
          border: none; border-radius: 
          4px; color: #100b00; 
          font-family: inherit; 
          font-weight: 700; font-size: 
          12.5px; letter-spacing: 0.1em; 
          padding: 11px; cursor: 
          pointer; margin-top: 4px;
        }
        .cyb-submit:disabled { opacity: 
        0.65; cursor: progress; } 
        .cyb-status-region { min-height: 
        20px; margin-top: 10px; } 
        .cyb-status {
          display: flex; align-items: 
          center; gap: 6px; font-size: 
          11.5px; margin: 0;
        }
        .cyb-status-error { color: 
        #ff6f93; }
        .cyb-status-success { color: 
        #4bffb0; }
        .cyb-rbac-note { margin: 16px 0 
          0; font-size: 10px; 
          line-height: 1.5; color: 
          #5c8286;
        }
        .cyb-rbac-note code { color: 
          #ffb000;
        }
        .cyb-footer { position: 
          relative; z-index: 2; 
          text-align: center; padding: 
          14px; font-size: 10px; 
          letter-spacing: 0.12em; color: 
          #3f5a5d;
        }
        @media (prefers-reduced-motion: 
        reduce) {
          .cyb-card, .cyb-card.spin-out, 
          .cyb-card.spin-in {
            animation: none !important; 
            transition: opacity 0.2s 
            ease !important; transform: 
            none !important;
          }
        }
      `}</style> </div> );
}
function Field({ label, name, type = 
"text", icon, value, onChange, error, 
autoComplete }) {
  const id = `field-${name}`; return ( 
    <div className={`cyb-field${error ? 
    " has-error" : ""}`}>
      <label 
      htmlFor={id}>{label}</label> <div 
      className="cyb-field-input">
        {icon} <input id={id} 
          name={name} type={type} 
          value={value} 
          onChange={onChange} 
          autoComplete={autoComplete} 
          aria-invalid={!!error} 
          aria-describedby={error ? 
          `${id}-error` : undefined}
        /> </div> {error && ( <p 
        id={`${id}-error`} 
        className="cyb-field-error">
          {error} </p> )} </div> );
}
