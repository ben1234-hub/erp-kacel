import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Activity, Users, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

interface WelcomeCarouselProps {
  onSelectTab: (tab: string) => void;
  currentUserRole?: string;
}

interface SlideItem {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
}

const SLIDES: SlideItem[] = [
  {
    image: '/images/carousel/doctor-helping-patient-rehabilitation-1.jpg',
    badge: 'Plateau Technique MPR',
    title: 'Excellence en Rééducation Fonctionnelle',
    subtitle: 'Accompagnement personnalisé et protocoles thérapeutiques de pointe pour une récupération motrice et neuro-musculaire optimale.'
  },
  {
    image: '/images/carousel/doctor-with-patient-physiotherapy-clinic.jpg',
    badge: 'Consultation & Bilan Clinique',
    title: 'Expertise Médicale Multi-Disciplinaire',
    subtitle: 'Praticiens spécialisés en Médecine Physique et de Réadaptation à votre écoute à chaque étape de votre réhabilitation.'
  },
  {
    image: '/images/carousel/patient-doing-physical-rehabilitation-helped-by-therapists.jpg',
    badge: 'Soins Intensifs & Pédiatrie',
    title: 'Prise en Charge Rééducative Active',
    subtitle: 'Des plateaux techniques spacieux et ultra-équipés dédiés aux protocoles intensifs et pédiatriques (Enfants IMC).'
  },
  {
    image: '/images/carousel/practitioner-man-doctor-helping-retiree.jpg',
    badge: 'Autonomie & Bien-Être',
    title: 'Retrouver Mobilité et Qualité de Vie',
    subtitle: 'Un suivi clinique rigoureux alliant kinésithérapie, balnéothérapie et ateliers spécialisés pour tous les âges.'
  }
];

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ onSelectTab, currentUserRole }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-between rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800">
      {/* BACKGROUND SLIDES WITH CROSSFADE */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-[10000ms] ease-out"
            style={{
              transform: index === currentIndex ? 'scale(1)' : 'scale(1.08)'
            }}
          />
          {/* ELEGANT GRADIENT OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent" />
        </div>
      ))}

      {/* TOP BRANDING BAR INSIDE CAROUSEL */}
      <div className="relative z-20 p-6 md:p-8 flex items-center justify-between">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-wider uppercase">KACEL Santé MPR • ERP Clinique</span>
        </div>
        {currentUserRole && (
          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Session : {currentUserRole}</span>
          </div>
        )}
      </div>

      {/* CENTER / BOTTOM CONTENT */}
      <div 
        className="relative z-20 p-6 md:p-12 lg:p-16 max-w-4xl mt-auto space-y-6 select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* SLIDE BADGE */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/90 text-white font-extrabold text-xs shadow-md tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{SLIDES[currentIndex].badge}</span>
        </div>

        {/* SLIDE TITLE */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
          {SLIDES[currentIndex].title}
        </h1>

        {/* SLIDE SUBTITLE */}
        <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed drop-shadow">
          {SLIDES[currentIndex].subtitle}
        </p>

        {/* CTA ACTION BUTTONS */}
        <div className="pt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('patients')}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl transition transform active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Accéder aux Patients</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('queue_mpr')}
            className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold text-sm shadow-lg transition flex items-center gap-2.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span>File d'Attente MPR</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition sm:ml-auto cursor-pointer"
          >
            <span>Tableau de Bord</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION CONTROLS BAR */}
      <div className="relative z-20 px-6 py-5 md:px-12 bg-slate-950/60 backdrop-blur-lg border-t border-white/10 flex items-center justify-between">
        {/* DOTS */}
        <div className="flex items-center gap-2.5">
          {SLIDES.map((_, idx) => (
            <button
              key={`welcome-dot-${idx}`}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-10 bg-emerald-400 shadow-md' : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
              title={`Aller à la diapositive ${idx + 1}`}
            />
          ))}
        </div>

        {/* PREV / NEXT ARROWS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="Image précédente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="Image suivante"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
