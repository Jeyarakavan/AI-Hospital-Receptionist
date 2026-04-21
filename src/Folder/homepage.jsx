import { useState, useEffect, useRef, useCallback } from "react";

// ─── API ────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:4000/api";
async function api(path, options = {}) {
  const init = {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);
  const res = await fetch(API_BASE + path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const SESSION_KEY = "novacare_session";
const RECEP_TAB_KEY = "novacare_recep_tab";
const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "full" });

function badgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (["waiting", "confirmed", "pending"].includes(s)) return "badge badge-confirmed";
  if (["in review", "review", "processing", "accept", "accepted"].includes(s)) return "badge badge-processing";
  if (s === "done") return "badge badge-done";
  return "badge badge-confirmed";
}

// ─── STYLES ─────────────────────────────────────────────────────────────
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

/* UTILITIES */
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

/* NAVBAR */
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

/* HERO */
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

/* TRUST BAR */
.nc-trust-bar { background: var(--teal); padding: 0; overflow: hidden; }
.nc-trust-inner { display: flex; align-items: center; height: 52px; animation: ticker 20s linear infinite; white-space: nowrap; width: max-content; }
.nc-trust-item { display: flex; align-items: center; gap: 10px; padding: 0 40px; font-size: 13px; font-weight: 700; color: var(--black); }
.nc-trust-item::after { content: '▶'; font-size: 8px; color: rgba(0,0,0,0.4); margin-left: 40px; }
@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* STATS SECTION */
.nc-stats { background: var(--dark2); padding: 72px 28px; }
.nc-stats-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 0; }
.nc-stat-item { padding: 32px 24px; border-right: 1px solid var(--line); text-align: center; transition: background 0.3s; }
.nc-stat-item:last-child { border-right: none; }
.nc-stat-item:hover { background: var(--teal-glow); }
.nc-stat-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(0,194,199,0.12); border: 1px solid rgba(0,194,199,0.2); display: grid; place-items: center; margin: 0 auto 16px; font-size: 22px; }
.nc-stat-num { font-family: 'Sora', sans-serif; font-size: 44px; font-weight: 800; color: var(--white); line-height: 1; }
.nc-stat-num span { color: var(--teal); }
.nc-stat-lbl { font-size: 14px; color: var(--muted); margin-top: 8px; }

/* ABOUT */
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

/* SERVICES */
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

