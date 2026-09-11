import React from 'react';

export const AbonnementLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-abonnement-logo-svg"
  >
    <defs>
      {/* 3D Soft Drop Shadow */}
      <filter id="shadow-ab" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="3" dy="8" stdDeviation="5" floodOpacity="0.25" floodColor="#0f172a" />
      </filter>
      <filter id="shadow-inner" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.18" floodColor="#022c22" />
      </filter>
      
      {/* Gradients */}
      <linearGradient id="metal-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#cbd5e1" />
        <stop offset="70%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="cal-teal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="cal-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bbf7d0" />
        <stop offset="40%" stopColor="#86efac" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
      <radialGradient id="button-white" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="80%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </radialGradient>
      <linearGradient id="green-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>
    
    {/* Calendar Body with 3D shadow */}
    <g filter="url(#shadow-ab)">
      {/* Thickness underneath for 3D layout */}
      <rect x="35" y="47" width="90" height="92" rx="14" fill="#14532d" />
      
      {/* Flat front body */}
      <rect x="35" y="44" width="90" height="92" rx="14" fill="url(#cal-body)" />
      
      {/* Top Banner teal-cyan bar */}
      <rect x="35" y="44" width="90" height="24" rx="8" fill="url(#cal-teal)" />
      {/* Cover lower roundings of banner with block */}
      <rect x="35" y="60" width="90" height="8" fill="url(#cal-teal)" />
      
      {/* Silver Shiny Metal rings */}
      {/* Hook 1 */}
      <path d="M 50 22 C 50 11, 62 11, 62 22 L 62 48 L 50 48 Z" fill="url(#metal-ring)" />
      {/* Hook 2 */}
      <path d="M 75 22 C 75 11, 87 11, 87 22 L 87 48 L 75 48 Z" fill="url(#metal-ring)" />
      {/* Hook 3 */}
      <path d="M 100 22 C 100 11, 112 11, 112 22 L 112 48 L 100 48 Z" fill="url(#metal-ring)" />

      {/* Center White Circular Button */}
      <circle cx="80" cy="94" r="28" fill="url(#button-white)" />
      <circle cx="80" cy="94" r="24" fill="none" stroke="url(#green-ring)" strokeWidth="4.5" />
      
      {/* Silver/Greenish 3D Dollar Symbol */}
      <text 
        x="80" 
        y="105" 
        fill="#15803d" 
        fontSize="30" 
        fontWeight="900" 
        textAnchor="middle" 
        fontFamily="sans-serif"
        filter="url(#shadow-inner)"
      >
        $
      </text>
    </g>
  </svg>
);

