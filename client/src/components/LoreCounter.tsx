import { useState, useCallback, useRef, useEffect } from 'react';

const MAX_LORE = 20;
const GROUP_DELAY_MS = 3000;
const DEFAULT_TIMER = 50 * 60;

// ─── Thèmes ────────────────────────────────────────────────────────────────
interface Theme {
  id: string;
  name: string;
  bg: string;           // background CSS du container
  bgOverlay?: string;   // overlay en plus (radial gradient)
  separator: string;    // couleur de la ligne séparateur
  separatorGlow: string;// gradient complet de la ligne
  pill: string;         // background de la pilule centrale
  pillBorder: string;   // border de la pilule
  meAccent: string;     // couleur accent joueur "moi"
  oppAccent: string;    // couleur accent joueur "adversaire"
  stars?: boolean;      // étoiles décoratives
  particles?: 'bubbles' | 'sparks' | 'none';
  labelFont?: string;   // classe tailwind pour les labels
}

const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Défaut',
    bg: 'radial-gradient(ellipse at 50% 50%, #1a1035 0%, #0c0a14 70%)',
    separator: 'rgba(212,175,55,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 30%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 70%, transparent 100%)',
    pill: '#0f0c1e',
    pillBorder: 'rgba(212,175,55,0.2)',
    meAccent: '#5ba8d8',
    oppAccent: '#d85b5b',
    stars: true,
  },
  // S1 — The First Chapter : Great Illuminary, six encres fondatrices, éclats d'encre colorée
  {
    id: 'set1',
    name: 'The First Chapter',
    bg: 'radial-gradient(ellipse at 50% 30%, #1c1030 0%, #100820 55%, #180810 100%)',
    bgOverlay: 'radial-gradient(ellipse at 70% 80%, rgba(180,20,30,0.12) 0%, transparent 50%)',
    separator: 'rgba(245,178,2,0.65)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(1,137,196,0.3) 20%, rgba(245,178,2,0.7) 50%, rgba(211,8,47,0.3) 80%, transparent 100%)',
    pill: '#110d20',
    pillBorder: 'rgba(245,178,2,0.35)',
    meAccent: '#0189C4',
    oppAccent: '#D3082F',
    stars: true,
  },
  // S2 — Rise of the Floodborn : inondation d'encre chaotique, tourbillons violets/sombres
  {
    id: 'set2',
    name: 'Rise of the Floodborn',
    bg: 'radial-gradient(ellipse at 40% 60%, #1e0a30 0%, #08041a 55%, #040210 100%)',
    bgOverlay: 'radial-gradient(ellipse at 60% 30%, rgba(120,40,200,0.2) 0%, transparent 55%)',
    separator: 'rgba(160,80,220,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,20,160,0.4) 20%, rgba(180,100,240,0.7) 50%, rgba(80,20,160,0.4) 80%, transparent 100%)',
    pill: '#0d0820',
    pillBorder: 'rgba(150,70,210,0.35)',
    meAccent: '#9060e8',
    oppAccent: '#e040b0',
    stars: false,
    particles: 'bubbles',
  },
  // S3 — Into the Inklands : exploration, montagnes, forêts, pierres anciennes
  {
    id: 'set3',
    name: 'Into the Inklands',
    bg: 'linear-gradient(155deg, #0a1a0c 0%, #081520 45%, #0e1808 100%)',
    bgOverlay: 'radial-gradient(ellipse at 30% 70%, rgba(30,90,20,0.25) 0%, transparent 55%)',
    separator: 'rgba(60,180,90,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(30,120,50,0.3) 20%, rgba(80,200,100,0.65) 50%, rgba(30,120,50,0.3) 80%, transparent 100%)',
    pill: '#071410',
    pillBorder: 'rgba(40,140,60,0.35)',
    meAccent: '#38b060',
    oppAccent: '#d4a820',
    stars: false,
  },
  // S4 — Ursula's Return : ténèbres, tentacules, palais opulent, fumée violette/cyan
  {
    id: 'set4',
    name: "Ursula's Return",
    bg: 'radial-gradient(ellipse at 50% 90%, #080318 0%, #030208 65%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 30% 50%, rgba(100,0,160,0.18) 0%, transparent 50%)',
    separator: 'rgba(180,0,220,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,0,160,0.3) 20%, rgba(200,0,240,0.6) 50%, rgba(0,160,200,0.3) 80%, transparent 100%)',
    pill: '#040212',
    pillBorder: 'rgba(160,0,200,0.3)',
    meAccent: '#c000e8',
    oppAccent: '#00c8e8',
    stars: true,
    particles: 'bubbles',
  },
  // S5 — Shimmering Skies : festival, feux d'artifice, ciel nocturne festif
  {
    id: 'set5',
    name: 'Shimmering Skies',
    bg: 'linear-gradient(170deg, #080520 0%, #0a0830 40%, #120530 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 20%, rgba(120,60,220,0.2) 0%, transparent 55%)',
    separator: 'rgba(255,210,60,0.65)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(255,80,160,0.35) 15%, rgba(255,210,60,0.75) 50%, rgba(80,160,255,0.35) 85%, transparent 100%)',
    pill: '#08051e',
    pillBorder: 'rgba(255,190,50,0.35)',
    meAccent: '#70c0ff',
    oppAccent: '#ff5090',
    stars: true,
    particles: 'sparks',
  },
  // S6 — Azurite Sea : haute mer, pirates, bleus profonds, or nautique
  {
    id: 'set6',
    name: 'Azurite Sea',
    bg: 'linear-gradient(185deg, #020c1e 0%, #040f28 45%, #030a18 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 100%, rgba(0,50,120,0.45) 0%, transparent 55%)',
    separator: 'rgba(40,160,220,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(10,80,160,0.35) 20%, rgba(50,180,230,0.7) 50%, rgba(180,140,30,0.25) 80%, transparent 100%)',
    pill: '#030c1e',
    pillBorder: 'rgba(30,130,210,0.4)',
    meAccent: '#28a8e0',
    oppAccent: '#d4a830',
    stars: false,
    particles: 'bubbles',
  },
  // S7 — Archazia's Island : mystère ancien, hibou, symboles dual-encre, jungle tropicale
  {
    id: 'set7',
    name: "Archazia's Island",
    bg: 'linear-gradient(145deg, #0e100a 0%, #121808 45%, #0a0e10 100%)',
    bgOverlay: 'radial-gradient(ellipse at 60% 40%, rgba(180,130,20,0.12) 0%, transparent 50%)',
    separator: 'rgba(200,160,40,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(140,100,20,0.3) 20%, rgba(220,170,50,0.65) 50%, rgba(60,120,40,0.3) 80%, transparent 100%)',
    pill: '#0c0e08',
    pillBorder: 'rgba(170,130,30,0.35)',
    meAccent: '#d4a828',
    oppAccent: '#60a838',
    stars: false,
  },
  // S8 — Reign of Jafar : désert, sablier surréaliste, palais de marbre/or, torches
  {
    id: 'set8',
    name: 'Reign of Jafar',
    bg: 'radial-gradient(ellipse at 50% 20%, #1e0800 0%, #0c0400 55%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 5%, rgba(220,80,0,0.22) 0%, transparent 45%)',
    separator: 'rgba(220,100,10,0.6)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(160,50,0,0.35) 20%, rgba(240,120,10,0.7) 50%, rgba(200,170,30,0.3) 80%, transparent 100%)',
    pill: '#0f0400',
    pillBorder: 'rgba(200,80,0,0.35)',
    meAccent: '#e87010',
    oppAccent: '#d4c030',
    stars: false,
  },
  // S9 — Fabled : Grand Illuminary, storybook classique, Mickey, dorure, nostalgie
  {
    id: 'set9',
    name: 'Fabled',
    bg: 'radial-gradient(ellipse at 50% 40%, #1e1608 0%, #120e04 60%, #0e0a02 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(220,180,60,0.1) 0%, transparent 55%)',
    separator: 'rgba(220,185,80,0.65)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(180,140,40,0.35) 20%, rgba(230,195,80,0.75) 50%, rgba(180,140,40,0.35) 80%, transparent 100%)',
    pill: '#120e04',
    pillBorder: 'rgba(210,170,60,0.4)',
    meAccent: '#e8c050',
    oppAccent: '#e07840',
    stars: true,
  },
  // S10 — Whispers in the Well : film noir, grotte, lumière unique, fantômes, puits mystique
  {
    id: 'set10',
    name: 'Whispers in the Well',
    bg: 'radial-gradient(ellipse at 40% 55%, #0a0614 0%, #040208 65%, #000000 100%)',
    bgOverlay: 'radial-gradient(ellipse at 60% 40%, rgba(60,10,100,0.2) 0%, transparent 45%)',
    separator: 'rgba(150,90,210,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(70,20,130,0.3) 15%, rgba(170,110,230,0.55) 38%, rgba(210,240,255,0.75) 50%, rgba(170,110,230,0.55) 62%, rgba(70,20,130,0.3) 85%, transparent 100%)',
    pill: '#060310',
    pillBorder: 'rgba(130,70,190,0.35)',
    meAccent: '#b070e0',
    oppAccent: '#50c8d8',
    stars: false,
    particles: 'sparks',
  },
  // S11 — Winterspell : hiver, flocons, cristaux de glace, Elsa, magie glacée
  {
    id: 'set11',
    name: 'Winterspell',
    bg: 'linear-gradient(165deg, #04081a 0%, #060c20 50%, #030810 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(140,200,255,0.1) 0%, transparent 55%)',
    separator: 'rgba(160,215,255,0.55)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(100,170,230,0.35) 20%, rgba(190,230,255,0.75) 50%, rgba(100,170,230,0.35) 80%, transparent 100%)',
    pill: '#040810',
    pillBorder: 'rgba(140,205,255,0.3)',
    meAccent: '#90d0f8',
    oppAccent: '#a8e8d8',
    stars: true,
    particles: 'sparks',
  },
  // S12 — Wilds Unknown : jungle nuit, lucioles, vignes, Pixar/Disney en territoire sauvage
  {
    id: 'set12',
    name: 'Wilds Unknown',
    bg: 'linear-gradient(170deg, #020a04 0%, #04120a 30%, #061508 60%, #030e05 100%)',
    bgOverlay: 'radial-gradient(ellipse at 50% 60%, rgba(20,80,10,0.35) 0%, transparent 65%)',
    separator: 'rgba(180,230,80,0.5)',
    separatorGlow: 'linear-gradient(90deg, transparent 0%, rgba(80,160,20,0.3) 20%, rgba(180,230,80,0.65) 50%, rgba(80,160,20,0.3) 80%, transparent 100%)',
    pill: '#030b04',
    pillBorder: 'rgba(120,200,40,0.3)',
    meAccent: '#8de84a',
    oppAccent: '#e8b84a',
    stars: false,
  },
];

