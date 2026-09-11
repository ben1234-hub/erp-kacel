import React, { useState } from 'react';
import { 
  X, 
  User, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldAlert, 
  Stethoscope, 
  FileText, 
  Activity, 
  Clock, 
  History, 
  CreditCard,
  Briefcase,
  ChevronRight,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { Patient, GestionAbonnement, Pack, Versement, KinesitherapyAppointment, BalneotherapieAppointment, ConsultationQueueItem } from '../types';
import { formatCurrency, computeSubscriptionDetails } from '../utils';
import PatientStepper from './PatientStepper';
import { ShieldCheck } from 'lucide-react';
import SupportIdentiteAdministrative from './SupportIdentiteAdministrative';
import FicheEvaluationPediatrique from './FicheEvaluationPediatrique';
import PlanningPrevisionnelIMC from './PlanningPrevisionnelIMC';
import { OrientationTab, OrientationData, defaultOrientationData } from './OrientationTab';

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (updated: Patient) => void;
  onAddToWaitlist?: (patientId: string, serviceType: 'adulte' | 'imc') => void;
  isAdmin?: boolean;
  currentRole?: string;
  isEditMode?: boolean;
  abonnements: GestionAbonnement[];
  packs: Pack[];
  versements: Versement[];
  kineApps: KinesitherapyAppointment[];
  balneoApps: BalneotherapieAppointment[];
  consultationQueue?: ConsultationQueueItem[];
  translucentWhite?: boolean;
  dbState?: any;
  onSave?: (state: any) => void;
  triggerToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function PatientDetailsModal({
  patient: rawPatient,
  onClose,
  onDelete,
  onUpdate,
  onAddToWaitlist,
  isAdmin,
  currentRole,
  isEditMode,
  abonnements,
  packs,
  versements,
  kineApps,
  balneoApps,
  consultationQueue = [],
  translucentWhite = false,
  dbState,
  onSave,
  triggerToast
}: PatientDetailsModalProps) {
  const patient = (() => {
    const p = rawPatient as any;
    const id = String(p.id || p.ID_Patient || '');
    const dossier_num = p.dossier_num || p.code_patient_origine || `PAT_${id}`;
    const name = p.name || p.Nom_Patient || '';
    const name_arab = p.name_arab || (p.Nom_Pat_Arb ? `${p.Pren_Pat_Arb || ''} ${p.Nom_Pat_Arb}`.trim() : '');
    const gender = p.gender || (p.Genre_Patient === 'Homme' ? 'M' : p.Genre_Patient === 'Femme' ? 'F' : 'Autre');
    const age = p.age !== undefined ? p.age : (p.Age_Patient !== undefined ? p.Age_Patient : (p.Age_Pat !== undefined ? p.Age_Pat : 0));
    const date_naissance = p.date_naissance || p.Date_Nais_Pat || '';
    return {
      ...p,
      id,
      dossier_num,
      name,
      name_arab,
      gender,
      age,
      date_naissance,
      phone: p.phone || '',
      email: p.email || '',
      date_creation: p.date_creation || p.Date_Abn || new Date().toISOString().split('T')[0],
      wilaya: p.wilaya || '',
      street: p.street || p.address || '',
      city: p.city || '',
    };
  })();

  const [editablePatient, setEditablePatient] = useState(patient);
  
  const getPatientTypeString = (p: any) => {
    if (!p) return '';
    return String(p.patient_type || p.Type_Patient || p.type_patient || p.Genre_Patient || '').toLowerCase();
  };
  const isEnfantIMC = getPatientTypeString(rawPatient).includes('imc') || getPatientTypeString(patient).includes('imc');
  const [folderTab, setFolderTab] = useState<string>(() => {
    return isEnfantIMC ? 'fiche_pediatrique' : 'abonnements';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminSupport, setShowAdminSupport] = useState(false);
  const [orientationData, setOrientationData] = useState<OrientationData>((patient as any).orientation || defaultOrientationData);

  const isMPR = currentRole === 'mpr_doctor';
  const canEditMedical = isMPR || isAdmin || isEditMode;

  const handleSaveMedical = () => {
    if (onUpdate) {
      setIsSaving(true);
      onUpdate(editablePatient);
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const patientAbos = abonnements.filter(a => a.patient_id === patient.id);
  const patientKineHistory = kineApps.filter(app => 
    app.selected_acts.some(sa => sa.patient_id === patient.id)
  );
  const patientBalneoHistory = balneoApps.filter(app => 
    app.patients.some(p => p.patient_id === patient.id)
  );

  return (
    <div className={translucentWhite ? "fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" : "fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"}>
      <div className={translucentWhite ? "bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[3rem] max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col h-[90vh] relative text-slate-800 animate-in fade-in zoom-in-95 duration-200" : "bg-brand-dark-light border border-white/10 rounded-[3rem] max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[90vh] relative text-white"}>
        <div className="absolute inset-0 bg-wave-pattern opacity-5 pointer-events-none" />
        
        {/* Header - Identité (Fixed Top) */}
        <div className={translucentWhite ? "p-8 bg-slate-50/50 border-b border-slate-200/50 shrink-0 relative z-10" : "p-8 bg-white/[0.02] border-b border-white/5 shrink-0 relative z-10"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={translucentWhite ? "w-20 h-20 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-600 shadow-md relative group overflow-hidden" : "w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black text-brand-yellow shadow-2xl relative group overflow-hidden"}>
                <div className={translucentWhite ? "absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" : "absolute inset-0 bg-brand-yellow opacity-0 group-hover:opacity-10 transition-opacity"} />
                {patient.gender === 'M' ? 'H' : 'F'}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-4 overflow-hidden">
                  <h2 className={translucentWhite ? "text-display text-2xl font-black tracking-tight text-slate-900 uppercase truncate" : "text-display text-2xl font-black tracking-tight text-white uppercase truncate"}>{patient.name}</h2>
                  {patient.name_arab && <span className="text-xl font-black text-slate-500 font-arabic shrink-0" dir="rtl">{patient.name_arab}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={translucentWhite ? "text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase font-mono bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200" : "text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase font-mono bg-white/5 px-4 py-1.5 rounded-full border border-white/5"}>
                    N° DOSSIER • {patient.dossier_num || patient.id.slice(-4).toUpperCase()}
                  </span>
                  <button 
                    onClick={() => setShowAdminSupport(true)}
                    className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">État Civil & Identité</span>
                  </button>
                  {(() => {
                    const queueItem = consultationQueue.find(q => 
                      q.patient_name.toLowerCase() === patient.name.toLowerCase() && 
                      (q.date === new Date().toISOString().split('T')[0] || q.date === '2026-05-30')
                    );
                    return queueItem ? (
                      <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">En Consultation</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (patient as any).patient_type === 'Enfant IMC' && onAddToWaitlist && (
                <button 
                  onClick={() => onAddToWaitlist(patient.id, 'imc')}
                  className="bg-brand-yellow hover:bg-[#fff700] text-brand-dark text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  CONSULTATION IMC
                </button>
              )}
              <button 
                onClick={onClose}
                className={translucentWhite ? "p-3 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200 group" : "p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"}
              >
                <X className={translucentWhite ? "w-6 h-6 text-slate-400 group-hover:text-slate-700 transition-colors" : "w-6 h-6 text-slate-500 group-hover:text-white transition-colors"} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Queue Tracking Information Area */}
        {(() => {
          const queueItem = consultationQueue.find(q => 
            q.patient_name.toLowerCase() === patient.name.toLowerCase() && 
            (q.date === new Date().toISOString().split('T')[0] || q.date === '2026-05-30')
          );
          if (!queueItem) return null;
          return (
            <div className={translucentWhite ? "mx-8 mt-6 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-between gap-8 animate-fade-in relative z-10 shadow-sm" : "mx-8 mt-6 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between gap-8 animate-fade-in relative z-10 shadow-2xl"}>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">File d'Attente Dynamique</p>
                <h4 className={translucentWhite ? "text-xl font-black text-slate-900 uppercase tracking-tight" : "text-xl font-black text-white uppercase tracking-tight"}>Status de Navigation du Patient</h4>
              </div>
              <div className="flex-1 max-w-sm">
                <PatientStepper status={queueItem.status as any} compact={true} />
              </div>
              <div className="text-right">
                <p className={translucentWhite ? "text-[10px] font-black text-indigo-650 uppercase tracking-widest font-mono" : "text-[10px] font-black text-brand-yellow uppercase tracking-widest font-mono"}>ORDRE : {(queueItem as any).order || 1}</p>
                <p className="text-xs text-slate-400 font-black uppercase mt-1">Estimé : {((queueItem as any).order || 1) * 10} MIN</p>
              </div>
            </div>
          );
        })()}

        {/* Administrative Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main Stats Rail */}
            <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Âge', value: `${editablePatient.age} ans`, icon: Activity },
                { label: 'Naissance', value: (editablePatient as any).birth_date ? new Date((editablePatient as any).birth_date).toLocaleDateString() : '-', icon: Calendar },
                { label: 'Segment', value: (editablePatient as any).patient_type || 'Général', icon: ShieldAlert },
                { label: 'Wilaya', value: (editablePatient as any).wilaya || 'Alger', icon: MapPin },
              ].map((stat, i) => (
                <div key={stat.label} className={translucentWhite ? "bg-slate-50 border border-slate-200 p-6 rounded-[2rem] group hover:border-indigo-500/30 transition-all" : "bg-white/5 border border-white/5 p-6 rounded-[2rem] group hover:border-brand-yellow/30 transition-all"}>
                  <p className={translucentWhite ? "text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mb-2 group-hover:text-indigo-600 transition-colors" : "text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono mb-2 group-hover:text-brand-yellow/60 transition-colors"}>{stat.label}</p>
                  <p className={translucentWhite ? "text-xl font-black text-slate-800 leading-none uppercase tracking-tight" : "text-xl font-black text-white leading-none uppercase tracking-tight"}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Sidebar Contact Info */}
            <div className={translucentWhite ? "md:col-span-4 bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4" : "md:col-span-4 bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4"}>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Contact Mobile</p>
                <p className={translucentWhite ? "text-xl font-black text-indigo-600 font-mono tracking-tighter" : "text-xl font-black text-brand-yellow font-mono tracking-tighter"}>{editablePatient.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Identifiant Dossier</p>
                <p className={translucentWhite ? "text-lg font-black text-slate-800 font-mono tracking-widest" : "text-lg font-black text-white font-mono tracking-widest"}>{(editablePatient as any).dossier_number || editablePatient.id.slice(-4).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {(() => {
            const getTabClass = (tabId: string) => {
              const isActive = folderTab === tabId;
              return `px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 flex items-center gap-3 shrink-0 ${
                isActive
                  ? translucentWhite 
                    ? 'border-indigo-650 text-indigo-650 bg-indigo-50/30' 
                    : 'border-brand-yellow text-brand-yellow bg-white/5' 
                  : translucentWhite 
                    ? 'border-transparent text-slate-500 hover:text-slate-800' 
                    : 'border-transparent text-slate-500 hover:text-white'
              }`;
            };

            return (
              <div className={translucentWhite ? "flex border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-md z-20 items-center justify-between gap-4 px-6 overflow-x-auto no-scrollbar" : "flex border-b border-white/5 sticky top-0 bg-brand-dark-light z-20 items-center justify-between gap-4 px-6 overflow-x-auto no-scrollbar"}>
                <div className="flex items-center overflow-x-auto no-scrollbar w-full">
                  {isEnfantIMC ? (
                    <>
                      <button 
                        onClick={() => setFolderTab("fiche_pediatrique")}
                        className={getTabClass("fiche_pediatrique")}
                      >
                        <FileText className="w-4 h-4" />
                        1. Fiche d'évaluation pédiatrique
                      </button>

                      <button 
                        onClick={() => setFolderTab("planning_previsionnel")}
                        className={getTabClass("planning_previsionnel")}
                      >
                        <Calendar className="w-4 h-4" />
                        2. Planning prévisionnel
                      </button>

                      <button 
                        onClick={() => setFolderTab("abonnements")}
                        className={getTabClass("abonnements")}
                      >
                        <CreditCard className="w-4 h-4" />
                        3. Abonnements & Forfaits
                      </button>

                      <button 
                        onClick={() => setFolderTab("historique")}
                        className={getTabClass("historique")}
                      >
                        <History className="w-4 h-4" />
                        4. Historique de Soins / Chronologie
                      </button>

                      <button 
                        onClick={() => setFolderTab("orientation")}
                        className={getTabClass("orientation")}
                      >
                        <Compass className="w-4 h-4" />
                        5. Orientation
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setFolderTab("medical_dossier")}
                        className={getTabClass("medical_dossier")}
                      >
                        <Stethoscope className="w-4 h-4" />
                        Dossier Médical
                      </button>

                      <button 
                        onClick={() => setFolderTab("abonnements")}
                        className={getTabClass("abonnements")}
                      >
                        <CreditCard className="w-4 h-4" />
                        Ses Abonnements
                      </button>

                      <button 
                        onClick={() => setFolderTab("historique")}
                        className={getTabClass("historique")}
                      >
                        <History className="w-4 h-4" />
                        Historique / Chronologie
                      </button>

                      <button 
                        onClick={() => setFolderTab("orientation")}
                        className={getTabClass("orientation")}
                      >
                        <Compass className="w-4 h-4" />
                        Orientation
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="p-8 space-y-6">
            {/* 1. Abonnements & Forfaits (commun ou IMC) */}
            {folderTab === 'abonnements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {patientAbos.length > 0 ? (
                  patientAbos.map(abo => {
                    const details = computeSubscriptionDetails(abo, packs, versements);
                    const packName = packs.find(p => p.id === abo.pack_id)?.name || 'Pack';
                    return (
                      <div key={abo.id} className={translucentWhite ? "bg-white/60 border border-slate-200/80 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-indigo-500/20 transition-all shadow-md" : "glass-card p-8 flex flex-col justify-between group hover:border-brand-yellow/20 transition-all shadow-xl"}>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <span className={translucentWhite ? "text-[10px] font-black font-mono text-indigo-650 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest" : "text-[10px] font-black font-mono text-brand-yellow bg-brand-yellow/10 px-4 py-1.5 rounded-full border border-brand-yellow/10 uppercase tracking-widest"}>{abo.name}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                              details.state === 'with_debt' 
                                ? translucentWhite ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-rose-500/20 text-rose-500' 
                                : translucentWhite ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-emerald-500/20 text-emerald-500'
                            }`}>
                              {details.state === 'with_debt' ? 'Dette en cours' : 'Réglé'}
                            </span>
                          </div>
                          <h3 className={translucentWhite ? "text-2xl font-black text-slate-900 uppercase tracking-tight leading-none pt-2" : "text-2xl font-black text-white uppercase tracking-tight leading-none pt-2"}>{packName}</h3>
                          <p className={translucentWhite ? "text-xs text-slate-400 font-bold font-mono tracking-widest uppercase" : "text-xs text-slate-600 font-bold font-mono tracking-widest uppercase"}>Inscrit le {abo.date}</p>
                        </div>
                        <div className={translucentWhite ? "mt-8 pt-6 border-t border-slate-200/60 flex items-end justify-between" : "mt-8 pt-6 border-t border-white/5 flex items-end justify-between"}>
                          <div className="space-y-1">
                            <p className={translucentWhite ? "text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono" : "text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono"}>Séances restantes</p>
                            <p className={translucentWhite ? "text-3xl font-black text-slate-800 tracking-tighter font-mono" : "text-3xl font-black text-white tracking-tighter font-mono"}>{details.remaining_sessions} <span className={translucentWhite ? "text-xs text-slate-400 tracking-normal font-sans" : "text-xs text-slate-700 tracking-normal font-sans"}>/ {details.number_of_sessions}</span></p>
                          </div>
                          {details.state === 'with_debt' && (
                            <div className="text-right">
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">Reste à payer</p>
                              <p className="text-xl font-black text-rose-500 tracking-tight font-mono">{formatCurrency(details.amount_remaining)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={translucentWhite ? "col-span-2 py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200" : "col-span-2 py-20 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5"}>
                    <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                    <p className={translucentWhite ? "text-xs text-slate-500 font-black uppercase tracking-[0.3em]" : "text-xs text-slate-500 font-black uppercase tracking-[0.3em]"}>Aucun abonnement actif trouvé</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Dossier Médical (Patients ordinaires uniquement) */}
            {folderTab === 'medical_dossier' && !isEnfantIMC && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono border-b border-white/5 pb-4">Informations Générales</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-400">Adresse</p>
                          {canEditMedical ? (
                            <input 
                              type="text" 
                              value={editablePatient.street || ''}
                              onChange={(e) => setEditablePatient({...editablePatient, street: e.target.value})}
                              className="text-sm text-slate-700 font-medium border-b border-slate-200 outline-none w-full"
                            />
                          ) : (
                            <p className="text-sm text-slate-700 font-medium">{editablePatient.street || 'Non renseignée'}{editablePatient.city ? `, ${editablePatient.city}` : ''}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-400">Téléphone</p>
                          {canEditMedical ? (
                            <input 
                              type="text" 
                              value={editablePatient.phone || ''}
                              onChange={(e) => setEditablePatient({...editablePatient, phone: e.target.value})}
                              className="text-sm text-slate-700 font-medium font-mono border-b border-slate-200 outline-none w-full"
                            />
                          ) : (
                            <p className="text-sm text-slate-700 font-medium font-mono">{editablePatient.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-400">Sécurité Sociale (NSS)</p>
                          {canEditMedical ? (
                            <input 
                              type="text" 
                              value={editablePatient.nss || ''}
                              onChange={(e) => setEditablePatient({...editablePatient, nss: e.target.value})}
                              className="text-sm text-slate-700 font-medium font-mono border-b border-slate-200 outline-none w-full"
                            />
                          ) : (
                            <p className="text-sm text-slate-700 font-medium font-mono">{editablePatient.nss || 'Non renseigné'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono border-b border-white/5 pb-4">Diagnostic & Pathologie</h3>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Pathologie Actuelle</span>
                        </div>
                        {canEditMedical ? (
                          <textarea 
                            value={editablePatient.pathology || ''}
                            onChange={(e) => setEditablePatient({...editablePatient, pathology: e.target.value})}
                            className="text-sm font-black text-slate-900 leading-tight w-full bg-transparent border-b border-indigo-200 outline-none resize-none"
                            rows={2}
                          />
                        ) : (
                          <p className="text-sm font-black text-slate-900 leading-tight">{editablePatient.pathology || 'Aucun diagnostic saisi'}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <History className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mécanisme / Motif</span>
                        </div>
                        {canEditMedical ? (
                          <textarea 
                            value={editablePatient.mecanisme || ''}
                            onChange={(e) => setEditablePatient({...editablePatient, mecanisme: e.target.value})}
                            className="text-xs text-slate-600 italic leading-relaxed w-full bg-transparent border-b border-slate-200 outline-none resize-none"
                            rows={2}
                          />
                        ) : (
                          <p className="text-xs text-slate-600 italic leading-relaxed">{editablePatient.mecanisme || 'Non précisé'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono border-b border-white/5 pb-4">Observations Cliniques récentes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Tension', field: 'tension' as const, unit: 'mmHg' },
                      { label: 'Poids', field: 'weight' as const, unit: 'kg' },
                      { label: 'Taille', field: 'height' as const, unit: 'cm' },
                      { label: 'Pouls', field: 'heart_rate' as const, unit: 'bpm' }
                    ].map(vital => (
                      <div key={vital.label} className="bg-white border border-slate-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{vital.label}</p>
                        {canEditMedical ? (
                          <div className="flex items-center justify-center gap-1">
                            <input 
                              type="text" 
                              value={editablePatient[vital.field] || ''}
                              onChange={(e) => setEditablePatient({...editablePatient, [vital.field]: e.target.value})}
                              className="text-lg font-black text-slate-900 w-16 text-center outline-none border-b border-slate-100"
                            />
                            <span className="text-[10px] font-normal opacity-50">{vital.unit}</span>
                          </div>
                        ) : (
                            <p className="text-3xl font-black text-white font-mono">{editablePatient[vital.field] || '--'} <span className="text-[10px] font-mono text-slate-700 uppercase tracking-tighter">{vital.unit}</span></p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Antécédents</p>
                      {canEditMedical ? (
                        <textarea 
                          value={editablePatient.antecedents || ''}
                          onChange={(e) => setEditablePatient({...editablePatient, antecedents: e.target.value})}
                          className="text-sm text-slate-700 leading-relaxed w-full bg-transparent outline-none resize-none"
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed">{editablePatient.antecedents || 'Aucun antécédent médical ou chirurgical de fond renseigné.'}</p>
                      )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes de progression / Rééducation</p>
                      {canEditMedical ? (
                        <textarea 
                          value={editablePatient.rehab_progress_notes || ''}
                          onChange={(e) => setEditablePatient({...editablePatient, rehab_progress_notes: e.target.value})}
                          className="text-sm text-slate-700 leading-relaxed italic w-full bg-transparent outline-none resize-none"
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed italic">{editablePatient.rehab_progress_notes || 'En attente de la prochaine séance de révision bilan.'}</p>
                      )}
                    </div>

                    {canEditMedical && (
                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={handleSaveMedical}
                          disabled={isSaving}
                          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${
                            isSaving ? 'bg-emerald-500 text-white animate-pulse' : 'bg-brand-dark text-brand-yellow hover:scale-105 active:scale-95'
                          }`}
                        >
                          {isSaving ? (
                            <>
                              <Activity className="w-4 h-4 animate-spin" />
                              Synchronisation...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Enregistrer les changements
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Historique & Chronologie */}
            {folderTab === 'historique' && (
              <div className="space-y-4 animate-fade-in">
                {[...patientBalneoHistory, ...patientKineHistory]
                  .sort((a,b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                  .map((app, i) => {
                    const isBalneo = 'duration' in app;
                    return (
                      <div key={app.id} className={translucentWhite ? "bg-white/60 border border-slate-200/80 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-indigo-50/25 transition-all shadow-sm" : "bg-white/5 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.08] transition-all shadow-lg"}>
                        <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                            isBalneo ? 'bg-blue-500/10 text-blue-500 border-blue-500/10' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'
                          }`}>
                            {isBalneo ? <Activity className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className={translucentWhite ? "text-lg font-black text-slate-900 uppercase tracking-tight" : "text-lg font-black text-white uppercase tracking-tight"}>{isBalneo ? 'Balnéothérapie' : 'Kinésithérapie'}</h4>
                              <span className={translucentWhite ? "text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono" : "text-[9px] font-black text-white/20 uppercase tracking-widest font-mono"}>{app.id.slice(0,8)}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={translucentWhite ? "text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono" : "text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono"}>{new Date(app.appointment_date).toLocaleDateString()} • {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono">{app.state}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={translucentWhite ? "w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-2" : "w-6 h-6 text-slate-800 group-hover:text-brand-yellow transition-all group-hover:translate-x-2"} />
                      </div>
                    );
                  })}
                  {[...patientBalneoHistory, ...patientKineHistory].length === 0 && (
                    <div className={translucentWhite ? "py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200" : "py-20 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5"}>
                      <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                      <p className={translucentWhite ? "text-xs text-slate-500 font-black uppercase tracking-[0.3em]" : "text-xs text-slate-650 font-black uppercase tracking-[0.3em]"}>Aucun historique disponible</p>
                    </div>
                  )}
              </div>
            )}

            {/* 4. Onglet IMC 1 : Fiche d'évaluation pédiatrique */}
            {folderTab === "fiche_pediatrique" && isEnfantIMC && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-white text-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200/85"
              >
                <FicheEvaluationPediatrique 
                  dbState={dbState} 
                  onSave={onSave || (() => {})} 
                  patient={(() => {
                    const dbPat = dbState?.patients?.find(
                      p => Number(p.ID_Patient) === Number(patient.ID_Patient || patient.id)
                    );
                    return dbPat || {
                      ...patient,
                      ID_Patient: Number(patient.ID_Patient || patient.id),
                      Nom_Patient: patient.Nom_Patient || patient.name,
                      Prenom_Patient: patient.Prenom_Patient || '',
                      Date_Nais_Pat: patient.Date_Nais_Pat || patient.date_naissance
                    } as any;
                  })()}
                  triggerToast={triggerToast || (() => {})}
                  currentRole={currentRole}
                />
              </motion.div>
            )}

            {/* 5. Onglet IMC 2 : Planning prévisionnel */}
            {folderTab === "planning_previsionnel" && isEnfantIMC && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-slate-800 text-slate-100 p-6 rounded-3xl border border-slate-700 shadow-xl"
              >
                <PlanningPrevisionnelIMC 
                  dbState={dbState} 
                  onSave={onSave || (() => {})} 
                  patient={(() => {
                    const dbPat = dbState?.patients?.find(
                      p => Number(p.ID_Patient) === Number(patient.ID_Patient || patient.id)
                    );
                    return dbPat || {
                      ...patient,
                      ID_Patient: Number(patient.ID_Patient || patient.id),
                      Nom_Patient: patient.Nom_Patient || patient.name,
                      Prenom_Patient: patient.Prenom_Patient || '',
                      Date_Nais_Pat: patient.Date_Nais_Pat || patient.date_naissance
                    } as any;
                  })()}
                  triggerToast={triggerToast || (() => {})}
                  currentRole={currentRole}
                />
              </motion.div>
            )}

            {/* 6. Orientation */}
            {folderTab === 'orientation' && (
              <div className="space-y-8 animate-fade-in">
                <OrientationTab 
                  data={orientationData} 
                  onChange={(data) => {
                    setOrientationData(data);
                    setEditablePatient(prev => ({ ...prev, orientation: data }));
                  }}
                  translucentWhite={translucentWhite}
                />
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveMedical}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${
                      isSaving ? 'bg-emerald-500 text-white animate-pulse' : translucentWhite ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95' : 'bg-brand-dark text-brand-yellow hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Enregistrer l'orientation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={translucentWhite ? "p-6 border-t border-slate-200 bg-slate-50/80 shrink-0 flex justify-between items-center gap-3 relative z-10" : "p-6 border-t border-white/5 bg-brand-dark shrink-0 flex justify-between items-center gap-3 relative z-10"}>
          <div>
            {isAdmin && onDelete && (
              <button 
                onClick={() => {
                  if (confirm("Supprimer définitivement ce patient ?")) {
                    onDelete(patient.id);
                    onClose();
                  }
                }}
                className={translucentWhite ? "px-6 py-3 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-slate-200 hover:border-rose-300" : "px-6 py-3 text-rose-500 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-500/20"}
              >
                <Trash2 className="w-4 h-4" />
                Détruire le dossier
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className={translucentWhite ? "px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-slate-200" : "px-10 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"}
            >
              Quitter l'aperçu
            </button>
          </div>
        </div>
      </div>
      {showAdminSupport && (
        <SupportIdentiteAdministrative 
          patient={patient} 
          onClose={() => setShowAdminSupport(false)} 
        />
      )}
    </div>
  );
}
