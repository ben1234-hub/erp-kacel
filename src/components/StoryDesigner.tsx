/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, Download, Share2, Palette, User, FileText, Check, Phone, MapPin, 
  Globe, Heart, ArrowRight, Instagram, RefreshCw, Layers, RotateCcw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Praticien } from '../dbStore';

// Dynamic import of the generated doctor portrait
// @ts-ignore
import doctorPortrait from '../assets/images/doctor_portrait_1780741733336.png';

interface StoryDesignerProps {
  dbState: DatabaseState;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface StylistTheme {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  cardBg: string;
  borderColor: string;
  badgeBg: string;
  gradientFrom: string;
  gradientTo: string;
}

const CONSTANT_THEMES: StylistTheme[] = [
  {
    id: 'canva-teal-moderne',
    name: 'Teal Pastel Éclat (Nouveau)',
    bgColor: 'bg-[#fdfefe]',
    textColor: 'text-[#1d3944]',
    accentColor: 'text-[#3f988f]',
    cardBg: 'bg-white',
    borderColor: 'border-[#a1cac6]/40',
    badgeBg: 'bg-[#a1cac6]/20 text-[#1d3944]',
    gradientFrom: '#fdfefe',
    gradientTo: '#e2f2f0'
  },
  {
    id: 'canva-teal-dark',
    name: 'Teal Intense Profond',
    bgColor: 'bg-[#1d3944]',
    textColor: 'text-[#fdfefe]',
    accentColor: 'text-[#a1cac6]',
    cardBg: 'bg-[#306568]/30',
    borderColor: 'border-[#3f988f]/40',
    badgeBg: 'bg-[#306568] text-[#fdfefe]',
    gradientFrom: '#1d3944',
    gradientTo: '#306568'
  },
  {
    id: 'canva-beige',
    name: 'Teal & Mint Clinique',
    bgColor: 'bg-[#f1faf9]',
    textColor: 'text-[#1d3944]',
    accentColor: 'text-[#306568]',
    cardBg: 'bg-white',
    borderColor: 'border-[#3f988f]/30',
    badgeBg: 'bg-[#3f988f]/10 text-[#3f988f]',
    gradientFrom: '#fdfefe',
    gradientTo: '#f1faf9'
  }
];

const TRANSLATION_PRESETS: Record<string, {
  subheader: string;
  title: string;
  description: string;
  services: string[];
}> = {
  fr: {
    subheader: "NOTRE PRIORITÉ, C'EST VOUS",
    title: "Service Médical & Santé",
    description: "Notre clinique offre une approche personnalisée de rééducation fonctionnelle et physique pour vous redonner pleine mobilité.",
    services: [
      'Kinésithérapie Active',
      'Balnéothérapie & Bassins',
      'Rééducation Post-opératoire',
      'Suivi MPR Individualisé'
    ]
  },
  en: {
    subheader: "OUR PRIORITÝ IS YOU",
    title: "Medical & Health Services",
    description: "Our clinic provides a personalized physical and functional rehabilitation approach to restore your full mobility.",
    services: [
      'Active Physiotherapy',
      'Balneotherapy & Pools',
      'Post-operative Rehabilitation',
      'Individualized MPR Follow-up'
    ]
  },
  es: {
    subheader: "NUESTRA PRIORIDAD ES USTED",
    title: "Servicios Médicos y de Salud",
    description: "Nuestra clínica ofrece un enfoque personalizado de rehabilitación física y funcional para restaurar su movilidad completa.",
    services: [
      'Fisioterapia Activa',
      'Balneoterapia y Piscinas',
      'Rehabilitación Postoperatoria',
      'Seguimiento MPR Individual'
    ]
  },
  ar: {
    subheader: "أولويتنا هي صحتكم وسلامتكم",
    title: "الخدمات الطبية والرعاية الصحية",
    description: "تقدم عيادتنا نهجاً مخصصاً لإعادة التأهيل الوظيفي والفيزيائي لاستعادة حركتكم بالكامل.",
    services: [
      'العلاج الطبيعي النشط',
      'العلاج بالماء وحمامات السباحة',
      'إعادة التأهيل بعد الجراحة',
      'متابعة فردية متكاملة'
    ]
  }
};

export const StoryDesigner: React.FC<StoryDesignerProps> = ({ dbState, triggerToast }) => {
  // Canva design states
  const [activeTheme, setActiveTheme] = useState<StylistTheme>(CONSTANT_THEMES[0]);
  const [selectedPratId, setSelectedPratId] = useState<number>(dbState.praticiens[0]?.ID_Prat ?? 1);
  
  const [storySubheader, setStorySubheader] = useState<string>('NÔTRE PRIORITÉ, C\'EST VOUS');
  const [storyTitle, setStoryTitle] = useState<string>('Service Médical & Santé');
  const [storyDescription, setStoryDescription] = useState<string>(
    'Notre clinique offre une approche personnalisée de rééducation fonctionnelle et physique pour vous redonner pleine mobilité.'
  );
  
  // Custom Services displayed on the flyer
  const [itemServices, setItemServices] = useState<string[]>([
    'Kinésithérapie Active',
    'Balnéothérapie & Bassins',
    'Rééducation Post-opératoire',
    'Suivi MPR Individualisé'
  ]);
  
  // Custom contact card inputs
  const [clinicPhone, setClinicPhone] = useState<string>('01 45 89 20 11');
  const [clinicAddress, setClinicAddress] = useState<string>('12 Rue de la Rééducation');
  const [clinicCity, setClinicCity] = useState<string>('Paris Centre');
  const [clinicUrl, setClinicUrl] = useState<string>('www.chirolift-mpr.fr');
  
  // New service input item
  const [newServiceInput, setNewServiceInput] = useState<string>('');
  
  // Image framing option: circle, elegant oval, round-rect
  const [imageBorderShape, setImageBorderShape] = useState<'oval' | 'circle' | 'rounded-rect'>('oval');
  
  // Story template simulation controls
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  // Current selected doctor obj
  const activeDr = dbState.praticiens.find(p => p.ID_Prat === selectedPratId) ?? dbState.praticiens[0];

  // Map specialty letter to French literal
  const getSpecialtyLabel = (rep: 'K' | 'P' | 'O' | 'MPR') => {
    switch (rep) {
      case 'K': return 'Médecine Physique & Kinésithérapie';
      case 'P': return 'Psychomotricien Spécialisé';
      case 'O': return 'Orthophoniste Spécialiste';
      case 'MPR': return 'Spécialiste Médecin MPR';
      default: return 'Praticien Spécialiste MPR';
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportComplete(false);
    
    // Simulate high-fidelity export rendering
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      triggerToast('La Story Instagram "Service Médical" a été générée avec succès !', 'success');
    }, 2800);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceInput.trim()) return;
    if (itemServices.length >= 5) {
      triggerToast('Afin de préserver l\'élégance et l\'aération de la composition Canva originale (EAGKpbPfMdQ), nous vous conseillons de ne pas dépasser 4 ou 5 services.', 'info');
    }
    setItemServices([...itemServices, newServiceInput.trim()]);
    setNewServiceInput('');
    triggerToast('Service ajouté au flyer.', 'success');
  };

  const handleRemoveService = (index: number) => {
    const updated = itemServices.filter((_, i) => i !== index);
    setItemServices(updated);
    triggerToast('Service supprimé.', 'info');
  };

  const handleResetToCanva = () => {
    setActiveTheme(CONSTANT_THEMES[0]);
    setSelectedPratId(dbState.praticiens[0]?.ID_Prat ?? 1);
    setStorySubheader('NÔTRE PRIORITÉ, C\'EST VOUS');
    setStoryTitle('Service Médical & Santé');
    setStoryDescription('Notre clinique offre une approche personnalisée de rééducation fonctionnelle et physique pour vous redonner pleine mobilité.');
    setItemServices([
      'Kinésithérapie Active',
      'Balnéothérapie & Bassins',
      'Rééducation Post-opératoire',
      'Suivi MPR Individualisé'
    ]);
    setClinicPhone('01 45 89 20 11');
    setClinicAddress('12 Rue de la Rééducation');
    setClinicCity('Paris Centre');
    setClinicUrl('www.chirolift-mpr.fr');
    setImageBorderShape('oval');
    setExportComplete(false);
    triggerToast('Restauré aux valeurs d\'origine du template Canva.', 'success');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="story-designer-container">
      
      {/* 1. Left controls panel (Xl: 5 columns) */}
      <div className="xl:col-span-5 space-y-6" id="canva-controls-pane">
        
        {/* Banner with Canva details */}
        <div className="bg-[#FAF5EE] border border-[#E9DFCF] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-[#C5A880]/20 text-[#8C6F45] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              ID template : EAGKpbPfMdQ
            </span>
            <span className="text-[11px] font-bold text-slate-500">Instagram Story Layout</span>
          </div>
          <h2 className="font-extrabold text-sm text-[#0F2D37]">
            Générateur de Flyer & Story Historique "Service Médical"
          </h2>
          <p className="text-xs text-slate-600">
            Nous avons décodé et récupéré la grille géométrique, les proportions typographiques et la charte de couleurs de la publication Canva pour l'associer directement aux données opérationnelles de votre clinique.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleResetToCanva}
              className="px-2.5 py-1 border border-stone-300 hover:bg-stone-100 rounded-lg text-[10.5px] font-bold text-slate-600 transition flex items-center gap-1 bg-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Form elements */}
        <div className="bg-white rounded-2xl border border-slate-205 p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-450 border-b pb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-600" />
            <span>1. Thème de Couleur & Design</span>
          </h3>

          {/* Theme Grid selection */}
          <div className="grid grid-cols-2 gap-3">
            {CONSTANT_THEMES.map(theme => {
              const isSelected = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setActiveTheme(theme);
                    triggerToast(`Style de Story modifié pour : ${theme.name}`, 'info');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition duration-150 flex flex-col justify-between ${
                    isSelected 
                      ? 'border-[#0F2D37] ring-1 ring-[#0F2D37] font-extrabold bg-[#FCFAF7]' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="font-bold block text-[11px] truncate">{theme.name}</span>
                  <div className="flex gap-1 mt-2">
                    <span className={`w-3.5 h-3.5 rounded-full border border-stone-200 bg-${theme.id === 'canva-beige' ? '[#FAF8F5]' : theme.id === 'canva-teal' ? '[#F2FAF9]' : theme.id === 'canva-emerald' ? '[#F3F7F2]' : '[#FAF5F2]'}`} />
                    <span className={`w-3.5 h-3.5 rounded-full border border-stone-200 bg-${theme.id === 'canva-beige' ? '[#0F2D37]' : theme.id === 'canva-teal' ? '[#0D3834]' : theme.id === 'canva-emerald' ? '[#1E301F]' : '[#4A2E1F]'}`} />
                    <span className={`w-3.5 h-3.5 rounded-full border border-stone-200 bg-${theme.id === 'canva-beige' ? '[#C5A880]' : theme.id === 'canva-teal' ? '[#1D9A8D]' : theme.id === 'canva-emerald' ? '[#649A6E]' : '[#D98B6C]'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Border shapes options */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 block">Encadrement du Médecin sur l'Affiche</label>
            <div className="grid grid-cols-3 gap-2">
              {(['oval', 'circle', 'rounded-rect'] as const).map(shape => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setImageBorderShape(shape)}
                  className={`py-1.5 px-2 text-xs rounded-lg border font-bold transition uppercase tracking-wide text-center ${
                    imageBorderShape === shape 
                      ? 'bg-chiro-blue text-white font-extrabold border-transparent shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {shape === 'oval' ? 'Ovale Chic' : shape === 'circle' ? 'Cercle Clinique' : 'Rect. Arrondi'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content edits panel */}
        <div className="bg-white rounded-2xl border border-slate-205 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-450 border-b pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>2. Textes Cliniques & Accroches</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Praticien dropdown links directly to live clinicians */}
            <div className="space-y-1.5 animate-fade-in">
              <label htmlFor="flyer-doctor-select" className="block font-bold text-slate-700 flex items-center justify-between">
                <span>Médecin à l'Honneur (sur l'Affiche)</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 uppercase tracking-wide font-mono scale-95">Réf: Insta-Canva</span>
              </label>
              <select
                id="flyer-doctor-select"
                className="w-full border border-stone-300 rounded-lg p-2 bg-slate-50 text-xs font-bold font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0F2D37]"
                value={selectedPratId}
                onChange={(e) => {
                  setSelectedPratId(Number(e.target.value));
                  triggerToast('Praticien mis à l\'honneur sur le flyer.', 'success');
                }}
              >
                {dbState.praticiens.map(p => (
                  <option key={p.ID_Prat} value={p.ID_Prat}>
                    Dr. {p.Prenom_Prat} {p.Nom_Prat} ({getSpecialtyLabel(p.Repere)})
                  </option>
                ))}
              </select>

              {/* Botton Traduire / Translate Picker */}
              <div className="mt-2 bg-slate-50/75 p-2.5 rounded-xl border border-dashed border-slate-205">
                <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Traduire instantanément la fiche :</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { code: 'fr', label: '🇫🇷 FR', name: 'Français' },
                    { code: 'en', label: '🇬🇧 EN', name: 'Anglais' },
                    { code: 'es', label: '🇪🇸 ES', name: 'Espagnol' },
                    { code: 'ar', label: '🇸🇦 AR', name: 'Arabe' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        const preset = TRANSLATION_PRESETS[lang.code];
                        if (preset) {
                          setStorySubheader(preset.subheader);
                          setStoryTitle(preset.title);
                          setStoryDescription(preset.description);
                          setItemServices(preset.services);
                          triggerToast(`Fiche praticienne traduite en ${lang.name} !`, 'success');
                        }
                      }}
                      className="px-1.5 py-1 text-[10.5px] font-black border border-stone-200 bg-white rounded-lg hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                      title={`Traduire en ${lang.name}`}
                    >
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="story-subheader-input" className="block font-bold text-slate-700">Sourdeline / Label Supérieur</label>
              <input
                id="story-subheader-input"
                type="text"
                className="w-full border border-stone-300 rounded-lg p-2 font-medium"
                value={storySubheader}
                onChange={(e) => setStorySubheader(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="story-title-input" className="block font-bold text-slate-700">Titre Principal de l'Annonce</label>
              <input
                id="story-title-input"
                type="text"
                className="w-full border border-stone-300 rounded-lg p-2 font-black text-slate-900"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="story-desc-input" className="block font-bold text-slate-700">Description Thérapeutique</label>
              <textarea
                id="story-desc-input"
                rows={3}
                className="w-full border border-stone-300 rounded-lg p-2 font-medium text-xs resize-none"
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* List of services editor */}
        <div className="bg-white rounded-2xl border border-slate-205 p-6 shadow-xs space-y-4">
          <div className="border-b pb-3 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>3. Liste des spécialités affichées</span>
            </h3>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-400">
              {itemServices.length}/5 max
            </span>
          </div>

          {/* List display */}
          <div className="text-xs space-y-1.5">
            {itemServices.map((service, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-stone-200/50"
              >
                <span className="font-semibold text-slate-700">{service}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(idx)}
                  className="text-slate-400 hover:text-rose-600 text-[10px] px-2 font-extrabold"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>

          {/* Add form */}
          <form onSubmit={handleAddService} className="flex gap-2 text-xs pt-1">
            <input
              type="text"
              placeholder="Ex: Soins intensifs post-AVC..."
              className="flex-1 border border-stone-300 rounded-lg p-2 font-medium"
              value={newServiceInput}
              onChange={(e) => setNewServiceInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-chiro-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-chiro-light-blue transition cursor-pointer"
            >
              Ajouter
            </button>
          </form>
        </div>

        {/* Contact panel editor */}
        <div className="bg-white rounded-2xl border border-slate-205 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-450 border-b pb-3">4. Carte de visites / Contacts (Pied de story)</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label htmlFor="clinic-phone-input" className="font-bold text-slate-600">Téléphone</label>
              <input 
                id="clinic-phone-input"
                type="text" 
                className="w-full border border-stone-300 rounded-lg p-1.5" 
                value={clinicPhone} 
                onChange={(e) => setClinicPhone(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="clinic-url-input" className="font-bold text-slate-600">Site Web Web</label>
              <input 
                id="clinic-url-input"
                type="text" 
                className="w-full border border-stone-300 rounded-lg p-1.5" 
                value={clinicUrl} 
                onChange={(e) => setClinicUrl(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="clinic-addr-input" className="font-bold text-slate-600">Adresse</label>
              <input 
                id="clinic-addr-input"
                type="text" 
                className="w-full border border-stone-300 rounded-lg p-1.5" 
                value={clinicAddress} 
                onChange={(e) => setClinicAddress(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="clinic-city-input" className="font-bold text-slate-600">Ville / Commune</label>
              <input 
                id="clinic-city-input"
                type="text" 
                className="w-full border border-stone-300 rounded-lg p-1.5" 
                value={clinicCity} 
                onChange={(e) => setClinicCity(e.target.value)} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* 2. Right Canvas presentation panel (Xl: 7 columns) */}
      <div className="xl:col-span-7 flex flex-col items-center justify-start py-4 space-y-6" id="canva-canvas-presentation">
        
        {/* Header toolbar */}
        <div className="w-full max-w-[390px] md:max-w-xl bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-700">Rendu Canva WYSIWYG Actif</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`px-4 py-2 bg-[#0F2D37] hover:bg-[#163B48] disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Exporter (.PNG)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Mockup Container */}
        <div className="relative flex flex-col items-center justify-center">
          
          {/* Subtle dotted background grid simulating professional editor */}
          <div className="absolute inset-x-[-120px] inset-y-[-40px] bg-[radial-gradient(#e5e7eb_1.2px,transparent_1.2px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_55%_at_50%_50%,#000_60%,transparent_100%)] opacity-60 z-0 pointer-events-none hidden md:block" />

          {/* Interactive Canva Instagram Story representation (9:16 vertical container) */}
          <div 
            id="canva-instagram-story-canvas"
            className={`w-[360px] md:w-[390px] h-[640px] md:h-[690px] rounded-[32px] shadow-2xl border-4 border-slate-900 overflow-hidden relative transition-colors duration-300 font-sans ${activeTheme.bgColor} flex flex-col justify-between p-8 z-10`}
          >
            {/* Top decorative header: Canva subtle borders and leaf shapes or sparkle dots */}
            <div className="absolute top-0 left-0 w-full pointer-events-none overflow-hidden select-none">
              {/* Canva sparkle grids or cross shapes */}
              <div className="absolute top-8 left-8 opacity-25">
                <span className={`text-[15px] font-mono ${activeTheme.textColor}`}>✿</span>
              </div>
              <div className="absolute top-10 right-10 opacity-30">
                <span className={`text-[12px] font-sans font-bold tracking-widest ${activeTheme.accentColor}`}>◆</span>
              </div>
              <div className="absolute top-24 left-1/2 -translate-x-1/2 opacity-10">
                <span className="text-6xl font-bold font-serif font-black tracking-tighter text-[#0F2D37]">CLINIQUE</span>
              </div>
            </div>

            {/* Content Segment 1: Head Slogans */}
            <div className="space-y-4 pt-4 text-center select-none relative z-10">
              <span className={`text-[10px] tracking-[0.25em] font-extrabold uppercase ${activeTheme.accentColor} block font-sans`}>
                {storySubheader}
              </span>
              
              <h1 className={`text-2xl md:text-3xl font-serif font-black text-slate-900 tracking-tight leading-none ${activeTheme.textColor}`}>
                {storyTitle}
              </h1>

              <div className="w-14 h-[2px] bg-[#C5A880]/60 mx-auto rounded-full" />
            </div>

            {/* Content Segment 2: Elegant framed portrait of Doctor with double borders */}
            <div className="flex flex-col items-center justify-center relative my-4 select-none z-10">
              {/* Canva classic double frame around candidate image */}
              <div className="relative">
                {/* Background decorative background gold disc */}
                <div 
                  className={`absolute -inset-1.5 rounded-full border border-dashed ${activeTheme.borderColor} opacity-60 animate-spin-slow`} 
                />

                <div className={`overflow-hidden border-2 border-white shadow-xl ${
                  imageBorderShape === 'oval' 
                    ? 'w-36 h-48 rounded-full aspect-[3/4]' 
                    : imageBorderShape === 'circle'
                    ? 'w-36 h-36 rounded-full aspect-square'
                    : 'w-36 h-44 rounded-2xl aspect-[4/5]'
                } transition-all duration-300`}>
                  <img
                    src={doctorPortrait}
                    alt="Clinic Medical Doctor Portrait"
                    className="w-full h-full object-cover transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Sparkling Canva elements ornament at borders */}
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-stone-200">
                  <div className="p-1 px-1.5 bg-[#FCFAF7] text-chiro-gold rounded-full text-[9px] font-black tracking-widest leading-none">
                    ⭐
                  </div>
                </div>
              </div>

              {/* Dynamic Doctor Credentials Badge */}
              <div className="text-center mt-3.5 space-y-0.5">
                <span className={`text-[13px] font-extrabold block text-slate-805 ${activeTheme.textColor}`}>
                  Dr. {activeDr.Prenom_Prat} {activeDr.Nom_Prat}
                </span>
                <span className={`text-[9.5px] font-bold block opacity-75 uppercase tracking-wide px-2 py-0.5 bg-slate-900/5 rounded-full text-slate-600 ${activeTheme.accentColor}`}>
                  {getSpecialtyLabel(activeDr.Repere)}
                </span>
              </div>
            </div>

            {/* Content Segment 3: Brief Clinique Slogan & Listed Actions */}
            <div className="space-y-4 select-none relative z-10">
              <p className={`text-[11.5px] leading-relaxed text-center font-sans tracking-wide max-w-[280px] mx-auto opacity-90 ${activeTheme.textColor}`}>
                {storyDescription}
              </p>

              {/* Bullet points mimicking Canva story list with gold accents */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 max-w-[290px] mx-auto text-[10.5px]">
                {itemServices.map((service, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-chiro-gold font-bold">✔</span>
                    <span className={`font-semibold line-clamp-1 ${activeTheme.textColor}`}>
                      {service}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Segment 4: Solid visual CTA box at bottom, matching template */}
            <div className="space-y-3 pt-3 select-none relative z-10">
              <div className="w-full h-[1px] bg-slate-205/60" />
              
              {/* Contact Grid with tiny micro-icons */}
              <div className="grid grid-cols-1 gap-2 bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-stone-105">
                
                {/* Heading info */}
                <div className="text-center text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-chiro-gold animate-pulse" />
                  <span>Prendre rendez-vous :</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-sans px-2">
                  <div className="flex items-center gap-1 text-slate-700 font-bold">
                    <Phone className="w-3.5 h-3.5 text-chiro-gold" />
                    <span>Tél : {clinicPhone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-705 font-medium">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{clinicUrl}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-500 px-2 justify-center border-t border-stone-200/50 pt-1.5">
                  <MapPin className="w-3 h-3 text-chiro-gold" />
                  <span className="truncate">{clinicAddress}, {clinicCity}</span>
                </div>

              </div>

              {/* Instagram Badge */}
              <div className="flex items-center justify-center gap-1 opacity-55 text-[9px] text-slate-400 font-mono">
                <Instagram className="w-3 h-3" />
                <span>@chirolift_clinique • Canva-Design</span>
              </div>
            </div>

          </div>

          {/* Real-time interactive export status layer */}
          <AnimatePresence>
            {isExporting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs rounded-[32px] z-50 flex flex-col items-center justify-center text-white space-y-4 p-8 text-center"
              >
                <div className="p-4 bg-white/10 rounded-full animate-spin">
                  <RefreshCw className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">Rendu Canva HD en cours...</h4>
                  <p className="text-xs text-slate-350 mt-1 max-w-[240px]">
                    Compilation de la charte de couleurs, des images et des données cliniques pour un rendu ultra haute-résolution.
                  </p>
                </div>
                <div className="w-36 bg-slate-600/30 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full animate-loading-bar" style={{ width: '100%', animationDuration: '2.5s' }} />
                </div>
              </motion.div>
            )}

            {exportComplete && !isExporting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4 right-4 bg-emerald-900 border border-emerald-700/85 text-white rounded-2xl p-4 shadow-xl z-25 flex items-start gap-3"
                onClick={() => setExportComplete(false)}
              >
                <div className="p-1.5 bg-emerald-950 rounded-full text-emerald-300">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs flex-1">
                  <span className="font-bold block">Story Prête Pour Exportation !</span>
                  <p className="text-slate-200 mt-0.5">Le fichier image a été simulé et mis à disposition dans votre dossier de publication sociale locale.</p>
                </div>
                <button className="text-emerald-300 text-[10px] font-bold" onClick={() => setExportComplete(false)}>Fermer</button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
};
