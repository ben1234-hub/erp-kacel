import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Upload,
  Download,
  Plus, 
  Sparkles,
  X,
  MapPin,
  Activity,
  FileText,
  ShieldAlert,
  Stethoscope,
  Eye,
  ChevronLeft,
  ShieldCheck,
  History,
  CreditCard,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Patient, GestionAbonnement, Pack, Versement, KinesitherapyAppointment, BalneotherapieAppointment, ConsultationQueueItem, ALGERIAN_WILAYAS } from '../types';
import { formatCurrency, computeSubscriptionDetails } from '../utils';
import SupportIdentiteAdministrative from './SupportIdentiteAdministrative';

interface PatientsProps {
  patients: Patient[];
  onAddPatient: (patient: Omit<Patient, 'id' | 'date_creation'>) => void;
  onDeletePatient: (id: string) => void;
  onUpdatePatient?: (updated: Patient) => void;
  abonnements?: GestionAbonnement[];
  packs?: Pack[];
  versements?: Versement[];
  kineApps?: KinesitherapyAppointment[];
  balneoApps?: BalneotherapieAppointment[];
  consultationQueue?: ConsultationQueueItem[];
  currentRole?: string;
  selectedPatientId?: string | null;
  onSelectPatient?: (id: string | null) => void;
}

