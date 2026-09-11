import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';

interface CashReportProps {
  dbState: any;
  currentUser?: any;
  onSave?: (state: any, modifiedKeys?: string[]) => void;
  setDbState?: React.Dispatch<React.SetStateAction<any>>;
  triggerToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export interface ReportRow {
  id: number;
  caisse: string;
  caisseKey: string;
  nature: string;
  nom: string;
  prenom: string;
  date: string;
  montant: number;
  versement: number;
  creance: number;
  duree: string;
  transId?: number;
  idFile?: number;
  idSeance?: number;
}

function calculateDuree(debut: string | null, fin: string | null): string {
  if (!debut || !fin || debut === '00:00' || fin === '00:00' || debut === '--:--' || fin === '--:--') return '0 00:00';
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '0 00:00';
  let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMin < 0) diffMin += 24 * 60;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h} ${m.toString().padStart(2, '0')}:00`;
}

function getTypeActe(item: any, dbState?: any): string {
  if (!item) return '—';

  // 1. Direct act field on item if present
  let typeActe =
    item.Type_Acte ||
    item.TypeActe ||
    item.type_acte ||
    item.Acte ||
    item.acte ||
    item.Libelle_Acte ||
    item.libelle_acte;

  // 2. Lookup in dbState.actes if ID_Acte is present and typeActe was not found directly
  if (!typeActe && item.ID_Acte && dbState?.actes) {
    const matched = dbState.actes.find((a: any) => Number(a.ID_Acte) === Number(item.ID_Acte));
    if (matched?.Libelle_Acte) {
      typeActe = matched.Libelle_Acte;
    }
  }

  // 3. Fallback to specific act fields if not generic
  if (!typeActe) {
    const candidate = item.Type_Consultation || item.Type_Soin || item.Type_Seance || item.Nature;
    if (candidate && !['Recette', 'Séance', 'Transaction', 'Dépense'].includes(candidate.trim())) {
      typeActe = candidate;
    }
  }

  // 4. Extract from Libelle if Libelle contains act information and typeActe is still empty
  if (!typeActe && item.Libelle) {
    const lib = String(item.Libelle);
    if (!['Recette', 'Séance', 'Transaction', 'Dépense'].includes(lib.trim())) {
      if (lib.includes('Balnéothérapie') || lib.includes('Balneo') || lib.includes('balnéo')) typeActe = 'Balnéothérapie';
      else if (lib.includes('Kinésithérapie') || lib.includes('Kiné') || lib.includes('kine')) typeActe = 'Kinésithérapie';
      else if (lib.includes('Orthophonie')) typeActe = 'Orthophonie';
      else if (lib.includes('Psychomotricité') || lib.includes('Psychomotricite')) typeActe = 'Psychomotricité';
      else if (lib.includes('Consultation MPR')) typeActe = 'Consultation MPR';
      else if (lib.includes('Consultation Adulte')) typeActe = 'Consultation Adulte';
      else if (lib.includes('Consultation IMC')) typeActe = 'Consultation IMC';
      else if (lib.includes('Ergothérapie')) typeActe = 'Ergothérapie';
      else if (lib.includes('Psychologie')) typeActe = 'Psychologie';
    }
  }

  // Filter out generic labels like "Recette", "Séance", "Transaction", "Dépense"
  if (typeActe) {
    const trimmed = String(typeActe).trim();
    if (['Recette', 'Séance', 'Transaction', 'Dépense', '—', 'undefined', 'null'].includes(trimmed)) {
      return '—';
    }
    return trimmed;
  }

  return '—';
}

function parsePatientNomPrenom(
  rawNom?: string | null,
  rawPrenom?: string | null,
  patientObj?: any
): { nom: string; prenom: string } {
  let nomStr = (rawNom || patientObj?.Nom || patientObj?.nom || '').trim();
  let prenomStr = (rawPrenom || patientObj?.Prenom || patientObj?.prenom || '').trim();

  if (nomStr === '—' || nomStr === 'undefined' || nomStr === 'null') nomStr = '';
  if (prenomStr === '—' || prenomStr === 'undefined' || prenomStr === 'null') prenomStr = '';

  // Si le champ prenom est vide mais le nom contient plusieurs mots (ex: "LAOUED BOUTHAYNA", "BOUCHAREN SAID")
  if (nomStr && !prenomStr) {
    const parts = nomStr.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      prenomStr = parts[parts.length - 1]; // Le dernier mot = PRÉNOM
      nomStr = parts.slice(0, parts.length - 1).join(' '); // Tout le reste = NOM
    }
  } 
  // Si le champ nom se termine par le prénom (ex: nomStr = "LAOUED BOUTHAYNA" et prenomStr = "BOUTHAYNA")
  else if (nomStr && prenomStr && nomStr.toLowerCase().endsWith(prenomStr.toLowerCase()) && nomStr.length > prenomStr.length) {
    const withoutPrenom = nomStr.slice(0, nomStr.length - prenomStr.length).trim();
    if (withoutPrenom) {
      nomStr = withoutPrenom;
    }
  }

  return {
    nom: nomStr || '—',
    prenom: prenomStr || '—',
  };
}

function CashReport({ dbState, onSave, setDbState, triggerToast }: CashReportProps) {
  const [dateDebut, setDateDebut] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportTab, setReportTab] = useState<'encaissements' | 'creances'>('encaissements');
  const [allRows, setAllRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const columns = [
    { key: 'id', label: 'N°', width: '5%', filterable: true, numeric: true },
    { key: 'caisse', label: 'Caisse', width: '20%', filterable: true },
    { key: 'nature', label: 'TYPE ACTE', width: '14%', filterable: true },
    { key: 'nom', label: 'Nom', width: '10%', filterable: true },
    { key: 'prenom', label: 'Prénom', width: '10%', filterable: true },
    { key: 'date', label: 'Date', width: '9%', filterable: true },
    { key: 'montant', label: 'Montant', width: '9%', filterable: true, numeric: true },
    { key: 'versement', label: 'Versement', width: '9%', filterable: true, numeric: true },
    { key: 'creance', label: 'Créance', width: '8%', filterable: true, numeric: true },
    { key: 'duree', label: 'Durée', width: '6%', filterable: true },
  ];

  // Initialiser les filtres vides
  useEffect(() => {
    const init: Record<string, string[]> = {};
    columns.forEach(c => (init[c.key] = []));
    setActiveFilters(init);
  }, []);

  // Fermer dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    const start = new Date(dateDebut);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);

    const rows: ReportRow[] = [];
    let counter = 1;

    // Map des patients pour recherche nom/prénom si manquant
    const patientMap = new Map<string | number, any>();
    (dbState?.patients || []).forEach((p: any) => {
      const id = p.ID_Patient || p.id;
      if (id !== undefined) {
        patientMap.set(String(id), p);
      }
    });

    // 1. File d'attente MPR
    (dbState?.fileAttente || [])
      .filter((a: any) => a.Statut_Attente === 'Terminé' || a.Statut === 'Terminé' || a.Statut === 'Clôturé')
      .forEach((acte: any) => {
        const rawDate = acte.Date_File || acte.Date_Visite || acte.Date;
        const actDate = rawDate ? new Date(rawDate) : new Date();
        if (actDate >= start && actDate <= end) {
          const pat = patientMap.get(String(acte.ID_Patient));
          const { nom, prenom } = parsePatientNomPrenom(
            acte.Nom_Patient || acte.Nom_Prenom || acte.Nom,
            acte.Prenom_Patient || acte.Prenom,
            pat
          );
          const prix = Number(acte.Prix || acte.Prix_Consultation || acte.Montant || 0);
          const versement = acte.Versement !== undefined ? Number(acte.Versement) : (acte.Regle ? prix : 0);
          const creance = prix - versement;

          // PURGE 0.00 DZD lines without debts
          if (prix === 0 && versement === 0 && creance <= 0) return;

          rows.push({
            id: counter++,
            caisse: "Caisse File d'attente MPR (RDC)",
            caisseKey: 'fa',
            nature: getTypeActe(acte, dbState),
            nom,
            prenom,
            date: actDate.toLocaleDateString('fr-FR'),
            montant: prix,
            versement: versement,
            creance: creance,
            duree: acte.Duree || calculateDuree(acte.Heure_Arrivee, acte.Heure_Cloture),
            idFile: acte.ID_File
          });
        }
      });

    // 2. File d'attente IMC
    (dbState?.fileAttenteIMC || [])
      .filter((a: any) => a.Statut_Attente === 'Terminé' || a.Statut === 'Terminé' || a.Statut === 'Clôturé')
      .forEach((acte: any) => {
        const rawDate = acte.Date_File || acte.Date_Visite || acte.Date;
        const actDate = rawDate ? new Date(rawDate) : new Date();
        if (actDate >= start && actDate <= end) {
          const pat = patientMap.get(String(acte.ID_Patient));
          const { nom, prenom } = parsePatientNomPrenom(
            acte.Nom_Patient || acte.Nom_Prenom || acte.Nom,
            acte.Prenom_Patient || acte.Prenom,
            pat
          );
          const prix = Number(acte.Prix || acte.Prix_Soin || acte.Montant || 0);
          const versement = acte.Versement !== undefined ? Number(acte.Versement) : (acte.Regle ? prix : 0);
          const creance = prix - versement;

          // PURGE 0.00 DZD lines without debts
          if (prix === 0 && versement === 0 && creance <= 0) return;

          rows.push({
            id: counter++,
            caisse: 'Caisse Abonnement / Autres Soins',
            caisseKey: 'abo',
            nature: getTypeActe(acte, dbState),
            nom,
            prenom,
            date: actDate.toLocaleDateString('fr-FR'),
            montant: prix,
            versement: versement,
            creance: creance,
            duree: acte.Duree || calculateDuree(acte.Heure_Arrivee, acte.Heure_Cloture),
            idFile: acte.ID_File
          });
        }
      });

    // 3. Séances
    (dbState?.seances || []).forEach((seance: any) => {
      const rawDate = seance.Date_Seance || seance.Date;
      const actDate = rawDate ? new Date(rawDate) : new Date();
      if (actDate >= start && actDate <= end) {
        const pat = patientMap.get(String(seance.ID_Patient));
        const { nom, prenom } = parsePatientNomPrenom(
          seance.Nom_Patient || seance.Nom_Prenom || seance.Nom,
          seance.Prenom_Patient || seance.Prenom,
          pat
        );
        const isBalneo =
          (seance.Type_Seance || '').toLowerCase().includes('balnéo') ||
          (seance.Type_Seance || '').toLowerCase().includes('balneo') ||
          (seance.Service || '').toLowerCase().includes('balnéo') ||
          (seance.Service || '').toLowerCase().includes('balneo');

        const prix = Number(seance.Prix || seance.Prix_Seance || seance.Montant || 0);
        const versement = seance.Versement !== undefined ? Number(seance.Versement) : prix;
        const creance = prix - versement;

        // PURGE 0.00 DZD lines without debts
        if (prix === 0 && versement === 0 && creance <= 0) return;

        rows.push({
          id: counter++,
          caisse: isBalneo ? 'Caisse Balnéothérapie' : 'Caisse Rééducation Adulte',
          caisseKey: isBalneo ? 'bal' : 'reed',
          nature: getTypeActe(seance, dbState),
          nom,
          prenom,
          date: actDate.toLocaleDateString('fr-FR'),
          montant: prix,
          versement: versement,
          creance: creance,
          duree: seance.Duree || calculateDuree(seance.Heure_Debut, seance.Heure_Fin),
          idSeance: seance.ID_Seance
        });
      }
    });

    // 4. Transactions directes de la caisse (dbState.transactions_caisses)
    (dbState?.transactions_caisses || []).forEach((trans: any) => {
      const rawDate = trans.Date_Trans || trans.date_trans || trans.Date;
      const actDate = rawDate ? new Date(rawDate) : new Date();
      if (actDate >= start && actDate <= end) {
        const pat = trans.ID_Patient ? patientMap.get(String(trans.ID_Patient)) : undefined;
        const { nom, prenom } = parsePatientNomPrenom(
          trans.Patient_Nom || trans.Nom_Patient || trans.Nom_Prenom || trans.Nom,
          trans.Patient_Prenom || trans.Prenom_Patient || trans.Prenom,
          pat
        );
        const prix = Number(trans.Montant || 0);
        const versement = trans.Versement !== undefined ? Number(trans.Versement) : prix;
        const creance = prix - versement;

        // PURGE 0.00 DZD lines without debts
        if (prix === 0 && versement === 0 && creance <= 0) return;

        // Avoid duplication if already added from queue/seances
        const isAlreadyAdded = rows.some(r => r.transId === trans.ID_Trans || (trans.ID_File && r.idFile === trans.ID_File));
        if (!isAlreadyAdded) {
          rows.push({
            id: counter++,
            caisse: trans.Caisse || 'Caisse Générale',
            caisseKey: 'trans',
            nature: getTypeActe(trans, dbState),
            nom,
            prenom,
            date: actDate.toLocaleDateString('fr-FR'),
            montant: prix,
            versement: versement,
            creance: creance,
            duree: trans.Duree || '0 00:00',
            transId: trans.ID_Trans,
            idFile: trans.ID_File,
            idSeance: trans.ID_Seance
          });
        }
      }
    });

    setAllRows(rows);
    setTimeout(() => {
      setLoading(false);
    }, 150);
  }, [dateDebut, dateFin, dbState]);

  // CHARGEMENT AUTO au montage et au changement de dates ou dbState
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActualiser = () => {
    loadData();
  };

  // Separation Encaissements vs Créances
  const encaissementsRows = useMemo(() => {
    return allRows.filter(r => r.montant > 0 || r.versement > 0);
  }, [allRows]);

  const creancesRows = useMemo(() => {
    return allRows.filter(r => r.creance > 0);
  }, [allRows]);

  const activeTabRows = useMemo(() => {
    return reportTab === 'encaissements' ? encaissementsRows : creancesRows;
  }, [reportTab, encaissementsRows, creancesRows]);

  // FILTRES
  const filteredRows = useMemo(() => {
    return activeTabRows.filter((row) => {
      return columns.every((col) => {
        const filterVals = activeFilters[col.key];
        if (!filterVals || filterVals.length === 0) return true;
        return filterVals.includes(String(row[col.key as keyof ReportRow]));
      });
    });
  }, [activeTabRows, activeFilters, columns]);

  const getUniqueValues = (field: string) => {
    const counts: Record<string, number> = {};
    activeTabRows.forEach((row) => {
      const val = String(row[field as keyof ReportRow]);
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const toggleFilter = (field: string) => {
    setOpenDropdown(openDropdown === field ? null : field);
  };

  const toggleItem = (field: string, val: string) => {
    setActiveFilters((prev) => {
      const current = [...(prev[field] || [])];
      const idx = current.indexOf(val);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(val);
      return { ...prev, [field]: current };
    });
  };

  const clearFilter = (field: string) => {
    setActiveFilters((prev) => ({ ...prev, [field]: [] }));
  };

  const applyFilter = (_field: string) => {
    setOpenDropdown(null);
  };

  // PAGINATION
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportTab, activeFilters, dateDebut, dateFin]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / pageSize));
  }, [filteredRows.length, pageSize]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Effacer le rapport affiché
  const handleEffacerRapport = () => {
    if (filteredRows.length === 0) {
      if (triggerToast) triggerToast("Aucune entrée à effacer dans le rapport actuel.", "info");
      else alert("Aucune entrée à effacer dans le rapport actuel.");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir effacer les entrées actuellement affichées dans ce rapport ? Cette action supprimera ces lignes du rapport de caisse.")) {
      return;
    }

    const idsToRemoveInTrans = new Set(filteredRows.map(r => r.transId).filter(Boolean));
    const idsToRemoveInFile = new Set(filteredRows.map(r => r.idFile).filter(Boolean));
    const idsToRemoveInSeance = new Set(filteredRows.map(r => r.idSeance).filter(Boolean));

    const fresh = { ...dbState };

    if (fresh.transactions_caisses) {
      fresh.transactions_caisses = fresh.transactions_caisses.filter((t: any) => {
        if (idsToRemoveInTrans.has(t.ID_Trans)) return false;
        if (t.ID_File && idsToRemoveInFile.has(t.ID_File)) return false;
        return true;
      });
    }

    if (fresh.fileAttente) {
      fresh.fileAttente = fresh.fileAttente.filter((f: any) => !idsToRemoveInFile.has(f.ID_File));
    }

    if (fresh.fileAttenteIMC) {
      fresh.fileAttenteIMC = fresh.fileAttenteIMC.filter((f: any) => !idsToRemoveInFile.has(f.ID_File));
    }

    if (fresh.seances) {
      fresh.seances = fresh.seances.filter((s: any) => !idsToRemoveInSeance.has(s.ID_Seance));
    }

    if (setDbState) setDbState(fresh);
    if (onSave) onSave(fresh, ['transactions_caisses', 'fileAttente', 'fileAttenteIMC', 'seances']);

    if (triggerToast) triggerToast("Le rapport affiché a été effacé avec succès.", "success");
    else alert("Le rapport affiché a été effacé avec succès.");

    setAllRows([]);
  };

  // Reset filters
  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateDebut(today);
    setDateFin(today);
    const init: Record<string, string[]> = {};
    columns.forEach(c => (init[c.key] = []));
    setActiveFilters(init);
    if (triggerToast) triggerToast("Filtres réinitialisés.", "info");
  };

  // TOTAUX
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => ({
        montant: acc.montant + (row.montant || 0),
        versement: acc.versement + (row.versement || 0),
        creance: acc.creance + (row.creance || 0),
      }),
      { montant: 0, versement: 0, creance: 0 }
    );
  }, [filteredRows]);

  const formatMontant = (n: number) =>
    Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getCaisseBadgeClass = (key: string) => {
    switch (key) {
      case 'fa':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'bal':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'reed':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'abo':
        return 'bg-violet-50 text-violet-800 border border-violet-200';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200';
    }
  };

  const exportToExcel = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const dataToExport = filteredRows.map((row) => ({
      'N°': row.id,
      'Caisse': row.caisse,
      'TYPE ACTE': row.nature,
      'Nom': row.nom,
      'Prénom': row.prenom,
      'Date': row.date,
      'Montant': row.montant,
      'Versement': row.versement,
      'Créance': row.creance,
      'Durée': row.duree,
    }));

    // Ligne des totaux
    dataToExport.push({
      'N°': '' as any,
      'Caisse': '',
      'TYPE ACTE': '',
      'Nom': 'TOTAL',
      'Prénom': '',
      'Date': '',
      'Montant': totals.montant,
      'Versement': totals.versement,
      'Créance': totals.creance,
      'Durée': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport de Caisse');
    XLSX.writeFile(workbook, `Rapport_Caisse_${dateStr}.xlsx`);
  };

const handlePrint = () => {
  const w = window.open('', '_blank');
  if (!w) return;
  let h = '<html><head><title>Rapport</title><style>';
  h += 'body{font-family:Arial,sans-serif;font-size:10px;padding:20px}';
  h += 'table{width:100%;border-collapse:collapse;margin-top:10px}';
  h += 'th{background:#f1f5f9;border:1px solid #94a3b8;padding:6px;font-weight:700;font-size:10px}';
  h += 'td{border:1px solid #cbd5e1;padding:5px 6px}';
  h += '.r{text-align:right}';
  h += '</style></head><body>';
  h += '<h2>Rapport de Caisse</h2>';
  h += '<p>Periode: ' + dateDebut + ' au ' + dateFin + '</p>';
  h += '<table><thead><tr>';
  h += '<th>N</th><th>Caisse</th><th>Type Acte</th><th>Nom</th><th>Prenom</th>';
  h += '<th>Date</th><th class="r">Montant</th><th class="r">Versement</th>';
  h += '<th class="r">Creance</th><th>Duree</th></tr></thead><tbody>';
  filteredRows.forEach(function(r) {
    h += '<tr><td>' + r.id + '</td><td>' + r.caisse + '</td><td>' + r.nature + '</td>';
    h += '<td>' + r.nom + '</td><td>' + r.prenom + '</td><td>' + r.date + '</td>';
    h += '<td class="r">' + r.montant.toLocaleString('fr-FR',{minimumFractionDigits:2}) + ' DA</td>';
    h += '<td class="r">' + r.versement.toLocaleString('fr-FR',{minimumFractionDigits:2}) + ' DA</td>';
    h += '<td class="r">' + r.creance.toLocaleString('fr-FR',{minimumFractionDigits:2}) + ' DA</td>';
    h += '<td>' + r.duree + '</td></tr>';
  });
  h += '</tbody></table>';
  h += '<p style="margin-top:15px"><b>Total Montant:</b> ' + totals.montant.toLocaleString('fr-FR',{minimumFractionDigits:2}) + ' DA</p>';
  h += '<p><b>Total Versement:</b> ' + totals.versement.toLocaleString('fr-FR',{minimumFractionDigits:2}) + ' DA</p>';
  h += '<p><b>Total Creance:</b> ' + totals.creance.toLocaleString('fr-FR',{minimumFractionDigits:2}) + ' DA</p>';
  h += '</body></html>';
  w.document.write(h);
  w.document.close();
  w.focus();
  setTimeout(function(){ w.print(); }, 500);
};


  return (
    <div className="p-5 bg-gray-50 min-h-screen font-sans text-xs print-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-container, .print-container * {
            visibility: visible !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 10px !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            min-width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 print-header">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a1a2e] flex items-center gap-2.5">
            📊 Rapport de Caisse
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Suivi des encaissements et créances par caisse et par période.
          </p>
        </div>

        {/* ONGLET SWITCHER: ENCAISSEMENTS vs CRÉANCES */}
        <div className="flex items-center bg-gray-200 p-1 rounded-xl gap-1 no-print">
          <button
            type="button"
            onClick={() => setReportTab('encaissements')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              reportTab === 'encaissements'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>💵 Encaissements & Recettes</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              {encaissementsRows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setReportTab('creances')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              reportTab === 'creances'
                ? 'bg-white text-red-800 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>💳 Créances & Solde Dû</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 font-mono">
              {creancesRows.length}
            </span>
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-3.5 rounded-[10px] border border-gray-200 mb-4 gap-3 flex-wrap shadow-2xs no-print">
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs font-semibold text-gray-700">Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500"
          />
          <label className="text-xs font-semibold text-gray-700">au</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleActualiser}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-200 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? '⏳ Chargement...' : '🔄 Actualiser'}
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition cursor-pointer"
            title="Réinitialiser les filtres"
          >
            🔄 Filtres
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* BOUTON EFFACER LE RAPPORT */}
          <button
            type="button"
            onClick={handleEffacerRapport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            title="Supprimer les entrées actuellement affichées dans le rapport"
          >
            🧹 Effacer le rapport
          </button>

          <button onClick={exportToExcel} className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition cursor-pointer">
            📊 Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto" ref={dropdownRef}>
        <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              {columns.map((col) => {
                const isFilterActive = (activeFilters[col.key] || []).length > 0;
                return (
                  <th
                    key={col.key}
                    className="bg-gray-50 text-gray-700 font-semibold text-[11px] uppercase tracking-wide px-2.5 py-3 border-b-2 border-gray-200 whitespace-nowrap relative"
                    style={{ width: col.width }}
                  >
                    <div className="relative inline-block w-full">
                      <div
                        className="flex items-center justify-between gap-1 cursor-pointer select-none hover:text-blue-800"
                        onClick={() => toggleFilter(col.key)}
                      >
                        <span className="truncate">{col.label}</span>
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded transition-all ${
                            openDropdown === col.key || isFilterActive
                              ? 'text-blue-800 bg-blue-100 font-bold'
                              : 'text-gray-400 hover:text-blue-800 hover:bg-blue-100'
                          }`}
                        >
                          ▼
                        </span>
                      </div>

                      {/* DROPDOWN FILTER */}
                      {openDropdown === col.key && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[210px] max-w-[270px] max-h-[300px] overflow-y-auto z-[1000] py-1.5 text-left normal-case">
                          <div className="px-3 py-2 text-[11px] font-bold text-gray-700 border-b border-gray-100 mb-1 flex justify-between items-center">
                            <span>Filtrer par {col.label}</span>
                            {isFilterActive && (
                              <span className="text-[10px] text-blue-600 font-normal">
                                ({activeFilters[col.key].length} sél.)
                              </span>
                            )}
                          </div>

                          {getUniqueValues(col.key).map(([val, count]) => {
                            const isChecked =
                              activeFilters[col.key]?.length === 0 || activeFilters[col.key]?.includes(val);
                            const displayVal = col.numeric
                              ? isNaN(Number(val))
                                ? val
                                : parseFloat(val).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA'
                              : val;

                            return (
                              <div
                                key={val}
                                className={`px-3 py-1.5 text-xs cursor-pointer flex justify-between items-center hover:bg-blue-50 transition ${
                                  isChecked ? 'bg-blue-50/50' : ''
                                }`}
                                onClick={() => toggleItem(col.key, val)}
                              >
                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="w-3.5 h-3.5 accent-blue-800 cursor-pointer flex-shrink-0"
                                  />
                                  <span className="text-gray-800 truncate max-w-[150px] font-medium">
                                    {displayVal}
                                  </span>
                                </div>
                                <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
                                  {count}
                                </span>
                              </div>
                            );
                          })}

                          <div className="flex gap-1.5 px-3 pt-2 mt-1 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => clearFilter(col.key)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-[11px] bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                            >
                              Tout désélectionner
                            </button>
                            <button
                              type="button"
                              onClick={() => applyFilter(col.key)}
                              className="flex-1 px-2 py-1 border border-blue-800 rounded text-[11px] bg-blue-800 text-white hover:bg-blue-900 transition font-semibold cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400 italic">
                  Aucun acte ou enregistrement de caisse trouvé pour cette période.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-2.5 py-2.5 border-b border-gray-100 font-bold text-gray-800">{row.id}</td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${getCaisseBadgeClass(
                        row.caisseKey
                      )}`}
                    >
                      ● {row.caisse}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      {row.nature}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100 font-semibold text-gray-900">{row.nom}</td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100 text-gray-700">{row.prenom}</td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100 text-gray-600">{row.date}</td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100 text-right font-bold font-mono text-slate-800">
                    {formatMontant(row.montant)}
                  </td>
                  <td
                    className={`px-2.5 py-2.5 border-b border-gray-100 text-right font-semibold font-mono ${
                      row.versement > 0 ? 'text-emerald-600' : 'text-gray-500'
                    }`}
                  >
                    {formatMontant(row.versement)}
                  </td>
                  <td
                    className={`px-2.5 py-2.5 border-b border-gray-100 text-right font-semibold font-mono ${
                      row.creance > 0 ? 'text-red-600 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {formatMontant(row.creance)}
                  </td>
                  <td className="px-2.5 py-2.5 border-b border-gray-100 text-gray-500 text-[11px]">{row.duree}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION CONTROLS */}
        {filteredRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>Afficher</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-300 rounded px-2 py-1 font-medium text-xs outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>lignes par page (Total : {filteredRows.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              >
                ◀ Précédent
              </button>
              <span className="font-bold text-gray-800">
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              >
                Suivant ▶
              </button>
            </div>
          </div>
        )}

        {/* TOTAUX */}
        <div className="flex justify-end gap-8 px-6 py-3.5 bg-gray-50 border-t-2 border-gray-200 min-w-[1100px]">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-gray-500 font-medium uppercase">Montant Total</span>
            <span className="text-base font-bold font-mono text-blue-800">{formatMontant(totals.montant)} DA</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-gray-500 font-medium uppercase">Versement</span>
            <span className="text-base font-bold font-mono text-emerald-600">{formatMontant(totals.versement)} DA</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-gray-500 font-medium uppercase">Créance</span>
            <span className="text-base font-bold font-mono text-red-600">{formatMontant(totals.creance)} DA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CashReport);