export const PatientLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-patient-logo-svg"
  >
    <defs>
      {/* Ombre portée 3D */}
      <filter id="shadow-patient-wheelchair" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="3" dy="6" stdDeviation="4" floodOpacity="0.2" floodColor="#0f172a" />
      </filter>
      
      {/* Gradients de couleur */}
      <linearGradient id="blue-grad-pat" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="white-coat-pat" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <radialGradient id="skin-grad-pat" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="70%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#f97316" />
      </radialGradient>
      <linearGradient id="hair-doc-pat" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="hair-pat-pat" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#854d0e" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="metal-gray-pat" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="wheel-tire-pat" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>
    
    <g filter="url(#shadow-patient-wheelchair)">
      {/* ==========================================
          1. LE FAUTEUIL ROULANT (STRUCTURE & ROUES)
         ========================================== */}
      
      {/* Petite roue avant */}
      <circle cx="34" cy="132" r="10" stroke="url(#wheel-tire-pat)" strokeWidth="3.5" fill="none" />
      <circle cx="34" cy="132" r="5" fill="url(#metal-gray-pat)" />
      
      {/* Grande roue arrière */}
      <circle cx="86" cy="112" r="28" stroke="url(#wheel-tire-pat)" strokeWidth="5.5" fill="none" />
      <circle cx="86" cy="112" r="21" stroke="url(#metal-gray-pat)" strokeWidth="2" fill="none" opacity="0.6" />
      {/* Rayons de la grande roue */}
      <line x1="86" y1="84" x2="86" y2="140" stroke="url(#metal-gray-pat)" strokeWidth="1.5" opacity="0.5" />
      <line x1="58" y1="112" x2="114" y2="112" stroke="url(#metal-gray-pat)" strokeWidth="1.5" opacity="0.5" />
      <line x1="66" y1="92" x2="106" y2="132" stroke="url(#metal-gray-pat)" strokeWidth="1.5" opacity="0.5" />
      <line x1="66" y1="132" x2="106" y2="92" stroke="url(#metal-gray-pat)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="86" cy="112" r="9" fill="url(#blue-grad-pat)" stroke="#0f172a" strokeWidth="1" />

      {/* Cadre métallique du fauteuil */}
      {/* Barre de liaison basse */}
      <path d="M 86 112 L 34 132" stroke="url(#metal-gray-pat)" strokeWidth="4.5" strokeLinecap="round" />
      {/* Support repose-pieds */}
      <path d="M 34 132 L 22 120 L 22 114" stroke="url(#metal-gray-pat)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Structure de support principale */}
      <path d="M 34 112 L 56 112 L 56 68 L 84 68" stroke="url(#metal-gray-pat)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Siège et dossier (Bleu vif du fauteuil) */}
      {/* Dossier rembourré */}
      <path d="M 80 110 L 80 62" stroke="url(#blue-grad-pat)" strokeWidth="8" strokeLinecap="round" />
      {/* Assise rembourrée */}
      <path d="M 44 94 L 84 94" stroke="url(#blue-grad-pat)" strokeWidth="8" strokeLinecap="round" />
      
      {/* Accoudoir métallique */}
      <path d="M 48 82 L 78 82" stroke="url(#metal-gray-pat)" strokeWidth="4" strokeLinecap="round" />

      {/* ==========================================
          2. LE PATIENT (ASSIS, T-SHIRT BLEU)
         ========================================== */}
      
      {/* Jambes du patient (pantalon noir) */}
      <path d="M 76 94 L 38 94 L 34 118" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Chaussures bleues du patient */}
      <path d="M 34 118 L 22 120" stroke="url(#blue-grad-pat)" strokeWidth="6" strokeLinecap="round" />

      {/* Corps/Buste du patient (T-shirt bleu) */}
      <path d="M 74 92 C 74 80, 72 64, 64 64 C 56 64, 52 80, 52 92 Z" fill="url(#blue-grad-pat)" />

      {/* Bras et main sur l'accoudoir */}
      <path d="M 64 64 L 54 78 L 72 78" stroke="url(#skin-grad-pat)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Manche de t-shirt */}
      <path d="M 64 64 L 58 72" stroke="url(#blue-grad-pat)" strokeWidth="6.5" strokeLinecap="round" />

      {/* Tête du patient */}
      <rect x="58" y="46" width="8" height="10" fill="url(#skin-grad-pat)" />
      <circle cx="62" cy="38" r="10" fill="url(#skin-grad-pat)" />
      {/* Cheveux marron du patient */}
      <path d="M 52 38 C 52 28, 72 28, 72 38 C 72 32, 67 30, 62 30 C 57 30, 52 32, 52 38 Z" fill="url(#hair-pat-pat)" />

      {/* ==========================================
          3. LE MEDECIN / SOIGNANT (DEBOUT, POUSSANT)
         ========================================== */}
      
      {/* Jambes du médecin (pantalon sombre) */}
      <path d="M 104 126 L 102 152 M 116 126 L 118 152" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
      {/* Baskets bleues du médecin */}
      <path d="M 102 152 L 92 154 M 118 152 L 128 154" stroke="url(#blue-grad-pat)" strokeWidth="5.5" strokeLinecap="round" />

      {/* Blouse blanche du médecin */}
      <path d="M 102 58 C 102 58, 122 58, 122 68 L 118 126 L 98 126 Z" fill="url(#white-coat-pat)" stroke="#cbd5e1" strokeWidth="1" />
      {/* Ceinture / pliure de la blouse */}
      <line x1="99" y1="92" x2="119" y2="92" stroke="#94a3b8" strokeWidth="1.5" />

      {/* Col bleu du sous-vêtement */}
      <path d="M 106 48 L 114 48 L 110 54 Z" fill="url(#blue-grad-pat)" />
      
      {/* Stéthoscope bleu accroché */}
      <path d="M 104 46 C 104 54, 116 54, 116 46" stroke="#2563eb" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Bras du médecin poussant le fauteuil */}
      {/* Poignées du fauteuil */}
      <path d="M 80 62 L 88 62" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
      {/* Bras en mouvement */}
      <path d="M 110 58 L 94 62 L 84 62" stroke="url(#white-coat-pat)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Tête du médecin */}
      <rect x="106" y="32" width="8" height="10" fill="url(#skin-grad-pat)" />
      <circle cx="110" cy="24" r="10" fill="url(#skin-grad-pat)" />
      {/* Cheveux noirs du médecin */}
      <path d="M 100 24 C 100 14, 120 14, 120 24 C 120 19, 115 17, 110 17 C 105 17, 100 19, 100 24 Z" fill="url(#hair-doc-pat)" />
    </g>
  </svg>
);

