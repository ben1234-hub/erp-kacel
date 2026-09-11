import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Clock, UserPlus, Search, Calendar, ChevronRight, 
  ClipboardList, FileText, Activity, Save, History, 
  Trash2, AlertCircle, CheckCircle2, XCircle, 
  MoreHorizontal, Phone, Mail, MapPin, 
  Stethoscope, CreditCard, ShieldCheck, 
  Heart, TrendingUp, Award, Thermometer,
  AlertTriangle,
  ArrowRight,
  Printer,
  RotateCcw,
  Hospital,
  Sparkles,
  Copy,
  Download
} from 'lucide-react';
import { 
  MedicalAppointment, 
  AppointmentState, 
  Patient,
  TypeConsultation
} from '../types';

interface ConsultationsProps {
  appointments: MedicalAppointment[];
  patients: Patient[];
  typeConsultations: TypeConsultation[];
  onUpdateAppointment: (id: string, updates: Partial<MedicalAppointment>) => void;
  onCreateAppointment: (appointment: Omit<MedicalAppointment, 'id' | 'name' | 'appointment_date' | 'state'>) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdatePatient: (updated: Patient) => void;
  currentRole: 'admin' | 'mpr_doctor' | 'egypt_doctor' | 'recept_rdc' | 'receptionist';
  onOpenPatientProfile?: (patientId: string) => void;
}