// ─── Fonds décoratifs par set ─────────────────────────────────────────────

// S1 — éclats d'encre en cercles colorés épars
function Set1Background() {
  const inks = ['#0189C4','#D3082F','#2A8934','#8B32A0','#C8940A','#708090'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {inks.map((c, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: 60 + (i * 23) % 80, height: 60 + (i * 23) % 80,
          left: `${(i * 57 + 8) % 85 + 5}%`, top: `${(i * 41 + 5) % 80 + 5}%`,
          background: `radial-gradient(circle, ${c}18 0%, transparent 70%)`,
          filter: 'blur(12px)',
        }} />
      ))}
      {/* Éclaboussure centrale */}
      <svg className="absolute" style={{ left: '50%', top: '45%', transform: 'translate(-50%,-50%)', opacity: 0.06 }} width="300" height="300" viewBox="0 0 100 100">
        {[0,60,120,180,240,300].map((angle, i) => (
          <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos(angle * Math.PI / 180)} y2={50 + 45 * Math.sin(angle * Math.PI / 180)} stroke={inks[i]} strokeWidth="2" strokeLinecap="round"/>
        ))}
        <circle cx="50" cy="50" r="8" fill="none" stroke="#f5b202" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

// S2 — tourbillons d'encre, vagues de crue
function Set2Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 70%, rgba(140,20,220,0.15) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(60,0,180,0.15) 0%, transparent 50%)' }} />
      {/* Tourbillons SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.07 }}>
        <path d="M200 400 C240 340, 300 360, 290 420 C280 480, 220 490, 200 440 C180 390, 220 350, 260 370" stroke="#a050e0" strokeWidth="2" fill="none"/>
        <path d="M120 200 C150 150, 200 160, 195 210 C190 260, 145 265, 130 230" stroke="#8040d0" strokeWidth="1.5" fill="none"/>
        <path d="M280 600 C310 550, 360 570, 350 620 C340 670, 290 670, 275 640" stroke="#c060f0" strokeWidth="1.5" fill="none"/>
      </svg>
      {/* Particules encre */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: 2 + (i % 3), height: 2 + (i % 3),
          left: `${(i * 61 + 7) % 90 + 5}%`, top: `${(i * 43 + 13) % 85 + 5}%`,
          background: i % 2 === 0 ? '#a050e0' : '#e040c0',
          opacity: 0.2 + (i % 4) * 0.05,
          boxShadow: `0 0 6px 2px ${i % 2 === 0 ? '#8030c0' : '#c02090'}`,
        }} />
      ))}
    </div>
  );
}

// S3 — pierres runiques, montagnes, encre colorée dans les recoins
function Set3Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Silhouette montagne */}
      <svg className="absolute bottom-0 inset-x-0" width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ opacity: 0.1 }}>
        <path d="M0 120 L60 60 L100 85 L160 30 L220 70 L270 20 L330 65 L380 40 L400 55 L400 120 Z" fill="#2a6a30"/>
      </svg>
      {/* Pierre runique centrale */}
      <svg className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.05 }} width="120" height="160" viewBox="0 0 120 160">
        <rect x="20" y="10" width="80" height="140" rx="8" fill="none" stroke="#38b060" strokeWidth="2"/>
        <text x="60" y="55" textAnchor="middle" fontSize="22" fill="#38b060" fontFamily="serif">᚛</text>
        <text x="60" y="90" textAnchor="middle" fontSize="22" fill="#d4a820" fontFamily="serif">᚜</text>
        <line x1="30" y1="108" x2="90" y2="108" stroke="#38b060" strokeWidth="1"/>
      </svg>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 85%, rgba(30,90,20,0.2) 0%, transparent 50%)' }} />
    </div>
  );
}

// S4 — tentacules, fumée violet/cyan, palais sombre
function Set4Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(80,0,140,0.25) 0%, transparent 55%)' }} />
      {/* Tentacules SVG */}
      <svg className="absolute bottom-0 left-0" width="200" height="300" viewBox="0 0 200 300" fill="none" style={{ opacity: 0.12 }}>
        <path d="M20 300 C30 250, 10 220, 25 180 C40 140, 20 110, 40 70 C55 35, 45 15, 60 0" stroke="#a000d0" strokeWidth="3" strokeLinecap="round"/>
        <path d="M60 300 C55 260, 75 235, 65 200 C55 165, 80 145, 70 110 C60 75, 80 55, 90 30" stroke="#800090" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M40 180 C25 175, 5 165, 0 150" stroke="#a000d0" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M25 180 C15 170, 5 160, -5 148" stroke="#700080" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      <svg className="absolute bottom-0 right-0" width="200" height="300" viewBox="0 0 200 300" fill="none" style={{ opacity: 0.1, transform: 'scaleX(-1)' }}>
        <path d="M20 300 C30 250, 10 220, 25 180 C40 140, 20 110, 40 70 C55 35, 45 15, 60 0" stroke="#00c0e0" strokeWidth="3" strokeLinecap="round"/>
        <path d="M60 300 C55 260, 75 235, 65 200 C55 165, 80 145, 70 110 C60 75, 80 55, 90 30" stroke="#0090b0" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {/* Particules fumée */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: 3, height: 3,
          left: `${(i * 67 + 5) % 88 + 6}%`, top: `${(i * 39 + 10) % 80 + 8}%`,
          background: i % 2 === 0 ? '#c000e8' : '#00c8e8',
          opacity: 0.15 + (i % 4) * 0.06,
          boxShadow: `0 0 8px 2px ${i % 2 === 0 ? '#9000b0' : '#0090b0'}`,
        }} />
      ))}
    </div>
  );
}

