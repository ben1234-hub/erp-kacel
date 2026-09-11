import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, Users, CreditCard, Clock, Sparkles, 
  ChevronRight, Heart, ShieldCheck, Stethoscope, Calendar,
  Maximize, Minimize
} from "lucide-react";

interface AccueilCarouselProps {
  setActiveTab: (tab: any) => void;
  setHasClickedMenu: (val: boolean) => void;
  dbState: any;
  selectedDate: string;
}

const IMAGES = [
  "/doctor-with-patient-physiotherapy-clinic.jpg",
  "/patient-doing-physical-rehabilitation-helped-by-therapists.jpg",
  "/practitioner-man-doctor-helping-retiree-senior-male-wheelchair-physiotherapy-strength-exercise.jpg",
  "/doctor-helping-patient-rehabilitation(1).jpg"
];

const CITATIONS = [
  {
    title: "Accompagnement Thérapeutique Spécialisé",
    text: "La rééducation fonctionnelle et motrice personnalisée sous le contrôle d'experts dédiés pour chaque étape de votre rétablissement.",
    tag: "MPR & KINÉSITHÉRAPIE"
  },
  {
    title: "Balnéothérapie Douce",
    text: "Des exercices en bassin chauffé pour soulager les articulations et stimuler la motricité en toute légèreté.",
    tag: "PLATEAU HUMIDE"
  },
  {
    title: "Pédiatrie & Soins Intensifs",
    text: "Une prise en charge pluridisciplinaire bienveillante et adaptée pour l'éveil et l'évolution motrice des plus jeunes.",
    tag: "PLATEAU PÉDIATRIQUE"
  },
  {
    title: "Orthophonie & Psychomotricité",
    text: "Une écoute et des thérapies ciblées pour rétablir la communication et l'harmonie psycho-corporelle.",
    tag: "SUIVI SPÉCIALISÉ"
  }
];

export const AccueilCarousel: React.FC<AccueilCarouselProps> = ({
  setActiveTab,
  setHasClickedMenu,
  dbState,
  selectedDate
}) => {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Erreur d'activation plein écran: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
    }, 5500); // Défilement toutes les 5.5 secondes
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab: any) => {
    setActiveTab(tab);
    setHasClickedMenu(true);
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-6 h-full min-h-[500px]" id="accueil-carousel-container">
      {/* Carrousel d'images défilantes (prend tout l'espace de la fenêtre) */}
      <div className="flex-1 relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 flex flex-col justify-end min-h-[400px]">
        {/* Images avec AnimatePresence pour une transition esthétique et élégante */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`carousel-image-${index}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={IMAGES[index]}
              alt="Kacel Sante MPR"
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            {/* Dégradé doux pour lisibilité du texte */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Barre d'en-tête translucide supérieure */}
        <div className="absolute top-0 inset-x-0 p-5 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/50 to-transparent">
          {/* Badge supérieur gauche */}
          <div className="bg-teal-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-100 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>{CITATIONS[index].tag}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicateurs de progression */}
            <div className="flex gap-2">
              {IMAGES.map((_, i) => (
                <button
                  key={`accueil-dot-${i}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === i ? "w-6 bg-teal-400" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  title={`Diapositive ${i + 1}`}
                />
              ))}
            </div>

            {/* Bouton Plein écran */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer shadow-md"
              title="Basculer Plein écran"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Fenêtré</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Plein écran</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Texte inspirant dynamique superposé */}
        <div className="relative p-6 md:p-10 z-10 text-white max-w-2xl space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`carousel-text-${index}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="space-y-2.5"
            >
              <h2 className="text-xl md:text-3xl font-black tracking-tight font-serif text-teal-300">
                {CITATIONS[index].title}
              </h2>
              <p className="text-white/90 text-xs md:text-sm leading-relaxed font-medium font-sans">
                {CITATIONS[index].text}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="pt-2 flex items-center gap-2.5">
            <div className="h-[2px] w-12 bg-teal-400 rounded-full" />
            <span className="text-[10px] font-bold text-teal-300 tracking-wider uppercase font-mono">
              Clinique KACEL Santé MPR • Standard d'Excellence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
