// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { 
  ClipboardList, 
  Printer, 
  Save, 
  PlusCircle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Languages, 
  FileText, 
  DollarSign, 
  CreditCard,
  Building
} from "lucide-react";
import { DatabaseState, FicheIMC, Patient, Pack, Abonnement, Seance, Versement } from "../dbStore";
import { ALGERIAN_WILAYAS } from "../types";

interface FicheIMCSectionProps {
  selectedPatient: Patient;
  dbState: DatabaseState;
  currentUser: any;
  onSave: (updatedState: DatabaseState) => void;
  triggerToast: (msg: string, type: "success" | "info" | "error") => void;
}

export default function FicheIMCSection({
  selectedPatient,
  dbState,
  currentUser,
  onSave,
  triggerToast
}: FicheIMCSectionProps) {
  const [lang, setLang] = useState<"FR" | "EN">("FR");
  const [isEditing, setIsEditing] = useState(false);
  
  // Fiche active state
  const [fiche, setFiche] = useState<FicheIMC | null>(null);

  // Form states
  const [medecinNom, setMedecinNom] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [nss, setNss] = useState("");
  const [phone, setPhone] = useState("");
  const [nomPatient, setNomPatient] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [age, setAge] = useState<number>(0);
  const [gender, setGender] = useState<'Homme' | 'Femme' | 'Enfant'>("Enfant");
  const [adresse, setAdresse] = useState("");
  const [motif, setMotif] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [gmfcsLevel, setGmfcsLevel] = useState<'I' | 'II' | 'III' | 'IV' | 'V' | "">("");
  const [tonusMusculaire, setTonusMusculaire] = useState("");
  const [retractions, setRetractions] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [prescription, setPrescription] = useState("");

  // Subscription wizard states
  const [showAbnModal, setShowAbnModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number>(0);
  const [abnStartDate, setAbnStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [remise, setRemise] = useState<number>(0);
  const [planningTime, setPlanningTime] = useState("09:30");
  const [selectedPraticienId, setSelectedPraticienId] = useState<number>(0);
  
  // Payment states
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Espèces" | "Carte" | "Chèque">("Espèces");
  
  // Printed/Generated receipt state
  const [generatedReceipt, setGeneratedReceipt] = useState<any | null>(null);

  // Find existing fiche IMC for this patient
  useEffect(() => {
    const fiches = dbState.fiches_imc || [];
    const found = fiches.find(f => Number(f.patient_id || f.ID_Patient) === Number(selectedPatient.ID_Patient));
    if (found) {
      setFiche(found);
      setIsEditing(false);
      
      // Populate fields
      setMedecinNom(found.medecin_nom || "");
      setWilaya(found.wilaya || selectedPatient.wilaya || "");
      setNss(found.nss || selectedPatient.nss || "");
      setPhone(found.phone || selectedPatient.phone || "");
      setNomPatient(found.nom_patient || selectedPatient.Nom_Patient || "");
      setDateNaissance(found.date_naissance || selectedPatient.Date_Nais_Pat || "");
      setAge(found.age ?? selectedPatient.Age_Patient ?? selectedPatient.Age_Pat ?? 0);
      setGender(found.gender || selectedPatient.Genre_Patient || "Enfant");
      setAdresse(found.adresse || selectedPatient.address || selectedPatient.street || "");
      setMotif(found.motif || "");
      setDiagnostic(found.diagnostic || "");
      setGmfcsLevel(found.gmfcs_level || "");
      setTonusMusculaire(found.tonus_musculaire || "");
      setRetractions(found.retractions || "");
      setObjectifs(found.objectifs || "");
      setPrescription(found.prescription || "");
    } else {
      setFiche(null);
      setIsEditing(true);
      
      // Populate defaults from selectedPatient
      setMedecinNom("");
      setWilaya(selectedPatient.wilaya || "");
      setNss(selectedPatient.nss || "");
      setPhone(selectedPatient.phone || "");
      setNomPatient(selectedPatient.Nom_Patient || "");
      setDateNaissance(selectedPatient.Date_Nais_Pat || "");
      const calculatedAge = selectedPatient.Age_Patient ?? selectedPatient.Age_Pat ?? 0;
      setAge(calculatedAge);
      setGender(selectedPatient.Genre_Patient || "Enfant");
      setAdresse(selectedPatient.address || selectedPatient.street || "");
      setMotif("");
      setDiagnostic("");
      setGmfcsLevel("");
      setTonusMusculaire("");
      setRetractions("");
      setObjectifs("");
      setPrescription("");
    }
  }, [selectedPatient, dbState.fiches_imc]);

  // Recalculate age dynamically when dateNaissance changes
  useEffect(() => {
    if (dateNaissance) {
      const birth = new Date(dateNaissance);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? calculatedAge : 0);
    }
  }, [dateNaissance]);

  // Get current active/not-closed subscription for this patient
  const activeAbn = dbState.abonnements.find(
    a => Number(a.ID_Patient) === Number(selectedPatient.ID_Patient) && a.Etat !== "Fermé"
  );

  // Get packs for dropdown
  const packs = dbState.packs || [];
  // Find default or first available pack for IMC
  useEffect(() => {
    if (packs.length > 0 && selectedPackId === 0) {
      const imcPack = packs.find(p => p.Libelle_Pack.toUpperCase().includes("IMC") || p.Cat_Pack === 'I');
      if (imcPack) {
        setSelectedPackId(imcPack.ID_Pack);
      } else {
        setSelectedPackId(packs[0].ID_Pack);
      }
    }
  }, [packs, selectedPackId]);

  // Get practitioners (kinés) for dropdown
  const practitioners = (dbState.praticiens || []).filter(p => p.Repere === "K" || p.Repere === "P");
  useEffect(() => {
    if (practitioners.length > 0 && selectedPraticienId === 0) {
      setSelectedPraticienId(practitioners[0].ID_Prat);
    }
  }, [practitioners, selectedPraticienId]);

  // Dictionaries for FR/EN
  const t = {
    FR: {
      ficheTitle: "Fiche Médicale de Rééducation - Enfant IMC",
      createButton: "Créer la Fiche Médicale IMC",
      editButton: "Modifier la Fiche",
      saveButton: "Enregistrer la Fiche",
      cancelButton: "Annuler",
      printButton: "Imprimer en PDF",
      doctorName: "Nom du Médecin Prescripteur (dicté)",
      doctorPlaceholder: "Ex: Dr. Belhadj",
      dateCreation: "Date de création",
      registryNum: "N° Registre IMC",
      patientInfo: "Section A : Informations Administratives",
      clinicalData: "Section B : Données Cliniques Initiales",
      evaluation: "Section C : Évaluation Fonctionnelle & Neurologique",
      objectives: "Section D : Objectifs Thérapeutiques",
      prescription: "Section E : Prescription de Rééducation",
      
      // Fields Section A
      fullName: "Nom et Prénom du Patient",
      birthDate: "Date de Naissance",
      calculatedAge: "Âge (calculé)",
      gender: "Genre",
      phone: "Téléphone du parent / tuteur",
      nss: "N° Sécurité Sociale (NSS)",
      wilaya: "Wilaya",
      address: "Adresse complète",
      
      // Fields Section B
      motifLabel: "Motif de consultation",
      motifPlaceholder: "Décrire le motif de la consultation...",
      diagLabel: "Diagnostic médical",
      diagPlaceholder: "Saisir le diagnostic précis dicté...",

      // Fields Section C
      gmfcsLabel: "Niveau GMFCS (Gross Motor Function Classification System)",
      gmfcsHelp: "Niveau I à V définissant les capacités motrices globales",
      tonusLabel: "Tonus musculaire / Spasticité",
      tonusPlaceholder: "Ex: Spasticité bilatérale des adducteurs, score d'Ashworth...",
      retractionsLabel: "Rétractions musculo-tendineuses",
      retractionsPlaceholder: "Ex: Rétraction des tendons d'Achille...",

      // Fields Section D
      objectivesLabel: "Objectifs de rééducation définis par le médecin",
      objectivesPlaceholder: "Ex: Améliorer la tenue assise, libérer les rétractions...",

      // Fields Section E
      prescriptionLabel: "Prescription détaillée",
      prescriptionPlaceholder: "Ex: 20 séances de kiné intensive, fréquence de 5/semaine...",

      // Subscription Alerts & Actions
      noActiveAbn: "Aucun abonnement actif pour cet Enfant IMC.",
      hasActiveAbn: "Un abonnement actif est déjà enregistré pour ce patient.",
      btnCreateAbn: "Créer l'Abonnement & Planifier la Kiné Intensive",
      
      // Subscription wizard modal
      wizardTitle: "Création d'Abonnement & Planning IMC",
      choosePack: "1. Choix du Forfait (Pack)",
      startDate: "2. Date de début de l'abonnement",
      remiseLabel: "Remise (%)",
      totalPrice: "Prix d'origine",
      remiseAmount: "Montant de la remise",
      finalPrice: "Montant total dû",
      planningKine: "3. Planning Kiné Intensive (5 séances / semaine)",
      planningTimeLabel: "Heure fixe quotidienne (du Dimanche au Jeudi)",
      praticienLabel: "Praticien Kinésithérapeute référent",
      encaissement: "4. Encaissement & Versement Initial",
      amountPaidLabel: "Montant versé par le parent (DA)",
      reglementLabel: "Mode de règlement",
      generateBtn: "Générer l'Abonnement, le Planning et l'Encaissement",
      
      // Receipt
      receiptTitle: "REÇU DE SOUSCRIPTION & PLANNING - KACEL SANTÉ",
      receiptSub: "Centre de Rééducation Fonctionnelle & Pédiatrique",
      receiptDate: "Date d'émission",
      receiptPac: "Abonnement souscrit",
      receiptPaid: "Montant payé",
      receiptLeft: "Reste à payer (Dette)",
      receiptPlan: "Votre Planning de Kiné Intensive",
      receiptPrintBtn: "Imprimer ce reçu & planning",
      closeBtn: "Fermer",
      errorSelectPack: "Veuillez choisir un pack d'abonnement valide."
    },
    EN: {
      ficheTitle: "Medical Reeducation File - ICP Child (IMC)",
      createButton: "Create Medical File",
      editButton: "Edit Medical File",
      saveButton: "Save Medical File",
      cancelButton: "Cancel",
      printButton: "Print PDF",
      doctorName: "Prescribing Physician (Dictated)",
      doctorPlaceholder: "E.g.: Dr. Belhadj",
      dateCreation: "Creation Date",
      registryNum: "ICP Registry No.",
      patientInfo: "Section A: Administrative Information",
      clinicalData: "Section B: Initial Clinical Data",
      evaluation: "Section C: Functional & Neurological Evaluation",
      objectives: "Section D: Therapeutic Objectives",
      prescription: "Section E: Rehabilitation Prescription",
      
      // Fields Section A
      fullName: "Patient Full Name",
      birthDate: "Date of Birth",
      calculatedAge: "Age (calculated)",
      gender: "Gender",
      phone: "Parent / Guardian Phone",
      nss: "Social Security No. (NSS)",
      wilaya: "Wilaya (Province)",
      address: "Full Address",
      
      // Fields Section B
      motifLabel: "Reason for consultation",
      motifPlaceholder: "Describe the reason for the consultation...",
      diagLabel: "Medical diagnosis",
      diagPlaceholder: "Enter the precise dictated diagnosis...",

      // Fields Section C
      gmfcsLabel: "GMFCS Level (Gross Motor Function Classification System)",
      gmfcsHelp: "Level I to V defining global motor abilities",
      tonusLabel: "Muscle Tone / Spasticity",
      tonusPlaceholder: "E.g.: Bilateral adductor spasticity, Ashworth score...",
      retractionsLabel: "Muscle-Tendon Retractions",
      retractionsPlaceholder: "E.g.: Achilles tendon retraction...",

      // Fields Section D
      objectivesLabel: "Rehabilitation objectives defined by the doctor",
      objectivesPlaceholder: "E.g.: Improve sitting posture, release contractures...",

      // Fields Section E
      prescriptionLabel: "Detailed prescription",
      prescriptionPlaceholder: "E.g.: 20 sessions of intensive PT, 5/week frequency...",

      // Subscription Alerts & Actions
      noActiveAbn: "No active subscription for this ICP Child.",
      hasActiveAbn: "An active subscription is already recorded for this patient.",
      btnCreateAbn: "Create Subscription & Plan Intensive Therapy",
      
      // Subscription wizard modal
      wizardTitle: "Subscription Wizard & ICP Planning",
      choosePack: "1. Select Package (Pack)",
      startDate: "2. Subscription start date",
      remiseLabel: "Discount (%)",
      totalPrice: "Original Price",
      remiseAmount: "Discount amount",
      finalPrice: "Total amount due",
      planningKine: "3. Intensive Therapy Planning (5 sessions / week)",
      planningTimeLabel: "Fixed Daily Time (Sunday to Thursday)",
      praticienLabel: "Assigned Physiotherapist",
      encaissement: "4. Payment & Initial Cash In",
      amountPaidLabel: "Amount paid by parent (DA)",
      reglementLabel: "Payment Method",
      generateBtn: "Generate Subscription, Planning & Payment",
      
      // Receipt
      receiptTitle: "SUBSCRIPTION RECEIPT & PLANNING - KACEL SANTÉ",
      receiptSub: "Functional & Pediatric Rehabilitation Center",
      receiptDate: "Issued on",
      receiptPac: "Subscribed Package",
      receiptPaid: "Amount Paid",
      receiptLeft: "Remaining to pay (Debt)",
      receiptPlan: "Your Intensive Therapy Schedule",
      receiptPrintBtn: "Print receipt & schedule",
      closeBtn: "Close",
      errorSelectPack: "Please choose a valid subscription package."
    }
  };

  const currText = t[lang];

  // Auto-generate registry number: IMC-YYYY-NNNN
  const generateRegistryNumber = (existingFiches: FicheIMC[]): string => {
    const currentYear = new Date().getFullYear();
    const existingForYear = existingFiches.filter(f => f.registre_num && f.registre_num.startsWith(`IMC-${currentYear}-`));
    let nextNum = 1;
    if (existingForYear.length > 0) {
      const nums = existingForYear.map(f => {
        const parts = f.registre_num.split("-");
        const numPart = parseInt(parts[2], 10);
        return isNaN(numPart) ? 0 : numPart;
      });
      nextNum = Math.max(...nums) + 1;
    }
    return `IMC-${currentYear}-${String(nextNum).padStart(4, "0")}`;
  };

  const handleSaveFiche = () => {
    if (!medecinNom.trim()) {
      triggerToast(lang === "FR" ? "Le nom du médecin est requis." : "Doctor name is required.", "error");
      return;
    }

    const currentFiches = dbState.fiches_imc || [];
    let updatedFiches = [...currentFiches];

    if (fiche) {
      // Update existing
      const updated: FicheIMC = {
        ...fiche,
        medecin_nom: medecinNom,
        wilaya,
        nss,
        phone,
        nom_patient: nomPatient,
        date_naissance: dateNaissance,
        age,
        gender,
        adresse,
        motif,
        diagnostic,
        gmfcs_level: gmfcsLevel,
        tonus_musculaire: tonusMusculaire,
        retractions,
        objectifs,
        prescription,
        updatedAt: Date.now()
      };
      updatedFiches = updatedFiches.map(f => f.id === fiche.id ? updated : f);
      triggerToast(lang === "FR" ? "Fiche médicale IMC mise à jour avec succès !" : "ICP medical file updated successfully!", "success");
    } else {
      // Create new
      const newRegistry = generateRegistryNumber(currentFiches);
      const newFiche: FicheIMC = {
        id: `f-imc-${Date.now()}`,
        patient_id: Number(selectedPatient.ID_Patient),
        registre_num: newRegistry,
        date_creation: new Date().toISOString().split("T")[0],
        medecin_nom: medecinNom,
        wilaya,
        nss,
        phone,
        nom_patient: nomPatient,
        date_naissance: dateNaissance,
        age,
        gender,
        adresse,
        motif,
        diagnostic,
        gmfcs_level: gmfcsLevel,
        tonus_musculaire: tonusMusculaire,
        retractions,
        objectifs,
        prescription,
        updatedAt: Date.now()
      };
      updatedFiches.push(newFiche);
      setFiche(newFiche);
      triggerToast(lang === "FR" ? `Fiche médicale IMC créée avec succès ! N° Registre: ${newRegistry}` : `ICP Medical file created successfully! Registry No: ${newRegistry}`, "success");
    }

    // Save state back to global store
    const nextState = {
      ...dbState,
      fiches_imc: updatedFiches
    };
    onSave(nextState);
    setIsEditing(false);
  };

  // Printing the medical sheet cleanly on A4 with KACEL Santé logo header
  const handlePrint = () => {
    if (!fiche) return;
    window.print();
  };

  // Plan sessions daily Sunday to Thursday at the selected time, skipping Fri/Sat
  const generateIntensivePlanning = (
    patientId: number,
    abnId: number,
    packSessionCount: number,
    startDateStr: string,
    timeStr: string,
    pratId: number
  ): Seance[] => {
    const sessionsList: Seance[] = [];
    let currentDate = new Date(startDateStr);
    let sessionsPlanned = 0;
    
    // In Algerian healthcare settings, active days are Sunday (0) to Thursday (4).
    // JavaScript days: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
    const activeDays = [0, 1, 2, 3, 4];

    // Determine H_Fin_Seanc (+1 hour)
    const [hours, minutes] = timeStr.split(":").map(Number);
    const startHour = isNaN(hours) ? 9 : hours;
    const startMin = isNaN(minutes) ? 30 : minutes;
    
    const endHour = (startHour + 1) % 24;
    const endHourStr = String(endHour).padStart(2, "0");
    const endMinStr = String(startMin).padStart(2, "0");
    const finTimeStr = `${endHourStr}:${endMinStr}`;

    const maxSeanceId = dbState.seances.length > 0 ? Math.max(...dbState.seances.map(s => s.ID_Seanc)) : 0;
    let nextId = maxSeanceId + 1;

    // Use default Act of Kine standard or clinical, or find an act that matches
    // In KACEL, let's find or fallback to Act 1
    const defaultActId = dbState.actes.length > 0 ? dbState.actes[0].ID_Acte : 1;

    while (sessionsPlanned < packSessionCount) {
      const dayOfWeek = currentDate.getDay();
      if (activeDays.includes(dayOfWeek)) {
        const dateFormatted = currentDate.toISOString().split("T")[0];
        
        sessionsList.push({
          ID_Seanc: nextId++,
          ID_Patient: patientId,
          ID_Prat: pratId,
          ID_Acte: defaultActId,
          ID_Abn: abnId,
          ID_RDV: null,
          H_Debut_Seanc: timeStr,
          H_Fin_Seanc: finTimeStr,
          Prix_Seanc: 0, // Session prices are covered under the global pack amount
          Date_Seanc_Realisee: dateFormatted
        });
        
        sessionsPlanned++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return sessionsList;
  };

  const handleCreateAbonnement = () => {
    const pack = packs.find(p => p.ID_Pack === selectedPackId);
    if (!pack) {
      triggerToast(currText.errorSelectPack, "error");
      return;
    }

    const priceOrig = pack.Prix_Pack || 0;
    const discountValue = (priceOrig * remise) / 100;
    const priceFinal = Math.max(0, priceOrig - discountValue);
    const remainingDebt = Math.max(0, priceFinal - amountPaid);

    const maxAbnId = dbState.abonnements.length > 0 ? Math.max(...dbState.abonnements.map(a => a.ID_Abn)) : 0;
    const newAbnId = maxAbnId + 1;

    // Generate sessions list (du Dimanche au Jeudi)
    const sessionsPlanned = generateIntensivePlanning(
      Number(selectedPatient.ID_Patient),
      newAbnId,
      pack.Nbre_Seance_Pack,
      abnStartDate,
      planningTime,
      selectedPraticienId
    );

    // Calculate end date from last planned session date
    const endDateStr = sessionsPlanned.length > 0 
      ? sessionsPlanned[sessionsPlanned.length - 1].Date_Seanc_Realisee 
      : abnStartDate;

    const newAbonnement: Abonnement = {
      ID_Abn: newAbnId,
      ID_Patient: Number(selectedPatient.ID_Patient),
      ID_Pack: pack.ID_Pack,
      Date_Debut_Abn: abnStartDate,
      Date_Fin_Abn: endDateStr,
      Nbre_Sean_Consom_Abn: 0,
      ID_Acte_Add1: null,
      ID_Acte_Add2: null,
      Etat: "Actif",
      Date_Abn: new Date().toISOString().split("T")[0],
      updatedAt: Date.now()
    };

    let updatedVersements = [...dbState.versements];
    let updatedTransactions = [...(dbState.transactions_caisses || [])];

    if (amountPaid > 0) {
      const maxVersId = dbState.versements.length > 0 ? Math.max(...dbState.versements.map(v => v.ID_Vers)) : 0;
      const newVersement: Versement = {
        ID_Vers: maxVersId + 1,
        ID_Abn: newAbnId,
        Mont_Vers: amountPaid,
        Date_Vers: new Date().toISOString().split("T")[0],
        Mode_Vers: paymentMethod
      };
      updatedVersements.push(newVersement);

      // Register cash receipt in transactions_caisses for bookkeeping
      const maxTransId = updatedTransactions.length > 0 ? Math.max(...updatedTransactions.map(t => t.ID_Trans || 0)) : 0;
      const newTransaction = {
        ID_Trans: maxTransId + 1,
        ID_Utilisateur: currentUser?.ID_Utilisateur || 1,
        ID_Sce: currentUser?.ID_Sce || 1,
        Montant_Mouv: amountPaid,
        Type_Mouv: "Recette",
        Mode_Reglement: paymentMethod,
        Libelle_Mouv: `Abonnement IMC - ${selectedPatient.Nom_Patient} (${pack.Libelle_Pack})`,
        Date_Mouv: new Date().toISOString().split("T")[0],
        Heure_Mouv: new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
      };
      updatedTransactions.push(newTransaction);
    }

    // Save everything in state
    const nextState: DatabaseState = {
      ...dbState,
      abonnements: [...dbState.abonnements, newAbonnement],
      seances: [...dbState.seances, ...sessionsPlanned],
      versements: updatedVersements,
      transactions_caisses: updatedTransactions
    };

    onSave(nextState);
    triggerToast(
      lang === "FR" 
        ? "Abonnement & planning de Kiné Intensive générés avec succès !" 
        : "Subscription & Intensive therapy schedule generated successfully!",
      "success"
    );

    // Save data for showing receipt
    setGeneratedReceipt({
      id: newAbnId,
      patientName: selectedPatient.Nom_Patient,
      packLabel: pack.Libelle_Pack,
      totalDue: priceFinal,
      paid: amountPaid,
      debt: remainingDebt,
      sessions: sessionsPlanned,
      startDate: abnStartDate,
      endDate: endDateStr,
      time: planningTime,
      pratName: practitioners.find(p => p.ID_Prat === selectedPraticienId)?.Nom_Prat || "Kiné référent"
    });
  };

  const selectedPack = packs.find(p => p.ID_Pack === selectedPackId);
  const origPrice = selectedPack?.Prix_Pack || 0;
  const computedDiscount = (origPrice * remise) / 100;
  const computedTotal = Math.max(0, origPrice - computedDiscount);
  const computedLeft = Math.max(0, computedTotal - amountPaid);

  return (
    <div className="relative space-y-6">
      
      {/* FULL-SCREEN HIDDEN PRINT SECTION DESIGNED FOR A4 PORTRAIT */}
      <div id="print-section" className="hidden print:block bg-white text-slate-900 p-8 w-full max-w-4xl mx-auto font-sans leading-relaxed">
        {/* Header KACEL Santé Logo */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo-kacel-sante.png"
              alt="KACEL SANTÉ Logo"
              className="h-16 w-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                const fallback = document.getElementById('kacel-imc-sec-fallback');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div id="kacel-imc-sec-fallback" className="hidden flex-shrink-0">
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
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">KACEL SANTÉ</h1>
              <p className="text-xs text-slate-600 font-bold">Centre de Rééducation Pédiatrique & Fonctionnelle</p>
              <p className="text-[10px] text-slate-500 font-semibold">Cité du 01 Novembre, Ouled Moussa, BOUMERDES | Tél: 0561 39 07 90 / 024 72 59 96</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1 text-xs font-mono font-bold rounded">
              {fiche?.registre_num || "IMC-REG-PENDING"}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">{currText.dateCreation} : {fiche?.date_creation || new Date().toISOString().split("T")[0]}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 inline-block">
            {currText.ficheTitle}
          </h2>
          {medecinNom && (
            <p className="text-xs font-semibold text-slate-700 mt-2">
              {currText.doctorName} : <span className="font-bold underline">{medecinNom}</span>
            </p>
          )}
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-xs">
          
          {/* Section A */}
          <div className="border border-slate-200 p-4 rounded bg-slate-50/50">
            <h3 className="font-extrabold uppercase border-b border-slate-300 pb-1 mb-3 text-slate-900 tracking-wider">
              {currText.patientInfo}
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div><span className="font-bold">{currText.fullName} :</span> {nomPatient || "-"}</div>
              <div><span className="font-bold">{currText.birthDate} :</span> {dateNaissance || "-"} ({age} ans)</div>
              <div><span className="font-bold">{currText.gender} :</span> {gender}</div>
              <div><span className="font-bold">{currText.phone} :</span> {phone || "-"}</div>
              <div><span className="font-bold">{currText.nss} :</span> {nss || "-"}</div>
              <div><span className="font-bold">{currText.wilaya} :</span> {wilaya ? (ALGERIAN_WILAYAS.find(w => w.id === wilaya)?.name || wilaya) : "-"}</div>
              <div className="col-span-2"><span className="font-bold">{currText.address} :</span> {adresse || "-"}</div>
            </div>
          </div>

          {/* Section B */}
          <div className="border border-slate-200 p-4 rounded">
            <h3 className="font-extrabold uppercase border-b border-slate-300 pb-1 mb-2 text-slate-900 tracking-wider">
              {currText.clinicalData}
            </h3>
            <div className="space-y-2">
              <div>
                <p className="font-bold underline mb-0.5">{currText.motifLabel} :</p>
                <p className="text-slate-700 leading-normal">{motif || "-"}</p>
              </div>
              <div className="mt-2">
                <p className="font-bold underline mb-0.5">{currText.diagLabel} :</p>
                <p className="text-slate-700 leading-normal">{diagnostic || "-"}</p>
              </div>
            </div>
          </div>

          {/* Section C */}
          <div className="border border-slate-200 p-4 rounded">
            <h3 className="font-extrabold uppercase border-b border-slate-300 pb-1 mb-2 text-slate-900 tracking-wider">
              {currText.evaluation}
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-bold">{currText.gmfcsLabel} :</span> <span className="font-extrabold text-sm border border-slate-400 px-2 rounded font-mono bg-slate-100">{gmfcsLevel || "-"}</span>
              </div>
              <div className="mt-2">
                <p className="font-bold underline mb-0.5">{currText.tonusLabel} :</p>
                <p className="text-slate-700 leading-normal">{tonusMusculaire || "-"}</p>
              </div>
              <div className="mt-2">
                <p className="font-bold underline mb-0.5">{currText.retractionsLabel} :</p>
                <p className="text-slate-700 leading-normal">{retractions || "-"}</p>
              </div>
            </div>
          </div>

          {/* Section D */}
          <div className="border border-slate-200 p-4 rounded">
            <h3 className="font-extrabold uppercase border-b border-slate-300 pb-1 mb-2 text-slate-900 tracking-wider">
              {currText.objectives}
            </h3>
            <p className="text-slate-700 leading-normal">{objectifs || "-"}</p>
          </div>

          {/* Section E */}
          <div className="border border-slate-200 p-4 rounded bg-slate-50/50">
            <h3 className="font-extrabold uppercase border-b border-slate-300 pb-1 mb-2 text-slate-900 tracking-wider">
              {currText.prescription}
            </h3>
            <p className="text-slate-700 leading-normal font-medium">{prescription || "-"}</p>
          </div>

        </div>

        {/* Signatures block */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200">
          <div>
            <p className="font-bold text-slate-500">L'Assistante de saisie</p>
            <p className="mt-8 font-extrabold text-slate-800">{currentUser?.Nom_Utilisateur || "Assistante"}</p>
          </div>
          <div>
            <p className="font-bold text-slate-500">Médecin MPR Prescripteur</p>
            <p className="mt-8 font-extrabold text-slate-800">{medecinNom || "Cachet & Signature"}</p>
          </div>
        </div>
      </div>

      {/* RENDER FOR THE LIVE SCREEN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#606C5A]/5 border border-slate-200 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">
              {fiche ? (lang === "FR" ? `FICHE MÉDICALE : ${fiche.registre_num}` : `MEDICAL SHEET: ${fiche.registre_num}`) : currText.ficheTitle}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {lang === "FR" ? "Suivi spécifique de rééducation Kiné Intensive" : "Dedicated tracking for Intensive physiotherapy"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold cursor-pointer bg-white transition duration-150 text-slate-600"
          >
            <Languages className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === "FR" ? "ENGLISH" : "FRANÇAIS"}</span>
          </button>

          {/* Action Buttons */}
          {fiche && !isEditing && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition duration-150 border border-slate-200"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{currText.printButton}</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#606C5A] hover:bg-[#606C5A]/90 text-white rounded-lg text-[10px] font-bold cursor-pointer transition duration-150"
              >
                <span>{currText.editButton}</span>
              </button>
            </>
          )}

          {isEditing && (
            <>
              {fiche && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer bg-white transition duration-150"
                >
                  {currText.cancelButton}
                </button>
              )}
              <button
                onClick={handleSaveFiche}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition duration-150 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{currText.saveButton}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ALERTE/ACCÈS ABONNEMENT ENFANT IMC */}
      {fiche && (
        <div className={`p-4 rounded-2xl border ${!activeAbn ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
          <div className="space-y-1">
            <h4 className={`text-xs font-black uppercase tracking-wider ${!activeAbn ? "text-amber-800" : "text-emerald-800"} flex items-center gap-1.5`}>
              <span>{!activeAbn ? "⚠️ " + currText.noActiveAbn : "✅ " + currText.hasActiveAbn}</span>
            </h4>
            <p className="text-[10px] text-slate-600 font-medium">
              {!activeAbn 
                ? (lang === "FR" ? "L'abonnement de Kiné Intensive mensuel à 5 séances par semaine doit être créé." : "Intensive physiotherapy monthly subscription needs to be created.")
                : (lang === "FR" ? `Un abonnement actif court du ${activeAbn.Date_Debut_Abn} au ${activeAbn.Date_Fin_Abn}.` : `Active subscription runs from ${activeAbn.Date_Debut_Abn} to ${activeAbn.Date_Fin_Abn}.`)
              }
            </p>
          </div>

          {!activeAbn && (
            <button
              onClick={() => setShowAbnModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition duration-150 shadow-md self-stretch sm:self-auto justify-center"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{currText.btnCreateAbn}</span>
            </button>
          )}
        </div>
      )}

      {/* CENTRAL FORM VIEW */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Form Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/30">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {currText.doctorName}
            </label>
            <input
              type="text"
              value={medecinNom}
              onChange={(e) => setMedecinNom(e.target.value)}
              disabled={!isEditing}
              placeholder={currText.doctorPlaceholder}
              className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] focus:ring-1 focus:ring-[#606C5A] outline-none disabled:bg-slate-100 disabled:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {currText.dateCreation}
            </label>
            <div className="p-2 border border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{fiche?.date_creation || new Date().toISOString().split("T")[0]}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {currText.registryNum}
            </label>
            <div className="p-2 border border-slate-200 bg-amber-50 text-amber-800 text-xs font-extrabold rounded-xl flex items-center gap-1.5 font-mono">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <span>{fiche?.registre_num || "IMC-REG-XXXX (AUTO)"}</span>
            </div>
          </div>
        </div>

        {/* Section A: Administrative Information */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#2B4B52] border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{currText.patientInfo}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.fullName}</label>
              <input
                type="text"
                value={nomPatient}
                onChange={(e) => setNomPatient(e.target.value)}
                disabled={!isEditing}
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.birthDate}</label>
              <input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                disabled={!isEditing}
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.calculatedAge}</label>
              <div className="p-2 border border-slate-200 bg-slate-50 text-xs font-black rounded-xl text-slate-800">
                {age} ans
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.gender}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                disabled={!isEditing}
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              >
                <option value="Enfant">Enfant</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.phone}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="Ex: 0555..."
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.nss}</label>
              <input
                type="text"
                value={nss}
                onChange={(e) => setNss(e.target.value)}
                disabled={!isEditing}
                placeholder="N° Sécurité Sociale"
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.wilaya}</label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                disabled={!isEditing}
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              >
                <option value="">Sélectionner</option>
                {ALGERIAN_WILAYAS.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.address}</label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                disabled={!isEditing}
                placeholder="Adresse complète"
                className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section B: Clinical Data */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#FBFBFA]/50">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#2B4B52] border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{currText.clinicalData}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.motifLabel}</label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                disabled={!isEditing}
                placeholder={currText.motifPlaceholder}
                rows={3}
                className="w-full text-xs font-bold border border-slate-200 p-3 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.diagLabel}</label>
              <textarea
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                disabled={!isEditing}
                placeholder={currText.diagPlaceholder}
                rows={3}
                className="w-full text-xs font-bold border border-slate-200 p-3 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section C: Functional & Neurological Assessment */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#2B4B52] border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{currText.evaluation}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.gmfcsLabel}</label>
              <select
                value={gmfcsLevel}
                onChange={(e) => setGmfcsLevel(e.target.value as any)}
                disabled={!isEditing}
                className="w-full text-xs font-extrabold border border-slate-200 p-2.5 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 bg-amber-50/50 text-amber-950 font-mono"
              >
                <option value="">Sélectionner</option>
                <option value="I">GMFCS Level I</option>
                <option value="II">GMFCS Level II</option>
                <option value="III">GMFCS Level III</option>
                <option value="IV">GMFCS Level IV</option>
                <option value="V">GMFCS Level V</option>
              </select>
              <span className="text-[9px] text-slate-400 font-medium mt-1 block">{currText.gmfcsHelp}</span>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.tonusLabel}</label>
              <textarea
                value={tonusMusculaire}
                onChange={(e) => setTonusMusculaire(e.target.value)}
                disabled={!isEditing}
                placeholder={currText.tonusPlaceholder}
                rows={3}
                className="w-full text-xs font-bold border border-slate-200 p-3 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.retractionsLabel}</label>
              <textarea
                value={retractions}
                onChange={(e) => setRetractions(e.target.value)}
                disabled={!isEditing}
                placeholder={currText.retractionsPlaceholder}
                rows={3}
                className="w-full text-xs font-bold border border-slate-200 p-3 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section D: Therapeutic Objectives */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#FBFBFA]/50">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#2B4B52] border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{currText.objectives}</span>
          </h4>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.objectivesLabel}</label>
            <textarea
              value={objectifs}
              onChange={(e) => setObjectifs(e.target.value)}
              disabled={!isEditing}
              placeholder={currText.objectivesPlaceholder}
              rows={3}
              className="w-full text-xs font-bold border border-slate-200 p-3 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 resize-none"
            />
          </div>
        </div>

        {/* Section E: Rehabilitation Prescription */}
        <div className="p-4 sm:p-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#2B4B52] border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{currText.prescription}</span>
          </h4>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{currText.prescriptionLabel}</label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              disabled={!isEditing}
              placeholder={currText.prescriptionPlaceholder}
              rows={3}
              className="w-full text-xs font-bold border border-[#606C5A] p-3 rounded-xl focus:border-[#606C5A] outline-none disabled:bg-slate-100 bg-[#606C5A]/5 text-slate-800"
            />
          </div>
        </div>

      </div>

      {/* SUBSCRIPTION CREATOR WIZARD MODAL */}
      {showAbnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#606C5A] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black uppercase text-xs tracking-wider">{currText.wizardTitle}</h3>
                  <p className="text-[9px] text-slate-200 font-medium">{selectedPatient.Nom_Patient}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAbnModal(false)}
                className="text-white hover:text-slate-200 font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
              
              {/* Step 1: Pack choice */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#2B4B52] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>{currText.choosePack}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Forfaits</label>
                    <select
                      value={selectedPackId}
                      onChange={(e) => setSelectedPackId(Number(e.target.value))}
                      className="w-full text-xs font-black border border-slate-200 p-2 rounded-xl outline-none"
                    >
                      {packs.map(p => (
                        <option key={p.ID_Pack} value={p.ID_Pack}>
                          {p.Libelle_Pack} ({p.Nbre_Seance_Pack} séances - {p.Prix_Pack} DA)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{currText.remiseLabel}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={remise}
                      onChange={(e) => setRemise(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full text-xs font-extrabold border border-slate-200 p-2 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Computational Box */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider">{currText.totalPrice}</span>
                    <span className="font-extrabold text-xs text-slate-600">{origPrice} DA</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase tracking-wider">{currText.remiseAmount}</span>
                    <span className="font-extrabold text-xs text-amber-600">-{computedDiscount} DA ({remise}%)</span>
                  </div>
                  <div>
                    <span className="block text-[#2B4B52] font-black uppercase tracking-wider">{currText.finalPrice}</span>
                    <span className="font-black text-sm text-[#2B4B52]">{computedTotal} DA</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Date de début */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#2B4B52] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>{currText.startDate}</span>
                </h4>
                <input
                  type="date"
                  value={abnStartDate}
                  onChange={(e) => setAbnStartDate(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl outline-none"
                />
              </div>

              {/* Step 3: Planning Kiné Intensive */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#2B4B52] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>{currText.planningKine}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{currText.planningTimeLabel}</label>
                    <input
                      type="time"
                      value={planningTime}
                      onChange={(e) => setPlanningTime(e.target.value)}
                      className="w-full text-xs font-extrabold border border-slate-200 p-2 rounded-xl outline-none font-mono text-slate-700 bg-amber-50/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{currText.praticienLabel}</label>
                    <select
                      value={selectedPraticienId}
                      onChange={(e) => setSelectedPraticienId(Number(e.target.value))}
                      className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl outline-none"
                    >
                      {practitioners.map(p => (
                        <option key={p.ID_Prat} value={p.ID_Prat}>
                          {p.Nom_Prat} {p.Prenom_Prat} ({p.Repere})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl flex gap-2 items-start">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-800 leading-normal font-medium">
                    {lang === "FR" 
                      ? `Le système planifiera automatiquement ${selectedPack?.Nbre_Seance_Pack || 0} séances à l'heure de ${planningTime} uniquement du Dimanche au Jeudi, en évitant les Vendredis et Samedis.`
                      : `The system will automatically schedule ${selectedPack?.Nbre_Seance_Pack || 0} daily sessions at ${planningTime} strictly from Sunday to Thursday, omitting Fridays and Saturdays.`
                    }
                  </p>
                </div>
              </div>

              {/* Step 4: Encaissement & Versement */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#2B4B52] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>{currText.encaissement}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{currText.amountPaidLabel}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">DA</span>
                      <input
                        type="number"
                        min={0}
                        max={computedTotal}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Math.min(computedTotal, Math.max(0, Number(e.target.value))))}
                        className="w-full text-xs font-black border border-slate-200 p-2 pl-9 rounded-xl outline-none text-emerald-700 bg-emerald-50/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">{currText.reglementLabel}</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full text-xs font-bold border border-slate-200 p-2 rounded-xl outline-none"
                    >
                      <option value="Espèces">💵 Espèces</option>
                      <option value="Carte">💳 Carte Bancaire</option>
                      <option value="Chèque">✍️ Chèque</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex justify-between items-center text-[10px]">
                  <span className="font-extrabold text-emerald-800 uppercase tracking-wider">Reste à payer (Dette) :</span>
                  <span className="font-black text-sm text-emerald-950">{computedLeft} DA</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowAbnModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer bg-white transition duration-150"
              >
                {currText.cancelButton}
              </button>
              <button
                onClick={() => {
                  handleCreateAbonnement();
                  setShowAbnModal(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition duration-150 shadow-md"
              >
                {currText.generateBtn}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT DIALOG (TICKET DE PAIEMENT & PLANNING) */}
      {generatedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
            
            <div className="p-4 border-b border-slate-100 bg-emerald-700 text-white flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider">🎫 Reçu & Planning Générés</span>
              <button
                onClick={() => setGeneratedReceipt(null)}
                className="text-white hover:text-slate-200 font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Ticket Template */}
            <div className="p-6 overflow-y-auto text-slate-800 space-y-6 text-xs font-mono" id="receipt-print-area">
              
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h3 className="font-black text-base text-slate-900 tracking-tight uppercase">KACEL SANTÉ</h3>
                <p className="text-[10px] text-slate-500 font-bold">{currText.receiptSub}</p>
                <p className="text-[9px] text-slate-400">Alger - Tél: 0555 12 34 56</p>
                <p className="text-[9px] text-slate-500 mt-2">{currText.receiptDate} : {new Date().toLocaleDateString("fr-FR")}</p>
              </div>

              {/* Receipt Body */}
              <div className="space-y-2 text-slate-700">
                <div><span className="font-bold text-slate-500">Patient :</span> <span className="font-black text-slate-900">{generatedReceipt.patientName}</span></div>
                <div><span className="font-bold text-slate-500">Abonnement :</span> <span className="font-bold">{generatedReceipt.packLabel}</span></div>
                <div><span className="font-bold text-slate-500">Période :</span> {generatedReceipt.startDate} au {generatedReceipt.endDate}</div>
                <div><span className="font-bold text-slate-500">Séance quotidienne :</span> {generatedReceipt.time} ({generatedReceipt.pratName})</div>
              </div>

              {/* Financial block */}
              <div className="bg-slate-50 border border-dashed border-slate-200 p-3 rounded-xl space-y-1 text-slate-800">
                <div className="flex justify-between"><span>Montant total :</span> <span className="font-bold">{generatedReceipt.totalDue} DA</span></div>
                <div className="flex justify-between text-emerald-700"><span>Montant versé :</span> <span className="font-black">-{generatedReceipt.paid} DA</span></div>
                <div className="flex justify-between text-amber-700 border-t border-slate-200 pt-1 mt-1">
                  <span className="font-bold">Reste à payer :</span>
                  <span className="font-black">{generatedReceipt.debt} DA</span>
                </div>
              </div>

              {/* Planning Dates */}
              <div className="space-y-2">
                <h4 className="font-black uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1">
                  <span>📅</span>
                  <span>{currText.receiptPlan} ({generatedReceipt.sessions.length} séances)</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 max-h-32 overflow-y-auto pr-1">
                  {generatedReceipt.sessions.map((s: any, i: number) => (
                    <div key={s.ID_Seanc} className="flex gap-1 items-center bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                      <span className="font-extrabold text-slate-400">#{i+1}</span>
                      <span>{s.Date_Seanc_Realisee}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setGeneratedReceipt(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer bg-white transition duration-150"
              >
                {currText.closeBtn}
              </button>
              <button
                onClick={() => {
                  const receiptArea = document.getElementById("receipt-print-area")?.innerHTML;
                  if (!receiptArea) return;
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`
                      <html>
                        <head>
                          <title>Ticket de Paiement & Planning</title>
                          <style>
                            body { font-family: monospace; padding: 20px; color: #333; max-width: 380px; margin: 0 auto; }
                            .text-center { text-align: center; }
                            .border-b { border-bottom: 1px dashed #ccc; }
                            .pb-4 { padding-bottom: 12px; }
                            .mb-6 { margin-bottom: 18px; }
                            .space-y-2 > div { margin-bottom: 6px; }
                            .flex { display: flex; justify-content: space-between; }
                            .bg-slate-50 { background-color: #f9f9f9; padding: 10px; border: 1px dashed #ccc; margin: 12px 0; }
                            .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 6px; }
                            .font-black { font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          ${receiptArea}
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition duration-150 shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{currText.receiptPrintBtn}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