/* AI SECTION */
.nc-ai { background: var(--black); padding: 96px 28px; position: relative; overflow: hidden; }
.nc-ai::before { content: 'AI'; position: absolute; right: -40px; top: 50%; transform: translateY(-50%); font-size: 400px; font-weight: 900; color: rgba(0,194,199,0.03); font-family: 'Sora', sans-serif; pointer-events: none; }
.nc-ai-inner { max-width: 1280px; margin: 0 auto; }
.nc-ai-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 72px; align-items: center; margin-top: 56px; }
.nc-ai-features { display: grid; gap: 16px; }
.nc-ai-feat { display: flex; gap: 18px; align-items: flex-start; background: var(--dark2); border: 1px solid var(--line); border-radius: 14px; padding: 20px; transition: all 0.3s; }
.nc-ai-feat:hover { border-color: rgba(0,194,199,0.3); background: var(--dark3); }
.nc-ai-feat-icon { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; background: rgba(0,194,199,0.12); border: 1px solid rgba(0,194,199,0.2); display: grid; place-items: center; font-size: 20px; }
.nc-ai-feat-text h4 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.nc-ai-feat-text p { font-size: 13px; color: var(--muted); line-height: 1.6; }
.nc-ai-mockup { background: var(--dark2); border: 1px solid rgba(0,194,199,0.2); border-radius: 20px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,194,199,0.06); }
.nc-mockup-bar { background: var(--dark3); padding: 12px 18px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--line); }
.nc-mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
.nc-mockup-title { font-size: 12px; color: var(--muted); margin-left: auto; }
.nc-mockup-body { padding: 20px; }
.nc-mockup-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
.nc-m-stat { background: var(--dark3); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
.nc-m-stat .n { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: var(--teal); }
.nc-m-stat .l { font-size: 11px; color: var(--muted); margin-top: 3px; }
.nc-mockup-chart { background: var(--dark3); border: 1px solid var(--line); border-radius: 10px; padding: 14px; height: 120px; display: flex; align-items: flex-end; gap: 6px; margin-bottom: 14px; }
.nc-chart-bar { flex: 1; background: rgba(0,194,199,0.2); border-radius: 4px 4px 0 0; border: 1px solid rgba(0,194,199,0.3); }
.nc-chart-bar.hi { background: rgba(0,194,199,0.5); border-color: var(--teal); }
.nc-mockup-list { display: grid; gap: 8px; }
.nc-m-row { display: flex; align-items: center; gap: 10px; background: var(--dark3); border-radius: 8px; padding: 10px 12px; font-size: 12px; }
.nc-m-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.nc-m-name { flex: 1; font-weight: 600; }
.nc-m-tag { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
.tag-teal { background: rgba(0,194,199,0.15); color: var(--teal); }
.tag-yellow { background: rgba(255,196,0,0.15); color: #FFC400; }
.tag-green { background: rgba(0,200,100,0.15); color: #00C864; }

/* DOCTORS */
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

/* WHY */
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

/* PROCESS */
.nc-process { background: var(--dark2); padding: 96px 28px; }
.nc-process-inner { max-width: 1280px; margin: 0 auto; }
.nc-process-head { text-align: center; margin-bottom: 64px; }
.nc-process-head h2 { font-family: 'Sora', sans-serif; font-size: clamp(32px,3.8vw,52px); font-weight: 800; margin-top: 12px; }
.nc-steps-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; position: relative; }
.nc-steps-row::after { content: ''; position: absolute; top: 40px; left: 12.5%; right: 12.5%; height: 2px; background: repeating-linear-gradient(90deg, var(--teal) 0 12px, transparent 12px 24px); z-index: 0; }
.nc-step { text-align: center; padding: 0 20px; position: relative; z-index: 1; }
.nc-step-num { width: 80px; height: 80px; border-radius: 50%; background: var(--dark3); border: 2px solid rgba(0,194,199,0.3); display: grid; place-items: center; margin: 0 auto 20px; font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 900; color: var(--teal); transition: all 0.3s; }
.nc-step:hover .nc-step-num { background: var(--teal); color: var(--black); border-color: var(--teal); box-shadow: 0 0 30px rgba(0,194,199,0.4); }
.nc-step h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.nc-step p { font-size: 13px; color: var(--muted); line-height: 1.6; }

/* CARE */
.nc-care { background: var(--dark); padding: 96px 28px; }
.nc-care-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
.nc-care-text h2 { font-family: 'Sora', sans-serif; font-size: clamp(32px,3.8vw,52px); font-weight: 800; margin-bottom: 20px; line-height: 1.1; }
.nc-care-text p { color: #7A9A9A; line-height: 1.7; margin-bottom: 28px; }
.nc-care-cards { display: grid; gap: 14px; }
.nc-care-card { display: flex; gap: 16px; align-items: flex-start; background: var(--dark2); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
.nc-care-icon { width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; background: rgba(0,194,199,0.1); display: grid; place-items: center; font-size: 18px; }
.nc-care-card-text h5 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.nc-care-card-text p { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 0; }
.nc-care-images { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.nc-care-images img { width: 100%; height: 200px; object-fit: cover; border-radius: 14px; border: 1px solid var(--line); }
.nc-care-images img:first-child { grid-column: span 2; height: 240px; }

/* GALLERY */
.nc-gallery { background: var(--dark); padding: 96px 28px; }
.nc-gallery-inner { max-width: 1280px; margin: 0 auto; }
.nc-gallery-grid { display: grid; grid-template-columns: repeat(4,1fr); grid-template-rows: 220px 220px; gap: 12px; margin-top: 48px; }
.nc-gallery-item { overflow: hidden; border-radius: 14px; border: 1px solid var(--line); position: relative; }
.nc-gallery-item:first-child { grid-column: span 2; }
.nc-gallery-item:nth-child(4) { grid-row: span 2; grid-column: 4; }
.nc-gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.nc-gallery-item:hover img { transform: scale(1.08); }
.nc-gallery-item::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%); opacity: 0; transition: opacity 0.3s; }
.nc-gallery-item:hover::after { opacity: 1; }

/* TESTIMONIALS */
.nc-testimonials { background: var(--black); padding: 96px 28px; }
.nc-testimonials-inner { max-width: 1280px; margin: 0 auto; }
.nc-test-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
.nc-test-card { background: var(--dark2); border: 1px solid var(--line); border-radius: 18px; padding: 28px; transition: all 0.3s; }
.nc-test-card:hover { border-color: rgba(0,194,199,0.3); transform: translateY(-4px); }
.nc-test-quote { font-size: 40px; color: var(--teal); line-height: 1; margin-bottom: 16px; }
.nc-test-text { font-size: 15px; line-height: 1.7; color: #9ABABA; margin-bottom: 24px; }
.nc-test-author { display: flex; align-items: center; gap: 12px; }
.nc-test-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(0,194,199,0.3); }
.nc-test-name { font-weight: 700; font-size: 15px; }
.nc-test-role { font-size: 12px; color: var(--teal); }
.nc-test-stars { color: #FFB800; margin-bottom: 16px; }

/* PRICING */
.nc-pricing {
  background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,194,199,0.08) 0%, transparent 68%), var(--black);
  padding: 82px 28px;
}
.nc-pricing-inner { max-width: 1280px; margin: 0 auto; }
.nc-pricing-head { text-align: center; max-width: 760px; margin: 0 auto 36px; }
.nc-pricing-head h2 { font-family: 'Sora', sans-serif; font-size: clamp(26px,3.2vw,42px); font-weight: 800; line-height: 1.1; color: #eaf4ff; margin-bottom: 8px; }
.nc-pricing-head h2 .blue-word { color: #00c2c7; }
.nc-pricing-head p { font-size: 14px; line-height: 1.7; color: #9fb3cc; }
.nc-pricing-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 18px; }
.nc-price-card { background: linear-gradient(165deg,#101c2f 0%,#0d1728 100%); border-radius: 16px; border: 1px solid rgba(136,173,220,0.2); box-shadow: 0 16px 28px rgba(0,0,0,0.35); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.25s ease, box-shadow 0.25s ease; }
.nc-price-card:hover { transform: translateY(-6px); box-shadow: 0 24px 36px rgba(0,0,0,0.45); }
.nc-price-head { padding: 14px 16px; color: #fff; background: linear-gradient(135deg,#00c2c7,#00a5b0); }
.nc-price-head h3 { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 5px; }
.nc-price-sub { font-size: 12px; opacity: 0.92; }
.nc-price-body { padding: 16px; display: flex; flex-direction: column; height: 100%; }
.nc-price-value { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #4de3e8; margin-bottom: 10px; }
.nc-price-features { list-style: none; display: grid; gap: 8px; margin: 0 0 16px; padding: 0; color: #bfd2ea; font-size: 13px; line-height: 1.5; }
.nc-price-features li { display: flex; gap: 8px; align-items: flex-start; }
.nc-price-features li::before { content: '✓'; font-weight: 800; line-height: 1.2; color: #4de3e8; }
.nc-price-btn { margin-top: auto; border: none; border-radius: 11px; padding: 10px 13px; font-family: inherit; font-weight: 700; font-size: 13px; color: #fff; cursor: pointer; background: linear-gradient(140deg,#00c2c7,#00a5b0); box-shadow: 0 10px 18px rgba(0,0,0,0.35); transition: transform 0.2s ease, filter 0.2s ease; }
.nc-price-btn:hover { transform: translateY(-2px); filter: brightness(1.03); }
.nc-pricing-note { margin-top: 18px; text-align: center; font-size: 12px; color: #9cb7d8; background: rgba(13,25,43,0.94); border: 1px solid rgba(116,164,228,0.24); padding: 10px 12px; border-radius: 10px; }

/* CONTACT */
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

/* FOOTER */
.nc-footer { background: var(--dark2); border-top: 1px solid var(--line); padding: 64px 28px 28px; }
.nc-footer-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 48px; border-bottom: 1px solid var(--line); }
.nc-footer-brand p { font-size: 14px; color: #5A7A7A; line-height: 1.7; margin-top: 16px; max-width: 280px; }
.nc-footer-col h5 { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--teal); margin-bottom: 18px; }
.nc-footer-col a { display: block; font-size: 14px; color: #6A8A8A; margin-bottom: 10px; transition: color 0.2s; }
.nc-footer-col a:hover { color: var(--white); }
.nc-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; font-size: 13px; color: #4A6A6A; max-width: 1280px; margin: 0 auto; }
.nc-footer-bottom span { color: var(--teal); font-weight: 700; }

/* CHAT BUBBLE */
.nc-chat-bubble { position: fixed; bottom: 28px; right: 28px; z-index: 90; width: 56px; height: 56px; border-radius: 50%; background: var(--teal); color: var(--black); display: grid; place-items: center; font-size: 22px; cursor: pointer; box-shadow: 0 8px 24px rgba(0,194,199,0.4); transition: transform 0.2s, box-shadow 0.2s; border: none; font-family: inherit; }
.nc-chat-bubble:hover { transform: scale(1.1); box-shadow: 0 12px 32px rgba(0,194,199,0.55); }
.nc-chat-badge { position: absolute; top: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; background: #FF4444; border: 2px solid var(--dark2); font-size: 9px; font-weight: 900; color: white; display: grid; place-items: center; }

/* REVEAL */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

/* DASHBOARD */
.dashboard { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; background: var(--dark); }
.sidebar { background: linear-gradient(180deg,var(--dark2) 0%,#0f1f1f 52%,#132727 100%); border-right: 1px solid var(--line); color: white; padding: 18px 14px; display: flex; flex-direction: column; gap: 16px; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: 0.3px; color: #fff; }
.brand-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; color: var(--black); background: linear-gradient(160deg,#00d9df,var(--teal)); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.18); font-size: 14px; font-weight: 800; }
.side-nav { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
.side-link { border: none; text-align: left; background: transparent; color: #8fb0b0; font: inherit; cursor: pointer; border-radius: 10px; padding: 11px 12px; font-weight: 700; transition: all 0.2s ease; }
.side-link.active, .side-link:hover { color: var(--white); background: rgba(0,194,199,0.14); box-shadow: inset 2px 0 0 var(--teal); }
.side-profile { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.18); padding-top: 14px; }
.avatar { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; font-weight: 800; background: rgba(0,194,199,0.18); color: #d8feff; }
.main { padding: 22px; background: radial-gradient(ellipse 70% 60% at 74% 30%,rgba(0,194,199,0.08) 0%,transparent 64%), linear-gradient(var(--dark),var(--dark)); }
.header-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.header-row h2 { margin: 0; font-family: Sora,sans-serif; color: var(--off-white); }
.muted { color: #8aa7a7; }
.action-cards { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; margin-bottom: 14px; }
.action-card { background: var(--dark2); border: 1px solid var(--line); border-radius: 14px; padding: 14px; box-shadow: 0 12px 22px rgba(0,0,0,0.32); cursor: pointer; transition: all 0.2s ease; display: flex; gap: 12px; align-items: center; }
.action-card:hover { transform: translateY(-2px); border-color: rgba(0,194,199,0.36); }
.icon-bubble { width: 42px; height: 42px; border-radius: 50%; background: rgba(0,194,199,0.16); color: var(--teal); display: grid; place-items: center; font-size: 18px; font-weight: 800; }
.stats-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; margin-bottom: 14px; }
.stat { background: var(--dark2); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
.stat .num { font-size: 26px; font-weight: 800; color: var(--teal); }
.panel { background: var(--dark2); border-radius: 14px; border: 1px solid var(--line); padding: 14px; margin-bottom: 14px; }
.table-wrap { width: 100%; overflow: auto; border: 1px solid var(--line); border-radius: 12px; }
table { width: 100%; border-collapse: collapse; min-width: 760px; background: #101919; }
th, td { text-align: left; padding: 11px; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
th { color: #cbe4e4; font-size: 13px; }
td { color: #e1ecec; font-size: 14px; }
tbody tr:nth-child(odd) { background: rgba(255,255,255,0.02); }
.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-confirmed { background: rgba(0,194,199,0.16); color: #6df6f9; }
.badge-processing { background: rgba(255,196,0,0.2); color: #ffd466; }
.badge-done { background: rgba(0,200,100,0.2); color: #78f0b8; }
.grid-2 { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
label { font-size: 13px; color: #cbe0e0; font-weight: 700; }
.dashboard input, .dashboard select, .dashboard textarea { width: 100%; border: 1px solid rgba(255,255,255,0.12); background: #111b1b; border-radius: 10px; padding: 10px; font: inherit; color: #e8f7f7; }
.dropzone { border: 2px dashed rgba(0,194,199,0.3); border-radius: 12px; padding: 14px; text-align: center; color: #9bc0c0; background: rgba(0,194,199,0.05); }
.tiny { font-size: 12px; color: #8aa7a7; }
.row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.mini-btn { border: 1px solid rgba(0,194,199,0.24); border-radius: 8px; font-weight: 700; padding: 6px 9px; cursor: pointer; background: rgba(0,194,199,0.12); color: #89f6f8; font-family: inherit; }
.mini-btn.warn { background: rgba(255,196,0,0.2); color: #ffd466; border-color: rgba(255,196,0,0.36); }
.mini-btn.ok { background: rgba(0,200,100,0.2); color: #78f0b8; border-color: rgba(0,200,100,0.35); }
.mini-btn.danger { background: rgba(196,56,44,0.2); color: #ff9d93; border-color: rgba(196,56,44,0.35); }
.tabs { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.tab-btn { border: 1px solid rgba(0,194,199,0.24); padding: 9px 14px; border-radius: 10px; background: #101919; color: #9ed0d0; cursor: pointer; font-weight: 700; font-family: inherit; }
.tab-btn.active { background: linear-gradient(135deg,var(--teal),#38d9df); border-color: var(--teal); color: #fff; }
.btn-primary { padding: 10px 20px; background: linear-gradient(140deg,#00d9df,var(--teal)); color: var(--black); border-radius: 8px; border: none; font-family: inherit; font-weight: 700; cursor: pointer; }
.btn-primary:hover { filter: brightness(1.06); }
.btn-outline { padding: 10px 16px; background: #101919; border: 1px solid rgba(0,194,199,0.34); color: #8cecef; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: 600; }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 150; padding: 10px; }
.modal { width: min(900px,96vw); max-height: 92vh; overflow: auto; border-radius: 20px; background: var(--dark2); border: 1px solid rgba(0,194,199,0.24); padding: 16px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

/* LOGIN MODAL */
.login-modal { background: radial-gradient(ellipse 90% 80% at 80% 10%,rgba(64,130,255,0.22) 0%,transparent 62%), linear-gradient(145deg,#0d1728 0%,#0a121f 56%,#0a1018 100%); border: 1px solid rgba(86,136,236,0.38); }
.login-shell { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 20px; align-items: stretch; border-radius: 18px; overflow: hidden; }
.login-box { width: 100%; border-radius: 20px; border: 1px solid rgba(78,135,238,0.34); background: linear-gradient(160deg,rgba(14,26,44,0.94),rgba(11,21,36,0.92)); padding: 26px; height: 100%; display: flex; flex-direction: column; }
.login-title { margin: 0 0 6px; font-family: 'Sora',sans-serif; color: #d9ebff; }
.login-sub { margin: 0 0 14px; color: #8fb0df; font-size: 13px; line-height: 1.55; }
.login-side { border-radius: 20px; border: 1px solid rgba(92,141,232,0.3); background: radial-gradient(ellipse 80% 80% at 72% 12%,rgba(82,154,255,0.26) 0%,transparent 62%), linear-gradient(160deg,rgba(10,20,36,0.94),rgba(9,17,30,0.92)); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; min-height: 100%; }
.login-side h4 { margin: 0 0 10px; font-family: 'Sora',sans-serif; color: #cfe5ff; font-size: 20px; line-height: 1.3; }
.login-side p { margin: 0 0 14px; color: #91afd7; line-height: 1.65; font-size: 14px; }
.login-side ul { margin: 0; padding-left: 18px; color: #6fa8ff; display: grid; gap: 8px; font-size: 13px; }
.login-badge { display: inline-flex; align-items: center; gap: 8px; width: fit-content; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(68,127,224,0.26); background: rgba(68,127,224,0.2); color: #9fc5ff; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.login-badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 5px rgba(0,194,199,0.2); }
.login-image-frame { position: relative; border-radius: 18px; padding: 8px; background: linear-gradient(145deg,rgba(63,133,246,0.24),rgba(63,133,246,0.08)); box-shadow: 0 18px 30px rgba(37,74,131,0.22); }
.login-main-image { border-radius: 14px; object-fit: cover; width: 100%; border: 1px solid rgba(73,140,238,0.25); height: 246px; }
.login-image-caption { position: absolute; left: 16px; bottom: 16px; padding: 8px 11px; border-radius: 10px; background: rgba(26,62,123,0.78); border: 1px solid rgba(152,194,255,0.36); color: #f0f7ff; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.login-extra { margin-top: auto; padding-top: 14px; display: grid; gap: 10px; }
.login-extra-card { border-radius: 12px; border: 1px solid rgba(97,146,231,0.28); background: linear-gradient(145deg,rgba(13,26,45,0.82),rgba(9,20,36,0.78)); padding: 10px 12px; }
.login-extra-title { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #86b4ff; margin-bottom: 8px; }
.login-extra-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.login-extra-pill { padding: 5px 9px; border-radius: 999px; background: rgba(24,47,82,0.95); border: 1px solid rgba(97,146,231,0.35); color: #9ac1ff; font-size: 11px; font-weight: 700; }
.password-wrap { position: relative; }
.password-wrap input { padding-right: 44px; }
.eye-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(90,138,230,0.35); background: rgba(68,127,224,0.11); color: #3d6bc4; cursor: pointer; font-size: 15px; line-height: 1; }

/* TOAST */
.toast-wrap { position: fixed; top: 16px; right: 16px; z-index: 160; display: flex; flex-direction: column; gap: 8px; }
.toast { color: white; border-radius: 10px; padding: 10px 12px; font-weight: 700; min-width: 230px; animation: fadeUp 0.25s ease; }
.toast.ok { background: linear-gradient(140deg,#00d9df,var(--teal)); color: #032427; }
.toast.err { background: #b42318; }
.toast.info { background: linear-gradient(140deg,#00d9df,var(--teal)); color: #032427; }

/* RESPONSIVE */
@media(max-width:1100px) {
  .nc-hero-inner { grid-template-columns: 1fr; }
  .nc-hero-visual { display: none; }
  .nc-about-inner, .nc-ai-grid, .nc-cta-inner, .nc-why-grid, .nc-care-inner { grid-template-columns: 1fr; }
  .nc-why-image { height: 300px; }
  .nc-stats-inner { grid-template-columns: repeat(2,1fr); }
  .nc-services-grid, .nc-doctors-grid { grid-template-columns: repeat(2,1fr); }
  .nc-test-grid { grid-template-columns: repeat(2,1fr); }
  .nc-pricing-grid { grid-template-columns: repeat(2,1fr); }
}
@media(max-width:768px) {
  .nc-nav-links { display: none; }
  .nc-steps-row { grid-template-columns: repeat(2,1fr); }
  .nc-steps-row::after { display: none; }
  .nc-gallery-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
  .nc-gallery-item:first-child, .nc-gallery-item:nth-child(4) { grid-column: auto; grid-row: auto; }
  .nc-gallery-item { height: 160px; }
  .nc-services-grid, .nc-doctors-grid, .nc-test-grid { grid-template-columns: 1fr; }
  .nc-pricing-grid { grid-template-columns: 1fr; }
  .nc-footer-inner { grid-template-columns: 1fr 1fr; }
  .dashboard { grid-template-columns: 1fr; }
  .action-cards { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2,1fr); }
  .login-shell { grid-template-columns: 1fr; }
  .login-side { display: none; }
}
`;

// ─── TOAST ──────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === "error" ? "err" : t.type}`}>{t.text}</div>
      ))}
    </div>
  );
}

// ─── USE REVEAL ─────────────────────────────────────────────────────────
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

// ─── TRUST TICKER ───────────────────────────────────────────────────────
const TRUST_ITEMS = [
  "AI-Powered Reception","Real-Time Patient Tracking","Doctor Coordination Dashboard",
  "ARIA Voice AI Receptionist","Twilio Telephony Integration","Role-Based Access Control","25+ Years Experience",
  "AI-Powered Reception","Real-Time Patient Tracking","Doctor Coordination Dashboard",
  "ARIA Voice AI Receptionist","Twilio Telephony Integration","Role-Based Access Control","25+ Years Experience",
];

// ─── PUBLIC SITE ─────────────────────────────────────────────────────────
function PublicSite({ onOpenLogin }) {
  useReveal();
  const [navBg, setNavBg] = useState("rgba(8,11,11,0.92)");
  const [demoForm, setDemoForm] = useState({ fullName:"",workEmail:"",phone:"",org:"",type:"Hospital Campaign Inquiry",message:"" });

  useEffect(() => {
    const handler = () => setNavBg(window.scrollY > 40 ? "rgba(8,11,11,0.97)" : "rgba(8,11,11,0.92)");
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* NAVBAR */}
      <nav className="nc-nav" style={{ background: navBg }}>
        <div className="nc-nav-inner">
          <div className="nc-logo"><div className="nc-logo-mark">N</div>Nova<span>Care</span> AI</div>
          <div className="nc-nav-links">
            <a href="#home" className="active">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#doctors">Doctors</a>
            <a href="#ai-system">AI System</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="nc-nav-right">
            <button className="btn btn-teal" style={{fontSize:14}} onClick={onOpenLogin}>Login</button>
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
            <button className="btn btn-teal" onClick={onOpenLogin}>Request an Appointment →</button>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="nc-services" id="services">
        <div className="nc-services-inner">
          <div className="nc-section-head reveal">
            <div><div className="section-label">Service Area</div><h2>Caring for the Whole<br/>Patient, Not Just<br/>Your Symptoms</h2></div>
            <button className="btn btn-outline-teal" style={{flexShrink:0}}>View All Services →</button>
          </div>
          <div className="nc-services-grid">
            {[
              {img:"https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=600&q=80",tag:"SURGERY",title:"Plastic Surgery",desc:"Advanced procedures and consultation support managed with precise AI-assisted scheduling and recovery tracking."},
              {img:"https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",tag:"ORTHOPEDICS",title:"Orthopedic Care",desc:"Bone and joint care programs delivered with experienced specialists and AI-powered movement analysis tools."},
              {img:"https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",tag:"NEUROLOGY",title:"Neurology",desc:"Comprehensive neurological care with clear patient pathways, AI diagnostics support and intelligent follow-up workflows."},
              {img:"https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600&q=80",tag:"CARDIOLOGY",title:"Cardiac Care",desc:"Heart health programs backed by continuous monitoring, real-time alerts, and expert cardiologist support."},
              {img:"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=80",tag:"PEDIATRICS",title:"Children's Health",desc:"Specialized pediatric care with child-friendly environments and dedicated AI-assisted growth tracking tools."},
              {img:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",tag:"DIAGNOSTICS",title:"Lab & Diagnostics",desc:"Fast, accurate diagnostic services with AI-assisted analysis and instant result delivery to doctor dashboards."},
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

      {/* AI SYSTEM */}
      <section className="nc-ai" id="ai-system">
        <div className="nc-ai-inner">
          <div className="reveal" style={{textAlign:"center",maxWidth:640,margin:"0 auto"}}>
            <div className="section-label" style={{justifyContent:"center"}}>AI-Powered System</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(32px,4vw,52px)",fontWeight:800,marginBottom:16}}>Meet <span className="teal">ARIA</span> — Your Intelligent<br/>AI Hospital Receptionist</h2>
            <p style={{color:"#7A9A9A",fontSize:15,lineHeight:1.7}}>ARIA handles patient intake, appointment scheduling, voice interactions, and real-time coordination — 24 hours a day.</p>
          </div>
          <div className="nc-ai-grid">
            <div className="nc-ai-features reveal">
              {[
                {icon:"🎙️",title:"Voice AI Receptionist",desc:"ARIA handles patient calls, answers queries, and books appointments using natural language processing and Twilio telephony integration."},
                {icon:"📊",title:"Real-Time Dashboard",desc:"Live patient status updates, appointment queues, and doctor availability — all synchronized across all roles in real time."},
                {icon:"🔐",title:"Role-Based Access",desc:"Secure, separate dashboards for Admin, Receptionist, Doctor, and Patient roles — each with tailored permissions and views."},
                {icon:"📱",title:"Patient History Tracking",desc:"Complete patient records, booking history, uploaded images, and medical notes accessible instantly via patient code."},
              ].map(f => (
                <div key={f.title} className="nc-ai-feat">
                  <div className="nc-ai-feat-icon">{f.icon}</div>
                  <div className="nc-ai-feat-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                </div>
              ))}
            </div>
            <div className="nc-ai-mockup reveal" style={{transitionDelay:"0.2s"}}>
              <div className="nc-mockup-bar">
                <div className="nc-mockup-dot" style={{background:"#FF5F57"}}></div>
                <div className="nc-mockup-dot" style={{background:"#FFBD2E"}}></div>
                <div className="nc-mockup-dot" style={{background:"#28CA41"}}></div>
                <div className="nc-mockup-title">NovaCare AI — Reception Dashboard</div>
              </div>
              <div className="nc-mockup-body">
                <div className="nc-mockup-stat-row">
                  <div className="nc-m-stat"><div className="n">142</div><div className="l">Today's Queue</div></div>
                  <div className="nc-m-stat"><div className="n" style={{color:"#00C864"}}>38</div><div className="l">Confirmed</div></div>
                  <div className="nc-m-stat"><div className="n" style={{color:"#FFC400"}}>12</div><div className="l">Processing</div></div>
                </div>
                <div className="nc-mockup-chart">
                  {[40,65,50,85,70,55,90].map((h,i) => <div key={i} className={`nc-chart-bar${[3,6].includes(i)?" hi":""}`} style={{height:`${h}%`}}></div>)}
                </div>
                <div className="nc-mockup-list">
                  <div className="nc-m-row"><div className="nc-m-dot" style={{background:"var(--teal)"}}></div><div className="nc-m-name">Ravi Kumar — Dr. Priya (Cardio)</div><span className="nc-m-tag tag-teal">Confirmed</span></div>
                  <div className="nc-m-row"><div className="nc-m-dot" style={{background:"#FFC400"}}></div><div className="nc-m-name">Aisha Nair — Dr. Mehta (Neuro)</div><span className="nc-m-tag tag-yellow">Processing</span></div>
                  <div className="nc-m-row"><div className="nc-m-dot" style={{background:"#00C864"}}></div><div className="nc-m-name">Samuel Raj — Dr. Silva (Ortho)</div><span className="nc-m-tag tag-green">Done</span></div>
                </div>
              </div>
            </div>
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
              {img:"https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=400&q=80",badge:"SURGERY",name:"Dr. Ravi Nayak",spec:"General Surgeon",exp:"18 yrs exp",rating:"★ 4.7"},
              {img:"https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",badge:"RADIOLOGY",name:"Dr. Kavya Iyer",spec:"Radiologist",exp:"11 yrs exp",rating:"★ 4.8"},
              {img:"https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=400&q=80",badge:"PSYCHIATRY",name:"Dr. Mohan Das",spec:"Psychiatrist",exp:"14 yrs exp",rating:"★ 4.9"},
              {img:"https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=400&q=80",badge:"ONCOLOGY",name:"Dr. Sita Raman",spec:"Oncologist",exp:"20 yrs exp",rating:"★ 5.0"},
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

      {/* PROCESS */}
      <section className="nc-process">
        <div className="nc-process-inner">
          <div className="nc-process-head reveal"><div className="section-label" style={{justifyContent:"center"}}>How It Works</div><h2>Easy Step-by-Step<br/>Patient Care Process</h2></div>
          <div className="nc-steps-row">
            {[
              {n:"1",title:"Determine Your Eligibility",desc:"ARIA AI verifies patient eligibility, insurance, and required documentation through voice or digital channels."},
              {n:"2",title:"Understand Your Options",desc:"Smart doctor matching suggests the most relevant specialist based on symptoms, availability, and patient history."},
              {n:"3",title:"Enroll the Perfect Plan",desc:"Book appointments instantly with real-time slot availability and automatic confirmation via SMS and email."},
              {n:"4",title:"Continued Client Support",desc:"Post-visit tracking, follow-up reminders, and prescription status updates — all automated through the platform."},
            ].map((s,i) => (
              <div key={s.n} className="nc-step reveal" style={{transitionDelay:`${i*0.1}s`}}>
                <div className="nc-step-num">{s.n}</div>
                <h4>{s.title}</h4><p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERT CARE */}
      <section className="nc-care">
        <div className="nc-care-inner">
          <div className="nc-care-text reveal">
            <div className="section-label">Expert Care</div>
            <h2>Expert Care<br/>for <span className="teal">All Ages</span></h2>
            <p>Empowering you with top-notch healthcare services to live a healthier, happier life. NovaCare is built for families, individuals, and hospitals of all sizes.</p>
            <div className="nc-care-cards">
              {[{icon:"🏥",title:"Flexible Medical Packages",desc:"Comprehensive care plans tailored to individuals, families, and corporate clients with transparent pricing."},{icon:"📞",title:"Best Patient On-Call Support",desc:"24/7 ARIA voice support for immediate consultation, emergency triage, and appointment booking via phone."},{icon:"🏢",title:"Corporate Medical Services",desc:"Bulk employee health packages with dedicated account managers and priority scheduling for organizations."}].map(c => (
                <div key={c.title} className="nc-care-card"><div className="nc-care-icon">{c.icon}</div><div className="nc-care-card-text"><h5>{c.title}</h5><p>{c.desc}</p></div></div>
              ))}
            </div>
          </div>
          <div className="nc-care-images reveal" style={{transitionDelay:"0.2s"}}>
            <img src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80" alt="Doctors" />
            <img src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=500&q=80" alt="Patient care" />
            <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&q=80" alt="Technology" />
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="nc-gallery">
        <div className="nc-gallery-inner">
          <div className="reveal" style={{textAlign:"center",maxWidth:560,margin:"0 auto"}}>
            <div className="section-label" style={{justifyContent:"center"}}>Our Facility</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(28px,3.5vw,48px)",fontWeight:800,marginBottom:8}}>Latest Medical Services &amp;<br/>State-of-the-Art <span className="teal">Facility</span></h2>
          </div>
          <div className="nc-gallery-grid">
            {[
              "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
              "https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=500&q=80",
              "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=500&q=80",
              "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=500&q=80",
              "https://images.unsplash.com/photo-1666214280391-8ff5bd3d3de1?auto=format&fit=crop&w=500&q=80",
              "https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&w=500&q=80",
            ].map((src,i) => (
              <div key={i} className="nc-gallery-item reveal" style={{transitionDelay:`${(i%4)*0.1}s`}}><img src={src} alt={`Gallery ${i+1}`} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="nc-testimonials">
        <div className="nc-testimonials-inner">
          <div className="reveal" style={{textAlign:"center",marginBottom:48}}>
            <div className="section-label" style={{justifyContent:"center"}}>Testimonials</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(28px,3.8vw,48px)",fontWeight:800}}>What People Are <span className="teal">Saying</span></h2>
          </div>
          <div className="nc-test-grid">
            {[
              {stars:"★★★★★",text:"All the process steps were simple and organized. The AI receptionist ARIA guided us through each appointment and follow-up without any confusion whatsoever.",avatar:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",name:"John Smith",role:"Patient — New York"},
              {stars:"★★★★★",text:"NovaCare AI made it easier to connect with the correct specialist and receive timely updates from reception to doctor visit completion. Outstanding system.",avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",name:"Kevin Hall",role:"Patient — California",featured:true},
              {stars:"★★★★★",text:"As a doctor, the dashboard has transformed how I manage my patients. The real-time updates and AI-assisted notes save me hours every day.",avatar:"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80",name:"Dr. Amara Patel",role:"Specialist — NovaCare Staff"},
            ].map((t,i) => (
              <div key={i} className="nc-test-card reveal" style={{transitionDelay:`${i*0.1}s`,...(t.featured?{borderColor:"rgba(0,194,199,0.3)",background:"var(--dark3)"}:{})}}>
                <div className="nc-test-stars">{t.stars}</div>
                <div className="nc-test-quote" style={t.featured?{color:"#00D9DF"}:{}}>"</div>
                <div className="nc-test-text" style={t.featured?{color:"#AACCCC"}:{}}>{t.text}</div>
                <div className="nc-test-author">
                  <img className="nc-test-avatar" src={t.avatar} alt={t.name} />
                  <div><div className="nc-test-name">{t.name}</div><div className="nc-test-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="nc-pricing" id="pricing">
        <div className="nc-pricing-inner">
          <div className="nc-pricing-head reveal">
            <div className="section-label" style={{justifyContent:"center",color:"#2f71df"}}>Pricing Plans</div>
            <h2>Choose the Right AI Hospital <span className="blue-word">Plan</span></h2>
            <p>Simple, transparent pricing built for clinics, hospitals, and growing healthcare networks.</p>
          </div>
          <div className="nc-pricing-grid">
            {[
              {title:"Monthly Plan",sub:"Pay as you go",price:"$29/month",features:["Full Access to Core Modules","Patient Registration & Records","Appointment Scheduling","Basic AI Assistance","Web & Mobile Access","Daily Reports"]},
              {title:"1 Year Plan",sub:"Save more, zero hassle",price:"$299/year",features:["All Monthly Features","Priority Support","AI Diagnostics Assistance","Billing & Insurance","Secure Cloud Backup","Staff Management"]},
              {title:"2 Year Plan",sub:"Long-term value",price:"$499/2 years",features:["All 1 Year Features","Advanced AI Analytics","Multi-Branch Support","Custom Reports","Dedicated Manager","API Integrations"]},
              {title:"3 Year Plan",sub:"Enterprise solution",price:"$699/3 years",features:["All 2 Year Features","Custom AI Model Options","Full Customization","24/7 Premium Support","Enterprise Security","Data Migration"]},
            ].map((p,i) => (
              <div key={p.title} className="nc-price-card reveal" style={{transitionDelay:`${i*0.05}s`}}>
                <div className="nc-price-head"><h3>{p.title}</h3><div className="nc-price-sub">{p.sub}</div></div>
                <div className="nc-price-body">
                  <div className="nc-price-value">{p.price}</div>
                  <ul className="nc-price-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                  <button className="nc-price-btn">Get Started</button>
                </div>
              </div>
            ))}
          </div>
          <div className="nc-pricing-note reveal">Setup fee of $100 applies to monthly plan only. No setup fee for yearly plans.</div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="nc-cta" id="contact">
        <div className="nc-cta-inner">
          <div className="nc-cta-copy reveal">
            <div className="section-label">Get In Touch</div>
            <h2>Get the Right Hospital<br/>Care Plan <span className="teal">For You</span></h2>
            <p>NovaCare AI helps families choose reliable specialists, book appointments quickly, and receive trusted care guidance with real-time updates.</p>
            <div style={{display:"flex",gap:12,marginBottom:32}}>
              <button className="btn btn-teal">Book Appointment →</button>
              <button className="btn btn-outline-teal" onClick={onOpenLogin}>Staff Access</button>
            </div>
            <div style={{display:"flex",gap:24,padding:20,background:"var(--dark3)",borderRadius:14,border:"1px solid var(--line)"}}>
              {[["PHONE","+94 21 222 3456"],["EMAIL","care@novacare.ai"],["LOCATION","Alaveddy, Sri Lanka"]].map(([lbl,val]) => (
                <div key={lbl}><div style={{fontSize:11,color:"var(--teal)",fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>{lbl}</div><div style={{fontWeight:700}}>{val}</div></div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:28}}>
              {["Mercy Health","Humana Care","Aetna Clinic","BlueCross","Cigna","Medico"].map(p => <div key={p} className="nc-partner">{p}</div>)}
            </div>
          </div>
          <div className="nc-form reveal" style={{transitionDelay:"0.2s"}}>
            <h3>Contact Us Now</h3>
            <p>Fill in the form below and our team will get back to you within 24 hours.</p>
            {[{label:"Your Name",id:"demo-full-name",placeholder:"John Smith"},{label:"Email Address",id:"demo-work-email",type:"email",placeholder:"john@email.com"},{label:"Phone Number",id:"demo-phone",placeholder:"+94 77 000 0000"},{label:"Hospital / Organization",id:"demo-org",placeholder:"Your Hospital Name"}].map(f => (
              <div key={f.id} className="nc-field"><label>{f.label}</label><input id={f.id} type={f.type||"text"} placeholder={f.placeholder} value={demoForm[f.id]||""} onChange={e=>setDemoForm(p=>({...p,[f.id]:e.target.value}))} /></div>
            ))}
            <div className="nc-field"><label>Service Needed</label><select id="demo-type" value={demoForm.type} onChange={e=>setDemoForm(p=>({...p,type:e.target.value}))}><option>Hospital Campaign Inquiry</option><option>Doctor Appointment</option><option>AI System Demo</option><option>Partnership</option></select></div>
            <div className="nc-field"><label>Message</label><textarea id="demo-message" placeholder="Tell us how we can help..." value={demoForm.message} onChange={e=>setDemoForm(p=>({...p,message:e.target.value}))}></textarea></div>
            <button className="btn btn-teal" style={{width:"100%",justifyContent:"center",padding:14}}>Submit Request →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nc-footer">
        <div className="nc-footer-inner">
          <div className="nc-footer-brand">
            <div className="nc-logo"><div className="nc-logo-mark">N</div>Nova<span style={{color:"var(--teal)"}}>Care</span> AI</div>
            <p>A next-generation AI hospital management platform built for efficiency, accuracy, and compassionate patient care across Sri Lanka and beyond.</p>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              {["f","in","X"].map(s => <div key={s} style={{width:36,height:36,borderRadius:8,background:"var(--dark3)",border:"1px solid var(--line)",display:"grid",placeItems:"center",cursor:"pointer",fontSize:14}}>{s}</div>)}
            </div>
          </div>
          <div className="nc-footer-col"><h5>Quick Links</h5>{["Home","About Us","Services","Doctors","Contact"].map(l=><a key={l} href={`#${l.toLowerCase().replace(" ","-")}`}>{l}</a>)}</div>
          <div className="nc-footer-col"><h5>Services</h5>{["Cardiology","Neurology","Orthopedics","Pediatrics","Surgery","Diagnostics"].map(s=><a key={s} href="#">{s}</a>)}</div>
          <div className="nc-footer-col"><h5>AI System</h5>{["ARIA Receptionist","Doctor Dashboard","Patient Portal","Admin Console","API Integration","Twilio Telephony"].map(s=><a key={s} href="#">{s}</a>)}</div>
        </div>
        <div className="nc-footer-bottom">
          <div>Copyright © <span>NovaCare AI</span> 2025. All Rights Reserved — SLIIT SCU Group-03 Northern Knights</div>
          <div>Built with ❤️ in <span>Sri Lanka</span></div>
        </div>
      </footer>
    </>
  );
}

// ─── DASHBOARDS ──────────────────────────────────────────────────────────

function AdminDashboard({ currentUser, onLogout, showToast }) {
  const [receptionists, setReceptionists] = useState([]);
  const [form, setForm] = useState({ username: "", password: "" });

  const load = useCallback(async () => {
    const d = await api("/receptionists");
    setReceptionists(d.receptionists || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.username || !form.password) return showToast("Username and password required", "error");
    try { await api("/receptionists", { method: "POST", body: form }); showToast("Receptionist created", "ok"); setForm({ username: "", password: "" }); load(); }
    catch (e) { showToast(e.message, "error"); }
  };

  const del = async (u) => {
    if (!confirm(`Delete ${u}?`)) return;
    try { await api(`/receptionists/${encodeURIComponent(u)}`, { method: "DELETE" }); showToast("Removed", "ok"); load(); }
    catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">HA</div> NovaCare AI</div>
        <div className="side-nav"><button className="side-link active">Overview</button></div>
        <div className="side-profile">
          <div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar">AD</div><div><div style={{fontWeight:800}}>Admin</div><div className="tiny" style={{color:"#d7ede4"}}>System Control</div></div></div>
          <button className="btn-outline" style={{marginTop:10,width:"100%",padding:"8px 12px",borderRadius:8,cursor:"pointer"}} onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <section className="main">
        <div className="header-row"><h2>Admin Panel</h2><div className="muted">{dateFmt.format(new Date())}</div></div>
        <div className="grid-2">
          <div className="panel">
            <h3 style={{marginTop:0}}>Add Receptionist</h3>
            <div className="field"><label>Username</label><input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} /></div>
            <div className="field"><label>Password</label><input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} /></div>
            <button className="btn-primary" onClick={add}>Create Receptionist</button>
          </div>
          <div className="panel">
            <h3 style={{marginTop:0}}>Receptionists</h3>
            <div className="table-wrap">
              <table><thead><tr><th>Username</th><th>Created</th><th>Action</th></tr></thead>
                <tbody>{receptionists.length ? receptionists.map(r=>(
                  <tr key={r.username}><td>{r.username}</td><td>{new Date(r.createdAt).toLocaleString()}</td><td><button className="mini-btn danger" onClick={()=>del(r.username)}>Delete</button></td></tr>
                )) : <tr><td colSpan={3} className="muted" style={{textAlign:"center"}}>No records</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReceptionDashboard({ currentUser, onLogout, showToast }) {
  const [tab, setTab] = useState("recep-overview");
  const [doctors, setDoctors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [bookForm, setBookForm] = useState({name:"",manual:"",address:"",mobile:"",email:"",problem:"",date:"",time:"",doctor:"",priority:"Normal"});
  const [docForm, setDocForm] = useState({name:"",age:"",nic:"",specialization:"",hospital:"",dob:"",from:"",to:"",mobile:"",email:"",username:"",password:""});

  const u = encodeURIComponent(currentUser?.username || "");
  const scoped = u ? `?createdByUsername=${u}` : "";

  const load = useCallback(async () => {
    const [d, b, p] = await Promise.all([api(`/doctors${scoped}`), api(`/reception-bookings${scoped}`), api(`/patients${scoped}`)]);
    setDoctors(d.doctors || []); setBookings(b.bookings || []); setPatients(p.patients || []);
  }, [scoped]);

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const kpiToday = bookings.filter(b => b.bookingDate === today).length;
  const kpiConfirmed = bookings.filter(b => String(b.status||"").toLowerCase() === "confirmed").length;

  const saveBooking = async () => {
    if (!bookForm.name||!bookForm.mobile||!bookForm.date||!bookForm.time||!bookForm.problem) return showToast("Fill required fields","error");
    try {
      await api("/reception-bookings", { method:"POST", body:{patientName:bookForm.name,manualPatientId:bookForm.manual,address:bookForm.address,mobile:bookForm.mobile,email:bookForm.email,reason:bookForm.problem,sickness:bookForm.problem,bookingDate:bookForm.date,bookingTime:bookForm.time,assignedDoctor:bookForm.doctor,priority:bookForm.priority,createdByRole:"receptionist",createdByUsername:currentUser?.username||"",source:"reception-ui",status:"Waiting"}});
      showToast("Appointment Created","ok"); setShowBookingModal(false); load();
    } catch(e){ showToast(e.message,"error"); }
  };

  const addDoctor = async () => {
    try {
      await api("/doctors", { method:"POST", body:{...docForm, createdByUsername:currentUser?.username||"", doctorId:`DR-${Date.now().toString().slice(-5)}`}});
      showToast("Doctor added","ok"); setDocForm({name:"",age:"",nic:"",specialization:"",hospital:"",dob:"",from:"",to:"",mobile:"",email:"",username:"",password:""}); load();
    } catch(e){ showToast(e.message,"error"); }
  };

  const openHistory = async (code) => {
    try {
      const data = await api(`/patients/${encodeURIComponent(code)}?createdByUsername=${encodeURIComponent(currentUser?.username||"")}`);
      setHistoryData(data); setShowHistoryModal(true);
    } catch(e){ showToast(e.message,"error"); }
  };

  const delPatient = async (code) => {
    if (!confirm(`Delete patient ${code}?`)) return;
    try { await api(`/patients/${encodeURIComponent(code)}?createdByUsername=${encodeURIComponent(currentUser?.username||"")}`,{method:"DELETE"}); showToast("Deleted","ok"); load(); }
    catch(e){ showToast(e.message,"error"); }
  };

  const delDoctor = async (id) => {
    if (!confirm(`Delete doctor ${id}?`)) return;
    try { await api(`/doctors/by-id/${encodeURIComponent(id)}`,{method:"DELETE"}); showToast("Deleted","ok"); load(); }
    catch(e){ showToast(e.message,"error"); }
  };

  const setStatus = async (id, status) => {
    try { await api(`/reception-bookings/${id}/status`,{method:"PATCH",body:{status}}); showToast(`Status: ${status}`,"ok"); load(); }
    catch(e){ showToast(e.message,"error"); }
  };

  const TABS = [["recep-overview","Overview"],["recep-doctors","Doctors"],["recep-appointments","Appointments"],["recep-patients","Patients"],["recep-ai","AI Reception"]];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">HA</div> NovaCare AI</div>
        <div className="side-nav">{TABS.map(([id,label])=><button key={id} className={`side-link${tab===id?" active":""}`} onClick={()=>setTab(id)}>{label}</button>)}</div>
        <div className="side-profile">
          <div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar">{(currentUser?.username||"RF").slice(0,2).toUpperCase()}</div><div><div style={{fontWeight:800}}>{currentUser?.username}</div><div className="tiny" style={{color:"#d7ede4"}}>Front Desk</div></div></div>
          <button className="btn-outline" style={{marginTop:10,width:"100%",padding:"8px 12px",borderRadius:8,cursor:"pointer"}} onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <section className="main">
        <div className="header-row"><h2>{TABS.find(t=>t[0]===tab)?.[1]}</h2><div className="muted">{dateFmt.format(new Date())}</div></div>

        {tab==="recep-overview" && (
          <>
            <div className="action-cards">
              <div className="action-card" onClick={()=>setShowBookingModal(true)}><div className="icon-bubble">+</div><div><strong>New Appointment</strong><div className="tiny">Create patient booking</div></div></div>
              <div className="action-card"><div className="icon-bubble">AI</div><div><strong>AI Reception</strong><div className="tiny">Assist patient intake</div></div></div>
              <div className="action-card" onClick={()=>{const c=prompt("Enter Patient Code");if(c)openHistory(c.trim());}}><div className="icon-bubble">H</div><div><strong>Patient History</strong><div className="tiny">Open history record</div></div></div>
            </div>
            <div className="stats-grid">
              <div className="stat"><div className="num">{kpiToday}</div><div className="muted">Today Appointments</div></div>
              <div className="stat"><div className="num">{kpiConfirmed}</div><div className="muted">Confirmed</div></div>
              <div className="stat"><div className="num">{patients.length}</div><div className="muted">Known Patients</div></div>
              <div className="stat"><div className="num">{bookings.length}</div><div className="muted">Recent Records</div></div>
            </div>
            <div className="panel">
              <h3 style={{marginTop:0}}>Overview Appointments</h3>
              <div className="table-wrap"><table><thead><tr><th>Code</th><th>Patient</th><th>Doctor</th><th>Date/Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{bookings.length ? bookings.map(b=>(
                  <tr key={b.id}><td>{b.patientCode||"-"}</td><td>{b.patientName}</td><td>{b.assignedDoctor||"-"}</td><td>{b.bookingDate} {b.bookingTime}</td><td><span className={badgeClass(b.status)}>{b.status||"Waiting"}</span></td><td><button className="mini-btn" onClick={()=>setStatus(b.id,"Waiting")}>Set Waiting</button></td></tr>
                )):<tr><td colSpan={6} className="muted" style={{textAlign:"center"}}>No records</td></tr>}</tbody>
              </table></div>
            </div>
          </>
        )}

        {tab==="recep-doctors" && (
          <><div className="panel">
            <h3 style={{marginTop:0}}>Add Doctor</h3>
            <div className="grid-2">
              {[["Name","name"],["Age","age","number"],["NIC Number","nic"],["Specialization","specialization"],["Hospital","hospital"],["Date of Birth","dob","date"],["Availability From","from","time"],["Availability To","to","time"],["Mobile","mobile"],["Email","email","email"],["Username","username"],["Password","password","password"]].map(([label,key,type="text"])=>(
                <div key={key} className="field"><label>{label}</label><input type={type} value={docForm[key]} onChange={e=>setDocForm(p=>({...p,[key]:e.target.value}))} /></div>
              ))}
            </div>
            <button className="btn-primary" onClick={addDoctor}>Save Doctor</button>
          </div>
          <div className="panel"><h3 style={{marginTop:0}}>Doctor List</h3>
            <div className="table-wrap"><table><thead><tr><th>Basic Info</th><th>Professional</th><th>Schedule</th><th>Contact</th><th>Credentials</th><th>Action</th></tr></thead>
              <tbody>{doctors.length ? doctors.map(d=>(
                <tr key={d.doctorId}><td><strong>{d.name}</strong><div className="tiny">Age: {d.age} | NIC: {d.nic}</div></td><td><strong>{d.specialization}</strong><div className="tiny">ID: {d.doctorId} | {d.hospital}</div></td><td><div className="tiny">From: {d.availabilityFrom} To: {d.availabilityTo}</div></td><td><div className="tiny">{d.mobile}<br/>{d.email}</div></td><td><div className="tiny">User: {d.username}</div></td><td className="row-actions"><button className="mini-btn danger" onClick={()=>delDoctor(d.doctorId)}>Delete</button></td></tr>
              )):<tr><td colSpan={6} className="muted" style={{textAlign:"center"}}>No doctors yet</td></tr>}</tbody>
            </table></div>
          </div></>
        )}

        {tab==="recep-appointments" && (
          <div className="panel"><h3 style={{marginTop:0}}>All Appointments</h3>
            <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Problem</th><th>Doctor</th><th>Date/Time</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{bookings.length ? bookings.map(b=>(
                <tr key={b.id}><td>{b.patientName}<div className="tiny">{b.patientCode}</div></td><td>{b.reason||b.sickness||"-"}</td><td>{b.assignedDoctor||"-"}</td><td>{b.bookingDate} {b.bookingTime}</td><td><span className={badgeClass(b.status)}>{b.status||"Waiting"}</span></td><td><button className="mini-btn" onClick={()=>setStatus(b.id,"Waiting")}>Set Waiting</button></td></tr>
              )):<tr><td colSpan={6} className="muted" style={{textAlign:"center"}}>No records</td></tr>}</tbody>
            </table></div>
          </div>
        )}

        {tab==="recep-patients" && (
          <div className="panel"><h3 style={{marginTop:0}}>Patient Records</h3>
            <div className="table-wrap"><table><thead><tr><th>Code</th><th>Name</th><th>Manual ID</th><th>Mobile</th><th>Last Booking</th><th>Actions</th></tr></thead>
              <tbody>{patients.length ? patients.map(p=>(
                <tr key={p.patientCode}><td>{p.patientCode}</td><td>{p.name}</td><td>{p.manualPatientId||"-"}</td><td>{p.mobile}</td><td>{p.lastBookingAt?new Date(p.lastBookingAt).toLocaleString():"-"}</td><td className="row-actions"><button className="mini-btn" onClick={()=>openHistory(p.patientCode)}>History</button><button className="mini-btn danger" onClick={()=>delPatient(p.patientCode)}>Delete</button></td></tr>
              )):<tr><td colSpan={6} className="muted" style={{textAlign:"center"}}>No patients yet</td></tr>}</tbody>
            </table></div>
          </div>
        )}

        {tab==="recep-ai" && (
          <div className="panel"><h3 style={{marginTop:0}}>AI Reception Assistant — ARIA</h3>
            <p className="muted">Use this section to capture quick symptom notes before booking.</p>
            <div className="field"><label>AI Notes</label><textarea placeholder="Patient says: fever since 3 days, chest discomfort..."></textarea></div>
            <button className="btn-primary" onClick={()=>showToast("AI note saved in this session","info")}>Store Temporary Note</button>
          </div>
        )}
      </section>

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target.className==="modal-overlay")setShowBookingModal(false)}}>
          <div className="modal">
            <div className="modal-head"><h3 style={{margin:0}}>New Appointment</h3><button className="btn-outline" onClick={()=>setShowBookingModal(false)}>Close</button></div>
            <div className="grid-2">
              {[["Patient Name","name"],["Manual Patient ID","manual"],["Address","address"],["Mobile Number","mobile"],["Gmail","email","email"],["Problem (Sick)","problem"]].map(([l,k,t="text"])=>(
                <div key={k} className="field"><label>{l}</label><input type={t} value={bookForm[k]} onChange={e=>setBookForm(p=>({...p,[k]:e.target.value}))} /></div>
              ))}
              <div className="field"><label>Assigned Date</label><input type="date" value={bookForm.date} onChange={e=>setBookForm(p=>({...p,date:e.target.value}))} /></div>
              <div className="field"><label>Assigned Time</label><input type="time" value={bookForm.time} onChange={e=>setBookForm(p=>({...p,time:e.target.value}))} /></div>
              <div className="field"><label>Assigned Doctor</label><select value={bookForm.doctor} onChange={e=>setBookForm(p=>({...p,doctor:e.target.value}))}><option value="">Select doctor</option>{doctors.map(d=><option key={d.doctorId} value={`${d.name} (${d.doctorId})`}>{d.name} - {d.specialization}</option>)}</select></div>
              <div className="field"><label>Priority</label><select value={bookForm.priority} onChange={e=>setBookForm(p=>({...p,priority:e.target.value}))}><option>Normal</option><option>High</option><option>Urgent</option></select></div>
            </div>
            <button className="btn-primary" onClick={saveBooking}>Save Appointment</button>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && historyData && (
        <div className="modal-overlay" onClick={e=>{if(e.target.className==="modal-overlay")setShowHistoryModal(false)}}>
          <div className="modal">
            <div className="modal-head"><h3 style={{margin:0}}>Patient History - {historyData.patient?.patientCode}</h3><button className="btn-outline" onClick={()=>setShowHistoryModal(false)}>Close</button></div>
            <p><strong>Name:</strong> {historyData.patient?.name}</p>
            <p><strong>Mobile:</strong> {historyData.patient?.mobile}</p>
            {historyData.patient?.imageData && <img src={historyData.patient.imageData} alt="patient" style={{maxWidth:180,borderRadius:10,border:"1px solid #d9e8e2",margin:"8px 0"}} />}
            <div className="table-wrap" style={{marginTop:10}}>
              <table><thead><tr><th>Created</th><th>Reason</th><th>Doctor</th><th>Date/Time</th><th>Status</th></tr></thead>
                <tbody>{historyData.bookings?.length ? historyData.bookings.map((b,i)=>(
                  <tr key={i}><td>{new Date(b.createdAt).toLocaleString()}</td><td>{b.reason||b.sickness}</td><td>{b.assignedDoctor||"-"}</td><td>{b.bookingDate} {b.bookingTime}</td><td><span className={badgeClass(b.status)}>{b.status}</span></td></tr>
                )):<tr><td colSpan={5} className="muted" style={{textAlign:"center"}}>No history</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorDashboard({ currentUser, onLogout, showToast }) {
  const [tab, setTab] = useState("doc-profile");
  const [profile, setProfile] = useState(currentUser || {});
  const [bookings, setBookings] = useState([]);

  const loadPatients = useCallback(async () => {
    const data = await api(`/doctor-bookings?username=${encodeURIComponent(profile.username||currentUser?.username||"")}`);
    setBookings(data.bookings || []);
  }, [profile.username, currentUser?.username]);

  const loadProfile = useCallback(async () => {
    const username = String(currentUser?.username || "").toLowerCase();
    if (!username) return;
    const data = await api("/doctors");
    const match = (data.doctors || []).find(x => String(x.username || "").toLowerCase() === username);
    if (match) setProfile({ ...match, username: match.username });
  }, [currentUser?.username]);

  useEffect(() => { loadProfile().then(loadPatients); const id = setInterval(loadPatients, 5000); return () => clearInterval(id); }, [loadProfile, loadPatients]);

  const setStatus = async (id, status) => {
    try { await api(`/reception-bookings/${id}/status`,{method:"PATCH",body:{status}}); showToast(`Status: ${status}`,"ok"); loadPatients(); }
    catch(e){ showToast(e.message,"error"); }
  };

  const cAccept = bookings.filter(b=>["waiting","confirmed","pending"].includes(String(b.status||"").toLowerCase())).length;
  const cProc = bookings.filter(b=>["in review","review","processing","accept","accepted"].includes(String(b.status||"").toLowerCase())).length;
  const cDone = bookings.filter(b=>String(b.status||"").toLowerCase()==="done").length;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">HA</div> NovaCare AI</div>
        <div className="side-nav">
          <button className={`side-link${tab==="doc-profile"?" active":""}`} onClick={()=>setTab("doc-profile")}>Profile</button>
          <button className={`side-link${tab==="doc-patients"?" active":""}`} onClick={()=>setTab("doc-patients")}>Assigned Patients</button>
        </div>
        <div className="side-profile">
          <div style={{display:"flex",alignItems:"center",gap:10}}><div className="avatar">{(profile.name||"DR").slice(0,2).toUpperCase()}</div><div><div style={{fontWeight:800}}>{profile.name||"Doctor"}</div><div className="tiny" style={{color:"#d7ede4"}}>{profile.specialization||"-"}</div></div></div>
          <button className="btn-outline" style={{marginTop:10,width:"100%",padding:"8px 12px",borderRadius:8,cursor:"pointer"}} onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <section className="main">
        <div className="header-row"><h2>{tab==="doc-profile"?"Doctor Profile":"Assigned Patients"}</h2><div className="muted">{dateFmt.format(new Date())}</div></div>
        {tab==="doc-profile" && (
          <div className="panel"><h3 style={{marginTop:0}}>My Profile</h3>
            <div className="grid-2">
              <div>{[["Name",profile.name],["Username",profile.username],["Doctor ID",profile.doctorId],["NIC",profile.nic],["Age",profile.age]].map(([k,v])=><p key={k}><strong>{k}:</strong> {v||"-"}</p>)}</div>
              <div>{[["Specialization",profile.specialization],["Hospital",profile.hospital],["Availability",`${profile.availabilityFrom||"-"} - ${profile.availabilityTo||"-"}`],["Mobile",profile.mobile],["Email",profile.email]].map(([k,v])=><p key={k}><strong>{k}:</strong> {v||"-"}</p>)}</div>
            </div>
          </div>
        )}
        {tab==="doc-patients" && (
          <>
            <div className="stats-grid">
              <div className="stat"><div className="num">{bookings.length}</div><div className="muted">Assigned</div></div>
              <div className="stat"><div className="num">{cAccept}</div><div className="muted">Waiting</div></div>
              <div className="stat"><div className="num">{cProc}</div><div className="muted">In Review</div></div>
              <div className="stat"><div className="num">{cDone}</div><div className="muted">Done</div></div>
            </div>
            <div className="panel"><h3 style={{marginTop:0}}>Assigned Patients</h3>
              <div className="table-wrap"><table><thead><tr><th>Patient Details</th><th>Visit Details</th><th>Date/Time</th><th>Contact</th><th>Status</th><th>Update</th></tr></thead>
                <tbody>{bookings.length ? bookings.map(b=>(
                  <tr key={b.id}><td>{b.patientName||"-"}<div className="tiny">Code: {b.patientCode||"-"}</div></td><td>{b.reason||b.sickness||"-"}<div className="tiny">{b.assignedDoctor||"-"}</div></td><td>{b.bookingDate} {b.bookingTime}</td><td>{b.mobile}<div className="tiny">{b.email||"-"}</div></td><td><span className={badgeClass(b.status)}>{b.status||"Waiting"}</span></td><td className="row-actions"><button className="mini-btn" onClick={()=>setStatus(b.id,"Waiting")}>Waiting</button><button className="mini-btn warn" onClick={()=>setStatus(b.id,"In Review")}>In Review</button><button className="mini-btn ok" onClick={()=>setStatus(b.id,"Done")}>Done</button></td></tr>
                )):<tr><td colSpan={6} className="muted" style={{textAlign:"center"}}>No assigned patients</td></tr>}</tbody>
              </table></div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────
function LoginModal({ onClose, onLogin }) {
  const [role, setRole] = useState("admin");
  const [creds, setCreds] = useState({ admin:{ username:"admin", password:"admin123" }, receptionist:{ username:"receptionist", password:"recep123" }, doctor:{ username:"", password:"" } });
  const [showPw, setShowPw] = useState(false);

  const current = creds[role];
  const set = (k, v) => setCreds(p => ({ ...p, [role]: { ...p[role], [k]: v } }));

  const submit = () => onLogin(role, current.username, current.password);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target.className === "modal-overlay") onClose(); }}>
      <div className="modal login-modal">
        <div className="login-shell">
          <div className="login-box">
            <h3 className="login-title">Login</h3>
            <p className="login-sub">Secure access to NovaCare AI Hospital Management System dashboards.</p>
            <div className="tabs">
              {["admin","receptionist","doctor"].map(r => <button key={r} className={`tab-btn${role===r?" active":""}`} onClick={()=>setRole(r)}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>)}
            </div>
            <div className="field"><label>Username</label><input value={current.username} onChange={e=>set("username",e.target.value)} /></div>
            <div className="field"><label>Password</label>
              <div className="password-wrap">
                <input type={showPw?"text":"password"} value={current.password} onChange={e=>set("password",e.target.value)} />
                <button className="eye-toggle" onClick={()=>setShowPw(p=>!p)}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <button className="btn-primary" style={{width:"100%"}} onClick={submit}>Login</button>
            <div className="login-extra">
              <div className="login-extra-card">
                <div className="login-extra-title">Platform Highlights</div>
                <div className="login-extra-pills">
                  {["Encrypted Access","Live Queue Sync","Smart Scheduling"].map(p => <span key={p} className="login-extra-pill">{p}</span>)}
                </div>
              </div>
            </div>
          </div>
          <div className="login-side">
            <div className="login-badge">Professional Clinical Access</div>
            <h4>Hospital Management System</h4>
            <p>Manage patient flow, doctor schedules, appointment statuses, and reception operations from one unified platform.</p>
            <ul><li>Role-based secure login</li><li>Real-time appointment updates</li><li>Integrated patient records</li></ul>
            <div className="login-image-grid">
              <div className="login-image-frame">
                <img className="login-main-image" src="https://images.unsplash.com/photo-1581595219315-a187dd40c322?auto=format&fit=crop&w=1200&q=85" alt="Doctor" />
                <div className="login-image-caption">AI Assisted Clinical Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("public"); // public | admin | reception | doctor
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((text, type = "ok") => {
    const id = Date.now();
    setToasts(p => [...p, { id, text, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800);
  }, []);

  // Restore session
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (saved?.role && saved?.user) {
        setCurrentUser(saved.user);
        setView(saved.role === "receptionist" ? "reception" : saved.role);
      }
    } catch {}
  }, []);

  const handleLogin = async (role, username, password) => {
    try {
      const data = await api("/auth/login", { method: "POST", body: { role, username, password } });
      const user = role === "doctor" ? { ...(data.doctor || {}), username } : { username };
      setCurrentUser(user);
      setView(role === "receptionist" ? "reception" : role);
      setShowLogin(false);
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, user })); } catch {}
      showToast(`${role} logged in`, "ok");
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleLogout = () => {
    setCurrentUser(null); setView("public"); setShowLogin(false);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    showToast("Logged out", "info");
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <ToastContainer toasts={toasts} />

      {view === "public" && (
        <>
          <PublicSite onOpenLogin={() => setShowLogin(true)} />
          <button className="nc-chat-bubble" onClick={() => setShowLogin(true)} aria-label="Chat">
            💬 <div className="nc-chat-badge">1</div>
          </button>
        </>
      )}

      {view === "admin" && <AdminDashboard currentUser={currentUser} onLogout={handleLogout} showToast={showToast} />}
      {view === "reception" && <ReceptionDashboard currentUser={currentUser} onLogout={handleLogout} showToast={showToast} />}
      {view === "doctor" && <DoctorDashboard currentUser={currentUser} onLogout={handleLogout} showToast={showToast} />}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
    </>
  );
}