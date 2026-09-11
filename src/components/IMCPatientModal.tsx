/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, FileText, CreditCard, Save, Printer, Plus, ChevronRight, 
  Calendar, User, Check, Globe, HelpCircle, FileCheck, Clock, Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { DatabaseState, Patient, Abonnement, Pack, FicheIMC, Praticien } from '../dbStore';
import { OrientationTab, OrientationData, defaultOrientationData } from './OrientationTab';

interface IMCPatientModalProps {
  patient: Patient;
  dbState: DatabaseState;
  onClose: () => void;
  onSave: (state: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  readOnly?: boolean;
  currentRole?: string;
}

export const IMCPatientModal: React.FC<IMCPatientModalProps> = ({
  patient,
  dbState,
  onClose,
  onSave,
  triggerToast,
  readOnly = false,
  currentRole
}) => {
  const [activeTab, setActiveTab] = useState<'fiche' | 'planning' | 'abonnements' | 'historique' | 'orientation'>('fiche');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [orientationData, setOrientationData] = useState<OrientationData>(defaultOrientationData);

  const isAuthorizedToEdit = () => {
    if (readOnly) return false;
    if (!currentRole) return true; // Default allow if not supplied
    const roleLower = currentRole.toLowerCase();
    return (
      roleLower.includes('admin') ||
      roleLower.includes('assistante') ||
      roleLower.includes('super receptionniste') ||
      roleLower.includes('super réceptionniste')
    );
  };
  const actualReadOnly = !isAuthorizedToEdit();

  // Historique des fiches pour ce patient
  const patientFiches = (dbState?.fiches_imc || []).filter(f => f.ID_Patient === patient.ID_Patient);
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
  const [tonicity, setTonicity] = useState('Normotonie'); // Normal tone, Hypotonie, Hypertonie
  const [convulsions, setConvulsions] = useState(false);
  const [epilepsy, setEpilepsy] = useState(false);
  const [cognition, setCognition] = useState('Normale'); // Normale, Retard
  const [autism, setAutism] = useState(false);
  const [downSyndrome, setDownSyndrome] = useState(false);
  const [vision, setVision] = useState('Normale'); // Normale, Altérée
  const [breathing, setBreathing] = useState('Normale'); // Normale, Difficulté
  const [swallowing, setSwallowing] = useState('Normale'); // Normale, Difficile
  const [nutrition, setNutrition] = useState('Normale'); // Normale, Sonde
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

  // Form states for Planning Prévisionnel
  const [packHeuresPrescrit, setPackHeuresPrescrit] = useState<string>('62h');
  const [customPackHeures, setCustomPackHeures] = useState<string>('');
  const [planningDays, setPlanningDays] = useState<string[]>([]);
  const [planningTime, setPlanningTime] = useState('09:00');

  // États pour la création de l'abonnement commercial
  const [abnPackId, setAbnPackId] = useState<number>(() => {
    return dbState?.packs?.[0]?.ID_Pack || 1;
  });
  const [abnStartDate, setAbnStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [abnEndDate, setAbnEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [abnAdd1, setAbnAdd1] = useState<string>('none');
  const [abnAdd2, setAbnAdd2] = useState<string>('none');
  const isDirtyRef = React.useRef(false);

  // Auto-calcul de l'âge à partir de la date de naissance
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

  // Charger une fiche sélectionnée
  useEffect(() => {
    if (selectedFicheId === null) {
      // Réinitialiser les champs pour une nouvelle fiche
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
      setPackHeuresPrescrit('62h');
      setCustomPackHeures('');
      setPlanningDays([]);
      setPlanningTime('09:00');
    } else {
      const fiche = (dbState?.fiches_imc || []).find(f => f.ID_Fiche_IMC === selectedFicheId);
      if (fiche) {
        setFloor(fiche.floor || '');
        setConsultationDate(fiche.Date_Consultation);
        setNomMedecin(fiche.Nom_Medecin);
        setCity(fiche.city || patient.city || '');
        setPhone(fiche.phone || patient.phone || '');
        setDiagnosis(fiche.diagnosis || '');
        setRelationship(fiche.relationship || '');
        setPregnancyDuration(fiche.Pregnancy_Duration);
        setLaborNature(fiche.Labor_Nature);
        setBirthWeight(fiche.Birth_Weight);
        setNeonatalMaturity(fiche.Neonatal_Maturity);
        setIncubationPeriod(fiche.Incubation_Period);
        setHypoxia(fiche.Hypoxia);
        setJaundice(fiche.Jaundice);
        setCyanosis(fiche.Cyanosis);
        setHeadControlAge(fiche.Head_Control_Age);
        setRollingAge(fiche.Rolling_Age);
        setCrawlingAge(fiche.Crawling_Age);
        setSittingAge(fiche.Sitting_Age);
        setGetToSitAge(fiche.Get_To_Sit_Age);
        setGetToStandAge(fiche.Get_To_Stand_Age);
        setStandingAge(fiche.Standing_Age);
        setWalkingAge(fiche.Walking_Age);
        setBalanceAge(fiche.Balance_Age);
        setTonicity(fiche.Tonicity);
        setConvulsions(fiche.Convulsions);
        setEpilepsy(fiche.Epilepsy);
        setCognition(fiche.Cognition);
        setAutism(fiche.Autism);
        setDownSyndrome(fiche.Down_Syndrome);
        setVision(fiche.Vision);
        setBreathing(fiche.Breathing);
        setSwallowing(fiche.Swallowing);
        setNutrition(fiche.Nutrition);
        setDeformities(fiche.Deformities);
        setOrthopaedicSurgery(fiche.Orthopaedic_Surgery);
        setSmiling(fiche.Smiling);
        setPlayWithToys(fiche.Play_With_Toys);
        setFamiliarStranger(fiche.Familiar_Stranger);
        setShowLikeDislike(fiche.Show_Like_Dislike);
        setShowAnger(fiche.Show_Anger);
        setNervousness(fiche.Nervousness);
        setCurrentMedication(fiche.Current_Medication);
        setKineTherapy(fiche.Therapeutic_Plan.includes('kine'));
        setKineDuration(fiche.Therapeutic_Duration || '');
        setPsychoTherapy(fiche.Therapeutic_Plan.includes('psycho'));
        setPsychoDuration(fiche.Therapeutic_Duration || '');
        setOrthoTherapy(fiche.Therapeutic_Plan.includes('ortho'));
        setOrthoDuration(fiche.Therapeutic_Duration || '');
        setErgoTherapy(fiche.Therapeutic_Plan.includes('ergo'));
        setErgoDuration(fiche.Therapeutic_Duration || '');
        setOtherTherapy(fiche.other_therapy || '');
        setNumberOfSessions(fiche.Number_Of_Sessions);
        setFrequencyPerWeek(fiche.Frequency_Per_Week);
        setObservations(fiche.Observations);
        setPractitionerSignature(fiche.practitioner_signature || '');
        
        // Planning prévisionnel
        const pPrescrit = fiche.pack_heures_prescrit || '62h';
        setPackHeuresPrescrit(pPrescrit);
        if (!['62h', '75h', '87h', '100h', '125h', '150h'].includes(pPrescrit)) {
          setPackHeuresPrescrit('Autre');
          setCustomPackHeures(pPrescrit);
        } else {
          setCustomPackHeures('');
        }
        setPlanningDays(fiche.jours_previsionnels || []);
        setPlanningTime(fiche.heure_debut_previsionnelle || '09:00');
      }
    }
  }, [selectedFicheId, dbState?.fiches_imc, patient]);

  // Sync orientation data when patient changes
  useEffect(() => {
    if (patient) {
      setOrientationData((patient as any).orientation || defaultOrientationData);
    }
  }, [patient]);

  // Formulaire d'évaluation pédiatrique - auto-save toutes les 60s
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      handleSaveFiche(true); // silent auto-save
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
    observations, practitionerSignature, selectedFicheId,
    packHeuresPrescrit, customPackHeures, planningDays, planningTime
  ]);

  const generateNumRegistre = (): string => {
    const currentYear = new Date().getFullYear();
    const existingFiches = dbState?.fiches_imc || [];
    const patientFiche = existingFiches.find(f => f.ID_Patient === patient.ID_Patient);
    if (patientFiche) return patientFiche.Num_Registre; // Même patient = même N° à vie

    // Trouver le numéro incrémental max pour l'année en cours
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

  const handleSaveOrientation = () => {
    if (!patient) return;
    const updatedPatients = (dbState?.patients || []).map((p) => {
      if (p.ID_Patient === patient.ID_Patient) {
        return { ...p, orientation: orientationData };
      }
      return p;
    });
    const updatedState = { ...dbState, patients: updatedPatients };
    onSave(updatedState);
    triggerToast("Orientation enregistrée avec succès !", "success");
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

      const ficheData: FicheIMC = {
        ID_Fiche_IMC: targetId || (freshFiches.length > 0 ? Math.max(...freshFiches.map(f => f.ID_Fiche_IMC)) + 1 : 1),
        ID_Patient: patient.ID_Patient,
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
        createdAt: targetId ? freshFiches.find(f => f.ID_Fiche_IMC === targetId)?.createdAt || Date.now() : Date.now(),
        updatedAt: Date.now(),
        floor,
        city,
        phone,
        diagnosis,
        relationship,
        other_therapy: otherTherapy,
        practitioner_signature: practitionerSignature,
        pack_heures_prescrit: packHeuresPrescrit === 'Autre' ? customPackHeures : packHeuresPrescrit,
        jours_previsionnels: planningDays,
        heure_debut_previsionnelle: planningTime
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

      // Mettre à jour le statut du patient dans la file d'attente IMC
      if (newState.fileAttenteIMC) {
        newState.fileAttenteIMC = newState.fileAttenteIMC.map(q => {
          if (q.ID_Patient === patient.ID_Patient && q.Statut_Attente === 'En Attente') {
            return { ...q, Statut_Attente: 'En attente d\'abonnement' as any };
          }
          return q;
        });
      }

      onSave(newState);
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
    handleSaveFiche(true); // Toujours sauvegarder avant d'imprimer
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Le planning prévisionnel est enregistré directement via la fiche d'évaluation.

  const handleCreateNewFiche = () => {
    if (actualReadOnly) {
      triggerToast("Vous n'êtes pas autorisé à créer une nouvelle fiche", "error");
      return;
    }
    setSelectedFicheId(null);
    triggerToast("Prêt pour la création d'une nouvelle fiche.", "info");
  };

  const currentAge = calculateAge(patient.Date_Nais_Pat || patient.Date_Nais_Pat);
  const activeFiche = (dbState?.fiches_imc || []).find(f => f.ID_Patient === patient.ID_Patient);
  const numRegistre = activeFiche?.Num_Registre || "Non généré / Not generated";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" id="imc-patient-modal">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col my-8 max-h-[90vh]">
        
        {/* EN-TÊTE MODAL */}
        <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1b3d4f] text-sm uppercase tracking-wider">
                Dossier Enfant IMC — {patient.Nom_Patient} {patient.Prenom_Patient || ''}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold font-mono">
                REGISTRE N°: {numRegistre} • ÂGE: {currentAge}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle FR/EN */}
            <button
              onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1b3d4f] hover:bg-[#306568] text-white font-extrabold text-[10px] uppercase rounded-xl transition duration-150 shadow-3xs"
            >
              <Globe className="w-3.5 h-3.5 text-rose-300" />
              <span>{lang === 'FR' ? 'English (EN)' : 'Français (FR)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ONGLETS DE NAVIGATION (4 ONGLETS) */}
        <div className="flex border-b border-slate-150 bg-slate-50/50 no-print overflow-x-auto">
          <button
            onClick={() => setActiveTab('fiche')}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'fiche' 
                ? 'border-rose-500 text-rose-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'FR' ? "1. FICHE D'ÉVALUATION PÉDIATRIQUE" : "1. PEDIATRIC EVALUATION SHEET"}</span>
          </button>

          <button
            onClick={() => setActiveTab('planning')}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'planning' 
                ? 'border-rose-500 text-rose-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{lang === 'FR' ? "2. PLANNING PRÉVISIONNEL" : "2. PRELIMINARY SCHEDULE"}</span>
          </button>

          <button
            onClick={() => setActiveTab('abonnements')}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'abonnements' 
                ? 'border-rose-500 text-rose-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === 'FR' ? "3. SES ABONNEMENTS" : "3. SUBSCRIPTIONS"}</span>
          </button>

          <button
            onClick={() => setActiveTab('historique')}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'historique' 
                ? 'border-rose-500 text-rose-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'FR' ? "4. HISTORIQUE ACTES" : "4. SESSION HISTORY"}</span>
          </button>

          <button
            onClick={() => setActiveTab('orientation')}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'orientation' 
                ? 'border-indigo-500 text-indigo-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{lang === 'FR' ? "5. ORIENTATION" : "5. ORIENTATION"}</span>
          </button>
        </div>

        {/* CORPS DU MODAL */}
        <div className="flex-1 overflow-y-auto p-6" id="modal-print-container">
          {activeTab === 'fiche' ? (
            <div className="space-y-6">
              
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

              {/* FICHE PORTRAIT IMPRIMABLE (95% FIDÉLITÉ PAPIER) */}
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
                          const fallback = document.getElementById('kacel-imc-logo-fallback-modal');
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <div id="kacel-imc-logo-fallback-modal" className="hidden flex-shrink-0">
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
                        Cité du 01 Novembre<br />
                        Ouled Moussa - BOUMERDÈS<br />
                        Tél : 024725996 / 0561900739
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
                        <option value="">-- Sélectionner un médecin --</option>
                        {((dbState?.utilisateurs || []).filter(u => {
                          const r = (u.Role || '').toLowerCase();
                          return r.includes('medecin') || r.includes('médecin') || r.includes('doctor');
                        })).map(u => {
                          const rawName = u.Nom_Utilisateur || `${u.Nom || ''} ${u.Prenom || ''}`.trim() || u.Login;
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                        NOM / NAME &amp; PRÉNOM / FIRST NAME
                      </span>
                      <span className="block text-slate-800 font-black text-xs py-0.5 border-b border-slate-200">
                        {patient.Nom_Patient} {patient.Prenom_Patient || ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          DATE DE NAISSANCE / DOB
                        </span>
                        <span className="block text-slate-800 font-bold text-xs py-0.5 border-b border-slate-200">
                          {patient.Date_Nais_Pat || 'N/A'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          ÂGE / AGE
                        </span>
                        <span className="block text-rose-700 font-bold text-xs py-0.5 border-b border-slate-200">
                          {currentAge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                        VILLE / CITY
                      </span>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                        TÉLÉPHONE / MOBILE
                      </span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                        DATE D'ÉVALUATION / EVALUATION DATE
                      </span>
                      <input
                        type="date"
                        value={consultationDate}
                        onChange={(e) => setConsultationDate(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs cursor-pointer font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                      DIAGNOSTIC / DIAGNOSIS
                    </span>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={1}
                      placeholder="..."
                      className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs resize-y"
                    />
                  </div>
                </div>

                {/* SECTION A — ANTECEDENTS NATAUX & NEONATAUX */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
                    <span>A — ANTÉCÉDENTS NATAUX &amp; NÉONATAUX</span>
                    <span>BIRTH &amp; NEONATAL HISTORY</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold block text-[10px]">
                          {lang === 'FR' ? "Durée de grossesse" : "Pregnancy duration"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={pregnancyDuration}
                            onChange={(e) => setPregnancyDuration(e.target.value)}
                            placeholder="Ex: 38"
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 pr-24 focus:outline-none focus:border-rose-500 text-xs"
                          />
                          <span className="absolute right-0 top-0 text-[9px] font-bold text-slate-400 uppercase">semaines/weeks</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold block text-[10px]">
                          {lang === 'FR' ? "Poids de naissance" : "Birth weight"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={birthWeight}
                            onChange={(e) => setBirthWeight(e.target.value)}
                            placeholder="Ex: 3200"
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 pr-12 focus:outline-none focus:border-rose-500 text-xs"
                          />
                          <span className="absolute right-0 top-0 text-[9px] font-bold text-slate-400 uppercase">g</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold block text-[10px]">
                          {lang === 'FR' ? "Accouchement / Labor nature" : "Labor nature"}
                        </label>
                        <select
                          value={laborNature}
                          onChange={(e) => setLaborNature(e.target.value)}
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Voie basse / Vaginal">Voie basse / Vaginal</option>
                          <option value="Césarienne / C-section">Césarienne / C-section</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold block text-[10px]">
                          {lang === 'FR' ? "Maturité néonatale" : "Neonatal maturity"}
                        </label>
                        <select
                          value={neonatalMaturity}
                          onChange={(e) => setNeonatalMaturity(e.target.value)}
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Terme / Term">Terme / Term</option>
                          <option value="Prématuré / Preterm">Prématuré / Preterm</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold block text-[10px]">
                          {lang === 'FR' ? "Période d'incubation" : "Incubation period"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={incubationPeriod}
                            onChange={(e) => setIncubationPeriod(e.target.value)}
                            placeholder="Ex: 5"
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 pr-20 focus:outline-none focus:border-rose-500 text-xs"
                          />
                          <span className="absolute right-0 top-0 text-[9px] font-bold text-slate-400 uppercase">jours/days</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold block text-[10px]">
                          {lang === 'FR' ? "Relations / Consanguinité" : "Relationship"}
                        </label>
                        <input
                          type="text"
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                          placeholder="..."
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50/70 border border-slate-200 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={jaundice}
                          onChange={(e) => setJaundice(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />
                        <span>{lang === 'FR' ? "Ictère / Jaundice" : "Jaundice"}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={cyanosis}
                          onChange={(e) => setCyanosis(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />
                        <span>{lang === 'FR' ? "Cyanose / Cyanosis" : "Cyanosis"}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={hypoxia}
                          onChange={(e) => setHypoxia(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />
                        <span>{lang === 'FR' ? "Hypoxie / Hypoxia" : "Hypoxia"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SECTION B — DEVELOPPEMENT PSYCHOMOTEUR */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
                    <span>B — DÉVELOPPEMENT PSYCHOMOTEUR (ÂGE EN MOIS)</span>
                    <span>PSYCHOMOTOR MILESTONES (AGE IN MONTHS)</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-4 text-center">
                      {[
                        { label: "Contrôle tête / Head control", val: headControlAge, set: setHeadControlAge },
                        { label: "Roulement / Rolling", val: rollingAge, set: setRollingAge },
                        { label: "Quadrupédie / Crawling", val: crawlingAge, set: setCrawlingAge },
                        { label: "Assis / Sitting", val: sittingAge, set: setSittingAge },
                        { label: "Se met assis / Get to sit", val: getToSitAge, set: setGetToSitAge },
                        { label: "Se met debout / Get to stand", val: getToStandAge, set: setGetToStandAge },
                        { label: "Debout / Standing", val: standingAge, set: setStandingAge },
                        { label: "Marche / Walking", val: walkingAge, set: setWalkingAge },
                        { label: "Équilibre / Balance", val: balanceAge, set: setBalanceAge }
                      ].map((item, index) => (
                        <div key={index} className="space-y-1.5 p-2 bg-slate-50 border border-slate-200/50 rounded-lg">
                          <span className="text-[8px] font-extrabold text-slate-500 block uppercase tracking-tight h-10 leading-tight flex items-center justify-center">
                            {item.label}
                          </span>
                          <input
                            type="text"
                            value={item.val}
                            onChange={(e) => item.set(e.target.value)}
                            className="w-full text-center bg-transparent border-b border-slate-300 text-rose-700 font-mono font-bold text-xs py-0.5 focus:outline-none focus:border-rose-500"
                            placeholder="—"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION C — EXAMEN NEUROLOGIQUE & ORTHOPEDIQUE */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-black text-[#1b3d4f] flex justify-between uppercase tracking-wider text-[9px]">
                    <span>C — EXAMEN NEUROLOGIQUE &amp; ORTHOPÉDIQUE</span>
                    <span>NEUROLOGICAL &amp; ORTHOPAEDIC EXAM</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300">
                    
                    {/* COLONNE DE GAUCHE */}
                    <div className="p-4 space-y-4">
                      
                      {/* Tonicité */}
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">TONICITÉ / TONICITY</label>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {['Normotonie', 'Hypotonie', 'Hypertonie'].map(tone => (
                            <button
                              key={tone}
                              onClick={() => setTonicity(tone)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                                tonicity === tone 
                                  ? 'bg-rose-500 border-rose-500 text-white shadow-3xs' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {tone === 'Normotonie' ? 'Normotonie / Normal' : (tone === 'Hypotonie' ? 'Hypotonie / Hypo' : 'Hypertonie / Hyper')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Épilepsie / Convulsions */}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={epilepsy}
                            onChange={(e) => setEpilepsy(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>ÉPILEPSIE / EPILEPSY</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={convulsions}
                            onChange={(e) => setConvulsions(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>CONVULSIONS / CONVULSIONS</span>
                        </label>
                      </div>

                      {/* Mentalité & Cognition */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">MENTALITÉ / MENTALITY</label>
                          <select
                            value={cognition}
                            onChange={(e) => setCognition(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs"
                          >
                            <option value="Normale">Normale / Normal</option>
                            <option value="Retard">Retard / Delayed</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">COGNITION / COGNITION</label>
                          <select
                            value={cognition}
                            onChange={(e) => setCognition(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs"
                          >
                            <option value="Normale">Normale / Normal</option>
                            <option value="Retard">Retard / Delayed</option>
                          </select>
                        </div>
                      </div>

                      {/* Vision & Respiration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">VISION / VISION</label>
                          <select
                            value={vision}
                            onChange={(e) => setVision(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs"
                          >
                            <option value="Normale">Normale / Normal</option>
                            <option value="Altérée">Altérée / Impaired</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">RESPIRATION / BREATHING</label>
                          <select
                            value={breathing}
                            onChange={(e) => setBreathing(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs"
                          >
                            <option value="Normale">Normale / Normal</option>
                            <option value="Difficulté">Difficulté / Distressed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* COLONNE DE DROITE */}
                    <div className="p-4 space-y-4">
                      
                      {/* Capteurs & Nutrition */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">NUTRITION / NUTRITION</label>
                          <select
                            value={nutrition}
                            onChange={(e) => setNutrition(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs"
                          >
                            <option value="Normale">Normale / Normal</option>
                            <option value="Sonde">Sonde / Tube-fed</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold uppercase tracking-tight text-[8px] block">DÉGLUTITION / SWALLOWING</label>
                          <select
                            value={swallowing}
                            onChange={(e) => setSwallowing(e.target.value)}
                            className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs"
                          >
                            <option value="Normale">Normale / Normal</option>
                            <option value="Difficile">Difficile / Difficult</option>
                          </select>
                        </div>
                      </div>

                      {/* Sourire & Autisme */}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={smiling}
                            onChange={(e) => setSmiling(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>SOURIRE / SMILING</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={autism}
                            onChange={(e) => setAutism(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>AUTISME / AUTISM</span>
                        </label>
                      </div>

                      {/* Jouets & Trisomie 21 */}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={playWithToys}
                            onChange={(e) => setPlayWithToys(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>JOUER AVEC JOUETS / PLAY</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                          <input
                            type="checkbox"
                            checked={downSyndrome}
                            onChange={(e) => setDownSyndrome(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>TRISOMIE 21 / DOWN SYNDROME</span>
                        </label>
                      </div>

                      {/* Nervosité */}
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-750">
                        <input
                          type="checkbox"
                          checked={nervousness}
                          onChange={(e) => setNervousness(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />
                        <span>NERVOSITÉ / NERVOUSNESS</span>
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
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          DÉFORMITÉS / DEFORMITIES
                        </span>
                        <input
                          type="text"
                          value={deformities}
                          onChange={(e) => setDeformities(e.target.value)}
                          placeholder="Ex: Lower limbs, Spine..."
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          CHIRURGIE ORTHOPÉDIQUE / ORTHOPAEDIC SURGERY
                        </span>
                        <input
                          type="text"
                          value={orthopaedicSurgery}
                          onChange={(e) => setOrthopaedicSurgery(e.target.value)}
                          placeholder="Ex: Tendo-achillien, Adducteurs..."
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          MÉDICATION / MEDICATION
                        </span>
                        <input
                          type="text"
                          value={currentMedication}
                          onChange={(e) => setCurrentMedication(e.target.value)}
                          placeholder="Traitements en cours..."
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          CONNU DES ÉTRANGERS / FAMILIAR WITH STRANGER
                        </span>
                        <select
                          value={familiarStranger ? 'true' : 'false'}
                          onChange={(e) => setFamiliarStranger(e.target.value === 'true')}
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs cursor-pointer"
                        >
                          <option value="true">Oui / Yes</option>
                          <option value="false">Non / No</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          MONTRE LE GOÛT OU L'AVERSION / SHOW LIKE OR DISLIKE
                        </span>
                        <select
                          value={showLikeDislike ? 'true' : 'false'}
                          onChange={(e) => setShowLikeDislike(e.target.value === 'true')}
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs cursor-pointer"
                        >
                          <option value="true">Oui / Yes</option>
                          <option value="false">Non / No</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          MONTRE LA COLÈRE / SHOW ANGER
                        </span>
                        <select
                          value={showAnger ? 'true' : 'false'}
                          onChange={(e) => setShowAnger(e.target.value === 'true')}
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs cursor-pointer"
                        >
                          <option value="true">Oui / Yes</option>
                          <option value="false">Non / No</option>
                        </select>
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
                          <input
                            type="checkbox"
                            checked={kineTherapy}
                            onChange={(e) => setKineTherapy(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>Kinésithérapie</span>
                        </label>
                        <input
                          type="text"
                          value={kineDuration}
                          onChange={(e) => setKineDuration(e.target.value)}
                          placeholder="Durée/Duration"
                          disabled={!kineTherapy}
                          className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={psychoTherapy}
                            onChange={(e) => setPsychoTherapy(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>Psychomotricité</span>
                        </label>
                        <input
                          type="text"
                          value={psychoDuration}
                          onChange={(e) => setPsychoDuration(e.target.value)}
                          placeholder="Durée/Duration"
                          disabled={!psychoTherapy}
                          className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={orthoTherapy}
                            onChange={(e) => setOrthoTherapy(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>Orthophonie</span>
                        </label>
                        <input
                          type="text"
                          value={orthoDuration}
                          onChange={(e) => setOrthoDuration(e.target.value)}
                          placeholder="Durée/Duration"
                          disabled={!orthoTherapy}
                          className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={ergoTherapy}
                            onChange={(e) => setErgoTherapy(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300 cursor-pointer"
                          />
                          <span>Ergothérapie</span>
                        </label>
                        <input
                          type="text"
                          value={ergoDuration}
                          onChange={(e) => setErgoDuration(e.target.value)}
                          placeholder="Durée/Duration"
                          disabled={!ergoTherapy}
                          className="w-full bg-transparent border-b border-slate-200 text-slate-800 font-bold py-0.5 focus:outline-none text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          AUTRE / OTHER
                        </span>
                        <input
                          type="text"
                          value={otherTherapy}
                          onChange={(e) => setOtherTherapy(e.target.value)}
                          placeholder="Autres thérapies prescrites..."
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          NOMBRE DE SÉANCES / NUMBER OF SESSIONS
                        </span>
                        <input
                          type="number"
                          value={numberOfSessions}
                          onChange={(e) => setNumberOfSessions(e.target.value)}
                          placeholder="Ex: 20"
                          className="w-full bg-transparent border-b border-slate-300 text-rose-750 font-mono font-bold py-0.5 focus:outline-none focus:border-rose-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          FRÉQUENCE HEBDOMADAIRE / WEEKLY FREQUENCY
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            value={frequencyPerWeek}
                            onChange={(e) => setFrequencyPerWeek(e.target.value)}
                            placeholder="Ex: 3"
                            className="w-full bg-transparent border-b border-slate-300 text-rose-750 font-mono font-bold py-0.5 pr-32 focus:outline-none focus:border-rose-500 text-xs"
                          />
                          <span className="absolute right-0 top-0 text-[9px] font-bold text-slate-400 uppercase">par semaine/per week</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                        OBSERVATIONS / OBSERVATIONS
                      </span>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={3}
                        placeholder="..."
                        className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-medium py-1 focus:outline-none focus:border-rose-500 text-xs resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          SIGNATURE DU PRATICIEN / PRACTITIONER SIGNATURE
                        </span>
                        <input
                          type="text"
                          value={practitionerSignature}
                          onChange={(e) => setPractitionerSignature(e.target.value)}
                          placeholder="Signature du médecin..."
                          className="w-full bg-transparent border-b border-slate-300 text-slate-800 font-bold py-0.5 focus:outline-none text-xs italic font-serif"
                        />
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px]">
                          DATE / DATE
                        </span>
                        <span className="block text-slate-800 font-bold text-xs py-0.5">
                          {new Date(consultationDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* BOUTONS EN BAS DE LA FICHE */}
              <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl mt-6 no-print">
                <div className="flex items-center gap-2">
                  {actualReadOnly ? (
                    <>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">Lecture Seule / Consultation</span>
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Auto-save actif</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!actualReadOnly && (
                    <button
                      onClick={() => handleSaveFiche(false)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase rounded-xl transition duration-150 shadow-sm cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{lang === 'FR' ? "Enregistrer" : "Save"}</span>
                    </button>
                  )}

                  <button
                    onClick={handlePrintFiche}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition duration-150 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{lang === 'FR' ? "Imprimer PDF" : "Print PDF"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!actualReadOnly) {
                        handleSaveFiche(true);
                      }
                      setActiveTab('planning');
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase rounded-xl transition duration-150 shadow-sm cursor-pointer"
                  >
                    <span>{lang === 'FR' ? "Passer au planning prévisionnel" : "Go to Preliminary Schedule"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : activeTab === 'planning' ? (
            
            /* INTERFACE PLANNING PRÉVISIONNEL */
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[#1b3d4f] text-sm">
                    {patient.Nom_Patient} {patient.Prenom_Patient || ''}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Registre N° : <span className="font-mono text-rose-700">{numRegistre}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-tight">
                    {lang === 'FR' ? "PRESCRIPTION MÉDICALE DU MÉDECIN" : "DOCTOR'S MEDICAL PRESCRIPTION"}
                  </span>
                  <span className="text-xs font-black text-[#1b3d4f]">
                    {numberOfSessions ? `${numberOfSessions} ${lang === 'FR' ? 'séances' : 'sessions'}` : (lang === 'FR' ? 'Non définie' : 'Not defined')} • {frequencyPerWeek ? `${frequencyPerWeek} ${lang === 'FR' ? 'séances/semaine' : 'sessions/week'}` : (lang === 'FR' ? 'Non définie' : 'Not defined')}
                  </span>
                </div>
              </div>

              {/* RENSEIGNEMENTS DU PLANNING PRÉVISIONNEL */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-6">
                
                {/* Pack d'heures prescrit */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    {lang === 'FR' ? "PACK D'HEURES PRESCRIT" : "PRESCRIBED HOUR PACK"} :
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
                        <span className="text-xs block">{pack === 'Autre' && lang === 'FR' ? 'Autre / Other' : pack}</span>
                      </button>
                    ))}
                  </div>

                  {packHeuresPrescrit === 'Autre' && (
                    <div className="mt-3 max-w-xs motion-safe:animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {lang === 'FR' ? "Spécifier le pack d'heures" : "Specify hour pack"}
                      </label>
                      <input
                        type="text"
                        value={customPackHeures}
                        onChange={(e) => setCustomPackHeures(e.target.value)}
                        placeholder="Ex: 200h, 80h..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}
                </div>

                {/* PLANNING & SÉANCES */}
                <div className="space-y-4 pt-4 border-t border-slate-150">
                  <h5 className="font-extrabold text-[#1b3d4f] text-xs uppercase tracking-wider">
                    {lang === 'FR' ? "PLANNING PRÉVISIONNEL" : "PRELIMINARY SCHEDULE"}
                  </h5>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      {lang === 'FR' ? "Jours de séances prévisionnels" : "Preliminary session days"} :
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Sam', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(day => {
                        const isFriday = day === 'Ven';
                        const isSelected = planningDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isFriday}
                            onClick={() => {
                              if (isFriday) return;
                              setPlanningDays(prev => 
                                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                              );
                            }}
                            className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                              isFriday
                                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                                : isSelected 
                                  ? 'bg-rose-500 border-rose-500 text-white shadow-3xs font-black' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                            title={isFriday ? "Vendredi est jour de fermeture" : ""}
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
                        {lang === 'FR' ? "Heure de début prévisionnelle" : "Preliminary start time"}
                      </label>
                      <input
                        type="time"
                        value={planningTime}
                        onChange={(e) => setPlanningTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* FOOTER AVEC RETOUR ET ENREGISTREMENT */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('fiche')}
                  className="px-5 py-2.5 border border-slate-250 hover:bg-slate-100 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition duration-150 cursor-pointer"
                >
                  {lang === 'FR' ? "Retour à la fiche" : "Back to Sheet"}
                </button>

                <div className="flex-1 max-w-md">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-rose-400 pl-3">
                    {lang === 'FR' 
                      ? "Cette fiche contient les prévisions médicales dictées par le médecin. Le paiement et l'abonnement commercial seront traités dans une étape séparée par l'assistante."
                      : "This form contains the medical forecasts dictated by the doctor. Payment and commercial subscription will be processed in a separate step by the assistant."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!actualReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleSaveFiche(false)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase rounded-xl transition duration-150 shadow-sm cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{lang === 'FR' ? "Enregistrer les prévisions" : "Save Forecasts"}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : activeTab === 'abonnements' ? (

            /* INTERFACE ONGLET 3 — SES ABONNEMENTS */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[#1b3d4f] text-sm">
                    Abonnements de {patient.Nom_Patient} {patient.Prenom_Patient || ''}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Registre N° : <span className="font-mono text-rose-700">{numRegistre}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-700">
                    Total : {((dbState?.abonnements || []).filter(a => Number(a.ID_Patient) === Number(patient.ID_Patient))).length} abonnement(s)
                  </span>
                </div>
              </div>

              {((dbState?.abonnements || []).filter(a => Number(a.ID_Patient) === Number(patient.ID_Patient))).length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 space-y-3">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-sm">Aucun abonnement enregistré pour ce patient.</p>
                  <p className="text-xs text-slate-400">Les abonnements sont souscrits par l'assistante au niveau de la caisse ou de la gestion abonnement.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {((dbState?.abonnements || []).filter(a => Number(a.ID_Patient) === Number(patient.ID_Patient))).map(abn => {
                    const packObj = (dbState?.packs || []).find(p => Number(p.ID_Pack) === Number(abn.ID_Pack));
                    const versements = (dbState?.versements || []).filter(v => Number(v.ID_Abn) === Number(abn.ID_Abn));
                    const totalPaye = versements.reduce((sum, v) => sum + (Number(v.Mont_Vers) || 0), 0);
                    const prixTotal = Number(abn.Prix_Total) || Number(packObj?.Prix_Pack) || 0;
                    const reste = Math.max(0, prixTotal - totalPaye);

                    return (
                      <div key={abn.ID_Abn} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-black text-[#1b3d4f] text-sm">
                                {packObj?.Libelle_Pack || `Abonnement N° ${abn.ID_Abn}`}
                              </h5>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Du <span className="font-bold text-slate-700">{abn.Date_Debut || 'N/A'}</span> au <span className="font-bold text-slate-700">{abn.Date_Fin || 'N/A'}</span>
                              </p>
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            abn.Etat === 'Actif' ? 'bg-emerald-100 text-emerald-800' :
                            abn.Etat === 'Gelé' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {abn.Etat || 'Actif'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Prix Total</span>
                            <span className="font-black text-slate-800">{prixTotal.toLocaleString()} DZD</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Versé</span>
                            <span className="font-black text-emerald-600">{totalPaye.toLocaleString()} DZD</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Reste</span>
                            <span className={`font-black ${reste > 0 ? 'text-rose-600' : 'text-slate-600'}`}>{reste.toLocaleString()} DZD</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Créé le</span>
                            <span className="font-bold text-slate-700">{abn.Date_Abn || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'orientation' ? (

            /* INTERFACE ONGLET 5 — ORIENTATION */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[#1b3d4f] text-sm">
                    Orientation de {patient.Nom_Patient} {patient.Prenom_Patient || ''}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Registre N° : <span className="font-mono text-rose-700">{numRegistre}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <OrientationTab
                  data={orientationData}
                  onChange={setOrientationData}
                  translucentWhite={true}
                />
              </div>

              {!actualReadOnly && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveOrientation}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase rounded-xl transition duration-150 shadow-sm cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{lang === 'FR' ? "Enregistrer l'orientation" : "Save Orientation"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (

            /* INTERFACE ONGLET 4 — HISTORIQUE ACTES / SÉANCES */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[#1b3d4f] text-sm">
                    Historique des séances de {patient.Nom_Patient} {patient.Prenom_Patient || ''}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Registre N° : <span className="font-mono text-rose-700">{numRegistre}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-700">
                    {((dbState?.rendezVous || []).filter(r => Number(r.ID_Patient) === Number(patient.ID_Patient))).length} séance(s)
                  </span>
                </div>
              </div>

              {((dbState?.rendezVous || []).filter(r => Number(r.ID_Patient) === Number(patient.ID_Patient))).length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 space-y-3">
                  <Clock className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-sm">Aucun acte / rendez-vous enregistré.</p>
                  <p className="text-xs text-slate-400">Les séances planifiées et réalisées apparaîtront automatiquement ici.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-black text-[10px]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Horaire</th>
                        <th className="py-3 px-4">Acte / Service</th>
                        <th className="py-3 px-4">Praticien</th>
                        <th className="py-3 px-4 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((dbState?.rendezVous || []).filter(r => Number(r.ID_Patient) === Number(patient.ID_Patient)))
                        .sort((a, b) => (b.Date_RDV || '').localeCompare(a.Date_RDV || ''))
                        .map(rdv => {
                          const acteObj = (dbState?.actes || []).find(ac => Number(ac.ID_Acte) === Number(rdv.ID_Acte));
                          const pratObj = (dbState?.praticiens || []).find(pr => Number(pr.ID_Prat) === Number(rdv.ID_Prat));

                          return (
                            <tr key={rdv.ID_RDV} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-bold text-slate-800">{rdv.Date_RDV || 'N/A'}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-600">
                                {rdv.H_Debut_RDV || '--:--'} - {rdv.H_Fin_RDV || '--:--'}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#1b3d4f]">
                                {acteObj?.Libelle_Acte || 'Séance Rééducation / Balnéo'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-700">
                                {pratObj?.Nom_Prat ? `Dr. ${pratObj.Nom_Prat}` : 'Non assigné'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  rdv.Statut_RDV === 'Honoré' ? 'bg-emerald-100 text-emerald-800' :
                                  rdv.Statut_RDV === 'Planifié' ? 'bg-sky-100 text-sky-800' :
                                  rdv.Statut_RDV === 'Annulé' ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {rdv.Statut_RDV || 'Planifié'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* STYLES SPÉCIFIQUES POUR L'IMPRESSION PROPRE DU DOCUMENT A4 SANS CHOSES INUTILES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #modal-print-container, #modal-print-container .print-sheet, #modal-print-container .print-sheet * {
            visibility: visible;
          }
          #modal-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible;
            padding: 0;
            margin: 0;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .print-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          input, textarea, select {
            border: none !important;
            border-bottom: 1px solid #94a3b8 !important;
            background: transparent !important;
            padding: 0 !important;
            margin-bottom: 2px !important;
          }
          input[type="checkbox"] {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
