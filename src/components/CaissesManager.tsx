import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, Calendar, Filter, TrendingUp, TrendingDown, CreditCard, Wallet,
  ArrowDownCircle, ArrowUpCircle, Search, X, ChevronDown, ChevronUp, Eye, Printer
} from 'lucide-react';
import { TODAY_DATE } from '../dbStore';
import { DepenseManager } from './DepenseManager';
import { CaisseDailyReport } from './CaisseDailyReport';

// =============================================================================
// TYPES (mirrored from App.tsx / dbStore)
// =============================================================================
interface Acte {
  ID_Acte: number;
  Libelle_Acte: string;
  Prix_Acte: number;
  Receptionniste_Autorises?: string[];
}

interface Transaction {
  ID_Trans: number;
  Caisse: string;
  Type: string;
  Montant: number;
  Libelle: string;
  ModePaiement: string;
  Date_Trans: string;
  Patient_Nom: string;
  ID_Acte?: number;
  ID_RDV?: number;
  debloquePar?: string;
  debloqueLe?: string;
  statut?: string;
}

interface Patient {
  ID_Patient: number;
  Nom_Patient: string;
  Prenom_Patient?: string;
}

interface Utilisateur {
  ID_User: number;
  Nom_Utilisateur: string;
  Prenom_Utilisateur?: string;
  Role: string;
  Service?: string;
}

interface DatabaseState {
  transactions_caisses?: Transaction[];
  actes?: Acte[];
  patients?: Patient[];
  praticiens?: any[];
  [key: string]: any;
}

interface CaissesManagerProps {
  dbState: DatabaseState;
  currentUser: Utilisateur | null;
  onSave: (state: DatabaseState) => void;
  triggerToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// =============================================================================
// UTILITAIRES
// =============================================================================
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '--/--/----';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateStr?: string): string => {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(amount);
};

const parseTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const hrs = parseInt(parts[0], 10);
  const mins = parseInt(parts[1], 10);
  if (isNaN(hrs) || isNaN(mins)) return null;
  return hrs * 60 + mins;
};

const getDureeStr = (hDebut?: string, hFin?: string) => {
  if (!hDebut || !hFin || hDebut === '-' || hFin === '-') return '-';
  const start = parseTimeToMinutes(hDebut);
  const end = parseTimeToMinutes(hFin);
  if (start === null || end === null) return '-';
  const diff = end - start;
  if (diff < 0) return '-';
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs > 0) {
    return `${hrs}h${String(mins).padStart(2, '0')}`;
  }
  return `${mins} min`;
};

const getServiceLabel = (caisseName?: string, libelle?: string): string => {
  const c = (caisseName || '').toLowerCase();
  const l = (libelle || '').toLowerCase();
  if (c.includes('balnéo') || c.includes('balneo')) return 'Balnéo';
  if (c.includes('rééduc') || c.includes('reeduc')) return 'Rééducation';
  if (c.includes('rdc') || c.includes('mpr')) return 'MPR';
  if (c.includes('abonnement')) return 'Abonnement';
  
  // Fallback sur le libellé si la caisse est "all" ou inconnue
  if (l.includes('balnéo') || l.includes('balneo')) return 'Balnéo';
  if (l.includes('rééduc') || l.includes('reeduc') || l.includes('ortho') || l.includes('psy')) return 'Rééducation';
  if (l.includes('mpr') || l.includes('consultation')) return 'MPR';
  if (l.includes('abn_#') || l.includes('abonnement')) return 'Abonnement';
  
  return 'MPR'; // Par défaut
};

