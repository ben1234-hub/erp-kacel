/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Activity, AlertTriangle, ShieldCheck, CheckCircle2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { DatabaseState, Utilisateur, getRemainingSessions } from '../dbStore';

interface AnalyticsHeaderProps {
  dbState: DatabaseState;
  currentUser: Utilisateur;
  onUserChange: (user: Utilisateur) => void;
  selectedDate: string;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  dbState,
  currentUser,
  onUserChange,
  selectedDate,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
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

  // Compute some interesting medical statistics safely
  const todayRDVs = dbState.rendezVous.filter((r) => r.Date_RDV === selectedDate);
  const activeAbns = dbState.abonnements.filter((a) => {
    const today = new Date().toISOString().split('T')[0];
    return a.Date_Fin_Abn >= today;
  });

  // Calculate if there are any Balneo mismatches on today's scheduled list to highlight safety compliance
  let balneoMismatchesCount = 0;
  todayRDVs.forEach((rdv) => {
    // If Balneo zone (ID_Zone === 3)
    if (rdv.ID_Zone === 3) {
      const patient = dbState.patients.find((p) => p.ID_Patient === rdv.ID_Patient);
      if (patient) {
        // Find if rules allow this gender
        const dateObj = new Date(rdv.Date_RDV);
        let dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0) dayOfWeek = 7;
        const startHour = parseInt(rdv.H_Debut_RDV.split(':')[0], 10);
        const period = startHour < 13 ? 'Matin' : 'Apres-midi';

        const matchingRule = dbState.reglesBalneo.find(
          (r) => r.Jour_Semaine === dayOfWeek && r.Demi_Journee === period
        );
        if (matchingRule && patient.Genre_Patient !== matchingRule.Genre_Autorise) {
          balneoMismatchesCount++;
        }
      }
    }
  });

  // Calculate total consumed forfait sessions relative to total packs count
  const totalCompletedSessions = dbState.seances.length;

  return (
    <div className="bg-gradient-to-r from-[#0F2D37] to-[#1D4452] text-white rounded-3xl p-6 shadow-xl border border-[#2b515f] mb-6" id="analytics-header">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-[#2b515f] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#9bb8ba]/25 text-[#c5dfdf] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-sans">
              Système de Sécurité Active Connecté
            </span>
            <span className="text-yellow-400 font-bold text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> IMC Priority Care
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black font-serif tracking-tight text-white flex items-center gap-2">
            <Activity className="text-white w-6 h-6" />
            Gestion Médicale &amp; Planning Clinique
          </h1>
          <p className="text-[#a2cbcd] text-xs font-medium font-sans mt-1">
            Contrôle automatique de mixité en Balnéothérapie, surcharge en Soins Intensifs et cohérence des Abonnements.
          </p>
        </div>

        {/* Fullscreen & Profile Info Badge */}
        <div className="flex items-center gap-3">
          <button
            id="fullscreen-toggle-admin"
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white font-extrabold text-xs rounded-xl transition duration-150 cursor-pointer shadow-md"
            title="Basculer Plein Écran"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-[#9bb8ba]" />
                <span className="hidden sm:inline">Fenêtré</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-[#9bb8ba]" />
                <span className="hidden sm:inline">Plein écran</span>
              </>
            )}
          </button>

          {/* Profile Info Badge (Read Only) */}
          <div className="bg-[#245263] border border-[#3b6f84] p-3.5 px-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg text-white">
              <User className="w-4 h-4 text-[#9bb8ba]" />
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-[#a2cbcd] font-black mb-0.5">
                Administrateur Actif
              </span>
              <span className="text-xs font-black text-white block">
                {currentUser.Nom_Utilisateur}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-[#9bb8ba]/25 flex items-start justify-between shadow-xs" id="kpi-today-rdvs">
          <div>
            <p className="text-[10px] font-bold text-[#32525c] uppercase tracking-wider">RDV Planifiés Aujourd'hui</p>
            <h3 className="text-2xl font-black mt-1 text-[#102e3b]">{todayRDVs.length}</h3>
            <p className="text-[#5e828f] text-[11px] mt-1">Saisie sur le planning du {selectedDate}</p>
          </div>
          <div className="p-2.5 bg-[#c8e0de] text-[#102e3b] rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-[#9bb8ba]/25 flex items-start justify-between shadow-xs" id="kpi-active-forfaits">
          <div>
            <p className="text-[10px] font-bold text-[#32525c] uppercase tracking-wider">Abonnements Actifs</p>
            <h3 className="text-2xl font-black mt-1 text-[#306568]">{activeAbns.length} Patients</h3>
            <p className="text-[#5e828f] text-[11px] mt-1">Contrats actifs répertoriés</p>
          </div>
          <div className="p-2.5 bg-[#c8e0de] text-chiro-gold rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-[#9bb8ba]/25 flex items-start justify-between shadow-xs" id="kpi-balneo-safety">
          <div>
            <p className="text-[10px] font-bold text-[#32525c] uppercase tracking-wider">Sécurité Mixité Balnéo</p>
            <h3 className={`text-2xl font-black mt-1 ${balneoMismatchesCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {balneoMismatchesCount > 0 ? `${balneoMismatchesCount} Anomalie(s)` : '100% Conforme'}
            </h3>
            <p className="text-[#5e828f] text-[11px] mt-1">
              {balneoMismatchesCount > 0 ? 'Erreurs de genre sur planning!' : 'Aucun écart détecté'}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${balneoMismatchesCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-[#c8e0de] text-chiro-gold'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-[#9bb8ba]/25 flex items-start justify-between shadow-xs" id="kpi-total-seances">
          <div>
            <p className="text-[10px] font-bold text-[#32525c] uppercase tracking-wider">Séances Réalisées / Facturées</p>
            <h3 className="text-2xl font-black mt-1 text-[#1a414e]">{totalCompletedSessions} Actes</h3>
            <p className="text-[#5e828f] text-[11px] mt-1">Historique des séances honorées</p>
          </div>
          <div className="p-2.5 bg-[#c8e0de] text-[#102e3b] rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
