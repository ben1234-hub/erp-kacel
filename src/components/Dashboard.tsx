import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  DollarSign, 
  Users, 
  Layers, 
  TrendingUp, 
  PiggyBank, 
  Calendar, 
  CheckCircle, 
  RefreshCw,
  PlusCircle,
  Clock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { 
  Patient, 
  GestionAbonnement, 
  Pack, 
  Versement, 
  BalneotherapieAppointment, 
  KinesitherapyAppointment,
  Affectation
} from '../types';
import { computeSubscriptionDetails, formatCurrency } from '../utils';

interface DashboardProps {
  patients: Patient[];
  abonnements: GestionAbonnement[];
  packs: Pack[];
  versements: Versement[];
  balneoApps: BalneotherapieAppointment[];
  kineApps: KinesitherapyAppointment[];
  affectations: Affectation[];
  onTriggerSimulation: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({
  patients,
  abonnements,
  packs,
  versements,
  balneoApps,
  kineApps,
  affectations,
  onTriggerSimulation,
  onNavigateToTab,
  userSession
}: { userSession: any } & DashboardProps) {
  // Let's perform business calculation analytics
  const processedAbos = abonnements.map(abo => computeSubscriptionDetails(abo, packs, versements));
  
  // Financial metrics
  const totalContractedUSD = processedAbos.reduce((sum, item) => sum + item.total_avec_remise, 0);
  const totalPaidUSD = versements.reduce((sum, v) => sum + v.amount, 0);
  const totalDebtUSD = processedAbos.reduce((sum, item) => sum + item.amount_remaining, 0);
  
  // Session metrics
  const totalSessionsPurchased = processedAbos.reduce((sum, item) => sum + item.number_of_sessions, 0);
  const totalSessionsUsed = processedAbos.reduce((sum, item) => sum + (packs.find(p => p.id === item.pack?.id)?.nombre_seance ? (packs.find(p => p.id === item.pack?.id)!.nombre_seance - item.remaining_sessions) : 0), 0);
  const totalSessionsLeft = Math.max(0, totalSessionsPurchased - totalSessionsUsed);
  const usagePercentage = totalSessionsPurchased > 0 ? Math.round((totalSessionsUsed / totalSessionsPurchased) * 100) : 0;

  // Active counts
  const activeSubscribers = processedAbos.filter(item => item.state !== 'abonnement_end').length;
  const patientsWithDebtCount = processedAbos.filter(item => item.state === 'with_debt').length;

  // Real-time animation pulse for simulator status indicator
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Determine active patients right now based on confirmed appointments
  // (We simulate active patient presence dynamically!)
  const [activeSimulationLog, setActiveSimulationLog] = useState<string[]>([
    "Démarrage de la simulation d'occupation en direct.",
    "Bassin principal de Balnéothérapie : 2 patients actifs détectés.",
    "Salle Kiné active (1er) : Diagnostic et exercices en cours."
  ]);

  const handleSimulateCheckIn = () => {
    onTriggerSimulation();
    const actionsPool = [
      "Vérification: Jean Dupont a initié sa séance de thérapie active à l'Étage 1.",
      "Paiement reçu : Nouvelle transaction enregistrée, baisse immédiate de la dette.",
      "Séance complétée : Le compteur d'abonnement a décrémenté en arrière-plan.",
      "Balnéo : Vérification de statut effectuée avec succès.",
      "Nouveau rendez-vous planifié avec succès dans le calendrier."
    ];
    const randomAction = actionsPool[Math.floor(Math.random() * actionsPool.length)];
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActiveSimulationLog(prev => [`[${time}] ${randomAction}`, ...prev.slice(0, 4)]);
  };

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Upper Analytics Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" id="dashboard-header">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bonjour, {userSession?.name || 'Administrateur'}</h1>
          <p className="text-slate-500 text-sm">Voici un aperçu de l'activité du centre Kacel Santé pour aujourd'hui.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSimulateCheckIn}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 rounded-full text-xs transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#26a69a]" />
            Rafraîchir les données
          </button>
          <button
            onClick={() => onNavigateToTab('patients')}
            className="bg-[#26a69a] hover:bg-[#00838f] text-white font-bold px-5 py-2 rounded-full text-xs transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nouveau Patient
          </button>
        </div>
      </div>

