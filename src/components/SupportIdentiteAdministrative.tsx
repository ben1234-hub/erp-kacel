import React from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck,
  Globe,
  FileText,
  CreditCard,
  Flag,
  Activity,
  Clock
} from 'lucide-react';
import { Patient, ALGERIAN_WILAYAS } from '../types';

interface SupportIdentiteAdministrativeProps {
  patient: Patient;
  onClose: () => void;
}

export default function SupportIdentiteAdministrative({ patient: rawPatient, onClose }: SupportIdentiteAdministrativeProps) {
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

  const wilayaName = ALGERIAN_WILAYAS.find(w => w.id === patient.wilaya)?.name || patient.wilaya || 'Non renseignée';

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-0 z-[100] animate-in fade-in zoom-in duration-300">
      <div className="bg-white w-full h-full max-w-5xl md:h-auto md:max-h-[90vh] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border border-slate-200">
        
        {/* Barre de titre - Design Fenêtre Logiciel */}
        <div className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              État Civil & Identité Administrative
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all group"
            title="Fermer la fenêtre (Echap)"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Contenu - Format "Fiche Administrative" */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Header avec Photo et Nom */}
            <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-200 pb-10">
              <div className="w-32 h-32 rounded-3xl bg-indigo-600 flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-indigo-200 uppercase shrink-0 border-4 border-white">
                {patient.gender === 'M' ? 'H' : patient.gender === 'F' ? 'F' : 'A'}
              </div>
              <div className="text-center md:text-left space-y-2 flex-1">
                <div className="flex flex-col md:flex-row md:items-baseline gap-4">
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">{patient.name}</h1>
                  {patient.name_arab && (
                    <span className="text-4xl font-bold text-slate-400 font-arabic translate-y-1" dir="rtl">
                      {patient.name_arab}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest font-mono">
                    Réf: {patient.dossier_num || `PAT-${patient.id.slice(-4).toUpperCase()}`}
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest font-mono">
                    Inscrit le {patient.date_creation}
                  </span>
                </div>
              </div>
            </div>

            {/* Grilles d'informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Colonne 1: État Civil */}
              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                  <User className="w-4 h-4" />
                  Informations d'État Civil
                </h3>
                
                <div className="space-y-6 pl-2">
                  <InfoRow icon={Calendar} label="Date de naissance" value={patient.date_naissance || 'Non renseignée'} mono />
                  <InfoRow icon={Activity} label="Âge déclaré" value={`${patient.age} Ans`} />
                  <InfoRow icon={Flag} label="Sexe / Genre" value={patient.gender === 'M' ? 'Masculin (Homme)' : patient.gender === 'F' ? 'Féminin (Femme)' : 'Autre'} />
                  <InfoRow icon={Globe} label="Wilaya de résidence" value={wilayaName} />
                  <InfoRow icon={MapPin} label="Commune / Ville" value={patient.city || 'Non renseignée'} />
                </div>
              </div>

              {/* Colonne 2: Identité Administrative */}
              <div className="space-y-6 border-l border-slate-200 md:pl-12 pl-0">
                <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-4 h-4" />
                  Identité Administrative
                </h3>
                
                <div className="space-y-6">
                  <InfoRow icon={CreditCard} label="Organisme Payeur" value={patient.organisme || 'Indépendant / Privé'} />
                  <InfoRow icon={FileText} label="Numéro Sécurité Sociale (NSS)" value={patient.nss || 'Non renseigné'} mono />
                  <InfoRow icon={Phone} label="Contact Téléphonique" value={patient.phone} mono />
                  <InfoRow icon={Mail} label="Adresse de Messagerie" value={patient.email || 'Aucun e-mail enregistré'} />
                  <div className="pt-4">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-mono">Adresse Postale Complète</label>
                     <div className="bg-slate-100 p-4 rounded-2xl text-xs font-semibold text-slate-700 min-h-[60px] border border-slate-200 italic">
                        {patient.street || 'Aucune adresse postale précise'}
                     </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 p-8 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-mono font-bold tracking-tight uppercase">
            <Clock className="w-3.5 h-3.5" />
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </div>
          <button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-[0.2em] px-10 py-4 rounded-2xl shadow-xl transition-all active:scale-95"
          >
            Fermer le support
          </button>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }: { icon: any, label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 flex-1">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{label}</p>
        <p className={`text-base font-bold text-slate-800 truncate leading-tight ${mono ? 'font-mono tracking-tighter' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