export const FileDAttenteLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-queue-logo-svg"
  >
    <defs>
      {/* Sphere depth ambient drop shadow */}
      <filter id="shadow-sphere" x="-15%" y="-15%" width="130%" height="135%">
        <feDropShadow dx="3" dy="9" stdDeviation="6" floodOpacity="0.2" floodColor="#0f172a" />
      </filter>
      
      {/* White sphere 3D spotlight radial gradient */}
      <radialGradient id="sphere-grad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#f8fafc" />
        <stop offset="80%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </radialGradient>

      {/* Curved Loading arc color gradients */}
      <linearGradient id="track-right" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="track-left" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>

    {/* Header label styled precisely as "loading" in crisp visual typography */}
    <text 
      x="80" 
      y="24" 
      fill="#475569" 
      fontSize="13" 
      fontWeight="900" 
      letterSpacing="1"
      textAnchor="middle" 
      fontFamily="sans-serif"
    >
      loading
    </text>

    {/* White 3D shiny circular ball button container */}
    <circle cx="80" cy="90" r="48" fill="url(#sphere-grad)" filter="url(#shadow-sphere)" />

    {/* Inner background hollow groove track */}
    <circle cx="80" cy="90" r="28" fill="none" stroke="#f1f5f9" strokeWidth="12" />
    
    {/* Thick black-to-gray loading status circle arc */}
    {/* Segment 1: Dark start leading track */}
    <path 
      d="M 80 62 A 28 28 0 0 1 108 90" 
      fill="none" 
      stroke="url(#track-right)" 
      strokeWidth="11" 
      strokeLinecap="round" 
    />
    
    {/* Segment 2: Light fading trail track */}
    <path 
      d="M 108 90 A 28 28 0 1 1 80 62" 
      fill="none" 
      stroke="url(#track-left)" 
      strokeWidth="11" 
      strokeLinecap="round" 
    />
  </svg>
);