export default function Patients({
  patients,
  onAddPatient,
  onDeletePatient,
  onUpdatePatient,
  abonnements = [],
  packs = [],
  versements = [],
  kineApps = [],
  balneoApps = [],
  consultationQueue = [],
  currentRole = 'admin',
  selectedPatientId: selectedPatientIdProp,
  onSelectPatient
}: PatientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom states for inline Patient profile view with identical dimensions
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const selectedPatientId = selectedPatientIdProp !== undefined ? selectedPatientIdProp : localSelectedId;
  const [activeSubTab, setActiveSubTab] = useState<'abo' | 'medical' | 'history'>('abo');
  const [expandedAboId, setExpandedAboId] = useState<string | null>(null);
  const [editablePatient, setEditablePatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminIdentity, setShowAdminIdentity] = useState<string | null>(null);
  const isEditableRole = currentRole === 'recept_rdc' || currentRole === 'admin';

  React.useEffect(() => {
    if (selectedPatientIdProp) {
      const pat = patients.find(p => p.id === selectedPatientIdProp);
      if (pat) {
        setLocalSelectedId(selectedPatientIdProp);
        setEditablePatient({ ...pat });
        setActiveSubTab('abo');
      }
    } else if (selectedPatientIdProp === null) {
      setLocalSelectedId(null);
      setEditablePatient(null);
    }
  }, [selectedPatientIdProp, patients]);

  const setSelectedPatientId = (id: string | null) => {
    if (onSelectPatient) {
      onSelectPatient(id);
    }
    setLocalSelectedId(id);
    const pat = patients.find(p => p.id === id);
    if (pat) {
      setEditablePatient({ ...pat });
      setActiveSubTab('abo');
    } else {
      setEditablePatient(null);
    }
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
  };

  const handleSaveMedical = () => {
    if (onUpdatePatient && editablePatient) {
      setIsSaving(true);
      onUpdatePatient(editablePatient);
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  
  const patientAbos = abonnements.filter(a => a.patient_id === selectedPatientId);
  const patientKineHistory = kineApps.filter(app => 
    app.selected_acts.some(sa => sa.patient_id === selectedPatientId)
  );
  const patientBalneoHistory = balneoApps.filter(app => 
    app.patients.some(p => p.patient_id === selectedPatientId)
  );
  
  const combinedHistory = [...patientBalneoHistory, ...patientKineHistory]
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

  const [newPatient, setNewPatient] = useState({
    name: '',
    name_arab: '',
    phone: '',
    email: '',
    gender: 'M' as 'M' | 'F' | 'Autre',
    type_patient: 'adulte' as 'adulte' | 'enfant' | 'enfant_imc',
    age: 40,
    date_naissance: '',
    wilaya: '',
    organisme: '',
    street: '',
    city: '',
    nss: '',
    pathology: '',
    mecanisme: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!newPatient.name.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newPatient.name })
      });
      const data = await response.json();
      if (data.translated) {
        setNewPatient(prev => ({ ...prev, name_arab: data.translated }));
      }
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!newPatient.name.trim()) nextErrors.name = "Le nom complet est obligatoire.";
    if (!newPatient.phone.trim()) nextErrors.phone = "Le numéro de téléphone est obligatoire.";
    if (newPatient.email.trim() && !/\S+@\S+\.\S+/.test(newPatient.email)) {
      nextErrors.email = "Format d'adresse e-mail invalide.";
    }
    if (newPatient.age <= 0 || newPatient.age > 120) nextErrors.age = "L'âge doit être compris entre 1 et 120 ans.";
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Contrôle d'existant par nom complet (insensible à la casse)
    const exists = patients.some(p => p.name.trim().toLowerCase() === newPatient.name.trim().toLowerCase());
    if (exists) {
      alert(`Erreur : Un patient nommé "${newPatient.name}" existe déjà dans la base de données.`);
      setErrors({ name: "Ce patient est déjà enregistré." });
      return;
    }

    if (!validate()) return;
    onAddPatient({
      name: newPatient.name,
      name_arab: newPatient.name_arab || undefined,
      phone: newPatient.phone,
      email: newPatient.email,
      gender: newPatient.gender,
      type_patient: newPatient.type_patient,
      age: Number(newPatient.age),
      date_naissance: newPatient.date_naissance || undefined,
      wilaya: newPatient.wilaya || undefined,
      organisme: newPatient.organisme || undefined,
      street: newPatient.street || undefined,
      city: newPatient.city || undefined,
      nss: newPatient.nss || undefined,
      pathology: newPatient.pathology || undefined,
      mecanisme: newPatient.mecanisme || undefined
    });
    // The user wants to see the administrative identity after creation
    // Assuming the newly created patient will be available in state later, 
    // but for now we just close the modal. 
    // Usually onAddPatient might return the new id or we just stay in the list.
    setNewPatient({
      name: '',
      name_arab: '',
      phone: '',
      email: '',
      gender: 'M',
      type_patient: 'adulte',
      age: 40,
      date_naissance: '',
      wilaya: '',
      organisme: '',
      street: '',
      city: '',
      nss: '',
      pathology: '',
      mecanisme: ''
    });
    setErrors({});
    setShowAddModal(false);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.name_arab && p.name_arab.includes(searchTerm)) ||
    (p.dossier_num && p.dossier_num.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const displayedPatients = filteredPatients.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="space-y-6 bg-slate-50/40 p-4 rounded-[2.5rem] border border-slate-100/50 min-h-screen" id="patients-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-indigo-600" />
            {selectedPatientId && selectedPatient ? `Fiche Patient : ${selectedPatient.name}` : 'Répertoire des Patients'}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedPatientId && selectedPatient ? 'Suivi médical, abonnements en cours et historique complet de rééducation.' : 'Fiches démographiques, coordonnées et gestion du registre de la patientèle.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!selectedPatientId && !showAddModal && (currentRole === 'admin' || currentRole === 'recept_rdc' || currentRole === 'receptionist') && (
            <button
              onClick={() => setShowAddModal(true)}
              id="btn-open-add-patient-modal"
              className="bg-[#26a69a] hover:bg-[#00838f] text-white text-[11px] font-bold px-5 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Nouveau Patient
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      {!selectedPatientId && !showAddModal ? (
        <div className="flex items-center bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-slate-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all max-w-md shadow-xs">
          <Search className="w-3.5 h-3.5 ml-0.5 shrink-0 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email ou téléphone..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent border-0 text-slate-800 text-xs pl-2 outline-hidden"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-mono">
          <span className="text-slate-400 cursor-pointer hover:text-indigo-600" onClick={() => setSelectedPatientId(null)}>Patients</span>
          <ChevronLeft className="w-3 h-3 rotate-180 text-slate-300" />
          <span className="text-indigo-600">Dossier de {selectedPatient?.name}</span>
        </div>
      )}

      {/* List Table - Compact Virtual Practice Style - Wrapped with motion */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm" id="patients-table-card">
        <AnimatePresence mode="wait">
          {!selectedPatientId && !showAddModal ? (
            <motion.div 
               key="list"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.2 }}
               className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[12px] font-black text-slate-500 uppercase tracking-[0.1em]">Dossier</th>
                    <th className="px-5 py-4 text-[12px] font-black text-slate-500 uppercase tracking-[0.1em]">Patient</th>
                    <th className="px-5 py-4 text-[12px] font-black text-slate-500 uppercase tracking-[0.1em]">Genre</th>
                    <th className="px-5 py-4 text-[12px] font-black text-slate-500 uppercase tracking-[0.1em]">Age</th>
                    <th className="px-5 py-4 text-[12px] font-black text-slate-500 uppercase tracking-[0.1em]">Contact</th>
                    <th className="px-5 py-4 text-[12px] font-black text-slate-500 uppercase tracking-[0.1em]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPatients.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => handleSelectPatient(p.id)}
                      className="border-b border-slate-50 last:border-0 hover:bg-[#e0f2f1]/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {p.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-[#26a69a] transition-colors">{p.name}</span>
                          {p.name_arab && <span className="text-[10px] text-slate-400 font-arabic">{p.name_arab}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          p.gender === 'F' ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {p.gender === 'F' ? 'Femme' : 'Homme'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-xs font-bold text-slate-600">{p.age} ans</td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700">{p.phone}</span>
                          <span className="text-[10px] text-slate-400">{p.email || 'Pas d\'email'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(p.id);
                          }}
                          className="text-[10px] font-bold text-[#26a69a] underline decoration-transparent hover:decoration-[#26a69a] transition-all"
                        >
                          Voir Fiche
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : selectedPatientId && selectedPatient && editablePatient ? (
            <motion.div 
               key="profile"
               initial={{ x: '100%', opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: '100%', opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 150 }}
               className="p-6 space-y-6" 
               id="patient-details-inline"
            >
              {isEditableRole ? (
              <div className="space-y-6">
                {/* Header section with back button and Save */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedPatientId(null)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold shadow-sm"
                      id="btn-back-to-patients"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Retour
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                          {selectedPatient.dossier_num || 'SANS RÉF.'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Mode Édition active
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscrit le</p>
                      <p className="text-[11px] font-bold text-slate-600 font-mono">{selectedPatient.date_creation}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (onUpdatePatient && editablePatient) {
                          setIsSaving(true);
                          onUpdatePatient(editablePatient);
                          setTimeout(() => {
                            setIsSaving(false);
                            // Refresh local copy with any sanitization if needed
                          }, 800);
                        }
                      }}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Sauvegarder la Fiche Patient
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Formulaire complet en Mode Édition */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50/30 border border-slate-100 rounded-2xl p-6 shadow-xs">
                  {/* Sexe & Age */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identité Civile</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Nom et Prénom</label>
                        <input 
                          type="text" 
                          value={editablePatient.name || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">الاسم واللقب</label>
                        <input 
                          type="text" 
                          dir="rtl"
                          value={editablePatient.name_arab || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, name_arab: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-800 focus:border-indigo-500 outline-none text-right font-arabic"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Genre</label>
                          <select
                            value={editablePatient.gender || 'M'}
                            onChange={(e) => setEditablePatient({ ...editablePatient, gender: e.target.value as any })}
                            className="w-full bg-white border border-slate-200 p-1.5 text-xs font-bold rounded-lg text-slate-800 focus:border-indigo-500 outline-none"
                          >
                            <option value="M">Homme</option>
                            <option value="F">Femme</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Âge</label>
                          <input 
                            type="number" 
                            value={editablePatient.age === 0 ? '' : editablePatient.age}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditablePatient({ 
                                ...editablePatient, 
                                age: val,
                                type_patient: val < 18 ? 'enfant' : 'adulte'
                              });
                            }}
                            className="w-full bg-white border border-slate-200 p-1.5 text-xs font-bold rounded-lg text-slate-800 focus:border-indigo-500 outline-none text-center font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Catégorie</label>
                        <select
                          value={editablePatient.type_patient || 'adulte'}
                          onChange={(e) => setEditablePatient({ ...editablePatient, type_patient: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-800 focus:border-indigo-500 outline-none"
                        >
                          <option value="adulte">Adulte</option>
                          <option value="enfant">Enfant</option>
                          <option value="enfant_imc">Enfant IMC</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Contact */}
                  <div className="space-y-4 md:col-span-2 border-x border-slate-100 px-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Coordonnées</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Téléphone Principal</label>
                        <input 
                          type="text" 
                          value={editablePatient.phone || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-indigo-600 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Email</label>
                        <input 
                          type="email" 
                          value={editablePatient.email || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, email: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-700 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Adresse</label>
                        <input 
                          type="text" 
                          value={editablePatient.street || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, street: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-700 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Ville</label>
                        <input 
                          type="text" 
                          value={editablePatient.city || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, city: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-700 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Wilaya</label>
                        <select 
                          value={editablePatient.wilaya || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, wilaya: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-750 focus:border-indigo-500 outline-none"
                        >
                          <option value="">-- Wilaya --</option>
                          {ALGERIAN_WILAYAS.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Administratif */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administratif</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">N° Sécurité Sociale (NSS)</label>
                        <input 
                          type="text" 
                          value={editablePatient.nss || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, nss: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-emerald-700 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Organisme / Prise en charge</label>
                        <select 
                          value={editablePatient.organisme || ''}
                          onChange={(e) => setEditablePatient({ ...editablePatient, organisme: e.target.value })}
                          className="w-full bg-white border border-slate-200 p-2 text-xs font-bold rounded-lg text-slate-700 focus:border-indigo-500 outline-none"
                        >
                          <option value="">Remboursement</option>
                          <option value="PRIVE">PRIVE</option>
                          <option value="CNAS">CNAS</option>
                          <option value="CASNOS">CASNOS</option>
                          <option value="MILITAIRE">MILITAIRE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Header section with back button and basic info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedPatientId(null)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold shadow-sm"
                      id="btn-back-to-patients"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Retour
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {selectedPatient.name}
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                          {selectedPatient.dossier_num || 'SANS RÉF.'}
                        </span>
                        <button 
                          onClick={async () => {
                            setIsTranslating(true);
                            try {
                              const response = await fetch('/api/translate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: selectedPatient.name })
                              });
                              const data = await response.json();
                              if (data.translated) {
                                const updated = { ...selectedPatient, name_arab: data.translated };
                                onUpdatePatient && onUpdatePatient(updated);
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsTranslating(false);
                            }
                          }}
                          disabled={isTranslating}
                          className="ml-4 text-[8px] bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-black uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isTranslating ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-400" />
                              Traduction...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              Traduire en Arabe
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscrit le</p>
                      <p className="text-[11px] font-bold text-slate-600 font-mono">{selectedPatient.date_creation}</p>
                    </div>
                  </div>
                </div>

                {/* Nouveau Bloc Identité & Coordonnées (Permanent) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50/30 border border-slate-100 rounded-2xl p-6 shadow-xs">
                    {/* Bloc Sexe & Age */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identité Civil</h4>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">Genre</p>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${selectedPatient.gender === 'F' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                            <p className="text-[11px] font-black text-slate-800 tracking-tight uppercase">{selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}</p>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">Âge</p>
                          <p className="text-[11px] font-black text-slate-800 font-mono">{selectedPatient.age} Ans</p>
                        </div>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">Catégorie Patient</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                            selectedPatient.type_patient === 'enfant_imc' ? 'bg-violet-100 text-violet-700' : 
                            selectedPatient.type_patient === 'enfant' ? 'bg-amber-100 text-amber-700' : 
                            'bg-slate-100 text-slate-600'
                        }`}>
                          {selectedPatient.type_patient === 'enfant_imc' ? 'Enfant IMC' : 
                           selectedPatient.type_patient === 'enfant' ? 'Enfant' : 
                           'Adulte'}
                        </span>
                      </div>
                    </div>

                    {/* Bloc Contact */}
                    <div className="space-y-4 md:col-span-2 border-x border-slate-100 px-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Coordonnées</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">Téléphone Principal</p>
                          <p className="text-[11px] font-black text-indigo-600 font-mono tracking-tight">{selectedPatient.phone}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">Email / Contact</p>
                          <p className="text-[10px] font-bold text-slate-700 truncate lowercase font-mono">{selectedPatient.email || '—'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">Adresse de Résidence</p>
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-slate-300 mt-0.5" />
                            <p className="text-[10px] font-bold text-slate-700 leading-tight">
                              {selectedPatient.street ? `${selectedPatient.street}, ` : ''}
                              <span className="uppercase">{selectedPatient.city || selectedPatient.wilaya || 'Non renseignée'}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloc Administratif */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administratif</h4>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 text-slate-400/80">N° Sécurité Sociale (NSS)</p>
                        <p className="text-[11px] font-black text-emerald-700 font-mono tracking-[0.2em] bg-emerald-55/50 p-2 rounded-lg border border-emerald-100/50 w-fit">{selectedPatient.nss || '—'}</p>
                      </div>
                    </div>
                </div>
              </>
            )}

            {/* Sub-tabs selection */}
            <div className="flex border-b border-slate-100" id="details-subtabs">
              {[
                { id: 'abo', label: 'Abonnements & Souscriptions', icon: CreditCard },
                { id: 'medical', label: 'Dossier Clinique & Constantes', icon: Stethoscope },
                { id: 'history', label: 'Actes Hors Forfait', icon: History }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id as any);
                    if (tab.id === 'medical') {
                      setEditablePatient({ ...selectedPatient });
                    }
                  }}
                  className={`px-4 py-2.5 text-xs font-bold tracking-tight transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeSubTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 font-extrabold' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[250px] pt-1">
              {activeSubTab === 'abo' && (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">N°</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Séances</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Prix</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Versé</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Restant</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Consommées</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Restantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAbos.length > 0 ? (
                          patientAbos.map((abo, index) => {
                            const details = computeSubscriptionDetails(abo, packs, versements);
                            const packName = packs.find(p => p.id === abo.pack_id)?.name || 'Pack Clinique';
                            const relatedVersements = versements.filter(v => v.gestion_abonnement_id === abo.id);
                            const isExpanded = expandedAboId === abo.id;
                            const isClosed = details.state === 'abonnement_end';

                            return (
                              <React.Fragment key={abo.id}>
                                <tr 
                                  onClick={() => setExpandedAboId(isExpanded ? null : abo.id)}
                                  className={`border-b border-slate-50 transition-colors cursor-pointer ${
                                    isExpanded ? 'bg-indigo-50/50' : ''
                                  } ${isClosed ? 'opacity-50 grayscale bg-slate-50' : 'hover:bg-indigo-50/30'}`}
                                >
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-indigo-600 font-mono tracking-tight">
                                    {isClosed ? '🔒' : index + 1}
                                  </td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-slate-700">
                                    {packName}
                                    {details.is_consumption_warning && (
                                      <div className="flex items-center gap-1 mt-1 text-[8px] text-rose-500 font-black uppercase animate-pulse">
                                        <ShieldAlert className="w-2.5 h-2.5" />
                                        <span>Montant versé équivalent ou inférieur aux séances consommées</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500 font-mono">{abo.date_debut}</td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-slate-600 text-center font-mono">{details.number_of_sessions}</td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-slate-900 text-right font-mono">{formatCurrency(details.total_avec_remise)}</td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-emerald-600 text-right font-mono">{formatCurrency(details.total_versement)}</td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-rose-600 text-right font-mono">
                                    {details.amount_remaining > 0 ? formatCurrency(details.amount_remaining) : '—'}
                                  </td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500 text-center font-mono">{abo.used_sessions || 0}</td>
                                  <td className="px-4 py-2.5 text-[10px] font-bold text-center">
                                    <span className={`px-2 py-0.5 rounded-full font-mono ${
                                      isClosed ? 'bg-slate-200 text-slate-500' :
                                      details.remaining_sessions <= 2 ? 'bg-rose-100 text-rose-600' : 
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {isClosed ? 'FERMÉ' : details.remaining_sessions}
                                    </span>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-50">
                                    <td colSpan={9} className="px-5 py-2">
                                      <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl overflow-hidden shadow-xs max-w-xl">
                                        <div className="bg-white border-b border-indigo-50 px-3 py-1.5 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="w-2.5 h-2.5 text-indigo-500" />
                                            <h5 className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Détail des Règlements</h5>
                                          </div>
                                          {details.amount_remaining > 0 && (
                                            <div className="flex items-center gap-2 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded">
                                              <span className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest">RESTE À PAYER :</span>
                                              <span className="text-[9px] font-black text-rose-600 font-mono">{formatCurrency(details.amount_remaining)}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-0">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="border-b border-indigo-50/50">
                                                <th className="px-3 py-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Date versement</th>
                                                <th className="px-3 py-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                <th className="px-3 py-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {relatedVersements.length > 0 ? (
                                                relatedVersements.map((v) => (
                                                  <tr key={v.id} className="border-b border-indigo-50/30 last:border-0 hover:bg-white transition-colors">
                                                    <td className="px-3 py-1 text-[8.5px] font-bold text-slate-500 font-mono uppercase">{v.date}</td>
                                                    <td className="px-3 py-1 text-[8.5px] font-medium text-slate-600 italic">Versement encaissé</td>
                                                    <td className="px-3 py-1 text-[9px] font-black text-emerald-600 text-right font-mono">{formatCurrency(v.amount)}</td>
                                                  </tr>
                                                ))
                                              ) : (
                                                <tr>
                                                  <td colSpan={3} className="px-3 py-3 text-center text-[8px] font-bold text-slate-400 italic">
                                                    Aucun versement enregistré
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                            {relatedVersements.length > 0 && (
                                              <tfoot className="bg-indigo-50/40">
                                                <tr className="border-t border-indigo-100/50">
                                                  <td colSpan={2} className="px-3 py-1 text-[7.5px] font-black text-indigo-700 uppercase tracking-widest text-right">Total des versements</td>
                                                  <td className="px-3 py-1 text-[9.5px] font-black text-indigo-800 text-right font-mono">{formatCurrency(details.total_versement)}</td>
                                                </tr>
                                              </tfoot>
                                            )}
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-16 text-center">
                              <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-3 opacity-50" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun abonnement trouvé</p>
                              <p className="text-[10px] text-slate-300 mt-1">Le patient n'a pas encore souscrit d'abonnement actif.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'medical' && (
                <fieldset disabled={currentRole !== 'mpr_doctor'} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 gap-8">
                    {/* Colonne unique : Bilan Clinique */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                          <Stethoscope className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                          Bilan Clinique & Diagnostics
                        </h4>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pathologie Principale</label>
                          <input 
                            type="text" 
                            value={editablePatient.pathology || ''}
                            onChange={(e) => setEditablePatient({...editablePatient, pathology: e.target.value})}
                            placeholder="ex: Paralysie Cérébrale IMC..."
                            className="w-full bg-indigo-50/30 border border-indigo-100 p-3 rounded-xl text-xs font-black text-indigo-900 focus:bg-white focus:border-indigo-500 transition-all outline-hidden"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mécanisme & Historique</label>
                          <textarea 
                            value={editablePatient.mecanisme || ''}
                            onChange={(e) => setEditablePatient({...editablePatient, mecanisme: e.target.value})}
                            rows={3}
                            placeholder="Contexte de survenue..."
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 transition-all outline-hidden resize-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Contre-indications Médicales
                          </label>
                          <input 
                            type="text"
                            value={(editablePatient as any).contraindications || ''}
                            onChange={(e) => setEditablePatient({...editablePatient, contraindications: e.target.value})}
                            className="w-full bg-red-50/50 border border-red-100 p-3 rounded-xl text-xs font-black text-red-700 focus:bg-white focus:border-red-500 transition-all outline-hidden uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION CONSTANTES VITALES */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      Constantes Vitales relevées
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: 'Tension', field: 'tension' as const, unit: 'mmHg' },
                        { label: 'Fréq. Cardiaque', field: 'heart_rate' as const, unit: 'bpm' },
                        { label: 'Température', field: 'temperature' as const, unit: '°C' },
                        { label: 'Poids', field: 'weight' as const, unit: 'kg' },
                        { label: 'Taille', field: 'height' as const, unit: 'cm' }
                      ].map(vital => (
                        <div key={vital.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">{vital.label}</p>
                          <div className="flex items-center justify-center gap-1">
                            <input 
                              type="text" 
                              value={(editablePatient as any)[vital.field] || ''}
                              onChange={(e) => setEditablePatient({...editablePatient, [vital.field]: e.target.value})}
                              placeholder="--"
                              className="text-sm font-bold text-slate-800 w-12 text-center outline-hidden border-b border-indigo-100 focus:border-indigo-500 bg-transparent font-mono"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">{vital.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OBJECTIFS & EVALUATION FONCTIONNELLE */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      Objectifs & Évaluation Fonctionnelle (Bilans Thérapeutiques)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Prescription & Objectif de soins</label>
                        <textarea 
                          value={(editablePatient as any).prescription_acts || ''}
                          onChange={(e) => setEditablePatient({...editablePatient, prescription_acts: e.target.value})}
                          placeholder="ex: Rééducation de la marche, renforcement musculaire..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-150 p-2 rounded text-xs text-slate-705 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tonus Musculaire (Score d'Ashworth)</label>
                        <textarea 
                          value={(editablePatient as any).ashworth_score || ''}
                          onChange={(e) => setEditablePatient({...editablePatient, ashworth_score: e.target.value})}
                          placeholder="ex: Ashworth grade 1+ aux fléchisseurs..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-150 p-2 rounded text-xs text-slate-705 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Amplitudes Articulaires (ROM)</label>
                        <textarea 
                          value={(editablePatient as any).rom_assessment || ''}
                          onChange={(e) => setEditablePatient({...editablePatient, rom_assessment: e.target.value})}
                          placeholder="ex: Limitation flexion de hanche gauche à 90°..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-150 p-2 rounded text-xs text-slate-705 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Bilan Posture & Marche</label>
                        <textarea 
                          value={(editablePatient as any).gait_assessment || ''}
                          onChange={(e) => setEditablePatient({...editablePatient, gait_assessment: e.target.value})}
                          placeholder="ex: Boiterie d'esquive à droite, asymétrie d'appui..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-150 p-2 rounded text-xs text-slate-705 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Score d'évolution global d'amélioration</label>
                        <div className="flex items-center gap-3 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setEditablePatient({...editablePatient, satisfaction_score: star})}
                              className={`text-2xl focus:outline-hidden transition-all ${
                                star <= (editablePatient.satisfaction_score || 0) 
                                  ? 'text-amber-400 scale-110' 
                                  : 'text-slate-300 hover:text-amber-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="text-xs font-semibold font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            {(editablePatient.satisfaction_score || 0)} / 5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ANTÉCÉDENTS ET OBSERVATIONS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Antécédents médicaux / rééducatifs</label>
                      <textarea 
                        value={(editablePatient as any).antecedents || ''}
                        onChange={(e) => setEditablePatient({...editablePatient, antecedents: e.target.value})}
                        placeholder="Aucun antécédent particulier à signaler..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-150 p-2 rounded text-xs text-slate-705 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Notes d'évolution thérapeutique</label>
                      <textarea 
                        value={(editablePatient as any).rehab_progress_notes || ''}
                        onChange={(e) => setEditablePatient({...editablePatient, rehab_progress_notes: e.target.value})}
                        placeholder="Observation d'évolution clinique au fil du temps..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-150 p-2 rounded text-xs text-slate-705 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Boutons Action */}
                  <div className="flex justify-end pt-2 border-t border-slate-100 gap-3">
                    {currentRole === 'mpr_doctor' ? (
                      <button
                        type="button"
                        onClick={() => handleSaveMedical()}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                      >
                        {isSaving ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            Enregistrer les observations
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg uppercase tracking-wide">
                        Mode lecture seule (Édition réservée au Docteur MPR)
                      </span>
                    )}
                  </div>
                </fieldset>
              )}

              {activeSubTab === 'history' && (
                <div className="space-y-3">
                  {combinedHistory.length > 0 ? (
                    combinedHistory.map((app) => {
                      const isBalneo = 'duration' in app;
                      return (
                        <div key={app.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isBalneo ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {isBalneo ? <Activity className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">
                                {isBalneo ? 'Balnéothérapie (Thermes)' : 'Kinésithérapie active/passive'}
                              </p>
                              <p className="text-[10px] text-slate-405 font-mono mt-0.5">
                                {new Date(app.appointment_date).toLocaleDateString('fr-FR')} &agrave; {new Date(app.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            app.state === 'done' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-105'
                          }`}>
                            {app.state === 'done' ? 'Effectuée' : 'Planifiée'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-400 font-mono">Aucune séance enregistrée pour ce patient dans l'historique.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : showAddModal ? (
          <motion.div 
             key="add"
             initial={{ x: '100%', opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: '100%', opacity: 0 }}
             transition={{ type: 'spring', damping: 25, stiffness: 150 }}
             className="p-4 space-y-4 bg-[#fdfdfd]" 
             id="patient-add-inline"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 hover:text-slate-900 rounded-lg px-4 py-2 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-bold shadow-sm"
                  id="btn-back-to-patients"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour à la liste
                </button>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <h3 className="font-black text-slate-950 tracking-tight text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    Enregistrement d'un Nouveau Patient
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Session d'ouverture de dossier administratif - Centre Médical KACEL</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubAdd} className="space-y-4 max-w-5xl mx-auto">
              {/* SECTION 1: Informations Démographiques */}
              <div className="bg-white p-5 rounded-[1.5rem] border border-slate-150 shadow-lg shadow-slate-100/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    1. État Civil & Identité
                  </h4>
                  <div className="flex items-center gap-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de Patient :</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      {['adulte', 'enfant', 'enfant_imc'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewPatient({ ...newPatient, type_patient: type as any })}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            newPatient.type_patient === type 
                              ? 'bg-white text-indigo-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Nom et Prénom (Français)
                      </label>
                      <button
                        type="button"
                        onClick={handleTranslate}
                        disabled={isTranslating || !newPatient.name.trim()}
                        className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {isTranslating ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Traduction...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Traduire en Arabe
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="Ahmed Benyahia"
                        required
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold rounded-xl shadow-sm"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-rose-600 font-bold mt-1 pl-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right block pr-1">الاسم و اللقب (بالعربية)</label>
                    <input 
                      type="text" 
                      placeholder="أحمد بن يحيى"
                      dir="rtl"
                      value={newPatient.name_arab}
                      onChange={(e) => setNewPatient({ ...newPatient, name_arab: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-lg text-slate-950 outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold rounded-xl font-arabic shadow-sm h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Genre</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setNewPatient({ ...newPatient, gender: 'M' })}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          newPatient.gender === 'M' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-200/50'
                        }`}
                      >
                        Masculin
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPatient({ ...newPatient, gender: 'F' })}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          newPatient.gender === 'F' ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'text-slate-500 hover:bg-slate-200/50'
                        }`}
                      >
                        Féminin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Date Naissance (jj/mm/aaaa)</label>
                    <input 
                      type="date" 
                      value={newPatient.date_naissance}
                      onChange={(e) => {
                        const birthDate = e.target.value;
                        const today = new Date();
                        const birth = new Date(birthDate);
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                          age--;
                        }
                        const finalAge = age > 0 ? age : 0;
                        setNewPatient({ 
                          ...newPatient, 
                          date_naissance: birthDate, 
                          age: finalAge,
                          type_patient: finalAge < 18 ? 'enfant' : 'adulte'
                        });
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold font-mono outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Âge (Auto)</label>
                    <input 
                      type="number" 
                      value={newPatient.age === 0 ? '' : newPatient.age}
                      readOnly
                      className="w-full bg-slate-100 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold font-mono outline-none rounded-xl shadow-sm cursor-not-allowed"
                    />
                    {errors.age && <p className="text-xs text-red-600 font-bold mt-1">{errors.age}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Coordonnées & Informations Contact */}
              <div className="bg-white p-5 rounded-[1.5rem] border border-slate-150 shadow-lg shadow-slate-100/50 space-y-5">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  2. Contact & Coordonnées
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Téléphone Direct</label>
                        <input 
                          type="tel" 
                          placeholder="0X XX XX XX XX"
                          required
                          value={newPatient.phone}
                          onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold font-mono outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                        />
                        {errors.phone && <p className="text-[9px] text-red-600 font-bold mt-1">{errors.phone}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">E-mail</label>
                        <input 
                          type="email" 
                          placeholder="contact@patient.com"
                          value={newPatient.email}
                          onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold font-mono outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Adresse (Rue / Cité)</label>
                      <input 
                        type="text" 
                        placeholder="Rue, N°..."
                        value={newPatient.street}
                        onChange={(e) => setNewPatient({ ...newPatient, street: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Ville</label>
                        <input 
                          type="text" 
                          placeholder="ex: Kouba"
                          value={newPatient.city}
                          onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Wilaya</label>
                        <select 
                          value={newPatient.wilaya}
                          onChange={(e) => setNewPatient({ ...newPatient, wilaya: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 text-xs text-slate-950 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                        >
                          <option value="">-- Wilaya --</option>
                          {ALGERIAN_WILAYAS.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Organisme / Prise en charge</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['PRIVE', 'CNAS', 'CASNOS', 'MILITAIRE'].map(org => (
                          <button
                            key={org}
                            type="button"
                            onClick={() => setNewPatient({ ...newPatient, organisme: org })}
                            className={`p-2.5 border border-slate-200 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${
                              newPatient.organisme === org
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : 'bg-slate-50 text-slate-500 hover:border-indigo-200'
                            }`}
                          >
                            {org}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Numéro Sécurité Sociale (NSS)</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input 
                          type="text" 
                          placeholder="00 0000 0000 00"
                          value={newPatient.nss}
                          onChange={(e) => setNewPatient({ ...newPatient, nss: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 pl-9 p-2.5 text-xs text-slate-950 font-black font-mono outline-none focus:bg-white focus:border-indigo-500 transition-all rounded-xl shadow-inner-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                 <button 
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   className="text-slate-400 hover:text-slate-600 text-[9px] font-black uppercase tracking-widest transition-all"
                 >
                   Annuler
                 </button>
                 <div className="flex items-center gap-4">
                   <button 
                     type="reset"
                     onClick={() => setNewPatient({
                        name: '', name_arab: '', phone: '', email: '', gender: 'M', type_patient: 'adulte', age: 40, date_naissance: '', wilaya: '', organisme: '', street: '', city: '', nss: '', pathology: '', mecanisme: ''
                     })}
                     className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                   >
                     Vider
                   </button>
                   <button 
                     type="submit"
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 active:scale-95"
                   >
                     Valider le Dossier
                   </button>
                 </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
             key="list"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="overflow-x-auto bg-[#EBF1F5] rounded-xl border border-slate-200"
          >
            <table className="w-full text-left border-collapse" id="patients-table">
              <thead className="bg-[#EBF1F5]">
                <tr className="border-b border-slate-200" id="patients-table-header">
                  <th className="px-3 py-4 text-[12px] font-black text-slate-700 uppercase tracking-widest border-r border-slate-200 text-center">Patient</th>
                  <th className="px-3 py-4 text-[12px] font-black text-slate-700 uppercase tracking-widest border-r border-slate-200 text-center">Nom Arabe</th>
                  <th className="px-3 py-4 text-[12px] font-black text-slate-700 uppercase tracking-widest border-r border-slate-200 text-center">Sexe / Âge</th>
                  <th className="px-3 py-4 text-[12px] font-black text-slate-700 uppercase tracking-widest border-r border-slate-200 text-center">Wilaya</th>
                  <th className="px-3 py-4 text-[12px] font-black text-slate-700 uppercase tracking-widest border-r border-slate-200 text-center">Contact / Téléphone</th>
                  <th className="px-3 py-4 text-[12px] font-black text-slate-700 uppercase tracking-widest border-r border-slate-200 text-center">Adhésion</th>
                  <th className="px-3 py-4 text-center text-[12px] font-black text-slate-700 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-[#EBF1F5]">
                {displayedPatients.length > 0 ? (
                  displayedPatients.map((pat) => (
                    <tr 
                      key={pat.id} 
                      id={`patient-row-${pat.id}`}
                      className="hover:bg-indigo-50/10 transition-all group cursor-pointer"
                      onClick={() => handleSelectPatient(pat.id)}
                    >
                      <td className="px-3 py-1.5 border-r border-slate-200">
                        <p className="text-[11px] font-black text-slate-900 leading-tight uppercase">
                          {pat.name}
                        </p>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200 text-center" dir="rtl">
                        <span className="text-[12px] text-slate-900 font-bold font-arabic">
                          {pat.name_arab || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${pat.gender === 'F' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                          <span className="text-[11px] font-black text-slate-700 font-mono uppercase">{pat.gender === 'M' ? 'H' : 'F'} · {pat.age} A</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200 text-center uppercase">
                        <span className="text-[10px] font-black text-slate-600">
                          {ALGERIAN_WILAYAS.find(w => w.id === pat.wilaya)?.name || pat.wilaya || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black font-mono text-indigo-600 leading-tight">{pat.phone}</span>
                          <span className="text-[9px] text-slate-400 font-mono truncate">{pat.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200">
                        <span className="text-[10px] font-black text-slate-500 font-mono italic">{pat.date_creation}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPatient(pat.id);
                            }}
                            className="bg-white p-1 hover:bg-indigo-50 rounded border border-slate-200 text-indigo-600 transition-all shadow-sm"
                            title="Fiche"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Supprimer ce patient ?")) {
                                onDeletePatient(pat.id);
                              }
                            }}
                            className="bg-white p-1 hover:bg-rose-50 rounded border border-slate-200 text-rose-500 hover:text-rose-700 transition-all shadow-sm"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-slate-400">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Aucun patient dans cette sélection</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Pagination controls - Retour & Suivant */}
      {!selectedPatientId && !showAddModal && totalPages > 1 && (
        <div className="bg-white border border-slate-150 rounded-xl px-4 py-2 mt-4 flex items-center justify-between shadow-xs" id="patients-pagination">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Page <span className="text-slate-800">{activePage}</span> sur {totalPages} · <span className="text-slate-400">{filteredPatients.length} patients</span>
          </span>
          <div className="flex gap-2">
            <button
              disabled={activePage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-tighter"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Retour
            </button>
            <button
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-tighter shadow-3xs"
            >
              Suivant
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      )}
      {/* Support Identité Administrative Overlay */}
      {showAdminIdentity && patients.find(p => p.id === showAdminIdentity) && (
        <SupportIdentiteAdministrative 
          patient={patients.find(p => p.id === showAdminIdentity)!} 
          onClose={() => setShowAdminIdentity(null)} 
        />
      )}
    </div>
  );
}