// S5 — feux d'artifice, étoiles filantes, ciel de fête
function Set5Background() {
  const colors = ['#70c0ff','#ff5090','#ffe060','#c080ff','#60ffb0'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(100,50,200,0.15) 0%, transparent 55%)' }} />
      {/* Feux d'artifice */}
      {colors.map((c, fi) => {
        const cx = 15 + fi * 18, cy = 10 + (fi % 3) * 15;
        return (
          <svg key={fi} className="absolute" style={{ left: `${cx}%`, top: `${cy}%`, opacity: 0.15 }} width="60" height="60" viewBox="-30 -30 60 60">
            {Array.from({ length: 8 }).map((_, j) => {
              const a = j * 45 * Math.PI / 180;
              return <line key={j} x1="0" y1="0" x2={22 * Math.cos(a)} y2={22 * Math.sin(a)} stroke={c} strokeWidth="1.5" strokeLinecap="round"/>;
            })}
            <circle cx="0" cy="0" r="3" fill={c}/>
          </svg>
        );
      })}
      {/* Étoiles filantes */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
          left: `${(i * 59 + 9) % 90 + 5}%`, top: `${(i * 37 + 7) % 85 + 5}%`,
          background: colors[i % colors.length],
          opacity: 0.3 + (i % 5) * 0.08,
          boxShadow: `0 0 ${4 + (i % 3) * 2}px 1px ${colors[i % colors.length]}`,
        }} />
      ))}
    </div>
  );
}

// S6 — vagues, ancre nautique, reflets sous-marins
function Set6Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,60,130,0.4) 0%, transparent 55%)' }} />
      {/* Vagues */}
      <svg className="absolute bottom-0 inset-x-0" width="100%" height="100" viewBox="0 0 400 100" preserveAspectRatio="none" style={{ opacity: 0.1 }}>
        <path d="M0 60 C40 40, 80 80, 120 55 C160 30, 200 70, 240 50 C280 30, 320 65, 360 45 C385 32, 400 50, 400 60 L400 100 L0 100 Z" fill="#1460a0"/>
        <path d="M0 75 C50 58, 90 85, 140 68 C190 51, 230 78, 280 62 C320 48, 360 72, 400 60 L400 100 L0 100 Z" fill="#0d4880" opacity="0.7"/>
      </svg>
      {/* Ancre SVG centrale filigrane */}
      <svg className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.04 }} width="100" height="130" viewBox="0 0 100 130">
        <circle cx="50" cy="20" r="14" fill="none" stroke="#28a8e0" strokeWidth="3"/>
        <line x1="50" y1="34" x2="50" y2="110" stroke="#28a8e0" strokeWidth="3"/>
        <path d="M50 110 C30 95, 15 85, 15 75" stroke="#28a8e0" strokeWidth="3" fill="none"/>
        <path d="M50 110 C70 95, 85 85, 85 75" stroke="#28a8e0" strokeWidth="3" fill="none"/>
        <line x1="28" y1="50" x2="72" y2="50" stroke="#28a8e0" strokeWidth="2.5"/>
      </svg>
      {/* Bulles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute rounded-full border" style={{
          width: 4 + (i % 4) * 3, height: 4 + (i % 4) * 3,
          left: `${(i * 53 + 8) % 88 + 6}%`, top: `${(i * 41 + 12) % 82 + 8}%`,
          borderColor: 'rgba(40,168,224,0.25)',
          opacity: 0.3 + (i % 3) * 0.08,
        }} />
      ))}
    </div>
  );
}

// S7 — yeux de hibou, glyphes dual-encre, mystère forestier
function Set7Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(160,120,10,0.08) 0%, transparent 60%)' }} />
      {/* Yeux de chouette */}
      <svg className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.06 }} width="160" height="80" viewBox="0 0 160 80">
        <ellipse cx="50" cy="40" rx="28" ry="30" fill="none" stroke="#d4a828" strokeWidth="2"/>
        <circle cx="50" cy="40" r="14" fill="none" stroke="#60a838" strokeWidth="1.5"/>
        <circle cx="50" cy="40" r="5" fill="#d4a828" opacity="0.5"/>
        <ellipse cx="110" cy="40" rx="28" ry="30" fill="none" stroke="#60a838" strokeWidth="2"/>
        <circle cx="110" cy="40" r="14" fill="none" stroke="#d4a828" strokeWidth="1.5"/>
        <circle cx="110" cy="40" r="5" fill="#60a838" opacity="0.5"/>
      </svg>
      {/* Glyphes dans les coins */}
      {['⚯','⚭','⚮','✦'].map((g, i) => (
        <div key={i} className="absolute text-xl" style={{
          left: i % 2 === 0 ? '8%' : '85%', top: i < 2 ? '12%' : '80%',
          color: i % 2 === 0 ? '#d4a828' : '#60a838', opacity: 0.1,
          fontSize: '2rem', transform: `rotate(${i * 45}deg)`,
        }}>{g}</div>
      ))}
    </div>
  );
}

// S8 — sablier, dunes de sable, flammes de torche
function Set8Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(200,70,0,0.18) 0%, transparent 45%)' }} />
      {/* Dunes */}
      <svg className="absolute bottom-0 inset-x-0" width="100%" height="90" viewBox="0 0 400 90" preserveAspectRatio="none" style={{ opacity: 0.1 }}>
        <path d="M0 90 C50 55, 100 75, 160 50 C220 25, 270 65, 330 45 C370 30, 400 50, 400 90 Z" fill="#a06010"/>
      </svg>
      {/* Sablier filigrane */}
      <svg className="absolute" style={{ left: '50%', top: '48%', transform: 'translate(-50%,-50%)', opacity: 0.05 }} width="80" height="130" viewBox="0 0 80 130">
        <path d="M10 5 L70 5 L45 65 L70 125 L10 125 L35 65 Z" fill="none" stroke="#e87010" strokeWidth="2.5" strokeLinejoin="round"/>
        <line x1="10" y1="5" x2="70" y2="5" stroke="#d4c030" strokeWidth="2"/>
        <line x1="10" y1="125" x2="70" y2="125" stroke="#d4c030" strokeWidth="2"/>
        <ellipse cx="40" cy="75" rx="12" ry="6" fill="#e87010" opacity="0.4"/>
      </svg>
      {/* Flammes torche */}
      {[15, 85].map((x, i) => (
        <svg key={i} className="absolute" style={{ left: `${x}%`, top: '30%', opacity: 0.12 }} width="20" height="50" viewBox="0 0 20 50">
          <path d="M10 48 C4 40, 2 30, 6 20 C8 14, 5 8, 10 2 C15 8, 12 14, 14 20 C18 30, 16 40, 10 48Z" fill="#e87010"/>
          <path d="M10 45 C6 38, 5 30, 8 22 C9 17, 8 12, 10 8 C12 12, 11 17, 12 22 C15 30, 14 38, 10 45Z" fill="#d4c030" opacity="0.6"/>
        </svg>
      ))}
    </div>
  );
}

// S9 — cadre de livre d'histoire, ornements classiques, couronne Mickey
function Set9Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(200,160,40,0.08) 0%, transparent 60%)' }} />
      {/* Cadre de livre */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none" style={{ opacity: 0.07 }}>
        <rect x="15" y="15" width="370" height="770" rx="10" fill="none" stroke="#e8c050" strokeWidth="2" strokeDasharray="8 4"/>
        <rect x="25" y="25" width="350" height="750" rx="8" fill="none" stroke="#e8c050" strokeWidth="1"/>
        {/* Ornements coins */}
        {[[25,25],[375,25],[25,775],[375,775]].map(([cx,cy], i) => (
          <g key={i} transform={`translate(${cx},${cy}) rotate(${i*90})`}>
            <path d="M0 0 L15 0 L0 15 Z" fill="#e8c050" opacity="0.5"/>
          </g>
        ))}
      </svg>
      {/* Étoiles nostalgiques */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="absolute" style={{
          left: `${(i * 71 + 5) % 88 + 6}%`, top: `${(i * 53 + 8) % 82 + 8}%`,
          color: '#e8c050', opacity: 0.1, fontSize: '1.2rem',
        }}>★</div>
      ))}
    </div>
  );
}