export const MedecinMprLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-medecin-logo-svg"
  >
    <defs>
      <filter id="shadow-doc" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="6" stdDeviation="4.5" floodOpacity="0.22" floodColor="#0f172a" />
      </filter>
      <filter id="shadow-phone" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
      </filter>
      
      {/* Gradients */}
      <radialGradient id="sk-grad" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#ffeedb" />
        <stop offset="65%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
      <radialGradient id="hair-doc" cx="40%" cy="25%" r="65%">
        <stop offset="0%" stopColor="#854d0e" />
        <stop offset="60%" stopColor="#451a03" />
        <stop offset="100%" stopColor="#1a0b02" />
      </radialGradient>
      <linearGradient id="coat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="85%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id="inner-shirt" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="metal-steth" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Doctor body group */}
    <g filter="url(#shadow-doc)">
      {/* White Coat and Shoulders */}
      <path d="M 28 116 C 28 94, 46 82, 80 82 C 114 82, 132 94, 132 116 L 132 148 L 28 148 Z" fill="url(#coat-grad)" />
      
      {/* Inner Blue shirt collar */}
      <path d="M 64 82 L 96 82 L 80 102 Z" fill="url(#inner-shirt)" />
      
      {/* Coat broad collar fold lapels overlay */}
      <path d="M 50 82 L 68 114 L 80 114 L 62 82 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <path d="M 110 82 L 92 114 L 80 114 L 98 82 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

      {/* Neck */}
      <rect x="68" y="70" width="24" height="15" rx="2" fill="url(#sk-grad)" />
      <path d="M 68 78 C 68 78, 80 82, 92 78 L 92 82 L 68 82 Z" fill="#ea580c" opacity="0.2" />

      {/* Ears */}
      <circle cx="50" cy="54" r="8" fill="url(#sk-grad)" />
      <circle cx="110" cy="54" r="8" fill="url(#sk-grad)" />

      {/* Oval face */}
      <rect x="54" y="32" width="52" height="48" rx="22" fill="url(#sk-grad)" />

      {/* Brown mustache */}
      <path d="M 66 65 C 72 61, 88 61, 94 65 C 96 68, 88 69, 80 69 C 72 69, 64 68, 66 65 Z" fill="#451a03" />

      {/* Dark stylish wavy hair */}
      <path d="M 54 38 C 54 13, 106 13, 106 38 C 106 38, 98 26, 80 26 C 62 26, 54 38, 54 38 Z" fill="url(#hair-doc)" />

      {/* Black medical spectacles/glasses */}
      {/* Left frame */}
      <circle cx="68" cy="48" r="9" fill="none" stroke="#1e293b" strokeWidth="3" />
      {/* Right frame */}
      <circle cx="92" cy="48" r="9" fill="none" stroke="#1e293b" strokeWidth="3" />
      {/* Bridge bridge connecting them */}
      <path d="M 77 48 L 83 48" stroke="#1e293b" strokeWidth="3.5" />
      {/* Temples sides */}
      <path d="M 59 48 L 54 48" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M 101 48 L 106 48" stroke="#1e293b" strokeWidth="2.5" />

      {/* Stethoscope around the neck */}
      {/* Cable loop */}
      <path d="M 64 85 C 64 122, 96 122, 96 85" stroke="url(#metal-steth)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Earpieces going up */}
      <path d="M 64 85 L 61 74" stroke="url(#metal-steth)" strokeWidth="3.5" />
      <path d="M 96 85 L 99 74" stroke="url(#metal-steth)" strokeWidth="3.5" />
      {/* Metal chestpiece medal hanging in center */}
      <circle cx="80" cy="116" r="9.5" fill="url(#metal-steth)" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="80" cy="116" r="5" fill="#e2e8f0" />
    </g>

    {/* Raised hand holding Smartphone on bottom-left */}
    <g filter="url(#shadow-phone)">
      {/* Arm sleeve raised */}
      <path d="M 16 115 L 34 100 L 46 125 L 30 142 Z" fill="url(#coat-grad)" />
      
      {/* Hand skin */}
      <circle cx="34" cy="100" r="9" fill="url(#sk-grad)" />

      {/* Phone chassis */}
      <rect x="18" y="74" width="22" height="38" rx="4" transform="rotate(-15 29 93)" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
      {/* Screen area */}
      <rect x="21" y="77" width="16" height="32" rx="2.5" transform="rotate(-15 29 93)" fill="#000000" />
      {/* Glowing screen reflection sheen */}
      <path d="M 21 82 L 34 94 L 31 104" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" fill="none" />
    </g>
  </svg>
);

export const ReeducationFonctionnelleLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-reeducation-logo-svg"
  >
    <defs>
      <filter id="shadow-re" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="2" dy="6" stdDeviation="4" floodOpacity="0.22" floodColor="#0f172a" />
      </filter>
      
      {/* Skin */}
      <radialGradient id="sk-re" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#ffeedb" />
        <stop offset="100%" stopColor="#fed7aa" />
      </radialGradient>
      {/* Therapist's hair */}
      <radialGradient id="hair-therapist" cx="45%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="100%" stopColor="#1c0a02" />
      </radialGradient>
      {/* Patient's hair */}
      <radialGradient id="hair-patient" cx="45%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </radialGradient>

      {/* Blue sporty jacket */}
      <linearGradient id="blue-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      {/* Trousers */}
      <linearGradient id="grey-pants" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      
      {/* Metal bars layout */}
      <linearGradient id="silver-metal" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Entire assembly with shadow */}
    <g filter="url(#shadow-re)">
      
      {/* 1. Ground wooden walking platform */}
      <path d="M 12 128 L 148 128 L 136 148 L 24 148 Z" fill="#dd6b20" opacity="0.85" stroke="#9c4221" strokeWidth="1.5" />

      {/* 2. RECONSTRUCT PATIENT (Left side character, walks in parallel bars) */}
      {/* Legs & custom sporty shoes */}
      <rect x="42" y="100" width="10" height="32" rx="3" fill="url(#grey-pants)" />
      <rect x="56" y="100" width="10" height="32" rx="3" fill="url(#grey-pants)" />
      {/* Shoes */}
      <rect x="37" y="128" width="16" height="6" rx="2.5" fill="#3b82f6" />
      <rect x="55" y="128" width="16" height="6" rx="2.5" fill="#3b82f6" />

      {/* Patient Body in Blue Sporty Puffy Jacket */}
      <rect x="36" y="60" width="34" height="42" rx="11" fill="url(#blue-jacket)" />
      
      {/* Double white sporty stripes on jacket sleeve */}
      <path d="M 44 60 C 44 60, 48 74, 48 84" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      <path d="M 49 60 C 49 60, 53 74, 53 84" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

      {/* Patient Neck */}
      <rect x="47" y="52" width="11" height="10" rx="1.5" fill="url(#sk-re)" />
      {/* Patient Face */}
      <circle cx="53" cy="42" r="13" fill="url(#sk-re)" />
      {/* Patient Hair */}
      <path d="M 40 40 C 40 27, 66 27, 66 40 L 66 33 C 66 24, 40 24, 40 33 Z" fill="url(#hair-patient)" />

      {/* 3. RECONSTRUCT PHYSIOTHERAPIST (Right side character supporting patient) */}
      {/* Therapist Trousers */}
      <rect x="94" y="104" width="11" height="28" rx="3" fill="#1e1b4b" />
      <rect x="110" y="104" width="11" height="28" rx="3" fill="#1e1b4b" />
      {/* White shoes */}
      <rect x="92" y="129" width="14" height="5" rx="2" fill="#fafafa" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="109" y="129" width="14" height="5" rx="2" fill="#fafafa" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Therapist White Coat / Medical shirt */}
      <rect x="88" y="66" width="34" height="42" rx="10" fill="#fafafa" stroke="#e2e8f0" strokeWidth="1" />
      {/* Blue / Teal inner collar */}
      <path d="M 97 66 L 111 66 L 104 76 Z" fill="#0ea5e9" />

      {/* Therapist Supporting Arm on patient's shoulder */}
      <path d="M 90 74 C 76 76, 60 76, 68 84" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <circle cx="68" cy="84" r="3.5" fill="url(#sk-re)" />

      {/* Therapist Neck */}
      <rect x="99" y="58" width="10" height="10" rx="1.5" fill="url(#sk-re)" />
      {/* Therapist Face */}
      <circle cx="104" cy="48" r="12" fill="url(#sk-re)" />
      {/* Therapist Hair with cute ponytail style */}
      <path d="M 92 48 C 92 36, 116 36, 116 48 L 116 40 C 116 31, 92 31, 92 40 Z" fill="url(#hair-therapist)" />
      {/* Ponytail dot */}
      <circle cx="118" cy="48" r="4" fill="url(#hair-therapist)" />

      {/* 4. PARALLEL BARS (Metallic apparatus in front perspective layered over the figures) */}
      {/* Left rail posts */}
      <line x1="22" y1="84" x2="22" y2="134" stroke="url(#silver-metal)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="68" y1="84" x2="68" y2="134" stroke="url(#silver-metal)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="112" y1="84" x2="112" y2="134" stroke="url(#silver-metal)" strokeWidth="4.5" strokeLinecap="round" />
      {/* Horizontal handrail bar in foreground */}
      <path d="M 12 84 L 148 84" stroke="url(#silver-metal)" strokeWidth="7" strokeLinecap="round" />
    </g>
  </svg>
);