      {/* Main KPI Widgets Grid - Polished Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-grid">
        {/* Total Cash Collections */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4" id="kpi-cash-collected">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-[#e0f2f1] text-[#26a69a]">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#26a69a] bg-[#e0f2f1] px-2 py-0.5 rounded-full uppercase tracking-wider">Recettes</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(totalPaidUSD)}</h3>
            <p className="text-xs text-slate-500 mt-1">Total encaissé ce mois</p>
          </div>
          <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
            <div className="bg-[#26a69a] h-full rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Global Patient Debt */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4" id="kpi-debts">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Dettes</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(totalDebtUSD)}</h3>
            <p className="text-xs text-slate-500 mt-1">{patientsWithDebtCount} patients en attente</p>
          </div>
          <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
            <div className="bg-orange-400 h-full rounded-full" style={{ width: '40%' }} />
          </div>
        </div>

        {/* Sessions Tracking Widget */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4" id="kpi-sessions">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Séances</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{totalSessionsUsed} <span className="text-sm font-medium text-slate-400">/ {totalSessionsPurchased}</span></h3>
            <p className="text-xs text-slate-500 mt-1">Taux de consommation : {usagePercentage}%</p>
          </div>
          <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${usagePercentage}%` }} />
          </div>
        </div>

        {/* Active subscriptions */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4" id="kpi-active-subs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-500">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Contrats</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{activeSubscribers}</h3>
            <p className="text-xs text-slate-500 mt-1">Abonnements actifs ce jour</p>
          </div>
          <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
            <div className="bg-sky-400 h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      </div>

      {/* Live Cabinet / Rooms Occupancy Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="visualizer-and-logs-grid">
        {/* Room Maps Assignment & Direct Visualizer */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-7 shadow-sm lg:col-span-2 space-y-6" id="live-map-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 tracking-tight text-lg">Occupation des Salles</h3>
              <p className="text-sm text-slate-500">Vue en temps réel des patients en cours de soin.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#26a69a] bg-[#e0f2f1] px-3 py-1 rounded-full border border-[#80cbc4]">
              <div className="w-1.5 h-1.5 bg-[#26a69a] rounded-full animate-pulse" />
              DIRECT
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="rooms-visual-grid">
            {affectations.map((aff) => {
              // Let's simulate patients currently designated inside this room module!
              let activeOccupants: { name: string; age: number; condition: string }[] = [];
              if (aff.id === 'aff-1') {
                // Balneotherapy Room
                activeOccupants = [
                  { name: "Alain Martin", age: 67, condition: "Gymnastique Aquatique corrective" },
                  { name: "Jean Dupont", age: 43, condition: "Thermotherapie cervicale" }
                ];
              } else if (aff.id === 'aff-2') {
                // Active Kine
                activeOccupants = [
                  { name: "Sophie Bernard", age: 52, condition: "Rachis post-traumatique" }
                ];
              } else if (aff.id === 'aff-3') {
                // Individual booths
                activeOccupants = [
                  { name: "Thomas Petit", age: 35, condition: "Massage articulaire" }
                ];
              }

              return (
                <div 
                  key={aff.id} 
                  id={`room-card-${aff.id}`}
                  className="bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{aff.etage}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeOccupants.length > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                        {activeOccupants.length} patient{activeOccupants.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm tracking-tight">{aff.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{aff.description}</p>
                  </div>

                  {/* Active representation */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Statut d'occupation :
                    </span>
                    {activeOccupants.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeOccupants.map((occ, idx) => (
                          <div 
                            key={`occupant-${occ.name}-${occ.age}-${idx}`} 
                            className="flex items-center justify-between text-xs bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="font-semibold text-slate-700">{occ.name}</span>
                              <span className="text-slate-400 text-[10px]">({occ.age} ans)</span>
                            </div>
                            <span className="text-[10px] text-indigo-600 font-medium px-1.5 py-0.5 bg-indigo-50/60 rounded">
                              {occ.condition}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-400 font-medium italic">
                        Aucun soin en cours dans cette aile
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-right">
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              Gérer la configuration des services & affectations
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Recent Activity Log - Medical Style */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-7 shadow-sm flex flex-col justify-between space-y-6" id="log-monitor-card">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 tracking-tight text-lg">Activité Récente</h3>
            <p className="text-sm text-slate-500">Évènements et flux de patients en direct.</p>
          </div>

          <div className="space-y-4 h-[250px] overflow-y-auto pr-2 custom-scrollbar" id="recent-activity-list">
            {activeSimulationLog.map((log, index) => (
              <div key={`sim-log-${index}-${log.substring(0, 15)}`} className="flex gap-3 animate-fade-in">
                <div className="mt-1 w-2 h-2 rounded-full bg-[#26a69a]/40 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{log.split('] ')[1] || log}</p>
                  <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{log.match(/\[(.*?)\]/)?.[1] || 'Maintenant'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 border border-orange-100/50 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Notification</span>
              <p className="text-xs text-slate-700">
                L'abonnement de Sophie Bernard arrive à expiration bientôt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Downside highlights - Active subscriptions and payment warnings */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-7 shadow-sm space-y-6" id="alerts-and-debts-list">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 tracking-tight text-base">Alertes & Dossiers de Paiements Recommandés</h3>
            <p className="text-xs text-slate-500">Mise en évidence des abonnements ayant une dette financière active ou un besoin de renouvellement.</p>
          </div>
          <button
            onClick={() => onNavigateToTab('contracts')}
            className="text-xs font-semibold px-3 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 rounded-lg border border-slate-100"
          >
            Voir tous les abonnements
          </button>
        </div>

        <div className="overflow-x-auto" id="debts-alert-table-container">
          <table className="w-full text-left border-collapse text-sm text-slate-600 min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-2.5">Numéro Dossier</th>
                <th className="py-2.5">Patient</th>
                <th className="py-2.5">Type Pack</th>
                <th className="py-2.5">Séances Restantes</th>
                <th className="py-2.5">Dû Total</th>
                <th className="py-2.5">Reste à Payer</th>
                <th className="py-2.5">Statut de dette</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {processedAbos.map((item, idx) => {
                const abo = abonnements[idx];
                const patient = patients.find(p => p.id === item.pack?.id || p.id === abo?.patient_id);
                if (!patient) return null;
                const aboId = abo?.id || `abo-idx-${idx}`;
                return (
                  <tr key={aboId} className="hover:bg-slate-50/50" id={`row-alert-${aboId}`}>
                    <td className="py-3 font-mono text-xs text-slate-800">{abo?.name || '—'}</td>
                    <td className="py-3 text-slate-900">{patient.name}</td>
                    <td className="py-3 text-slate-700">{item.pack?.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${item.remaining_sessions <= 2 ? 'bg-red-50 text-red-700 font-bold' : 'bg-slate-100 text-slate-700'}`}>
                        {item.remaining_sessions} / {item.number_of_sessions}
                      </span>
                    </td>
                    <td className="py-3 text-slate-900">{formatCurrency(item.total_avec_remise)}</td>
                    <td className="py-3 text-rose-600 font-bold">
                      {item.amount_remaining > 0 ? formatCurrency(item.amount_remaining) : "—"}
                    </td>
                    <td className="py-3">
                      {item.state === 'with_debt' && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold border border-amber-200">
                          Avec dette
                        </span>
                      )}
                      {item.state === 'without_debt' && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold border border-emerald-200">
                          Sans dette
                        </span>
                      )}
                      {item.state === 'abonnement_end' && (
                        <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded font-bold border border-rose-200">
                          Terminé
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigateToTab('contracts')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Enregistrer paiement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
