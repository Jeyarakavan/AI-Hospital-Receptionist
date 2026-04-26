/**
 * Homepage (Public Landing Page)
 * Uses the full NovaCare AI landing page design from Folder/homepage.jsx
 * Login button now routes to /login via React Router
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "full" });

// ─── GLOBAL CSS ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

:root {
  --teal: #00C2C7; --teal-dark: #00999E; --teal-glow: rgba(0,194,199,0.18);
  --black: #080B0B; --dark: #0F1313; --dark2: #141A1A; --dark3: #1A2222;
  --white: #FFFFFF; --off-white: #F0F6F6; --muted: #8A9E9E; --line: rgba(255,255,255,0.08);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--black); color: var(--white); overflow-x: hidden; }
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }
.hidden { display: none !important; }
.teal { color: var(--teal); }

.section-label {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--teal); margin-bottom: 16px;
}
.section-label::before { content: ''; width: 28px; height: 2px; background: var(--teal); border-radius: 2px; }
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  border: none; border-radius: 6px; font-family: inherit; font-weight: 700; cursor: pointer;
  transition: all 0.25s ease;
}
.btn-teal { background: var(--teal); color: var(--black); padding: 13px 26px; }
.btn-teal:hover { background: #00D9DF; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,194,199,0.35); }
.btn-outline-teal { background: transparent; color: var(--teal); border: 1.5px solid var(--teal); padding: 12px 24px; }
.btn-outline-teal:hover { background: var(--teal-glow); }
.btn-white { background: var(--white); color: var(--black); padding: 13px 26px; }
.btn-white:hover { background: #e8f7f7; transform: translateY(-2px); }

.nc-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(8,11,11,0.92); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line); transition: all 0.3s ease;
}
.nc-nav-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 28px; height: 72px;
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.nc-logo { display: flex; align-items: center; gap: 10px; font-family: 'Sora', sans-serif; font-weight: 800; font-size: 22px; }
.nc-logo-mark {
  width: 40px; height: 40px; background: var(--teal); border-radius: 10px;
  display: grid; place-items: center; font-size: 16px; font-weight: 900; color: var(--black);
}
.nc-logo span { color: var(--teal); }
.nc-nav-links { display: flex; align-items: center; gap: 32px; font-size: 14px; font-weight: 500; color: #B0C0C0; }
.nc-nav-links a:hover { color: var(--white); }
.nc-nav-links a.active { color: var(--teal); }
.nc-nav-right { display: flex; align-items: center; gap: 12px; }

.nc-hero { min-height: 100vh; background: var(--dark); position: relative; overflow: hidden; padding-top: 72px; }
.nc-hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 60% at 70% 40%, rgba(0,194,199,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 10% 80%, rgba(0,140,145,0.08) 0%, transparent 50%);
}
.nc-hero::after {
  content: ''; position: absolute; inset: 0;
  background-image: linear-gradient(rgba(0,194,199,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,194,199,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 60% 40%, black 30%, transparent 80%);
}
.nc-hero-inner {
  max-width: 1280px; margin: 0 auto; padding: 80px 28px 60px;
  display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; position: relative; z-index: 2;
}
.nc-hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(0,194,199,0.1); border: 1px solid rgba(0,194,199,0.3);
  border-radius: 999px; padding: 7px 16px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.1em; color: var(--teal); margin-bottom: 28px;
  animation: fadeUp 0.6s ease;
}
.nc-hero-badge::before { content: '●'; font-size: 8px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.nc-hero-h1 {
  font-family: 'Sora', sans-serif; font-size: clamp(44px,5.5vw,80px); font-weight: 800;
  line-height: 1.06; letter-spacing: -0.02em; margin-bottom: 24px; animation: fadeUp 0.7s ease 0.1s both;
}
.nc-hero-h1 em { font-style: normal; color: var(--teal); }
.nc-hero-p { font-size: 16px; line-height: 1.7; color: #8AACAC; max-width: 500px; margin-bottom: 36px; animation: fadeUp 0.7s ease 0.2s both; }
.nc-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; animation: fadeUp 0.7s ease 0.3s both; }
.nc-hero-stats {
  display: flex; gap: 32px; margin-top: 52px; padding-top: 32px;
  border-top: 1px solid var(--line); animation: fadeUp 0.7s ease 0.4s both;
}
.nc-hero-stat .num { font-family: 'Sora', sans-serif; font-size: 32px; font-weight: 800; color: var(--white); }
.nc-hero-stat .num span { color: var(--teal); }
.nc-hero-stat .lbl { font-size: 13px; color: #6A8A8A; margin-top: 2px; }
.nc-hero-visual { position: relative; animation: fadeUp 0.8s ease 0.2s both; }
.nc-hero-img-wrap {
  position: relative; border-radius: 20px; overflow: hidden;
  border: 1px solid rgba(0,194,199,0.2);
  box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,194,199,0.1);
}
.nc-hero-img-wrap img { width: 100%; height: 480px; object-fit: cover; display: block; }
.nc-hero-img-wrap::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(8,11,11,0.7) 100%);
}
.nc-float-card {
  position: absolute; z-index: 3; background: rgba(15,19,19,0.92); backdrop-filter: blur(12px);
  border: 1px solid rgba(0,194,199,0.25); border-radius: 14px; padding: 14px 18px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.4); animation: floatCard 4s ease-in-out infinite;
}
@keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
.nc-float-card.top-right { top: 24px; right: -28px; }
.nc-float-card.bottom-left { bottom: 36px; left: -28px; animation-delay: 2s; }
.nc-float-card .fc-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.nc-float-card .fc-value { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; color: var(--teal); }
.nc-float-card .fc-sub { font-size: 12px; color: #7AA0A0; }
.nc-ai-badge {
  position: absolute; bottom: 24px; right: 20px; z-index: 3;
  background: var(--teal); color: var(--black); border-radius: 10px; padding: 10px 16px;
  font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px;
}
.ai-dot { width: 8px; height: 8px; background: var(--black); border-radius: 50%; animation: pulse 1.5s infinite; }

.nc-trust-bar { background: var(--teal); padding: 0; overflow: hidden; }
.nc-trust-inner { display: flex; align-items: center; height: 52px; animation: ticker 20s linear infinite; white-space: nowrap; width: max-content; }
.nc-trust-item { display: flex; align-items: center; gap: 10px; padding: 0 40px; font-size: 13px; font-weight: 700; color: var(--black); }
.nc-trust-item::after { content: '▶'; font-size: 8px; color: rgba(0,0,0,0.4); margin-left: 40px; }
@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }

.nc-stats { background: var(--dark2); padding: 72px 28px; }
.nc-stats-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 0; }
.nc-stat-item { padding: 32px 24px; border-right: 1px solid var(--line); text-align: center; transition: background 0.3s; }
.nc-stat-item:last-child { border-right: none; }
.nc-stat-item:hover { background: var(--teal-glow); }
.nc-stat-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(0,194,199,0.12); border: 1px solid rgba(0,194,199,0.2); display: grid; place-items: center; margin: 0 auto 16px; font-size: 22px; }
.nc-stat-num { font-family: 'Sora', sans-serif; font-size: 44px; font-weight: 800; color: var(--white); line-height: 1; }
.nc-stat-num span { color: var(--teal); }
.nc-stat-lbl { font-size: 14px; color: var(--muted); margin-top: 8px; }

.nc-about { background: var(--dark); padding: 96px 28px; }
.nc-about-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
.nc-about-imgs { position: relative; }
.nc-about-img-main { width: 100%; height: 440px; object-fit: cover; border-radius: 18px; border: 1px solid rgba(0,194,199,0.15); }
.nc-about-img-small { position: absolute; bottom: -24px; right: -24px; width: 200px; height: 160px; object-fit: cover; border-radius: 14px; border: 3px solid var(--dark); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
.nc-about-exp { position: absolute; top: 24px; left: -24px; background: var(--teal); color: var(--black); border-radius: 14px; padding: 20px; text-align: center; }
.nc-about-exp .num { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 900; }
.nc-about-exp .lbl { font-size: 11px; font-weight: 700; }
.nc-about-text h2 { font-family: 'Sora', sans-serif; font-size: clamp(36px,4vw,56px); font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
.nc-about-text p { font-size: 15px; line-height: 1.75; color: #8AACAC; margin-bottom: 16px; }
.nc-bullets { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0 32px; }
.nc-bullet { display: flex; align-items: center; gap: 10px; background: var(--dark2); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 600; }
.nc-bullet::before { content: '✓'; color: var(--teal); font-weight: 900; }

.nc-services { background: var(--dark2); padding: 96px 28px; }
.nc-services-inner { max-width: 1280px; margin: 0 auto; }
.nc-section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; }
.nc-section-head h2 { font-family: 'Sora', sans-serif; font-size: clamp(32px,3.8vw,52px); font-weight: 800; line-height: 1.1; max-width: 560px; }
.nc-services-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.nc-service-card { background: var(--dark3); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; transition: all 0.3s ease; }
.nc-service-card:hover { border-color: rgba(0,194,199,0.4); transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,194,199,0.15); }
.nc-service-card img { width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.4s ease; }
.nc-service-card:hover img { transform: scale(1.05); }
.nc-service-body { padding: 20px; }
.nc-service-tag { display: inline-block; background: rgba(0,194,199,0.12); color: var(--teal); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; border-radius: 4px; padding: 4px 10px; margin-bottom: 10px; }
.nc-service-body h4 { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 10px; }
.nc-service-body p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 16px; }
.nc-service-link { color: var(--teal); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }

.nc-doctors { background: var(--dark); padding: 96px 28px; }
.nc-doctors-inner { max-width: 1280px; margin: 0 auto; }
.nc-doctors-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-top: 48px; }
.nc-doc-card { background: var(--dark2); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; transition: all 0.3s ease; cursor: pointer; }
.nc-doc-card:hover { border-color: rgba(0,194,199,0.35); transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
.nc-doc-img-wrap { position: relative; overflow: hidden; }
.nc-doc-img-wrap img { width: 100%; height: 220px; object-fit: cover; transition: transform 0.4s; }
.nc-doc-card:hover img { transform: scale(1.06); }
.nc-doc-badge { position: absolute; top: 12px; left: 12px; background: var(--teal); color: var(--black); font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; }
.nc-doc-body { padding: 18px; }
.nc-doc-name { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 4px; }
.nc-doc-spec { font-size: 12px; color: var(--teal); font-weight: 600; margin-bottom: 14px; }
.nc-doc-meta { display: flex; gap: 14px; font-size: 12px; color: var(--muted); }
.nc-doc-rating { color: #FFB800; font-weight: 700; }

.nc-why { background: var(--teal); padding: 0; overflow: hidden; }
.nc-why-grid { max-width: 100%; display: grid; grid-template-columns: 1fr 1fr; min-height: 560px; }
.nc-why-image { background: linear-gradient(rgba(0,194,199,0.1), rgba(8,11,11,0.6)), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat; }
.nc-why-copy { background: var(--black); padding: 72px 64px; display: flex; flex-direction: column; justify-content: center; }
.nc-why-copy h2 { font-family: 'Sora', sans-serif; font-size: clamp(32px,3.5vw,52px); font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
.nc-why-copy h2 span { color: var(--teal); }
.nc-why-copy p { font-size: 15px; color: #7A9A9A; line-height: 1.7; margin-bottom: 28px; }
.nc-why-list { display: grid; gap: 12px; }
.nc-why-item { display: flex; gap: 16px; align-items: center; padding: 16px 18px; border-radius: 12px; background: var(--dark2); border: 1px solid var(--line); }
.nc-why-num { width: 36px; height: 36px; border-radius: 50%; background: var(--teal); color: var(--black); display: grid; place-items: center; font-weight: 900; font-size: 14px; flex-shrink: 0; }
.nc-why-item-text { font-size: 14px; font-weight: 600; }

.nc-cta { background: var(--dark2); padding: 96px 28px; }
.nc-cta-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.nc-cta-copy h2 { font-family: 'Sora', sans-serif; font-size: clamp(32px,3.8vw,52px); font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
.nc-cta-copy p { font-size: 15px; color: #7A9A9A; line-height: 1.7; margin-bottom: 28px; }
.nc-partner { background: var(--dark3); border: 1px solid var(--line); border-radius: 10px; padding: 14px; font-size: 13px; font-weight: 700; color: #6A8A8A; text-align: center; }
.nc-form { background: var(--dark3); border: 1px solid rgba(0,194,199,0.2); border-radius: 20px; padding: 36px; }
.nc-form h3 { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.nc-form p { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
.nc-field { margin-bottom: 14px; }
.nc-field label { display: block; font-size: 12px; font-weight: 700; color: #8AACAC; margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase; }
.nc-field input, .nc-field select, .nc-field textarea { width: 100%; background: var(--dark2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 14px; font-family: inherit; font-size: 14px; color: var(--white); transition: border-color 0.2s; }
.nc-field input:focus, .nc-field select:focus, .nc-field textarea:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px rgba(0,194,199,0.1); }
.nc-field textarea { min-height: 80px; resize: vertical; }
.nc-field select option { background: var(--dark2); }

.nc-footer { background: var(--dark2); border-top: 1px solid var(--line); padding: 64px 28px 28px; }
.nc-footer-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 48px; border-bottom: 1px solid var(--line); }
.nc-footer-brand p { font-size: 14px; color: #5A7A7A; line-height: 1.7; margin-top: 16px; max-width: 280px; }
.nc-footer-col h5 { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--teal); margin-bottom: 18px; }
.nc-footer-col a { display: block; font-size: 14px; color: #6A8A8A; margin-bottom: 10px; transition: color 0.2s; }
.nc-footer-col a:hover { color: var(--white); }
.nc-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; font-size: 13px; color: #4A6A6A; max-width: 1280px; margin: 0 auto; }
.nc-footer-bottom span { color: var(--teal); font-weight: 700; }

.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

@media(max-width:1100px) {
  .nc-hero-inner { grid-template-columns: 1fr; }
  .nc-hero-visual { display: none; }
  .nc-about-inner, .nc-cta-inner, .nc-why-grid { grid-template-columns: 1fr; }
  .nc-why-image { height: 300px; }
  .nc-stats-inner { grid-template-columns: repeat(2,1fr); }
  .nc-services-grid, .nc-doctors-grid { grid-template-columns: repeat(2,1fr); }
}
@media(max-width:768px) {
  .nc-nav-links { display: none; }
  .nc-services-grid, .nc-doctors-grid { grid-template-columns: 1fr; }
  .nc-footer-inner { grid-template-columns: 1fr 1fr; }
}
`;

const TRUST_ITEMS = [
  "AI-Powered Reception","Real-Time Patient Tracking","Doctor Coordination Dashboard",
  "ARIA Voice AI Receptionist","Twilio Telephony Integration","Role-Based Access Control","25+ Years Experience",
  "AI-Powered Reception","Real-Time Patient Tracking","Doctor Coordination Dashboard",
  "ARIA Voice AI Receptionist","Twilio Telephony Integration","Role-Based Access Control","25+ Years Experience",
];

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Homepage() {
  useReveal();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [navBg, setNavBg] = useState("rgba(8,11,11,0.92)");
  const [demoForm, setDemoForm] = useState({ fullName:"",workEmail:"",phone:"",org:"",type:"Hospital Campaign Inquiry",message:"" });

  useEffect(() => {
    const handler = () => setNavBg(window.scrollY > 40 ? "rgba(8,11,11,0.97)" : "rgba(8,11,11,0.92)");
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleLoginClick = () => navigate("/login");
  const handleDashboardClick = () => navigate("/dashboard");

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* NAVBAR */}
      <nav className="nc-nav" style={{ background: navBg }}>
        <div className="nc-nav-inner">
          <div className="nc-logo"><div className="nc-logo-mark">N</div>Nova<span>Care</span> AI</div>
          <div className="nc-nav-links">
            <a href="#home" className="active">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#doctors">Doctors</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="nc-nav-right">
            {isAuthenticated ? (
              <>
                <button className="btn btn-outline-teal" style={{fontSize:14}} onClick={handleDashboardClick}>
                  Dashboard ({user?.role})
                </button>
              </>
            ) : (
              <button className="btn btn-teal" id="homepage-login-btn" style={{fontSize:14}} onClick={handleLoginClick}>
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="nc-hero" id="home">
        <div className="nc-hero-inner">
          <div className="nc-hero-copy">
            <div className="nc-hero-badge">🤖 AI-Powered Hospital Management System</div>
            <h1 className="nc-hero-h1">Bringing <em>Quality<br/>Healthcare</em><br/>to You &amp;<br/>Your Family</h1>
            <p className="nc-hero-p">NovaCare AI combines intelligent patient management, real-time doctor coordination, and AI-assisted reception — all in one unified platform built for modern hospitals.</p>
            <div className="nc-hero-actions">
              <button className="btn btn-teal" id="homepage-getstarted-btn" style={{fontSize:15,padding:"14px 28px"}} onClick={handleLoginClick}>Get Started →</button>
              <button className="btn btn-outline-teal" style={{fontSize:15,padding:"14px 28px"}} onClick={() => scrollTo("about")}>Learn More</button>
            </div>
            <div className="nc-hero-stats">
              {[["500","+","Expert Doctors"],["25","K+","Patients Served"],["98","%","Satisfaction Rate"]].map(([n,s,l]) => (
                <div className="nc-hero-stat" key={l}><div className="num">{n}<span>{s}</span></div><div className="lbl">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="nc-hero-visual">
            <div className="nc-hero-img-wrap">
              <img src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=85" alt="Doctor" />
            </div>
            <div className="nc-float-card top-right"><div className="fc-label">Today's Appointments</div><div className="fc-value">142</div><div className="fc-sub">↑ 12% from yesterday</div></div>
            <div className="nc-float-card bottom-left"><div className="fc-label">Avg. Wait Time</div><div className="fc-value">8 min</div><div className="fc-sub">AI-optimized queue</div></div>
            <div className="nc-ai-badge"><div className="ai-dot"></div>ARIA AI Online</div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="nc-trust-bar"><div className="nc-trust-inner">{TRUST_ITEMS.map((t,i) => <div key={i} className="nc-trust-item">{t}</div>)}</div></div>

      {/* STATS */}
      <section className="nc-stats">
        <div className="nc-stats-inner">
          {[["🏥","500+","Specialist Doctors"],["👥","25K+","Happy Patients"],["🏆","25+","Years Experience"],["⚡","98%","Care Satisfaction"]].map(([icon,num,lbl],i) => (
            <div className="nc-stat-item reveal" key={lbl} style={{transitionDelay:`${i*0.1}s`}}>
              <div className="nc-stat-icon">{icon}</div>
              <div className="nc-stat-num">{num.replace(/[+%K]/g,"")}<span>{num.match(/[+%K]+/)?.[0]}</span></div>
              <div className="nc-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="nc-about" id="about">
        <div className="nc-about-inner">
          <div className="nc-about-imgs reveal">
            <img className="nc-about-img-main" src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80" alt="Medical team" />
            <img className="nc-about-img-small" src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=400&q=80" alt="Doctor consultation" />
            <div className="nc-about-exp"><div className="num">25+</div><div className="lbl">Years of<br/>Excellence</div></div>
          </div>
          <div className="nc-about-text reveal" style={{transitionDelay:"0.15s"}}>
            <div className="section-label">About Us</div>
            <h2>The Great Place of<br/>Medical Hospital Center</h2>
            <p>NovaCare AI is a next-generation hospital management platform designed for efficiency, accuracy, and compassionate patient care.</p>
            <div className="nc-bullets">
              {["Indoor Operations & Appointment","500+ Expert Doctors","Free Service Support","Modern AI Instruments","Real-Time Patient Tracking","24/7 ARIA Receptionist"].map(b => <div key={b} className="nc-bullet">{b}</div>)}
            </div>
            <p>A center focused on clarity, care, and measurable outcomes with experienced clinicians and efficient tools.</p>
            <button className="btn btn-teal" onClick={handleLoginClick}>Request an Appointment →</button>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="nc-services" id="services">
        <div className="nc-services-inner">
          <div className="nc-section-head reveal">
            <div><div className="section-label">Service Area</div><h2>Caring for the Whole<br/>Patient, Not Just<br/>Your Symptoms</h2></div>
          </div>
          <div className="nc-services-grid">
            {[
              {img:"https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=600&q=80",tag:"SURGERY",title:"Plastic Surgery",desc:"Advanced procedures and consultation support managed with precise AI-assisted scheduling."},
              {img:"https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",tag:"ORTHOPEDICS",title:"Orthopedic Care",desc:"Bone and joint care programs delivered with experienced specialists and AI-powered analysis."},
              {img:"https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",tag:"NEUROLOGY",title:"Neurology",desc:"Comprehensive neurological care with clear patient pathways and intelligent follow-up workflows."},
              {img:"https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600&q=80",tag:"CARDIOLOGY",title:"Cardiac Care",desc:"Heart health programs backed by continuous monitoring and real-time expert cardiologist support."},
              {img:"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=80",tag:"PEDIATRICS",title:"Children's Health",desc:"Specialized pediatric care with child-friendly environments and AI-assisted growth tracking."},
              {img:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",tag:"DIAGNOSTICS",title:"Lab & Diagnostics",desc:"Fast, accurate diagnostic services with AI-assisted analysis and instant result delivery."},
            ].map((s,i) => (
              <div key={s.title} className="nc-service-card reveal" style={{transitionDelay:`${(i%3)*0.1}s`}}>
                <img src={s.img} alt={s.title} />
                <div className="nc-service-body">
                  <span className="nc-service-tag">{s.tag}</span>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                  <div className="nc-service-link">Read More ›</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS */}
      <section className="nc-doctors" id="doctors">
        <div className="nc-doctors-inner">
          <div className="reveal" style={{textAlign:"center",maxWidth:560,margin:"0 auto"}}>
            <div className="section-label" style={{justifyContent:"center"}}>Our Specialists</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(32px,4vw,52px)",fontWeight:800}}>Meet Our Expert<br/><span className="teal">Medical Team</span></h2>
          </div>
          <div className="nc-doctors-grid">
            {[
              {img:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",badge:"CARDIOLOGY",name:"Dr. Priya Krishnan",spec:"Senior Cardiologist",exp:"12 yrs exp",rating:"★ 4.9"},
              {img:"https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",badge:"NEUROLOGY",name:"Dr. Arjun Mehta",spec:"Neurologist",exp:"9 yrs exp",rating:"★ 4.8"},
              {img:"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",badge:"ORTHOPEDICS",name:"Dr. Sunil Silva",spec:"Orthopedic Surgeon",exp:"15 yrs exp",rating:"★ 4.9"},
              {img:"https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=400&q=80",badge:"PEDIATRICS",name:"Dr. Nila Patel",spec:"Pediatrician",exp:"8 yrs exp",rating:"★ 5.0"},
            ].map((d,i) => (
              <div key={d.name} className="nc-doc-card reveal" style={{transitionDelay:`${(i%4)*0.1}s`}}>
                <div className="nc-doc-img-wrap"><img src={d.img} alt={d.name} /><div className="nc-doc-badge">{d.badge}</div></div>
                <div className="nc-doc-body">
                  <div className="nc-doc-name">{d.name}</div>
                  <div className="nc-doc-spec">{d.spec}</div>
                  <div className="nc-doc-meta"><span>{d.exp}</span><span className="nc-doc-rating">{d.rating}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="nc-why" id="why">
        <div className="nc-why-grid">
          <div className="nc-why-image" role="img" aria-label="Hospital care environment"></div>
          <div className="nc-why-copy reveal">
            <div className="section-label">Why Choose Us</div>
            <h2>We're <span>Different</span><br/>From Others —<br/>Choose <span>NovaCare</span></h2>
            <p>NovaCare AI combines trusted clinical operations with digital coordination to improve speed, communication, and patient confidence.</p>
            <div className="nc-why-list">
              {["Intensive care support with clear escalation workflows and AI alert system","Specialized support teams for multi-department coordination via ARIA","Real-time receptionist and doctor status alignment across all devices","Secure patient data with role-based access and audit logging"].map((t,i) => (
                <div key={i} className="nc-why-item"><div className="nc-why-num">{i+1}</div><div className="nc-why-item-text">{t}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="nc-cta" id="contact">
        <div className="nc-cta-inner">
          <div className="nc-cta-copy reveal">
            <div className="section-label">Get In Touch</div>
            <h2>Get the Right Hospital<br/>Care Plan <span className="teal">For You</span></h2>
            <p>NovaCare AI helps families choose reliable specialists, book appointments quickly, and receive trusted care guidance.</p>
            <div style={{display:"flex",gap:12,marginBottom:32}}>
              <button className="btn btn-teal" id="homepage-book-btn" onClick={handleLoginClick}>Book Appointment →</button>
              <button className="btn btn-outline-teal" onClick={handleLoginClick}>Staff Access</button>
            </div>
            <div style={{display:"flex",gap:24,padding:20,background:"var(--dark3)",borderRadius:14,border:"1px solid var(--line)"}}>
              {[["PHONE","+94 21 222 3456"],["EMAIL","care@novacare.ai"],["LOCATION","Alaveddy, Sri Lanka"]].map(([lbl,val]) => (
                <div key={lbl}><div style={{fontSize:11,color:"var(--teal)",fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>{lbl}</div><div style={{fontWeight:700}}>{val}</div></div>
              ))}
            </div>
          </div>
          <div className="nc-form reveal" style={{transitionDelay:"0.2s"}}>
            <h3>Contact Us Now</h3>
            <p>Fill in the form below and our team will get back to you within 24 hours.</p>
            {[{label:"Your Name",id:"fullName",placeholder:"John Smith"},{label:"Email Address",id:"workEmail",type:"email",placeholder:"john@email.com"},{label:"Phone Number",id:"phone",placeholder:"+94 77 000 0000"},{label:"Hospital / Organization",id:"org",placeholder:"Your Hospital Name"}].map(f => (
              <div key={f.id} className="nc-field"><label>{f.label}</label><input id={`homepage-${f.id}`} type={f.type||"text"} placeholder={f.placeholder} value={demoForm[f.id]||""} onChange={e=>setDemoForm(p=>({...p,[f.id]:e.target.value}))} /></div>
            ))}
            <div className="nc-field"><label>Service Needed</label><select id="homepage-service-type" value={demoForm.type} onChange={e=>setDemoForm(p=>({...p,type:e.target.value}))}><option>Hospital Campaign Inquiry</option><option>Doctor Appointment</option><option>AI System Demo</option><option>Partnership</option></select></div>
            <div className="nc-field"><label>Message</label><textarea id="homepage-message" placeholder="Tell us how we can help..." value={demoForm.message} onChange={e=>setDemoForm(p=>({...p,message:e.target.value}))}></textarea></div>
            <button className="btn btn-teal" id="homepage-submit-btn" style={{width:"100%",justifyContent:"center",padding:14}}>Submit Request →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nc-footer">
        <div className="nc-footer-inner">
          <div className="nc-footer-brand">
            <div className="nc-logo"><div className="nc-logo-mark">N</div>Nova<span style={{color:"var(--teal)"}}>Care</span> AI</div>
            <p>A next-generation AI hospital management platform built for efficiency, accuracy, and compassionate patient care.</p>
          </div>
          <div className="nc-footer-col"><h5>Quick Links</h5>{["Home","About Us","Services","Doctors","Contact"].map(l=><a key={l} href={`#${l.toLowerCase().replace(" ","-")}`}>{l}</a>)}</div>
          <div className="nc-footer-col"><h5>Services</h5>{["Cardiology","Neurology","Orthopedics","Pediatrics","Surgery","Diagnostics"].map(s=><a key={s} href="#">{s}</a>)}</div>
          <div className="nc-footer-col"><h5>Platform</h5>{["ARIA Receptionist","Doctor Dashboard","Patient Portal","Admin Console","API Integration"].map(s=><a key={s} href="#">{s}</a>)}</div>
        </div>
        <div className="nc-footer-bottom">
          <div>Copyright © <span>NovaCare AI</span> 2025. All Rights Reserved — SLIIT SCU Group-03 Northern Knights</div>
          <div>Built with ❤️ in <span>Sri Lanka</span></div>
        </div>
      </footer>
    </>
  );
}