export const BalneotherapieLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-balneo-logo-svg"
  >
    <defs>
      <filter id="shadow-drop" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="3" dy="7" stdDeviation="5.5" floodOpacity="0.25" floodColor="#0d9488" />
      </filter>
      
      {/* Gradients */}
      <radialGradient id="drop-grad" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="55%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0369a1" />
      </radialGradient>
      <linearGradient id="inner-pool" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" opacity="0.6" />
        <stop offset="100%" stopColor="#0ea5e9" opacity="0.9" />
      </linearGradient>
      <radialGradient id="body-water" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#ea580c" />
      </radialGradient>
      <linearGradient id="chrome-bars" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#cbd5e1" />
        <stop offset="90%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Big glossy water-drop icon frame container */}
    <g filter="url(#shadow-drop)">
      {/* Elegant Turquoise Droplet backdrop */}
      <path d="M 80 12 C 80 12, 142 70, 142 108 C 142 142, 114 150, 80 150 C 46 150, 18 142, 18 108 C 18 70, 80 12, 80 12 Z" fill="url(#drop-grad)" />

      {/* Internal pool surface dividing line */}
      <path d="M 22 104 C 40 114, 120 114, 138 104 L 134 136 C 110 146, 50 146, 26 136 Z" fill="url(#inner-pool)" />

      {/* Bather's character from back view representation */}
      {/* Shoulders and upper torso */}
      <path d="M 48 94 C 48 84, 56 68, 80 68 C 104 68, 112 84, 112 94 Z" fill="url(#body-water)" />
      
      {/* Neck */}
      <rect x="73" y="56" width="14" height="15" rx="1" fill="#fed7aa" />
      {/* Oval head back view */}
      <circle cx="80" cy="48" r="14" fill="#fed7aa" />
      {/* Hair tied in a long stylish turquoise ponytail stream */}
      <circle cx="80" cy="40" r="13" fill="#0d9488" /> {/* Hair crown */}
      <path d="M 76 45 C 76 45, 84 54, 84 76 C 84 82, 76 96, 76 96 C 76 96, 80 82, 80 76 L 80 45" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Left raised arm reaching to parallel pool side bar handles */}
      <path d="M 60 74 C 52 70, 42 72, 42 80" stroke="#fdbaf7" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0.1" /> {/* Shadow track */}
      <path d="M 64 74 C 54 68, 42 74, 42 82" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Right raised arm reaching to handle */}
      <path d="M 96 74 C 106 68, 118 74, 118 82" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Chrome curved pool bar handles on both sides */}
      {/* Left rail */}
      <path d="M 32 110 L 32 82 C 32 72, 52 72, 52 82 L 52 92" stroke="url(#chrome-bars)" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Right rail */}
      <path d="M 128 110 L 128 82 C 128 72, 108 72, 108 82 L 108 92" stroke="url(#chrome-bars)" strokeWidth="6" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

