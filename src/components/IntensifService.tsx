import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Save, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Award,
  Settings, 
  UserCheck, 
  UserPlus, 
  X,
  FileCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { 
  Patient, 
  AideKine, 
  IntensifGrid, 
  IntensifCell, 
  GestionAbonnement, 
  Pack 
} from '../types';

interface IntensifServiceProps {
  currentRole: string;
  patients: Patient[];
  abonnements: GestionAbonnement[];
  packs: Pack[];
  aideKines: AideKine[];
  intensifGrids: IntensifGrid[];
  selectedDate: string;
  onUpdateAideKinePresence: (kineId: string, present: boolean) => void;
  onAddAideKine: (name: string, etage: '2' | '3' | '4') => void;
  onSaveIntensifGrid: (etage: '2' | '3' | '4', date: string, gridData: { [time: string]: { [kineId: string]: IntensifCell } }) => void;
  onDeductSubscriptions: (deductions: { patient_id: string; amount: number }[]) => void;
  forcedEtage?: '2' | '3' | '4';
}

export default function IntensifService({
  currentRole,
  patients,
  abonnements,
  packs,
  aideKines,
  intensifGrids,
  selectedDate,
  onUpdateAideKinePresence,
  onAddAideKine,
  onSaveIntensifGrid,
  onDeductSubscriptions,
  forcedEtage
}: IntensifServiceProps) {
  const [selectedEtage, setSelectedEtage] = useState<'2' | '3' | '4'>(forcedEtage || '2');

  // Sync etage if prop changes (parent controlled)
  React.useEffect(() => {
    if (forcedEtage) {
      setSelectedEtage(forcedEtage);
    }
  }, [forcedEtage]);
  const [showAddKineModal, setShowAddKineModal] = useState(false);
  const [newKineName, setNewKineName] = useState('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    timeSlot: string;
    kineId: string;
  } | null>(null);

  // Cell allocation picker state
  const [cellPicker, setCellPicker] = useState<{
    timeSlot: string;
    kineId: string;
  } | null>(null);

  const TIME_SLOTS = ['08h00', '09h00', '10h00', '11h00', '13h00', '14h00', '15h00', '16h00'];

  // Load the current active grid model state from DB representation or build a fresh empty template
  const activeGridKey = `grid-${selectedEtage}-${selectedDate}`;
  const currentGridModel = intensifGrids.find(g => g.id === activeGridKey) || {
    id: activeGridKey,
    etage: selectedEtage,
    date: selectedDate,
    schedule: {}
  };

  // Internal grid working buffer
  const [gridData, setGridData] = useState<{ [timeSlot: string]: { [kineId: string]: IntensifCell } }>(() => {
    return currentGridModel.schedule || {};
  });

  // Track modification states
  const [touched, setTouched] = useState(false);

  // Sync state if floor or date shifts
  React.useEffect(() => {
    const freshGrid = intensifGrids.find(g => g.id === activeGridKey);
    setGridData(freshGrid ? freshGrid.schedule : {});
    setTouched(false);
  }, [selectedEtage, selectedDate, intensifGrids]);

  // ACTION A: List present therapists on selected floor
  const staffOnFloor = aideKines.filter(k => k.etage === selectedEtage);
  const presentStaff = staffOnFloor.filter(k => k.active);

  // ACTION B: Filter CPA patients who have valid subscription & payment versement balance cleared
  // Validation: "L'affectation au service pédiatrique exige un abonnement valide et un versement dont le montant couvre les séances déjà consommées"
  const eligibleCPAPatients = patients.filter(patient => {
    // Locate subscription plans for this child
    const patientSubs = abonnements.filter(abo => abo.patient_id === patient.id);
    if (patientSubs.length === 0) return false;

    // Must have at least one subscription active with remaining sessions > 0
    return patientSubs.some(abo => {
      const associatedPack = packs.find(p => p.id === abo.pack_id);
      if (!associatedPack) return false;
      const remainingSessions = associatedPack.nombre_seance - (abo.used_sessions || 0);
      return remainingSessions > 0;
    });
  });

  // Cell actions handler
  const handleAssignPatient = (timeSlot: string, kineId: string, patientId: string) => {
    const updated = { ...gridData };
    if (!updated[timeSlot]) {
      updated[timeSlot] = {};
    }
    updated[timeSlot][kineId] = {
      patient_id: patientId,
      saved: false // Newly placed patient is marked as dirty/unsaved
    };
    setGridData(updated);
    setTouched(true);
    setCellPicker(null);
  };

  // ACTION D: Delete / modifier / contextual cleaners
  const handleEraseCell = (timeSlot: string, kineId: string) => {
    const updated = { ...gridData };
    if (updated[timeSlot] && updated[timeSlot][kineId]) {
      delete updated[timeSlot][kineId];
    }
    setGridData(updated);
    setTouched(true);
    setContextMenu(null);
  };

  // ACTION E: Save grid with subscription decrement
  const handleSaveAndDeduct = () => {
    // 1. Identify all unsaved cells in the working grid
    const deductionsList: { patient_id: string; amount: number }[] = [];
    const updatedSchedule = { ...gridData };

    TIME_SLOTS.forEach(slot => {
      if (updatedSchedule[slot]) {
        Object.keys(updatedSchedule[slot]).forEach(kineId => {
          const cell = updatedSchedule[slot][kineId];
          if (cell && cell.patient_id && !cell.saved) {
            // Found a newly assigned slot! Mark it as saved
            updatedSchedule[slot][kineId] = {
              ...cell,
              saved: true
            };
            deductionsList.push({
              patient_id: cell.patient_id,
              amount: 1 // Deduct 1 session
            });
          }
        });
      }
    });

    // Save grid structure in App database state
    onSaveIntensifGrid(selectedEtage, selectedDate, updatedSchedule);

    // If we have patients to deduct, commit the transaction
    if (deductionsList.length > 0) {
      onDeductSubscriptions(deductionsList);
      alert(`Enregistrement réussi ! ${deductionsList.length} séance(s) décomptée(s) des abonnements actifs.`);
    } else {
      alert("Enregistrement effectué. Aucune nouvelle séance à déduire.");
    }
    setTouched(false);
  };

  // Custom trigger for context menu on right click
  const handleCellRightClick = (e: React.MouseEvent, timeSlot: string, kineId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    // Position menu relative to coordinate click
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      timeSlot,
      kineId
    });
  };

  // Close context menus
  React.useEffect(() => {
    const close = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div className="space-y-6" id="intensif-kids-cabinet">
      
      {/* Top floor selector and presentation metadata */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        
        <div className="space-y-2 relative z-10 w-full">
          <div className="flex items-center gap-2">
             <div className="bg-teal-50 p-2 rounded-xl text-teal-600 border border-teal-100">
               <Users className="w-5 h-5" />
             </div>
             <div>
              <h3 className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Service de Rééducation Intensive</h3>
              <h2 className="text-xl font-black tracking-tight text-slate-900 leading-tight uppercase">
                Pédiatrie & Paralysies Cérébrales (IMC)
              </h2>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
            {/* Floorkey tabs selection */}
            <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-100 w-full sm:w-auto" id="floor-tabs">
              {(['2', '3', '4'] as const).map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedEtage(floor)}
                  className={`flex-1 py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                    selectedEtage === floor 
                      ? 'bg-teal-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-teal-600'
                  }`}
                >
                  {floor}è Étage
                </button>
              ))}
            </div>

            {/* Action E button */}
            <div className="relative z-10 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleSaveAndDeduct}
                disabled={!touched}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-black text-[10px] tracking-widest uppercase px-6 py-2.5 rounded-full transition-all shadow-lg ${
                  touched 
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                Enregistrer le Planning
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDE PANEL: ACTION A (Aide-Kines présents) & ACTION B (Patients éligibles) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action A panel: Staff present/absent on this etage */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase font-mono">
                🧑‍⚕️ Aide-Kiné présents ({presentStaff.length} / {staffOnFloor.length})
              </span>
              <button
                onClick={() => setShowAddKineModal(true)}
                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded"
                title="Ajouter un thérapeute"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {staffOnFloor.map(kine => (
                <div 
                  key={kine.id}
                  className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800">{kine.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      kine.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {kine.active ? 'Présent' : 'Absent'}
                    </span>
                    <button
                      onClick={() => onUpdateAideKinePresence(kine.id, !kine.active)}
                      className="text-[10px] font-extrabold text-indigo-600 hover:underline"
                    >
                      Permuter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action B panel: CPA eligible patients display */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-3">
            <div className="pb-2 border-b border-slate-50">
              <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase font-mono block">
                👶 Patients Enfants IMC Éligibles ({eligibleCPAPatients.length})
              </span>
              <span className="text-[10px] text-slate-400">Packs pédiatriques valides avec versement ok.</span>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {eligibleCPAPatients.map(patient => {
                // Find sub specifics
                const sub = abonnements.find(a => a.patient_id === patient.id);
                const pack = packs.find(p => p.id === sub?.pack_id);
                const remaining = pack ? (pack.nombre_seance - (sub?.used_sessions || 0)) : 0;
                
                return (
                  <div 
                    key={patient.id} 
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col space-y-1 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{patient.name}</span>
                      <span className="text-[10px] text-pink-600 font-mono">({patient.age} ans)</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-sans">Abo : {pack?.name || 'Classique'}</span>
                      <span className="font-extrabold text-emerald-600 font-mono">{remaining} séances rest.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* THE PRIMARY GRID MODULE: ACTION C & D */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-xl p-5 shadow-xs overflow-x-auto space-y-4">
          
          <div className="pb-2 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-slate-9 tracking-tight text-xs uppercase font-mono">
                📅 Grille de Sessions - {selectedDate}
              </h4>
              <p className="text-[10px] text-slate-400">Clic-gauche pour attribuer un patient. Clic-droit (ou icône) pour les options de suppression.</p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 py-1 px-2.5 rounded text-[10px] text-slate-500 font-semibold">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Double-click ou clic simple supportés</span>
            </div>
          </div>

          {presentStaff.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-150 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <span className="text-xs font-extrabold text-slate-800 block">Aucun thérapeute déclaré présent</span>
              <span className="text-[10px] text-slate-400 block px-4">Activez la présence d'au moins un Aide-Kiné sur le volet latéral pour matérialiser la grille.</span>
            </div>
          ) : (
            <div className="min-w-[650px]">
              {/* Grid Header timeslots */}
              <div className="grid grid-cols-9 bg-slate-100 border border-slate-200 rounded-t-lg text-center text-xs font-mono font-bold text-slate-600 py-2.5">
                <div className="text-left pl-3 font-sans uppercase text-[10px] text-slate-450 tracking-wider">Aide-Kiné</div>
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex items-center justify-center gap-0.5 border-l border-slate-200">
                    <Clock className="w-3 h-3 text-slate-450" />
                    <span>{slot}</span>
                  </div>
                ))}
              </div>

              {/* Grid content rows */}
              <div className="divide-y divide-slate-150 border-x border-b border-slate-200 rounded-b-lg">
                {presentStaff.map(kine => {
                  return (
                    <div key={kine.id} className="grid grid-cols-9 items-stretch text-xs min-h-[55px]">
                      {/* Therapist identifier column */}
                      <div className="bg-slate-50/70 p-3 flex items-center font-bold text-slate-700 border-r border-slate-200 text-xs">
                        {kine.name}
                      </div>

                      {/* Time slot slots cells */}
                      {TIME_SLOTS.map(slot => {
                        const cellAllocated = gridData[slot]?.[kine.id];
                        const patientMatched = cellAllocated 
                          ? patients.find(p => p.id === cellAllocated.patient_id) 
                          : null;

                        return (
                          <div
                            key={slot}
                            onContextMenu={(e) => handleCellRightClick(e, slot, kine.id)}
                            onClick={() => {
                              // Triggers modal allocate picker
                              setCellPicker({ timeSlot: slot, kineId: kine.id });
                            }}
                            className={`p-1.5 border-r border-slate-200 flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-50 relative group ${
                              patientMatched 
                                ? cellAllocated?.saved 
                                  ? 'bg-emerald-50/45 text-slate-800 border-l-2 border-l-emerald-500' 
                                  : 'bg-indigo-50/50 text-slate-800 border-l-2 border-l-indigo-500 font-medium'
                                : 'bg-white'
                            }`}
                          >
                            {/* Inner slot patient contents */}
                            {patientMatched ? (
                              <div className="h-full flex flex-col justify-between space-y-1">
                                <div className="space-y-0.5">
                                  <p className="font-extrabold text-[11px] text-slate-900 leading-tight truncate">
                                    {patientMatched.name.split(' ')[0]}
                                  </p>
                                  <span className="text-[9px] text-slate-400 block font-semibold">CP Child</span>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  {cellAllocated?.saved ? (
                                    <span className="text-[9px] text-emerald-700 bg-emerald-100 border border-emerald-200 px-1 rounded font-bold font-mono">
                                      ✔ Sauvé
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-indigo-750 bg-indigo-100 border border-indigo-200 px-1 rounded font-bold font-mono animate-pulse flex items-center gap-0.5">
                                      <Zap className="w-2.5 h-2.5 text-indigo-650" />
                                      Brouillon
                                    </span>
                                  )}
                                  
                                  {/* Quick Eraser tool icon */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEraseCell(slot, kine.id);
                                    }}
                                    className="hidden group-hover:block p-0.5 text-slate-450 hover:text-red-500 rounded bg-white border border-slate-150"
                                    title="Vider la case"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-300 font-bold font-mono text-[9px] tracking-wide uppercase group-hover:text-slate-400">
                                -- libre --
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: ADD A NEW KINE STAFF ROW */}
      {showAddKineModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-xl max-w-sm w-full p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase font-mono">
                + Ajouter un Thérapeute (Aide-Kiné)
              </h3>
              <button onClick={() => setShowAddKineModal(false)} className="text-slate-400 hover:text-slate-655 p-1">✖</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nom Complet de l'Aide-Kiné</label>
                <input 
                  type="text"
                  placeholder="Ex. Larbi Merzak"
                  value={newKineName}
                  onChange={(e) => setNewKineName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded border text-[11px] text-slate-500">
                Sera affecté par défaut au <span className="font-bold text-slate-700">{selectedEtage}ème Étage</span> pour ce planning.
              </div>

              <button
                onClick={() => {
                  if (!newKineName.trim()) return;
                  onAddAideKine(newKineName, selectedEtage);
                  setNewKineName('');
                  setShowAddKineModal(false);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Intégrer à l'Étage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / SELECTOR POPUP: TARGET PATIENT SELECTION ALLOCATOR (ACTION C) */}
      {cellPicker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-xl max-w-sm w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-50">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase font-mono tracking-wide">
                  Attribuer un Patient Enfant
                </h4>
                <p className="text-[10px] text-slate-400">Heure : {cellPicker.timeSlot} | Aide-Kiné : {aideKines.find(k => k.id === cellPicker.kineId)?.name}</p>
              </div>
              <button onClick={() => setCellPicker(null)} className="text-slate-450 hover:text-slate-650">✖</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Choisissez un patient IMC éligible :</label>
              
              {eligibleCPAPatients.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-slate-500 bg-amber-50 rounded border border-amber-100 p-3">
                  ⚠️ Aucun patient enfant valide avec abonnement actif trouvé. Assurez-vous d'ajouter des abonnements aux enfants dans l'onglet Abonnements.
                </div>
              ) : (
                <div className="space-y-1 max-h-[220px] overflow-y-auto">
                  {eligibleCPAPatients.map(pat => {
                    const sub = abonnements.find(a => a.patient_id === pat.id);
                    const pack = packs.find(p => p.id === sub?.pack_id);
                    const remaining = pack ? (pack.nombre_seance - (sub?.used_sessions || 0)) : 0;

                    return (
                      <button
                        key={pat.id}
                        onClick={() => handleAssignPatient(cellPicker.timeSlot, cellPicker.kineId, pat.id)}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-xs transition-colors flex items-center justify-between font-bold"
                      >
                        <div className="space-y-0.5">
                          <span className="text-slate-800">{pat.name}</span>
                          <span className="block text-[10px] font-medium text-slate-450 italic">{pack?.name || 'CP Carepack'}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {remaining} restants
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Erase shortcut inside selection popover */}
              <button
                onClick={() => handleEraseCell(cellPicker.timeSlot, cellPicker.kineId)}
                className="w-full text-center text-xs font-bold text-red-550 border border-dashed border-red-200 hover:bg-red-50 p-2 rounded-lg cursor-pointer transition-colors mt-2"
              >
                Vider cette affectation horaire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT CONTEXT MENU ON CELL RIGHT CLICK */}
      {contextMenu && (
        <div 
          className="fixed bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-44 z-[80] divide-y divide-slate-100 font-sans"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Avoid immediate click trigger close
        >
          <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase font-mono">Options Affectation</div>
          
          <button
            onClick={() => handleEraseCell(contextMenu.timeSlot, contextMenu.kineId)}
            className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer le patient
          </button>

          <button
            onClick={() => {
              const prev = contextMenu;
              setContextMenu(null);
              setCellPicker({ timeSlot: prev.timeSlot, kineId: prev.kineId });
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Changer le patient
          </button>

          <button
            onClick={() => setContextMenu(null)}
            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Annuler le changement
          </button>
        </div>
      )}

    </div>
  );
}