export default function Consultations({
  appointments,
  patients,
  typeConsultations,
  onUpdateAppointment,
  onCreateAppointment,
  onDeleteAppointment,
  onUpdatePatient,
  currentRole,
  onOpenPatientProfile
}: ConsultationsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTicket, setShowTicket] = useState<MedicalAppointment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'adulte' | 'enfant' | 'imc'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // États de l'utilitaire de traitement de texte (Word) pour le médecin MPR
  const [showWordUtility, setShowWordUtility] = useState(false);
  const [wordDocumentText, setWordDocumentText] = useState('');
  const [wordDocumentTitle, setWordDocumentTitle] = useState('Nouveau Document');

  const docTemplates = [
    {
      title: "Compte-rendu de consultation MPR",
      content: `CLINIQUE KACEL SANTÉ MPR\n--------------------------------------------------\nCOMPTE-RENDU DE CONSULTATION MÉDICALE\n\nDate: ${new Date().toLocaleDateString('fr-FR')}\nMédecin: Dr. MPR\n\nPATIENT:\nNom & Prénom: [Nom du patient]\nÂge: [Âge] ans\n\nEXAMEN CLINIQUE:\n- Motif de consultation: \n- Antécédents: \n- Bilan articulaire et musculaire: \n- Capacités fonctionnelles: \n\nCONCLUSION & PROTOCOLE THÉRAPEUTIQUE PRESCRIT:\n- Nombre de séances de rééducation prévues: \n- Type de rééducation: \n\nFait à Alger, le ${new Date().toLocaleDateString('fr-FR')}\nSignature & Cachet du Médecin`
    },
    {
      title: "Lettre d'orientation thérapeutique",
      content: `CLINIQUE KACEL SANTÉ MPR\n--------------------------------------------------\nLETTRE D'ORIENTATION THÉRAPEUTIQUE\n\nÀ l'attention du thérapeute / kinésithérapeute,\n\nJe vous adresse ce jour le patient [Nom du patient], âgé de [Âge] ans, pour une prise en charge en rééducation fonctionnelle.\n\nPathologie / Diagnostic retenu:\n- \n\nObjectifs de la rééducation:\n- Gain d'amplitude articulaire\n- Renforcement musculaire ciblé\n- Réadaptation à l'effort et à la marche\n\nProtocole recommandé:\n- Fréquence: [Nombre] séances par semaine\n- Techniques recommandées: physiothérapie, kinésithérapie active/passive, balnéothérapie si indiquée.\n\nEn vous remerciant pour votre collaboration.\n\nFait à Alger, le ${new Date().toLocaleDateString('fr-FR')}\nSignature & Cachet du Médecin`
    },
    {
      title: "Certificat de non-contre-indication",
      content: `CLINIQUE KACEL SANTÉ MPR\n--------------------------------------------------\nCERTIFICAT MÉDICAL\n\nJe soussigné, Dr. MPR, médecin spécialiste en Médecine Physique et Réadaptation (MPR), certifie avoir examiné ce jour le patient:\n\nM./Mme/Enfant: [Nom du patient]\nNé(e) le: [Date de naissance]\n\nEt n'avoir pas constaté, à ce jour, de signe clinique contre-indiquant la pratique de la rééducation fonctionnelle et des activités physiques adaptées au plateau thérapeutique.\n\nCe certificat est délivré à la demande de l'intéressé(e) pour servir et valoir ce que de droit.\n\nFait à Alger, le ${new Date().toLocaleDateString('fr-FR')}\nSignature & Cachet du Médecin`
    }
  ];

  useEffect(() => {
    if (showAddModal) {
      setPatientSearch('');
      setNewAppt({
        patient_id: '',
        patient_name: '',
        patient_phone: '',
        patient_age: 0,
        type: 'adu',
        amount: 2500,
        discount: 0,
        paye: false,
        is_controle: false
      });
    }
  }, [showAddModal]);
  const [conflictData, setConflictData] = useState<{
    pendingAppt: MedicalAppointment;
    activeAppt: MedicalAppointment;
  } | null>(null);

  // Form states for new appointment
  const [newAppt, setNewAppt] = useState({
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    patient_age: 0,
    type: 'ADU' as string,
    amount: 2500,
    is_controle: false,
    paye: false,
    notes: ''
  });

  const isReceptionist = currentRole === 'recept_rdc' || currentRole === 'receptionist' || currentRole === 'admin';
  const isDoctor = currentRole === 'mpr_doctor' || currentRole === 'egypt_doctor' || currentRole === 'admin';

  // Filter appointments based on role and tab
  const filteredAppointments = appointments.filter(appt => {
    // Basic type filters from UI buttons
    const typeMatch = filterType === 'all' || 
                    (filterType === 'adulte' && appt.type?.toLowerCase() === 'adu') ||
                    (filterType === 'enfant' && appt.type?.toLowerCase() === 'enf') ||
                    (filterType === 'imc' && appt.type?.toLowerCase() === 'imc');
    
    const archivedMatch = showArchived ? true : appt.state !== 'done';
    
    // Strict Role-Based Permission Filtering
    if (currentRole === 'mpr_doctor' || currentRole === 'recept_rdc') {
      // MPR and Recept RDC only see Adulte and Enfant
      if (appt.type?.toLowerCase() === 'imc') return false;
    }
    if (currentRole === 'egypt_doctor') {
      // Egyptian Doctor only sees Enfant IMC
      if (appt.type?.toLowerCase() !== 'imc') return false;
    }
    
    return typeMatch && archivedMatch;
  });

  const handleStateCycle = (appt: MedicalAppointment) => {
    let nextState: AppointmentState = appt.state;
    if (appt.state === 'confirm') nextState = 'consult';
    else if (appt.state === 'consult') nextState = 'endconsult';
    else if (appt.state === 'endconsult') return; // Needs receptionist for settlement

    onUpdateAppointment(appt.id, { state: nextState });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.patient_id) return;
    
    // Contrôle de redondance
    const isAlreadyInQueue = appointments.some(a => a.patient_id === newAppt.patient_id && a.state !== 'done');
    if (isAlreadyInQueue) {
      alert("Ce patient est déjà présent dans la file d'attente active.");
      return;
    }

    const now = new Date();
    const created: any = {
      ...newAppt,
      discount: 0,
      id: `apt-${Date.now()}`,
      name: `${newAppt.type.toUpperCase()}/${now.getDate()}/${now.getMonth()+1}/${now.getHours()}h`,
      appointment_date: now.toISOString(),
      discounted_amount: newAppt.amount,
      amount_display: newAppt.is_controle ? "Contrôle" : `${newAppt.amount} DA`,
      state: 'confirm',
    };

    onCreateAppointment(created);
    setShowAddModal(false);
    setShowTicket(created); // Trigger ticket view

    setNewAppt({
      patient_id: '',
      patient_name: '',
      patient_phone: '',
      patient_age: 0,
      type: 'adulte',
      amount: 2500,
      is_controle: false,
      paye: false,
      notes: ''
    });
  };

  const getStateLabel = (state: AppointmentState) => {
    switch (state) {
      case 'confirm': return 'En attente';
      case 'consult': return 'En Consultation';
      case 'endconsult': return 'Terminé';
      case 'done': return 'Clôturé';
      default: return state;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-teal-600 p-4 rounded-2xl shadow-lg shadow-teal-600/20">
             <Hospital className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">File d'Attente</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right hidden xl:block pr-8 border-r border-slate-100">
             <p className="text-3xl font-black text-teal-600 tracking-tighter leading-none font-mono">
               {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </p>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
               Horloge Temps Réel • Live
             </p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Bouton Archives */}
             <button 
               onClick={() => setShowArchived(!showArchived)}
               className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center border shadow-sm ${
                 showArchived 
                 ? 'bg-slate-900 text-white border-slate-900' 
                 : 'bg-white text-slate-400 border-slate-100 hover:text-teal-600 hover:border-teal-200'
               }`}
               title={showArchived ? "Masquer Archives" : "Afficher Archives"}
             >
               <History className="w-5 h-5" />
             </button>

             <div className="w-px h-10 bg-slate-100 mx-2" />

          {/* Filtre dropdown MPR */}
          {currentRole === 'mpr_doctor' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                <Activity className="w-3.5 h-3.5 text-teal-500" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-700 cursor-pointer min-w-[100px]"
                >
                  <option value="all">Tous Secteurs</option>
                  <option value="adulte">Adultes</option>
                  <option value="enfant">Enfants</option>
                </select>
              </div>

              {/* Bouton de Traitement de Texte - Version Ultra Distincte Style Microsoft Word */}
              <button
                onClick={() => {
                  setWordDocumentText(docTemplates[0].content);
                  setWordDocumentTitle(docTemplates[0].title);
                  setShowWordUtility(true);
                }}
                className="relative bg-gradient-to-r from-[#185abd] to-[#124993] hover:from-[#124993] hover:to-[#0f3c7a] text-white px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-wider transition-all duration-300 shadow-lg shadow-[#185abd]/30 ring-2 ring-[#185abd]/50 hover:ring-offset-2 flex items-center gap-2 hover:scale-105 active:scale-95 animate-pulse"
                style={{ animationDuration: '3s' }}
                title="Lancer l'utilitaire de traitement de texte local (Format Word Officiel intégré)"
              >
                <div className="absolute -top-2.5 -right-2 bg-rose-600 text-white text-[7.5px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm animate-bounce tracking-wide">
                  Traitement de texte (Word)
                </div>
                {/* W Logo icon representing MS Word */}
                <div className="flex items-center justify-center bg-white text-[#185abd] w-5 h-5 rounded font-black text-[11px] font-sans mr-1 border border-white">
                  W
                </div>
                <span className="font-extrabold">Éditeur Word Intégré</span>
              </button>
            </div>
          )}

          {/* Admin Filters */}
          {currentRole === 'admin' && (
            <div className="bg-white border border-slate-200 rounded-full p-1 flex gap-1 shadow-sm">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filterType === 'all' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-teal-600'}`}
              >
                Tous
              </button>
              <button 
                onClick={() => setFilterType('adulte')}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filterType === 'adulte' ? 'bg-teal-800 text-white shadow-md' : 'text-slate-400 hover:text-teal-600'}`}
              >
                Adulte
              </button>
              <button 
                onClick={() => setFilterType('enfant')}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filterType === 'enfant' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-amber-600'}`}
              >
                Enfant
              </button>
              <button 
                onClick={() => setFilterType('imc')}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filterType === 'imc' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-violet-600'}`}
              >
                IMC
              </button>
            </div>
          )}

          {isReceptionist && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {currentRole === 'recept_rdc' ? "Ajouter à la file" : "Nouveau"}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Main Table Container */}
      <div className="w-full">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 text-center">N°</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 text-center">Patient</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 text-center">Type Consultation</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 text-center">Prix</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 text-center">Statut Étapes</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Clock className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Aucun patient actif</p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt, idx) => (
                    <tr 
                      key={appt.id} 
                      onClick={() => {
                        if (onOpenPatientProfile) {
                          onOpenPatientProfile(appt.patient_id);
                        } else {
                          setSelectedApptId(appt.id);
                          setIsEditing(true); 
                        }
                      }}
                      className={`transition-colors group cursor-pointer ${
                        appt.state === 'endconsult' ? 'bg-teal-50/30' : 
                        selectedApptId === appt.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-6 py-3 border-r border-slate-100 text-center">
                        <span className="text-[11px] font-black text-teal-600/60 font-mono italic">#{idx + 1}</span>
                      </td>
                      <td className="px-6 py-3 border-r border-slate-100">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{appt.patient_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{appt.patient_age} ans • {appt.patient_phone || '---'}</p>
                      </td>
                      <td className="px-6 py-3 border-r border-slate-100 text-center">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                          appt.type?.toLowerCase() === 'imc' ? 'bg-violet-50 text-violet-700 border-violet-100' : 
                          appt.type?.toLowerCase() === 'enf' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-teal-50 text-teal-700 border-teal-100'
                        }`}>
                          {appt.type?.toUpperCase() || 'ADU'}
                        </span>
                        <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase">
                          {typeConsultations.find(tc => tc.code.toLowerCase() === appt.type?.toLowerCase())?.designation || 'Consultation'}
                        </p>
                      </td>
                      <td className="px-6 py-3 border-r border-slate-100 text-center">
                        <p className="text-xs font-black text-slate-700">{appt.amount ? `${appt.amount} DA` : '0 DA'}</p>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                         <div className="flex items-center justify-center gap-1.5">
                           <button 
                             disabled={!isReceptionist || appt.state === 'endconsult' || appt.state === 'done'}
                             onClick={(e) => { e.stopPropagation(); if(isReceptionist && appt.state !== 'endconsult' && appt.state !== 'done') onUpdateAppointment(appt.id, { state: 'confirm' }); }}
                             className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${
                               appt.state === 'confirm' 
                               ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                               : 'bg-white text-slate-300 border-slate-200 hover:border-teal-200 hover:text-teal-600'
                             } ${!isReceptionist ? 'cursor-default' : 'active:scale-95'}`}
                           >
                             Attente
                           </button>
                           <button 
                             disabled={!isReceptionist || appt.state === 'endconsult' || appt.state === 'done'}
                             onClick={(e) => { 
                               e.stopPropagation();
                               if (!isReceptionist || appt.state === 'endconsult' || appt.state === 'done') return;
                               
                               const isImc = appt.type === 'imc';
                               const activeAppt = appointments.find(a => 
                                 a.state === 'consult' && 
                                 a.id !== appt.id && 
                                 ((a.type === 'imc') === isImc)
                                );
                                
                               if (activeAppt) {
                                 setConflictData({ pendingAppt: appt, activeAppt });
                                } else {
                                 onUpdateAppointment(appt.id, { state: 'consult' });
                                }
                             }}
                             className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${
                               appt.state === 'consult' 
                               ? 'bg-amber-500 text-white border-amber-500 shadow-sm animate-pulse' 
                               : 'bg-white text-slate-300 border-slate-200 hover:border-amber-200 hover:text-amber-600'
                             } ${!isReceptionist ? 'cursor-default' : 'active:scale-95'}`}
                           >
                             En Cours
                           </button>
                           <button 
                             disabled={!isReceptionist || appt.state === 'done'}
                             onClick={(e) => { e.stopPropagation(); if(isReceptionist && appt.state !== 'done') onUpdateAppointment(appt.id, { state: 'endconsult' }); }}
                             className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${
                               appt.state === 'endconsult' 
                               ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                               : 'bg-white text-slate-300 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                             } ${!isReceptionist ? 'cursor-default' : 'active:scale-95'}`}
                           >
                             Terminé
                           </button>
                         </div>
                      </td>
                      <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isReceptionist && (
                            <>
                              {!appt.paye ? (
                                <>
                                  <button 
                                    onClick={() => onUpdateAppointment(appt.id, { paye: true, state: 'done' })}
                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all flex items-center gap-1.5 border border-emerald-100 shadow-sm"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Régler
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); if (window.confirm("Retirer ce passage ?")) onDeleteAppointment(appt.id); }}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all font-black"
                                  >
                                    X
                                  </button>
                                </>
                              ) : (
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                   <CheckCircle2 className="w-3.5 h-3.5" />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Payé</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { 
            label: 'Consultations Adultes', 
            count: appointments.filter(a => a.type === 'adulte').length,
            amount: appointments.filter(a => a.type === 'adulte').reduce((acc, curr) => acc + (curr.amount || 0), 0),
            colorS: 'text-teal-600',
            bg: 'bg-teal-50/50'
          },
          { 
            label: 'Consultations Enfants', 
            count: appointments.filter(a => a.type === 'enfant').length,
            amount: appointments.filter(a => a.type === 'enfant').reduce((acc, curr) => acc + (curr.amount || 0), 0),
            colorS: 'text-amber-600',
            bg: 'bg-amber-50/50'
          },
          { 
            label: 'Secteur IMC', 
            count: appointments.filter(a => a.type === 'imc').length,
            amount: appointments.filter(a => a.type === 'imc').reduce((acc, curr) => acc + (curr.amount || 0), 0),
            colorS: 'text-violet-600',
            bg: 'bg-violet-50/50'
          },
          { 
            label: 'Total File du Jour', 
            count: appointments.length,
            amount: appointments.reduce((acc, curr) => acc + (curr.amount || 0), 0),
            colorS: 'text-slate-900',
            bg: 'bg-slate-100/50'
          }
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-2 bg-white hover:shadow-md transition-shadow`}
          >
             <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${stat.colorS}`}>{stat.label}</p>
             <p className="text-3xl font-black text-slate-900 leading-none">{stat.count}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total: {stat.amount.toLocaleString()} DA</p>
             <div className={`w-full h-1 mt-2 rounded-full ${stat.bg.replace('/50', '')}`} />
          </motion.div>
        ))}
      </div>

      {/* Selected Patient Dossier Medical Overlay Modal */}
      {selectedApptId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
            {(() => {
              const selectedAppt = appointments.find(a => a.id === selectedApptId);
              const patient = patients.find(p => p.id === selectedAppt?.patient_id);
              if (!selectedAppt || !patient) return (
                <div className="p-20 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dossier indisponible</p>
                  <button onClick={() => setSelectedApptId(null)} className="text-indigo-600 text-[10px] font-bold uppercase underline">Fermer la fenêtre</button>
                </div>
              );

              return (
                <div className="h-full flex flex-col min-h-0">
                  {/* Panel Header */}
                  <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl italic text-indigo-400 border border-white/5 shadow-inner">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <h3 className="text-lg font-black uppercase tracking-tight">{patient.name}</h3>
                             <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-tighter">ID: {patient.id.split('-')[1]}</span>
                          </div>
                          
                          {isEditing && (
                            <button 
                              onClick={async () => {
                                setIsTranslating(true);
                                try {
                                  const response = await fetch('/api/translate', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ text: patient.name })
                                  });
                                  const data = await response.json();
                                  onUpdatePatient({ ...patient, name_arab: data.translatedText || data.translated });
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsTranslating(false);
                                }
                              }}
                              disabled={isTranslating}
                              className="text-[9px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                              <Sparkles className="w-3 h-3" />
                              {isTranslating ? 'Traduction...' : 'Traduire en Arabe'}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 font-mono tracking-tighter uppercase mt-0.5">{patient.type_patient} • {patient.age} ans • {patient.phone || 'Pas de numéro'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedApptId(null)}
                      className="p-3 hover:bg-white/10 rounded-2xl transition-all group"
                    >
                      <XCircle className="w-8 h-8 text-slate-500 group-hover:text-rose-500 transition-colors" />
                    </button>
                  </div>

                  {/* Dossier Content */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                         <ClipboardList className="w-4 h-4" />
                         Dossier Médical & Observations
                       </h4>
                       {isDoctor && (
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Mode Édition Activé</span>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Tension
                        </p>
                        <input 
                          type="text"
                          readOnly={!isEditing}
                          value={patient.tension || ''}
                          onChange={(e) => onUpdatePatient({ ...patient, tension: e.target.value })}
                          placeholder="-- / --"
                          className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-900 placeholder:text-slate-300"
                        />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                          <Thermometer className="w-3 h-3" /> Poids
                        </p>
                        <div className="flex items-end gap-1">
                          <input 
                            type="text"
                            readOnly={!isEditing}
                            value={patient.weight || ''}
                            onChange={(e) => onUpdatePatient({ ...patient, weight: e.target.value })}
                            className="bg-transparent border-none outline-none text-xs font-black text-slate-900 w-12"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">KG</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" /> Taille
                        </p>
                        <div className="flex items-end gap-1">
                          <input 
                            type="text"
                            readOnly={!isEditing}
                            value={patient.height || ''}
                            onChange={(e) => onUpdatePatient({ ...patient, height: e.target.value })}
                            className="bg-transparent border-none outline-none text-xs font-black text-slate-900 w-12"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">CM</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pathologie / Diagnostic</label>
                        <textarea 
                          readOnly={!isEditing}
                          value={patient.pathology || ''}
                          onChange={(e) => onUpdatePatient({ ...patient, pathology: e.target.value })}
                          className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                          placeholder="Décrire la pathologie du patient..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mécanisme Lésionnel / Antécédents</label>
                        <textarea 
                          readOnly={!isEditing}
                          value={patient.mecanisme || ''}
                          onChange={(e) => onUpdatePatient({ ...patient, mecanisme: e.target.value })}
                          className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                          placeholder="Antécédents médicaux pertinents..."
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Protocole de Traitement</label>
                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="bg-indigo-600 p-2 rounded-lg">
                                <Stethoscope className="w-4 h-4 text-white" />
                             </div>
                             <p className="text-[11px] font-black text-indigo-900 uppercase">Soin & Rééducation Prescrits</p>
                          </div>
                          <textarea 
                            readOnly={!isEditing}
                            value={patient.prescription_acts || ''}
                            onChange={(e) => onUpdatePatient({ ...patient, prescription_acts: e.target.value })}
                            className="w-full bg-white/50 border-none rounded-xl p-4 text-xs font-bold text-indigo-100 outline-none placeholder:text-indigo-200 min-h-[100px]"
                            placeholder="Définir le protocole de rééducation (nombre de séances, types d'actes...)"
                          />
                        </div>
                      </div>
                    </div>

                    {currentRole === 'mpr_doctor' && (
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            // Remplacer les placeholders du template par les vraies infos du patient
                            let initialContent = docTemplates[0].content
                              .replace("[Nom du patient]", patient.name)
                              .replace("[Âge]", String(patient.age));
                            setWordDocumentText(initialContent);
                            setWordDocumentTitle(`CR_${patient.name.replace(/\s+/g, '_')}`);
                            setShowWordUtility(true);
                          }}
                          className="w-full bg-gradient-to-r from-[#185abd] to-[#124993] hover:from-[#124993] hover:to-[#0f3c7a] text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-3 shadow-md shadow-[#185abd]/25 border border-[#185abd]/30 scale-[1.01] hover:scale-[1.03] active:scale-98 animate-none"
                        >
                          <div className="flex items-center justify-center bg-white text-[#185abd] w-5 h-5 rounded font-black text-[11px] font-sans border border-white shadow-xs">
                            W
                          </div>
                          Rédiger un Document (Word / Certificat Officiel) pour {patient.name}
                        </button>
                      </div>
                    )}

                    {isDoctor && (
                      <div className="pt-4">
                        <button 
                          onClick={() => {
                            // Validation visuelle
                            alert("Dossier Médical mis à jour avec succès.");
                            setSelectedApptId(null);
                          }}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                        >
                          <Save className="w-4 h-4" />
                          Enregistrer & Fermer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Stats Quick View */}
      <div className={`grid grid-cols-1 ${currentRole === 'mpr_doctor' || currentRole === 'egypt_doctor' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-6`}>
          <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm shadow-teal-500/5 space-y-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En attente</p>
             <p className="text-2xl font-black text-slate-900">{filteredAppointments.filter(a => a.state === 'confirm').length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm shadow-teal-500/5 space-y-2">
             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">En Consultation</p>
             <p className="text-2xl font-black text-slate-900">{filteredAppointments.filter(a => a.state === 'consult').length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm shadow-teal-500/5 space-y-2">
             <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Terminé (Non payé)</p>
             <p className="text-2xl font-black text-slate-900">{filteredAppointments.filter(a => a.state === 'endconsult').length}</p>
          </div>
          {currentRole !== 'mpr_doctor' && currentRole !== 'egypt_doctor' && (
            <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm shadow-teal-500/5 space-y-2">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Encaissement</p>
               <p className="text-2xl font-black text-slate-900 italic">
                 {appointments.filter(a => a.paye).reduce((acc, curr) => acc + (curr.discounted_amount || 0), 0)} DA
               </p>
            </div>
          )}
      </div>

       {/* Add Consultation Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ x: '100%', opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: '100%', opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
             >
                <div className="bg-teal-600 p-6 text-white flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                         <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-widest">Ajouter à la File d'Attente</h3>
                        <p className="text-teal-100 text-[10px] font-bold uppercase tracking-tighter">Sélectionnez un patient pour démarrer</p>
                      </div>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
                      <XCircle className="w-6 h-6" />
                   </button>
                </div>

              <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Rechercher un patient (Nom ou Téléphone)..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                        <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                        <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {patients
                        .filter(p => 
                          p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                          (p.phone && p.phone.includes(patientSearch))
                        )
                        .slice(0, 50)
                        .map(patient => (
                          <tr 
                            key={patient.id} 
                            className={`hover:bg-teal-50/50 transition-colors cursor-pointer group ${newAppt.patient_id === patient.id ? 'bg-teal-50' : ''}`}
                            onClick={() => {
                              const typeCode = patient.type_patient === 'enfant_imc' ? 'imc' : 
                                              patient.type_patient === 'enfant' ? 'enf' : 'adu';
                              const tc = typeConsultations.find(t => t.code.toLowerCase() === typeCode.toLowerCase());
                              
                              setNewAppt({
                                ...newAppt,
                                patient_id: patient.id,
                                patient_name: patient.name,
                                patient_phone: patient.phone || '',
                                patient_age: patient.age,
                                type: typeCode as any,
                                amount: tc?.prix || 2500,
                                is_controle: tc?.prix === 0
                              });
                            }}
                          >
                            <td className="px-3 py-1.5">
                              <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{patient.name}</p>
                              <p className="text-[8px] font-bold text-slate-400">{patient.phone || 'N/A'}</p>
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border border-slate-100 bg-white">
                                {patient.type_patient === 'enfant_imc' ? 'IMC' : patient.type_patient === 'enfant' ? 'Enfant' : 'Adulte'}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const alreadyIn = appointments.some(a => a.patient_id === patient.id && a.state !== 'done' && a.state !== 'cancel');
                                  if (alreadyIn) {
                                    alert("Patient déjà figurant dans la file d'attente.");
                                    return;
                                  }
                                  
                                  const typeCode = patient.type_patient === 'enfant_imc' ? 'IMC' : 
                                                   patient.type_patient === 'enfant' ? 'ENF' : 'ADU';
                                  const tc = typeConsultations.find(t => t.code.toUpperCase() === typeCode);
                                  
                                  const payload = {
                                    ...newAppt,
                                    patient_id: patient.id,
                                    patient_name: patient.name,
                                    patient_phone: patient.phone || '',
                                    patient_age: patient.age,
                                    type: typeCode,
                                    amount: tc?.prix || 2500,
                                    is_controle: tc?.prix === 0,
                                    paye: false
                                  };

                                  const now = new Date();
                                  const created: any = {
                                    ...payload,
                                    discount: 0,
                                    id: `apt-${Date.now()}`,
                                    name: `${payload.type.toUpperCase()}/${now.getDate()}/${now.getMonth()+1}/${now.getHours()}h`,
                                    appointment_date: now.toISOString(),
                                    discounted_amount: payload.amount,
                                    amount_display: `${payload.amount} DA`,
                                    state: 'confirm',
                                  };

                                  onCreateAppointment(created);
                                  setShowAddModal(false);
                                  setShowTicket(created);
                                  setPatientSearch('');
                                }}
                                className="bg-white border border-slate-200 text-slate-900 px-2 py-1 rounded-full text-[8px] font-black uppercase hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all font-sans"
                              >
                                Envoyer
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type Consultation</label>
                    <select 
                      value={newAppt.type}
                      onChange={(e) => {
                        const tc = typeConsultations.find(t => t.code.toLowerCase() === e.target.value.toLowerCase());
                        const basePrice = tc?.prix || 0;
                        setNewAppt({
                          ...newAppt,
                          type: e.target.value as any,
                          amount: basePrice,
                          is_controle: tc?.code.toLowerCase() === 'ctrl' || tc?.prix === 0
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/10"
                    >
                      {typeConsultations.map(tc => (
                        <option key={tc.id} value={tc.code.toLowerCase()}>{tc.designation}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prix (DA)</label>
                    <input 
                      type="number"
                      value={newAppt.amount}
                      onChange={(e) => setNewAppt({ ...newAppt, amount: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/10"
                    />
                  </div>
                </div>

                {newAppt.patient_id && (
                  <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4">
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      <div>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Configuration Patient Prête</p>
                        <p className="text-sm font-black text-slate-800 uppercase">{newAppt.patient_name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddSubmit}
                      className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Ajouter à la file
                    </button>
                  </div>
                )}
              </div>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Ticket Impression Modal */}
      {showTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 p-8 space-y-6 text-center">
              <div className="space-y-2 border-b border-slate-100 pb-6">
                 <Hospital className="w-10 h-10 text-indigo-600 mx-auto" />
                 <h3 className="text-xl font-black uppercase tracking-tight">KACEL SANTE</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Centre de Rééducation & Balnéo</p>
              </div>

              <div className="space-y-4 py-2">
                 <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Ticket de Consultation</p>
                    <p className="text-2xl font-black text-slate-900 font-mono italic">{showTicket.name}</p>
                 </div>

                 <div className="text-left space-y-2 px-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span className="text-slate-400">Patient:</span>
                       <span className="text-slate-900 font-black">{showTicket.patient_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span className="text-slate-400">Acte:</span>
                       <span className="text-slate-900 font-black">
                         {showTicket.type === 'imc' ? 'CONSULTATION ENFANT IMC' : 
                          showTicket.type === 'enfant' ? 'CONSULTATION ENFANT' : 
                          'CONSULTATION ADULTE'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span className="text-slate-400">Date:</span>
                       <span className="text-slate-900 font-black">{new Date(showTicket.appointment_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-200 mt-4 pt-4 flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-900 uppercase">Montant Payé:</span>
                       <span className="text-lg font-black text-indigo-600 font-mono">{showTicket.amount} DA</span>
                    </div>
                 </div>
              </div>

              <div className="pt-4 space-y-3">
                 <button 
                   onClick={() => window.print()}
                   className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"
                 >
                   <Printer className="w-4 h-4" />
                   Imprimer Ticket
                 </button>
                 <button 
                   onClick={() => setShowTicket(null)}
                   className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all"
                 >
                   Fermer
                 </button>
              </div>

              <p className="text-[8px] text-slate-300 font-bold uppercase italic">
                 Merci de conserver ce ticket jusqu'à la fin de votre consultation.
              </p>
           </div>
        </div>
      )}

      {/* Modal de Résolution de Conflit de Consultation */}
      {conflictData && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 p-8 space-y-8">
            <div className="flex items-center gap-5 text-teal-600 border-b border-slate-100 pb-6">
              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 shadow-sm shadow-teal-500/5">
                <AlertTriangle className="w-10 h-10 text-teal-600" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Médecin Occupé</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                  Déjà un patient en cours de consultation
                </p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                Le médecin responsable est actuellement occupé. Un patient est déjà enregistré :
              </p>

              <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-6 space-y-2 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {conflictData.activeAppt.patient_name}
                  </p>
                </div>
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest pl-5">
                  Type Consultation : {conflictData.activeAppt.type === 'imc' ? 'Enfant IMC' : 'Adulte / Enfant'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setConflictData(null)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-teal-600/20 active:scale-95 cursor-pointer"
              >
                Fermer & Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Utilitaire de traitement de texte intégré (Word) */}
      {showWordUtility && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[90vh] bg-slate-100 border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            
            {/* Header de l'utilitaire */}
            <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-black uppercase tracking-tight">Utilitaire de traitement de texte ERP</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Travaillez vos comptes rendus et documents sans quitter l'ERP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([wordDocumentText], { type: 'application/msword;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${wordDocumentTitle.replace(/\s+/g, '_') || 'document'}.doc`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                  title="Télécharger et ouvrir automatiquement dans Microsoft Word sur votre PC"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ouvrir dans Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(wordDocumentText);
                    alert("Document copié dans le presse-papiers ! Vous pouvez le coller directement dans Word (Ctrl+V).");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le texte</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${wordDocumentText}</pre>`);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowWordUtility(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-rose-500 transition-colors ml-2"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Corps de l'utilitaire */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">
              
              {/* Panneau latéral gauche : Modèles et configurations */}
              <div className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-4 overflow-y-auto shrink-0">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Titre du fichier</h4>
                  <input
                    type="text"
                    value={wordDocumentTitle}
                    onChange={(e) => setWordDocumentTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                    placeholder="Titre du document..."
                  />
                </div>

                <div className="flex-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Modèles rapides</h4>
                  <div className="space-y-2">
                    {docTemplates.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (window.confirm("Remplacer le texte actuel par ce modèle ? (Vos modifications seront perdues)")) {
                            setWordDocumentTitle(tpl.title);
                            setWordDocumentText(tpl.content);
                          }
                        }}
                        className="w-full text-left bg-slate-50 hover:bg-indigo-50/60 hover:text-indigo-900 border border-slate-100 hover:border-indigo-200 rounded-xl p-3 text-xs font-bold text-slate-700 transition-all flex items-start gap-2"
                      >
                        <span className="mt-0.5 text-indigo-500 font-mono">📝</span>
                        <span>{tpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 text-[10px] text-indigo-950 font-bold leading-relaxed space-y-1.5">
                  <p className="uppercase text-indigo-800 tracking-wider">💡 Guide Word Local</p>
                  <p className="font-medium text-slate-500">
                    Pour travailler directement dans le Microsoft Word de votre PC, cliquez sur <span className="text-emerald-700 font-extrabold">"Ouvrir dans Word"</span>. Le fichier s'ouvrira directement dans votre traitement de texte favori !
                  </p>
                </div>
              </div>

              {/* Panneau d'édition de texte (Simulation A4) */}
              <div className="flex-1 bg-slate-200 p-6 overflow-y-auto flex justify-center">
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-slate-300 p-8 md:p-12 min-h-[70vh] flex flex-col">
                  <textarea
                    value={wordDocumentText}
                    onChange={(e) => setWordDocumentText(e.target.value)}
                    className="w-full flex-1 bg-transparent border-none outline-none font-mono text-xs font-semibold text-slate-800 leading-relaxed resize-none focus:ring-0"
                    placeholder="Saisissez ou modifiez votre texte ici..."
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