export const IntensifLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-intensif-logo-svg"
  >
    <defs>
      <filter id="shadow-int" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="3" dy="6" stdDeviation="5.5" floodOpacity="0.2" floodColor="#1e3a8a" />
      </filter>

      {/* Studio elements */}
      <linearGradient id="wall-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#eff6ff" />
        <stop offset="70%" stopColor="#dbeafe" />
        <stop offset="100%" stopColor="#bfdbfe" />
      </linearGradient>
      <linearGradient id="ladder-bars" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>

    {/* Gym / Studio workspace group */}
    <g filter="url(#shadow-int)">
      {/* Rounded Studio Wall screen background color */}
      <rect x="18" y="18" width="124" height="124" rx="24" fill="url(#wall-grad)" stroke="#93c5fd" strokeWidth="1.5" />

      {/* Floor border edge */}
      <path d="M 18 118 L 142 118 L 142 142 L 18 142 Z" fill="#93c5fd" opacity="0.3" />

      {/* Yellow/Woody Gymnastics Wall-Bars Ladder (Espalier) on left margin */}
      {/* Left side rail */}
      <rect x="25" y="24" width="3" height="106" rx="1" fill="url(#ladder-bars)" />
      {/* Right side rail */}
      <rect x="42" y="24" width="3" height="106" rx="1" fill="url(#ladder-bars)" />
      {/* Ladder horizontal rungs */}
      <rect x="25" y="34" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="46" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="58" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="70" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="82" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="94" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="106" width="20" height="2" fill="url(#ladder-bars)" />
      <rect x="25" y="118" width="20" height="2" fill="url(#ladder-bars)" />

      {/* Elegant Wall Analog Clock on top right */}
      <circle cx="118" cy="42" r="14" fill="#ffffff" stroke="#be123c" strokeWidth="1.8" />
      {/* Numbers indication dots */}
      <circle cx="118" cy="32" r="1" fill="#475569" />
      <circle cx="128" cy="42" r="1" fill="#475569" />
      <circle cx="118" cy="52" r="1" fill="#475569" />
      <circle cx="108" cy="42" r="1" fill="#475569" />
      {/* Clock arrows representing physical therapy time slots */}
      <line x1="118" y1="42" x2="118" y2="35" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="118" y1="42" x2="125" y2="46" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
      {/* Central axis */}
      <circle cx="118" cy="42" r="2.2" fill="#be123c" />

      {/* Supervisor/Instructor center/rear active figure stretch (Pink details) */}
      {/* legs */}
      <line x1="74" y1="102" x2="74" y2="122" stroke="#ec4899" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="84" y1="102" x2="84" y2="122" stroke="#ec4899" strokeWidth="4.5" strokeLinecap="round" />
      {/* shirt */}
      <path d="M 70 82 A 7 7 0 0 1 77 75 L 81 75 A 7 7 0 0 1 88 82 L 85 102 L 73 102 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      {/* Head */}
      <circle cx="79" cy="67" r="6" fill="#fed7aa" />
      {/* Arms performing lateral exercises */}
      <path d="M 71 80 C 65 74, 62 68, 62 68" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 87 80 C 93 74, 96 68, 96 68" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Left side stretching child/adult (Purple shirt) */}
      <line x1="56" y1="114" x2="56" y2="125" stroke="#4f46e5" strokeWidth="3" />
      <line x1="62" y1="114" x2="62" y2="125" stroke="#4f46e5" strokeWidth="3" />
      <rect x="52" y="93" width="13" height="21" rx="4" fill="#6366f1" />
      <circle cx="58" cy="86" r="4.5" fill="#fdbaf7" />
      <path d="M 52 96 C 47 90, 47 88, 47 88" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Right side stretching child/adult (Yellow/Striped jersey) */}
      <line x1="101" y1="114" x2="101" y2="125" stroke="#1e1b4b" strokeWidth="3" />
      <line x1="107" y1="114" x2="107" y2="125" stroke="#1e1b4b" strokeWidth="3" />
      <rect x="97" y="93" width="13" height="21" rx="4" fill="#eab308" />
      <circle cx="103" cy="86" r="4.5" fill="#fed7aa" />
      {/* Arms stretched upwards */}
      <path d="M 107 96 C 112 90, 114 84, 114 84" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const CaissesLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 160 160" 
    className={props.className || "w-4 h-4"} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    id="custom-caisses-logo-svg"
  >
    <defs>
      <filter id="shadow-caisse" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="3" dy="8" stdDeviation="5" floodOpacity="0.25" floodColor="#0f172a" />
      </filter>
      <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="orange-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="screen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="cash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
    
    <g filter="url(#shadow-caisse)">
      {/* 3D Base d'épaisseur de la caisse */}
      <rect x="22" y="94" width="116" height="42" rx="12" fill="#0f172a" />
      
      {/* Base principale de la caisse (gris anthracite) */}
      <rect x="22" y="90" width="116" height="40" rx="12" fill="url(#body-grad)" />
      
      {/* Plaque ou insert orange décoratif sur la base */}
      <rect x="28" y="94" width="104" height="6" rx="2" fill="url(#orange-grad)" />

      {/* Tiroir caisse entrouvert en bas */}
      <path d="M 34 116 L 126 116 L 122 136 L 38 136 Z" fill="#0f172a" />
      <path d="M 36 120 L 124 120 L 120 134 L 40 134 Z" fill="#1e293b" />
      
      {/* Billets de banque verts (3 liasses) qui dépassent du tiroir */}
      {/* Billet 1 */}
      <rect x="44" y="123" width="20" height="8" rx="1" fill="url(#cash-grad)" transform="rotate(-4 44 123)" />
      <line x1="48" y1="126" x2="60" y2="125" stroke="#14532d" strokeWidth="1" />
      {/* Billet 2 */}
      <rect x="70" y="123" width="20" height="8" rx="1" fill="url(#cash-grad)" />
      <line x1="74" y1="127" x2="86" y2="127" stroke="#14532d" strokeWidth="1" />
      {/* Billet 3 */}
      <rect x="96" y="123" width="20" height="8" rx="1" fill="url(#cash-grad)" transform="rotate(4 96 123)" />
      <line x1="100" y1="126" x2="112" y2="127" stroke="#14532d" strokeWidth="1" />

      {/* Bouton de déverrouillage rond orange au milieu du tiroir */}
      <circle cx="80" cy="131" r="5" fill="url(#orange-grad)" stroke="#0f172a" strokeWidth="1" />
      
      {/* Partie supérieure gauche : Le grand écran de caisse */}
      {/* Pied de l'écran */}
      <rect x="52" y="70" width="16" height="22" fill="#1e293b" />
      
      {/* Cadre de l'écran incliné */}
      <rect x="28" y="24" width="64" height="48" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
      
      {/* Afficheur LCD */}
      <rect x="34" y="30" width="52" height="22" rx="3" fill="url(#screen-grad)" />
      {/* Texte simulé sur l'écran LCD */}
      <rect x="40" y="35" width="24" height="4" rx="1" fill="#1e293b" opacity="0.7" />
      <rect x="40" y="42" width="16" height="4" rx="1" fill="#1e293b" opacity="0.7" />
      <circle cx="78" cy="41" r="3" fill="#1e293b" opacity="0.8" />

      {/* Partie supérieure droite : Clavier orange / blanc et Reçu papier */}
      {/* Corps du clavier incliné */}
      <path d="M 94 65 L 134 65 L 132 90 L 96 90 Z" fill="#334155" />
      
      {/* Touches du clavier */}
      {/* Ligne 1 */}
      <rect x="98" y="69" width="6" height="5" rx="1" fill="url(#orange-grad)" />
      <rect x="106" y="69" width="6" height="5" rx="1" fill="#f1f5f9" />
      <rect x="114" y="69" width="6" height="5" rx="1" fill="#f1f5f9" />
      <rect x="122" y="69" width="6" height="5" rx="1" fill="url(#orange-grad)" />
      {/* Ligne 2 */}
      <rect x="98" y="76" width="6" height="5" rx="1" fill="#f1f5f9" />
      <rect x="106" y="76" width="6" height="5" rx="1" fill="url(#orange-grad)" />
      <rect x="114" y="76" width="6" height="5" rx="1" fill="url(#orange-grad)" />
      <rect x="122" y="76" width="6" height="5" rx="1" fill="#f1f5f9" />
      {/* Ligne 3 */}
      <rect x="98" y="83" width="6" height="5" rx="1" fill="url(#orange-grad)" />
      <rect x="106" y="83" width="6" height="5" rx="1" fill="#f1f5f9" />
      <rect x="114" y="83" width="6" height="5" rx="1" fill="url(#orange-grad)" />
      <rect x="122" y="83" width="6" height="5" rx="1" fill="url(#orange-grad)" />

      {/* Imprimante à ticket intégrée à droite de l'écran, derrière le clavier */}
      <rect x="102" y="48" width="28" height="14" rx="2" fill="#1e293b" />
      {/* Fente d'impression */}
      <rect x="106" y="58" width="20" height="2" fill="#0f172a" />
      
      {/* Papier ticket de caisse qui sort */}
      <path d="M 108 58 L 108 34 L 124 34 L 124 58 Z" fill="#fafafa" />
      {/* Lignes imprimées sur le reçu (orange/rouges) */}
      <line x1="111" y1="38" x2="121" y2="38" stroke="url(#orange-grad)" strokeWidth="1.5" />
      <line x1="111" y1="43" x2="118" y2="43" stroke="url(#orange-grad)" strokeWidth="1.5" />
      <line x1="111" y1="48" x2="121" y2="48" stroke="url(#orange-grad)" strokeWidth="1.5" strokeDasharray="1 1" />
      <line x1="111" y1="53" x2="116" y2="53" stroke="url(#orange-grad)" strokeWidth="1.5" />
    </g>
  </svg>
);


