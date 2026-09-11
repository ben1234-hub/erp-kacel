/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, Trash2, Calendar, FileText, Check, AlertCircle, Sparkles, User, 
  X, Award, BarChart3, Search, Filter, DollarSign, Clock, ListCollapse, Printer, Split, Eye, ShieldCheck, ChevronDown, ChevronLeft, ChevronRight, UserPlus, Settings, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Abonnement, Versement, Pack, Patient, calculateAge, isAbonnementGele } from '../dbStore';
import { translateNameToArabic } from '../utils/translator';
import { getPatientAffectation } from './PatientsManager';
import PatientDetailsModal from './PatientDetailsModal';

interface AbonnementManagerProps {
  dbState: DatabaseState;
  currentUser: any;
  onSave: (state: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onSelectPatient?: (patientId: number) => void;
}

export const AbonnementManager: React.FC<AbonnementManagerProps> = ({
  dbState,
  currentUser,
  onSave,
  triggerToast,
  onSelectPatient
}) => {
  // Interactive local states for global search query
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [tableFontSize, setTableFontSize] = useState<'100%' | '120%' | '140%' | '160%' | '180%' | '200%'>('100%');

  // États de filtrage dynamique par colonne
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [filterTypePatient, setFilterTypePatient] = useState<string[]>([]);
  const [filterBeneficiaire, setFilterBeneficiaire] = useState('');
  const [filterNbreAbn, setFilterNbreAbn] = useState<number[]>([]);
  const [filterLibellePack, setFilterLibellePack] = useState<string[]>([]);
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterPackPrice, setFilterPackPrice] = useState<number[]>([]);
  const [filterVersementsInput, setFilterVersementsInput] = useState('');
  const [filterResteAPayerInput, setFilterResteAPayerInput] = useState('');
  const [filterConsoSeances, setFilterConsoSeances] = useState<number[]>([]);
  const [filterRestantes, setFilterRestantes] = useState<number[]>([]);
  const [filterAffectation, setFilterAffectation] = useState<string[]>([]);
  const [filterEtat, setFilterEtat] = useState<string[]>([]);

  // checked abonnements ids state
  const [checkedAbnIds, setCheckedAbnIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // active Versement inside Main Viewport (conform to PatientsManager setup)
  const [activeVersementAbnId, setActiveVersementAbnId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Espèces');
  const [createdVersement, setCreatedVersement] = useState<any | null>(null);

  // Versement Editing States
  const [editingVersementId, setEditingVersementId] = useState<number | null>(null);
  const [editingVersementAmount, setEditingVersementAmount] = useState<string>('');
  const [versementToDelete, setVersementToDelete] = useState<number | null>(null);

  // Daily Report States
  const [showDailyReport, setShowDailyReport] = useState<boolean>(false);
  const [dailyReportDate, setDailyReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // States for interactive selected Abonnement detail window (split layout)
  const [selectedAbnPopup, setSelectedAbnPopup] = useState<Abonnement | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  
  // States for adjustable SplitPane
  const [splitWidth, setSplitWidth] = useState<number>(50); // relative percent (25% - 75%)
  const [isResizingSplit, setIsResizingSplit] = useState<boolean>(false);

  // État de visibilité des colonnes pour le rapport journalier
  const [reportColumns, setReportColumns] = useState({
    type: true,
    patient: true,
    nbreAbn: false,
    forfait: true,
    dateDebut: false,
    prix: true,
    verse: true,
    reste: true,
    seances: false,
    sRest: true,
    etat: true,
    affectation: true
  });
  const [showReportConfig, setShowReportConfig] = useState<boolean>(false);

  // Intelligent container scrollbars & sticky references
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const stickyScrollRef = React.useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(1500);

  const handleTableScroll = () => {
    if (tableContainerRef.current && stickyScrollRef.current) {
      stickyScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  const handleStickyScroll = () => {
    if (tableContainerRef.current && stickyScrollRef.current) {
      tableContainerRef.current.scrollLeft = stickyScrollRef.current.scrollLeft;
    }
  };

  React.useEffect(() => {
    const updateWidth = () => {
      if (tableContainerRef.current) {
        setTableScrollWidth(tableContainerRef.current.scrollWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (tableContainerRef.current) {
      observer.observe(tableContainerRef.current);
    }
    return () => observer.disconnect();
  }, [
    dbState.abonnements.length,
    searchTerm,
    filterTypePatient.join(','),
    filterBeneficiaire,
    filterNbreAbn.join(','),
    filterLibellePack.join(','),
    filterDateDebut,
    filterPackPrice.join(','),
    filterVersementsInput,
    filterResteAPayerInput,
    filterConsoSeances.join(','),
    filterRestantes.join(','),
    filterAffectation.join(','),
    filterEtat.join(','),
    currentPage
  ]);

  // Patient Creation Modal States (Moved from PatientsManager as requested)
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [nom, setNom] = useState('');
  const [nomArb, setNomArb] = useState('');
  const [prenomArb, setPrenomArb] = useState('');
  const [genre, setGenre] = useState<'Homme' | 'Femme' | 'Enfant'>('Homme');
  const [typePatient, setTypePatient] = useState<string>('Adulte');
  const [phone, setPhone] = useState('');
  const [dateNais, setDateNais] = useState('');
  const [age, setAge] = useState<number>(0);
  const [affectation, setAffectation] = useState('Sce Réeducation Adulte');

  // Inline versement entry insidepopup
  const [popupVersAmount, setPopupVersAmount] = useState<string>('');
  const [popupVersDate, setPopupVersDate] = useState<string>(new Date().toISOString().slice(0, 16));

  const startResizingSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSplit(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSplit) return;
      const container = document.getElementById('split-pane-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const percentage = Math.max(25, Math.min(75, (relativeX / rect.width) * 100));
        setSplitWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSplit(false);
    };

    if (isResizingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSplit]);

  // Handle direct Abonnement Deletion Action
  const handleDeleteAbonnement = (abnId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal
    setConfirmDialog({
      isOpen: true,
      title: "Confirmation de révocation",
      message: `Voulez-vous vraiment révoquer et supprimer l'abonnement ABN_${abnId} ? Cette action est irréversible.`,
      onConfirm: () => {
        const fresh = { ...dbState };
        const abnToDelete = fresh.abonnements.find(a => a.ID_Abn === abnId);
        if (abnToDelete) {
          const patIdx = fresh.patients.findIndex(p => p.ID_Patient === abnToDelete.ID_Patient);
          if (patIdx !== -1) {
            fresh.patients[patIdx] = {
              ...fresh.patients[patIdx],
              Nbre_Abn: Math.max(0, (fresh.patients[patIdx].Nbre_Abn || 0) - 1)
            };
          }
        }
        fresh.abonnements = fresh.abonnements.filter(a => a.ID_Abn !== abnId);
        fresh.versements = fresh.versements.filter(v => v.ID_Abn !== abnId);
        onSave(fresh);
        triggerToast(`L'abonnement ABN_${abnId} a été révoqué avec succès.`, 'info');
      }
    });
  };

  // Process Quick Versement Submission (with beautiful electronic Caisse registration)
  const handleProcessVersement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVersementAbnId) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast("Veuillez entrer un montant valide.", "error");
      return;
    }

    const fresh = { ...dbState } as any;
    const abnMatch = fresh.abonnements.find((a: any) => a.ID_Abn === activeVersementAbnId);
    if (!abnMatch) {
      triggerToast("Abonnement introuvable.", "error");
      return;
    }

    const patientMatch = fresh.patients.find((p: any) => p.ID_Patient === abnMatch.ID_Patient);
    const patientName = patientMatch ? patientMatch.Nom_Patient : `Patient #${abnMatch.ID_Patient}`;

    // Récupération dynamique du prix depuis le pack associé
    const getPackPrice = (packId: number) => {
      const foundPack = fresh.packs.find((p: any) => p.ID_Pack === packId);
      return foundPack?.Prix_Pack ?? 0;
    };

    const packPrice = getPackPrice(abnMatch.ID_Pack);
    const abnVersements = fresh.versements.filter((v: any) => v.ID_Abn === activeVersementAbnId);
    const totalVerses = abnVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);
    const remaining = packPrice - totalVerses;

    if (amount > remaining) {
      triggerToast(`Montant invalide. Le reste à payer est de ${remaining} DA.`, "error");
      return;
    }

    const nextVersId = fresh.versements.length > 0 ? Math.max(...fresh.versements.map((v: any) => v.ID_Vers)) + 1 : 1;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newVers: Versement = {
      ID_Vers: nextVersId,
      ID_Abn: activeVersementAbnId,
      Mont_Vers: amount,
      Date_Vers: nowStr,
      Mode_Vers: paymentMode
    };

    fresh.versements = [...fresh.versements, newVers];

    // Align with caisse transaction
    if (!fresh.transactions_caisses) {
      fresh.transactions_caisses = [];
    }
    const nextTransId = fresh.transactions_caisses.length > 0 
      ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
      : 1;

    const newTrans = {
      ID_Trans: nextTransId,
      Caisse: 'Caisse Abonnement / Autres Soins',
      Type: 'Recette',
      Montant: amount,
      Libelle: `Encaissement Versement ABN_#${activeVersementAbnId} (${patientName})`,
      ModePaiement: paymentMode,
      Date_Trans: nowStr.split(' ')[0],
      Patient_Nom: patientName
    };

    fresh.transactions_caisses = [...fresh.transactions_caisses, newTrans];

    // State matching receipt layout
    setCreatedVersement({
      versId: nextVersId,
      abnId: activeVersementAbnId,
      patientName,
      patientType: patientMatch?.type_patient || 'Adulte',
      packName: fresh.packs.find((p: any) => p.ID_Pack === abnMatch.ID_Pack)?.Libelle_Pack || 'Forfait de Soins',
      packPrice: packPrice,
      amountPaid: amount,
      totalPaidSoFar: totalVerses + amount,
      dateVers: nowStr,
      modePaiement: paymentMode
    });

    onSave(fresh);
    triggerToast(`Versement de ${amount} DA enregistré avec succès pour l'abonnement #${activeVersementAbnId} !`, 'success');
  };

  const handleUpdateVersement = (versId: number) => {
    const amount = parseFloat(editingVersementAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast('Le montant doit être supérieur à 0.', 'error');
      return;
    }

    const fresh = { ...dbState };
    const vIndex = fresh.versements.findIndex(v => v.ID_Vers === versId);
    if (vIndex !== -1) {
      fresh.versements[vIndex] = {
        ...fresh.versements[vIndex],
        Mont_Vers: amount
      };
      onSave(fresh);
      setEditingVersementId(null);
      triggerToast('Versement mis à jour avec succès.', 'success');
    }
  };

  const handleDeleteVersement = (versId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirmation de suppression",
      message: "Voulez-vous vraiment supprimer ce versement ?",
      onConfirm: () => {
        const fresh = { ...dbState };
        fresh.versements = fresh.versements.filter(v => v.ID_Vers !== versId);
        onSave(fresh);
        triggerToast('Versement supprimé.', 'info');
      }
    });
  };

  // Submit versement directly inside Popup detail view
  const handleAddVersementInPopup = (abnId: number, e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(popupVersAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast('Paiement invalide. Veuillez configurer un montant supérieur à 0.', 'error');
      return;
    }

    const fresh = { ...dbState } as any;
    const abnMatch = fresh.abonnements.find((a: any) => a.ID_Abn === abnId);
    if (!abnMatch) return;

    const patientMatch = fresh.patients.find((p: any) => p.ID_Patient === abnMatch.ID_Patient);
    const patientName = patientMatch ? patientMatch.Nom_Patient : `Patient #${abnMatch.ID_Patient}`;

    // Récupération dynamique du prix depuis le pack associé
    const getPackPrice = (packId: number) => {
      const foundPack = fresh.packs.find((p: any) => p.ID_Pack === packId);
      return foundPack?.Prix_Pack ?? 0;
    };

    const packPrice = getPackPrice(abnMatch.ID_Pack);
    const abnVersements = fresh.versements.filter((v: any) => v.ID_Abn === abnId);
    const totalVerses = abnVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);
    const remaining = packPrice - totalVerses;

    if (amount > remaining) {
      triggerToast(`Montant invalide. Le reste à payer est de ${remaining} DA.`, 'error');
      return;
    }

    const nextVersId = fresh.versements.length > 0 ? Math.max(...fresh.versements.map((v: any) => v.ID_Vers)) + 1 : 1;
    const formattedDate = popupVersDate.replace('T', ' ');

    const newVers: Versement = {
      ID_Vers: nextVersId,
      ID_Abn: abnId,
      Mont_Vers: amount,
      Date_Vers: formattedDate,
      Mode_Vers: 'Espèces'
    };

    fresh.versements = [...fresh.versements, newVers];

    // Save transaction
    if (!fresh.transactions_caisses) {
      fresh.transactions_caisses = [];
    }
    const nextTransId = fresh.transactions_caisses.length > 0 
      ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) + 1 
      : 1;