// S10 — puits mystique, braise, lumière unique dans la grotte
function Set10Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Lumière unique depuis le centre-bas */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 90%, rgba(100,50,180,0.3) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 90%, rgba(200,220,255,0.06) 0%, transparent 35%)' }} />
      {/* Puits */}
      <svg className="absolute" style={{ left: '50%', bottom: '5%', transform: 'translateX(-50%)', opacity: 0.07 }} width="120" height="80" viewBox="0 0 120 80">
        <rect x="10" y="30" width="100" height="50" rx="4" fill="none" stroke="#b070e0" strokeWidth="2"/>
        <ellipse cx="60" cy="30" rx="50" ry="12" fill="none" stroke="#b070e0" strokeWidth="2"/>
        <ellipse cx="60" cy="30" rx="30" ry="7" fill="rgba(100,50,200,0.2)"/>
        <line x1="5" y1="15" x2="5" y2="35" stroke="#b070e0" strokeWidth="2"/>
        <line x1="115" y1="15" x2="115" y2="35" stroke="#b070e0" strokeWidth="2"/>
        <line x1="5" y1="15" x2="115" y2="15" stroke="#b070e0" strokeWidth="2"/>
        <line x1="60" y1="8" x2="60" y2="15" stroke="#b070e0" strokeWidth="2"/>
      </svg>
      {/* Braises/wisps */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: 2, height: 2,
          left: `${(i * 67 + 12) % 82 + 9}%`, top: `${(i * 43 + 15) % 75 + 10}%`,
          background: i % 3 === 0 ? '#b070e0' : i % 3 === 1 ? '#50c8d8' : '#e0e8ff',
          opacity: 0.25 + (i % 4) * 0.08,
          boxShadow: `0 0 6px 2px ${i % 3 === 0 ? '#8040c0' : '#30a0b8'}`,
        }} />
      ))}
    </div>
  );
}

// S11 — flocons de neige, cristaux, givre, vent glacé
function Set11Background() {
  // Flocon SVG simplifié
  const Snowflake = ({ x, y, size, op }: { x: string; y: string; size: number; op: number }) => (
    <svg className="absolute" style={{ left: x, top: y, opacity: op }} width={size} height={size} viewBox="-10 -10 20 20">
      {[0, 30, 60, 90, 120, 150].map((a, i) => {
        const rad = a * Math.PI / 180;
        return (
          <g key={i}>
            <line x1="0" y1="0" x2={9 * Math.cos(rad)} y2={9 * Math.sin(rad)} stroke="#b0d8f8" strokeWidth="1" strokeLinecap="round"/>
            <line x1="0" y1="0" x2={-9 * Math.cos(rad)} y2={-9 * Math.sin(rad)} stroke="#b0d8f8" strokeWidth="1" strokeLinecap="round"/>
          </g>
        );
      })}
      <circle cx="0" cy="0" r="1.5" fill="#c8e8ff"/>
    </svg>
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(140,200,255,0.12) 0%, transparent 55%)' }} />
      <Snowflake x="10%" y="8%" size={36} op={0.15} />
      <Snowflake x="78%" y="5%" size={28} op={0.12} />
      <Snowflake x="5%" y="55%" size={22} op={0.1} />
      <Snowflake x="85%" y="60%" size={30} op={0.13} />
      <Snowflake x="45%" y="20%" size={18} op={0.1} />
      <Snowflake x="60%" y="75%" size={24} op={0.11} />
      {/* Cristaux en bas */}
      <svg className="absolute bottom-0 inset-x-0" width="100%" height="70" viewBox="0 0 400 70" preserveAspectRatio="none" style={{ opacity: 0.1 }}>
        {[20,60,100,150,200,240,290,340,380].map((x, i) => (
          <polygon key={i} points={`${x},70 ${x - 8 - (i%3)*4},${40 - (i%4)*8} ${x + 8 + (i%3)*4},${40 - (i%4)*8}`} fill="#90d0f8"/>
        ))}
      </svg>
      {/* Particules neige */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{
          width: 2, height: 2,
          left: `${(i * 59 + 6) % 90 + 5}%`, top: `${(i * 43 + 10) % 82 + 6}%`,
          opacity: 0.15 + (i % 5) * 0.06,
        }} />
      ))}
    </div>
  );
}

// S12 — vignes jungle, lucioles, canopée nocturne
function Set12Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(10,60,5,0.5) 0%, transparent 60%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 40%, rgba(5,40,2,0.4) 0%, transparent 45%)' }} />
      <svg className="absolute bottom-0 left-0" width="180" height="260" viewBox="0 0 180 260" fill="none" style={{ opacity: 0.18 }}>
        <path d="M10 260 C10 220, 30 200, 20 170 C10 140, 40 130, 35 100 C30 70, 55 60, 50 30" stroke="#4a9a20" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M25 260 C25 230, 50 210, 45 185 C40 160, 65 145, 60 115 C55 85, 75 75, 70 45" stroke="#3a7a18" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M35 100 C35 100, 15 90, 5 75" stroke="#4a9a20" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="5" cy="72" rx="8" ry="5" transform="rotate(-30 5 72)" fill="#3a8a18"/>
        <path d="M50 30 C50 30, 68 22, 75 8" stroke="#4a9a20" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="78" cy="5" rx="9" ry="6" transform="rotate(15 78 5)" fill="#3a8a18"/>
        <path d="M20 170 C20 170, 0 160, -5 145" stroke="#3a7a18" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="-6" cy="142" rx="7" ry="5" transform="rotate(-20 -6 142)" fill="#2a6a10"/>
        <path d="M60 115 C60 115, 80 108, 90 95" stroke="#4a9a20" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="93" cy="92" rx="8" ry="5" transform="rotate(10 93 92)" fill="#3a8a18"/>
      </svg>
      <svg className="absolute top-0 right-0" width="160" height="220" viewBox="0 0 160 220" fill="none" style={{ opacity: 0.15, transform: 'scaleX(-1)' }}>
        <path d="M10 0 C10 35, 30 55, 25 85 C20 115, 45 125, 40 155 C35 185, 60 195, 55 225" stroke="#4a9a20" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M25 0 C25 30, 45 50, 40 78 C35 106, 55 118, 50 148" stroke="#3a7a18" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M25 85 C25 85, 45 78, 55 65" stroke="#4a9a20" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="58" cy="62" rx="8" ry="5" transform="rotate(20 58 62)" fill="#3a8a18"/>
        <path d="M40 155 C40 155, 60 148, 72 135" stroke="#3a7a18" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="75" cy="132" rx="8" ry="5" transform="rotate(15 75 132)" fill="#2a6a10"/>
      </svg>
      <svg className="absolute bottom-0 inset-x-0" width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none" fill="none" style={{ opacity: 0.12 }}>
        <path d="M0 80 C20 55, 40 70, 60 50 C80 30, 100 65, 130 45 C160 25, 180 60, 210 40 C240 20, 260 55, 290 38 C320 22, 345 58, 370 42 C390 30, 400 50, 400 80 Z" fill="#1a4a08"/>
      </svg>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
          left: `${(i * 53 + 11) % 88 + 6}%`, top: `${(i * 37 + 9) % 82 + 8}%`,
          background: i % 4 === 0 ? '#e8d84a' : i % 4 === 1 ? '#8de84a' : i % 4 === 2 ? '#aae860' : '#f0e070',
          opacity: 0.35 + (i % 5) * 0.1,
          boxShadow: `0 0 ${4 + (i % 3) * 3}px 1px ${i % 2 === 0 ? '#c8d040' : '#80c030'}`,
        }} />
      ))}
    </div>
  );
}

// ─── Particules décoratives ────────────────────────────────────────────────
function Particles({ type }: { type: 'bubbles' | 'sparks' }) {
  const items = Array.from({ length: 12 });
  if (type === 'bubbles') return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {items.map((_, i) => (
        <div key={i} className="absolute rounded-full border border-white/10"
          style={{
            width: 4 + (i % 5) * 3, height: 4 + (i % 5) * 3,
            left: `${(i * 47 + 13) % 90 + 5}%`,
            top: `${(i * 31 + 7) % 85 + 5}%`,
            opacity: 0.08 + (i % 4) * 0.04,
          }} />
      ))}
    </div>
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {items.map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: 2, height: 2,
            left: `${(i * 53 + 9) % 95 + 2}%`,
            top: `${(i * 37 + 5) % 90 + 5}%`,
            background: i % 3 === 0 ? '#ffcc00' : i % 3 === 1 ? '#ff80b0' : '#80b0ff',
            opacity: 0.2 + (i % 5) * 0.06,
            boxShadow: `0 0 4px 1px currentColor`,
          }} />
      ))}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface RawLoreEntry {
  player: 'me' | 'opponent';
  delta: number;
  newValue: number;
  timestamp: number;
}

