import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Printer, Plus, Save, Clock, FileText, Globe, Stethoscope,
  Activity, CheckSquare, Square, Calendar, User, ChevronRight, AlertCircle, Check, Trash2
} from 'lucide-react';
import { DatabaseState, Patient, Utilisateur, DossierMedicalMPRRecord, ProgrammeMPR } from '../dbStore';

interface DossierMedicalMPRProps {
  dbState: DatabaseState;
  onSave: (newState: DatabaseState) => void;
  patient: Patient;
  triggerToast: (msg: string, type: "success" | "info" | "error") => void;
  currentUser?: Utilisateur;
  canEditMedical?: boolean;
}

export const DEFAULT_PROGRAMMES_MPR: ProgrammeMPR[] = [
  {
    ID_Programme: "prog-1",
    Nom_Programme: "Programme de réhabilitation post-AVC",
    Description: "Réhabilitation post-Accident Vasculaire Cérébral",
    Items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-2",
    Nom_Programme: "Rééducation rachis lombaire",
    Description: "Lombalgies, hernies discales, rachialgies",
    Items: [1, 2, 3, 5, 6, 8, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-3",
    Nom_Programme: "Rééducation genou post-op",
    Description: "Suites de prothèse ou ligamentoplastie du genou",
    Items: [1, 2, 3, 5, 8, 9, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-4",
    Nom_Programme: "Rééducation épaule",
    Description: "Tendinopathies, coiffe des rotateurs, capsulite",
    Items: [1, 2, 3, 5, 7, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-5",
    Nom_Programme: "Rééducation hanche",
    Description: "Prothèse totale de hanche, coxarthrose",
    Items: [1, 2, 3, 5, 8, 9, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-6",
    Nom_Programme: "Rééducation cheville / entorse",
    Description: "Instabilités, entorses, réadaptation",
    Items: [1, 3, 5, 8, 9, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-7",
    Nom_Programme: "Paraplégie / Paraparésie",
    Description: "Prise en charge neuro-motrice médullaire",
    Items: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-8",
    Nom_Programme: "Hémiplégie / Hémiparésie",
    Description: "Restauration fonctionnelle hémi-corporelle",
    Items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-9",
    Nom_Programme: "Traumatisme crânien",
    Description: "Rééducation neurolocomotrice globale",
    Items: [1, 2, 3, 5, 7, 8, 9, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-10",
    Nom_Programme: "Sclérose en plaques (SEP)",
    Description: "Entretien fonctionnel et lutte contre la fatigabilité",
    Items: [1, 2, 3, 5, 8, 9, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-11",
    Nom_Programme: "Maladie de Parkinson",
    Description: "Travail postural, équilibre, marche et rythme",
    Items: [1, 3, 5, 8, 9, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-12",
    Nom_Programme: "Spondylarthrite ankylosante",
    Description: "Assouplissement et entretien rachidien/thoracique",
    Items: [1, 2, 3, 6, 8, 10, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  },
  {
    ID_Programme: "prog-13",
    Nom_Programme: "Gonarthrose / Coxarthrose",
    Description: "Décharge, renforcement et entretien articulaire",
    Items: [1, 2, 3, 5, 8, 9, 11],
    Date_Creation: "21/07/2026",
    Actif: true
  }
];

const CHECKBOX_ITEMS_FR = [
  "1. Entretien articulaire et musculaire global",
  "2. Massage préparatoire des MI, tens et IR si nécessaire",
  "3. Assouplissements articulaires selon possibilité",
  "4. Électrostimulation des muscles clés de la marche",
  "5. Renforcement des muscles distaux des 02 MI",
  "6. Étirements des muscles spastiques",
  "7. Renforcement des muscles parétiques et côté controlatéral MS/MI",
  "8. Travail de l'équilibre debout",
  "9. Travail de la marche",
  "10. Éducation thérapeutique",
  "11. Contrôle à la fin des séances"
];

const CHECKBOX_ITEMS_EN = [
  "1. Overall joint and muscle maintenance",
  "2. Preparatory massage of lower limbs, TENS and IR if necessary",
  "3. Joint stretching according to possibility",
  "4. Electrostimulation of key walking muscles",
  "5. Strengthening distal muscles of both lower limbs",
  "6. Stretching spastic muscles",
  "7. Strengthening paretic muscles and contralateral UL/LL",
  "8. Standing balance training",
  "9. Gait and walking training",
  "10. Therapeutic education",
  "11. Final check-up at the end of sessions"
];

export const DossierMedicalMPR: React.FC<DossierMedicalMPRProps> = ({
  dbState,
  onSave,
  patient,
  triggerToast,
  currentUser,
  canEditMedical = true,
}) => {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');

  // List of active programmes
  const programmesList = useMemo(() => {
    if (dbState?.programmesMPR && dbState.programmesMPR.length > 0) {
      return dbState.programmesMPR;
    }
    return DEFAULT_PROGRAMMES_MPR;
  }, [dbState?.programmesMPR]);

  // All dossiers for this patient
  const patientDossiers = useMemo(() => {
    const list = (dbState?.dossiers_mpr || []).filter(
      (d) => Number(d.ID_Patient) === Number(patient.ID_Patient)
    );
    return list.sort((a, b) => b.created_at - a.created_at);
  }, [dbState?.dossiers_mpr, patient.ID_Patient]);

  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(() => {
    return patientDossiers.length > 0 ? patientDossiers[0].id : null;
  });

  // Keep selectedDossierId updated if list changes and current selection invalid
  useEffect(() => {
    if (selectedDossierId) {
      const exists = patientDossiers.some((d) => d.id === selectedDossierId);
      if (!exists && patientDossiers.length > 0) {
        setSelectedDossierId(patientDossiers[0].id);
      }
    } else if (patientDossiers.length > 0) {
      setSelectedDossierId(patientDossiers[0].id);
    }
  }, [patientDossiers, selectedDossierId]);

  const currentRecord = useMemo(() => {
    return patientDossiers.find((d) => d.id === selectedDossierId) || null;
  }, [patientDossiers, selectedDossierId]);

  const isLatest = useMemo(() => {
    if (!currentRecord || patientDossiers.length === 0) return true;
    return currentRecord.id === patientDossiers[0].id;
  }, [currentRecord, patientDossiers]);

  const actualReadOnly = !canEditMedical || !isLatest;

  // Form states
  const [dateDossier, setDateDossier] = useState<string>(() => {
    return currentRecord?.date_dossier || new Date().toISOString().split('T')[0];
  });
  const [mcd, setMcd] = useState<string>(currentRecord?.mcd || '');
  const [irmCerebrale, setIrmCerebrale] = useState<string>(currentRecord?.irm_cerebrale || '');
  const [antecedents, setAntecedents] = useState<string>(
    currentRecord?.bct !== undefined ? (patient.antecedents || '') : (patient.antecedents || '')
  );

  // Examen clinique
  const [bct, setBct] = useState<string>(currentRecord?.bct || '');
  const [bo, setBo] = useState<string>(currentRecord?.bo || '');
  const [genouxFlexion, setGenouxFlexion] = useState<string | number>(currentRecord?.genoux_flexion || '');
  const [anteversionBassin, setAnteversionBassin] = useState<"Oui" | "Non" | "À évaluer" | "">(
    currentRecord?.anteversion_bassin || ''
  );
  const [bnmMiMin, setBnmMiMin] = useState<string>(currentRecord?.bnm_mi_min || '');
  const [bnmMiMax, setBnmMiMax] = useState<string>(currentRecord?.bnm_mi_max || '');
  const [bfMarche, setBfMarche] = useState<"sans_aide" | "avec_aide" | "fauteuil" | "non_evalue" | "">(
    currentRecord?.bf_marche || ''
  );
  const [autresObservations, setAutresObservations] = useState<string>(currentRecord?.autres_observations || '');

  // Programme Thérapeutique
  const [kineSeancesCount, setKineSeancesCount] = useState<string | number>(currentRecord?.kine_seances_count || '');
  const [kineSeancesFreq, setKineSeancesFreq] = useState<string | number>(currentRecord?.kine_seances_freq || '');
  const [balneoSeancesCount, setBalneoSeancesCount] = useState<string | number>(currentRecord?.balneo_seances_count || '');
  const [balneoSeancesFreq, setBalneoSeancesFreq] = useState<string | number>(currentRecord?.balneo_seances_freq || '');
  const [dureeSeanceHeures, setDureeSeanceHeures] = useState<string | number>(currentRecord?.duree_seance_heures || '1');
  const [frequenceJoursSemaine, setFrequenceJoursSemaine] = useState<string | number>(currentRecord?.frequence_jours_semaine || '');
  const [objectifs, setObjectifs] = useState<string>(currentRecord?.objectifs || '');

  // Détail des séances & Reusable Programmes
  const [programme, setProgramme] = useState<string>(currentRecord?.programme || '');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(String(currentRecord?.programme_id || ''));
  const [checkboxes, setCheckboxes] = useState<Record<number, boolean>>(() => {
    return currentRecord?.checkboxes || {};
  });
  const [customItems, setCustomItems] = useState<string[]>(() => {
    return currentRecord?.custom_items || [];
  });
  const [observationsComplementaires, setObservationsComplementaires] = useState<string>(
    currentRecord?.observations_complementaires || ''
  );

  // New programme modal state
  const [showNewProgModal, setShowNewProgModal] = useState<boolean>(false);
  const [newProgName, setNewProgName] = useState<string>('');
  const [newProgDesc, setNewProgDesc] = useState<string>('');
  const [newProgChecks, setNewProgChecks] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true
  });

  // Adding custom seance line inline state
  const [isAddingCustomItem, setIsAddingCustomItem] = useState<boolean>(false);
  const [newCustomItemText, setNewCustomItemText] = useState<string>('');

  // Signatures
  const [medecinPrescripteur, setMedecinPrescripteur] = useState<string>(currentRecord?.medecin_prescripteur || '');
  const [dateSignatureMedecin, setDateSignatureMedecin] = useState<string>(
    currentRecord?.date_signature_medecin || new Date().toISOString().split('T')[0]
  );
  const [kinesitherapeute, setKinesitherapeute] = useState<string>(currentRecord?.kinesitherapeute || '');
  const [dateSignatureKine, setDateSignatureKine] = useState<string>(
    currentRecord?.date_signature_kine || new Date().toISOString().split('T')[0]
  );

  // Sync state when selected record changes
  useEffect(() => {
    if (currentRecord) {
      setDateDossier(currentRecord.date_dossier || new Date().toISOString().split('T')[0]);
      setMcd(currentRecord.mcd || '');
      setIrmCerebrale(currentRecord.irm_cerebrale || '');
      setBct(currentRecord.bct || '');
      setBo(currentRecord.bo || '');
      setGenouxFlexion(currentRecord.genoux_flexion ?? '');
      setAnteversionBassin(currentRecord.anteversion_bassin || '');
      setBnmMiMin(currentRecord.bnm_mi_min || '');
      setBnmMiMax(currentRecord.bnm_mi_max || '');
      setBfMarche(currentRecord.bf_marche || '');
      setAutresObservations(currentRecord.autres_observations || '');
      setKineSeancesCount(currentRecord.kine_seances_count ?? '');
      setKineSeancesFreq(currentRecord.kine_seances_freq ?? '');
      setBalneoSeancesCount(currentRecord.balneo_seances_count ?? '');
      setBalneoSeancesFreq(currentRecord.balneo_seances_freq ?? '');
      setDureeSeanceHeures(currentRecord.duree_seance_heures ?? '1');
      setFrequenceJoursSemaine(currentRecord.frequence_jours_semaine ?? '');
      setObjectifs(currentRecord.objectifs || '');
      setProgramme(currentRecord.programme || '');
      setSelectedProgrammeId(String(currentRecord.programme_id || ''));
      setCheckboxes(currentRecord.checkboxes || {});
      setCustomItems(currentRecord.custom_items || []);
      setObservationsComplementaires(currentRecord.observations_complementaires || '');
      setMedecinPrescripteur(currentRecord.medecin_prescripteur || '');
      setDateSignatureMedecin(currentRecord.date_signature_medecin || new Date().toISOString().split('T')[0]);
      setKinesitherapeute(currentRecord.kinesitherapeute || '');
      setDateSignatureKine(currentRecord.date_signature_kine || new Date().toISOString().split('T')[0]);
    }
  }, [currentRecord]);

  // Track modifications for auto-save
  const isDirtyRef = useRef<boolean>(false);

  const markDirty = () => {
    isDirtyRef.current = true;
  };

  // Full list of checkboxes including custom items
  const fullCheckboxList = useMemo(() => {
    const baseList = lang === 'FR' ? CHECKBOX_ITEMS_FR : CHECKBOX_ITEMS_EN;
    if (!customItems || customItems.length === 0) return baseList;
    return [...baseList, ...customItems];
  }, [lang, customItems]);

  // Select a preset programme
  const handleSelectProgramme = (progId: string) => {
    setSelectedProgrammeId(progId);
    if (!progId) return;

    const found = programmesList.find((p) => String(p.ID_Programme) === String(progId));
    if (found) {
      setProgramme(found.Nom_Programme);
      const newChecks: Record<number, boolean> = {};
      (found.Items || []).forEach((num) => {
        newChecks[num] = true;
      });
      setCheckboxes(newChecks);
      if (found.CustomItems && found.CustomItems.length > 0) {
        setCustomItems(found.CustomItems);
      }
      markDirty();
    }
  };

  // Create new programme
  const handleCreateNewProgramme = () => {
    if (!newProgName.trim()) {
      triggerToast(lang === 'FR' ? "Veuillez saisir un nom de programme" : "Please enter a program name", "error");
      return;
    }

    const activeNums = Object.entries(newProgChecks)
      .filter(([_, checked]) => checked)
      .map(([num]) => Number(num));

    const newProg: ProgrammeMPR = {
      ID_Programme: `prog-${Date.now()}`,
      Nom_Programme: newProgName.trim(),
      Description: newProgDesc.trim(),
      Items: activeNums.length > 0 ? activeNums : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      Date_Creation: new Date().toLocaleDateString('fr-FR'),
      Actif: true,
    };

    const currentProgs = dbState?.programmesMPR && dbState.programmesMPR.length > 0
      ? [...dbState.programmesMPR]
      : [...DEFAULT_PROGRAMMES_MPR];

    const updatedProgs = [newProg, ...currentProgs];

    onSave({
      ...dbState,
      programmesMPR: updatedProgs,
      lastUpdated: Date.now(),
    });

    setSelectedProgrammeId(String(newProg.ID_Programme));
    setProgramme(newProg.Nom_Programme);

    const newChecks: Record<number, boolean> = {};
    newProg.Items.forEach((n) => { newChecks[n] = true; });
    setCheckboxes(newChecks);

    setShowNewProgModal(false);
    setNewProgName('');
    setNewProgDesc('');
    setNewProgChecks({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true });
    markDirty();

    triggerToast(
      lang === 'FR' ? "Nouveau programme enregistré et disponible pour toutes les fiches !" : "New program saved and available for all records!",
      "success"
    );
  };

  // Update existing programme in dbState
  const handleUpdateExistingProgramme = () => {
    if (!selectedProgrammeId) return;

    const currentProgs = dbState?.programmesMPR && dbState.programmesMPR.length > 0
      ? [...dbState.programmesMPR]
      : [...DEFAULT_PROGRAMMES_MPR];

    const activeNums = Object.entries(checkboxes)
      .filter(([_, checked]) => checked)
      .map(([num]) => Number(num));

    const idx = currentProgs.findIndex((p) => String(p.ID_Programme) === String(selectedProgrammeId));
    if (idx >= 0) {
      currentProgs[idx] = {
        ...currentProgs[idx],
        Nom_Programme: programme || currentProgs[idx].Nom_Programme,
        Items: activeNums,
        CustomItems: customItems,
      };

      onSave({
        ...dbState,
        programmesMPR: currentProgs,
        lastUpdated: Date.now(),
      });

      triggerToast(
        lang === 'FR' ? "Programme mis à jour pour toutes les futures fiches !" : "Program updated for all future records!",
        "success"
      );
    }
  };

  // Delete programme from dbState
  const handleDeleteProgramme = () => {
    if (!selectedProgrammeId) return;
    if (!window.confirm(lang === 'FR' ? "Voulez-vous vraiment supprimer ce programme de la liste ?" : "Are you sure you want to delete this program?")) {
      return;
    }

    const currentProgs = dbState?.programmesMPR && dbState.programmesMPR.length > 0
      ? [...dbState.programmesMPR]
      : [...DEFAULT_PROGRAMMES_MPR];

    const updated = currentProgs.filter((p) => String(p.ID_Programme) !== String(selectedProgrammeId));

    onSave({
      ...dbState,
      programmesMPR: updated,
      lastUpdated: Date.now(),
    });

    setSelectedProgrammeId('');
    triggerToast(lang === 'FR' ? "Programme supprimé de la liste" : "Program deleted from list", "info");
  };

  // Add custom seance line
  const handleAddCustomItem = () => {
    if (!newCustomItemText.trim()) return;
    const itemText = `${fullCheckboxList.length + 1}. ${newCustomItemText.trim().replace(/^\d+\.\s*/, '')}`;
    const nextIndex = fullCheckboxList.length + 1;

    setCustomItems((prev) => [...prev, itemText]);
    setCheckboxes((prev) => ({ ...prev, [nextIndex]: true }));
    setNewCustomItemText('');
    setIsAddingCustomItem(false);
    markDirty();
  };

  // Save logic
  const handleSaveDossier = (silent: boolean = false) => {
    const existingDossiers = [...(dbState?.dossiers_mpr || [])];
    const recId = currentRecord?.id || `mpr-${patient.ID_Patient}-${Date.now()}`;

    const recordToSave: DossierMedicalMPRRecord = {
      id: recId,
      ID_Patient: patient.ID_Patient,
      date_dossier: dateDossier,
      created_at: currentRecord?.created_at || Date.now(),
      created_by: currentRecord?.created_by || currentUser?.Nom_Utilisateur || 'Utilisateur',
      mcd,
      irm_cerebrale: irmCerebrale,
      bct,
      bo,
      genoux_flexion: genouxFlexion,
      anteversion_bassin: anteversionBassin,
      bnm_mi_min: bnmMiMin,
      bnm_mi_max: bnmMiMax,
      bf_marche: bfMarche,
      autres_observations: autresObservations,
      kine_seances_count: kineSeancesCount,
      kine_seances_freq: kineSeancesFreq,
      balneo_seances_count: balneoSeancesCount,
      balneo_seances_freq: balneoSeancesFreq,
      duree_seance_heures: dureeSeanceHeures,
      frequence_jours_semaine: frequenceJoursSemaine,
      objectifs,
      programme,
      programme_id: selectedProgrammeId,
      checkboxes,
      custom_items: customItems,
      observations_complementaires: observationsComplementaires,
      medecin_prescripteur: medecinPrescripteur,
      date_signature_medecin: dateSignatureMedecin,
      kinesitherapeute: kinesitherapeute,
      date_signature_kine: dateSignatureKine,
    };

    const idx = existingDossiers.findIndex((d) => d.id === recId);
    if (idx >= 0) {
      existingDossiers[idx] = recordToSave;
    } else {
      existingDossiers.unshift(recordToSave);
    }

    // Save back to dbState
    const newState: DatabaseState = {
      ...dbState,
      dossiers_mpr: existingDossiers,
      lastUpdated: Date.now(),
    };

    // Also update patient antecedents if changed
    if (antecedents && antecedents !== patient.antecedents) {
      newState.patients = (newState.patients || []).map((p) =>
        p.ID_Patient === patient.ID_Patient ? { ...p, antecedents } : p
      );
    }

    onSave(newState);
    setSelectedDossierId(recId);
    isDirtyRef.current = false;

    if (!silent) {
      triggerToast(
        lang === 'FR' ? "Dossier Médical MPR enregistré avec succès !" : "MPR Medical Record saved successfully!",
        "success"
      );
    }
  };

  // Auto-save timer every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirtyRef.current && !actualReadOnly) {
        handleSaveDossier(true);
        triggerToast(lang === 'FR' ? "Dossier auto-sauvegardé" : "Record auto-saved", "info");
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [
    actualReadOnly, dbState, dateDossier, mcd, irmCerebrale, bct, bo, genouxFlexion,
    anteversionBassin, bnmMiMin, bnmMiMax, bfMarche, autresObservations, kineSeancesCount,
    kineSeancesFreq, balneoSeancesCount, balneoSeancesFreq, dureeSeanceHeures,
    frequenceJoursSemaine, objectifs, programme, checkboxes, observationsComplementaires,
    medecinPrescripteur, dateSignatureMedecin, kinesitherapeute, dateSignatureKine, antecedents, lang
  ]);

  // Create new dossier button
  const handleCreateNewDossier = () => {
    const newId = `mpr-${patient.ID_Patient}-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord: DossierMedicalMPRRecord = {
      id: newId,
      ID_Patient: patient.ID_Patient,
      date_dossier: todayStr,
      created_at: Date.now(),
      created_by: currentUser?.Nom_Utilisateur || 'Utilisateur',
      mcd: '',
      irm_cerebrale: '',
      bct: '',
      bo: '',
      genoux_flexion: '',
      anteversion_bassin: '',
      bnm_mi_min: '',
      bnm_mi_max: '',
      bf_marche: '',
      autres_observations: '',
      kine_seances_count: '',
      kine_seances_freq: '',
      balneo_seances_count: '',
      balneo_seances_freq: '',
      duree_seance_heures: '1',
      frequence_jours_semaine: '',
      objectifs: '',
      programme: '',
      checkboxes: {},
      observations_complementaires: '',
      medecin_prescripteur: '',
      date_signature_medecin: todayStr,
      kinesitherapeute: '',
      date_signature_kine: todayStr,
    };

    const updatedList = [newRecord, ...(dbState?.dossiers_mpr || [])];
    onSave({
      ...dbState,
      dossiers_mpr: updatedList,
      lastUpdated: Date.now(),
    });

    setSelectedDossierId(newId);
    triggerToast(
      lang === 'FR' ? "Nouveau dossier créé pour aujourd'hui" : "New record created for today",
      "info"
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const checkboxList = lang === 'FR' ? CHECKBOX_ITEMS_FR : CHECKBOX_ITEMS_EN;

  return (
    <div className="space-y-6">
      {/* PRINT STYLES ISOLATION */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-dossier-mpr, .printable-dossier-mpr * {
            visibility: visible;
          }
          .printable-dossier-mpr {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP BAR: HISTORY, LANGUAGE, PRINT & SAVE */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* HISTORY LIST */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            {lang === 'FR' ? 'Historique dossiers :' : 'Records History:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {patientDossiers.map((doc, idx) => {
              const isSelected = doc.id === selectedDossierId;
              const isFirst = idx === 0;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDossierId(doc.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{doc.date_dossier || 'Date N/R'}</span>
                  {isFirst && (
                    <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-black uppercase">
                      {lang === 'FR' ? 'Actuel' : 'Current'}
                    </span>
                  )}
                </button>
              );
            })}

            {canEditMedical && (
              <button
                type="button"
                onClick={handleCreateNewDossier}
                className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? '+ NOUVEAU DOSSIER' : '+ NEW RECORD'}</span>
              </button>
            )}
          </div>
        </div>

        {/* CONTROLS: TOGGLE LANG, PRINT, SAVE */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* FR / EN TOGGLE */}
          <button
            type="button"
            onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lang === 'FR' ? '🇫🇷 FR' : '🇬🇧 EN'}</span>
          </button>

          {/* PRINT BUTTON */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? '🖨️ Imprimer' : '🖨️ Print'}</span>
          </button>

          {/* MANUAL SAVE */}
          {!actualReadOnly && (
            <button
              type="button"
              onClick={() => handleSaveDossier(false)}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Enregistrer' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* READ ONLY BANNER IF ARCHIVED */}
      {!isLatest && (
        <div className="no-print bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              {lang === 'FR'
                ? `Vous consultez un dossier archivé du ${currentRecord?.date_dossier || ''} (Mode Lecture Seule).`
                : `Viewing archived record from ${currentRecord?.date_dossier || ''} (Read Only).`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDossierId(patientDossiers[0]?.id || null)}
            className="text-indigo-700 hover:underline font-extrabold cursor-pointer"
          >
            {lang === 'FR' ? 'Retour au dossier actuel →' : 'Return to current record →'}
          </button>
        </div>
      )}

      {/* MAIN PRINTABLE DOSSIER CONTAINER */}
      <div className="printable-dossier-mpr bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-sm text-slate-900 space-y-6 max-w-4xl mx-auto">
        
        {/* 1. EN-TÊTE DU DOSSIER AVEC LOGO KACEL SANTÉ */}
        <div className="border-b-2 border-slate-800 pb-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 gap-4">
            <div className="flex items-center gap-3.5">
              {/* LOGO IMAGE KACEL SANTÉ */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <img
                  src="/logo-kacel-sante.svg"
                  alt="KACEL SANTÉ Logo"
                  className="h-16 w-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = document.getElementById('kacel-mpr-logo-fallback');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div id="kacel-mpr-logo-fallback" className="hidden flex-shrink-0">
                  <svg viewBox="0 0 120 120" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="120" rx="24" fill="#0f172a"/>
                    <circle cx="60" cy="60" r="50" fill="#1e293b" stroke="#0ea5e9" strokeWidth="3" />
                    <circle cx="60" cy="38" r="7.5" fill="#38bdf8" />
                    <path d="M42 42 C45 60, 50 78, 60 84 C56 70, 50 56, 42 42 Z" fill="#38bdf8" />
                    <path d="M48 48 C55 35, 70 32, 78 42 C68 46, 58 50, 48 48 Z" fill="#38bdf8" />
                    <path d="M48 48 C58 54, 70 66, 75 78 C66 70, 56 60, 48 48 Z" fill="#38bdf8" />
                    <text x="60" y="93" fill="#ffffff" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="900" fontSize="8.5" textAnchor="middle" letterSpacing="0.8">KACELSANTÉ</text>
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="font-black text-indigo-950 text-base uppercase tracking-wide leading-tight">
                  KACEL SANTÉ
                </h2>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                  Centre de Médecine Physique et de Rééducation Fonctionnelle
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  Cité du 01 Novembre — Ouled Moussa — BOUMERDES | Tél : 0561 39 07 90 / 024 72 59 96
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-wider">
                {lang === 'FR' ? 'DOSSIER MÉDICAL MPR' : 'PM&R MEDICAL RECORD'}
              </span>
            </div>
          </div>

          {/* PATIENT INFO HEADER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] w-28">
                  {lang === 'FR' ? 'DATE :' : 'DATE:'}
                </span>
                <input
                  type="date"
                  disabled={actualReadOnly}
                  value={dateDossier}
                  onChange={(e) => {
                    setDateDossier(e.target.value);
                    markDirty();
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 font-extrabold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] w-28">
                  {lang === 'FR' ? 'NOM & PRÉNOM :' : 'NAME:'}
                </span>
                <span className="font-black text-indigo-950 uppercase text-sm">
                  {patient.Nom_Patient} {patient.Prenom_Patient || ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] w-28">
                  {lang === 'FR' ? 'ÂGE :' : 'AGE:'}
                </span>
                <span className="font-extrabold text-slate-900">
                  {patient.Age_Pat || '—'} {lang === 'FR' ? 'ans' : 'years'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] w-28 pt-1">
                  {lang === 'FR' ? 'ANTÉCÉDENTS :' : 'HISTORY:'}
                </span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={antecedents}
                  onChange={(e) => {
                    setAntecedents(e.target.value);
                    markDirty();
                  }}
                  placeholder="HTA, Diabète, Chirurgie..."
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] w-28">
                  {lang === 'FR' ? 'MCD :' : 'MCD:'}
                </span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={mcd}
                  onChange={(e) => {
                    setMcd(e.target.value);
                    markDirty();
                  }}
                  placeholder="Ex: HNP L4-L5, AVC Ischémique..."
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] w-28">
                  {lang === 'FR' ? 'IRM CÉRÉBRALE :' : 'BRAIN MRI:'}
                </span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={irmCerebrale}
                  onChange={(e) => {
                    setIrmCerebrale(e.target.value);
                    markDirty();
                  }}
                  placeholder="Résultat ou observations IRM..."
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. EXAMEN CLINIQUE */}
        <div className="space-y-4 border-b border-slate-300 pb-5">
          <h3 className="font-black text-xs uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2">
            {lang === 'FR' ? '2. EXAMEN CLINIQUE' : '2. CLINICAL EXAMINATION'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BCT */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-slate-600">
                {lang === 'FR' ? 'BCT (Bilan Clinique Thérapeutique) :' : 'Therapeutic Clinical Assessment:'}
              </label>
              <textarea
                rows={3}
                disabled={actualReadOnly}
                value={bct}
                onChange={(e) => {
                  setBct(e.target.value);
                  markDirty();
                }}
                placeholder="Détails du bilan clinique thérapeutique..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* BO */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-slate-600">
                {lang === 'FR' ? 'BO (Bilan Orthopédique) :' : 'Orthopedic Assessment:'}
              </label>
              <textarea
                rows={3}
                disabled={actualReadOnly}
                value={bo}
                onChange={(e) => {
                  setBo(e.target.value);
                  markDirty();
                }}
                placeholder="Détails du bilan orthopédique..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {/* GENOUX FLEXION */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-700 text-[11px] whitespace-nowrap">
                GENOUX FLEXION =
              </span>
              <input
                type="text"
                disabled={actualReadOnly}
                value={genouxFlexion}
                onChange={(e) => {
                  setGenouxFlexion(e.target.value);
                  markDirty();
                }}
                placeholder="120"
                className="w-20 bg-white border border-slate-300 rounded px-2 py-0.5 font-black text-indigo-950 focus:outline-none text-center"
              />
              <span className="font-bold text-slate-600">°</span>
            </div>

            {/* ANTÉVERSION DU BASSIN */}
            <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
              <span className="font-extrabold text-slate-700 text-[11px] whitespace-nowrap">
                {lang === 'FR' ? 'ANTÉVERSION DU BASSIN :' : 'PELVIC ANTEVERSION:'}
              </span>
              {(['Oui', 'Non', 'À évaluer'] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-1 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="anteversionBassin"
                    disabled={actualReadOnly}
                    checked={anteversionBassin === opt}
                    onChange={() => {
                      setAnteversionBassin(opt);
                      markDirty();
                    }}
                    className="accent-indigo-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* BNM & BF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {/* BNM */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-700 text-[11px] block">
                {lang === 'FR' ? 'BNM (Bilan Neuromusculaire) :' : 'Neuromuscular Assessment:'}
              </span>
              <div className="flex items-center gap-1.5 font-semibold">
                <span>Muscles MI entre</span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={bnmMiMin}
                  onChange={(e) => {
                    setBnmMiMin(e.target.value);
                    markDirty();
                  }}
                  placeholder="3"
                  className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold"
                />
                <span>et</span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={bnmMiMax}
                  onChange={(e) => {
                    setBnmMiMax(e.target.value);
                    markDirty();
                  }}
                  placeholder="5"
                  className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold"
                />
              </div>
            </div>

            {/* BF BILAN FONCTIONNEL */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-700 text-[11px] block">
                {lang === 'FR' ? 'BF (Bilan Fonctionnel) :' : 'Functional Assessment:'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'sans_aide', label: lang === 'FR' ? 'Marche sans aide' : 'Walk w/o assistance' },
                  { id: 'avec_aide', label: lang === 'FR' ? 'Marche avec aide' : 'Walk w/ assistance' },
                  { id: 'fauteuil', label: lang === 'FR' ? 'Fauteuil roulant' : 'Wheelchair' },
                  { id: 'non_evalue', label: lang === 'FR' ? 'Non évalué' : 'Not assessed' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-1 font-semibold text-slate-800 cursor-pointer text-[11px]">
                    <input
                      type="radio"
                      name="bfMarche"
                      disabled={actualReadOnly}
                      checked={bfMarche === item.id}
                      onChange={() => {
                        setBfMarche(item.id as any);
                        markDirty();
                      }}
                      className="accent-indigo-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* AUTRES OBSERVATIONS */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-600">
              {lang === 'FR' ? 'Autres observations :' : 'Other observations:'}
            </label>
            <textarea
              rows={2}
              disabled={actualReadOnly}
              value={autresObservations}
              onChange={(e) => {
                setAutresObservations(e.target.value);
                markDirty();
              }}
              placeholder="Notes d'examen clinique complémentaires..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 3. PROGRAMME THÉRAPEUTIQUE */}
        <div className="space-y-4 border-b border-slate-300 pb-5">
          <h3 className="font-black text-xs uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2">
            {lang === 'FR' ? '3. PROGRAMME THÉRAPEUTIQUE' : '3. THERAPEUTIC PROGRAM'}
          </h3>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3 text-xs">
            <span className="font-black text-indigo-950 uppercase tracking-wider block border-b border-indigo-200 pb-1">
              {lang === 'FR' ? 'PRESCRIPTION :' : 'PRESCRIPTION:'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={kineSeancesCount}
                  onChange={(e) => {
                    setKineSeancesCount(e.target.value);
                    markDirty();
                  }}
                  placeholder="10"
                  className="w-14 bg-white border border-slate-300 rounded px-2 py-1 text-center font-black text-indigo-950"
                />
                <span>{lang === 'FR' ? 'séances de kinésithérapie' : 'physiotherapy sessions'}</span>
                <span>(</span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={kineSeancesFreq}
                  onChange={(e) => {
                    setKineSeancesFreq(e.target.value);
                    markDirty();
                  }}
                  placeholder="3"
                  className="w-10 bg-white border border-slate-300 rounded px-1 py-1 text-center font-black text-indigo-950"
                />
                <span>{lang === 'FR' ? 'f/semaine)' : 'times/wk)'}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={balneoSeancesCount}
                  onChange={(e) => {
                    setBalneoSeancesCount(e.target.value);
                    markDirty();
                  }}
                  placeholder="5"
                  className="w-14 bg-white border border-slate-300 rounded px-2 py-1 text-center font-black text-indigo-950"
                />
                <span>{lang === 'FR' ? 'séances de balnéothérapie' : 'balneotherapy sessions'}</span>
                <span>(</span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={balneoSeancesFreq}
                  onChange={(e) => {
                    setBalneoSeancesFreq(e.target.value);
                    markDirty();
                  }}
                  placeholder="2"
                  className="w-10 bg-white border border-slate-300 rounded px-1 py-1 text-center font-black text-indigo-950"
                />
                <span>{lang === 'FR' ? 'f/semaine)' : 'times/wk)'}</span>
              </div>

              <div className="flex items-center gap-2">
                <span>{lang === 'FR' ? 'Durée par séance :' : 'Session duration:'}</span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={dureeSeanceHeures}
                  onChange={(e) => {
                    setDureeSeanceHeures(e.target.value);
                    markDirty();
                  }}
                  placeholder="1"
                  className="w-12 bg-white border border-slate-300 rounded px-2 py-1 text-center font-black text-indigo-950"
                />
                <span>{lang === 'FR' ? 'heure(s)' : 'hour(s)'}</span>
              </div>

              <div className="flex items-center gap-2">
                <span>{lang === 'FR' ? 'Fréquence :' : 'Frequency:'}</span>
                <input
                  type="text"
                  disabled={actualReadOnly}
                  value={frequenceJoursSemaine}
                  onChange={(e) => {
                    setFrequenceJoursSemaine(e.target.value);
                    markDirty();
                  }}
                  placeholder="3"
                  className="w-12 bg-white border border-slate-300 rounded px-2 py-1 text-center font-black text-indigo-950"
                />
                <span>{lang === 'FR' ? 'jours/semaine' : 'days/week'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-600">
              {lang === 'FR' ? 'OBJECTIFS :' : 'OBJECTIVES:'}
            </label>
            <textarea
              rows={2}
              disabled={actualReadOnly}
              value={objectifs}
              onChange={(e) => {
                setObjectifs(e.target.value);
                markDirty();
              }}
              placeholder="Gain d'amplitude, réduction douleurs, autonomie marche..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 4. DÉTAIL DES SÉANCES & CHOIX DU PROGRAMME RÉUTILISABLE */}
        <div className="space-y-4 border-b border-slate-300 pb-5">
          <h3 className="font-black text-xs uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2">
            {lang === 'FR' ? '4. DÉTAIL DES SÉANCES (LISTE À COCHER)' : '4. SESSION DETAILS (CHECKLIST)'}
          </h3>

          <div className="space-y-3 bg-slate-50/90 p-4 rounded-xl border border-slate-200">
            {/* PROGRAMME DROPDOWN + BUTTONS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-600">
                  {lang === 'FR' ? 'SÉLECTIONNER UN PROGRAMME PRÉDÉFINI :' : 'SELECT PRESET PROGRAM:'}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    disabled={actualReadOnly}
                    value={selectedProgrammeId}
                    onChange={(e) => handleSelectProgramme(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    <option value="">-- {lang === 'FR' ? 'Sélectionner un programme réutilisable' : 'Select a reusable program'} --</option>
                    {programmesList.map((prog) => (
                      <option key={`prog-opt-${prog.ID_Programme}`} value={prog.ID_Programme}>
                        {prog.Nom_Programme} {prog.Description ? `(${prog.Description})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedProgrammeId && !actualReadOnly && (
                    <button
                      type="button"
                      onClick={handleDeleteProgramme}
                      title={lang === 'FR' ? "Supprimer ce programme" : "Delete program"}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg transition cursor-pointer text-xs font-bold flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {!actualReadOnly && (
                <div className="flex items-center gap-2 pt-1 md:pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewProgModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Nouveau Programme' : 'New Program'}</span>
                  </button>

                  {selectedProgrammeId && (
                    <button
                      type="button"
                      onClick={handleUpdateExistingProgramme}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? 'Enregistrer modifs' : 'Save edits'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* PROGRAMME FREE TEXT INPUT */}
            <div className="space-y-1 pt-1 border-t border-slate-200">
              <label className="block text-[10px] font-black uppercase text-slate-600">
                {lang === 'FR' ? 'OU SAISIR UN PROGRAMME PERSONNALISÉ :' : 'OR ENTER CUSTOM PROGRAM NAME:'}
              </label>
              <input
                type="text"
                disabled={actualReadOnly}
                value={programme}
                onChange={(e) => {
                  setProgramme(e.target.value);
                  markDirty();
                }}
                placeholder="Ex: Programme de réhabilitation post-AVC / rééducation rachis"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* CHECKLIST ITEMS (1 TO 11 + EXTRA CUSTOM LINES) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold">
            {fullCheckboxList.map((itemLabel, index) => {
              const num = index + 1;
              const checked = !!checkboxes[num];
              return (
                <label
                  key={num}
                  className={`flex items-start gap-2.5 p-2 rounded-lg transition cursor-pointer border ${
                    checked
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={actualReadOnly}
                    checked={checked}
                    onChange={(e) => {
                      setCheckboxes((prev) => ({ ...prev, [num]: e.target.checked }));
                      markDirty();
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <span className="leading-tight">{itemLabel}</span>
                </label>
              );
            })}
          </div>

          {/* ADD CUSTOM SEANCE LINE BUTTON */}
          {!actualReadOnly && (
            <div className="flex justify-start">
              {isAddingCustomItem ? (
                <div className="flex items-center gap-2 w-full max-w-md bg-slate-100 p-2 rounded-lg border border-slate-300">
                  <input
                    type="text"
                    value={newCustomItemText}
                    onChange={(e) => setNewCustomItemText(e.target.value)}
                    placeholder={`Ex: ${fullCheckboxList.length + 1}. Exercice de réadaptation...`}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1 rounded transition cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'FR' ? 'Ajouter' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomItem(false)}
                    className="text-slate-500 hover:text-slate-800 font-bold text-xs px-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomItem(true)}
                  className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? '+ Ajouter une ligne de séance' : '+ Add session row'}</span>
                </button>
              )}
            </div>
          )}

          {/* OBSERVATIONS COMPLÉMENTAIRES */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-600">
              {lang === 'FR' ? 'OBSERVATIONS COMPLÉMENTAIRES :' : 'COMPLEMENTARY OBSERVATIONS:'}
            </label>
            <textarea
              rows={3}
              disabled={actualReadOnly}
              value={observationsComplementaires}
              onChange={(e) => {
                setObservationsComplementaires(e.target.value);
                markDirty();
              }}
              placeholder="Notes et consignes particulières pour les séances..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 5. SIGNATURES */}
        <div className="space-y-4 pt-2">
          <h3 className="font-black text-xs uppercase tracking-wider text-indigo-900 border-l-4 border-indigo-600 pl-2">
            {lang === 'FR' ? '5. SIGNATURES' : '5. SIGNATURES'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs font-semibold">
            {/* MÉDECIN PRESCRIPTEUR */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-700 uppercase text-[10px] block border-b pb-1">
                {lang === 'FR' ? 'Médecin prescripteur :' : 'Prescribing Doctor:'}
              </span>
              <div className="space-y-2">
                <select
                  disabled={actualReadOnly}
                  value={medecinPrescripteur}
                  onChange={(e) => {
                    setMedecinPrescripteur(e.target.value);
                    markDirty();
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option key="default-medecin" value="">-- {lang === 'FR' ? 'Sélectionner un médecin' : 'Select doctor'} --</option>
                  {(dbState?.utilisateurs || [])
                    .filter((u) => {
                      const r = (u.Role || '').toLowerCase();
                      return r.includes('medecin') || r.includes('médecin') || r.includes('mpr');
                    })
                    .map((u, idx) => {
                      const name = u.Nom_Utilisateur?.startsWith('Dr.')
                        ? u.Nom_Utilisateur
                        : `Dr. ${u.Nom_Utilisateur || ''}`.trim();
                      return (
                        <option key={`user-doc-${u.ID_Utilisateur || idx}-${name}`} value={name}>
                          {name} ({u.Role})
                        </option>
                      );
                    })}
                  {['Dr. Benkari', 'Dr. Ahmed', 'Dr. Kacel'].map((doc) => (
                    <option key={`preset-doc-${doc}`} value={doc}>{doc}</option>
                  ))}
                  {medecinPrescripteur &&
                    !['Dr. Benkari', 'Dr. Ahmed', 'Dr. Kacel'].includes(medecinPrescripteur) &&
                    !(dbState?.utilisateurs || []).some(u => {
                      const name = u.Nom_Utilisateur?.startsWith('Dr.')
                        ? u.Nom_Utilisateur
                        : `Dr. ${u.Nom_Utilisateur || ''}`.trim();
                      return name === medecinPrescripteur;
                    }) && (
                      <option key={`custom-doc-${medecinPrescripteur}`} value={medecinPrescripteur}>
                        {medecinPrescripteur}
                      </option>
                    )}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Date :</span>
                  <input
                    type="date"
                    disabled={actualReadOnly}
                    value={dateSignatureMedecin}
                    onChange={(e) => {
                      setDateSignatureMedecin(e.target.value);
                      markDirty();
                    }}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
                  />
                </div>

                <div className="pt-6 border-b border-dashed border-slate-300 text-center text-[10px] text-slate-400 font-mono italic">
                  [ {lang === 'FR' ? 'Signature & Cachet du Médecin' : 'Doctor Signature & Stamp'} ]
                </div>
              </div>
            </div>

            {/* KINÉSITHÉRAPEUTE */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-700 uppercase text-[10px] block border-b pb-1">
                {lang === 'FR' ? 'Kinésithérapeute :' : 'Physiotherapist:'}
              </span>
              <div className="space-y-2">
                <select
                  disabled={actualReadOnly}
                  value={kinesitherapeute}
                  onChange={(e) => {
                    setKinesitherapeute(e.target.value);
                    markDirty();
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option key="default-kine" value="">-- {lang === 'FR' ? 'Sélectionner un kiné' : 'Select kiné'} --</option>
                  {(dbState?.praticiens || []).map((p, idx) => {
                    const kineVal = `${p.Nom_Praticien || ''} ${p.Prenom_Praticien || ''}`.trim();
                    return (
                      <option key={`prat-${p.ID_Praticien || idx}-${kineVal}`} value={kineVal}>
                        {p.Nom_Praticien} {p.Prenom_Praticien} ({p.Specialite || 'Kiné'})
                      </option>
                    );
                  })}
                  {(dbState?.utilisateurs || [])
                    .filter((u) => (u.Role || '').toLowerCase().includes('kiné') || (u.Role || '').toLowerCase().includes('kine'))
                    .map((u, idx) => (
                      <option key={`user-kine-${u.ID_Utilisateur || idx}-${u.Nom_Utilisateur}`} value={u.Nom_Utilisateur}>
                        {u.Nom_Utilisateur} ({u.Role})
                      </option>
                    ))}
                  {kinesitherapeute && 
                   !(dbState?.praticiens || []).some(p => `${p.Nom_Praticien || ''} ${p.Prenom_Praticien || ''}`.trim() === kinesitherapeute) &&
                   !(dbState?.utilisateurs || []).some(u => u.Nom_Utilisateur === kinesitherapeute) && (
                    <option key={`custom-kine-${kinesitherapeute}`} value={kinesitherapeute}>
                      {kinesitherapeute}
                    </option>
                  )}
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Date :</span>
                  <input
                    type="date"
                    disabled={actualReadOnly}
                    value={dateSignatureKine}
                    onChange={(e) => {
                      setDateSignatureKine(e.target.value);
                      markDirty();
                    }}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
                  />
                </div>

                <div className="pt-6 border-b border-dashed border-slate-300 text-center text-[10px] text-slate-400 font-mono italic">
                  [ {lang === 'FR' ? 'Signature du Kinésithérapeute' : 'Physiotherapist Signature'} ]
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL CRÉATION NOUVEAU PROGRAMME */}
      {showNewProgModal && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                <span>📋 Nouveau Programme MPR Réutilisable</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProgModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nom du programme :
                </label>
                <input
                  type="text"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  placeholder="Ex: Rééducation genou post-ligamentoplastie"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Pathologie (Optionnel) :
                </label>
                <input
                  type="text"
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  placeholder="Ex: Suivi chirurgical genou, 6 semaines"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Sélectionner les items de séances cochés par défaut :
                </label>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto">
                  {CHECKBOX_ITEMS_FR.map((itemLabel, index) => {
                    const num = index + 1;
                    const isChecked = !!newProgChecks[num];
                    return (
                      <label key={num} className="flex items-center gap-2 font-medium cursor-pointer text-slate-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setNewProgChecks((prev) => ({ ...prev, [num]: e.target.checked }));
                          }}
                          className="h-4 w-4 rounded accent-indigo-600"
                        />
                        <span>{itemLabel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-3">
              <button
                type="button"
                onClick={() => setShowNewProgModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateNewProgramme}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-lg text-xs transition cursor-pointer shadow-md"
              >
                Enregistrer le Programme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
