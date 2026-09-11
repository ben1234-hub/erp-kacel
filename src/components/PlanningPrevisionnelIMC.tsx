import React, { useState, useEffect } from 'react';
import { Save, Calendar } from 'lucide-react';
import { DatabaseState, Patient, FicheIMC } from '../dbStore';

interface PlanningPrevisionnelIMCProps {
  patient: Patient;
  dbState: DatabaseState;
  onSave: (state: DatabaseState) => void;
  triggerToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  readOnly?: boolean;
  currentRole?: string;
}

export default function PlanningPrevisionnelIMC({
  patient,
  dbState,
  onSave,
  triggerToast = () => {},
  readOnly = false,
  currentRole
}: PlanningPrevisionnelIMCProps) {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');

  const isAuthorizedToEdit = () => {
    if (readOnly) return false;
    if (!currentRole) return true;
    const roleLower = currentRole.toLowerCase();
    return (
      roleLower.includes('admin') ||
      roleLower.includes('assistante') ||
      roleLower.includes('super receptionniste') ||
      roleLower.includes('super réceptionniste')
    );
  };
  const actualReadOnly = !isAuthorizedToEdit();

  const patId = Number(patient.ID_Patient || (patient as any).id);

  // Charger la fiche de ce patient
  const patientFiches = (dbState?.fiches_imc || []).filter(f => Number(f.ID_Patient) === patId);
  const [fiche, setFiche] = useState<FicheIMC | null>(null);

  const [packHeuresPrescrit, setPackHeuresPrescrit] = useState<string>('62h');
  const [customPackHeures, setCustomPackHeures] = useState<string>('');
  const [planningDays, setPlanningDays] = useState<string[]>([]);
  const [planningTime, setPlanningTime] = useState('09:00');

  useEffect(() => {
    const f = patientFiches.length > 0 ? patientFiches[0] : null;
    setFiche(f);
    if (f) {
      const pPrescrit = f.pack_heures_prescrit || '62h';
      setPackHeuresPrescrit(pPrescrit);
      if (!['62h', '75h', '87h', '100h', '125h', '150h'].includes(pPrescrit)) {
        setPackHeuresPrescrit('Autre');
        setCustomPackHeures(pPrescrit);
      } else {
        setCustomPackHeures('');
      }
      setPlanningDays(f.jours_previsionnels || []);
      setPlanningTime(f.heure_debut_previsionnelle || '09:00');
    }
  }, [dbState?.fiches_imc, patId]);

  const generateNumRegistre = (): string => {
    const currentYear = new Date().getFullYear();
    const existingFiches = dbState?.fiches_imc || [];
    const patientFiche = existingFiches.find(f => Number(f.ID_Patient) === patId);
    if (patientFiche) return patientFiche.Num_Registre;

    const yearPrefix = `IMC-${currentYear}-`;
    const yearFiches = existingFiches.filter(f => f.Num_Registre.startsWith(yearPrefix));
    let maxNum = 0;
    yearFiches.forEach(f => {
      const parts = f.Num_Registre.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${yearPrefix}${nextNum}`;
  };

  const handleSavePlanning = () => {
    if (actualReadOnly) return;
    try {
      const freshFiches = [...(dbState?.fiches_imc || [])];
      const numRegistre = generateNumRegistre();
      const finalPack = packHeuresPrescrit === 'Autre' ? customPackHeures : packHeuresPrescrit;

      const newState = { ...dbState };
      const existingIndex = freshFiches.findIndex(f => Number(f.ID_Patient) === patId);

      if (existingIndex !== -1) {
        // Mettre à jour la fiche existante
        const existingFiche = freshFiches[existingIndex];
        freshFiches[existingIndex] = {
          ...existingFiche,
          pack_heures_prescrit: finalPack,
          jours_previsionnels: planningDays,
          heure_debut_previsionnelle: planningTime,
          updatedAt: Date.now()
        };
      } else {
        // Créer une nouvelle fiche minimale juste avec le planning
        const newFiche: FicheIMC = {
          ID_Fiche_IMC: freshFiches.length > 0 ? Math.max(...freshFiches.map(f => f.ID_Fiche_IMC)) + 1 : 1,
          ID_Patient: patId,
          Num_Registre: numRegistre,
          Date_Consultation: new Date().toISOString().split('T')[0],
          Nom_Medecin: 'Dr. Ahmed',
          Pregnancy_Duration: '',
          Labor_Nature: '',
          Birth_Weight: '',
          Neonatal_Maturity: '',
          Incubation_Period: '',
          Hypoxia: false,
          Jaundice: false,
          Cyanosis: false,
          Head_Control_Age: '',
          Rolling_Age: '',
          Crawling_Age: '',
          Sitting_Age: '',
          Get_To_Sit_Age: '',
          Get_To_Stand_Age: '',
          Standing_Age: '',
          Walking_Age: '',
          Balance_Age: '',
          Tonicity: 'Normotonie',
          Convulsions: false,
          Epilepsy: false,
          Cognition: 'Normale',
          Autism: false,
          Down_Syndrome: false,
          Vision: 'Normale',
          Breathing: 'Normale',
          Swallowing: 'Normale',
          Nutrition: 'Normale',
          Deformities: '',
          Orthopaedic_Surgery: '',
          Smiling: false,
          Play_With_Toys: false,
          Familiar_Stranger: false,
          Show_Like_Dislike: false,
          Show_Anger: false,
          Nervousness: false,
          Current_Medication: '',
          Therapeutic_Plan: [],
          Therapeutic_Duration: '',
          Number_Of_Sessions: 0,
          Frequency_Per_Week: 0,
          Observations: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          floor: '',
          city: patient.city || '',
          phone: patient.phone || '',
          diagnosis: '',
          relationship: '',
          other_therapy: '',
          practitioner_signature: '',
          pack_heures_prescrit: finalPack,
          jours_previsionnels: planningDays,
          heure_debut_previsionnelle: planningTime
        };
        freshFiches.push(newFiche);
      }

      newState.fiches_imc = freshFiches;

      // Mettre à jour la file d'attente si nécessaire
      if (newState.fileAttenteIMC) {
        newState.fileAttenteIMC = newState.fileAttenteIMC.map(q => {
          if (Number(q.ID_Patient) === patId && q.Statut_Attente === 'En Attente') {
            return { ...q, Statut_Attente: "En attente d'abonnement" as any };
          }
          return q;
        });
      }

      onSave(newState);
      triggerToast("Planning prévisionnel enregistré avec succès !", "success");
    } catch (err) {
      console.error(err);
      triggerToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const numRegistre = fiche?.Num_Registre || "Non généré / Not generated";
  const numberOfSessions = fiche?.Number_Of_Sessions || 0;
  const frequencyPerWeek = fiche?.Frequency_Per_Week || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
        <div>
          <h4 className="font-extrabold text-[#1b3d4f] text-sm">
            {patient.Nom_Patient || (patient as any).name}
          </h4>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            Registre N° : <span className="font-mono text-rose-700">{numRegistre}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-tight">
            PRESCRIPTION MÉDICALE DU MÉDECIN
          </span>
          <span className="text-xs font-black text-[#1b3d4f]">
            {numberOfSessions ? `${numberOfSessions} séances` : 'Non définie'} • {frequencyPerWeek ? `${frequencyPerWeek} séances/semaine` : 'Non définie'}
          </span>
        </div>
      </div>

      {/* RENSEIGNEMENTS DU PLANNING PRÉVISIONNEL */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
        
        {/* Pack d'heures prescrit */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
            PACK D'HEURES PRESCRIT :
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['62h', '75h', '87h', '100h', '125h', '150h', 'Autre'].map(pack => (
              <button
                key={pack}
                type="button"
                onClick={() => {
                  setPackHeuresPrescrit(pack);
                  if (pack !== 'Autre') {
                    setCustomPackHeures('');
                  }
                }}
                className={`py-3 px-4 rounded-xl border text-center transition duration-150 cursor-pointer ${
                  packHeuresPrescrit === pack 
                    ? 'bg-rose-50/50 border-rose-400 text-rose-800 shadow-3xs font-black' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                }`}
              >
                <span className="text-xs block">{pack === 'Autre' ? 'Autre' : pack}</span>
              </button>
            ))}
          </div>

          {packHeuresPrescrit === 'Autre' && (
            <div className="mt-3 max-w-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Spécifier le pack d'heures
              </label>
              <input
                type="text"
                value={customPackHeures}
                onChange={(e) => setCustomPackHeures(e.target.value)}
                placeholder="Ex: 200h, 80h..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}
        </div>

        {/* PLANNING & SÉANCES */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h5 className="font-extrabold text-[#1b3d4f] text-xs uppercase tracking-wider">
            PLANNING PRÉVISIONNEL
          </h5>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">
              Jours de séances prévisionnels :
            </label>
            <div className="grid grid-cols-7 gap-2">
              {['Sam', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(day => {
                const isFriday = day === 'Ven';
                const isSelected = planningDays.includes(day);
                if (isFriday) {
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled
                      title="Vendredi - Repos (Non disponible)"
                      className="py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed opacity-60"
                    >
                      Ven 🔒
                    </button>
                  );
                }
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={actualReadOnly}
                    onClick={() => {
                      setPlanningDays(prev => 
                        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                      );
                    }}
                    className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSelected 
                        ? 'bg-rose-500 border-rose-500 text-white shadow-3xs font-black' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                Heure de début prévisionnelle
              </label>
              <input
                type="time"
                value={planningTime}
                onChange={(e) => setPlanningTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER AVEC RETOUR ET ENREGISTREMENT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 bg-slate-50 p-4 border border-slate-200 rounded-xl">
        <div className="flex-1 max-w-md">
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-rose-400 pl-3">
            Cette fiche contient les prévisions médicales dictées par le médecin. Le paiement et l'abonnement commercial seront traités dans une étape séparée par l'assistante.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!actualReadOnly && (
            <button
              type="button"
              onClick={handleSavePlanning}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase rounded-xl transition shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les prévisions</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