    const newCaisseTrans = {
      ID_Trans: nextTransId,
      Caisse: 'Caisse Abonnement / Autres Soins',
      Type: 'Recette',
      Montant: amount,
      Libelle: `Encaissement Versement ABN_#${abnId} (${patientName})`,
      ModePaiement: 'Espèces',
      Date_Trans: formattedDate.split(' ')[0],
      Patient_Nom: patientName
    };

    fresh.transactions_caisses = [...fresh.transactions_caisses, newCaisseTrans];

    onSave(fresh);
    triggerToast(`Versement de ${amount} DA enregistré avec succès pour l'abonnement #${abnId} !`, 'success');
    setPopupVersAmount('');
  };

  // Toggle active / closed state
  const handleToggleEtatAbonnement = (abnId: number, targetEtat: 'Actif' | 'Fermé') => {
    const fresh = { ...dbState };
    const abnIndex = fresh.abonnements.findIndex(a => a.ID_Abn === abnId);
    if (abnIndex !== -1) {
      fresh.abonnements[abnIndex] = {
        ...fresh.abonnements[abnIndex],
        Etat: targetEtat
      };
      // Keep popup state updated dynamically
      if (selectedAbnPopup && selectedAbnPopup.ID_Abn === abnId) {
        setSelectedAbnPopup({
          ...selectedAbnPopup,
          Etat: targetEtat
        });
      }
      onSave(fresh);
      triggerToast(`L'état de l'abonnement #${abnId} est désormais: ${targetEtat}`, 'success');
    }
  };

  // Logic to create a new patient (Moved here as requested)
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      triggerToast('Le nom du patient est obligatoire.', 'error');
      return;
    }

    const fresh = { ...dbState };
    const nextId = fresh.patients.length > 0 
      ? Math.max(...fresh.patients.map(p => p.ID_Patient)) + 1 
      : 1001;

    const newPatient: Patient = {
      ID_Patient: nextId,
      Nom_Patient: nom,
      Nom_Pat_Arb: nomArb,
      Pren_Pat_Arb: prenomArb,
      Genre_Patient: genre,
      type_patient: typePatient,
      phone: phone,
      Date_Nais_Pat: dateNais,
      Age_Patient: age,
      affectation: affectation,
      address: '',
      street: '',
      city: '',
      wilaya: ''
    };

    fresh.patients = [...fresh.patients, newPatient];
    onSave(fresh);
    triggerToast(`Le dossier du patient ${nom} a été créé avec succès.`, 'success');
    setShowAddPatientModal(false);
    
    // Reset form
    setNom('');
    setNomArb('');
    setPrenomArb('');
    setPhone('');
    setDateNais('');
    setAge(0);
  };

  // Extract list of unique packs for select
  const uniquePacks = dbState.packs ? Array.from(new Set(dbState.packs.map(p => p.Libelle_Pack))) : [];

  // Enrich high-performance full list once
  const abonnementsWithDetails = React.useMemo(() => {
    const patientsMap = new Map<number, any>();
    dbState.patients.forEach(p => {
      patientsMap.set(p.ID_Patient, p);
    });

    const packsMap = new Map<number, any>();
    (dbState.packs || []).forEach(p => {
      packsMap.set(p.ID_Pack, p);
    });

    const versementsMap = new Map<number, any[]>();
    dbState.versements.forEach(v => {
      if (!versementsMap.has(v.ID_Abn)) {
        versementsMap.set(v.ID_Abn, []);
      }
      versementsMap.get(v.ID_Abn)!.push(v);
    });

    return dbState.abonnements.map(abn => {
      const patient = patientsMap.get(abn.ID_Patient);
      const pack = packsMap.get(abn.ID_Pack);
      const patientName = patient?.Nom_Patient || '';
      const packLabel = pack?.Libelle_Pack || '';
      const isGeleStatus = isAbonnementGele(abn, dbState);
      const stateVal = abn.Etat === 'Fermé' ? 'Fermé' : isGeleStatus ? 'Gelé' : (abn.Etat || 'Actif');
      const typePat = patient?.type_patient || 'Adulte';
      const patientAffectation = patient ? getPatientAffectation(patient) : 'N/A';
      const nbreAbn = patient?.Nbre_Abn_Pat ?? 0;
      const packPrice = pack?.Prix_Pack ?? 1200;
      
      const associatedVersements = versementsMap.get(abn.ID_Abn) || [];
      const totalPaidAmount = associatedVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
      const remainingToPay = packPrice - totalPaidAmount;
      const remainingSessions = (pack?.Nbre_Seance_Pack ?? 10) - abn.Nbre_Sean_Consom_Abn;

      return {
        abn,
        patient,
        pack,
        patientName,
        packLabel,
        stateVal,
        typePat,
        patientAffectation,
        nbreAbn,
        packPrice,
        associatedVersements,
        totalPaidAmount,
        remainingToPay,
        remainingSessions,
        totalSessions: pack?.Nbre_Seance_Pack ?? 10
      };
    });
  }, [dbState.abonnements, dbState.patients, dbState.packs, dbState.versements, dbState.fichesKineAutomatisees]);

  // Unified filter checking logic with optional exclusion parameter
  const checkMatches = React.useCallback((item: any, excludeKey?: string) => {
    // Filtre global de recherche rapide
    if (excludeKey !== 'searchTerm' && searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchesSearch = item.patientName.toLowerCase().includes(q) ||
                            item.packLabel.toLowerCase().includes(q) ||
                            item.stateVal.toLowerCase().includes(q) ||
                            item.abn.Date_Debut_Abn.includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // 1. Type de patient (Uniforme)
    if (excludeKey !== 'typePatient' && filterTypePatient.length > 0 && !filterTypePatient.includes(item.typePat)) {
      return false;
    }

    // 2. Bénéficiaire (Non Uniforme)
    if (excludeKey !== 'beneficiaire' && filterBeneficiaire && !item.patientName.toLowerCase().includes(filterBeneficiaire.toLowerCase())) {
      return false;
    }

    // 2.5 Affectation (Uniforme)
    if (excludeKey !== 'affectation' && filterAffectation.length > 0 && !filterAffectation.includes(item.patientAffectation)) {
      return false;
    }

    // 3. Nbre Abn (Uniforme)
    if (excludeKey !== 'nbreAbn' && filterNbreAbn.length > 0 && !filterNbreAbn.includes(item.nbreAbn)) {
      return false;
    }

    // 4. Libellé Forfait (Uniforme)
    if (excludeKey !== 'libellePack' && filterLibellePack.length > 0 && !filterLibellePack.includes(item.packLabel)) {
      return false;
    }

    // 5. Date Début (Non Uniforme)
    if (excludeKey !== 'dateDebut' && filterDateDebut && !item.abn.Date_Debut_Abn.includes(filterDateDebut)) {
      return false;
    }

    // 6. Pack / Forfait Prix (Uniforme)
    if (excludeKey !== 'packPrice' && filterPackPrice.length > 0 && !filterPackPrice.includes(item.packPrice)) {
      return false;
    }

    // 7. Versements (Non Uniforme)
    if (excludeKey !== 'versements' && filterVersementsInput && !String(item.totalPaidAmount).includes(filterVersementsInput)) {
      return false;
    }

    // 8. Reste à payer (Non Uniforme)
    if (excludeKey !== 'restePayer' && filterResteAPayerInput && !String(item.remainingToPay).includes(filterResteAPayerInput)) {
      return false;
    }

    // 9. Conso. Séances (Uniforme)
    if (excludeKey !== 'consoSeances' && filterConsoSeances.length > 0 && !filterConsoSeances.includes(item.abn.Nbre_Sean_Consom_Abn)) {
      return false;
    }

    // 10. Restantes (Uniforme)
    if (excludeKey !== 'restantes' && filterRestantes.length > 0 && !filterRestantes.includes(item.remainingSessions)) {
      return false;
    }

    // 11. État (Uniforme)
    if (excludeKey !== 'etat' && filterEtat.length > 0 && !filterEtat.includes(item.stateVal)) {
      return false;
    }

    return true;
  }, [searchTerm, filterTypePatient, filterBeneficiaire, filterNbreAbn, filterLibellePack, filterDateDebut, filterPackPrice, filterVersementsInput, filterResteAPayerInput, filterConsoSeances, filterRestantes, filterEtat]);

  // Filter criteria logic
  const filteredAbnuList = React.useMemo(() => {
    return abonnementsWithDetails
      .filter((item) => checkMatches(item))
      .map((item) => item.abn);
  }, [abonnementsWithDetails, checkMatches]);

  // Reset page relativement aux filtres d'abonnement
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTypePatient, filterBeneficiaire, filterAffectation, filterNbreAbn, filterLibellePack, filterDateDebut, filterPackPrice, filterVersementsInput, filterResteAPayerInput, filterConsoSeances, filterRestantes, filterEtat]);

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredAbnuList.length / itemsPerPage);
  const paginatedAbnuList = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAbnuList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAbnuList, currentPage, itemsPerPage]);

  useEffect(() => {
    if (searchTerm) {
      setActiveRowIndex(paginatedAbnuList.length > 0 ? 0 : -1);
    } else {
      setActiveRowIndex(-1);
    }
  }, [searchTerm, paginatedAbnuList]);

  // Helper matching patient stats labels
  const getWilayaLabel = (code: string | undefined): string => {
    if (!code) return 'Indéterminée';
    const num = parseInt(code, 10);
    if (num === 16) return 'Alger (16)';
    if (num === 31) return 'Oran (31)';
    if (num === 25) return 'Constantine (25)';
    if (num === 9) return 'Blida (09)';
    return `Wilaya ${code}`;
  };

  return (
    <div className="space-y-6" id="abonnements-management-workspace">
      
      {/* TABLEAU DES ABONNEMENTS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-white border-b border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border border-emerald-100">
                Gestion Financière
              </span>
              <span className="text-emerald-500 text-[10px] font-bold">Abonnements &amp; Forfaits</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Suivi des Forfaits &amp; Activité Financière
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pilotez les abonnements actifs, consommations de séances et encaissements cliniques.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl">
              {filteredAbnuList.length} Abonnements
            </span>
            {(searchTerm || filterTypePatient.length > 0 || filterBeneficiaire || filterNbreAbn.length > 0 || filterLibellePack.length > 0 || filterDateDebut || filterPackPrice.length > 0 || filterVersementsInput || filterResteAPayerInput || filterConsoSeances.length > 0 || filterRestantes.length > 0 || filterEtat.length > 0) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterTypePatient([]);
                  setFilterBeneficiaire('');
                  setFilterNbreAbn([]);
                  setFilterLibellePack([]);
                  setFilterDateDebut('');
                  setFilterPackPrice([]);
                  setFilterVersementsInput('');
                  setFilterResteAPayerInput('');
                  setFilterConsoSeances([]);
                  setFilterRestantes([]);
                  setFilterEtat([]);
                }}
                className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl hover:bg-rose-100 transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportConfig(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-500/10 transition cursor-pointer text-[10px] font-black uppercase tracking-wider"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Situation Journalière</span>
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Échelle de taille des caractères en menu déroulant */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200" title="Ajuster la taille des caractères du tableau">
              <label htmlFor="table-scale-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Échelle :
              </label>
              <select
                id="table-scale-select"
                value={tableFontSize}
                onChange={(e) => setTableFontSize(e.target.value as any)}
                className="bg-transparent border-none p-0 text-[10px] font-black text-slate-600 focus:outline-none cursor-pointer min-w-[50px]"
              >
                <option value="100%">100%</option>
                <option value="120%">120%</option>
                <option value="140%">140%</option>
                <option value="160%">160%</option>
                <option value="180%">180%</option>
                <option value="200%">200%</option>
              </select>
            </div>

            <div className="relative group w-full md:w-auto flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="Recherche rapide (patient, forfait)..."
                className="w-full md:w-64 bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveRowIndex((prev) => {
                      if (paginatedAbnuList.length === 0) return -1;
                      return (prev + 1) % paginatedAbnuList.length;
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveRowIndex((prev) => {
                      if (paginatedAbnuList.length === 0) return -1;
                      return (prev - 1 + paginatedAbnuList.length) % paginatedAbnuList.length;
                    });
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (activeRowIndex >= 0 && paginatedAbnuList[activeRowIndex]) {
                      setSelectedAbnPopup(paginatedAbnuList[activeRowIndex]);
                    }
                  } else if (e.key === "Escape") {
                    setActiveRowIndex(-1);
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Global click-outside overlay */}
        {activeFilterMenu && (
          <div 
            className="fixed inset-0 z-20 bg-transparent" 
            onClick={() => setActiveFilterMenu(null)} 
          />
        )}

        {/* Dynamic scaling stylesheet for subscriptions */}
        <style dangerouslySetInnerHTML={{ __html: `
          .scaled-table-subscription {
            --table-scale: ${parseFloat(tableFontSize) / 100};
          }
          .scaled-table-subscription tr { font-size: calc(9px * var(--table-scale)) !important; }
          .scaled-table-subscription td { font-size: calc(9px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[9.5px\\], .scaled-table-subscription .text-\\[9.5px\\], .scaled-table-subscription .text-\\[9.5px\\] { font-size: calc(9.5px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[9px\\] { font-size: calc(9px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[8\\.5px\\] { font-size: calc(8.5px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[8px\\] { font-size: calc(8px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[7\\.5px\\] { font-size: calc(7.5px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[7px\\] { font-size: calc(7px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[6\\.5px\\] { font-size: calc(6.5px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[10px\\] { font-size: calc(10px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[11px\\] { font-size: calc(11px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[12px\\] { font-size: calc(12px * var(--table-scale)) !important; }
          .scaled-table-subscription .text-\\[13px\\] { font-size: calc(13px * var(--table-scale)) !important; }
          .scaled-table-subscription thead tr th { font-size: calc(10px * var(--table-scale)) !important; }
          .scaled-table-subscription thead tr th span { font-size: calc(10px * var(--table-scale)) !important; }
        ` }} />

        <div 
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto relative visible-scrollbar-horizontal pb-4 shadow-sm rounded-xl border border-slate-200 bg-white/50"
        >
          <table className={`w-full text-left border-separate border-spacing-0 scaled-table-subscription min-w-[1250px]`}>
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] font-sans">
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-1 pl-4 w-[40px] text-slate-500 border-b border-slate-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Sél.</th>
                
                {/* 1. Type Patient - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-1 relative group/th min-w-[80px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1">
                    <span>Type</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'type_patient' ? null : 'type_patient');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterTypePatient.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${activeFilterMenu === 'type_patient' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'type_patient' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500">Filtrer par type</span>
                        {filterTypePatient.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterTypePatient([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          const counts = abonnementsWithDetails.reduce((acc, item) => {
                            if (checkMatches(item, 'typePatient')) {
                              const val = item.typePat;
                              acc[val] = (acc[val] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<string, number>);
                          const uniqueVals = Array.from(
                            new Set([
                              ...(dbState.typesPatients || [
                                'Adulte',
                                'Enfant',
                                'Enfant IMC'
                              ]),
                              ...Object.keys(counts)
                            ])
                          ).sort();

                          return uniqueVals.map(val => (
                            <label key={`ab-type-pat-${val}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-medium text-slate-700">
                              <input 
                                type="checkbox"
                                checked={filterTypePatient.includes(val)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterTypePatient([...filterTypePatient, val]);
                                  else setFilterTypePatient(filterTypePatient.filter(v => v !== val));
                                }}
                                className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                              />
                              <span>{val} ({counts[val] || 0})</span>
                            </label>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 2. Bénéficiaire - NON UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-1 relative group/th min-w-[120px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1">
                    <span>Bénéficiaire</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'beneficiaire' ? null : 'beneficiaire');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterBeneficiaire ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'beneficiaire' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'beneficiaire' && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="px-2 pb-2">
                        <label className="block text-[9px] font-bold text-slate-500 mb-1 font-sans">Recherche par nom</label>
                        <input
                          type="text"
                          autoFocus
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                          placeholder="Rechercher..."
                          value={filterBeneficiaire}
                          onChange={(e) => setFilterBeneficiaire(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </th>

                {/* 2.5 Affectation - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-1 relative group/th min-w-[90px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1">
                    <span>Affectation</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'affectation' ? null : 'affectation');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterAffectation.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'affectation' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'affectation' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Service</span>
                        {filterAffectation.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterAffectation([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {(() => {
                           const counts = abonnementsWithDetails.reduce((acc, item) => {
                             if (checkMatches(item, 'affectation')) {
                               const val = item.patientAffectation;
                               acc[val] = (acc[val] || 0) + 1;
                             }
                             return acc;
                           }, {} as Record<string, number>);
                           const uniqueVals = Object.keys(counts).sort();

                           return uniqueVals.map(val => (
                             <label key={`filter-aff-${val}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-medium text-slate-700 font-sans">
                               <input 
                                 type="checkbox"
                                 checked={filterAffectation.includes(val)}
                                 onChange={(e) => {
                                   if (e.target.checked) setFilterAffectation([...filterAffectation, val]);
                                   else setFilterAffectation(filterAffectation.filter(v => v !== val));
                                 }}
                                 className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                               />
                               <span className="truncate flex-1">{val} ({counts[val]})</span>
                             </label>
                           ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 3. Nbre Abn - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center min-w-[65px] relative group/th border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>Abn.</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'nbre_abn' ? null : 'nbre_abn');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterNbreAbn.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'nbre_abn' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'nbre_abn' && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Abonnements</span>
                        {filterNbreAbn.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterNbreAbn([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          const counts = abonnementsWithDetails.reduce((acc, item) => {
                            if (checkMatches(item, 'nbreAbn')) {
                              const val = item.nbreAbn;
                              acc[val] = (acc[val] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<number, number>);
                          const uniqueVals = Object.keys(counts).map(Number).sort((a,b)=>a-b);

                          return uniqueVals.map(val => (
                            <label key={`abn-nbre-ab-${val}`} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] text-slate-700 font-sans">
                              <input 
                                type="checkbox"
                                checked={filterNbreAbn.includes(val)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterNbreAbn([...filterNbreAbn, val]);
                                  else setFilterNbreAbn(filterNbreAbn.filter(v => v !== val));
                                }}
                                className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                              />
                              <span>{val} ({counts[val]})</span>
                            </label>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 4. Libellé Pack - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-1 relative group/th min-w-[120px] border-b border-slate-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between gap-1">
                    <span>Pack / Forfait</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'libelle_pack' ? null : 'libelle_pack');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterLibellePack.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'libelle_pack' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'libelle_pack' && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Forfait</span>
                        {filterLibellePack.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterLibellePack([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {(() => {
                          const counts = abonnementsWithDetails.reduce((acc, item) => {
                            if (checkMatches(item, 'libellePack')) {
                              const val = item.packLabel || 'Aucun';
                              acc[val] = (acc[val] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<string, number>);
                          const uniqueVals = Object.keys(counts).sort();

                          return uniqueVals.map(val => (
                            <label key={`abn-pack-lib-${val}`} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] text-slate-705 font-sans">
                              <input 
                                type="checkbox"
                                checked={filterLibellePack.includes(val)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterLibellePack([...filterLibellePack, val]);
                                  else setFilterLibellePack(filterLibellePack.filter(v => v !== val));
                                }}
                                className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                              />
                              <span className="truncate max-w-[130px]">{val} ({counts[val]})</span>
                            </label>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 5. Date Début - NON UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 relative group/th min-w-[85px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>Début</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'date_debut' ? null : 'date_debut');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterDateDebut ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'date_debut' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'date_debut' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Date Admission</span>
                        {filterDateDebut && (
                          <button
                            type="button"
                            onClick={() => setFilterDateDebut('')}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <input
                        autoFocus
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={filterDateDebut}
                        onChange={(e) => setFilterDateDebut(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 font-mono text-slate-800 shadow-inner"
                      />
                    </div>
                  )}
                </th>

                {/* 6. Pack Price - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center min-w-[70px] relative group/th border-b border-slate-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>Prix</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'pack_price' ? null : 'pack_price');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterPackPrice.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'pack_price' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'pack_price' && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Tarif Pack</span>
                        {filterPackPrice.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterPackPrice([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(() => {
                           const counts = abonnementsWithDetails.reduce((acc, item) => {
                             if (checkMatches(item, 'packPrice')) {
                               const val = item.packPrice;
                               acc[val] = (acc[val] || 0) + 1;
                             }
                             return acc;
                           }, {} as Record<number, number>);
                           const uniqueVals = Object.keys(counts).map(Number).sort((a,b)=>a-b);

                           return uniqueVals.map(val => (
                             <label key={`abn-pack-p-${val}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-sans">
                               <input 
                                 type="checkbox"
                                 checked={filterPackPrice.includes(val)}
                                 onChange={(e) => {
                                   if (e.target.checked) setFilterPackPrice([...filterPackPrice, val]);
                                   else setFilterPackPrice(filterPackPrice.filter(v => v !== val));
                                 }}
                                 className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                               />
                               <span>{val} DA ({counts[val]})</span>
                             </label>
                           ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 7. Versements - NON UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center relative group/th min-w-[75px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>Versé</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'versements' ? null : 'versements');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterVersementsInput ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'versements' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'versements' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Encaissements</span>
                        {filterVersementsInput && (
                          <button
                            type="button"
                            onClick={() => setFilterVersementsInput('')}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Ex: 4000"
                        value={filterVersementsInput}
                        onChange={(e) => setFilterVersementsInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-indigo-500 font-mono text-slate-800 shadow-inner"
                      />
                    </div>
                  )}
                </th>

                {/* 8. Reste à Payer - NON UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center relative group/th min-w-[75px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>Reste</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'reste_payer' ? null : 'reste_payer');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterResteAPayerInput ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'reste_payer' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'reste_payer' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Reliquat</span>
                        {filterResteAPayerInput && (
                          <button
                            type="button"
                            onClick={() => setFilterResteAPayerInput('')}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Ex: 8000"
                        value={filterResteAPayerInput}
                        onChange={(e) => setFilterResteAPayerInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 font-mono text-slate-800 shadow-inner"
                      />
                    </div>
                  )}
                </th>

                {/* 9. Conso. Séances - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center relative group/th min-w-[80px] border-b border-slate-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>Conso.</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'conso' ? null : 'conso');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterConsoSeances.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'conso' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'conso' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Séances effectuées</span>
                        {filterConsoSeances.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterConsoSeances([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer ({filterConsoSeances.length})
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto p-1 text-slate-700">
                        {(() => {
                          const counts = abonnementsWithDetails.reduce((acc, item) => {
                            if (checkMatches(item, 'consoSeances')) {
                              const val = item.abn.Nbre_Sean_Consom_Abn;
                              acc[val] = (acc[val] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<number, number>);
                          const uniqueVals = Object.keys(counts).map(Number).sort((a,b)=>a-b);

                          return uniqueVals.map(val => (
                            <label key={`abn-conso-${val}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-sans">
                              <input 
                                type="checkbox"
                                checked={filterConsoSeances.includes(val)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterConsoSeances([...filterConsoSeances, val]);
                                  else setFilterConsoSeances(filterConsoSeances.length > 1 ? filterConsoSeances.filter(v => v !== val) : []);
                                }}
                                className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                              />
                              <span>{val} ({counts[val]})</span>
                            </label>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 10. Restante(s) - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center min-w-[70px] border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>S. Rest.</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'restantes' ? null : 'restantes');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterRestantes.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'restantes' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'restantes' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Reliquat séances</span>
                        {filterRestantes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterRestantes([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto p-1 text-slate-700">
                        {(() => {
                          const counts = abonnementsWithDetails.reduce((acc, item) => {
                            if (checkMatches(item, 'restantes')) {
                              const val = item.remainingSessions;
                              acc[val] = (acc[val] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<number, number>);
                          const uniqueVals = Object.keys(counts).map(Number).sort((a,b)=>a-b);

                          return uniqueVals.map(val => (
                            <label key={`abn-restantes-${val}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-sans">
                              <input 
                                type="checkbox"
                                checked={filterRestantes.includes(val)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterRestantes([...filterRestantes, val]);
                                  else setFilterRestantes(filterRestantes.filter(v => v !== val));
                                }}
                                className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                              />
                              <span>{val} ({counts[val]})</span>
                            </label>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>

                {/* 11. État - UNIFORME */}
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center min-w-[70px] border-b border-slate-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span>État</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterMenu(activeFilterMenu === 'etat' ? null : 'etat');
                      }}
                      className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterEtat.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <ChevronDown className={`w-2 h-2 transition-transform ${activeFilterMenu === 'etat' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {activeFilterMenu === 'etat' && (
                    <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                        <span className="text-[10px] font-bold text-slate-500 font-sans">Statut</span>
                        {filterEtat.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterEtat([])}
                            className="text-[9px] font-bold text-rose-500 hover:underline"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          const counts = abonnementsWithDetails.reduce((acc, item) => {
                            if (checkMatches(item, 'etat')) {
                              const val = item.stateVal;
                              acc[val] = (acc[val] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<string, number>);
                          const uniqueVals = Object.keys(counts).sort();

                          return uniqueVals.map(val => (
                            <label key={`filter-etat-abn-${val}`} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] text-slate-700 font-sans">
                              <input 
                                type="checkbox"
                                checked={filterEtat.includes(val)}
                                onChange={(e) => {
                                  if (e.target.checked) setFilterEtat([...filterEtat, val]);
                                  else setFilterEtat(filterEtat.filter(v => v !== val));
                                }}
                                className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                              />
                              <span>{val === 'Actif' ? 'Actif' : 'Fermé'} ({counts[val]})</span>
                            </label>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </th>
                
                <th className="sticky top-0 z-30 bg-slate-50 py-1.5 px-0.5 text-center min-w-[70px] border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAbnuList.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-slate-400 italic font-medium">
                    Aucun abonnement trouvé correspondant aux filtres actifs.
                  </td>
                </tr>
              ) : (
                paginatedAbnuList.map((abn, idx) => {
                  const patient = dbState.patients.find(p => p.ID_Patient === abn.ID_Patient);
                  const pack = dbState.packs ? dbState.packs.find(k => k.ID_Pack === abn.ID_Pack) : null;
                  const totalSessions = pack?.Nbre_Seance_Pack ?? 10;
                  const packPrice = pack?.Prix_Pack ?? 1200;
                  
                  const associatedVersements = dbState.versements.filter(v => v.ID_Abn === abn.ID_Abn);
                  const totalPaidAmount = associatedVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
                  const remainingToPay = packPrice - totalPaidAmount;
                  const remainingSessions = totalSessions - abn.Nbre_Sean_Consom_Abn;

                  const isChecked = checkedAbnIds.includes(abn.ID_Abn);
                  const patientAffectation = patient ? getPatientAffectation(patient) : 'N/A';

                  return (
                    <tr
                      key={abn.ID_Abn}
                      onClick={() => setSelectedAbnPopup(abn)}
                      className={`border-b border-slate-100/75 hover:bg-slate-50/55 transition text-slate-855 duration-75 text-[11px] cursor-pointer group ${
                        idx === activeRowIndex
                          ? "bg-indigo-600! text-white! font-bold shadow-md outline-hidden scale-[1.005] ring-2 ring-indigo-500"
                          : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/30'
                      } ${abn.Etat === 'Fermé' ? 'opacity-80 grayscale-[20%]' : ''}`}
                    >
                      <td className="py-2.5 px-2 pl-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setCheckedAbnIds([...checkedAbnIds, abn.ID_Abn]);
                              else setCheckedAbnIds(checkedAbnIds.filter(id => id !== abn.ID_Abn));
                            }}
                            className="h-5 w-5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer accent-indigo-650"
                          />
                          {isChecked && (
                            <button
                              onClick={(e) => handleDeleteAbonnement(abn.ID_Abn, e)}
                              className="p-1 px-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition shadow-sm border border-rose-200"
                              title="Révoquer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-0.5 text-center">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-black border ${
                          patient?.type_patient === 'Adulte' 
                            ? 'bg-slate-50 text-slate-600 border-slate-200' 
                            : patient?.type_patient === 'Enfant' 
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        }`}>
                          {patient?.type_patient === 'Enfant IMC' ? 'E-IMC' : patient?.type_patient === 'Adulte' ? 'AD.' : 'ENF.'}
                        </span>
                      </td>
                      <td 
                        className="py-2.5 px-1 font-bold text-indigo-700 hover:text-indigo-900 transition cursor-pointer truncate max-w-[120px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientForDetail(patient);
                        }}
                      >
                        👤 {patient?.Nom_Patient || 'ID_'+abn.ID_Patient}
                      </td>
                      <td className="py-2.5 px-1 text-slate-500 font-bold text-[10px] truncate max-w-[85px]">
                        {patientAffectation}
                      </td>
                      <td className="py-2.5 px-0.5 text-center font-mono">
                        <span className="inline-block bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 font-black text-[9.5px]">
                          {patient?.Nbre_Abn_Pat ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-1.5 font-medium text-slate-700 text-[10px] truncate max-w-[120px]">
                        {pack?.Libelle_Pack || 'Forfait'}
                      </td>
                      <td className="py-2.5 px-0.5 text-slate-500 font-bold font-mono text-[9.5px] whitespace-nowrap text-center">
                        {abn.Date_Debut_Abn}
                      </td>
                      <td className="py-2.5 px-0.5 text-center font-mono font-bold text-slate-600 text-[10px]">
                        {packPrice.toLocaleString('fr-FR')} DA
                      </td>
                      <td className="py-2.5 px-0.5 text-center font-mono tracking-tight font-black text-emerald-600 text-[10.5px]">
                        {totalPaidAmount.toLocaleString('fr-FR')} DA
                      </td>
                      <td className={`py-2.5 px-0.5 text-center font-mono tracking-tight font-black text-[10.5px] ${remainingToPay > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                        {remainingToPay > 0 ? `${remainingToPay.toLocaleString('fr-FR')} DA` : '0 DA'}
                      </td>
                      <td className="py-2.5 px-0.5 text-center font-bold text-slate-600 text-[10px]">
                        <span className="text-indigo-700 font-black">{abn.Nbre_Sean_Consom_Abn}</span>
                        <span className="text-slate-300 text-[8.5px] mx-0.5">/</span>
                        <span className="text-slate-400 font-medium">{totalSessions}</span>
                      </td>
                      <td className="py-2.5 px-0.5 text-center">
                        <span className={`inline-block w-6 py-0.5 rounded font-black font-mono text-[10px] ${
                          remainingSessions > 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-rose-500 text-white'
                        }`}>
                          {remainingSessions}
                        </span>
                      </td>
                      <td className="py-2.5 px-0.5 text-center">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-black uppercase border leading-none ${
                          abn.Etat === 'Fermé'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : isAbonnementGele(abn, dbState)
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {abn.Etat === 'Fermé' ? 'Ferm.' : isAbonnementGele(abn, dbState) ? 'Gelé' : 'Ouv.'}
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVersementAbnId(abn.ID_Abn);
                            setPaymentAmount(remainingToPay.toString());
                          }}
                          className={`${
                            remainingToPay > 0 
                              ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95' 
                              : 'bg-slate-300 cursor-not-allowed opacity-40'
                          } text-white px-1 py-0.5 rounded text-[7.5px] font-black transition flex items-center justify-center gap-0.5 mx-auto uppercase tracking-tighter shadow-xs`}
                          disabled={remainingToPay <= 0}
                        >
                          💵 Pay.
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barre de défilement intelligente & Sticky en bas de l'écran */}
        <div 
          ref={stickyScrollRef}
          onScroll={handleStickyScroll}
          className="overflow-x-auto overflow-y-hidden sticky bottom-0 z-40 bg-slate-100/90 backdrop-blur-xs border-y border-slate-200 h-3 shadow-md flex items-center md:hidden-scrollbar"
          style={{ position: 'sticky', bottom: 1 }}
        >
          <div style={{ width: `${tableScrollWidth}px`, height: '1px' }} />
        </div>
      </div>

      {/* PAGINATION ZONE POUR LES ABONNEMENTS */}
      {totalPages >= 1 && (
        <div className="bg-white px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 rounded-2xl shadow-sm text-xs font-sans mt-4">
          <div className="text-slate-500 font-medium">
            Affichage de{" "}
            <span className="font-semibold text-slate-800">
              {filteredAbnuList.length === 0 ? 0 : Math.min(
                filteredAbnuList.length,
                (currentPage - 1) * itemsPerPage + 1,
              )}
            </span>{" "}
            à{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(
                filteredAbnuList.length,
                currentPage * itemsPerPage,
              )}
            </span>{" "}
            sur{" "}
            <span className="font-semibold text-slate-800">
              {filteredAbnuList.length}
            </span>{" "}
            abonnements ({totalPages} {totalPages > 1 ? "pages" : "page"})
          </div>

          <div className="flex items-center justify-center">
            <div 
              className="inline-flex rounded-xl shadow-2xs bg-slate-50 p-1 border border-slate-200 gap-1 flex-wrap justify-center"
              id="abonnements-aligned-10-btn-pagination"
            >
              {/* 1er Bouton "Précédant" */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border border-transparent hover:border-slate-300 disabled:opacity-40 disabled:hover:border-transparent cursor-pointer disabled:cursor-not-allowed select-none bg-white text-slate-700 shadow-3xs"
                id="abonnements-pg-btn-prev"
              >
                Précédant
              </button>

              {/* 8 boutons numérotés de page (boutons 2 à 9) */}
              {(() => {
                const maxPagesToShow = 8;
                let startPage = 1;
                let endPage = Math.min(maxPagesToShow, totalPages || 1);

                if ((totalPages || 1) > maxPagesToShow) {
                  if (currentPage <= 4) {
                    startPage = 1;
                    endPage = 8;
                  } else if (currentPage + 4 >= totalPages) {
                    startPage = totalPages - 7;
                    endPage = totalPages;
                  } else {
                    startPage = currentPage - 3;
                    endPage = currentPage + 4;
                  }
                }

                const pageSlots = [];
                for (let p = startPage; p <= endPage; p++) {
                  pageSlots.push({ page: p, label: String(p), isDisabled: false });
                }

                // Remplissage si moins de 8 pages pour conserver exactement 10 boutons alignés
                while (pageSlots.length < maxPagesToShow) {
                  pageSlots.push({ page: -1, label: "-", isDisabled: true });
                }

                return pageSlots.map((slot, index) => (
                  <button
                    key={`abonnements-pg-slot-${index}`}
                    type="button"
                    onClick={() => !slot.isDisabled && setCurrentPage(slot.page)}
                    disabled={slot.isDisabled}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[32px] text-center border ${
                      slot.isDisabled 
                        ? "bg-slate-100 border-transparent text-slate-300 cursor-not-allowed select-none"
                        : currentPage === slot.page
                          ? "bg-indigo-600 border-indigo-600 text-white font-black shadow-xs shrink-0 scale-102"
                          : "bg-white border-slate-250 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    }`}
                    id={`abonnements-pg-btn-slot-${index + 1}`}
                  >
                    {slot.label}
                  </button>
                ));
              })()}

              {/* 10ème Bouton "Suivant" */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border border-transparent hover:border-slate-300 disabled:opacity-40 disabled:hover:border-transparent cursor-pointer disabled:cursor-not-allowed select-none bg-white text-slate-700 shadow-3xs"
                id="abonnements-pg-btn-next"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED DIALOG: SPILTPANE WITH TOP BASE PATIENT DATA AND BOTTOM SECTOR LAYOUT */}
      <AnimatePresence>
        {selectedAbnPopup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl w-full max-w-5xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div style={{ backgroundColor: '#606C5A' }} className="text-white p-5 flex justify-between items-center shrink-0 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl">
                    <Split className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Fiche de Synthèse d'Abonnement</h3>
                    <p className="text-[10px] text-slate-300 font-mono">ABONNEMENT: ABN_#0{selectedAbnPopup.ID_Abn} • État : {selectedAbnPopup.Etat || 'Actif'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAbnPopup(null)}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-red-900 text-white hover:text-white rounded-lg transition font-black text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 1. TOP: Patient Identity & Physiological Data */}
              {(() => {
                const patient = dbState.patients.find(p => p.ID_Patient === selectedAbnPopup.ID_Patient);
                const pack = dbState.packs ? dbState.packs.find(p => p.ID_Pack === selectedAbnPopup.ID_Pack) : null;
                const packPrice = pack?.Prix_Pack ?? 1200;
                
                const associatedVersements = dbState.versements.filter(v => v.ID_Abn === selectedAbnPopup.ID_Abn);
                const totalPaidAmount = associatedVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
                const remaining = packPrice - totalPaidAmount;

                const sessions = dbState.seances.filter(s => s.ID_Abn === selectedAbnPopup.ID_Abn);

                if (!patient) return null;

                return (
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* Top Identity Grid card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-indigo-900 mb-3">Identification clinique de l'assuré</span>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs font-semibold">
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans">Nom Patient</span>
                          <p 
                            className="text-indigo-700 hover:text-indigo-900 transition cursor-pointer font-black text-xs underline decoration-dotted"
                            title="Cliquer pour afficher la fiche détaillée du patient"
                            onClick={() => {
                              setSelectedPatientForDetail(patient);
                            }}
                          >
                            {patient.Nom_Patient}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans">Prénom Patient</span>
                          <p className="text-slate-900 font-bold">Bénéficiaire</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans">Âge</span>
                          <p className="text-slate-900 font-black font-mono">{patient.Age_Patient || 30} ans</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans">Wilaya</span>
                          <p className="text-slate-900">{getWilayaLabel(patient.wilaya)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans">Téléphone</span>
                          <p className="text-slate-900 font-mono text-xs">{patient.phone || 'Aucun'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans">Type Patient</span>
                          <span className="inline-block bg-indigo-50 text-indigo-850 px-2 py-0.5 rounded text-[10px] font-black border border-indigo-200 mt-0.5">
                            {patient.type_patient}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Change active status actions */}
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Statut Administratif :</span>
                      <button
                        type="button"
                        onClick={() => handleToggleEtatAbonnement(selectedAbnPopup.ID_Abn, 'Actif')}
                        className={`px-3 py-1 text-[10.5px] font-bold rounded-lg border transition ${
                          selectedAbnPopup.Etat !== 'Fermé'
                            ? 'bg-emerald-600 text-white border-transparent shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Actif (Dépouiller crédits)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEtatAbonnement(selectedAbnPopup.ID_Abn, 'Fermé')}
                        className={`px-3 py-1 text-[10.5px] font-bold rounded-lg border transition ${
                          selectedAbnPopup.Etat === 'Fermé'
                            ? 'bg-rose-600 text-white border-transparent shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        🔒 Fermer (Archiver)
                      </button>
                    </div>

                    {/* 2. BOTTOM: SPLITPANE WRAPPER */}
                    <div 
                      id="split-pane-container" 
                      className="border border-slate-200 rounded-3xl overflow-hidden flex flex-row relative h-[380px] bg-slate-100/50"
                    >
                      {/* LEFT PANEL: ENREGISTRER UN VERSEMENT */}
                      <div 
                        className="bg-white overflow-y-auto p-5 space-y-4"
                        style={{ width: `${splitWidth}%` }}
                      >
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-indigo-550" />
                            <h4 className="font-sans font-black text-xs text-slate-800 uppercase tracking-wide">Journal des versements</h4>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">Total Versé: {totalPaidAmount} / {packPrice} DA</span>
                        </div>

                        {/* List existing versements */}
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {associatedVersements.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">Aucun versement historique n'a encore été rattaché.</p>
                          ) : (
                            associatedVersements.map((v, idx) => (
                              <div key={`vers-${v.ID_Vers}-${idx}`} className="flex justify-between items-center bg-slate-50 border p-2.5 rounded-lg text-[10.5px] font-mono font-medium">
                                <div>
                                  <span className="font-extrabold text-slate-855 block">+{v.Mont_Vers} DA</span>
                                  <span className="text-[8px] text-slate-400 block">{v.Date_Vers}</span>
                                </div>
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[8.5px] uppercase font-black font-sans">
                                  REÇU #0{v.ID_Vers}
                                </span>
                              </div>
                            ))
                          )}
                        </div>


                      </div>

                      {/* SPLIT BAR / DRAGGABLE SEPARATOR */}
                      <div 
                        onMouseDown={startResizingSplit}
                        className="w-1.5 hover:w-2 bg-slate-300 hover:bg-indigo-505 cursor-col-resize shrink-0 transition-colors z-10 flex items-center justify-center relative touch-none"
                        style={{ userSelect: 'none' }}
                        title="Glissez pour redimensionner"
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-450 rounded-full" />
                      </div>

                      {/* RIGHT PANEL: SEANCES */}
                      <div 
                        className="bg-white overflow-y-auto p-5 space-y-4"
                        style={{ width: `${100 - splitWidth}%` }}
                      >
                        <div className="flex items-center gap-1.5 border-b pb-2">
                          <ListCollapse className="w-4 h-4 text-indigo-550" />
                          <h4 className="font-sans font-black text-xs text-slate-800 uppercase tracking-wide">Registre des séances consommées ({sessions.length})</h4>
                        </div>

                        {sessions.length === 0 ? (
                          <div className="text-center py-10">
                            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-[10.5px] text-slate-400 italic font-semibold">Aucune séance consommée pour le moment.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-[10px]">
                              <thead>
                                <tr className="border-b text-slate-650 font-black uppercase text-[8.5px] tracking-wide font-sans bg-slate-50">
                                  <th className="p-2 pl-3">Date Séance</th>
                                  <th className="p-2">Nature Acte</th>
                                  <th className="p-2 pr-3 text-right">Durée / Heures</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
                                {sessions.map((s, idx) => {
                                  const act = dbState.actes.find(a => a.ID_Acte === s.ID_Acte);
                                  const prat = dbState.praticiens.find(p => p.ID_Prat === s.ID_Prat);
                                  return (
                                    <tr key={`seanc-${s.ID_Seanc}-${idx}`} className="hover:bg-slate-50">
                                      <td className="p-2 pl-3">
                                        <span className="font-mono text-slate-800 font-bold block">{s.Date_Seanc_Realisee}</span>
                                        <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 rounded font-black font-sans uppercase">ID_SEANC_#0{s.ID_Seanc}</span>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-bold text-slate-800 truncate max-w-[105px]">{act?.Libelle_Acte}</div>
                                        <span className="block text-[8.5px] font-extrabold text-indigo-650">Prat : Dr. {prat?.Nom_Prat}</span>
                                      </td>
                                      <td className="p-2 pr-4 text-right font-mono text-indigo-900 text-xs">
                                        {s.H_Debut_Seanc} - {s.H_Fin_Seanc}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL FOR PRINT PAYMENT RECEIPT & PROCESS VERSEMENT */}
      <AnimatePresence>
        {activeVersementAbnId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden text-slate-900"
            >
              {createdVersement ? (
                <div className="p-6 space-y-6" id="print-abonnement-receipt">
                  {/* Print Ready Receipt Header */}
                  <div className="text-center pb-4 border-b border-dashed border-slate-200">
                    <span className="text-[10px] bg-indigo-50 border font-mono px-2 py-0.5 rounded text-indigo-700 uppercase font-black tracking-wider">
                      REÇU DE COMMERCE SÉCURISÉ #ABN_{createdVersement.abnId}
                    </span>
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-widest mt-3 font-sans">
                      CRH REHABILITATION CENTER
                    </h4>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">MESSAOUDI Mhand MPR Services • Alger Centre</p>
                  </div>

                  {/* Receipt items info block */}
                  <div className="bg-slate-50 p-4 rounded-2xl text-[11px] font-semibold space-y-2 border">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date Versement :</span>
                      <span className="font-mono text-slate-900">{createdVersement.dateVers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Réf Versement :</span>
                      <span className="font-mono text-slate-900">N° 0{createdVersement.versId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patient Bénéficiaire :</span>
                      <span className="font-bold text-slate-900">{createdVersement.patientName} ({createdVersement.patientType})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Forfait Souscrit :</span>
                      <span className="font-bold text-indigo-800">{createdVersement.packName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mode Règlement :</span>
                      <span className="font-bold text-slate-900">{createdVersement.modePaiement}</span>
                    </div>

                    <div className="pt-2.5 border-t border-dashed my-2 grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="bg-white border rounded p-1.5">
                        <span className="text-[8px] text-slate-400 block uppercase">Prix Pack</span>
                        <strong className="font-mono text-slate-900">{createdVersement.packPrice} DA</strong>
                      </div>
                      <div className="bg-white border text-indigo-900 rounded p-1.5">
                        <span className="text-[8px] text-indigo-750 block uppercase">Payé Ce Jour</span>
                        <strong className="font-mono text-xs font-black">+{createdVersement.amountPaid} DA</strong>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t text-xs">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Cumul Payé</span>
                        <strong className="text-emerald-850 font-mono font-black">{createdVersement.totalPaidSoFar} DA</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[8px] uppercase">Reste à payer</span>
                        <strong className="text-rose-600 font-mono font-black">{createdVersement.packPrice - createdVersement.totalPaidSoFar} DA</strong>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-end text-[8.5px] text-slate-400">
                      <div>
                        <p className="font-bold uppercase tracking-wider text-[7px] text-slate-500 mb-6">Signature Caissier</p>
                        <p className="italic text-slate-600">Guichet Unique MPR</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold uppercase tracking-wider text-[7px] text-slate-500 mb-6 font-sans">Cachet Clinique</p>
                        <p className="italic font-bold text-indigo-900">Validé Électroniquement</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        triggerToast('Impression en cours...', 'info');
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer text-center"
                    >
                      🖨️ Imprimer Reçu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveVersementAbnId(null);
                        setCreatedVersement(null);
                      }}
                      className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-xl border transition cursor-pointer text-center"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProcessVersement}>
                  <div style={{ backgroundColor: '#606C5A' }} className="text-white p-5 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💵</span>
                      <div>
                        <h3 className="font-bold text-sm">Enregistrer un Versement</h3>
                        <p className="text-[10px] text-indigo-200 font-sans">Enregistrer un règlement d'abonnement.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveVersementAbnId(null)}
                      className="text-white hover:text-red-300 font-extrabold text-sm p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {(() => {
                      const abnMatch = dbState.abonnements.find(a => a.ID_Abn === activeVersementAbnId);
                      if (!abnMatch) return null;

                      // Computed properties
                      const abnVersements = dbState.versements.filter((v: any) => v.ID_Abn === activeVersementAbnId);
                      const totalVerses = abnVersements.reduce((sum: number, v: any) => sum + v.Mont_Vers, 0);
                      
                      const getPackPrice = (packId: number) => {
                        const foundPack = dbState.packs ? dbState.packs.find(p => p.ID_Pack === packId) : null;
                        return foundPack?.Prix_Pack ?? 0;
                      };
                      const price = getPackPrice(abnMatch.ID_Pack);
                      const remaining = price - totalVerses;
                      const pack = dbState.packs ? dbState.packs.find(p => p.ID_Pack === abnMatch.ID_Pack) : null;

                      return (
                        <div className="space-y-4 text-xs font-semibold">
                          {/* 1. Liste des versements existants (Mode Edition) */}
                          <div className="space-y-2">
                            <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider">Versements Effectués (Mode Edition)</label>
                            <div className="space-y-1.5 font-mono">
                              {abnVersements.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic py-2 border-t border-slate-100">Aucun versement enregistré.</p>
                              ) : (
                                abnVersements.map((v: any, idx: number) => (
                                  <div key={`edit-vers-${v.ID_Vers}-${idx}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg group">
                                    {editingVersementId === v.ID_Vers ? (
                                      <div className="flex gap-1 w-full">
                                        <input 
                                          type="number" 
                                          autoFocus
                                          value={editingVersementAmount}
                                          onChange={(e) => setEditingVersementAmount(e.target.value)}
                                          className="flex-1 border p-1 rounded font-bold text-indigo-700 focus:outline-none"
                                        />
                                        <button 
                                          type="button"
                                          onClick={() => handleUpdateVersement(v.ID_Vers)}
                                          className="px-2 py-1 bg-indigo-600 text-white rounded font-bold text-[9px]"
                                        >Ok</button>
                                        <button 
                                          type="button"
                                          onClick={() => setEditingVersementId(null)}
                                          className="px-2 py-1 bg-slate-200 text-slate-600 rounded font-bold text-[9px]"
                                        >X</button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex flex-col">
                                          <span className="font-extrabold text-[#102e3b]">{v.Mont_Vers} DA</span>
                                          <span className="text-[8px] text-slate-400">{v.Date_Vers}</span>
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setEditingVersementId(v.ID_Vers);
                                              setEditingVersementAmount(v.Mont_Vers.toString());
                                            }}
                                            className="p-1 hover:bg-white rounded border shadow-xs" title="Modifier"
                                          >✍️</button>
                                          {versementToDelete === v.ID_Vers ? (
                                            <div className="flex items-center gap-1">
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  handleDeleteVersement(v.ID_Vers);
                                                  setVersementToDelete(null);
                                                }}
                                                className="bg-rose-600 hover:bg-rose-700 text-white px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer shadow-xs transition"
                                              >
                                                Ok
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={() => setVersementToDelete(null)}
                                                className="bg-slate-200 hover:bg-slate-300 text-slate-805 px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer transition"
                                              >
                                                X
                                              </button>
                                            </div>
                                          ) : (
                                            <button 
                                              type="button"
                                              onClick={() => setVersementToDelete(v.ID_Vers)}
                                              className="p-1 hover:bg-red-50 text-red-500 rounded border border-red-100 shadow-xs" title="Supprimer"
                                            >🗑️</button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                            <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Abonnement Référent :</p>
                            <div className="flex justify-between items-center text-slate-855">
                              <span>Forfait : <strong>{pack?.Libelle_Pack || 'Pack de Soins'}</strong></span>
                              <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black">ABN_#0{abnMatch.ID_Abn}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-[10px]">
                              <div className="bg-white border rounded p-1.5">
                                <span className="text-[8px] text-slate-400 block uppercase">Prix Total</span>
                                <strong className="font-mono text-slate-900">{price} DA</strong>
                              </div>
                              <div className="bg-white border rounded p-1.5">
                                <span className="text-[8px] text-slate-400 block uppercase">Déjà Versé</span>
                                <strong className="font-mono text-emerald-800">+{totalVerses} DA</strong>
                              </div>
                              <div className="bg-white border rounded p-1.5">
                                <span className="text-[8px] text-slate-400 block uppercase">Reste</span>
                                <strong className="font-mono text-rose-600">{remaining} DA</strong>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-slate-700 font-black text-[10px] uppercase tracking-wider mb-2">➕ Ajouter un nouveau Versement</p>
                            <div className="space-y-4">
                              <div className="space-y-1 text-left">
                                <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider">Montant à Verser (DA)</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  max={remaining}
                                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                                <p className="text-[9px] text-slate-400">Montant maximum autorisé : {remaining} DA</p>
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider font-sans">Mode de Règlement</label>
                                <select
                                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                >
                                  <option value="Espèces">Espèces</option>
                                  <option value="CCP / Dahabia">CCP / Dahabia</option>
                                  <option value="Chèque">Chèque</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-slate-100 border-t border-slate-200 p-4 flex gap-3 justify-end text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveVersementAbnId(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl transition cursor-pointer text-slate-705"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md cursor-pointer"
                    >
                      ✓ Enregistrer le Paiement
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIGURATION DE LA SITUATION JOURNALIÈRE */}
      <AnimatePresence>
        {showReportConfig && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-300" />
                  <h3 className="font-bold text-sm">Colonnes à afficher sur l'état</h3>
                </div>
                <button 
                  onClick={() => setShowReportConfig(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white font-black"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-[11px] text-slate-500 font-medium">Sélectionnez les colonnes que vous souhaitez faire figurer sur le rapport de situation journalière :</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(reportColumns).map((key) => {
                    const labelMap: Record<string, string> = {
                      type: 'Type Patient',
                      patient: 'Bénéficiaire',
                      nbreAbn: 'Nbre Abn',
                      forfait: 'Libellé Pack',
                      dateDebut: 'Date Début',
                      prix: 'Prix Total',
                      verse: 'Total Versé',
                      reste: 'Reste à Payer',
                      seances: 'Séances (Ratio)',
                      sRest: 'S. Restantes',
                      etat: 'État Abn',
                      affectation: 'Affectation'
                    };
                    return (
                      <label key={key} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-indigo-50 transition cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(reportColumns as any)[key]}
                          onChange={() => setReportColumns({ ...reportColumns, [key]: !(reportColumns as any)[key] })}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700">{labelMap[key]}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setShowReportConfig(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setShowReportConfig(false);
                      setShowDailyReport(true);
                    }}
                    className="flex-[2] px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition"
                  >
                    Générer le Rapport
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NOUVEAU DOSSIER PATIENT (Moved here from PatientsManager) */}
      <AnimatePresence>
        {showAddPatientModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="text-white p-5 flex items-center justify-between" style={{ backgroundColor: '#606C5A' }}>
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm">Nouveau Dossier Patient</h3>
                    <p className="text-[10px] text-white/70">Enregistrement rapide depuis le module Abonnement.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePatient} className="p-6 space-y-4 text-[11px]">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom et Prénom du Patient <strong className="text-rose-500">*</strong></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Messaoudi Slimane"
                      className="flex-1 border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!nom.trim()) return;
                        const res = translateNameToArabic(nom);
                        setNomArb(res.Nom_Pat_Arb);
                        setPrenomArb(res.Pren_Pat_Arb);
                        triggerToast('Traduit avec succès !', 'success');
                      }}
                      className="px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-bold text-[10px]"
                    >
                      Trad.
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-right">اللقب</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold text-right"
                      value={nomArb}
                      onChange={(e) => setNomArb(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-right">الإسم</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold text-right"
                      value={prenomArb}
                      onChange={(e) => setPrenomArb(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Genre</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold focus:ring-indigo-500 text-xs"
                      value={genre}
                      onChange={(e) => {
                        const nextGenre = e.target.value as any;
                        setGenre(nextGenre);
                        if (nextGenre === 'Enfant') {
                          setTypePatient('Enfant');
                          setAffectation('Intensif 3e');
                        } else {
                          setTypePatient('Adulte');
                          setAffectation('Sce Réeducation Adulte');
                        }
                      }}
                    >
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Enfant">Enfant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Type Patient</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold focus:ring-indigo-500 text-xs"
                      value={typePatient}
                      onChange={(e) => setTypePatient(e.target.value)}
                    >
                      {(dbState.typesPatients || ['Adulte', 'Enfant', 'Enfant IMC']).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Affectation</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold bg-indigo-50/50 text-xs"
                      value={affectation}
                      onChange={(e) => setAffectation(e.target.value)}
                    >
                      {genre !== 'Enfant' ? (
                        <>
                          <option value="Sce Réeducation Adulte">Sce Réeducation Adulte</option>
                          <option value="Sce Balnéothérapie">Sce Balnéothérapie</option>
                        </>
                      ) : (
                        <>
                          <option value="Intensif 2e">Intensif 2e</option>
                          <option value="Intensif 3e">Intensif 3e</option>
                          <option value="Intensif 4e">Intensif 4e</option>
                        </>
                      ) }
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">Âge</label>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold font-mono"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition"
                >
                  Créer le Dossier Patient
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: CONFIGURATION DES COLONNES DU RAPPORT */}
      <AnimatePresence>
        {showReportConfig && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-lg w-full flex flex-col"
            >
              {/* Header teal */}
              <div className="bg-teal-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-wider">Configuration du Rapport</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowReportConfig(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Description */}
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Sélectionnez les colonnes à inclure dans votre situation journalière.</p>
                  <p className="text-[10px] text-slate-400">L'état sera généré automatiquement selon votre choix.</p>
                </div>
              </div>

              {/* Grille colonnes */}
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { key: 'type', label: 'Type Patient' },
                  { key: 'patient', label: 'Nom Patient' },
                  { key: 'affectation', label: 'Service/Affect.' },
                  { key: 'nbreAbn', label: 'Nombre Abn.' },
                  { key: 'forfait', label: 'Libellé Pack' },
                  { key: 'dateDebut', label: 'Date Début' },
                  { key: 'prix', label: 'Tarif Pack' },
                  { key: 'verse', label: 'Encaissement' },
                  { key: 'reste', label: 'Reliquat' },
                  { key: 'seances', label: 'Ratio Séances' },
                  { key: 'sRest', label: 'Séanc. Rest.' },
                  { key: 'etat', label: 'Statut/État' },
                ].map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => setReportColumns(prev => ({ ...prev, [col.key]: !prev[col.key as keyof typeof reportColumns] }))}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      reportColumns[col.key as keyof typeof reportColumns]
                        ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {col.label}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      reportColumns[col.key as keyof typeof reportColumns] ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-300'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Bouton */}
              <button 
                type="button"
                onClick={() => {
                  setShowReportConfig(false);
                  setShowDailyReport(true);
                }}
                className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold uppercase text-xs tracking-wider py-3.5 rounded-xl shadow-sm shadow-teal-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] mx-5 mb-5 w-auto"
              >
                <Printer className="w-4 h-4" />
                Générer le Rapport
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: SITUATION JOURNALIÈRE DES ABONNÉS */}
      <AnimatePresence>
        {showDailyReport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Situation Journalière des Abonnés</h3>
                </div>
                <button 
                  onClick={() => setShowDailyReport(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white font-black"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400">Date du rapport</label>
                    <input 
                      type="date"
                      value={dailyReportDate}
                      onChange={(e) => setDailyReportDate(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                    />
                  </div>
                  <button
                    onClick={() => {
                        const style = document.createElement('style');
                        style.innerHTML = `
                          @media print {
                            body * { visibility: hidden; }
                            #daily-subscriber-report-printable, #daily-subscriber-report-printable * { visibility: visible; }
                            #daily-subscriber-report-printable { position: absolute; left: 0; top: 0; width: 100%; border: none; }
                          }
                        `;
                        document.head.appendChild(style);
                        window.print();
                        document.head.removeChild(style);
                    }}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Lancer l'Impression
                  </button>
                </div>

                <div id="daily-subscriber-report-printable" className="p-8 border border-slate-100 rounded-2xl bg-white shadow-sm font-sans">
                  <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-4">
                    <div className="text-left">
                      <h1 className="text-xl font-black text-slate-900">KACEL Santé MPR</h1>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Clinique de Médecine Physique et de Réadaptation</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-black text-indigo-600 uppercase">Situation Journalière des Abonnés</h2>
                      <p className="text-[10px] text-slate-400 font-bold">Impression du {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  <div className="mb-6 flex justify-between items-end">
                    <div>
                      <p className="text-slate-500 font-bold text-xs">Période / Date : <span className="text-slate-900 font-black" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: new Date(dailyReportDate).toLocaleDateString('fr-FR') }} /></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-600">Nombre d'entrées : {filteredAbnuList.length}</p>
                    </div>
                  </div>

                  <table className="w-full text-[9px] border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-50 text-slate-900 uppercase font-black tracking-wider border-b-2 border-slate-400">
                        {reportColumns.type && <th className="border border-slate-400 py-2 px-1">Type</th>}
                        {reportColumns.patient && <th className="border border-slate-400 py-2 px-1">Bénéficiaire</th>}
                        {reportColumns.affectation && <th className="border border-slate-400 py-2 px-1">Service</th>}
                        {reportColumns.nbreAbn && <th className="border border-slate-400 py-2 px-1">Nbre Abn</th>}
                        {reportColumns.forfait && <th className="border border-slate-400 py-2 px-1">Libellé Pack</th>}
                        {reportColumns.dateDebut && <th className="border border-slate-400 py-2 px-1">Date Début</th>}
                        {reportColumns.prix && <th className="border border-slate-400 py-2 px-1">Prix</th>}
                        {reportColumns.verse && <th className="border border-slate-400 py-2 px-1">Versé</th>}
                        {reportColumns.reste && <th className="border border-slate-400 py-2 px-1">Reste</th>}
                        {reportColumns.seances && <th className="border border-slate-400 py-2 px-1">Ratio</th>}
                        {reportColumns.sRest && <th className="border border-slate-400 py-2 px-1 whitespace-nowrap">S. Rest</th>}
                        {reportColumns.etat && <th className="border border-slate-400 py-2 px-1">État</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {filteredAbnuList.length === 0 ? (
                        <tr>
                          <td colSpan={Object.values(reportColumns).filter(Boolean).length} className="text-center py-10 text-slate-400 italic font-medium">Aucun abonnement dans la liste filtrée.</td>
                        </tr>
                      ) : (
                        (() => {
                           let totalPrix = 0;
                           let totalVerse = 0;
                           let totalReste = 0;

                           const rows = filteredAbnuList.map(abn => {
                             const item = abonnementsWithDetails.find(x => x.abn.ID_Abn === abn.ID_Abn);
                             if (!item) return null;

                             totalPrix += item.packPrice;
                             totalVerse += item.totalPaidAmount;
                             totalReste += item.remainingToPay;

                             return (
                               <tr key={`report-abn-${abn.ID_Abn}`} className="hover:bg-slate-50 transition border-b border-slate-300">
                                 {reportColumns.type && <td className="border border-slate-400 py-1.5 px-1 font-bold text-slate-600 text-[8px] text-center" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.typePat) }} />}
                                 {reportColumns.patient && <td className="border border-slate-400 py-1.5 px-2 font-black text-slate-900" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.patientName) }} />}
                                 {reportColumns.affectation && <td className="border border-slate-400 py-1.5 px-1 font-bold text-slate-500 text-[8px] text-center" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.patientAffectation) }} />}
                                 {reportColumns.nbreAbn && <td className="border border-slate-400 py-1.5 px-1 text-center font-bold text-slate-800" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.nbreAbn) }} />}
                                 {reportColumns.forfait && <td className="border border-slate-400 py-1.5 px-2 font-medium text-slate-600" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.packLabel) }} />}
                                 {reportColumns.dateDebut && <td className="border border-slate-400 py-1.5 px-1 text-center font-mono text-slate-500" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(abn.Date_Debut_Abn) }} />}
                                 {reportColumns.prix && <td className="border border-slate-400 py-1.5 px-1 font-mono text-center text-slate-800" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.packPrice) }} />}
                                 {reportColumns.verse && <td className="border border-slate-400 py-1.5 px-1 font-mono font-black text-emerald-800 text-center" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.totalPaidAmount) }} />}
                                 {reportColumns.reste && <td className={`border border-slate-400 py-1.5 px-1 font-mono font-black text-center ${item.remainingToPay > 0 ? 'text-rose-600' : 'text-slate-400'}`} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.remainingToPay) }} />}
                                 {reportColumns.seances && (
                                   <td className="border border-slate-400 py-1.5 px-1 font-bold text-center text-slate-600">
                                     {abn.Nbre_Sean_Consom_Abn}/{item.totalSessions}
                                   </td>
                                 )}
                                 {reportColumns.sRest && <td className="border border-slate-400 py-1.5 px-1 text-center font-black text-indigo-700" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.remainingSessions) }} />}
                                 {reportColumns.etat && <td className="border border-slate-400 py-1.5 px-1 text-center text-[7px] font-black uppercase text-slate-500" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(item.stateVal) }} />}
                               </tr>
                             );
                           });

                           return (
                             <>
                               {rows}
                               <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400 text-[10px]">
                                 <td 
                                    colSpan={[reportColumns.type, reportColumns.patient, reportColumns.affectation, reportColumns.nbreAbn, reportColumns.forfait, reportColumns.dateDebut].filter(Boolean).length} 
                                    className="border border-slate-400 py-2.5 px-3 text-right uppercase tracking-widest text-[10px]"
                                 >
                                   TOTAUX GÉNÉRAUX
                                 </td>
                                 {reportColumns.prix && <td className="border border-slate-400 py-2.5 px-1 font-mono text-center" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(totalPrix) }} />}
                                 {reportColumns.verse && <td className="border border-slate-400 py-2.5 px-1 font-mono text-emerald-800 text-center" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(totalVerse) }} />}
                                 {reportColumns.reste && <td className="border border-slate-400 py-2.5 px-1 font-mono text-rose-700 text-center" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: String(totalReste) }} />}
                                 {[reportColumns.seances, reportColumns.sRest, reportColumns.etat].filter(Boolean).length > 0 && (
                                   <td colSpan={[reportColumns.seances, reportColumns.sRest, reportColumns.etat].filter(Boolean).length} className="border border-slate-400 p-0" />
                                 )}
                               </tr>
                             </>
                           );
                        })()
                      )}
                    </tbody>
                  </table>

                  <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                    <div className="space-y-16">
                      <p className="text-[10px] font-black uppercase border-b border-slate-200 pb-1">Visa de l'Assistante</p>
                      <div className="h-20" />
                    </div>
                    <div className="space-y-16">
                      <p className="text-[10px] font-black uppercase border-b border-slate-200 pb-1">Signature de l'Administration</p>
                      <div className="h-20" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 m-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3 text-right">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-3 py-1.5 rounded bg-rose-650 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPatientForDetail && (
        <PatientDetailsModal
          onClose={() => setSelectedPatientForDetail(null)}
          patient={selectedPatientForDetail}
          abonnements={dbState.abonnements || []}
          packs={dbState.packs || []}
          versements={dbState.versements || []}
          kineApps={[]}
          balneoApps={[]}
          consultationQueue={[]}
          isAdmin={currentUser && (currentUser.Role === 'Admin' || currentUser.Role === 'Administrateur')}
          isEditMode={currentUser && (currentUser.Role === 'Admin' || currentUser.Role === 'Administrateur')}
          currentRole={currentUser?.Role}
          translucentWhite={true}
          dbState={dbState}
          onSave={onSave}
          triggerToast={triggerToast}
          onUpdate={(updatedPatient) => {
            const updatedPatients = (dbState.patients || []).map(p => {
              if (String(p.ID_Patient) === String(updatedPatient.id) || String(p.id) === String(updatedPatient.id)) {
                return {
                  ...p,
                  ...updatedPatient,
                  Nom_Patient: updatedPatient.name.toUpperCase(),
                  Age_Patient: updatedPatient.age,
                };
              }
              return p;
            });
            onSave({
              ...dbState,
              patients: updatedPatients
            });
            setSelectedPatientForDetail(updatedPatient);
            triggerToast("Fiche patient mise à jour avec succès", "success");
          }}
        />
      )}

    </div>
  );
};

export default React.memo(AbonnementManager);