interface GroupedLoreEntry {
  player: 'me' | 'opponent';
  totalDelta: number;
  fromValue: number;
  toValue: number;
  count: number;
  timestamp: number;
}

function groupHistory(raw: RawLoreEntry[]): GroupedLoreEntry[] {
  if (raw.length === 0) return [];
  const groups: GroupedLoreEntry[] = [];
  let current: GroupedLoreEntry & { lastTimestamp: number } = {
    player: raw[0].player, totalDelta: raw[0].delta,
    fromValue: raw[0].newValue - raw[0].delta, toValue: raw[0].newValue,
    count: 1, timestamp: raw[0].timestamp, lastTimestamp: raw[0].timestamp,
  };
  for (let i = 1; i < raw.length; i++) {
    const entry = raw[i];
    if (entry.player === current.player && (entry.delta > 0) === (current.totalDelta > 0) && entry.timestamp - current.lastTimestamp < GROUP_DELAY_MS) {
      current.totalDelta += entry.delta; current.toValue = entry.newValue; current.count++; current.lastTimestamp = entry.timestamp;
    } else {
      const { lastTimestamp: _, ...group } = current; groups.push(group);
      current = { player: entry.player, totalDelta: entry.delta, fromValue: entry.newValue - entry.delta, toValue: entry.newValue, count: 1, timestamp: entry.timestamp, lastTimestamp: entry.timestamp };
    }
  }
  const { lastTimestamp: _, ...lastGroup } = current; groups.push(lastGroup);
  return groups;
}

export interface LoreState {
  myLore: number;
  opponentLore: number;
  history: RawLoreEntry[];
  winner: 'me' | 'opponent' | null;
}

export interface LoreResult {
  myScore: number;
  opponentScore: number;
  winner: 'me' | 'opponent' | null;
  state: LoreState;
}

export interface TimerState {
  seconds: number;
  running: boolean;
}

interface LoreCounterProps {
  onClose: (result: LoreResult) => void;
  onNextGame?: (result: LoreResult) => void;
  initialState?: LoreState;
  timerState?: TimerState;
  onTimerChange?: (state: TimerState) => void;
}

const THEME_STORAGE_KEY = 'glimmerlog_lore_theme';
const TIMER_SIDE_KEY = 'glimmerlog_timer_side';

