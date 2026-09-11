import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Save, Printer, Plus, ChevronRight, Globe, HelpCircle, FileCheck, Check
} from 'lucide-react';
import { DatabaseState, Patient, FicheIMC } from '../dbStore';

interface FicheEvaluationPediatriqueProps {
  patient: Patient;
  dbState: DatabaseState;
  onSave: (state: DatabaseState) => void;
  triggerToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  readOnly?: boolean;
  currentRole?: string;
}

export default function FicheEvaluationPediatrique({
  patient,
  dbState,
  onSave,
  triggerToast = () => {},
  readOnly = false,
  currentRole
}: FicheEvaluationPediatriqueProps) {
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

  // ID_Patient from standard or sub ID
  const patId = Number(patient.ID_Patient || (patient as any).id);

  // Historique des fiches pour ce patient
  const patientFiches = (dbState?.fiches_imc || []).filter(f => Number(f.ID_Patient) === patId);
  const [selectedFicheId, setSelectedFicheId] = useState<number | null>(
    patientFiches.length > 0 ? patientFiches[0].ID_Fiche_IMC : null
  );

  // Form states for Fiche IMC / Evaluation Pédiatrique
  const [floor, setFloor] = useState('');
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);
  const [nomMedecin, setNomMedecin] = useState('Dr. Ahmed');
  const [city, setCity] = useState(patient.city || '');
  const [phone, setPhone] = useState(patient.phone || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [relationship, setRelationship] = useState('');

  // Section A
  const [pregnancyDuration, setPregnancyDuration] = useState<string | number>('');
  const [laborNature, setLaborNature] = useState('');
  const [birthWeight, setBirthWeight] = useState<string | number>('');
  const [neonatalMaturity, setNeonatalMaturity] = useState('');
  const [incubationPeriod, setIncubationPeriod] = useState<string | number>('');
  const [hypoxia, setHypoxia] = useState(false);
  const [jaundice, setJaundice] = useState(false);
  const [cyanosis, setCyanosis] = useState(false);

  // Section B
  const [headControlAge, setHeadControlAge] = useState<string | number>('');
  const [rollingAge, setRollingAge] = useState<string | number>('');
  const [crawlingAge, setCrawlingAge] = useState<string | number>('');
  const [sittingAge, setSittingAge] = useState<string | number>('');
  const [getToSitAge, setGetToSitAge] = useState<string | number>('');
  const [getToStandAge, setGetToStandAge] = useState<string | number>('');
  const [standingAge, setStandingAge] = useState<string | number>('');
  const [walkingAge, setWalkingAge] = useState<string | number>('');
  const [balanceAge, setBalanceAge] = useState<string | number>('');

  // Section C
  const [tonicity, setTonicity] = useState('Normotonie');
  const [convulsions, setConvulsions] = useState(false);
  const [epilepsy, setEpilepsy] = useState(false);
  const [cognition, setCognition] = useState('Normale');
  const [autism, setAutism] = useState(false);
  const [downSyndrome, setDownSyndrome] = useState(false);
  const [vision, setVision] = useState('Normale');
  const [breathing, setBreathing] = useState('Normale');
  const [swallowing, setSwallowing] = useState('Normale');
  const [nutrition, setNutrition] = useState('Normale');
  const [deformities, setDeformities] = useState('');
  const [orthopaedicSurgery, setOrthopaedicSurgery] = useState('');

  // Section D
  const [smiling, setSmiling] = useState(false);
  const [playWithToys, setPlayWithToys] = useState(false);
  const [familiarStranger, setFamiliarStranger] = useState(false);
  const [showLikeDislike, setShowLikeDislike] = useState(false);
  const [showAnger, setShowAnger] = useState(false);
  const [nervousness, setNervousness] = useState(false);
  const [currentMedication, setCurrentMedication] = useState('');

  // Section E
  const [kineTherapy, setKineTherapy] = useState(false);
  const [kineDuration, setKineDuration] = useState('');
  const [psychoTherapy, setPsychoTherapy] = useState(false);
  const [psychoDuration, setPsychoDuration] = useState('');
  const [orthoTherapy, setOrthoTherapy] = useState(false);
  const [orthoDuration, setOrthoDuration] = useState('');
  const [ergoTherapy, setErgoTherapy] = useState(false);
  const [ergoDuration, setErgoDuration] = useState('');
  const [otherTherapy, setOtherTherapy] = useState('');
  const [numberOfSessions, setNumberOfSessions] = useState<string | number>('');
  const [frequencyPerWeek, setFrequencyPerWeek] = useState<string | number>('');
  const [observations, setObservations] = useState('');
  const [practitionerSignature, setPractitionerSignature] = useState('');

  // S'assurer que le premier élément de la liste des fiches est sélectionné si disponible
  useEffect(() => {
    if (patientFiches.length > 0 && selectedFicheId === null) {
      setSelectedFicheId(patientFiches[0].ID_Fiche_IMC);
    }
  }, [patientFiches, selectedFicheId]);

  // Charger la fiche sélectionnée
  useEffect(() => {
    if (selectedFicheId === null) {
      setFloor('');
      setConsultationDate(new Date().toISOString().split('T')[0]);
      setNomMedecin('Dr. Ahmed');
      setCity(patient.city || '');
      setPhone(patient.phone || '');
      setDiagnosis('');
      setRelationship('');
      setPregnancyDuration('');
      setLaborNature('');
      setBirthWeight('');
      setNeonatalMaturity('');
      setIncubationPeriod('');
      setHypoxia(false);
      setJaundice(false);
      setCyanosis(false);
      setHeadControlAge('');
      setRollingAge('');
      setCrawlingAge('');
      setSittingAge('');
      setGetToSitAge('');
      setGetToStandAge('');
      setStandingAge('');
      setWalkingAge('');
      setBalanceAge('');
      setTonicity('Normotonie');
      setConvulsions(false);
      setEpilepsy(false);
      setCognition('Normale');
      setAutism(false);
      setDownSyndrome(false);
      setVision('Normale');
      setBreathing('Normale');
      setSwallowing('Normale');
      setNutrition('Normale');
      setDeformities('');
      setOrthopaedicSurgery('');
      setSmiling(false);
      setPlayWithToys(false);
      setFamiliarStranger(false);
      setShowLikeDislike(false);
      setShowAnger(false);
      setNervousness(false);
      setCurrentMedication('');
      setKineTherapy(false);
      setKineDuration('');
      setPsychoTherapy(false);
      setPsychoDuration('');
      setOrthoTherapy(false);
      setOrthoDuration('');
      setErgoTherapy(false);
      setErgoDuration('');
      setOtherTherapy('');
      setNumberOfSessions('');
      setFrequencyPerWeek('');
      setObservations('');
      setPractitionerSignature('');
    } else {
      const fiche = (dbState?.fiches_imc || []).find(f => f.ID_Fiche_IMC === selectedFicheId);
      if (fiche) {
        setFloor(fiche.floor || '');
        setConsultationDate(fiche.Date_Consultation || new Date().toISOString().split('T')[0]);
        setNomMedecin(fiche.Nom_Medecin || 'Dr. Ahmed');
        setCity(fiche.city || patient.city || '');
        setPhone(fiche.phone || patient.phone || '');
        setDiagnosis(fiche.diagnosis || '');
        setRelationship(fiche.relationship || '');
        setPregnancyDuration(fiche.Pregnancy_Duration || '');
        setLaborNature(fiche.Labor_Nature || '');
        setBirthWeight(fiche.Birth_Weight || '');
        setNeonatalMaturity(fiche.Neonatal_Maturity || '');
        setIncubationPeriod(fiche.Incubation_Period || '');
        setHypoxia(!!fiche.Hypoxia);
        setJaundice(!!fiche.Jaundice);
        setCyanosis(!!fiche.Cyanosis);
        setHeadControlAge(fiche.Head_Control_Age || '');
        setRollingAge(fiche.Rolling_Age || '');
        setCrawlingAge(fiche.Crawling_Age || '');
        setSittingAge(fiche.Sitting_Age || '');
        setGetToSitAge(fiche.Get_To_Sit_Age || '');
        setGetToStandAge(fiche.Get_To_Stand_Age || '');
        setStandingAge(fiche.Standing_Age || '');
        setWalkingAge(fiche.Walking_Age || '');
        setBalanceAge(fiche.Balance_Age || '');
        setTonicity(fiche.Tonicity || 'Normotonie');
        setConvulsions(!!fiche.Convulsions);
        setEpilepsy(!!fiche.Epilepsy);
        setCognition(fiche.Cognition || 'Normale');
        setAutism(!!fiche.Autism);
        setDownSyndrome(!!fiche.Down_Syndrome);
        setVision(fiche.Vision || 'Normale');
        setBreathing(fiche.Breathing || 'Normale');
        setSwallowing(fiche.Swallowing || 'Normale');
        setNutrition(fiche.Nutrition || 'Normale');
        setDeformities(fiche.Deformities || '');
        setOrthopaedicSurgery(fiche.Orthopaedic_Surgery || '');
        setSmiling(!!fiche.Smiling);
        setPlayWithToys(!!fiche.Play_With_Toys);
        setFamiliarStranger(!!fiche.Familiar_Stranger);
        setShowLikeDislike(!!fiche.Show_Like_Dislike);
        setShowAnger(!!fiche.Show_Anger);
        setNervousness(!!fiche.Nervousness);
        setCurrentMedication(fiche.Current_Medication || '');
        setKineTherapy(!!fiche.Therapeutic_Plan?.includes('kine'));
        setKineDuration(fiche.Therapeutic_Duration || '');
        setPsychoTherapy(!!fiche.Therapeutic_Plan?.includes('psycho'));
        setPsychoDuration(fiche.Therapeutic_Duration || '');
        setOrthoTherapy(!!fiche.Therapeutic_Plan?.includes('ortho'));
        setOrthoDuration(fiche.Therapeutic_Duration || '');
        setErgoTherapy(!!fiche.Therapeutic_Plan?.includes('ergo'));
        setErgoDuration(fiche.Therapeutic_Duration || '');
        setOtherTherapy(fiche.other_therapy || '');
        setNumberOfSessions(fiche.Number_Of_Sessions || '');
        setFrequencyPerWeek(fiche.Frequency_Per_Week || '');
        setObservations(fiche.Observations || '');
        setPractitionerSignature(fiche.practitioner_signature || '');
      }
    }
  }, [selectedFicheId, dbState?.fiches_imc, patient]);

  // Auto-save toutes les 60s si modifications
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef<boolean>(false);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current && !actualReadOnly) {
        handleSaveFiche(true);
        triggerToast(lang === 'FR' ? "Fiche auto-sauvegardée" : "Sheet auto-saved", "info");
        isDirtyRef.current = false;
      }
    }, 60000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [
    floor, consultationDate, nomMedecin, city, phone, diagnosis, relationship,
    pregnancyDuration, laborNature, birthWeight, neonatalMaturity, incubationPeriod,
    hypoxia, jaundice, cyanosis, headControlAge, rollingAge, crawlingAge, sittingAge,
    getToSitAge, getToStandAge, standingAge, walkingAge, balanceAge, tonicity,
    convulsions, epilepsy, cognition, autism, downSyndrome, vision, breathing,
    swallowing, nutrition, deformities, orthopaedicSurgery, smiling, playWithToys,
    familiarStranger, showLikeDislike, showAnger, nervousness, currentMedication,
    kineTherapy, kineDuration, psychoTherapy, psychoDuration, orthoTherapy, orthoDuration,
    ergoTherapy, ergoDuration, otherTherapy, numberOfSessions, frequencyPerWeek,
    observations, practitionerSignature, selectedFicheId, lang
  ]);

  const generateNumRegistre = (): string => {
    const currentYear = new Date().getFullYear();
    // Priorité au numRegistre déjà présent sur le patient
    const patReg = (patient as any).numRegistre || (patient as any).Num_Registre;
    if (patReg) {
      return patReg;
    }
    const existingFiches = dbState?.fiches_imc || [];
    const patientFiche = existingFiches.find(f => Number(f.ID_Patient) === patId && f.Num_Registre);
    if (patientFiche) return patientFiche.Num_Registre;

    const yearPrefix = `IMC-${currentYear}-`;
    let maxNum = 0;
    
    // Parcourir fiches_imc
    existingFiches.forEach(f => {
      if (f.Num_Registre && f.Num_Registre.startsWith(yearPrefix)) {
        const parts = f.Num_Registre.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    });

    // Parcourir patients
    (dbState?.patients || []).forEach(p => {
      const reg = (p as any).numRegistre || (p as any).Num_Registre;
      if (reg && reg.startsWith(yearPrefix)) {
        const parts = reg.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    });

    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${yearPrefix}${nextNum}`;
  };

  const handleSaveFiche = (silent = false) => {
    if (actualReadOnly) return;
    try {
      const freshFiches = [...(dbState?.fiches_imc || [])];
      let targetId = selectedFicheId;
      const numRegistre = generateNumRegistre();

      const plan: string[] = [];
      if (kineTherapy) plan.push('kine');
      if (psychoTherapy) plan.push('psycho');
      if (orthoTherapy) plan.push('ortho');
      if (ergoTherapy) plan.push('ergo');

      const existingFiche = targetId ? freshFiches.find(f => f.ID_Fiche_IMC === targetId) : null;

      const ficheData: FicheIMC = {
        ID_Fiche_IMC: targetId || (freshFiches.length > 0 ? Math.max(...freshFiches.map(f => f.ID_Fiche_IMC)) + 1 : 1),
        ID_Patient: patId,
        Num_Registre: numRegistre,
        Date_Consultation: consultationDate,
        Nom_Medecin: nomMedecin || 'Dr. Ahmed',
        Pregnancy_Duration: pregnancyDuration,
        Labor_Nature: laborNature,
        Birth_Weight: birthWeight,
        Neonatal_Maturity: neonatalMaturity,
        Incubation_Period: incubationPeriod,
        Hypoxia: hypoxia,
        Jaundice: jaundice,
        Cyanosis: cyanosis,
        Head_Control_Age: headControlAge,
        Rolling_Age: rollingAge,
        Crawling_Age: crawlingAge,
        Sitting_Age: sittingAge,
        Get_To_Sit_Age: getToSitAge,
        Get_To_Stand_Age: getToStandAge,
        Standing_Age: standingAge,
        Walking_Age: walkingAge,
        Balance_Age: balanceAge,
        Tonicity: tonicity,
        Convulsions: convulsions,
        Epilepsy: epilepsy,
        Cognition: cognition,
        Autism: autism,
        Down_Syndrome: downSyndrome,
        Vision: vision,
        Breathing: breathing,
        Swallowing: swallowing,
        Nutrition: nutrition,
        Deformities: deformities,
        Orthopaedic_Surgery: orthopaedicSurgery,
        Smiling: smiling,
        Play_With_Toys: playWithToys,
        Familiar_Stranger: familiarStranger,
        Show_Like_Dislike: showLikeDislike,
        Show_Anger: showAnger,
        Nervousness: nervousness,
        Current_Medication: currentMedication,
        Therapeutic_Plan: plan,
        Therapeutic_Duration: kineDuration || psychoDuration || orthoDuration || ergoDuration || '',
        Number_Of_Sessions: Number(numberOfSessions) || 0,
        Frequency_Per_Week: Number(frequencyPerWeek) || 0,
        Observations: observations,
        createdAt: existingFiche?.createdAt || Date.now(),
        updatedAt: Date.now(),
        floor,
        city,
        phone,
        diagnosis,
        relationship,
        other_therapy: otherTherapy,
        practitioner_signature: practitionerSignature,
        pack_heures_prescrit: existingFiche?.pack_heures_prescrit || '62h',
        jours_previsionnels: existingFiche?.jours_previsionnels || [],
        heure_debut_previsionnelle: existingFiche?.heure_debut_previsionnelle || '09:00'
      };

      const newState = { ...dbState };
      if (targetId) {
        const index = freshFiches.findIndex(f => f.ID_Fiche_IMC === targetId);
        if (index !== -1) {
          freshFiches[index] = ficheData;
        }
      } else {
        freshFiches.push(ficheData);
        targetId = ficheData.ID_Fiche_IMC;
        setSelectedFicheId(targetId);
      }

      newState.fiches_imc = freshFiches;

      // Mettre à jour la file d'attente
      if (newState.fileAttenteIMC) {
        newState.fileAttenteIMC = newState.fileAttenteIMC.map(q => {
          if (Number(q.ID_Patient) === patId && q.Statut_Attente === 'En Attente') {
            return { ...q, Statut_Attente: "En attente d'abonnement" as any };
          }
          return q;
        });
      }

      onSave(newState);
      isDirtyRef.current = false;
      if (!silent) {
        triggerToast("Fiche d'évaluation enregistrée avec succès !", "success");
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        triggerToast("Erreur lors de l'enregistrement", "error");
      }
    }
  };

  const handlePrintFiche = () => {
    handleSaveFiche(true);
    setTimeout(() => {
      window.print();
    }, 550);
  };

  const handleCreateNewFiche = () => {
    if (actualReadOnly) {
      triggerToast("Vous n'êtes pas autorisé à créer une nouvelle fiche", "error");
      return;
    }
    setSelectedFicheId(null);
    triggerToast("Prêt pour la création d'une nouvelle fiche.", "info");
  };

  const calculateAge = (dobString?: string): string => {
    if (!dobString) return 'N/A';
    try {
      const dob = new Date(dobString);
      if (isNaN(dob.getTime())) return 'N/A';
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      const months = ageDate.getUTCMonth();
      if (years === 0) {
        return `${months} mois / months`;
      }
      return `${years} ans ${months} mois / ${years} y ${months} m`;
    } catch {
      return 'N/A';
    }
  };

  const currentAge = calculateAge(patient.Date_Nais_Pat || (patient as any).date_naissance);
  const activeFiche = (dbState?.fiches_imc || []).find(f => Number(f.ID_Patient) === patId);
  const numRegistre = activeFiche?.Num_Registre || "Non généré / Not generated";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <h4 className="font-extrabold text-[#1b3d4f] text-sm">
            Dossier Enfant IMC — {patient.Nom_Patient || (patient as any).name}
          </h4>
          <p className="text-[10px] text-slate-500 font-bold font-mono mt-1">
            REGISTRE N°: {numRegistre} • ÂGE: {currentAge}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1b3d4f] hover:bg-[#306568] text-white font-extrabold text-[10px] uppercase rounded-xl transition shadow-3xs"
          >
            <Globe className="w-3.5 h-3.5 text-rose-300" />
            <span>{lang === 'FR' ? 'English (EN)' : 'Français (FR)'}</span>
          </button>
        </div>
      </div>

      {/* HISTORIQUE ET NOUVELLE FICHE */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs no-print">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">Historique des fiches :</span>
          {patientFiches.length === 0 ? (
            <span className="text-slate-400 italic">Aucune fiche enregistrée</span>
          ) : (
            <select
              value={selectedFicheId || ''}
              onChange={(e) => setSelectedFicheId(e.target.value ? Number(e.target.value) : null)}
              className="border border-slate-250 bg-white rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
            >
              {patientFiches.map(f => (
                <option key={f.ID_Fiche_IMC} value={f.ID_Fiche_IMC}>
                  Fiche du {new Date(f.Date_Consultation).toLocaleDateString('fr-FR')} — par {f.Nom_Medecin}
                </option>
              ))}
            </select>
          )}
        </div>

        {!actualReadOnly && (
          <button
            onClick={handleCreateNewFiche}
            className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] uppercase rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? "Nouvelle Fiche" : "New Sheet"}</span>
          </button>
        )}
      </div>

      {/* FICHE PORTRAIT IMPRIMABLE */}
      <div className="bg-white p-8 border border-slate-300 rounded-xl max-w-4xl mx-auto font-sans text-slate-800 text-[11px] leading-relaxed relative print-sheet">
        
        {/* EN-TÊTE PAPIER */}
        <div className="flex justify-between items-stretch border border-slate-300 mb-6 rounded-lg overflow-hidden">
          <div className="w-1/2 p-4 border-r border-slate-300 flex items-center gap-4 bg-slate-50/50">
            <div className="flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo-kacel-sante.png"
                alt="KACEL SANTÉ Logo"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                  const fallback = document.getElementById('kacel-imc-logo-fallback-pedia');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="kacel-imc-logo-fallback-pedia" className="hidden flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="54" fill="#1A1A1A" stroke="#F5C518" strokeWidth="3.5" />
                  <circle cx="60" cy="32" r="5.5" fill="#FFFFFF" />
                  <path d="M57 41 C55 52, 53 62, 50 70 C53 70, 57 65, 59 55 C60 48, 59 42, 57 41 Z" fill="#F5C518" />
                  <path d="M57 43 C50 36, 42 34, 38 37 C42 41, 49 44, 55 46 Z" fill="#F5C518" />
                  <path d="M58 43 C66 35, 75 32, 80 35 C75 40, 67 44, 60 46 Z" fill="#F5C518" />
                  <path d="M57 52 C65 57, 73 63, 78 68 C72 68, 64 62, 57 56 Z" fill="#F5C518" />
                  <text x="60" y="77" fill="#FFFFFF" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="900" fontSize="8.5" textAnchor="middle" letterSpacing="0.9">KACELSANTÉ</text>
                  <path d="M34 85 Q47 82, 60 85 T86 85" stroke="#F5C518" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <path d="M37 89 Q47 86, 60 89 T83 89" stroke="#F5C518" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <path d="M41 93 Q47 90, 60 93 T79 93" stroke="#F5C518" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">KACEL SANTÉ</h4>
              <p className="text-[9px] text-slate-600 font-bold leading-normal">
                Centre de Médecine Physique<br />
                et de Rééducation Fonctionnelle<br />
                Cité du 01 Novembre, Ouled Moussa, BOUMERDES
              </p>
            </div>
          </div>
          <div className="w-1/2 p-4 flex flex-col justify-center items-center text-center bg-slate-50/10">
            <h3 className="text-sm font-black text-[#1b3d4f] uppercase tracking-wide">
              FICHE D'ÉVALUATION PÉDIATRIQUE
            </h3>
            <h4 className="text-[11px] font-bold text-slate-500 uppercase mt-0.5 font-serif italic">
              PEDIATRIC EVALUATION SHEET
            </h4>
          </div>
        </div>

        {/* INFORMATIONS GÉNÉRALES */}
        <div className="border border-slate-300 rounded-lg p-4 mb-6 space-y-3 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                REGISTRE N° / REGISTER N°
              </span>
              <span className="block text-rose-700 font-mono font-bold text-xs py-0.5">
                {numRegistre}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                MÉDECIN / DOCTOR
              </span>
              <select
                value={nomMedecin}
                onChange={(e) => {
                  setNomMedecin(e.target.value);
                  isDirtyRef.current = true;
                }}
                disabled={actualReadOnly}
                className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs cursor-pointer"
              >
                <option key="default-medecin" value="">-- Sélectionner un médecin --</option>
                {((dbState?.utilisateurs || []).filter(u => {
                  const r = (u.Role || '').toLowerCase();
                  return r.includes('medecin') || r.includes('médecin') || r.includes('doctor');
                })).map(u => {
                  const rawName = u.Nom_Utilisateur || '';
                  const docName = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`.trim();
                  return (
                    <option key={`user-doc-${u.ID_Utilisateur}`} value={docName}>
                      {docName} ({u.Role})
                    </option>
                  );
                })}
                {['Dr. Ahmed', 'Dr. Benkari', 'Dr. Kacel'].map(doc => (
                  <option key={`preset-doc-${doc}`} value={doc}>{doc}</option>
                ))}
                {nomMedecin && !['Dr. Ahmed', 'Dr. Benkari', 'Dr. Kacel'].includes(nomMedecin) && (
                  <option key={`custom-doc-${nomMedecin}`} value={nomMedecin}>{nomMedecin}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* SECTIONS A, B, C, D, E */}
        {/* SECTION A — ANAMNÈSE */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
            <span>A — ANAMNÈSE ANTÉ / NÉONATALE</span>
            <span>ANTE / NEONATAL HISTORY</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                  DURÉE GROSSESSE / PREGNANCY TERM (SA)
                </span>
                <input
                  type="text"
                  value={pregnancyDuration}
                  onChange={(e) => setPregnancyDuration(e.target.value)}
                  placeholder="Ex: 38"
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                  NATURE DE L'ACCOUCHEMENT / LABOR NATURE
                </span>
                <input
                  type="text"
                  value={laborNature}
                  onChange={(e) => setLaborNature(e.target.value)}
                  placeholder="Ex: Césarienne / Voie basse"
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                  POIDS DE NAISSANCE / BIRTH WEIGHT (G)
                </span>
                <input
                  type="text"
                  value={birthWeight}
                  onChange={(e) => setBirthWeight(e.target.value)}
                  placeholder="Ex: 3200"
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                  MATURITÉ NÉONATALE / NEONATAL MATURITY
                </span>
                <input
                  type="text"
                  value={neonatalMaturity}
                  onChange={(e) => setNeonatalMaturity(e.target.value)}
                  placeholder="Ex: Cri immédiat"
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                  DURÉE COUVEUSE / INCUBATOR DURATION
                </span>
                <input
                  type="text"
                  value={incubationPeriod}
                  onChange={(e) => setIncubationPeriod(e.target.value)}
                  placeholder="Ex: 3 jours"
                  className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={hypoxia}
                  onChange={(e) => setHypoxia(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span>Anoxie / Hypoxia</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={jaundice}
                  onChange={(e) => setJaundice(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span>Ictère / Jaundice</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={cyanosis}
                  onChange={(e) => setCyanosis(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span>Cyanose / Cyanosis</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION B — ACQUISITIONS MOTEURS */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
            <span>B — ÉTAPES DU DÉVELOPPEMENT MOTEUR</span>
            <span>MOTOR DEVELOPMENTAL MILESTONES</span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">TENUE DE TÊTE / HEAD CONTROL</span>
              <input type="text" value={headControlAge} onChange={(e) => setHeadControlAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">RETOURNEMENT / ROLLING</span>
              <input type="text" value={rollingAge} onChange={(e) => setRollingAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">RAMPEMENT / CRAWLING</span>
              <input type="text" value={crawlingAge} onChange={(e) => setCrawlingAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">TENUE ASSISE / SITTING</span>
              <input type="text" value={sittingAge} onChange={(e) => setSittingAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">PASSAGE ASSIS / GET TO SITTING</span>
              <input type="text" value={getToSitAge} onChange={(e) => setGetToSitAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">STATION DEBOUT / STANDING</span>
              <input type="text" value={standingAge} onChange={(e) => setStandingAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">MARCHE LIBRE / WALKING</span>
              <input type="text" value={walkingAge} onChange={(e) => setWalkingAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">ÉQUILIBRE UNIPODAL / BALANCE</span>
              <input type="text" value={balanceAge} onChange={(e) => setBalanceAge(e.target.value)} placeholder="Âge (mois)" className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
            </div>
          </div>
        </div>

        {/* SECTION C — EXAMEN CLINIQUE */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
            <span>C — EXAMEN NEURO-ORTHOPÉDIQUE CLINIQUE</span>
            <span>CLINICAL EXAM</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">TONICITÉ / TONICITY</span>
                <select value={tonicity} onChange={(e) => setTonicity(e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs">
                  <option value="Normotonie">Normotonie</option>
                  <option value="Hypotonie">Hypotonie</option>
                  <option value="Hypertonie">Hypertonie</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">COGNITION / COGNITION</span>
                <select value={cognition} onChange={(e) => setCognition(e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs">
                  <option value="Normale">Normale</option>
                  <option value="Retard">Retard de développement</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">VISION / VISION</span>
                <select value={vision} onChange={(e) => setVision(e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs">
                  <option value="Normale">Normale</option>
                  <option value="Altérée">Altérée</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">DEGLUTITION / SWALLOWING</span>
                <select value={swallowing} onChange={(e) => setSwallowing(e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs">
                  <option value="Normale">Normale</option>
                  <option value="Difficile">Difficultés / Difficult</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={convulsions} onChange={(e) => setConvulsions(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                <span>Convulsions</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={epilepsy} onChange={(e) => setEpilepsy(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                <span>Épilepsie</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={autism} onChange={(e) => setAutism(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                <span>Autisme</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={downSyndrome} onChange={(e) => setDownSyndrome(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                <span>Trisomie 21</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION D — DEFORMATIONS ET CHIRURGIE */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
            <span>D — DÉFORMATIONS &amp; CHIRURGIE</span>
            <span>DEFORMITIES &amp; SURGERY</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">DÉFORMITÉS / DEFORMITIES</span>
                <input type="text" value={deformities} onChange={(e) => setDeformities(e.target.value)} placeholder="Ex: Spine, Lower limbs..." className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">CHIRURGIE ORTHOPÉDIQUE</span>
                <input type="text" value={orthopaedicSurgery} onChange={(e) => setOrthopaedicSurgery(e.target.value)} placeholder="..." className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION E — PROJET THERAPEUTIQUE */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
            <span>E — PROJET THÉRAPEUTIQUE</span>
            <span>THERAPEUTIC PLAN</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input type="checkbox" checked={kineTherapy} onChange={(e) => setKineTherapy(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                  <span>Kinésithérapie</span>
                </label>
                <input type="text" value={kineDuration} onChange={(e) => setKineDuration(e.target.value)} placeholder="Durée" disabled={!kineTherapy} className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]" />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input type="checkbox" checked={psychoTherapy} onChange={(e) => setPsychoTherapy(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                  <span>Psychomotricité</span>
                </label>
                <input type="text" value={psychoDuration} onChange={(e) => setPsychoDuration(e.target.value)} placeholder="Durée" disabled={!psychoTherapy} className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]" />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input type="checkbox" checked={orthoTherapy} onChange={(e) => setOrthoTherapy(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                  <span>Orthophonie</span>
                </label>
                <input type="text" value={orthoDuration} onChange={(e) => setOrthoDuration(e.target.value)} placeholder="Durée" disabled={!orthoTherapy} className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]" />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input type="checkbox" checked={ergoTherapy} onChange={(e) => setErgoTherapy(e.target.checked)} className="w-4 h-4 rounded text-rose-500 border-slate-300" />
                  <span>Ergothérapie</span>
                </label>
                <input type="text" value={ergoDuration} onChange={(e) => setErgoDuration(e.target.value)} placeholder="Durée" disabled={!ergoTherapy} className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">SÉANCES TOTALES / TOTAL SESSIONS</span>
                <input type="number" value={numberOfSessions} onChange={(e) => setNumberOfSessions(e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-rose-750 font-mono font-bold py-0.5 focus:outline-none text-xs" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">SÉANCES / SEMAINE</span>
                <input type="number" value={frequencyPerWeek} onChange={(e) => setFrequencyPerWeek(e.target.value)} className="w-full bg-transparent border-b border-slate-300 text-rose-750 font-mono font-bold py-0.5 focus:outline-none text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">OBSERVATIONS / OBSERVATIONS</span>
              <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-medium py-1 focus:outline-none text-xs resize-y" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">SIGNATURE DU PRATICIEN</span>
                <input type="text" value={practitionerSignature} onChange={(e) => setPractitionerSignature(e.target.value)} placeholder="Signature..." className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs italic font-serif" />
              </div>
              <div className="space-y-1 text-right">
                <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">DATE</span>
                <span className="block text-slate-800 font-bold text-xs py-0.5">{new Date(consultationDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl mt-6 no-print">
        <div className="flex items-center gap-2">
          {actualReadOnly ? (
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">Lecture Seule</span>
          ) : (
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Auto-save actif</span>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        <div className="flex items-center gap-3">
          {!actualReadOnly && (
            <button
              onClick={() => handleSaveFiche(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase rounded-xl transition shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'FR' ? "Enregistrer" : "Save"}</span>
            </button>
          )}

          <button
            onClick={handlePrintFiche}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'FR' ? "Imprimer PDF" : "Print PDF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
