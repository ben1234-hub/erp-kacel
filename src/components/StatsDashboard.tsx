/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { 
  BarChart3, Users, Clock, CalendarDays, CheckCircle2, TrendingUp, ShieldAlert, MapPin, Award,
  ChevronLeft, ChevronRight, Calendar, X, Check, RotateCcw, FileText, Coins, Activity, Filter, ListOrdered,
  ChevronDown, Search
} from 'lucide-react';
import { DatabaseState, calculateAge } from '../dbStore';
import { WILAYAS } from './PatientsManager';

interface StatsDashboardProps {
  dbState: DatabaseState;
  onSave?: (next: DatabaseState) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ dbState, onSave }) => {
  const [activeTab, setActiveTab] = React.useState<'global' | 'abonnés' | 'rapport_activite'>('global');
  const [showPeriodModal, setShowPeriodModal] = React.useState(false);
  const [startDate, setStartDate] = React.useState('2026-01-01');
  const [endDate, setEndDate] = React.useState('2026-12-31');
  const [confirmedPeriod, setConfirmedPeriod] = React.useState<{ start: string; end: string } | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  // States for Rapport d'Activité
  const [rptStartDate, setRptStartDate] = React.useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [rptEndDate, setRptEndDate] = React.useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
    return `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  });
  const [selectedPratId, setSelectedPratId] = React.useState<number | null>(null);
  const [rapportSubTab, setRapportSubTab] = React.useState<'praticiens' | 'services' | 'centre'>('praticiens');
  const [searchPratName, setSearchPratName] = React.useState('');
  const [filterPratFonction, setFilterPratFonction] = React.useState<string[]>([]);
  const [filterPratAffectation, setFilterPratAffectation] = React.useState<string[]>([]);

  // Filter columns states: Uniform (Patient type, Option libelle, Option Prix, Option Nbre Abn, Séances Abn, Séances Cons, Séances Rest)
  const [filterPatient, setFilterPatient] = React.useState<string[]>([]);
  const [filterLibelle, setFilterLibelle] = React.useState<string[]>([]);
  const [filterPrix, setFilterPrix] = React.useState<number[]>([]);
  const [filterNbreAbn, setFilterNbreAbn] = React.useState<number[]>([]);
  const [filterSeancesAbn, setFilterSeancesAbn] = React.useState<number[]>([]);
  const [filterSeancesCons, setFilterSeancesCons] = React.useState<number[]>([]);
  const [filterSeancesRest, setFilterSeancesRest] = React.useState<number[]>([]);

  // Non-uniform columns states: Versements (search text)
  const [searchVersements, setSearchVersements] = React.useState('');

  // States for physical medical prescription origins
  const [searchOriginQuery, setSearchOriginQuery] = React.useState('');
  const [filterOriginType, setFilterOriginType] = React.useState<string>('all');

  const [activeFilterMenu, setActiveFilterMenu] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeFilterMenu && !target.closest('[data-filter-dropdown="true"]')) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilterMenu]);

  // Pre-calculate full details for active period list
  const subscribersWithDetails = React.useMemo(() => {
    if (!confirmedPeriod) return [];
    return dbState.abonnements
      .filter(abn => {
        if (!abn.Date_Debut_Abn) return false;
        return abn.Date_Debut_Abn >= confirmedPeriod.start && abn.Date_Debut_Abn <= confirmedPeriod.end;
      })
      .map(abn => {
        const patient = dbState.patients.find(p => p.ID_Patient === abn.ID_Patient);
        const pack = dbState.packs ? dbState.packs.find(pk => pk.ID_Pack === abn.ID_Pack) : null;
        const abnVersements = dbState.versements.filter(v => v.ID_Abn === abn.ID_Abn);
        const totalPaid = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
        const packSessions = pack?.Nbre_Seance_Pack || 0;
        const consumedSessions = abn.Nbre_Sean_Consom_Abn || 0;
        
        return {
          abn,
          patient,
          pack,
          typePatient: patient?.type_patient || 'Adulte',
          libellePack: pack?.Libelle_Pack || 'Abonnement Spécifique',
          prixPack: pack?.Prix_Pack || 0,
          totalPaid,
          totalPaidStr: totalPaid ? `${totalPaid.toLocaleString()} DA` : '0 DA',
          consumedSessions,
          packSessions,
          remainingSessions: packSessions - consumedSessions,
          seancesStr: `${consumedSessions} / ${packSessions}`,
          nbreAbnPat: patient?.Nbre_Abn_Pat ?? 0
        };
      });
  }, [dbState, confirmedPeriod]);

  // Pre-calculate prescription origins for clinical intelligence unit
  const prescriptionOrigins = React.useMemo(() => {
    const ORIGIN_TYPES = {
      interne: 'MPR du Centre (Interne)',
      chu: 'CHUs & Hôpitaux Publics (Externe)',
      clinique: 'Cliniques Chirurgicales Privées (Externe)',
      cabinet: 'Cabinets de Spécialités Libéraux (Externe)',
      controle: 'Hôpital Militaire & Caisses Régionales (Externe)'
    };

    const PRESCRIBERS = [
      { name: 'Dr. Belhadj (MPR Interne)', type: 'interne', etablissement: 'Maison de Rééducation' },
      { name: 'Prof. Amara (Neurochirurgie)', type: 'chu', etablissement: 'CHU Mustapha Bacha' },
      { name: 'Dr. Benabbes (Orthopédie)', type: 'clinique', etablissement: 'Clinique El-Djawhara' },
      { name: 'Dr. Merad (Rhumatologie)', type: 'cabinet', etablissement: 'Cabinet de Rhumatologie Alger' },
      { name: 'Prof. Kaddour (Traumatologie)', type: 'chu', etablissement: 'EPH Bab El Oued' },
      { name: 'Dr. Chérif (Neurologie Libérale)', type: 'cabinet', etablissement: 'Cabinet de Neurologie Hydra' },
      { name: 'Service d\'Orthopédie Militaire', type: 'controle', etablissement: 'Hôpital Militaire d\'Aïn Naâdja' },
      { name: 'Dr. Mansouri (Rhumatologue Privé)', type: 'cabinet', etablissement: 'Cabinet Libre de Blida' }
    ];

    const patientsWithOrigin = dbState.patients.map(patient => {
      // Deterministic key generation from patient id
      let pIdNum = 0;
      if (typeof patient.ID_Patient === 'number') {
        pIdNum = patient.ID_Patient;
      } else if (patient.id) {
        const match = patient.id.match(/\d+/);
        pIdNum = match ? parseInt(match[0], 10) : 1;
      } else {
        pIdNum = 1;
      }

      // If patient's organism is military, assign Military hospital
      let presc = PRESCRIBERS[(pIdNum * 3 + 1) % PRESCRIBERS.length];
      if (patient.organisme === 'MILITAIRE' || patient.organisme === 'Militaire') {
        presc = PRESCRIBERS[6]; // Hôpital Militaire d'Aïn Naâdja
      }

      return {
        ...patient,
        prescripteurName: presc.name,
        prescripteurType: presc.type,
        prescripteurTypeName: ORIGIN_TYPES[presc.type as keyof typeof ORIGIN_TYPES],
        etablissement: presc.etablissement
      };
    });

    // Compute type distribution counts
    const typeDistribution: { [key: string]: { id: string; name: string; count: number; color: string; hoverColor: string } } = {
      interne: { id: 'interne', name: 'MPR Interne (Consultations du Centre)', count: 0, color: '#606C5A', hoverColor: '#4E5849' },
      chu: { id: 'chu', name: 'CHUs & Hôpitaux Publics', count: 0, color: '#3B82F6', hoverColor: '#2563EB' },
      clinique: { id: 'clinique', name: 'Cliniques Chirurgicales Privées', count: 0, color: '#0D9488', hoverColor: '#0F766E' },
      cabinet: { id: 'cabinet', name: 'Cabinets Libéraux Spécialisés', count: 0, color: '#8B5CF6', hoverColor: '#7C3AED' },
      controle: { id: 'controle', name: 'Hôpital Militaire & Caisses Régionales', count: 0, color: '#D97706', hoverColor: '#B45309' }
    };

    // Compute individual prescribers counts
    const individualPrescribers: { [key: string]: { name: string; type: string; typeLabel: string; etablissement: string; count: number } } = {};

    patientsWithOrigin.forEach(p => {
      if (typeDistribution[p.prescripteurType]) {
        typeDistribution[p.prescripteurType].count += 1;
      } else {
        typeDistribution.interne.count += 1;
      }

      const key = p.prescripteurName;
      if (!individualPrescribers[key]) {
        individualPrescribers[key] = {
          name: p.prescripteurName,
          type: p.prescripteurType,
          typeLabel: p.prescripteurTypeName,
          etablissement: p.etablissement,
          count: 0
        };
      }
      individualPrescribers[key].count += 1;
    });

    const listTypes = Object.values(typeDistribution).sort((a, b) => b.count - a.count);
    const listPrescribers = Object.values(individualPrescribers).sort((a, b) => b.count - a.count);

    return {
      patientsWithOrigin,
      listTypes,
      listPrescribers
    };
  }, [dbState.patients]);

  const filteredOriginsPatients = React.useMemo(() => {
    return prescriptionOrigins.patientsWithOrigin.filter(p => {
      const name = p.Nom_Patient || (p as any).name || '';
      const pathology = p.dossier_medical || (p as any).pathology || '';
      const prescripteurName = p.prescripteurName || '';
      const etablissement = p.etablissement || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchOriginQuery.toLowerCase()) ||
        prescripteurName.toLowerCase().includes(searchOriginQuery.toLowerCase()) ||
        etablissement.toLowerCase().includes(searchOriginQuery.toLowerCase()) ||
        pathology.toLowerCase().includes(searchOriginQuery.toLowerCase());
      
      const matchesType = filterOriginType === 'all' || p.prescripteurType === filterOriginType;

      return matchesSearch && matchesType;
    });
  }, [prescriptionOrigins.patientsWithOrigin, searchOriginQuery, filterOriginType]);

  // Filter evaluation logic with optional exclusion of one criterion
  const checkMatches = React.useCallback((item: any, excludeKey?: string) => {
    // 1. Patient Type Filter (Uniform)
    if (excludeKey !== 'patient' && filterPatient.length > 0 && !filterPatient.includes(item.typePatient)) {
      return false;
    }
    // 2. Libellé Forfait Filter (Uniform)
    if (excludeKey !== 'libelle' && filterLibelle.length > 0 && !filterLibelle.includes(item.libellePack)) {
      return false;
    }
    // 3. Prix Pack Filter (Uniform)
    if (excludeKey !== 'prix' && filterPrix.length > 0 && !filterPrix.includes(item.prixPack)) {
      return false;
    }
    // 4. Nombre Abn Filter (Uniform)
    if (excludeKey !== 'nbreAbn' && filterNbreAbn.length > 0 && !filterNbreAbn.includes(item.nbreAbnPat)) {
      return false;
    }
    // 5. Versements (Non-Uniform search)
    if (excludeKey !== 'versements' && searchVersements) {
      const q = searchVersements.toLowerCase();
      const matchPaid = item.totalPaid.toString().includes(q) || item.totalPaidStr.toLowerCase().includes(q);
      if (!matchPaid) return false;
    }
    // 6. Séances Abonnement Filter (Uniform)
    if (excludeKey !== 'seancesAbn' && filterSeancesAbn.length > 0 && !filterSeancesAbn.includes(item.packSessions)) {
      return false;
    }
    // 7. Séances Consommées Filter (Uniform)
    if (excludeKey !== 'seancesCons' && filterSeancesCons.length > 0 && !filterSeancesCons.includes(item.consumedSessions)) {
      return false;
    }
    // 8. Séances Restantes Filter (Uniform)
    if (excludeKey !== 'seancesRest' && filterSeancesRest.length > 0 && !filterSeancesRest.includes(item.remainingSessions)) {
      return false;
    }
    return true;
  }, [filterPatient, filterLibelle, filterPrix, filterNbreAbn, searchVersements, filterSeancesAbn, filterSeancesCons, filterSeancesRest]);

  // Compute occurrences of the values over the complete pool of the selected period with facet filtering
  const occurrences = React.useMemo(() => {
    const typePatientCount: { [key: string]: number } = {};
    const libellePackCount: { [key: string]: number } = {};
    const prixPackCount: { [key: string]: number } = {};
    const nbreAbnPatCount: { [key: string]: number } = {};
    const seancesAbnCount: { [key: number]: number } = {};
    const seancesConsCount: { [key: number]: number } = {};
    const seancesRestCount: { [key: number]: number } = {};

    subscribersWithDetails.forEach(item => {
      if (checkMatches(item, 'patient')) {
        typePatientCount[item.typePatient] = (typePatientCount[item.typePatient] || 0) + 1;
      }
      if (checkMatches(item, 'libelle')) {
        libellePackCount[item.libellePack] = (libellePackCount[item.libellePack] || 0) + 1;
      }
      if (checkMatches(item, 'prix')) {
        prixPackCount[item.prixPack] = (prixPackCount[item.prixPack] || 0) + 1;
      }
      if (checkMatches(item, 'nbreAbn')) {
        nbreAbnPatCount[item.nbreAbnPat] = (nbreAbnPatCount[item.nbreAbnPat] || 0) + 1;
      }
      if (checkMatches(item, 'seancesAbn')) {
        seancesAbnCount[item.packSessions] = (seancesAbnCount[item.packSessions] || 0) + 1;
      }
      if (checkMatches(item, 'seancesCons')) {
        seancesConsCount[item.consumedSessions] = (seancesConsCount[item.consumedSessions] || 0) + 1;
      }
      if (checkMatches(item, 'seancesRest')) {
        seancesRestCount[item.remainingSessions] = (seancesRestCount[item.remainingSessions] || 0) + 1;
      }
    });

    return {
      typePatient: Object.entries(typePatientCount).map(([val, count]) => ({ val, count })),
      libellePack: Object.entries(libellePackCount).map(([val, count]) => ({ val, count })),
      prixPack: Object.entries(prixPackCount).map(([val, count]) => ({ val: Number(val), count })).sort((a,b) => a.val - b.val),
      nbreAbnPat: Object.entries(nbreAbnPatCount).map(([val, count]) => ({ val: Number(val), count })).sort((a,b) => a.val - b.val),
      seancesAbn: Object.entries(seancesAbnCount).map(([val, count]) => ({ val: Number(val), count })).sort((a,b) => a.val - b.val),
      seancesCons: Object.entries(seancesConsCount).map(([val, count]) => ({ val: Number(val), count })).sort((a,b) => a.val - b.val),
      seancesRest: Object.entries(seancesRestCount).map(([val, count]) => ({ val: Number(val), count })).sort((a,b) => a.val - b.val),
    };
  }, [subscribersWithDetails, checkMatches]);

  // Filter subscribers list dynamically
  const filteredSubscribers = React.useMemo(() => {
    return subscribersWithDetails.filter(item => checkMatches(item));
  }, [subscribersWithDetails, checkMatches]);

  // Calculations for dynamic totals bar
  const totals = React.useMemo(() => {
    let priceTotal = 0;
    let paymentsTotal = 0;
    let consumedSessionsTotal = 0;
    let packSessionsTotal = 0;

    filteredSubscribers.forEach(item => {
      priceTotal += item.prixPack;
      paymentsTotal += item.totalPaid;
      consumedSessionsTotal += item.consumedSessions;
      packSessionsTotal += item.packSessions;
    });

    return {
      count: filteredSubscribers.length,
      priceTotal,
      paymentsTotal,
      consumedSessionsTotal,
      packSessionsTotal,
    };
  }, [filteredSubscribers]);

  const uniqueVersements = React.useMemo<string[]>(() => {
    return Array.from(new Set(subscribersWithDetails.map(item => item.totalPaidStr)));
  }, [subscribersWithDetails]);

  // Check if any filters are active
  const hasActiveFilters = 
    filterPatient.length > 0 ||
    filterLibelle.length > 0 ||
    filterPrix.length > 0 ||
    filterNbreAbn.length > 0 ||
    searchVersements !== '' ||
    filterSeancesAbn.length > 0 ||
    filterSeancesCons.length > 0 ||
    filterSeancesRest.length > 0;

  const handleClearAllFilters = () => {
    setFilterPatient([]);
    setFilterLibelle([]);
    setFilterPrix([]);
    setFilterNbreAbn([]);
    setFilterSeancesAbn([]);
    setFilterSeancesCons([]);
    setFilterSeancesRest([]);
    setSearchVersements('');
    setCurrentPage(1);
    setActiveFilterMenu(null);
  };

  // Pagination helper
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage) || 1;
  const paginatedAbns = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubscribers, currentPage]);

  // Auto Reset current page if it index-overflows total pages
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleSelectAbonnesTab = () => {
    setActiveTab('abonnés');
    setShowPeriodModal(true);
  };

  const handleConfirmPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmedPeriod({ start: startDate, end: endDate });
    setShowPeriodModal(false);
    setCurrentPage(1);
  };

  const handleCancelPeriod = () => {
    setShowPeriodModal(false);
    if (!confirmedPeriod) {
      setActiveTab('global');
    }
  };

  // Aggregate Stats
  const totalPatients = dbState.patients.length;
  const totalAbonnements = dbState.abonnements.length;
  const totalRDVs = dbState.rendezVous.length;
  const totalSeances = dbState.seances.length;

  // Calcul d'honorés
  const honoresCount = dbState.rendezVous.filter(r => r.Statut_RDV === 'Honoré').length;
  const tauxPresence = totalRDVs > 0 ? Math.round((honoresCount / totalRDVs) * 100) : 0;

  // Attente MPR moyenne (File d'attente stats)
  const ticketsTermines = dbState.fileAttente.filter(q => q.Heure_Arrivee && q.Heure_Appel);
  let dMoyenneMin = 15; // default simulated
  if (ticketsTermines.length > 0) {
    let totalMin = 0;
    ticketsTermines.forEach(t => {
      const arr = t.Heure_Arrivee.split(':').map(Number);
      const app = t.Heure_Appel!.split(':').map(Number);
      const diff = (app[0] * 60 + app[1]) - (arr[0] * 60 + arr[1]);
      if (diff > 0) totalMin += diff;
    });
    dMoyenneMin = Math.round(totalMin / ticketsTermines.length) || 15;
  }

  // Patients par Wilaya
  const wilayaCounts: { [key: string]: number } = {};
  dbState.patients.forEach(p => {
    const wCode = p.wilaya || '16';
    wilayaCounts[wCode] = (wilayaCounts[wCode] || 0) + 1;
  });

  const topWilayas = Object.keys(wilayaCounts)
    .map(code => {
      const wObj = WILAYAS.find(w => w.code === code);
      return {
        name: wObj ? wObj.name : `${code} Wilaya`,
        count: wilayaCounts[code]
      };
    })
    .sort((a, b) => b.count - a.count);

  // Group by Speciality / Service
  const serviceCounts: { [key: string]: number } = {};
  dbState.rendezVous.forEach(r => {
    const prat = dbState.praticiens.find(p => p.ID_Prat === r.ID_Prat);
    const service = dbState.services.find(s => s.ID_Sce === prat?.ID_Sce);
    const name = service ? service.Libelle_Sce : 'Autres';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });

  const handleGenerateMockActivity = () => {
    if (!onSave) return;
    
    const start = new Date(rptStartDate);
    const end = new Date(rptEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    
    // Clone current database
    const nextDb = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
    nextDb.seances = nextDb.seances || [];
    
    // Clean existing seances in that range first to avoid accumulation
    nextDb.seances = nextDb.seances.filter(s => s.Date_Seanc_Realisee < rptStartDate || s.Date_Seanc_Realisee > rptEndDate);
    
    let nextSeanceId = Math.max(...nextDb.seances.map(s => s.ID_Seanc), 0) + 1;
    const patientsCount = nextDb.patients.length;
    if (patientsCount === 0) return;
    
    // For each day in the date range
    const cur = new Date(start.getTime());
    while (cur <= end) {
      const day = cur.getDay();
      // Monday(1) to Friday(5)
      if (day !== 0 && day !== 6) {
        const dateStr = cur.toISOString().split('T')[0];
        
        // For each practitioner, generate pseudo-random sessions
        nextDb.praticiens.forEach((prat, idx) => {
          const seed = (prat.ID_Prat * 7 + idx * 13) % 4 + 4; // 4 to 7 sessions per work day
          
          let startHour = 8;
          for (let i = 0; i < seed; i++) {
            const patId = nextDb.patients[(prat.ID_Prat + i * 3) % patientsCount].ID_Patient;
            
            const hStartStr = `${startHour.toString().padStart(2, '0')}:00`;
            const hEndStr = `${(startHour + 1).toString().padStart(2, '0')}:00`;
            
            nextDb.seances.push({
              ID_Seanc: nextSeanceId++,
              ID_Patient: patId,
              ID_Prat: prat.ID_Prat,
              ID_Acte: 1,
              ID_Abn: null,
              ID_RDV: null,
              H_Debut_Seanc: hStartStr,
              H_Fin_Seanc: hEndStr,
              Prix_Seanc: 1500,
              Date_Seanc_Realisee: dateStr
            });
            
            startHour += 1;
            if (startHour === 12) startHour = 13; // lunch
          }
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    
    onSave(nextDb);
  };

  return (
    <div className="space-y-6" id="dashboard-statistics-workspace">
      {/* Onglets du Module de Statistiques */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3" id="stats-header-section">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-lg font-black text-slate-900 font-sans">Module Statistique</h2>
            <p className="text-slate-500 text-xs">Indicateurs clés de performance et rapports d'activité détaillés.</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1.5" id="stats-tabs-container">
          <button
            id="tab-btn-global-stats"
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'global'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Statistiques Générales</span>
          </button>
          <button
            id="tab-btn-abonnes-stats"
            onClick={handleSelectAbonnesTab}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'abonnés'
                ? 'bg-indigo-650 bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Statistique des Abonnés</span>
          </button>
          <button
            id="tab-btn-rapport-activite"
            onClick={() => setActiveTab('rapport_activite')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'rapport_activite'
                ? 'bg-[#606C5A] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Rapport d'Activité</span>
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: GLOBAL STATS */}
      {activeTab === 'global' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Patients Enregistrés</span>
                <p className="text-2xl font-bold text-slate-800">{totalPatients}</p>
                <span className="text-[10px] text-indigo-600 font-semibold block">Dossiers administratifs</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Abonnements Actifs</span>
                <p className="text-2xl font-bold text-slate-800">{totalAbonnements}</p>
                <span className="text-[10px] text-emerald-600 font-semibold block">Crédits de soins valides</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Rendez-Vous Totaux</span>
                <p className="text-2xl font-bold text-slate-800">{totalRDVs}</p>
                <span className="text-[10px] text-amber-600 font-semibold block">Présence : {tauxPresence}% du planning</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Moyenne Attente MPR</span>
                <p className="text-2xl font-bold text-slate-800">{dMoyenneMin} min</p>
                <span className="text-[10px] text-rose-600 font-semibold block">Arrivée → Appel Box</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Charts / Distributions layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Wilaya Distribution Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Origine Géographique des Patients</h3>
                  <p className="text-slate-500 text-xs">Fréquentation et répartition par Wilaya de résidence (Algérie).</p>
                </div>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {topWilayas.length === 0 ? (
                  <p className="text-xs text-slate-455 italic">Aucune donnée géographique disponible.</p>
                ) : (
                  topWilayas.map(item => {
                    const percent = Math.min(100, Math.round((item.count / totalPatients) * 100));
                    return (
                      <div key={item.name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{item.name}</span>
                          <span className="font-bold font-mono">{item.count} patient(s) ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bookings by Service Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-sans">Répartition de l'Activité Médicale</h3>
                  <p className="text-slate-500 text-xs">Surcharges de séances programmées selon les spécialités cliniques.</p>
                </div>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {Object.keys(serviceCounts).length === 0 ? (
                  <p className="text-xs text-slate-455 italic">Aucune consultation programmée pour le moment.</p>
                ) : (
                  Object.keys(serviceCounts).map(name => {
                    const count = serviceCounts[name];
                    const percent = totalRDVs > 0 ? Math.round((count / totalRDVs) * 100) : 0;
                    return (
                      <div key={name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{name}</span>
                          <span className="font-bold font-mono">{count} RDV ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* NEW MODULE: Origine des Prescriptions Médicales */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="panel-prescription-origins">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-sans">Origine des Prescriptions Médicales</h3>
                  <p className="text-slate-500 text-xs">Analyse du canal d'orientation initial et provenance réglementaire des ordonnances cliniques.</p>
                </div>
              </div>
              <div className="flex gap-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl text-slate-650 h-fit">
                Total Dossiers Analysés : <span className="text-indigo-650 font-black">{totalPatients}</span>
              </div>
            </div>

            {/* Bento Layout for prescription analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Type Distribution Column - 5 cols */}
              <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-1">Répartition par Structure d'Origine</h4>
                  <p className="text-[11px] text-slate-400">Canal légal ayant fourni la prescription de médecine physique.</p>
                </div>

                <div className="space-y-4 pt-1">
                  {prescriptionOrigins.listTypes.map(item => {
                    const percent = totalPatients > 0 ? Math.min(100, Math.round((item.count / totalPatients) * 105)) : 0;
                    const truePercent = totalPatients > 0 ? Math.round((item.count / totalPatients) * 100) : 0;
                    return (
                      <div key={item.id} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <span className="font-bold font-mono text-slate-900 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md text-[10.5px]">
                            {item.count} patient(s) ({truePercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${percent}%`,
                              backgroundColor: item.color
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Analytical Insight */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-600 space-y-1 select-none">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Ratio d'Orientation Externe</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Les prescriptions provenant de centres externes (CHUs, Privés) représentent{' '}
                    <span className="font-bold text-slate-700">
                      {Math.round(
                        (prescriptionOrigins.listTypes
                          .filter(t => t.id !== 'interne')
                          .reduce((sum, t) => sum + t.count, 0) /
                          (totalPatients || 1)) *
                          100
                      )}
                      %
                    </span>{' '}
                    de l'activité globale du centre, consolidant l'adressage coordonné inter-hospitalier.
                  </p>
                </div>
              </div>

              {/* Top Prescribers / Physicians - 7 cols */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center.">
                  <div>
                    <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-1">Palmarès des Praticiens Orienteurs</h4>
                    <p className="text-[11px] text-slate-400">Classement par volume de patients pris en charge issus de leur prescription.</p>
                  </div>
                </div>

                {/* Prescribers Grid / List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {prescriptionOrigins.listPrescribers.map((presc, index) => {
                    const badgeColors: { [key: string]: string } = {
                      interne: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      chu: 'bg-blue-50 text-blue-800 border-blue-200',
                      clinique: 'bg-teal-50 text-teal-800 border-teal-200',
                      cabinet: 'bg-purple-50 text-purple-800 border-purple-200',
                      controle: 'bg-amber-50 text-amber-800 border-amber-200'
                    };
                    const badgeColor = badgeColors[presc.type] || 'bg-slate-50 text-slate-800 border-slate-200';

                    return (
                      <div 
                        key={presc.name} 
                        className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/70 p-3 rounded-xl flex items-center justify-between transition group cursor-pointer"
                        onClick={() => {
                          setFilterOriginType(presc.type);
                          setSearchOriginQuery(presc.name);
                        }}
                      >
                        <div className="space-y-1 truncate leading-tight">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-md font-bold shrink-0 font-mono">
                              #{index + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-850 truncate group-hover:text-indigo-650 transition">{presc.name}</span>
                          </div>
                          <span className="block text-[10px] text-slate-450 truncate">{presc.etablissement}</span>
                          <span className={`inline-block text-[8.5px] px-1.5 py-0.5 rounded-md font-bold tracking-tight border ${badgeColor}`}>
                            {presc.typeLabel}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-indigo-950 block">{presc.count}</span>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider block">fiches</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Interactive Clinical Search Registry */}
            <div className="border-t border-slate-100 pt-5 space-y-4" id="registre-origine-prescription">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none">
                    <span>🔍 Registre et Recherche Rapide Ordonnances</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-450">Filtrez les dossiers patients en corrélation directe avec leur prescription d'origine.</p>
                </div>
                
                {/* Search Inputs */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-indigo-500 cursor-pointer shadow-xs min-w-[150px]"
                    value={filterOriginType}
                    onChange={(e) => setFilterOriginType(e.target.value)}
                  >
                    <option value="all">🔍 Toutes les Origines</option>
                    <option value="interne">Rééducation Interne (MPR)</option>
                    <option value="chu">CHUs & Hôpitaux Publics</option>
                    <option value="clinique">Clinique Privée Externe</option>
                    <option value="cabinet">Cabinet Libéral Privé</option>
                    <option value="controle">Contrôle / Militaire / Secu</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-hidden focus:border-indigo-500 w-full sm:w-48 shadow-xs font-medium"
                      placeholder="Patient, médecin, CHU..."
                      value={searchOriginQuery}
                      onChange={(e) => setSearchOriginQuery(e.target.value)}
                    />
                    {searchOriginQuery && (
                      <button 
                        onClick={() => setSearchOriginQuery('')}
                        className="absolute right-2 px-1 top-1/2 -translate-y-1/2 hover:text-slate-800 text-slate-400 text-xs font-black cursor-pointer"
                        title="Effacer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {(searchOriginQuery !== '' || filterOriginType !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchOriginQuery('');
                        setFilterOriginType('all');
                      }}
                      className="p-1 px-2.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-rose-100 transition whitespace-nowrap"
                    >
                      Effacer 🧹
                    </button>
                  )}
                </div>
              </div>

              {/* Search result registry table */}
              <div className="scroll-container overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]" id="tbl-prescription-origins-results">
                  <thead>
                    <tr className="bg-slate-50 text-[#2B4B52] border-b border-slate-200/80 uppercase font-black text-[8px] tracking-wider select-none">
                      <th className="px-3 py-2 text-slate-500">Patient</th>
                      <th className="px-3 py-2 text-slate-500">Diagnostic / Pathologie</th>
                      <th className="px-3 py-2 text-slate-500 text-center">Âge / Genre</th>
                      <th className="px-3 py-2 text-slate-500">Organisme Assureur</th>
                      <th className="px-3 py-2 text-slate-500">Médecin MPR Prescripteur</th>
                      <th className="px-3 py-2 text-slate-500">Établissement Origine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredOriginsPatients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-450 italic font-medium">
                          Aucun dossier patient ne correspond à cette recherche. Modifiez vos filtres ou simulez de l'activité.
                        </td>
                      </tr>
                    ) : (
                      filteredOriginsPatients.map(item => (
                        <tr key={item.ID_Patient || (item as any).id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-2.5">
                            <span className="block font-black text-slate-900">{item.Nom_Patient || (item as any).name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{(item as any).dossier_num || `PAT-ID-${item.ID_Patient}`}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="block font-semibold text-slate-800 line-clamp-1 max-w-[200px]" title={item.dossier_medical || (item as any).pathology || 'Non renseignée'}>
                              {item.dossier_medical || (item as any).pathology || <span className="text-slate-400 italic font-normal">Diagnostic non renseigné</span>}
                            </span>
                            <span className="text-[9px] text-[#606C5A] block max-w-[200px] truncate" title={(item as any).prescription_acts || 'Consignes de rééducation'}>
                              {(item as any).prescription_acts || 'Aucune consigne d\'actes spécifique'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-[10.5px]">
                            <span className="font-bold text-slate-800">{item.Age_Patient || item.Age_Pat || (item as any).age || 40} ans</span>
                            <span className="text-slate-400 text-[10px] ml-1">({item.Genre_Patient || (item as any).gender || 'M'})</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200/70 text-slate-650 font-bold font-mono">
                              {(item as any).organisme || 'CNAS / Régime Gén.'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-900 block leading-normal">{item.prescripteurName}</span>
                            <span className="text-[8.5px] font-bold text-indigo-700 uppercase tracking-widest">{item.prescripteurTypeName}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            <span className="font-semibold text-slate-600 block">{item.etablissement}</span>
                            <span className="text-[9px] text-slate-400 font-mono">CN-DZ-2026</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Clinical Integrity & Audit status */}
          <div className="bg-indigo-950 text-indigo-100 p-5 rounded-2xl border border-indigo-900 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-sm text-white">Coordonnées et Traçabilité Réglementaires</h4>
              </div>
              <p className="text-xs text-indigo-300/90 leading-relaxed max-w-2xl">
                Tous les dossiers patients intègrent désormais le numéro de téléphone, l'adresse de rue originelle, et la wilaya de naissance officielle conformément aux protocoles du Ministère de la Santé de la République Algérienne démocratique et populaire.
              </p>
            </div>
            <div className="text-xs font-mono bg-indigo-950 border border-indigo-800/60 px-3.5 py-2 rounded-lg text-center font-bold">
              CODE CONFORMITÉ : ALGERIE-MPR-2026
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: SUBSCRIBERS STATS */}
      {activeTab === 'abonnés' && confirmedPeriod && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200" id="subscriber-stats-view">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-sans">Statistique des Abonnés</h3>
                <p className="text-slate-500 text-xs">Période du <span className="font-bold text-indigo-700">{confirmedPeriod.start}</span> au <span className="font-bold text-indigo-700">{confirmedPeriod.end}</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <button
                  id="btn-clear-stats-filters"
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <X className="w-4 h-4 text-rose-600" />
                  <span>Réinitialiser les filtres 🧹</span>
                </button>
              )}
              
              <button
                id="btn-edit-stats-period"
                onClick={() => setShowPeriodModal(true)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-105 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Modifier la Période 📅</span>
              </button>
            </div>
          </div>

          {/* Global click-outside overlay */}
          {activeFilterMenu && (
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setActiveFilterMenu(null)} 
            />
          )}

          {/* Core Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" id="subscriber-stats-table-wrapper">
            <table className="w-full text-left border-collapse animate-in fade-in duration-200" id="tbl-subscriber-stats">
              <thead>
                <tr className="bg-slate-50/70 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 font-sans select-none">
                  <th className="py-2.5 px-2 text-center w-12 text-slate-400">N°</th>
                  
                  {/* Patient (Uniform Filter) */}
                  <th className="py-2 px-2.5 text-left relative" data-filter-dropdown="true">
                    <div 
                      className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'patient' ? null : 'patient')}
                    >
                      <span className={filterPatient.length > 0 ? "text-indigo-600 font-bold" : ""}>Patient</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'patient' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterPatient.length > 0 ? 'text-indigo-600 font-bold' : ''}`} />
                    </div>
                    {activeFilterMenu === 'patient' && (
                      <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Filtrer par Patient</span>
                          {filterPatient.length > 0 && (
                            <button 
                              onClick={() => setFilterPatient([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                           {occurrences.typePatient.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucun patient</span>
                          ) : occurrences.typePatient.map(item => {
                            const isChecked = filterPatient.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterPatient([...filterPatient, item.val]);
                                    } else {
                                      setFilterPatient(filterPatient.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-700 font-medium">{item.val}</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Libellé Abonnement (Uniform Filter) */}
                  <th className="py-2 px-2.5 text-left relative" data-filter-dropdown="true">
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'libelle' ? null : 'libelle')}
                    >
                      <span className={filterLibelle.length > 0 ? "text-indigo-600 font-bold" : ""}>Libellé Forfait</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'libelle' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterLibelle.length > 0 ? 'text-indigo-600 font-bold' : ''}`} />
                    </div>
                    {activeFilterMenu === 'libelle' && (
                      <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Filtrer par Forfait</span>
                          {filterLibelle.length > 0 && (
                            <button 
                              onClick={() => setFilterLibelle([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {occurrences.libellePack.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucun forfait</span>
                          ) : occurrences.libellePack.map(item => {
                            const isChecked = filterLibelle.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterLibelle([...filterLibelle, item.val]);
                                    } else {
                                      setFilterLibelle(filterLibelle.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-700 font-medium">{item.val}</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Prix Abonnement (Uniform Filter) */}
                  <th className="py-2 px-2.5 text-right relative" data-filter-dropdown="true">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer hover:text-indigo-600 ml-auto"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'prix' ? null : 'prix')}
                    >
                      <span className={filterPrix.length > 0 ? "text-indigo-600 font-bold" : ""}>Prix Forfait</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'prix' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterPrix.length > 0 ? 'text-indigo-600' : ''}`} />
                    </div>
                    {activeFilterMenu === 'prix' && (
                      <div className="absolute top-full right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Filtrer par Prix</span>
                          {filterPrix.length > 0 && (
                            <button 
                              onClick={() => setFilterPrix([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {occurrences.prixPack.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucun prix</span>
                          ) : occurrences.prixPack.map(item => {
                            const isChecked = filterPrix.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterPrix([...filterPrix, item.val]);
                                    } else {
                                      setFilterPrix(filterPrix.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-750 font-bold font-mono text-xs">{item.val.toLocaleString()} DA</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Versements (Non-Uniform predictive search) */}
                  <th className="py-2 px-2.5 text-right relative" data-filter-dropdown="true">
                    <div 
                      className="flex items-center justify-end gap-1 cursor-pointer hover:text-indigo-600 ml-auto"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'versements' ? null : 'versements')}
                    >
                      <span className={searchVersements ? "text-indigo-600 font-bold" : ""}>Versements</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'versements' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${searchVersements !== '' ? 'text-indigo-600' : ''}`} />
                    </div>
                    {activeFilterMenu === 'versements' && (
                      <div className="absolute top-full right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Chercher Versements</span>
                          {searchVersements !== '' && (
                            <button 
                              onClick={() => setSearchVersements('')}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="Ex: 5000..."
                              value={searchVersements}
                              onChange={(e) => {
                                setSearchVersements(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 font-sans font-medium focus:outline-none pl-7"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          </div>
                          
                          <div className="space-y-1">
                            <span className="block text-[8px] font-sans font-black text-slate-400 uppercase tracking-wider">Suggestions prédictives</span>
                            <div className="max-h-24 overflow-y-auto divide-y divide-slate-50">
                              {uniqueVersements
                                .filter(str => str.toLowerCase().includes(searchVersements.toLowerCase()))
                                .slice(0, 5)
                                .map(str => (
                                  <button
                                    key={str}
                                    type="button"
                                    onClick={() => {
                                      setSearchVersements(str);
                                      setCurrentPage(1);
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-[11px] font-mono text-slate-700 font-extrabold flex justify-between items-center transition cursor-pointer"
                                  >
                                    <span>{str}</span>
                                    <span className="text-[9px] text-indigo-500 font-bold font-sans">Saisir</span>
                                  </button>
                                ))}
                              {uniqueVersements
                                .filter(str => str.toLowerCase().includes(searchVersements.toLowerCase())).length === 0 && (
                                  <span className="block text-[10px] text-slate-450 italic p-1">Aucune suggestion</span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Séances Abonnement (Uniform Filter) */}
                  <th className="py-2 px-1 text-center relative w-24" data-filter-dropdown="true">
                    <div 
                      className="flex items-center justify-center gap-1 cursor-pointer hover:text-indigo-600 mx-auto select-none"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'seancesAbn' ? null : 'seancesAbn')}
                    >
                      <span className={filterSeancesAbn.length > 0 ? "text-indigo-600 font-bold" : ""}>Seances Abn.</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'seancesAbn' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterSeancesAbn.length > 0 ? 'text-indigo-600' : ''}`} />
                    </div>
                    {activeFilterMenu === 'seancesAbn' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Séances Forfait</span>
                          {filterSeancesAbn.length > 0 && (
                            <button 
                              onClick={() => setFilterSeancesAbn([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {occurrences.seancesAbn.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucune valeur</span>
                          ) : occurrences.seancesAbn.map(item => {
                            const isChecked = filterSeancesAbn.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterSeancesAbn([...filterSeancesAbn, item.val]);
                                    } else {
                                      setFilterSeancesAbn(filterSeancesAbn.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-700 font-bold font-mono text-xs">{item.val} séance(s)</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Séances Consommées (Uniform Filter) */}
                  <th className="py-2 px-1 text-center relative w-24" data-filter-dropdown="true">
                    <div 
                      className="flex items-center justify-center gap-1 cursor-pointer hover:text-indigo-600 mx-auto select-none"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'seancesCons' ? null : 'seancesCons')}
                    >
                      <span className={filterSeancesCons.length > 0 ? "text-indigo-600 font-bold" : ""}>Seances Cons.</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'seancesCons' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterSeancesCons.length > 0 ? 'text-indigo-600' : ''}`} />
                    </div>
                    {activeFilterMenu === 'seancesCons' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Séances Consommées</span>
                          {filterSeancesCons.length > 0 && (
                            <button 
                              onClick={() => setFilterSeancesCons([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {occurrences.seancesCons.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucune valeur</span>
                          ) : occurrences.seancesCons.map(item => {
                            const isChecked = filterSeancesCons.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterSeancesCons([...filterSeancesCons, item.val]);
                                    } else {
                                      setFilterSeancesCons(filterSeancesCons.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-700 font-bold font-mono text-xs">{item.val} séance(s)</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Séances Restantes (Uniform Filter) */}
                  <th className="py-2 px-1 text-center relative w-24" data-filter-dropdown="true">
                    <div 
                      className="flex items-center justify-center gap-1 cursor-pointer hover:text-indigo-600 mx-auto select-none"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'seancesRest' ? null : 'seancesRest')}
                    >
                      <span className={filterSeancesRest.length > 0 ? "text-indigo-600 font-bold" : ""}>Seances Rest.</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'seancesRest' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterSeancesRest.length > 0 ? 'text-indigo-600' : ''}`} />
                    </div>
                    {activeFilterMenu === 'seancesRest' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Séances Restantes</span>
                          {filterSeancesRest.length > 0 && (
                            <button 
                              onClick={() => setFilterSeancesRest([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {occurrences.seancesRest.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucune valeur</span>
                          ) : occurrences.seancesRest.map(item => {
                            const isChecked = filterSeancesRest.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterSeancesRest([...filterSeancesRest, item.val]);
                                    } else {
                                      setFilterSeancesRest(filterSeancesRest.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-700 font-bold font-mono text-xs">{item.val} séance(s)</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Nombre d'abonnement (Uniform Filter) */}
                  <th className="py-2 px-1.5 text-center relative w-24" data-filter-dropdown="true">
                    <div 
                      className="flex items-center justify-center gap-1 cursor-pointer hover:text-indigo-600 mx-auto"
                      onClick={() => setActiveFilterMenu(activeFilterMenu === 'nbreAbn' ? null : 'nbreAbn')}
                    >
                      <span className={filterNbreAbn.length > 0 ? "text-indigo-600 font-bold" : ""}>Cumul Abn.</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'nbreAbn' ? 'rotate-180 text-indigo-600' : 'text-slate-400'} ${filterNbreAbn.length > 0 ? 'text-indigo-600' : ''}`} />
                    </div>
                    {activeFilterMenu === 'nbreAbn' && (
                      <div className="absolute top-full right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                          <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Filtrer d'abonnements</span>
                          {filterNbreAbn.length > 0 && (
                            <button 
                              onClick={() => setFilterNbreAbn([])}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Effacer
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {occurrences.nbreAbnPat.length === 0 ? (
                            <span className="block text-[11px] text-slate-400 italic p-1">Aucun calcul</span>
                          ) : occurrences.nbreAbnPat.map(item => {
                            const isChecked = filterNbreAbn.includes(item.val);
                            return (
                              <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilterNbreAbn([...filterNbreAbn, item.val]);
                                    } else {
                                      setFilterNbreAbn(filterNbreAbn.filter(x => x !== item.val));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span className="text-slate-755 font-bold font-mono text-xs">{item.val} abn(s)</span>
                                <span className="text-slate-400 font-mono text-[10px]">({item.count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-sans">
                {paginatedAbns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic font-medium">
                      Aucun abonnement trouvé avec les filtres sélectionnés durant cette période.
                    </td>
                  </tr>
                ) : (
                  paginatedAbns.map((item, idx) => {
                    const absoluteLineNum = (currentPage - 1) * itemsPerPage + idx + 1;

                    return (
                      <tr key={item.abn.ID_Abn} className="hover:bg-indigo-50/20 transition-colors duration-100" id={`row-sub-stat-${item.abn.ID_Abn}`}>
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-400 text-center">{absoluteLineNum}</td>
                        <td className="py-1.5 px-2.5">
                          <span className="font-semibold text-slate-700 block leading-tight">{item.typePatient}</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 font-medium">
                          {item.libellePack}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-700">
                          {item.prixPack ? `${item.prixPack.toLocaleString()} DA` : '0 DA'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-650 text-emerald-600">
                          {item.totalPaidStr}
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-50 border border-slate-200/50 text-slate-600">
                            {item.packSessions}
                          </span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] bg-indigo-50 border border-indigo-100/30 text-indigo-600">
                            {item.consumedSessions}
                          </span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] border ${
                            item.remainingSessions === 0 
                              ? 'bg-rose-50 border-rose-100/30 text-rose-600' 
                              : 'bg-emerald-50 border-emerald-100/30 text-emerald-600'
                          }`}>
                            {item.remainingSessions}
                          </span>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <span className="inline-block bg-slate-50 border border-slate-250/50 text-slate-600 px-1.5 py-0.5 rounded-md font-mono font-extrabold text-[10px]">
                            {item.nbreAbnPat}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 px-1" id="stats-pagination-box">
              <span className="text-[11px] text-slate-400 font-medium">Page {currentPage} sur {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-55 hover:bg-slate-100 disabled:opacity-40 text-slate-600 cursor-pointer transition text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-55 hover:bg-slate-100 disabled:opacity-40 text-slate-600 cursor-pointer transition text-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Sums/Totals bottom bar */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 shadow-md" id="stats-totals-bar">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300 font-sans">Total</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-7 text-center md:text-right w-full md:w-auto text-xs">
              <div className="space-y-0.5 border-r border-slate-800 pr-2">
                <span className="block text-[8.5px] text-slate-400 uppercase font-black">Cas Trouvés</span>
                <span className="font-mono text-xs font-black text-white">{totals.count}</span>
              </div>
              <div className="space-y-0.5 border-r border-slate-800 pr-2">
                <span className="block text-[8.5px] text-slate-400 uppercase font-black">Prix Abonnements</span>
                <span className="font-mono text-xs font-black text-amber-400">{totals.priceTotal.toLocaleString()} DA</span>
              </div>
              <div className="space-y-0.5 border-r border-slate-800 pr-2">
                <span className="block text-[8.5px] text-slate-400 uppercase font-black">Montant Versements</span>
                <span className="font-mono text-xs font-black text-emerald-400">{totals.paymentsTotal.toLocaleString()} DA</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8.5px] text-slate-400 uppercase font-black">Séances Consommées / Totales</span>
                <span className="font-mono text-xs font-black text-indigo-300">{totals.consumedSessionsTotal} / {totals.packSessionsTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: RAPPORT D'ACTIVITÉ */}
      {activeTab === 'rapport_activite' && (() => {
        // Simple helper to parse time HH:mm to clock decimal
        const parseTimeToDecimal = (timeStr: string) => {
          if (!timeStr) return 0;
          const parts = timeStr.split(':');
          if (parts.length < 2) return 0;
          const hrs = parseInt(parts[0], 10) || 0;
          const mins = parseInt(parts[1], 10) || 0;
          return hrs + (mins / 60);
        };

        // Date counting
        const calculateWorkdays = (startStr: string, endStr: string) => {
          const s = new Date(startStr);
          const e = new Date(endStr);
          if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
          let count = 0;
          const cur = new Date(s.getTime());
          while (cur <= e) {
            const d = cur.getDay(); // 0 = Sunday, 6 = Saturday
            if (d !== 0 && d !== 6) {
              count++;
            }
            cur.setDate(cur.getDate() + 1);
          }
          return count;
        };

        const workdays = calculateWorkdays(rptStartDate, rptEndDate);
        const contractHoursPerPrat = workdays * 8; // 8 hours per day

        // Generate data for each practitioner
        const practitionersWithStats = dbState.praticiens.map(p => {
          // Find worked sessions in the period [rptStartDate, rptEndDate]
          const completedList: any[] = [];
          
          // 1. From seances
          (dbState.seances || []).forEach(s => {
            if (s.ID_Prat === p.ID_Prat && s.Date_Seanc_Realisee >= rptStartDate && s.Date_Seanc_Realisee <= rptEndDate) {
              const patient = dbState.patients.find(pat => pat.ID_Patient === s.ID_Patient);
              const startVal = parseTimeToDecimal(s.H_Debut_Seanc);
              const endVal = parseTimeToDecimal(s.H_Fin_Seanc);
              const duration = endVal > startVal ? (endVal - startVal) : 1;
              completedList.push({
                id: `S-${s.ID_Seanc}`,
                patientName: patient ? patient.Nom_Patient : `Patient #${s.ID_Patient}`,
                date: s.Date_Seanc_Realisee,
                hDebut: s.H_Debut_Seanc,
                hFin: s.H_Fin_Seanc,
                duration,
                type: 'Séance'
              });
            }
          });

          // 2. From rendezVous marked Honoré, avoiding duplicates
          const seanceRdvIds = new Set((dbState.seances || []).map(s => s.ID_RDV).filter(id => id !== null));
          (dbState.rendezVous || []).forEach(r => {
            if (r.ID_Prat === p.ID_Prat && r.Statut_RDV === 'Honoré' && r.Date_RDV >= rptStartDate && r.Date_RDV <= rptEndDate) {
              if (!seanceRdvIds.has(r.ID_RDV)) {
                const patient = dbState.patients.find(pat => pat.ID_Patient === r.ID_Patient);
                const startVal = parseTimeToDecimal(r.H_Debut_RDV);
                const endVal = parseTimeToDecimal(r.H_Fin_RDV);
                const duration = endVal > startVal ? (endVal - startVal) : 1;
                completedList.push({
                  id: `R-${r.ID_RDV}`,
                  patientName: patient ? patient.Nom_Patient : `Patient #${r.ID_Patient}`,
                  date: r.Date_RDV,
                  hDebut: r.H_Debut_RDV,
                  hFin: r.H_Fin_RDV,
                  duration,
                  type: 'RDV Honoré'
                });
              }
            }
          });

          // Sort completed list by date descending, then start hour
          completedList.sort((a, b) => b.date.localeCompare(a.date) || a.hDebut.localeCompare(b.hDebut));

          // Calculated totals
          const totalHoursEffected = completedList.reduce((sum, item) => sum + item.duration, 0);
          
          // Pause calculation: 1.5 hour per worked day (where they have at least 1 session), or 0 if they didn't work at all that day
          const workedDaysSet = new Set(completedList.map(item => item.date));
          const totalHoursPause = workedDaysSet.size * 1.5;

          const occupationPercent = contractHoursPerPrat > 0 
            ? Math.round((totalHoursEffected / contractHoursPerPrat) * 100) 
            : 0;

          // Mapping role name
          let fonctionName = 'Kinésithérapeute';
          if (p.Repere === 'P') fonctionName = 'Psychomotricien / Psycho';
          if (p.Repere === 'O') fonctionName = 'Orthophoniste';

          const serviceObj = dbState.services.find(s => s.ID_Sce === p.ID_Sce);
          const serviceName = serviceObj ? serviceObj.Libelle_Sce : 'Service Rééducation';

          return {
            ...p,
            fonctionName,
            serviceName,
            completedList,
            totalHoursEffected,
            totalHoursPause,
            occupationPercent,
            workedDaysCount: workedDaysSet.size
          };
        });

        // Check if item matches criteria (faceted search)
        const checkPratMatches = (item: any, excludeKey?: string) => {
          // 1. Text search
          if (searchPratName) {
            const q = searchPratName.toLowerCase();
            const fullName = `${item.Prenom_Prat} ${item.Nom_Prat}`.toLowerCase();
            const matchText = fullName.includes(q) || item.fonctionName.toLowerCase().includes(q) || item.serviceName.toLowerCase().includes(q);
            if (!matchText) return false;
          }
          // 2. Fonction Filter
          if (excludeKey !== 'fonction' && filterPratFonction.length > 0 && !filterPratFonction.includes(item.fonctionName)) {
            return false;
          }
          // 3. Affectation Filter
          if (excludeKey !== 'affectation' && filterPratAffectation.length > 0 && !filterPratAffectation.includes(item.serviceName)) {
            return false;
          }
          return true;
        };

        const filteredPratStats = practitionersWithStats.filter(p => checkPratMatches(p));

        // Let's compute unique values & occurrences for "Fonction" & "Affectation" based on checkPratMatches
        const occurrencesPrat = {
          fonction: [] as { val: string; count: number }[],
          affectation: [] as { val: string; count: number }[],
        };

        // Calcul des occurrences de Fonction
        const allFonctionsMap = new Map<string, number>();
        practitionersWithStats.forEach(p => {
          // Faceted count: only if it matches all OTHER filters
          if (checkPratMatches(p, 'fonction')) {
            allFonctionsMap.set(p.fonctionName, (allFonctionsMap.get(p.fonctionName) || 0) + 1);
          }
        });
        occurrencesPrat.fonction = Array.from(allFonctionsMap.entries())
          .map(([val, count]) => ({ val, count }))
          .sort((a, b) => b.count - a.count || a.val.localeCompare(b.val));

        // Calcul des occurrences d'Affectation/Service
        const allAffectationsMap = new Map<string, number>();
        practitionersWithStats.forEach(p => {
          if (checkPratMatches(p, 'affectation')) {
            allAffectationsMap.set(p.serviceName, (allAffectationsMap.get(p.serviceName) || 0) + 1);
          }
        });
        occurrencesPrat.affectation = Array.from(allAffectationsMap.entries())
          .map(([val, count]) => ({ val, count }))
          .sort((a, b) => b.count - a.count || a.val.localeCompare(b.val));

        // Total numbers for the overall center
        const centerWorkdays = workdays;
        const centerContractHours = centerWorkdays * dbState.praticiens.length * 8;
        const centerCompletedHours = practitionersWithStats.reduce((sum, p) => sum + p.totalHoursEffected, 0);
        const centerPauseHours = practitionersWithStats.reduce((sum, p) => sum + p.totalHoursPause, 0);
        const centerTotalSessions = practitionersWithStats.reduce((sum, p) => sum + p.completedList.length, 0);
        const centerAvgOccupation = dbState.praticiens.length > 0 
          ? Math.round(practitionersWithStats.reduce((sum, p) => sum + p.occupationPercent, 0) / dbState.praticiens.length)
          : 0;

        // Statistics by Service
        const serviceStatistics = dbState.services.map(s => {
          const servicePrats = practitionersWithStats.filter(p => p.ID_Sce === s.ID_Sce);
          const totalSceHours = servicePrats.reduce((sum, p) => sum + p.totalHoursEffected, 0);
          const totalScePause = servicePrats.reduce((sum, p) => sum + p.totalHoursPause, 0);
          const totalSceSessions = servicePrats.reduce((sum, p) => sum + p.completedList.length, 0);
          const avgSceOccupation = servicePrats.length > 0
            ? Math.round(servicePrats.reduce((sum, p) => sum + p.occupationPercent, 0) / servicePrats.length)
            : 0;

          return {
            ...s,
            pratsCount: servicePrats.length,
            totalSceHours,
            totalScePause,
            totalSceSessions,
            avgSceOccupation
          };
        });

        // Safe percentage rendering bar method
        const renderSquareBar = (pct: number) => {
          const clamped = Math.max(0, Math.min(100, pct));
          const totalBlocks = 10;
          const greens = Math.floor(clamped / 10);
          const yellow = clamped % 10 >= 5 ? 1 : 0;
          const whites = totalBlocks - greens - yellow;
          return '🟩'.repeat(greens) + '🟨'.repeat(yellow) + '⬜'.repeat(whites);
        };

        const selectedPratData = practitionersWithStats.find(p => p.ID_Prat === selectedPratId);

        // Predefined presets for the date period selection
        const setDateRangePreset = (type: 'this_week' | 'this_month' | 'year_2026') => {
          if (type === 'this_week') {
            setRptStartDate('2026-06-01');
            setRptEndDate('2026-06-07');
          } else if (type === 'this_month') {
            setRptStartDate('2026-06-01');
            setRptEndDate('2026-06-30');
          } else if (type === 'year_2026') {
            setRptStartDate('2026-01-01');
            setRptEndDate('2026-12-31');
          }
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-200" id="activity-report-section">
            {/* Control Panel: Dates & Actions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Période du :</span>
                  <input
                    type="date"
                    value={rptStartDate}
                    onChange={(e) => {
                      setRptStartDate(e.target.value);
                      setSelectedPratId(null);
                    }}
                    className="bg-slate-50 border border-slate-200 focus:border-[#606C5A] rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#606C5A]/20"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Au :</span>
                  <input
                    type="date"
                    value={rptEndDate}
                    onChange={(e) => {
                      setRptEndDate(e.target.value);
                      setSelectedPratId(null);
                    }}
                    className="bg-slate-50 border border-slate-200 focus:border-[#606C5A] rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#606C5A]/20"
                  />
                </div>
                
                {/* Micro presets buttons */}
                <div className="flex items-center gap-1.5 mt-4 sm:mt-5">
                  <button
                    type="button"
                    onClick={() => setDateRangePreset('this_week')}
                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition"
                  >
                    Cette semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateRangePreset('this_month')}
                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition"
                  >
                    Ce mois
                  </button>
                </div>
              </div>

              {/* Demo button to simulate active sessions & fill database */}
              {onSave && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateMockActivity}
                    className="px-4 py-2 bg-[#606C5A]/10 hover:bg-[#606C5A]/20 border border-[#606C5A]/30 text-[#4E5849] rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Remplit la base de données avec des séances d'activité simulées conformes pour la période"
                  >
                    💡 Simuler l'Activité Réaliste
                  </button>
                </div>
              )}
            </div>

            {/* Sub-selector tabs */}
            <div className="flex flex-wrap border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs gap-1.5">
              <button
                type="button"
                onClick={() => setRapportSubTab('praticiens')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                  rapportSubTab === 'praticiens'
                    ? 'bg-[#606C5A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>A - Rapport d'Activité des Praticiens</span>
              </button>
              <button
                type="button"
                onClick={() => setRapportSubTab('services')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                  rapportSubTab === 'services'
                    ? 'bg-[#606C5A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>B - Rapport d'Activité des Services</span>
              </button>
              <button
                type="button"
                onClick={() => setRapportSubTab('centre')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                  rapportSubTab === 'centre'
                    ? 'bg-[#606C5A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>C - Rapport d'Activité du Centre</span>
              </button>
            </div>

            {/* CONDITIONAL SUB-TAB RENDERIFICATIONS */}

            {/* SUB-TAB A: PRATICIENS */}
            {rapportSubTab === 'praticiens' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Table list */}
                <div className={`space-y-4 ${selectedPratId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Filter bar inside card */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative w-full">
                          <span className="absolute left-3 top-2.5 text-slate-400">
                            <Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="Rechercher par praticien, rôle, spécialité..."
                            value={searchPratName}
                            onChange={(e) => setSearchPratName(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-[#606C5A] rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none font-medium text-slate-800 animate-in"
                          />
                        </div>
                        {(filterPratFonction.length > 0 || filterPratAffectation.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilterPratFonction([]);
                              setFilterPratAffectation([]);
                            }}
                            className="text-[10.5px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0 bg-rose-50 border border-rose-200/50 px-2 py-1 rounded-lg transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            Réinitialiser
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-550 font-bold font-mono">
                        {filteredPratStats.length} praticien(s) enregistré(s)
                      </span>
                    </div>

                    {/* Table */}
                    <div className="scroll-container overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-[#2B4B52] border-b border-slate-200 uppercase font-bold text-[8.5px] tracking-wider select-none">
                            <th className="px-2.5 py-2 select-none text-slate-500">Nom & Prénom</th>
                            
                            {/* Filter column Fonction */}
                            <th className="px-2.5 py-2 relative" data-filter-dropdown="true">
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:text-[#606C5A]"
                                onClick={() => setActiveFilterMenu(activeFilterMenu === 'pratFonction' ? null : 'pratFonction')}
                              >
                                <span className={filterPratFonction.length > 0 ? "text-[#606C5A] font-extrabold" : ""}>Fonction</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'pratFonction' ? 'rotate-180 text-[#606C5A]' : 'text-slate-400'} ${filterPratFonction.length > 0 ? 'text-[#606C5A] font-extrabold' : ''}`} />
                              </div>
                              {activeFilterMenu === 'pratFonction' && (
                                <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                                    <span className="font-bold text-[10px] text-[#2B4B52] uppercase tracking-wider">Filtrer par Fonction</span>
                                    {filterPratFonction.length > 0 && (
                                      <button 
                                        type="button"
                                        onClick={() => setFilterPratFonction([])}
                                        className="text-[9.5px] text-rose-600 font-bold hover:underline cursor-pointer"
                                      >
                                        Effacer
                                      </button>
                                    )}
                                  </div>
                                  <div className="space-y-1 max-h-48 overflow-y-auto w-full">
                                    {occurrencesPrat.fonction.length === 0 ? (
                                      <span className="block text-[11px] text-slate-400 italic p-1">Aucune fonction</span>
                                    ) : occurrencesPrat.fonction.map(item => {
                                      const isChecked = filterPratFonction.includes(item.val);
                                      return (
                                        <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                          <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setFilterPratFonction([...filterPratFonction, item.val]);
                                              } else {
                                                setFilterPratFonction(filterPratFonction.filter(x => x !== item.val));
                                              }
                                            }}
                                            className="rounded text-[#606C5A] focus:ring-[#606C5A] h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                          />
                                          <span className="text-slate-700 font-medium">{item.val}</span>
                                          <span className="text-slate-450 font-mono text-[10px]">({item.count})</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </th>

                            {/* Filter column Affectation */}
                            <th className="px-2.5 py-2 relative" data-filter-dropdown="true">
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:text-[#606C5A]"
                                onClick={() => setActiveFilterMenu(activeFilterMenu === 'pratAffectation' ? null : 'pratAffectation')}
                              >
                                <span className={filterPratAffectation.length > 0 ? "text-[#606C5A] font-extrabold" : ""}>Affectation</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${activeFilterMenu === 'pratAffectation' ? 'rotate-180 text-[#606C5A]' : 'text-slate-400'} ${filterPratAffectation.length > 0 ? 'text-[#606C5A] font-extrabold' : ''}`} />
                              </div>
                              {activeFilterMenu === 'pratAffectation' && (
                                <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-45 p-3 text-slate-800 normal-case font-normal font-sans" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                                    <span className="font-bold text-[10px] text-[#2B4B52] uppercase tracking-wider">Filtrer par Affectation</span>
                                    {filterPratAffectation.length > 0 && (
                                      <button 
                                        type="button"
                                        onClick={() => setFilterPratAffectation([])}
                                        className="text-[9.5px] text-rose-600 font-bold hover:underline cursor-pointer"
                                      >
                                        Effacer
                                      </button>
                                    )}
                                  </div>
                                  <div className="space-y-1 max-h-48 overflow-y-auto w-full">
                                    {occurrencesPrat.affectation.length === 0 ? (
                                      <span className="block text-[11px] text-slate-400 italic p-1">Aucune affectation</span>
                                    ) : occurrencesPrat.affectation.map(item => {
                                      const isChecked = filterPratAffectation.includes(item.val);
                                      return (
                                        <label key={item.val} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                          <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setFilterPratAffectation([...filterPratAffectation, item.val]);
                                              } else {
                                                setFilterPratAffectation(filterPratAffectation.filter(x => x !== item.val));
                                              }
                                            }}
                                            className="rounded text-[#606C5A] focus:ring-[#606C5A] h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                          />
                                          <span className="text-slate-700 font-medium">{item.val}</span>
                                          <span className="text-slate-450 font-mono text-[10px]">({item.count})</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </th>

                            <th className="px-2.5 py-2 text-center text-slate-500 w-20">H. Effec</th>
                            <th className="px-2.5 py-2 text-center text-slate-500 w-20">H. Pause</th>
                            <th className="px-2.5 py-2 text-right text-slate-500">% Occupation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredPratStats.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-450 italic font-medium">
                                Aucun praticien trouvé sur cette période. Choisissez un preset ou simulez de l'activité.
                              </td>
                            </tr>
                          ) : (
                            filteredPratStats.map(item => {
                              const isSelected = selectedPratId === item.ID_Prat;
                              return (
                                <tr
                                  key={item.ID_Prat}
                                  onClick={() => setSelectedPratId(item.ID_Prat)}
                                  className={`hover:bg-slate-50/80 cursor-pointer active:scale-[0.995] transition-all ${
                                    isSelected 
                                      ? 'bg-emerald-50/40 font-bold border-l-4 border-[#606C5A]' 
                                      : ''
                                  }`}
                                >
                                  <td className="px-2.5 py-1.5 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#606C5A]/10 text-[#4E5849] font-black flex items-center justify-center text-[9px] shrink-0">
                                      {item.Prenom_Prat.charAt(0)}{item.Nom_Prat.charAt(0)}
                                    </div>
                                    <div className="truncate">
                                      <span className="block font-black text-slate-900 leading-tight">{item.Prenom_Prat} {item.Nom_Prat}</span>
                                      <span className="text-[8.5px] text-[#606C5A] font-bold leading-tight block" dir="rtl">{item.Nom_Arb}</span>
                                    </div>
                                  </td>
                                  <td className="px-2.5 py-1.5 whitespace-nowrap">
                                    <span className="font-semibold text-slate-800 text-[10.5px]">{item.fonctionName}</span>
                                  </td>
                                  <td className="px-2.5 py-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60 font-medium text-slate-650 block w-max max-w-[120px] truncate text-[9.5px]">
                                      {item.serviceName}
                                    </span>
                                  </td>
                                  <td className="px-2.5 py-1.5 text-center font-mono font-bold text-slate-850">
                                    {item.totalHoursEffected.toFixed(1)} h
                                  </td>
                                  <td className="px-2.5 py-1.5 text-center font-mono font-bold text-slate-500">
                                    {item.totalHoursPause.toFixed(1)} h
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right space-y-0.5">
                                    <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
                                      <span className="font-bold text-slate-900">{item.occupationPercent}%</span>
                                    </div>
                                    <div className="font-mono text-[8px] tracking-tight" title={`${item.occupationPercent}% Occupé`}>
                                      {renderSquareBar(item.occupationPercent)}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Side detail block */}
                {selectedPratId && selectedPratData && (
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-right duration-250">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                          Détails de l'Activité Réalisée
                        </span>
                        <h4 className="font-black text-xs text-slate-800">
                          {selectedPratData.Prenom_Prat} {selectedPratData.Nom_Prat}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPratId(null)}
                        className="p-1 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-500 mt-[-4px]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Statistics header */}
                    <div className="p-4 bg-gradient-to-tr from-[#606C5A]/10 to-teal-50/50 border-b border-slate-100 flex items-center justify-between text-center">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Séances Réalisées</span>
                        <span className="text-sm font-black text-slate-800">{selectedPratData.completedList.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Heures Réelles</span>
                        <span className="text-sm font-black text-[#4E5849] font-mono">{selectedPratData.totalHoursEffected.toFixed(1)} h</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Jours d'Activité</span>
                        <span className="text-sm font-black text-slate-850 font-mono">{selectedPratData.workedDaysCount}j</span>
                      </div>
                    </div>

                    <div className="p-2 space-y-2 max-h-[450px] overflow-y-auto w-full">
                      {selectedPratData.completedList.length === 0 ? (
                        <div className="text-center py-10 text-slate-450 italic text-[11px]">
                          Aucune séance réalisée enregistrée pour ce praticien pendant cette période.
                        </div>
                      ) : (
                        selectedPratData.completedList.map((item: any, idx: number) => (
                          <div 
                            key={item.id || idx} 
                            className="p-3 bg-white border border-slate-100 hover:border-[#606C5A]/30 rounded-xl transition shadow-2xs space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest font-mono">
                                📅 {item.date}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                                {item.hDebut} - {item.hFin} ({item.duration}h)
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 text-[11px]">
                                Patient : <strong className="font-extrabold text-slate-900">{item.patientName}</strong>
                              </span>
                              <span className="text-[9px] text-[#606C5A] font-bold bg-[#606C5A]/5 border border-[#606C5A]/15 px-1.5 py-0.5 rounded">
                                {item.type}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB B: SERVICES */}
            {rapportSubTab === 'services' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-[#606C5A]/5">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      📊 Récapitulatif d'Activité par Spécialité et Service Clinique
                    </h3>
                  </div>
                  
                  <div className="scroll-container overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-[#2B4B52] border-b border-slate-200 uppercase font-bold text-[9px] tracking-wider">
                          <th className="px-4 py-3 font-sans">Service</th>
                          <th className="px-4 py-3 text-center font-sans">Effectif Praticiens</th>
                          <th className="px-4 py-3 text-center font-sans">Heures Travaillées</th>
                          <th className="px-4 py-3 text-center font-sans">Volume Total Pauses</th>
                          <th className="px-4 py-3 text-center font-sans">Total Séances Réalisées</th>
                          <th className="px-4 py-3 text-right font-sans">Taux d'Occupation Moyen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {serviceStatistics.map(item => (
                          <tr key={item.ID_Sce} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              🏢 {item.Libelle_Sce}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600">
                              {item.pratsCount} praticien(s)
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-black text-[#4E5849]">
                              {item.totalSceHours.toFixed(1)} h
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono text-slate-450">
                              {item.totalScePause.toFixed(1)} h
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                              {item.totalSceSessions}
                            </td>
                            <td className="px-4 py-3.5 text-right space-y-0.5">
                              <span className="font-black text-slate-900 font-mono text-[10.5px]">{item.avgSceOccupation}%</span>
                              <div className="font-mono text-[9px]">
                                {renderSquareBar(item.avgSceOccupation)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB C: DU CENTRE */}
            {rapportSubTab === 'centre' && (
              <div className="space-y-6">
                {/* Centre Overview KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-tr from-[#606C5A]/15 to-white border border-[#606C5A]/20 p-5 rounded-2xl shadow-sm flex items-center justify-between font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Taux d'Occupation Global</span>
                      <p className="text-2xl font-black text-slate-850">{centerAvgOccupation}%</p>
                      <span className="text-[9px] text-[#606C5A] font-bold block">Capacité nominale</span>
                    </div>
                    <div className="p-3.5 bg-[#606C5A]/20 text-[#606C5A] rounded-xl font-black text-xs">
                      📈
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Heures Effectuées</span>
                      <p className="text-2xl font-black text-[#4E5849] font-mono">{centerCompletedHours.toFixed(1)} h</p>
                      <span className="text-[9px] text-slate-550 font-bold block">Temps de soin direct</span>
                    </div>
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pauses Enregistrées</span>
                      <p className="text-2xl font-black text-slate-650 font-mono">{centerPauseHours.toFixed(1)} h</p>
                      <span className="text-[9px] text-slate-550 font-bold block">Repos physiologiques</span>
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-xl font-bold">
                      💤
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between font-sans">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Séances Réalisées</span>
                      <p className="text-2xl font-black text-slate-900 font-mono">{centerTotalSessions}</p>
                      <span className="text-[9px] text-emerald-600 font-bold block">Tous thérapeutes</span>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Graph representation & information details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  {/* Visuel minimalist block chart */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Distribution d'Occupation Clinique</h3>
                        <p className="text-slate-500 text-xs">Capacité de travail vis-à-vis de l'objectif de 8h/jour 5j/sem.</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Volume Global Consommé</span>
                          <span className="font-mono text-xs font-black text-[#4E5849]">{centerCompletedHours.toFixed(1)} / {centerContractHours} h contractuelles</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-[#606C5A] h-3 rounded-full transition-all duration-305" 
                            style={{ width: `${Math.min(100, centerContractHours > 0 ? (centerCompletedHours / centerContractHours)*100 : 0)}%` }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-550 italic leading-relaxed pt-2">
                        Le taux moyen d'occupation de l'ensemble des praticiens du centre est actuellement évalué à <strong>{centerAvgOccupation}%</strong> sur l'ensemble de la période sélectionnée.
                      </p>
                    </div>
                  </div>

                  {/* Operational Notes */}
                  <div className="bg-[#606C5A]/5 text-[#4E5849] p-6 rounded-2xl border border-[#606C5A]/20 flex flex-col justify-between space-y-4 font-sans">
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Note d'audit et Réglementation</h4>
                      <p className="text-xs leading-relaxed text-slate-600">
                        Ce rapport agrège les données d'activité de l'ensemble des Kinésithérapeutes, Psychomotriciens, Psychologues, et Orthophoniistes du centre. Les durées de séances réelles découlent des feuilles d'émargement numériques rédigées lors de la réalisation physique des séances réelles d'abonnés et de rendez-vous honorés confirmés.
                      </p>
                    </div>
                    <div className="text-[10px] font-mono bg-white border border-[#606C5A]/15 px-3 py-2 rounded-lg text-slate-500 font-bold">
                      GÉNÉRATION : {new Date().toISOString().split('T')[0]} - PROT-ALGERIE-MPR
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* Screen Invitation helper when no period is set but tab is subscribers */}
      {!confirmedPeriod && activeTab === 'abonnés' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs max-w-md mx-auto space-y-4 my-10 animate-in fade-in duration-250">
          <div className="inline-flex p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 font-sans">Rapport d'activité des Abonnements</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pour consulter la liste complète des abonnements, les consommations correspondantes et les versements, veuillez d'abord sélectionner une période de validité.
            </p>
          </div>
          <button
            onClick={() => setShowPeriodModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 mx-auto shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Choisir une période</span>
          </button>
        </div>
      )}

      {/* MODAL: CHOOSE STATS PERIOD */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="modal-select-stats-period">
          <div className="bg-white rounded-3xl border border-slate-105 max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm font-sans tracking-tight">Choisir la période</span>
              </div>
              <button 
                onClick={handleCancelPeriod}
                className="text-slate-400 hover:text-white transition rounded-lg p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleConfirmPeriod} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Veuillez indiquer les dates de début et de fin pour délimiter l'analyse des abonnements de votre clinique :
              </p>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-sans font-black uppercase text-slate-500 tracking-wider">Date de Début</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-sans font-black uppercase text-slate-500 tracking-wider">Date de Fin</label>
                  <input 
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-period-choice"
                  onClick={handleCancelPeriod}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-submit-period-choice"
                  className="px-4 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>OK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