const normalizeActe = (acte: string): string => {
  const map: Record<string, string> = {
    'balnéo': 'Séances Balnéothérapies',
    'balnéothérapie': 'Séances Balnéothérapies',
    'balnéothérapies': 'Séances Balnéothérapies',
    'séance balnéo': 'Séances Balnéothérapies',
    'séances balnéothérapies': 'Séances Balnéothérapies',
    'consultation mpr': 'Consultation MPR',
    'consultation': 'Consultation MPR',
    'kiné': 'Kinésithérapie',
    'kinesithérapie': 'Kinésithérapie',
  };
  const low = (acte || '').toLowerCase().trim();
  for (const key in map) {
    if (low.includes(key)) {
      return map[key];
    }
  }
  return acte;
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
export const CaissesManager: React.FC<CaissesManagerProps> = ({ dbState, currentUser, onSave, triggerToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(TODAY_DATE);
  const [endDateFilter, setEndDateFilter] = useState(TODAY_DATE);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Recette' | 'Dépense'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [transactionToDebloquer, setTransactionToDebloquer] = useState<Transaction | null>(null);

  const handleConfirmDebloquer = () => {
    if (!transactionToDebloquer) return;
    const t = transactionToDebloquer;

    const freshState = {
      ...dbState,
      transactions_caisses: [...(dbState.transactions_caisses || [])],
      rendezVous: [...(dbState.rendezVous || [])],
      seances: [...(dbState.seances || [])],
      abonnements: [...(dbState.abonnements || [])],
      fileAttente: [...(dbState.fileAttente || [])],
      fileAttenteIMC: [...(dbState.fileAttenteIMC || [])],
      factures: [...(dbState.factures || [])],
      notifications: [...(dbState.notifications || [])],
    };

    // 1. SUPPRIMER la transaction d'encaissement d'origine
    freshState.transactions_caisses = freshState.transactions_caisses.filter(
      trans => trans.ID_Trans !== t.ID_Trans
    );

    const adminName = currentUser ? `${currentUser.Prenom_Utilisateur || ''} ${currentUser.Nom_Utilisateur}`.trim() : 'Admin';

    // 2. Remettre la séance / le rendez-vous en "Planifié" (Non Réglée)
    if (t.ID_RDV) {
      const rdvId = t.ID_RDV;
      const rdvIdx = freshState.rendezVous.findIndex(r => r.ID_RDV === rdvId);
      if (rdvIdx !== -1) {
        const originalRDV = freshState.rendezVous[rdvIdx];
        freshState.rendezVous[rdvIdx] = {
          ...originalRDV,
          Statut_RDV: 'Planifié' as any,
          debloquePar: adminName,
          debloqueLe: new Date().toISOString()
        };

        const seanceIdx = freshState.seances.findIndex(s => s.ID_RDV === rdvId);
        if (seanceIdx !== -1) {
          const seance = freshState.seances[seanceIdx];
          if (seance.ID_Abn) {
            const abnIdx = freshState.abonnements.findIndex(abn => abn.ID_Abn === seance.ID_Abn);
            if (abnIdx !== -1) {
              freshState.abonnements[abnIdx] = {
                ...freshState.abonnements[abnIdx],
                Nbre_Sean_Consom_Abn: Math.max(0, freshState.abonnements[abnIdx].Nbre_Sean_Consom_Abn - 1)
              };
            }
          }
          freshState.seances = freshState.seances.filter(s => s.ID_RDV !== rdvId);
        }
      }
    }

    // 3. Traiter la file d'attente
    const ticketMatch = t.Libelle.match(/Ticket\s+(T-\d+)/i);
    if (ticketMatch && ticketMatch[1]) {
      const ticketNum = ticketMatch[1];
      const qIdx = freshState.fileAttente.findIndex(q => q.Num_Ticket === ticketNum);
      if (qIdx !== -1) {
        freshState.fileAttente[qIdx] = {
          ...freshState.fileAttente[qIdx],
          Regle: false,
          Statut_Attente: 'En Attente',
          debloquePar: adminName,
          debloqueLe: new Date().toISOString()
        };
      }
    } else {
      const qIdx = freshState.fileAttente.findIndex(q => 
        q.Regle && 
        q.Date_File === t.Date_Trans &&
        freshState.patients?.some(p => p.ID_Patient === q.ID_Patient && `${p.Nom_Patient}`.toLowerCase().trim().includes(t.Patient_Nom.toLowerCase().trim()))
      );
      if (qIdx !== -1) {
        freshState.fileAttente[qIdx] = {
          ...freshState.fileAttente[qIdx],
          Regle: false,
          Statut_Attente: 'En Attente',
          debloquePar: adminName,
          debloqueLe: new Date().toISOString()
        };
      }
    }

    // 4. Traiter la file d'attente IMC
    const imcTicketMatch = t.Libelle.match(/Ticket\s*#(\d+)/i);
    let qImcIdx = -1;
    if (imcTicketMatch && imcTicketMatch[1]) {
      const idFile = parseInt(imcTicketMatch[1]);
      qImcIdx = freshState.fileAttenteIMC.findIndex(q => q.ID_File === idFile);
    }

    if (qImcIdx === -1) {
      qImcIdx = freshState.fileAttenteIMC.findIndex(q => 
        q.Regle && 
        q.Date_File === t.Date_Trans &&
        freshState.patients?.some(p => p.ID_Patient === q.ID_Patient && 
          (t.Patient_Nom.toLowerCase().trim().includes(p.Nom_Patient.toLowerCase().trim()) || 
           p.Nom_Patient.toLowerCase().trim().includes(t.Patient_Nom.toLowerCase().trim()))
        )
      );
    }

    if (qImcIdx !== -1) {
      freshState.fileAttenteIMC[qImcIdx] = {
        ...freshState.fileAttenteIMC[qImcIdx],
        Regle: false,
        Statut_Attente: 'En Attente',
        debloquePar: adminName,
        debloqueLe: new Date().toISOString()
      };
    }

    // 5. Traiter la facture correspondante s'il y en a une
    if (freshState.factures) {
      const factId = t.ID_Trans >= 1000 ? Math.floor(t.ID_Trans / 1000) : null;
      if (factId) {
        const fIdx = freshState.factures.findIndex((f: any) => f.ID_Facture === factId);
        if (fIdx !== -1) {
          freshState.factures[fIdx] = {
            ...freshState.factures[fIdx],
            Statut: 'Annulée' as any,
            debloquePar: adminName,
            debloqueLe: new Date().toISOString()
          };
        }
      }
    }

    // 6. Créer et envoyer la notification persistante pour la réceptionniste
    const patientDisplayName = t.Patient_Nom_Complet || t.Patient_Nom;
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      destinataire: 'receptionniste',
      type: 'seance_debloquee',
      message: `Séance de ${patientDisplayName} réinitialisée par l'admin. Vous pouvez maintenant la modifier ou l'annuler.`,
      date: new Date().toISOString(),
      lue: false,
    };
    freshState.notifications.push(newNotif);

    // 7. Enregistrer le log d'audit
    if (!freshState.action_logs) {
      freshState.action_logs = [];
    }
    freshState.action_logs.push({
      id: `log-${Date.now()}`,
      action: 'REINITIALISER_SEANCE',
      admin: adminName,
      date: new Date().toISOString(),
      details: {
        patient: patientDisplayName,
        acte: t.Acte_Label || t.Libelle,
        montant: t.Montant_Acte || t.Montant,
        transactionId: t.ID_Trans
      }
    });

    onSave(freshState);
    triggerToast(
      `Séance de ${patientDisplayName} réinitialisée par l'admin. Vous pouvez maintenant la modifier ou l'annuler.`,
      'warning'
    );
    setTransactionToDebloquer(null);
  };

  // États de filtres par colonne en multi-sélection
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({
    Date_Acte: [],
    Patient_Nom_Complet: [],
    Acte_Label: [],
    Heure_Debut: [],
    Heure_Fin: [],
    Duree: [],
    Montant_Acte: [],
    Versement_Caisse: [],
    Reste_A_Payer: [],
    Remise_Abn: [],
    Service_Origine: []
  });

  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null);

  const getDisplayValue = useCallback((t: any, colKey: string): string => {
    const val = t[colKey];
    if (colKey === 'Date_Acte') {
      return formatDate(val);
    }
    if (colKey === 'Montant_Acte' || colKey === 'Versement_Caisse' || colKey === 'Reste_A_Payer' || colKey === 'Remise_Abn') {
      if (typeof val === 'number') return String(val);
      return String(val || 0);
    }
    return String(val || '-');
  }, []);

  // Modes de paiement uniques pour le filtre de colonne
  const uniqueModes = useMemo(() => {
    const all = Array.isArray(dbState.transactions_caisses) ? dbState.transactions_caisses : [];
    const modes = new Set(all.map(t => t.ModePaiement).filter(Boolean));
    return Array.from(modes);
  }, [dbState.transactions_caisses]);

  // Rôle utilisateur
  const userRole = currentUser?.Role || '';
  const isRDC = userRole === 'Receptionniste RDC' || userRole === 'Receptionniste';
  const isBalneo = userRole === 'Receptionniste Balnéothérapie' || userRole === 'Receptionniste Balneotherapie' || userRole === 'Receptionniste Balneo' || userRole === 'Receptionniste Balnéo';
  const isReeduc = userRole === 'Receptionniste Réeducation' || userRole === 'Receptionniste Rééducation';
  const isAdmin = userRole === 'Admin' || userRole === 'Assistant';

  const getCaissesForRole = (role: string) => {
    const isR = role === 'Receptionniste RDC' || role === 'Receptionniste';
    const isB = role === 'Receptionniste Balnéothérapie' || role === 'Receptionniste Balneotherapie' || role === 'Receptionniste Balneo' || role === 'Receptionniste Balnéo';
    const isRe = role === 'Receptionniste Réeducation' || role === 'Receptionniste Rééducation';
    const isA = role === 'Admin' || role === 'Assistant';

    if (isA) {
      return [
        { id: 'all', label: 'Toutes' },
        { id: 'Caisse Abonnement / Autres Soins', label: 'Caisse Abonnement' },
        { id: 'Caisse RDC', label: 'Caisse RDC' },
        { id: 'Caisse Sce Balnéothérapie', label: 'Balnéothérapie' },
        { id: 'Caisse Rééducation', label: 'Rééducation' }
      ];
    }
    if (isR) {
      return [{ id: 'Caisse RDC', label: 'Caisse RDC' }];
    }
    if (isB) {
      return [{ id: 'Caisse Sce Balnéothérapie', label: 'Caisse Balnéo' }];
    }
    if (isRe) {
      return [{ id: 'Caisse Rééducation', label: 'Rééducation' }];
    }
    return [
      { id: 'Caisse RDC', label: 'Caisse RDC' },
      { id: 'Caisse Sce Balnéothérapie', label: 'Caisse Balnéo' },
      { id: 'Caisse Rééducation', label: 'Rééducation' }
    ];
  };

  // État de sélection de caisse pour l'Admin (permet de filtrer toutes les caisses ou de se focaliser sur une)
  const [selectedCaisse, setSelectedCaisse] = useState<any>(() => {
    if (isRDC) return 'Caisse RDC';
    if (isBalneo) return 'Caisse Sce Balnéothérapie';
    if (isReeduc) return 'Caisse Rééducation';
    return 'all';
  });

  useEffect(() => {
    if (isRDC) {
      setSelectedCaisse('Caisse RDC');
    } else if (isBalneo) {
      setSelectedCaisse('Caisse Sce Balnéothérapie');
    } else if (isReeduc) {
      setSelectedCaisse('Caisse Rééducation');
    } else {
      setSelectedCaisse('all');
    }
  }, [userRole, isRDC, isBalneo, isReeduc]);

  // ---------------------------------------------------------------------------
  // Enrichissement des transactions avec toutes les métadonnées calculées
  // ---------------------------------------------------------------------------
  const enrichedTransactions = useMemo(() => {
    const all = Array.isArray(dbState.transactions_caisses) ? dbState.transactions_caisses : [];
    
    return all.map((t) => {
      // 1. Liaison Rendez-vous
      const rdv = t.ID_RDV ? dbState.rendezVous?.find(r => r.ID_RDV === t.ID_RDV) : null;
      
      // 2. Liaison Abonnement
      let abn = null;
      const abnIdMatch = t.Libelle?.match(/ABN_#0*(\d+)/i);
      if (abnIdMatch) {
        const abnId = parseInt(abnIdMatch[1], 10);
        abn = dbState.abonnements?.find(a => a.ID_Abn === abnId);
      }

      // 3. Date d'acte
      let dateActe = t.Date_Trans;
      if (rdv && rdv.Date_RDV) {
        dateActe = rdv.Date_RDV;
      } else if (abn && abn.Date_Debut_Abn) {
        dateActe = abn.Date_Debut_Abn;
      }

      // 4. Patient Nom
      const patientNom = t.Patient_Nom || "-";

      // 5. Acte (Désignation)
      let acteLabel = "-";
      if (rdv) {
        const act = dbState.actes?.find(a => a.ID_Acte === rdv.ID_Acte);
        if (act) acteLabel = act.Libelle_Acte;
      } else if (abn) {
        const pack = dbState.packs?.find(p => p.ID_Pack === abn.ID_Pack);
        if (pack) acteLabel = pack.Libelle_Pack;
      }
      if (acteLabel === "-") {
        const matchType = t.Libelle?.match(/\(([^)]+)\)/);
        if (matchType) {
          acteLabel = matchType[1];
        } else {
          let cleanLib = t.Libelle || "-";
          cleanLib = cleanLib.replace(/^Règlement Ticket T-\d+\s*\(([^)]+)\)$/i, '$1');
          cleanLib = cleanLib.replace(/^Règlement Balnéo - .*$/i, 'Séances Balneothérapies');
          cleanLib = cleanLib.replace(/^Règlement Ticket (T-\d+)\s*$/i, 'Consultation');
          acteLabel = cleanLib;
        }
      }
      acteLabel = normalizeActe(acteLabel);

      // 6. Heure Début / Fin / Durée
      const heureDebut = rdv ? (rdv.H_Debut_RDV || "-") : "-";
      const heureFin = rdv ? (rdv.H_Fin_RDV || "-") : "-";
      const duree = getDureeStr(heureDebut, heureFin);

      // 7. Montant de l'acte (théorique)
      let montantActe = t.Montant; // Fallback
      if (rdv) {
        const act = dbState.actes?.find(a => a.ID_Acte === rdv.ID_Acte);
        if (act) montantActe = act.Prix_Acte;
      } else if (abn) {
        const pack = dbState.packs?.find(p => p.ID_Pack === abn.ID_Pack);
        if (pack) {
          montantActe = pack.Prix_Pack;
        }
      } else {
        const matchedActe = dbState.actes?.find(a => a.Libelle_Acte === acteLabel || t.Libelle?.includes(a.Libelle_Acte));
        if (matchedActe) {
          montantActe = matchedActe.Prix_Acte;
        } else if (t.Libelle?.includes("Consultation MPR Adulte") || t.Libelle?.includes("Consultation MPR Enfant")) {
          montantActe = 2500;
        } else if (t.Libelle?.includes("Consultation Adulte") || t.Libelle?.includes("Consultation Enfant")) {
          montantActe = 200;
        }
      }

      // 8. Versement
      const versement = t.Montant;

      // 9. Remise
      let remiseVal = 0;
      if (abn) {
        if (abn.Remise) {
          remiseVal = abn.Remise;
        } else if (abn.remise_globale) {
          const pack = dbState.packs?.find(p => p.ID_Pack === abn.ID_Pack);
          const basePrice = pack ? pack.Prix_Pack : 0;
          remiseVal = (basePrice * abn.remise_globale) / 100;
        }
      }

      // 10. Reste
      const reste = Math.max(0, montantActe - versement - remiseVal);

      // 11. Service
      const service = getServiceLabel(t.Caisse, t.Libelle);

      return {
        ...t,
        Date_Acte: dateActe,
        Patient_Nom_Complet: patientNom,
        Acte_Label: acteLabel,
        Heure_Debut: heureDebut,
        Heure_Fin: heureFin,
        Duree: duree,
        Montant_Acte: montantActe,
        Versement_Caisse: versement,
        Remise_Abn: remiseVal,
        Reste_A_Payer: reste,
        Service_Origine: service
      };
    });
  }, [dbState.transactions_caisses, dbState.rendezVous, dbState.actes, dbState.abonnements, dbState.packs]);

  // ---------------------------------------------------------------------------
  // Filtrage général : dates, recherche globale, type global et caisse (hors filtres colonnes)
  // ---------------------------------------------------------------------------
  const baseTransactionsWithFilters = useMemo(() => {
    return enrichedTransactions.filter((t) => {
      // 1. Filtre par rôle (réceptionnistes restreints à leur caisse d'affectation)
      let roleMatch = true;
      if (isRDC) {
        roleMatch = t.Caisse === 'Caisse RDC';
      } else if (isBalneo) {
        roleMatch = t.Caisse === 'Caisse Sce Balnéothérapie' || t.Caisse === 'Caisse Balnéo';
      } else if (isReeduc) {
        roleMatch = t.Caisse === 'Caisse Rééducation';
      }
      if (!roleMatch) return false;

      // Filtre caisse sélectionnée pour l'Admin
      if (isAdmin && selectedCaisse !== 'all') {
        if (selectedCaisse === 'Caisse Abonnement / Autres Soins') {
          if (t.Caisse !== 'Caisse Abonnement / Autres Soins' && t.Caisse !== 'Caisse Abonnement et autres actes') return false;
        } else if (selectedCaisse === 'Caisse Sce Balnéothérapie') {
          if (t.Caisse !== 'Caisse Sce Balnéothérapie' && t.Caisse !== 'Caisse Balnéo') return false;
        } else {
          if (t.Caisse !== selectedCaisse) return false;
        }
      }

      // 2. Filtre texte/recherche globale
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          (t.Acte_Label || '').toLowerCase().includes(q) ||
          (t.Patient_Nom_Complet || '').toLowerCase().includes(q) ||
          (t.Service_Origine || '').toLowerCase().includes(q) ||
          (t.Caisse || '').toLowerCase().includes(q) ||
          String(t.ID_Trans).includes(q);
        if (!match) return false;
      }

      // 3. Filtre par intervalle de date
      if (startDateFilter) {
        if (t.Date_Trans < startDateFilter) return false;
      }
      if (endDateFilter) {
        if (t.Date_Trans > endDateFilter) return false;
      }

      // 4. Filtre type global
      if (typeFilter !== 'all' && t.Type !== typeFilter) return false;

      return true;
    });
  }, [enrichedTransactions, isRDC, isBalneo, isReeduc, isAdmin, selectedCaisse, searchQuery, startDateFilter, endDateFilter, typeFilter]);

  const baseFilteredTransactions = baseTransactionsWithFilters;

  // ---------------------------------------------------------------------------
  // Filtrage par colonnes en multi-sélection
  // ---------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return baseTransactionsWithFilters.filter((t) => {
      for (const [colKey, rawValues] of Object.entries(columnFilters)) {
        const selectedValues = rawValues as string[];
        if (selectedValues && selectedValues.length > 0) {
          const displayVal = getDisplayValue(t, colKey);
          if (!selectedValues.includes(displayVal)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [baseTransactionsWithFilters, columnFilters, getDisplayValue]);

  // ---------------------------------------------------------------------------
  // Calcul dynamique des options de filtre de colonne de manière cumulative
  // ---------------------------------------------------------------------------
  const getFilterOptionsForColumn = useCallback((colKey: string) => {
    const otherFiltered = baseTransactionsWithFilters.filter((t) => {
      for (const [otherKey, rawValues] of Object.entries(columnFilters)) {
        const selectedValues = rawValues as string[];
        if (otherKey !== colKey && selectedValues && selectedValues.length > 0) {
          const displayVal = getDisplayValue(t, otherKey);
          if (!selectedValues.includes(displayVal)) {
            return false;
          }
        }
      }
      return true;
    });

    const counts: Record<string, number> = {};
    otherFiltered.forEach((t) => {
      const displayVal = getDisplayValue(t, colKey);
      counts[displayVal] = (counts[displayVal] || 0) + 1;
    });

    const options = Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .filter(opt => opt.count > 0);

    options.sort((a, b) => {
      const numA = parseFloat(a.value);
      const numB = parseFloat(b.value);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.value.localeCompare(b.value, 'fr', { numeric: true });
    });

    return {
      options,
      totalCount: otherFiltered.length
    };
  }, [baseTransactionsWithFilters, columnFilters, getDisplayValue]);

  const toggleColumnFilterValue = useCallback((colKey: string, value: string) => {
    setColumnFilters(prev => {
      const current = prev[colKey] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {
        ...prev,
        [colKey]: updated
      };
    });
  }, []);

  const clearColumnFilter = useCallback((colKey: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [colKey]: []
    }));
  }, []);

  const setColumnFilterAll = useCallback((colKey: string, allValues: string[]) => {
    setColumnFilters(prev => {
      const current = prev[colKey] || [];
      const isAllSelected = allValues.every(val => current.includes(val));
      return {
        ...prev,
        [colKey]: isAllSelected ? [] : allValues
      };
    });
  }, []);

  // Vérifier si au moins un filtre est actif (hors date TODAY_DATE par défaut pour l'effacement facile)
  const isAnyFilterActive = useMemo(() => {
    const isColFiltered = Object.values(columnFilters).some(arr => (arr as string[]).length > 0);
    return (
      searchQuery !== '' ||
      startDateFilter !== '' ||
      endDateFilter !== '' ||
      typeFilter !== 'all' ||
      isColFiltered ||
      selectedCaisse !== 'all'
    );
  }, [searchQuery, startDateFilter, endDateFilter, typeFilter, columnFilters, selectedCaisse]);

  // Réinitialiser tous les filtres (y compris vider les dates de début/fin pour l'historique complet)
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStartDateFilter('');
    setEndDateFilter('');
    setTypeFilter('all');
    setColumnFilters({
      Date_Acte: [],
      Patient_Nom_Complet: [],
      Acte_Label: [],
      Heure_Debut: [],
      Heure_Fin: [],
      Duree: [],
      Montant_Acte: [],
      Versement_Caisse: [],
      Reste_A_Payer: [],
      Remise_Abn: [],
      Service_Origine: []
    });
    setSelectedCaisse('all');
    triggerToast("Filtres réinitialisés (Affichage de l'historique complet)", "info");
  }, [triggerToast]);

  // Tri
  const sortedTransactions = useMemo(() => {
    if (!sortConfig) return filteredTransactions;
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      let key = sortConfig.key;
      if (key === 'Date_Trans') key = 'Date_Acte';
      if (key === 'Patient_Nom') key = 'Patient_Nom_Complet';
      if (key === 'Libelle') key = 'Acte_Label';
      if (key === 'Montant') key = 'Montant_Acte';
      
      const aVal = (a as any)[key] ?? '';
      const bVal = (b as any)[key] ?? '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [filteredTransactions, sortConfig]);

  // Tab state: caisses (transactions) or depenses (sorties de caisse)
  const [activeTab, setActiveTab] = useState<'caisses' | 'depenses'>('caisses');

  // Totaux de la caisse ou de la vue courante
  const totals = useMemo<{
    recettes: number;
    depenses: number;
    solde: number;
    byCaisse: Record<string, number>;
    byActe: Record<string, { label: string; count: number; amount: number }>;
  }>(() => {
    const recettes = filteredTransactions.filter(t => t.Type === 'Recette').reduce((sum, t) => sum + (t.Montant || 0), 0);
    
    // Filter validated expenses
    const allDepensesList = dbState.depenses || [];
    let depenses = 0;
    if (selectedCaisse === 'all') {
      depenses = allDepensesList.filter(d => d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else if (selectedCaisse === 'Caisse Rééducation') {
      depenses = allDepensesList.filter(d => d.id_service === 1 && d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else if (selectedCaisse === 'Caisse Sce Balnéothérapie') {
      depenses = allDepensesList.filter(d => d.id_service === 2 && d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else if (selectedCaisse === 'Caisse RDC') {
      depenses = allDepensesList.filter(d => d.id_service === 6 && d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else {
      depenses = allDepensesList.filter(d => d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    }

    const solde = recettes - depenses;
    const byCaisse: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const c = t.Caisse || 'Inconnu';
      byCaisse[c] = (byCaisse[c] || 0) + (t.Type === 'Recette' ? t.Montant : -t.Montant);
    });
    const byActe: Record<string, { label: string; count: number; amount: number }> = {};
    filteredTransactions
      .filter(t => t.Type === 'Recette' && t.ID_Acte)
      .forEach(t => {
        const acte = dbState.actes?.find((a: Acte) => a.ID_Acte === t.ID_Acte);
        const key = acte ? `${acte.Libelle_Acte}` : `Acte #${t.ID_Acte}`;
        if (!byActe[key]) {
          byActe[key] = { label: key, count: 0, amount: 0 };
        }
        byActe[key].count += 1;
        byActe[key].amount += (t.Montant || 0);
      });
    return { recettes, depenses, solde, byCaisse, byActe };
  }, [filteredTransactions, dbState.actes, dbState.depenses, selectedCaisse]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  }, []);

  const caisseTitle = isRDC
    ? 'Caisse RDC (MPR)'
    : isBalneo
    ? 'Caisse Balnéothérapie'
    : isReeduc
    ? 'Caisse Rééducation'
    : isAdmin
    ? (selectedCaisse === 'all' 
        ? 'Toutes les Caisses Cliniques' 
        : selectedCaisse === 'Caisse RDC' 
        ? 'Caisse RDC (MPR)' 
        : selectedCaisse === 'Caisse Abonnement / Autres Soins'
        ? 'Caisse Abonnement / Autres Soins'
        : selectedCaisse)
    : 'Gestion des Caisses';

  // Synthèse des caisses individuelles recalculée en temps réel
  const caissesSummary = useMemo(() => {
    const caissesList = [
      { id: 'Caisse Abonnement / Autres Soins' as const, label: 'Caisse Abonnement / Autres Soins', labelShort: 'Caisse Abonnement', serviceId: 3 },
      { id: 'Caisse RDC' as const, label: 'Caisse RDC (MPR)', labelShort: 'Caisse RDC (MPR)', serviceId: 6 },
      { id: 'Caisse Sce Balnéothérapie' as const, label: 'Caisse Sce Balnéothérapie', labelShort: 'Balnéothérapie', serviceId: 2 },
      { id: 'Caisse Rééducation' as const, label: 'Caisse Rééducation', labelShort: 'Rééducation', serviceId: 1 }
    ];

    const allDepensesList = dbState.depenses || [];

    return caissesList.map(c => {
      let txs = baseFilteredTransactions.filter(t => {
        if (c.id === 'Caisse Abonnement / Autres Soins') {
          return t.Caisse === 'Caisse Abonnement / Autres Soins' || t.Caisse === 'Caisse Abonnement et autres actes';
        }
        if (c.id === 'Caisse Sce Balnéothérapie') {
          return t.Caisse === 'Caisse Sce Balnéothérapie' || t.Caisse === 'Caisse Balnéo';
        }
        return t.Caisse === c.id;
      });

      const recettes = txs.filter(t => t.Type === 'Recette').reduce((sum, t) => sum + (t.Montant || 0), 0);
      const depenses = allDepensesList
        .filter(d => d.id_service === c.serviceId && d.statut === 'Validée')
        .reduce((sum, d) => sum + (d.montant || 0), 0);
      const solde = recettes - depenses;

      return {
        ...c,
        recettes,
        depenses,
        solde,
        count: txs.length
      };
    });
  }, [baseFilteredTransactions, dbState.depenses]);

  // Totaux du badge CONSOLIDÉ (synchrone avec filteredTransactions)
  const consolidatedTotals = useMemo(() => {
    const recettes = filteredTransactions.filter(t => t.Type === 'Recette').reduce((sum, t) => sum + (t.Montant || 0), 0);
    const allDepensesList = dbState.depenses || [];
    let depenses = 0;
    if (selectedCaisse === 'all') {
      depenses = allDepensesList.filter(d => d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else if (selectedCaisse === 'Caisse Rééducation') {
      depenses = allDepensesList.filter(d => d.id_service === 1 && d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else if (selectedCaisse === 'Caisse Sce Balnéothérapie') {
      depenses = allDepensesList.filter(d => d.id_service === 2 && d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else if (selectedCaisse === 'Caisse RDC') {
      depenses = allDepensesList.filter(d => d.id_service === 6 && d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    } else {
      depenses = allDepensesList.filter(d => d.statut === 'Validée').reduce((sum, d) => sum + (d.montant || 0), 0);
    }
    const solde = recettes - depenses;
    return { recettes, depenses, solde };
  }, [filteredTransactions, dbState.depenses, selectedCaisse]);

  const renderHeaderWithFilter = (
    label: string,
    fullName: string,
    colKey: string,
    alignRight: boolean = false
  ) => {
    const { options, totalCount } = getFilterOptionsForColumn(colKey);
    const selectedValues = columnFilters[colKey] || [];
    const isFiltered = selectedValues.length > 0;
    const isDropdownOpen = activeFilterDropdown === colKey;

    const handleSortClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.filter-dropdown-menu') || (e.target as HTMLElement).closest('.filter-btn')) {
        return;
      }
      handleSort(colKey);
    };

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownAnchorRect(rect);
      setActiveFilterDropdown(isDropdownOpen ? null : colKey);
    };

    // Calcul de la position du dropdown dans le viewport (pour fixed)
    let dropdownStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 100000,
      width: '224px', // w-56
    };

    if (dropdownAnchorRect && isDropdownOpen) {
      const top = dropdownAnchorRect.bottom + 4;
      const leftValue = alignRight 
        ? dropdownAnchorRect.right - 224 
        : dropdownAnchorRect.left;
      const left = Math.max(10, Math.min(window.innerWidth - 234, leftValue));
      
      dropdownStyle.top = `${top}px`;
      dropdownStyle.left = `${left}px`;
    }

    return (
      <th 
        className="px-2 py-1.5 text-left font-bold text-slate-600 text-[11px] uppercase tracking-wider cursor-pointer select-none relative hover:bg-slate-100/50 transition-colors"
        onClick={handleSortClick}
        title={fullName}
      >
        <div className={`flex items-center gap-1 ${alignRight ? 'justify-end' : 'justify-start'}`}>
          <span className="truncate">{label}</span>
          {sortConfig?.key === colKey && (
            <span className="text-slate-400">
              {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
            </span>
          )}
          <button
            onClick={handleButtonClick}
            className={`filter-btn p-0.5 rounded hover:bg-slate-200 transition-colors active:scale-95 ${
              isFiltered ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'
            }`}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {isDropdownOpen && createPortal(
          <div className="portal-filter-dropdown-container">
            {/* Overlay transparent pour fermer au clic dehors */}
            <div 
              className="fixed inset-0 z-[99999] cursor-default bg-transparent" 
              onClick={(e) => {
                e.stopPropagation();
                setActiveFilterDropdown(null);
              }}
            />
            
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                style={dropdownStyle}
                className="filter-dropdown-menu bg-white border border-[#9bb8ba]/30 rounded-lg shadow-xl overflow-y-auto max-h-60 p-2 cursor-default text-left font-normal normal-case"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Option Tout */}
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs font-semibold text-slate-700 border-b border-slate-100 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedValues.length === 0}
                    onChange={() => {
                      clearColumnFilter(colKey);
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span className="flex-1 truncate">Tout</span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">({totalCount})</span>
                </label>

                {/* Options individuelles */}
                <div className="space-y-0.5">
                  {options.map((opt) => {
                    const isChecked = selectedValues.includes(opt.value);
                    return (
                      <label 
                        key={opt.value}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            toggleColumnFilterValue(colKey, opt.value);
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span className="flex-1 truncate" title={opt.value}>
                          {opt.value}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">({opt.count})</span>
                      </label>
                    );
                  })}
                  {options.length === 0 && (
                    <div className="p-2 text-center text-slate-400 text-[10px]">
                      Aucune option
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
      </th>
    );
  };

  // Libellé de période/filtre dynamique sous le montant consolidé
  const consolidatedLabel = useMemo(() => {
    const isCaisseActive = selectedCaisse !== 'all';
    const isToday = startDateFilter === TODAY_DATE && endDateFilter === TODAY_DATE;
    const hasPeriod = startDateFilter || endDateFilter;

    const parts: string[] = [];

    if (isCaisseActive) {
      const cLabel = selectedCaisse === 'Caisse Abonnement / Autres Soins' ? 'Caisse Abonnement' : 
                     selectedCaisse === 'Caisse Sce Balnéothérapie' ? 'Balnéothérapie' : 
                     selectedCaisse === 'Caisse Rééducation' ? 'Rééducation' : selectedCaisse;
      parts.push(`Caisse : ${cLabel}`);
    }

    if (isToday) {
      parts.push("Aujourd'hui");
    } else if (hasPeriod) {
      if (startDateFilter && endDateFilter) {
        parts.push(`${formatDate(startDateFilter)} → ${formatDate(endDateFilter)}`);
      } else if (startDateFilter) {
        parts.push(`Depuis ${formatDate(startDateFilter)}`);
      } else if (endDateFilter) {
        parts.push(`Jusqu'au ${formatDate(endDateFilter)}`);
      }
    }

    if (parts.length === 0) {
      return null;
    }

    return parts.join(' • ');
  }, [selectedCaisse, startDateFilter, endDateFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Sélecteur de Caisses et Statistiques temps réel de chaque caisse (Réservé à l'Admin) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <button
            onClick={() => setSelectedCaisse('all')}
            className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
              selectedCaisse === 'all'
                ? consolidatedTotals.solde < 0
                  ? 'bg-rose-900 text-white border-rose-950 shadow-md shadow-rose-900/15'
                  : 'bg-[#102e3b] text-white border-[#102e3b] shadow-md shadow-[#102e3b]/15'
                : consolidatedTotals.solde < 0
                ? 'bg-rose-50 text-rose-950 border-rose-200 shadow-xs'
                : 'bg-white text-slate-800 border-[#9bb8ba]/30 hover:border-[#9bb8ba] hover:bg-[#9bb8ba]/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                {selectedCaisse !== 'all' ? 'TOTAUX FILTRÉS' : 'CONSOLIDÉ'}
              </span>
              <div className={`p-1.5 rounded-lg ${
                selectedCaisse === 'all' 
                  ? 'bg-white/10 text-white' 
                  : consolidatedTotals.solde < 0 
                  ? 'bg-rose-100 text-rose-700' 
                  : 'bg-[#102e3b]/5 text-[#102e3b]'
              }`}>
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h4 className="font-bold text-xs truncate">
              {selectedCaisse !== 'all' ? 'Totaux Filtrés' : 'Toutes les Caisses'}
            </h4>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-[10px] opacity-75">
                {selectedCaisse !== 'all' ? 'Solde Filtré' : 'Solde Global'}
              </span>
              <span className={`text-sm font-extrabold font-mono ${
                selectedCaisse !== 'all' && consolidatedTotals.solde < 0 ? 'text-rose-600' : 
                selectedCaisse === 'all' && consolidatedTotals.solde < 0 ? 'text-rose-400' : ''
              }`}>
                {formatCurrency(consolidatedTotals.solde)}
              </span>
            </div>
            {consolidatedLabel ? (
              <div className="mt-1 text-[9px] font-medium italic text-slate-400 text-right truncate">
                {consolidatedLabel}
              </div>
            ) : filteredTransactions.length === 0 && (startDateFilter || endDateFilter || selectedCaisse !== 'all') ? (
              <div className="mt-1 text-[9px] font-medium italic text-slate-400 text-right">
                Aucune donnée
              </div>
            ) : null}
          </button>

          {caissesSummary.map((c) => {
            const isSelected = selectedCaisse === c.id;
            const isCaisseActive = selectedCaisse === 'all' || isSelected;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCaisse(c.id)}
                className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#9bb8ba] text-white border-[#9bb8ba] shadow-md shadow-[#9bb8ba]/15'
                    : !isCaisseActive
                    ? 'bg-slate-50 text-slate-400 border-slate-200/60 opacity-45 hover:opacity-75 hover:bg-slate-100/50'
                    : 'bg-white text-slate-800 border-[#9bb8ba]/30 hover:border-[#9bb8ba] hover:bg-[#9bb8ba]/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${!isCaisseActive ? 'text-slate-400' : 'opacity-85'}`}>
                    {c.labelShort}
                  </span>
                  <div className={`p-1.5 rounded-lg ${
                    isSelected 
                      ? 'bg-white/10 text-white' 
                      : !isCaisseActive
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-[#9bb8ba]/10 text-[#9bb8ba]'
                  }`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <h4 className={`font-bold text-xs truncate ${!isCaisseActive ? 'text-slate-400' : ''}`}>{c.label}</h4>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[10px] opacity-75">Solde</span>
                  <span className={`text-sm font-extrabold font-mono ${
                    !isSelected && c.solde < 0 ? 'text-rose-600' : 
                    !isCaisseActive ? 'text-slate-400' : ''
                  }`}>
                    {formatCurrency(c.solde)}
                  </span>
                </div>
                {/* Petits indicateurs recettes/dépenses en petit */}
                <div className="mt-2 pt-2 border-t border-current/10 grid grid-cols-2 gap-1 text-[9px] opacity-80 font-mono">
                  <div>
                    <span className="block opacity-75">Rec. :</span>
                    <span className={`font-bold ${
                      isSelected ? 'text-white' : 
                      !isCaisseActive ? 'text-slate-400 font-normal' : 'text-emerald-700'
                    }`}>
                      {formatCurrency(c.recettes)}
                    </span>
                  </div>
                  <div>
                    <span className="block opacity-75">Dép. :</span>
                    <span className={`font-bold ${
                      isSelected ? 'text-white' : 
                      !isCaisseActive ? 'text-slate-400 font-normal' : 'text-rose-700'
                    }`}>
                      {formatCurrency(c.depenses)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ONGLETS NAVIGATION CAISSES / DÉPENSES */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('caisses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'caisses'
              ? 'bg-[#102e3b] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Encaissements & Caisses</span>
        </button>
        <button
          onClick={() => setActiveTab('depenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'depenses'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Dépenses (Sorties de caisse)</span>
          {((dbState.depenses || []).filter(d => d.statut === 'En attente').length > 0) && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {(dbState.depenses || []).filter(d => d.statut === 'En attente').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'depenses' ? (
        <DepenseManager
          idService={selectedCaisse === 'Caisse Rééducation' ? 1 : selectedCaisse === 'Caisse Sce Balnéothérapie' ? 2 : selectedCaisse === 'Caisse RDC' ? 6 : 0}
          nomService={selectedCaisse === 'all' ? 'Toutes les Caisses' : selectedCaisse}
          dbState={dbState}
          currentUser={currentUser}
          onDbChange={onSave}
          triggerToast={triggerToast}
        />
      ) : (
        <>
      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#9bb8ba]/35 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9bb8ba]/15 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-[#9bb8ba]" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#102e3b]">{caisseTitle}</h2>
              <p className="text-slate-500 text-xs">
                {isRDC
                  ? 'Encaissements des actes et consultations de votre caisse (RDC).'
                  : isBalneo
                  ? 'Encaissements des actes et consultations de votre caisse (Balnéothérapie).'
                  : isReeduc
                  ? 'Encaissements des actes et consultations de votre caisse (Rééducation).'
                  : isAdmin
                  ? (selectedCaisse === 'all' 
                      ? 'Vue consolidée et en temps réel de toutes les caisses de la clinique (RDC, Balnéothérapie, Rééducation, IMC).'
                      : `Encaissements et suivi pour la caisse : ${selectedCaisse}.`)
                  : 'Suivi des flux financiers et encaissements par caisse.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs active:scale-95"
                title="Réinitialiser tous les filtres"
              >
                <X className="w-3.5 h-3.5" />
                Effacer les filtres
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                showFilters ? 'bg-[#9bb8ba] text-white shadow-2xs' : 'bg-[#f9fafb] text-slate-600 border border-[#9bb8ba]/30 hover:bg-[#9bb8ba]/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres globaux
            </button>
          </div>
        </div>

        {/* Cartes de synthèse de la sélection courante */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Recettes</span>
            </div>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(totals.recettes)}</p>
          </div>
          <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-4 h-4 text-rose-600" />
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Dépenses</span>
            </div>
            <p className="text-xl font-bold text-rose-800">{formatCurrency(totals.depenses)}</p>
          </div>
          <div className="bg-[#9bb8ba]/10 border border-[#9bb8ba]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-[#102e3b]" />
              <span className="text-[10px] font-bold text-[#102e3b] uppercase tracking-wider">Solde {selectedCaisse === 'all' ? 'Consolidé' : ''}</span>
            </div>
            <p className={`text-xl font-bold ${totals.solde >= 0 ? 'text-[#102e3b]' : 'text-rose-700'}`}>
              {formatCurrency(totals.solde)}
            </p>
          </div>
        </div>

        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#9bb8ba]/20">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Patient, libellé, caisse..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#9bb8ba]/30 rounded-lg text-xs text-[#102e3b] focus:outline-none focus:ring-2 focus:ring-[#9bb8ba]/50"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Période d'encaissement</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">Du</span>
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        className="w-full pl-7 pr-5 py-2 bg-white border border-[#9bb8ba]/30 rounded-lg text-[11px] text-[#102e3b] focus:outline-none focus:ring-2 focus:ring-[#9bb8ba]/50 font-medium"
                      />
                      {startDateFilter && (
                        <button onClick={() => setStartDateFilter('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                          <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">Au</span>
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        className="w-full pl-7 pr-5 py-2 bg-white border border-[#9bb8ba]/30 rounded-lg text-[11px] text-[#102e3b] focus:outline-none focus:ring-2 focus:ring-[#9bb8ba]/50 font-medium"
                      />
                      {endDateFilter && (
                        <button onClick={() => setEndDateFilter('')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                          <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#9bb8ba]/30 rounded-lg text-xs text-[#102e3b] focus:outline-none focus:ring-2 focus:ring-[#9bb8ba]/50"
                  >
                    <option value="all">Tous</option>
                    <option value="Recette">Recette</option>
                    <option value="Dépense">Dépense</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#9bb8ba]/35 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#9bb8ba]/20">
                {renderHeaderWithFilter('Date', 'Date Acte', 'Date_Acte')}
                {renderHeaderWithFilter('Patient', 'Nom & Prénom du Patient', 'Patient_Nom_Complet')}
                {renderHeaderWithFilter('Acte', 'Acte (Désignation)', 'Acte_Label')}
                {renderHeaderWithFilter('Début', 'Heure Début', 'Heure_Debut')}
                {renderHeaderWithFilter('Fin', 'Heure Fin', 'Heure_Fin')}
                {renderHeaderWithFilter('Durée', 'Durée', 'Duree')}
                {renderHeaderWithFilter('Montant', 'Montant', 'Montant_Acte', true)}
                {renderHeaderWithFilter('Versé', 'Versé', 'Versement_Caisse', true)}
                {renderHeaderWithFilter('Reste', 'Reste', 'Reste_A_Payer', true)}
                {renderHeaderWithFilter('Remise', 'Remise', 'Remise_Abn', true)}
                {renderHeaderWithFilter('Service', 'Service', 'Service_Origine')}
                {isAdmin && (
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 12 : 11} className="px-4 py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Eye className="w-8 h-8 text-slate-300" />
                        <p>Aucune transaction ne correspond à vos critères.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((t, idx) => (
                    <motion.tr
                      key={t.ID_Trans}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-b border-[#9bb8ba]/10 hover:bg-[#f9fafb] transition-colors ${
                        t.Type === 'Recette' ? 'bg-emerald-50/20' : t.Type === 'Dépense' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* 1. Date Acte */}
                      <td className="px-2 py-1 text-[12px] text-slate-700 font-medium whitespace-nowrap">
                        {formatDate(t.Date_Acte)}
                      </td>
                      {/* 2. Nom & Prénom du Patient */}
                      <td className="px-2 py-1 text-[12px] text-slate-700 font-bold whitespace-nowrap max-w-[120px] truncate" title={t.Patient_Nom_Complet}>
                        {t.Patient_Nom_Complet}
                      </td>
                      {/* 3. Acte (Désignation) */}
                      <td className="px-2 py-1 text-[12px] text-slate-700 max-w-[150px] truncate" title={t.Acte_Label}>
                        {t.Acte_Label}
                      </td>
                      {/* 4. Heure Début */}
                      <td className="px-2 py-1 text-[12px] text-slate-500 font-mono">
                        {t.Heure_Debut}
                      </td>
                      {/* 5. Heure Fin */}
                      <td className="px-2 py-1 text-[12px] text-slate-500 font-mono">
                        {t.Heure_Fin}
                      </td>
                      {/* 6. Durée */}
                      <td className="px-2 py-1 text-[12px] text-slate-500 font-medium whitespace-nowrap">
                        {t.Duree}
                      </td>
                      {/* 7. Montant */}
                      <td className="px-2 py-1 text-[12px] text-right font-bold font-mono text-slate-800">
                        {formatCurrency(t.Montant_Acte)}
                      </td>
                      {/* 8. Versement */}
                      <td className="px-2 py-1 text-[12px] text-right font-bold font-mono text-emerald-700">
                        {formatCurrency(t.Versement_Caisse)}
                      </td>
                      {/* 9. Reste */}
                      <td className="px-2 py-1 text-[12px] text-right font-bold font-mono text-amber-700">
                        {formatCurrency(t.Reste_A_Payer)}
                      </td>
                      {/* 10. Remise */}
                      <td className="px-2 py-1 text-[12px] text-right font-bold font-mono text-slate-500">
                        {t.Remise_Abn > 0 ? formatCurrency(t.Remise_Abn) : "0"}
                      </td>
                      {/* 11. Service */}
                      <td className="px-2 py-1 text-[12px] text-slate-700 font-semibold whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[9px] font-bold">
                          {t.Service_Origine}
                        </span>
                      </td>
                      {/* 12. Actions */}
                      {isAdmin && (
                        <td className="px-2 py-1 text-center whitespace-nowrap">
                          {t.Type === 'Recette' && (
                            <button
                              onClick={() => setTransactionToDebloquer(t)}
                              className="inline-flex items-center gap-1 px-2 py-1 border border-amber-500 text-amber-600 hover:bg-amber-50 rounded text-[11px] font-bold transition-all cursor-pointer active:scale-95 bg-transparent"
                              title="Réinitialiser la séance"
                            >
                              <span>🔄 Réinitialiser</span>
                            </button>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pied de tableau avec totaux */}
        <div className="border-t border-[#9bb8ba]/20 px-4 py-3 bg-[#f9fafb] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500 font-medium">
            {sortedTransactions.length} transaction{sortedTransactions.length > 1 ? 's' : ''} affichée{sortedTransactions.length > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-emerald-700">Recettes : {formatCurrency(totals.recettes)}</span>
            <span className="text-rose-700">Dépenses : {formatCurrency(totals.depenses)}</span>
            <span className={`${totals.solde >= 0 ? 'text-[#102e3b]' : 'text-rose-700'}`}>
              Solde : {formatCurrency(totals.solde)}
            </span>
          </div>
        </div>
      </div>
      </>)}

      {/* MODAL DE CONFIRMATION DE DÉBLOCAGE */}
      <AnimatePresence>
        {transactionToDebloquer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-amber-300 overflow-hidden text-left"
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-full text-amber-600 flex-shrink-0">
                    <span className="text-xl">🔄</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      Réinitialiser la séance
                    </h3>
                    
                    <div className="mt-4 p-3 bg-slate-50/70 rounded-xl border border-slate-200/50 text-[11px] text-slate-700 space-y-1.5 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Patient :</span>
                        <span className="font-bold text-slate-800">{transactionToDebloquer.Patient_Nom_Complet || transactionToDebloquer.Patient_Nom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Acte :</span>
                        <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{transactionToDebloquer.Acte_Label || transactionToDebloquer.Libelle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Montant :</span>
                        <span className="font-bold text-emerald-700 font-mono">{formatCurrency(transactionToDebloquer.Montant_Acte || transactionToDebloquer.Montant)}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-4 space-y-2 leading-relaxed">
                      <p className="text-amber-700 font-bold">
                        ⚠️ Attention : Cette action va :
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                        <li>Annuler l'encaissement</li>
                        <li>Remettre la séance en "Non Réglée"</li>
                        <li>Retourner la séance dans sa file d'attente d'origine pour correction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setTransactionToDebloquer(null)}
                  className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  ❌ Annuler
                </button>
                <button
                  onClick={handleConfirmDebloquer}
                  className="px-4 py-1.5 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-amber-600/10 active:scale-95"
                >
                  ✅ Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default React.memo(CaissesManager);