// ─── Composant principal ───────────────────────────────────────────────────
export function LoreCounter({ onClose, onNextGame, initialState, timerState, onTimerChange }: LoreCounterProps) {
  const [myLore, setMyLore] = useState(initialState?.myLore ?? 0);
  const [opponentLore, setOpponentLore] = useState(initialState?.opponentLore ?? 0);
  const [rawHistory, setRawHistory] = useState<RawLoreEntry[]>(initialState?.history ?? []);
  const [showHistory, setShowHistory] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingTimer, setEditingTimer] = useState(false);
  const [timerInput, setTimerInput] = useState('50:00');
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) ?? 'default');
  const [timerSide, setTimerSide] = useState<'left' | 'right'>(() => (localStorage.getItem(TIMER_SIDE_KEY) as 'left' | 'right') ?? 'right');
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const winnerRef = useRef<'me' | 'opponent' | null>(initialState?.winner ?? null);
  const [obfuscateTarget, setObfuscateTarget] = useState<'me' | 'opponent' | null>(null);
  const [showObfuscatePicker, setShowObfuscatePicker] = useState(false);
  const [showObfuscateCancel, setShowObfuscateCancel] = useState(false);
  const myLoreRef = useRef(initialState?.myLore ?? 0);
  const opponentLoreRef = useRef(initialState?.opponentLore ?? 0);

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  // Timer
  const [localTimerSeconds, setLocalTimerSeconds] = useState(DEFAULT_TIMER);
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const timerSeconds = timerState?.seconds ?? localTimerSeconds;
  const timerRunning = timerState?.running ?? localTimerRunning;

  const setTimerSeconds = (val: number | ((s: number) => number)) => {
    const next = typeof val === 'function' ? val(timerSeconds) : val;
    if (onTimerChange) onTimerChange({ seconds: next, running: timerRunning });
    else setLocalTimerSeconds(next);
  };
  const setTimerRunning = (val: boolean | ((r: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(timerRunning) : val;
    if (onTimerChange) onTimerChange({ seconds: timerSeconds, running: next });
    else setLocalTimerRunning(next);
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSecondsRef = useRef(timerSeconds);
  timerSecondsRef.current = timerSeconds;

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        const newSeconds = timerSecondsRef.current - 1;
        if (newSeconds <= 0) {
          if (onTimerChange) onTimerChange({ seconds: 0, running: false });
          else { setLocalTimerSeconds(0); setLocalTimerRunning(false); }
          clearInterval(timerRef.current!);
        } else {
          if (onTimerChange) onTimerChange({ seconds: newSeconds, running: true });
          else setLocalTimerSeconds(newSeconds);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timerExpired = timerSeconds === 0;
  const timerColor = timerSeconds <= 60 ? '#d85b5b' : timerSeconds <= 5 * 60 ? '#f5c842' : 'rgba(255,255,255,0.5)';

  const changeLore = useCallback((player: 'me' | 'opponent', delta: number) => {
    if (winnerRef.current) return;
    const ref = player === 'me' ? myLoreRef : opponentLoreRef;
    const setter = player === 'me' ? setMyLore : setOpponentLore;
    const prev = ref.current;
    const maxForPlayer = obfuscateTarget === player ? 25 : MAX_LORE;
    const next = Math.max(0, Math.min(maxForPlayer, prev + delta));
    if (next === prev) return;
    ref.current = next; setter(next);
    setRawHistory(h => [...h, { player, delta: next - prev, newValue: next, timestamp: Date.now() }]);
    if (next >= maxForPlayer) { winnerRef.current = player; setWinner(player); }
  }, [obfuscateTarget]);

  const resetAll = () => {
    setMyLore(0); setOpponentLore(0);
    myLoreRef.current = 0; opponentLoreRef.current = 0;
    setRawHistory([]); setWinner(null); winnerRef.current = null;
    setObfuscateTarget(null);
    if (!onTimerChange) setLocalTimerSeconds(DEFAULT_TIMER);
  };

  const undoLast = () => {
    if (rawHistory.length === 0) return;
    const last = rawHistory[rawHistory.length - 1];
    const ref = last.player === 'me' ? myLoreRef : opponentLoreRef;
    const setter = last.player === 'me' ? setMyLore : setOpponentLore;
    ref.current = last.newValue - last.delta; setter(last.newValue - last.delta);
    setRawHistory(h => h.slice(0, -1));
    if (winner) { setWinner(null); winnerRef.current = null; }
  };

  const handleClose = () => onClose({ myScore: myLore, opponentScore: opponentLore, winner, state: { myLore, opponentLore, history: rawHistory, winner } });
  const grouped = groupHistory(rawHistory);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col select-none overflow-hidden" style={{ touchAction: 'manipulation', background: theme.bg }}>
      {/* Overlay secondaire */}
      {theme.bgOverlay && <div className="absolute inset-0 pointer-events-none" style={{ background: theme.bgOverlay }} />}

      {/* Étoiles */}
      {theme.stars && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[...Array(24)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{ width: i % 4 === 0 ? 2 : 1, height: i % 4 === 0 ? 2 : 1, top: `${(i * 37 + 11) % 100}%`, left: `${(i * 53 + 7) % 100}%`, opacity: 0.1 + (i % 5) * 0.06 }} />
          ))}
        </div>
      )}
      {theme.particles && theme.particles !== 'none' && <Particles type={theme.particles} />}
      {theme.id === 'set1' && <Set1Background />}
      {theme.id === 'set2' && <Set2Background />}
      {theme.id === 'set3' && <Set3Background />}
      {theme.id === 'set4' && <Set4Background />}
      {theme.id === 'set5' && <Set5Background />}
      {theme.id === 'set6' && <Set6Background />}
      {theme.id === 'set7' && <Set7Background />}
      {theme.id === 'set8' && <Set8Background />}
      {theme.id === 'set9' && <Set9Background />}
      {theme.id === 'set10' && <Set10Background />}
      {theme.id === 'set11' && <Set11Background />}
      {theme.id === 'set12' && <Set12Background />}

      {/* Winner overlay */}
      {winner && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          style={{ background: `radial-gradient(ellipse at 50% 40%, ${winner === 'me' ? theme.meAccent : theme.oppAccent}22 0%, transparent 60%), ${theme.bg}`, backdropFilter: 'blur(8px)' }}
        >
          {/* Glow ring */}
          <div
            className="absolute rounded-full opacity-20 blur-3xl"
            style={{
              width: '18rem', height: '18rem',
              background: winner === 'me' ? theme.meAccent : theme.oppAccent,
              top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
            }}
          />

          <div className="relative flex flex-col items-center gap-6 px-10 w-full max-w-xs">
            {/* Ligne décorative haut */}
            <div className="w-full h-px" style={{ background: theme.separatorGlow }} />

            {/* Résultat */}
            <div className="flex flex-col items-center gap-1">
              <span
                className="text-xs font-semibold tracking-[0.3em] uppercase"
                style={{ color: winner === 'me' ? theme.meAccent : theme.oppAccent }}
              >
                {winner === 'me' ? 'Partie terminée' : 'Partie terminée'}
              </span>
              <span
                className="font-display text-5xl font-bold tracking-wide mt-1"
                style={{
                  color: winner === 'me' ? theme.meAccent : theme.oppAccent,
                  textShadow: `0 0 32px ${winner === 'me' ? theme.meAccent : theme.oppAccent}88`,
                }}
              >
                {winner === 'me' ? 'Victoire' : 'Défaite'}
              </span>
            </div>

            {/* Score */}
            <div
              className="flex items-center gap-4 rounded-2xl px-6 py-4 w-full justify-center"
              style={{ background: theme.pill, border: `1px solid ${theme.pillBorder}` }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs tracking-widest uppercase" style={{ color: theme.meAccent + '99' }}>Moi</span>
                <span className="text-4xl font-bold font-display tabular-nums" style={{ color: theme.meAccent }}>{myLore}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-2">
                <div className="w-px h-10" style={{ background: theme.pillBorder }} />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs tracking-widest uppercase" style={{ color: theme.oppAccent + '99' }}>Adv.</span>
                <span className="text-4xl font-bold font-display tabular-nums" style={{ color: theme.oppAccent }}>{opponentLore}</span>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-2.5 w-full">
              {onNextGame ? (
                <button
                  onClick={() => onNextGame({ myScore: myLore, opponentScore: opponentLore, winner, state: { myLore, opponentLore, history: rawHistory, winner } })}
                  className="w-full py-3.5 rounded-2xl font-semibold text-base tracking-wide transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${winner === 'me' ? theme.meAccent : theme.oppAccent}, ${winner === 'me' ? theme.meAccent : theme.oppAccent}bb)`,
                    color: '#000',
                    boxShadow: `0 0 20px ${winner === 'me' ? theme.meAccent : theme.oppAccent}44`,
                  }}
                >
                  Partie suivante →
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl font-semibold text-base tracking-wide transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${winner === 'me' ? theme.meAccent : theme.oppAccent}, ${winner === 'me' ? theme.meAccent : theme.oppAccent}bb)`,
                    color: '#000',
                    boxShadow: `0 0 20px ${winner === 'me' ? theme.meAccent : theme.oppAccent}44`,
                  }}
                >
                  Terminer la partie
                </button>
              )}
              <button
                onClick={() => { setWinner(null); winnerRef.current = null; }}
                className="w-full py-3 rounded-2xl text-sm transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.pillBorder}`, color: 'rgba(255,255,255,0.5)' }}
              >
                Modifier le score
              </button>
            </div>

            {/* Ligne décorative bas */}
            <div className="w-full h-px" style={{ background: theme.separatorGlow }} />
          </div>

          {/* Obfuscate — positionné en bas à droite, hors du flux */}
          <button
            onClick={() => setShowObfuscatePicker(true)}
            className="absolute overflow-hidden active:scale-95 transition-all"
            style={{
              bottom: '1.25rem',
              right: '1.25rem',
              height: '4rem',
              background: 'linear-gradient(100deg, #120d2a 0%, #1e1245 50%, #130c28 100%)',
              border: '1px solid rgba(160,100,240,0.4)',
              boxShadow: '0 0 20px rgba(140,80,220,0.2)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0,
            }}
          >
            <img
              src="/donald-obfuscate.png"
              alt=""
              style={{ display: 'block', width: '4rem', height: '4rem', objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ width: '1px', height: '1.75rem', background: 'rgba(160,100,240,0.3)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0 0.875rem', gap: '0.2rem' }}>
              <span style={{ color: 'rgba(215,175,255,0.95)', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Obfuscate !</span>
              <span style={{ color: 'rgba(175,135,220,0.5)', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                {obfuscateTarget ? `${obfuscateTarget === 'me' ? 'Moi' : 'Adversaire'} → 25 lore ✓` : 'Seuil de victoire → 25'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Zones de jeu */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col rotate-180">
          <PlayerSide label="Adversaire" lore={opponentLore} accent={theme.oppAccent} onChangeLore={(d) => changeLore('opponent', d)} disabled={!!winner} obfuscated={obfuscateTarget === 'opponent'} onObfuscateClick={() => setShowObfuscateCancel(true)} />
        </div>

        {/* Séparateur */}
        <div className="relative flex items-center h-20 shrink-0">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px" style={{ background: theme.separatorGlow }} />
        </div>

        {/* Capsule close+menu — côté opposé au timer */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ [timerSide === 'right' ? 'left' : 'right']: 0, width: '5rem' }}
        >
          <div
            className="relative flex flex-col items-center pointer-events-auto"
            style={{
              background: theme.pill,
              border: `1px solid ${theme.pillBorder}`,
              borderRadius: '9999px',
              boxShadow: `0 0 16px ${theme.pillBorder}`,
              padding: '0.5rem 0',
              gap: 0,
            }}
          >
            {/* Fermer */}
            <button
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="p-2.5 rounded-full transition-colors hover:bg-white/10 active:scale-90"
              style={{ color: 'rgba(255,255,255,0.35)', pointerEvents: 'auto' }}
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="h-px w-7 bg-white/10 my-0.5" />
            {/* Burger menu */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
              className="p-2.5 rounded-full transition-colors hover:bg-white/10 active:scale-90"
              style={{ color: 'rgba(255,255,255,0.35)', pointerEvents: 'auto' }}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Timer vertical — côté gauche ou droit */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ [timerSide]: 0, width: '5rem' }}
        >
          {/* Capsule : colonne flex centrée verticalement */}
          <div
            className="relative flex flex-col items-center pointer-events-auto"
            style={{
              background: theme.pill,
              border: `1px solid ${theme.pillBorder}`,
              borderRadius: '9999px',
              boxShadow: `0 0 24px ${timerColor}18`,
              padding: '0.5rem 0',
              gap: 0,
            }}
          >
            {/* Play/Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); !timerExpired && setTimerRunning(r => !r); }}
              className="p-2.5 rounded-full transition-colors active:scale-90 flex items-center justify-center"
              aria-label={timerRunning ? 'Pause' : 'Démarrer'}
              style={{ transform: `rotate(${timerSide === 'left' ? '-90' : '90'}deg)`, pointerEvents: 'auto' }}
            >
              {timerExpired ? (
                <svg className="w-6 h-6" fill="none" stroke="#d85b5b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : timerRunning ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: timerColor }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: timerColor }}><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            {/* Séparateur */}
            <div style={{ width: '1.8rem', height: '1px', background: `${timerColor}30`, margin: '0.25rem 0' }} />

            {/* Timer */}
            <button
              onClick={(e) => { e.stopPropagation(); if (!timerRunning) { setTimerInput(formatTimer(timerSeconds)); setEditingTimer(true); } }}
              className="flex items-center justify-center transition-colors active:opacity-60 py-1"
              aria-label="Modifier la durée"
              style={{ writingMode: 'vertical-rl', letterSpacing: '0.08em', transform: timerSide === 'left' ? 'rotate(180deg)' : 'none', pointerEvents: 'auto' }}
            >
              <span className="font-mono font-bold tabular-nums" style={{ color: timerColor, fontSize: 'clamp(1.6rem, 6.5vw, 2.2rem)', textShadow: timerSeconds <= 60 ? `0 0 20px ${timerColor}` : undefined }}>
                {formatTimer(timerSeconds)}
              </span>
            </button>

            {/* Séparateur */}
            <div style={{ width: '1.8rem', height: '1px', background: `${timerColor}30`, margin: '0.25rem 0' }} />

            {/* Reset — même taille que pause pour symétrie */}
            {!timerRunning && timerSeconds !== DEFAULT_TIMER ? (
              <button
                onClick={(e) => { e.stopPropagation(); setTimerSeconds(DEFAULT_TIMER); }}
                className="p-2.5 rounded-full transition-colors active:scale-90 flex items-center justify-center text-white/30 hover:text-white/70"
                style={{ pointerEvents: 'auto' }}
                aria-label="Réinitialiser le timer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            ) : (
              <div className="p-2.5" style={{ width: '2.75rem', height: '2.75rem' }} />
            )}
          </div>
        </div>

        {/* Popup sélection cible Obfuscate */}
        {showObfuscatePicker && (
          <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setShowObfuscatePicker(false)}>
            <div className="rounded-2xl p-6 flex flex-col items-center gap-5 w-72" style={{ background: '#120d2a', border: '1px solid rgba(160,100,240,0.4)', boxShadow: '0 0 32px rgba(140,80,220,0.25)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.45rem', color: 'rgba(220,170,255,0.8)' }}>◆</span>
                <p className="font-black tracking-widest uppercase text-sm" style={{ color: 'rgba(215,175,255,0.95)' }}>Obfuscate !</p>
                <span style={{ fontSize: '0.45rem', color: 'rgba(220,170,255,0.8)' }}>◆</span>
              </div>
              <p className="text-xs text-center" style={{ color: 'rgba(175,135,220,0.6)', lineHeight: 1.5 }}>
                Qui doit atteindre <strong style={{ color: 'rgba(215,175,255,0.9)' }}>25 lore</strong> pour gagner ?
              </p>
              <div className="flex gap-3 w-full">
                {(['me', 'opponent'] as const).map(target => (
                  <button
                    key={target}
                    onClick={() => { setObfuscateTarget(prev => prev === target ? null : target); setShowObfuscatePicker(false); setWinner(null); winnerRef.current = null; }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      background: obfuscateTarget === target ? 'rgba(160,100,240,0.3)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${obfuscateTarget === target ? 'rgba(160,100,240,0.7)' : 'rgba(160,100,240,0.25)'}`,
                      color: obfuscateTarget === target ? 'rgba(220,180,255,0.95)' : 'rgba(175,135,220,0.6)',
                    }}
                  >
                    {target === 'me' ? 'Moi' : 'Adversaire'}
                  </button>
                ))}
              </div>
              {obfuscateTarget && (
                <button onClick={() => { setObfuscateTarget(null); setShowObfuscatePicker(false); }} className="text-xs" style={{ color: 'rgba(175,135,220,0.4)' }}>
                  Annuler l'effet
                </button>
              )}
            </div>
          </div>
        )}

        {/* Popup confirmation désactivation Obfuscate */}
        {showObfuscateCancel && obfuscateTarget && (
          <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setShowObfuscateCancel(false)}>
            <div className="rounded-2xl p-6 flex flex-col items-center gap-4 w-72" style={{ background: '#120d2a', border: '1px solid rgba(160,100,240,0.4)', boxShadow: '0 0 32px rgba(140,80,220,0.25)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.45rem', color: 'rgba(220,170,255,0.8)' }}>◆</span>
                <p className="font-black tracking-widest uppercase text-sm" style={{ color: 'rgba(215,175,255,0.95)' }}>Obfuscate !</p>
                <span style={{ fontSize: '0.45rem', color: 'rgba(220,170,255,0.8)' }}>◆</span>
              </div>
              <p className="text-xs text-center" style={{ color: 'rgba(175,135,220,0.65)', lineHeight: 1.6 }}>
                Désactiver l'effet ?<br />
                <span style={{ color: 'rgba(215,175,255,0.5)' }}>
                  {obfuscateTarget === 'me' ? 'Moi' : 'L\'adversaire'} reviendra à un seuil de victoire de <strong style={{ color: 'rgba(215,175,255,0.8)' }}>20 lore</strong>.
                  {((obfuscateTarget === 'me' ? myLore : opponentLore) > MAX_LORE)
                    ? ' La partie se terminera immédiatement.' : ''}
                </span>
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowObfuscateCancel(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(160,100,240,0.2)', color: 'rgba(175,135,220,0.5)' }}>
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const currentLore = obfuscateTarget === 'me' ? myLoreRef.current : opponentLoreRef.current;
                    setObfuscateTarget(null);
                    setShowObfuscateCancel(false);
                    if (currentLore >= MAX_LORE) {
                      winnerRef.current = obfuscateTarget;
                      setWinner(obfuscateTarget);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, rgba(160,100,240,0.6), rgba(120,70,200,0.6))', color: 'rgba(220,185,255,0.95)', border: '1px solid rgba(160,100,240,0.5)' }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup édition timer */}
        {editingTimer && (
          <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setEditingTimer(false)}>
            <div className="rounded-2xl p-6 flex flex-col items-center gap-4 w-64" style={{ background: theme.pill, border: `1px solid ${theme.pillBorder}` }} onClick={e => e.stopPropagation()}>
              <p className="text-sm font-medium text-white/60 tracking-widest uppercase">Durée du timer</p>
              <input
                autoFocus
                type="text"
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parts = timerInput.split(':');
                    const mins = parseInt(parts[0] ?? '0', 10);
                    const secs = parseInt(parts[1] ?? '0', 10);
                    const total = (isNaN(mins) ? 0 : mins) * 60 + (isNaN(secs) ? 0 : secs);
                    if (total > 0) setTimerSeconds(total);
                    setEditingTimer(false);
                  }
                  if (e.key === 'Escape') setEditingTimer(false);
                }}
                className="font-mono font-bold tabular-nums text-center text-3xl bg-transparent outline-none w-full"
                style={{ color: timerColor, borderBottom: `2px solid ${timerColor}55`, letterSpacing: '0.1em', paddingBottom: '0.25rem' }}
                placeholder="mm:ss"
              />
              <p className="text-xs text-white/30">Format mm:ss · ex: 50:00</p>
              <div className="flex gap-2 w-full">
                {[{ label: '70 min', secs: 70 * 60 }, { label: '55 min', secs: 55 * 60 }, { label: '50 min', secs: 50 * 60 }].map(({ label, secs }) => (
                  <button
                    key={label}
                    onClick={() => { setTimerSeconds(secs); setEditingTimer(false); }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.07)', color: timerColor, border: `1px solid ${timerColor}44` }}
                  >{label}</button>
                ))}
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setEditingTimer(false)} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 bg-white/5">Annuler</button>
                <button
                  onClick={() => {
                    const parts = timerInput.split(':');
                    const mins = parseInt(parts[0] ?? '0', 10);
                    const secs = parseInt(parts[1] ?? '0', 10);
                    const total = (isNaN(mins) ? 0 : mins) * 60 + (isNaN(secs) ? 0 : secs);
                    if (total > 0) setTimerSeconds(total);
                    setEditingTimer(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: timerColor, color: '#000' }}
                >Valider</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <PlayerSide label="Moi" lore={myLore} accent={theme.meAccent} onChangeLore={(d) => changeLore('me', d)} disabled={!!winner} obfuscated={obfuscateTarget === 'me'} onObfuscateClick={() => setShowObfuscateCancel(true)} />
        </div>
      </div>

      {/* Burger menu panel */}
      {showMenu && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={() => setShowMenu(false)} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-t-2xl overflow-hidden" style={{ background: theme.pill, border: `1px solid ${theme.pillBorder}`, borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1" />
            <div className="px-4 py-3 space-y-1">
              {/* Thème */}
              <button onClick={() => { setShowMenu(false); setShowThemes(true); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Thème</p>
                  <p className="text-xs text-white/30">{THEMES.find(t => t.id === themeId)?.name}</p>
                </div>
                <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Historique */}
              <button onClick={() => { setShowMenu(false); setShowHistory(true); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Historique</p>
                  <p className="text-xs text-white/30">{rawHistory.length} action{rawHistory.length !== 1 ? 's' : ''}</p>
                </div>
                <svg className="w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Annuler dernière action */}
              <button onClick={() => { undoLast(); setShowMenu(false); }} disabled={rawHistory.length === 0} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" /></svg>
                <p className="text-sm font-medium text-white/80">Annuler la dernière action</p>
              </button>
              {/* Réinitialiser le score */}
              <button onClick={() => { resetAll(); setShowMenu(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <p className="text-sm font-medium text-white/80">Réinitialiser le score</p>
              </button>
              {/* Côté du timer */}
              <button
                onClick={() => {
                  const next = timerSide === 'right' ? 'left' : 'right';
                  setTimerSide(next);
                  localStorage.setItem(TIMER_SIDE_KEY, next);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all hover:bg-white/8 text-left"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: timerSide === 'right' ? 'scaleX(-1)' : 'none' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" /></svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Timer — côté {timerSide === 'right' ? 'droit' : 'gauche'}</p>
                  <p className="text-xs text-white/30">Basculer à {timerSide === 'right' ? 'gauche' : 'droite'}</p>
                </div>
              </button>
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Panneau thèmes */}
      {showThemes && (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-display font-bold text-white tracking-wide">Thème</h2>
            <button onClick={() => setShowThemes(false)} className="p-2 text-white/40 hover:text-white/70 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeId(t.id);
                    localStorage.setItem(THEME_STORAGE_KEY, t.id);
                    setShowThemes(false);
                  }}
                  className="relative rounded-2xl overflow-hidden transition-all active:scale-95 text-left"
                  style={{
                    height: '7rem',
                    boxShadow: themeId === t.id
                      ? `0 0 0 2px ${t.meAccent}, 0 0 20px ${t.meAccent}40`
                      : '0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Fond dégradé du thème */}
                  <div className="absolute inset-0" style={{ background: t.bg }} />
                  {t.bgOverlay && <div className="absolute inset-0" style={{ background: t.bgOverlay }} />}

                  {/* Losange filigrane centré */}
                  <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.83 32" style={{ width: 48, height: 60, opacity: 0.08 }}>
                      <path d="M12.91 0 0 16l12.91 16 12.91-16L12.91 0ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41 1.28 16Z" fill="white" />
                      <path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25L21.99 16z" fill="white" />
                    </svg>
                  </div>

                  {/* Dégradé accent me → transparent depuis la gauche */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(105deg, ${t.meAccent}22 0%, transparent 55%)`,
                  }} />
                  {/* Dégradé accent opp → transparent depuis le bas-droit */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(285deg, ${t.oppAccent}18 0%, transparent 50%)`,
                  }} />

                  {/* Trait lumineux en haut */}
                  <div className="absolute top-0 inset-x-4 h-px" style={{
                    background: `linear-gradient(90deg, transparent, ${t.meAccent}60, ${t.oppAccent}60, transparent)`,
                  }} />

                  {/* Contenu */}
                  <div className="absolute inset-0 flex flex-col justify-between p-3.5">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-white/40 leading-none">
                      {t.id === 'default' ? '★' : t.id.replace('set', 'S')}
                    </p>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                        {t.name}
                      </p>
                      {/* Deux points couleur accent */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: t.meAccent, boxShadow: `0 0 6px ${t.meAccent}` }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: t.oppAccent, boxShadow: `0 0 6px ${t.oppAccent}` }} />
                        {themeId === t.id && (
                          <span className="text-[10px] font-medium ml-auto" style={{ color: t.meAccent }}>Actif</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Panneau historique */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-display font-bold text-white tracking-wide">Historique</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 text-white/40 hover:text-white/70 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {grouped.length === 0 ? (
              <p className="text-center text-white/30 py-8">Aucun changement</p>
            ) : (
              <div className="space-y-1.5">
                {[...grouped].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/30 font-mono w-14 shrink-0">{new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${entry.player === 'me' ? theme.meAccent : theme.oppAccent}20`, color: entry.player === 'me' ? theme.meAccent : theme.oppAccent }}>
                        {entry.player === 'me' ? 'Moi' : 'Adv.'}
                      </span>
                      <span className="text-sm font-bold" style={{ color: entry.totalDelta > 0 ? '#4ade80' : '#f87171' }}>
                        {entry.totalDelta > 0 ? '+' : ''}{entry.totalDelta}
                      </span>
                    </div>
                    <span className="text-sm text-white/40 font-medium">{entry.fromValue} → {entry.toValue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PlayerSide ────────────────────────────────────────────────────────────
function PlayerSide({ label, lore, accent, onChangeLore, disabled, obfuscated, onObfuscateClick }: {
  label: string; lore: number; accent: string; onChangeLore: (delta: number) => void; disabled: boolean;
  obfuscated?: boolean; onObfuscateClick?: () => void;
}) {
  const maxLore = obfuscated ? 25 : MAX_LORE;
  const accentDim = `${accent}18`;
  const accentBorder = `${accent}30`;
  const glow = `0 0 40px ${accent}40`;

  return (
    <div className="flex-1 flex flex-col" style={{ background: `radial-gradient(ellipse at 50% 50%, ${accent}12 0%, transparent 70%)` }}>

      {/* Zone principale : label + score centré verticalement + losanges */}
      <div className="flex-1 flex relative">
        {/* Bouton − sur toute la hauteur, côté gauche */}
        <button className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-start pl-8 transition-all duration-150 active:opacity-50 disabled:opacity-20 z-10" onClick={() => onChangeLore(-1)} disabled={disabled || lore === 0} aria-label="-1">
          <span className="font-thin leading-none" style={{ fontSize: 'clamp(4rem, 18vw, 7rem)', color: `${accent}50` }}>−</span>
        </button>
        {/* Bouton + sur toute la hauteur, côté droit */}
        <button className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-end pr-8 transition-all duration-150 active:opacity-50 disabled:opacity-20 z-10" onClick={() => onChangeLore(1)} disabled={disabled || lore >= maxLore} aria-label="+1">
          <span className="font-thin leading-none" style={{ fontSize: 'clamp(4rem, 18vw, 7rem)', color: `${accent}50` }}>+</span>
        </button>

        {/* Contenu centré : label + chiffre + losanges */}
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-none gap-2 py-3">
          <span className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: `${accent}99` }}>{label}</span>
          <span className="font-display font-bold leading-none tabular-nums" style={{ fontSize: 'clamp(5rem, 22vw, 11rem)', color: accent, textShadow: glow }}>
            {lore}
          </span>
          {/* Badge Obfuscate */}
          {obfuscated && (
            <button
              onClick={(e) => { e.stopPropagation(); onObfuscateClick?.(); }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-all active:scale-95 z-10 pointer-events-auto"
              style={{ background: 'rgba(120,60,200,0.25)', border: '1px solid rgba(160,100,240,0.5)', color: 'rgba(215,175,255,0.9)' }}
            >
              <span style={{ fontSize: '0.4rem' }}>◆</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Obfuscate — victoire à 25</span>
              <span style={{ fontSize: '0.4rem' }}>◆</span>
            </button>
          )}

          {/* Losanges Lorcana */}
          <div className="flex gap-0.5 items-center flex-wrap justify-center max-w-[260px]">
            {Array.from({ length: maxLore }).map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.83 32" className="transition-all duration-200" style={{ width: 10, height: 13 }}>
                {i < lore ? (
                  <><path d="M12.91 0 0 16l12.91 16 12.91-16L12.91 0ZM1.28 16 12.91 1.59 24.54 16 12.91 30.41 1.28 16Z" fill={accent} /><path d="m21.99 16-9.08 11.25L3.83 16l9.08-11.25L21.99 16z" fill={accent} /></>
                ) : (
                  <path d="m12.91 0 12.91 16-12.91 16L0 16 12.91 0Z" fill={i < MAX_LORE ? `${accent}25` : `${accent}12`} />
                )}
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Boutons ±5 en bas */}
      <div className="flex justify-between px-5 pb-3 gap-3">
        <button onClick={() => onChangeLore(-5)} disabled={disabled || lore === 0} className="flex-1 h-12 rounded-xl text-base font-semibold transition-all duration-150 active:scale-95 disabled:opacity-25" style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}>−5</button>
        <button onClick={() => onChangeLore(5)} disabled={disabled || lore >= maxLore} className="flex-1 h-12 rounded-xl text-base font-semibold transition-all duration-150 active:scale-95 disabled:opacity-25" style={{ background: accentDim, color: accent, border: `1px solid ${accentBorder}` }}>+5</button>
      </div>
    </div>
  );
}
