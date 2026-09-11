import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Activity, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  UserCheck, 
  Coins, 
  Sliders, 
  Heart, 
  RotateCcw, 
  ChevronRight, 
  Hospital,
  ShieldCheck,
  LogOut,
  Pin,
  PinOff,
  Stethoscope,
  Power
} from "lucide-react";

interface SidebarProps {
  currentRole: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleRoleChange: (role: string) => void;
  handleResetApplicationState: () => void;
  patientsCount: number;
  userSession?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  handleRoleChange,
  handleResetApplicationState,
  patientsCount,
  userSession,
  onLogout
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  // Glassmorphic & Gold 3D Icon Renderer
  const renderGlassIcon = (IconComponent: any, active: boolean, size: string = "w-4 h-4") => {
    return (
      <div className={`glass-gold-icon-container ${active ? 'active-glass-gold-button' : ''} flex-shrink-0`}>
        <IconComponent className={`${size} glass-gold-icon`} />
      </div>
    );
  };

  const isAllowedTab = (tab: string) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'mpr_doctor' || currentRole === 'egypt_doctor' || currentRole === 'recept_rdc') {
      return ['consultation', 'patients'].includes(tab);
    }
    if (currentRole === 'recept_balneo') {
      return ['scheduler_balneo', 'patients'].includes(tab);
    }
    if (currentRole === 'recept_adultes') {
      return ['scheduler_kine', 'patients'].includes(tab);
    }
    if (currentRole === 'recept_intensif') {
      return ['intensif_2', 'intensif_3', 'intensif_4', 'patients'].includes(tab);
    }
    return false;
  };

  return (
    <motion.aside 
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className={`bg-white text-slate-600 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-slate-100 shadow-sm relative transition-all duration-300 ease-in-out z-40 ${
        isExpanded ? 'w-full md:w-72' : 'w-full md:w-20'
      }`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="sidebar-navigator"
    >
      <div className={`p-5 space-y-6 overflow-hidden ${isExpanded ? '' : 'flex flex-col items-center'}`}>
        {/* Clinic Brand Area */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-50" id="clinic-logo-head">
          <div className="flex items-center gap-3">
            {renderGlassIcon(Hospital, true, "w-6 h-6")}
            {isExpanded && (
              <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="font-black text-sm tracking-tight text-charcoal-900 uppercase">KACEL Santé MPR</h1>
                <span className="text-[9.5px] font-bold text-teal-600 font-mono tracking-widest uppercase block">Portail Médical</span>
              </div>
            )}
          </div>
          {isExpanded && (
          <button 
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 rounded-lg transition-all border ${
              isPinned 
                ? 'bg-teal-50 border-teal-100 text-teal-600' 
                : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-100'
            }`}
            title={isPinned ? "Détacher le menu" : "Fixer le menu"}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          )}
        </div>

          <div className={`bg-slate-50 rounded-2xl border border-slate-100 shadow-xs text-left overflow-hidden transition-all duration-300 ${isExpanded ? 'p-3 space-y-2' : 'p-1.5 flex flex-col items-center'}`}>
            <div className={`flex items-center justify-between pb-1 border-b border-slate-100 w-full ${isExpanded ? '' : 'hidden'}`}>
              <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Session active</span>
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="text-red-500 hover:text-red-600 font-bold text-[7px] uppercase tracking-wide flex items-center gap-1 cursor-pointer bg-red-50 px-1.5 py-0.5 rounded border border-red-100 transition-colors"
                >
                  <LogOut className="w-2 h-2" />
                  Quitter
                </button>
              )}
            </div>
            {isExpanded ? (
              <div className="space-y-0.5 animate-in fade-in duration-300">
                <p className="text-[11px] font-black text-charcoal-900 truncate">{userSession?.name || 'Session Publique'}</p>
                <p className="text-[9px] font-bold text-teal-600 uppercase tracking-tighter">{userSession?.roleLabel || currentRole.toUpperCase()}</p>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[10px] font-black text-teal-600 border border-teal-100">
                {userSession?.name?.charAt(0) || 'P'}
              </div>
            )}

            {currentRole === 'admin' && isExpanded && (
              <div className="pt-2 mt-1 border-t border-slate-200/50 animate-in fade-in duration-300">
                <select
                  value={currentRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-teal-300 p-1.5 rounded-xl text-[9px] text-slate-600 font-bold focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
                >
                  <option value="admin">🦸 Admin Local</option>
                  <option value="recept_balneo">🌊 Balnéothérapie</option>
                  <option value="recept_adultes">🏋️ Kiné Adultes</option>
                  <option value="recept_intensif">🚼 Pédiatrie</option>
                  <option value="mpr_doctor">🩺 Médecin MPR</option>
                  <option value="egypt_doctor">🩺 Médecin Égypt.</option>
                  <option value="recept_rdc">🏢 Réception RDC</option>
                </select>
              </div>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5" id="sidebar-main-menu">
            {isExpanded && (
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 font-mono block pl-2 mb-1.5 opacity-80 animate-in fade-in duration-300">
                Modules Cliniques
              </span>
            )}
            
            {isAllowedTab('dashboard') && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'dashboard' 
                    ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Indicateurs"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Activity, activeTab === 'dashboard')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Tableau de bord</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Vue d'ensemble</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'dashboard' ? 'text-teal-500 transform translate-x-1' : 'text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('patients') && (
              <button
                onClick={() => setActiveTab('patients')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'patients' 
                    ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Patients"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Users, activeTab === 'patients')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Patients</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Base de données</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'patients' ? 'text-teal-500 transform translate-x-1' : 'text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('consultation') && (
              <button
                onClick={() => setActiveTab('consultation')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'consultation' && (currentRole === 'mpr_doctor' || currentRole === 'admin')
                    ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Médecin MPR"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Stethoscope, activeTab === 'consultation' && currentRole === 'mpr_doctor')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Médecin MPR</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Consultations & Suivi</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'consultation' ? 'text-indigo-500 transform translate-x-1' : 'text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('consultation') && (
              <button
                onClick={() => setActiveTab('consultation')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'consultation' 
                    ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Consultations"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(UserCheck, activeTab === 'consultation')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">File d'attente</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Flux médical & Caisse</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'consultation' ? 'text-teal-500 transform translate-x-1' : 'text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('contracts') && (
              <button
                onClick={() => setActiveTab('contracts')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'contracts' 
                    ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Abonnements"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Briefcase, activeTab === 'contracts')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Forfaits</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Contrats & Carnets</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'contracts' ? 'text-teal-500 transform translate-x-1' : 'text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('scheduler_balneo') && (
              <button
                onClick={() => setActiveTab('scheduler_balneo')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'scheduler_balneo' 
                    ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Balnéothérapie"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Calendar, activeTab === 'scheduler_balneo')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Balnéothérapie</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Planning Bassin</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'scheduler_balneo' ? 'text-blue-500 transform translate-x-1' : 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('scheduler_kine') && (
              <button
                onClick={() => setActiveTab('scheduler_kine')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'scheduler_kine' 
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Kiné Adulte"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Calendar, activeTab === 'scheduler_kine')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Kiné Adulte</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Gymnase Thérapeutique</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'scheduler_kine' ? 'text-emerald-500 transform translate-x-1' : 'text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('intensif_2') && (
              <button
                onClick={() => setActiveTab('intensif_2')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'intensif_2' 
                    ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Pédiatrie Étage 2"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Clock, activeTab === 'intensif_2')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Pédiatrie É2</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Service Intensif</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'intensif_2' ? 'text-indigo-500 transform translate-x-1'  : 'text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('accounting') && (
              <button
                onClick={() => setActiveTab('accounting')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'accounting' 
                    ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-500 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Comptabilité"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Coins, activeTab === 'accounting')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Recettes</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Bilan & Stats</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'accounting' ? 'text-teal-500 transform translate-x-1' : 'text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1'}`} />}
              </button>
            )}

            {isAllowedTab('settings') && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-205 cursor-pointer group active-glass-gold-button ${
                  activeTab === 'settings' 
                    ? 'bg-slate-100 text-charcoal-900 font-bold border-l-4 border-charcoal-900 shadow-xs' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-charcoal-900'
                } ${isExpanded ? '' : 'justify-center'}`}
                title={isExpanded ? "" : "Réglages"}
              >
                <div className="flex items-center gap-3">
                  {renderGlassIcon(Sliders, activeTab === 'settings')}
                  {isExpanded && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Paramètres</span>
                      <span className="text-[8.5px] text-slate-400 group-hover:text-slate-500 font-medium">Config. Système</span>
                    </div>
                  )}
                </div>
                {isExpanded && <ChevronRight className={`w-3.5 h-3.5 transition-all duration-250 ${activeTab === 'settings' ? 'text-charcoal-900 transform translate-x-1' : 'text-slate-300 group-hover:text-charcoal-500 group-hover:translate-x-1'}`} />}
              </button>
            )}
          </nav>
      </div>

      {/* Bottom actions - administrative settings restoration */}
      <div className={`p-5 border-t border-slate-50 bg-slate-50/30 text-xs flex flex-col gap-3 transition-all duration-300 ${isExpanded ? '' : 'items-center'}`} id="sidebar-foot-config">
        {isExpanded ? (
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-slate-500">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">File Active :</span>
            </div>
            <span className="text-teal-600 font-extrabold text-[11px] font-mono">{patientsCount}</span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-teal-600 shadow-xs" title={`${patientsCount} patients`}>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
          </div>
        )}
        
        {currentRole === 'admin' && (
          <button
            onClick={handleResetApplicationState}
            id="reset-db-btn"
            className={`flex items-center justify-center gap-2 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-slate-400 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all cursor-pointer border border-slate-100 shadow-xs ${isExpanded ? 'w-full' : 'p-2.5'}`}
            title="RAZ Système"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isExpanded && <span className="animate-in fade-in duration-300">Réinitialisation</span>}
          </button>
        )}

        {/* HELPER BOX FOR ZIP EXPORT AND GITHUB */}
        {isExpanded && (
          <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-normal font-sans text-left space-y-1 animate-in fade-in duration-300">
            <p className="font-bold text-teal-600 flex items-center gap-1">📦 Export ZIP & GitHub :</p>
            <p className="text-[9px]">
              Exportez via <strong>Settings</strong> en haut à droite.
            </p>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
