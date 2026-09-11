import * as XLSX from 'xlsx';
import { DatabaseState, Pack, Praticien, Acte, Patient, Abonnement, Seance, Versement } from '../dbStore';

export interface CaisseTransaction {
  id: string;
  type: 'recette' | 'depense';
  label: string;
  amount: number;
  payment_method: 'especes' | 'carte' | 'cheque';
  date: string;
  user_role?: string;
}

// =========================================================================
// TYPES & RAPPORT DE SYNCHRONISATION
// =========================================================================

export interface TableDiff {
  total: number;
  newCount: number;
  existCount: number;
  ignoredCount: number;
  errors: string[];
}

export interface MultiDiffReport {
  packs: TableDiff;
  praticiens: TableDiff;
  actes: TableDiff;
  patients: TableDiff;
  abonnements: TableDiff;
  seances: TableDiff;
  versements: TableDiff;
  caisses: TableDiff;
}

export interface TableImportResult {
  sheetFound: boolean;
  sheetNameUsed: string;
  imported: number;
  updated: number;
  ignored: number;
  errors: string[];
}

export interface MultiImportFinalReport {
  packs: TableImportResult;
  praticiens: TableImportResult;
  actes: TableImportResult;
  patients: TableImportResult;
  abonnements: TableImportResult;
  seances: TableImportResult;
  versements: TableImportResult;
  caisses: TableImportResult;
}

// =========================================================================
// NORMALISATION ET MAPPING DES COLONNES (FRANÇAIS & ARABE)
// =========================================================================

const HEADER_MAPPINGS = {
  // Packs & Forfaits
  ID_Pack: ["id pack", "رقم الحزمة", "id_pack", "id", "idpack"],
  Libelle_Pack: ["libelle pack", "libellé pack", "اسم الحزمة", "libelle_pack", "libelle", "nom pack", "nom"],
  Nbre_Seance_Pack: ["nombre seances", "nombre séances", "عدد الجلسات", "nbre_seance_pack", "seances", "séances", "nombre_seances"],
  Prix_Seanc_Pack: ["prix seance", "prix séance", "سعر الجلسة", "prix_seanc_pack", "tarif seance", "prix_seance"],
  Prix_Pack: ["prix pack", "سعر الحزمة", "prix_pack", "tarif pack", "montant pack"],

  // Praticiens
  ID_Prat: ["id praticien", "رقم المعالج", "id_prat", "id_praticien", "id", "idprat", "id_prat_fk"],
  Nom_Prat: ["nom praticien", "اسم المعالج", "nom_prat", "nom", "nom_praticien"],
  Prenom_Prat: ["prenom praticien", "prénom praticien", "الاسم الأول", "prenom_prat", "prenom", "prenom_praticien"],

  // Actes
  ID_Acte: ["id acte", "رقم العمل", "id_acte", "id", "idacte"],
  Libelle_Acte: ["libelle acte", "libellé acte", "اسم العمل", "libelle_acte", "libelle", "acte"],

  // Patients (si présent)
  ID_Patient: ["id patient", "رقم المريض", "id_patient", "patient_id", "id", "idpatient"],
  Nom_Patient: ["nom patient", "اسم المريض", "nom_patient", "nom"],
  Genre_Patient: ["genre patient", "جنس المريض", "genre_patient", "genre", "sexe"],
  Type_Patient: ["type patient", "نوع المريض", "type_patient", "type"],
  Phone: ["phone", "الهاتف", "telephone", "téléphone", "tel"],
  Address: ["address", "العنوان", "adresse"],
  Street: ["street", "الشارع", "rue"],
  City: ["city", "المدينة", "ville"],
  Wilaya: ["wilaya", "الولاية"],

  // Abonnements
  ID_Abn: ["id abonnement", "رقم الاشتراك", "id_abn", "id_abonnement", "abonnement_id", "id", "idabn"],
  Date_Debut_Abn: ["date debut", "date début", "تاريخ البدء", "date_debut_abn", "date_debut", "debut"],
  Date_Fin_Abn: ["date fin", "تاريخ الانتهاء", "date_fin_abn", "date_fin", "fin"],
  Nbre_Sean_Consom_Abn: ["seances consommees", "séances consommées", "عدد الجلسات المستهلكة", "nbre_sean_consom_abn", "consommee", "consommées"],

  // Séances
  ID_Seanc: ["id seance", "id séance", "رقم الجلسة", "id_seanc", "id_seance", "id", "idseance"],
  Date_Seanc_Realisee: ["date seance", "date séance", "تاريخ الجلسة", "date_seanc_realisee", "date_seance", "date"],
  H_Debut_Seanc: ["heure debut", "heure début", "ساعة البدء", "h_debut_seanc", "heure_debut", "h_debut"],
  H_Fin_Seanc: ["heure fin", "ساعة الانتهاء", "h_fin_seanc", "heure_fin", "h_fin"],
  Prix_Seanc: ["prix seance", "prix séance", "سعر الجلسة", "prix_seanc", "prix_seance"],

  // Versements
  ID_Vers: ["id versement", "رقم الدفع", "id_vers", "id_versement", "id", "idversement"],
  Mont_Vers: ["montant verse", "montant versé", "المبلغ المدفوع", "mont_vers", "montant", "somme"],
  Date_Vers: ["date versement", "تاريخ الدفع", "date_vers", "date_versement", "date"],
  Mode_Vers: ["mode versement", "طريقة الدفع", "mode_vers", "mode_versement", "mode"],

  // Caisses (Transactions)
  ID_Caisse: ["id caisse", "رقم الصندوق", "id_caisse", "id", "idcaisse"],
  Montant: ["montant", "المبلغ", "montant", "somme"],
  Date_Encaissement: ["date encaissement", "تاريخ التحصيل", "date_encaissement", "date_caisse", "date", "date_trans", "date_transaction"],
  Mode_Paiement: ["mode paiement", "طريقة الدفع", "mode_paiement", "paiement", "modepaiement"]
};

// Normalisation de chaînes pour comparaisons flexibles
function normalizeStr(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Recherche insensible à la casse des onglets Excel
export function findSheetByName(workbook: XLSX.WorkBook, candidates: string[]): string | null {
  for (const sheetName of workbook.SheetNames) {
    const normSheet = normalizeStr(sheetName);
    for (const cand of candidates) {
      const normCand = normalizeStr(cand);
      if (normSheet === normCand || normSheet.includes(normCand) || normCand.includes(normSheet)) {
        return sheetName;
      }
    }
  }
  return null;
}

// Extraction de valeur d'un en-tête par sa clé interne avec support optionnel de mapping manuel
function getRowValue(row: any, key: keyof typeof HEADER_MAPPINGS, customMapping?: Record<string, string>): any {
  if (!row || typeof row !== 'object') return undefined;
  if (customMapping && customMapping[key]) {
    const customHeader = customMapping[key];
    if (row[customHeader] !== undefined) {
      return row[customHeader];
    }
  }
  const candidates = HEADER_MAPPINGS[key];
  const keys = Object.keys(row);
  for (const rKey of keys) {
    const normRKey = normalizeStr(rKey);
    for (const cand of candidates) {
      const normCand = normalizeStr(cand);
      if (normRKey === normCand || normRKey.replace(/[_ ]/g, '') === normCand.replace(/[_ ]/g, '')) {
        return row[rKey];
      }
    }
  }
  return undefined;
}

// Convertisseur de date Excel (nombre sériel ou texte)
export function parseExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    // Cas du nombre sériel Excel (base 1er janvier 1900)
    const date = new Date((val - 25569) * 86400 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parts = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (parts) {
    const d = parts[1].padStart(2, '0');
    const m = parts[2].padStart(2, '0');
    const y = parts[3];
    return `${y}-${m}-${d}`;
  }
  return str;
}

// Convertisseur d'heure Excel (fraction de journée ou texte)
export function parseExcelTime(val: any): string {
  if (val === undefined || val === null || val === '') return '08:00';
  if (typeof val === 'number') {
    const totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return String(val).trim();
}

// Convertisseurs génériques
export function parseNumber(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(String(val).replace(/[\s,]/g, ''));
  return isNaN(num) ? null : num;
}

export function parseString(val: any): string | null {
  if (val === undefined || val === null || String(val).trim() === '') return null;
  return String(val).trim();
}

export function parseBool(val: any): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (s === 'oui' || s === 'yes' || s === 'vrai' || s === 'true' || s === '1' || val === 1) return true;
  return false;
}

// =========================================================================
// FONCTION 1 : VÉRIFIER LES DIFFÉRENCES (ANALYSE SANS MODIFIER)
// =========================================================================

export function analyzeExcelDifferences(
  fileData: ArrayBuffer,
  dbState: DatabaseState,
  sheetToTableMap?: Record<string, string>,
  columnMappings?: Record<string, Record<string, string>>
): MultiDiffReport {
  const workbook = XLSX.read(new Uint8Array(fileData), { type: 'array' });

  const initTableDiff = (): TableDiff => ({
    total: 0,
    newCount: 0,
    existCount: 0,
    ignoredCount: 0,
    errors: []
  });

  const diff: MultiDiffReport = {
    packs: initTableDiff(),
    praticiens: initTableDiff(),
    actes: initTableDiff(),
    patients: initTableDiff(),
    abonnements: initTableDiff(),
    seances: initTableDiff(),
    versements: initTableDiff(),
    caisses: initTableDiff()
  };

  // Résolveur de nom de feuille
  const findCustomSheet = (tableKey: string, defaultCandidates: string[]): string | null => {
    if (sheetToTableMap) {
      const matched = Object.entries(sheetToTableMap).find(([sName, tKey]) => tKey === tableKey);
      if (matched) return matched[0];
    }
    return findSheetByName(workbook, defaultCandidates);
  };

  // Résolveur de valeur dynamique avec support fallback sur l'en-tête
  const getVal = (row: any, key: keyof typeof HEADER_MAPPINGS, tableKey: string) => {
    if (columnMappings?.[tableKey]?.[key]) {
      return getRowValue(row, key, columnMappings[tableKey]);
    }
    if (columnMappings) {
      for (const tKey of Object.keys(columnMappings)) {
        if (columnMappings[tKey]?.[key]) {
          const customHeader = columnMappings[tKey][key];
          if (row[customHeader] !== undefined) {
            return row[customHeader];
          }
        }
      }
    }
    return getRowValue(row, key);
  };

  // 1. Packs & Forfaits
  const sheetPacksName = findCustomSheet('packs', ["Packs & Forfaits", "packs", "forfaits"]);
  if (sheetPacksName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetPacksName], { defval: '' });
      diff.packs.total = rows.length;
      rows.forEach(row => {
        const libelle = parseString(getVal(row, 'Libelle_Pack', 'packs'));
        if (!libelle) {
          diff.packs.ignoredCount++;
          return;
        }
        const match = dbState.packs?.find(p => normalizeStr(p.Libelle_Pack) === normalizeStr(libelle));
        if (match) diff.packs.existCount++;
        else diff.packs.newCount++;
      });
    } catch (e: any) {
      diff.packs.errors.push(e.message || String(e));
    }
  }

  // 2. Praticiens
  const sheetPratName = findCustomSheet('praticiens', ["Praticiens (Personnel)", "praticiens", "personnel", "staff"]);
  if (sheetPratName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetPratName], { defval: '' });
      diff.praticiens.total = rows.length;
      rows.forEach(row => {
        const nom = parseString(getVal(row, 'Nom_Prat', 'praticiens'));
        const prenom = parseString(getVal(row, 'Prenom_Prat', 'praticiens'));
        if (!nom || !prenom) {
          diff.praticiens.ignoredCount++;
          return;
        }
        const match = dbState.praticiens?.find(
          p => normalizeStr(p.Nom_Prat) === normalizeStr(nom) && normalizeStr(p.Prenom_Prat) === normalizeStr(prenom)
        );
        if (match) diff.praticiens.existCount++;
        else diff.praticiens.newCount++;
      });
    } catch (e: any) {
      diff.praticiens.errors.push(e.message || String(e));
    }
  }

  // 3. Actes Médicaux
  const sheetActesName = findCustomSheet('actes', ["Actes Médicaux", "actes", "prestations"]);
  if (sheetActesName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetActesName], { defval: '' });
      diff.actes.total = rows.length;
      rows.forEach(row => {
        const libelle = parseString(getVal(row, 'Libelle_Acte', 'actes'));
        if (!libelle) {
          diff.actes.ignoredCount++;
          return;
        }
        const match = dbState.actes?.find(a => normalizeStr(a.Libelle_Acte) === normalizeStr(libelle));
        if (match) diff.actes.existCount++;
        else diff.actes.newCount++;
      });
    } catch (e: any) {
      diff.actes.errors.push(e.message || String(e));
    }
  }

  // 4. Patients
  const sheetPatientsName = findCustomSheet('patients', ["Patients", "patient", "المعالجین"]);
  if (sheetPatientsName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetPatientsName], { defval: '' });
      diff.patients.total = rows.length;
      rows.forEach(row => {
        const nom = parseString(getVal(row, 'Nom_Patient', 'patients'));
        const phone = parseString(getVal(row, 'Phone', 'patients')) || 'Non renseigné';
        if (!nom) {
          diff.patients.ignoredCount++;
          return;
        }
        const match = dbState.patients?.find(
          p => normalizeStr(p.Nom_Patient) === normalizeStr(nom) && normalizeStr(p.phone) === normalizeStr(phone)
        );
        if (match) diff.patients.existCount++;
        else diff.patients.newCount++;
      });
    } catch (e: any) {
      diff.patients.errors.push(e.message || String(e));
    }
  }

  // 5. Abonnements
  const sheetAbnName = findCustomSheet('abonnements', ["Abonnements", "contrats", "subscriptions"]);
  if (sheetAbnName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetAbnName], { defval: '' });
      diff.abonnements.total = rows.length;
      rows.forEach(row => {
        const idPatient = parseNumber(getVal(row, 'ID_Patient', 'abonnements'));
        const idPack = parseNumber(getVal(row, 'ID_Pack', 'abonnements'));
        const dateDebut = parseExcelDate(getVal(row, 'Date_Debut_Abn', 'abonnements'));

        if (!idPatient || !idPack || !dateDebut) {
          diff.abonnements.ignoredCount++;
          return;
        }
        const match = dbState.abonnements?.find(
          a => a.ID_Patient === idPatient && a.ID_Pack === idPack && a.Date_Debut_Abn === dateDebut
        );
        if (match) diff.abonnements.existCount++;
        else diff.abonnements.newCount++;
      });
    } catch (e: any) {
      diff.abonnements.errors.push(e.message || String(e));
    }
  }

  // 6. Séances Réalisées
  const sheetSeancesName = findCustomSheet('seances', ["Séances Réalisées", "séances", "seances", "realisees"]);
  if (sheetSeancesName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetSeancesName], { defval: '' });
      diff.seances.total = rows.length;
      rows.forEach(row => {
        const idPatient = parseNumber(getVal(row, 'ID_Patient', 'seances'));
        const dateSeance = parseExcelDate(getVal(row, 'Date_Seanc_Realisee', 'seances'));
        const hDebut = parseExcelTime(getVal(row, 'H_Debut_Seanc', 'seances'));

        if (!idPatient || !dateSeance) {
          diff.seances.ignoredCount++;
          return;
        }

        const match = dbState.seances?.find(
          s => s.ID_Patient === idPatient && s.Date_Seanc_Realisee === dateSeance && s.H_Debut_Seanc === hDebut
        );
        if (match) diff.seances.existCount++;
        else diff.seances.newCount++;
      });
    } catch (e: any) {
      diff.seances.errors.push(e.message || String(e));
    }
  }

  // 7. Versements (Paiements)
  const sheetVersName = findCustomSheet('versements', ["Versements (Paiements)", "versements", "paiements", "reglements"]);
  if (sheetVersName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetVersName], { defval: '' });
      diff.versements.total = rows.length;
      rows.forEach(row => {
        const idAbn = parseNumber(getVal(row, 'ID_Abn', 'versements'));
        const mont = parseNumber(getVal(row, 'Mont_Vers', 'versements'));
        const dateVers = parseExcelDate(getVal(row, 'Date_Vers', 'versements'));

        if (!idAbn || mont === null || !dateVers) {
          diff.versements.ignoredCount++;
          return;
        }

        const match = dbState.versements?.find(
          v => v.ID_Abn === idAbn && v.Mont_Vers === mont && v.Date_Vers === dateVers
        );
        if (match) diff.versements.existCount++;
        else diff.versements.newCount++;
      });
    } catch (e: any) {
      diff.versements.errors.push(e.message || String(e));
    }
  }

  // 8. Transactions Caisses
  const sheetCaissesName = findCustomSheet('caisses', ["Transactions Caisses", "caisses", "transactions"]);
  if (sheetCaissesName) {
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetCaissesName], { defval: '' });
      diff.caisses.total = rows.length;
      rows.forEach(row => {
        const mont = parseNumber(getVal(row, 'Montant', 'caisses'));
        const dateTrans = parseExcelDate(getVal(row, 'Date_Encaissement', 'caisses'));
        const patId = parseNumber(getVal(row, 'ID_Patient', 'caisses'));

        if (mont === null || !dateTrans) {
          diff.caisses.ignoredCount++;
          return;
        }

        let patName = 'Divers';
        if (patId) {
          const pat = dbState.patients?.find(p => p.ID_Patient === patId);
          if (pat) patName = pat.Nom_Patient;
        }

        const match = dbState.transactions_caisses?.find(
          t => t.Date_Trans === dateTrans && t.Montant === mont && normalizeStr(t.Patient_Nom) === normalizeStr(patName)
        );
        if (match) diff.caisses.existCount++;
        else diff.caisses.newCount++;
      });
    } catch (e: any) {
      diff.caisses.errors.push(e.message || String(e));
    }
  }

  return diff;
}

// =========================================================================
// FONCTION 2 : APPLIQUER L'IMPORT ET RE-MAPPER LES CLÉS ÉTRANGÈRES
// =========================================================================

export function executeExcelImport(
  fileData: ArrayBuffer,
  dbState: DatabaseState,
  sheetToTableMap?: Record<string, string>,
  columnMappings?: Record<string, Record<string, string>>
): { newState: DatabaseState; report: MultiImportFinalReport } {
  const workbook = XLSX.read(new Uint8Array(fileData), { type: 'array' });

  // Cloner de manière sûre
  const fresh: DatabaseState = {
    ...dbState,
    packs: dbState.packs ? [...dbState.packs] : [],
    praticiens: dbState.praticiens ? [...dbState.praticiens] : [],
    actes: dbState.actes ? [...dbState.actes] : [],
    patients: dbState.patients ? [...dbState.patients] : [],
    abonnements: dbState.abonnements ? [...dbState.abonnements] : [],
    seances: dbState.seances ? [...dbState.seances] : [],
    versements: dbState.versements ? [...dbState.versements] : [],
    transactions_caisses: dbState.transactions_caisses ? [...dbState.transactions_caisses] : []
  };

  const initResult = (): TableImportResult => ({
    sheetFound: false,
    sheetNameUsed: '',
    imported: 0,
    updated: 0,
    ignored: 0,
    errors: []
  });

  const report: MultiImportFinalReport = {
    packs: initResult(),
    praticiens: initResult(),
    actes: initResult(),
    patients: initResult(),
    abonnements: initResult(),
    seances: initResult(),
    versements: initResult(),
    caisses: initResult()
  };

  // Mappings de conversion (Ancien ID -> Nouveau ID)
  const packIdMap = new Map<number, number>();
  const pratIdMap = new Map<number, number>();
  const acteIdMap = new Map<number, number>();
  const patientIdMap = new Map<number, number>();
  const abnIdMap = new Map<number, number>();
  const seanceIdMap = new Map<number, number>();

  // Pré-peupler les mappings avec ce qui est déjà existant en base de données
  fresh.packs.forEach(p => packIdMap.set(p.ID_Pack, p.ID_Pack));
  fresh.praticiens.forEach(p => pratIdMap.set(p.ID_Prat, p.ID_Prat));
  fresh.actes.forEach(a => acteIdMap.set(a.ID_Acte, a.ID_Acte));
  fresh.patients.forEach(p => patientIdMap.set(p.ID_Patient, p.ID_Patient));
  fresh.abonnements.forEach(a => abnIdMap.set(a.ID_Abn, a.ID_Abn));
  fresh.seances.forEach(s => seanceIdMap.set(s.ID_Seanc, s.ID_Seanc));

  // Résolveur de nom de feuille
  const findCustomSheet = (tableKey: string, defaultCandidates: string[]): string | null => {
    if (sheetToTableMap) {
      const matched = Object.entries(sheetToTableMap).find(([sName, tKey]) => tKey === tableKey);
      if (matched) return matched[0];
    }
    return findSheetByName(workbook, defaultCandidates);
  };

  // Résolveur de valeur dynamique avec support fallback sur l'en-tête
  const getVal = (row: any, key: keyof typeof HEADER_MAPPINGS, tableKey: string) => {
    if (columnMappings?.[tableKey]?.[key]) {
      return getRowValue(row, key, columnMappings[tableKey]);
    }
    if (columnMappings) {
      for (const tKey of Object.keys(columnMappings)) {
        if (columnMappings[tKey]?.[key]) {
          const customHeader = columnMappings[tKey][key];
          if (row[customHeader] !== undefined) {
            return row[customHeader];
          }
        }
      }
    }
    return getRowValue(row, key);
  };

  // =========================================================================
  // ÉTAPE 1 : Packs & Forfaits
  // =========================================================================
  const sheetPacksName = findCustomSheet('packs', ["Packs & Forfaits", "packs", "forfaits"]);
  if (sheetPacksName) {
    report.packs.sheetFound = true;
    report.packs.sheetNameUsed = sheetPacksName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetPacksName], { defval: '' });
      let maxId = fresh.packs.length > 0 ? Math.max(...fresh.packs.map(p => p.ID_Pack)) : 0;

      rows.forEach((row) => {
        const rawId = parseNumber(getVal(row, 'ID_Pack', 'packs'));
        const libelle = parseString(getVal(row, 'Libelle_Pack', 'packs'));
        const qty = parseNumber(getVal(row, 'Nbre_Seance_Pack', 'packs')) || 10;
        const prixSeance = parseNumber(getVal(row, 'Prix_Seanc_Pack', 'packs'));
        const prixPack = parseNumber(getVal(row, 'Prix_Pack', 'packs'));

        if (!libelle) {
          report.packs.ignored++;
          return;
        }

        const existing = fresh.packs.find(p => normalizeStr(p.Libelle_Pack) === normalizeStr(libelle));
        if (existing) {
          report.packs.updated++; // Doublon déjà existant, on l'associe
          if (rawId !== null) packIdMap.set(rawId, existing.ID_Pack);
        } else {
          maxId++;
          const newId = maxId;
          const newPack: Pack = {
            ID_Pack: newId,
            Libelle_Pack: libelle,
            Nbre_Seance_Pack: qty,
            Prix_Pack: prixPack !== null ? prixPack : undefined,
            Prix_Seanc_Pack: prixSeance !== null ? prixSeance : undefined,
            Cat_Pack: 'R'
          };
          fresh.packs.push(newPack);
          report.packs.imported++;
          if (rawId !== null) packIdMap.set(rawId, newId);
        }
      });
    } catch (e: any) {
      report.packs.errors.push(e.message || String(e));
    }
  }

  // =========================================================================
  // ÉTAPE 2 : Praticiens (Personnel)
  // =========================================================================
  const sheetPratName = findCustomSheet('praticiens', ["Praticiens (Personnel)", "praticiens", "personnel", "staff"]);
  if (sheetPratName) {
    report.praticiens.sheetFound = true;
    report.praticiens.sheetNameUsed = sheetPratName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetPratName], { defval: '' });
      let maxId = fresh.praticiens.length > 0 ? Math.max(...fresh.praticiens.map(p => p.ID_Prat)) : 0;

      rows.forEach((row) => {
        const rawId = parseNumber(getVal(row, 'ID_Prat', 'praticiens'));
        const nom = parseString(getVal(row, 'Nom_Prat', 'praticiens'));
        const prenom = parseString(getVal(row, 'Prenom_Prat', 'praticiens'));

        if (!nom || !prenom) {
          report.praticiens.ignored++;
          return;
        }

        const existing = fresh.praticiens.find(
          p => normalizeStr(p.Nom_Prat) === normalizeStr(nom) && normalizeStr(p.Prenom_Prat) === normalizeStr(prenom)
        );

        if (existing) {
          report.praticiens.updated++;
          if (rawId !== null) praticiensIdAssign(rawId, existing.ID_Prat);
        } else {
          maxId++;
          const newId = maxId;
          const newPrat: Praticien = {
            ID_Prat: newId,
            ID_Sce: 1,
            Repere: 'K',
            Nom_Prat: nom,
            Prenom_Prat: prenom,
            Date_Nais_Prat: '1985-01-01',
            Date_Recrut_Prat: '2020-01-01',
            Type_Cont_Prat: 'CDI',
            Genre_Prat: 'H'
          };
          fresh.praticiens.push(newPrat);
          report.praticiens.imported++;
          if (rawId !== null) praticiensIdAssign(rawId, newId);
        }
      });
    } catch (e: any) {
      report.praticiens.errors.push(e.message || String(e));
    }
  }

  function praticiensIdAssign(rawId: number, realId: number) {
    pratIdMap.set(rawId, realId);
  }

  // =========================================================================
  // ÉTAPE 3 : Actes Médicaux
  // =========================================================================
  const sheetActesName = findCustomSheet('actes', ["Actes Médicaux", "actes", "prestations"]);
  if (sheetActesName) {
    report.actes.sheetFound = true;
    report.actes.sheetNameUsed = sheetActesName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetActesName], { defval: '' });
      let maxId = fresh.actes.length > 0 ? Math.max(...fresh.actes.map(a => a.ID_Acte)) : 0;

      rows.forEach((row) => {
        const rawId = parseNumber(getVal(row, 'ID_Acte', 'actes'));
        const libelle = parseString(getVal(row, 'Libelle_Acte', 'actes'));

        if (!libelle) {
          report.actes.ignored++;
          return;
        }

        const existing = fresh.actes.find(a => normalizeStr(a.Libelle_Acte) === normalizeStr(libelle));
        if (existing) {
          report.actes.updated++;
          if (rawId !== null) acteIdMap.set(rawId, existing.ID_Acte);
        } else {
          maxId++;
          const newId = maxId;
          const newActe: Acte = {
            ID_Acte: newId,
            Libelle_Acte: libelle,
            Prix_Acte: 1500
          };
          fresh.actes.push(newActe);
          report.actes.imported++;
          if (rawId !== null) acteIdMap.set(rawId, newId);
        }
      });
    } catch (e: any) {
      report.actes.errors.push(e.message || String(e));
    }
  }

  // =========================================================================
  // ÉTAPE 4 : Patients (Si onglet présent, sinon on peut les créer via les séances)
  // =========================================================================
  const sheetPatientsName = findCustomSheet('patients', ["Patients", "patient"]);
  if (sheetPatientsName) {
    report.patients.sheetFound = true;
    report.patients.sheetNameUsed = sheetPatientsName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetPatientsName], { defval: '' });
      let maxId = fresh.patients.length > 0 ? Math.max(...fresh.patients.map(p => p.ID_Patient)) : 0;

      rows.forEach((row) => {
        const rawId = parseNumber(getVal(row, 'ID_Patient', 'patients'));
        const nom = parseString(getVal(row, 'Nom_Patient', 'patients'));
        const phone = parseString(getVal(row, 'Phone', 'patients')) || 'Non renseigné';
        const genre = parseString(getVal(row, 'Genre_Patient', 'patients')) || 'Homme';
        const typePat = parseString(getVal(row, 'Type_Patient', 'patients')) || 'Adulte';

        if (!nom) {
          report.patients.ignored++;
          return;
        }

        const existing = fresh.patients.find(
          p => normalizeStr(p.Nom_Patient) === normalizeStr(nom) && normalizeStr(p.phone) === normalizeStr(phone)
        );

        if (existing) {
          report.patients.updated++;
          if (rawId !== null) patientIdMap.set(rawId, existing.ID_Patient);
        } else {
          maxId++;
          const newId = maxId;
          const newPat: Patient = {
            ID_Patient: newId,
            Nom_Patient: nom,
            Genre_Patient: (genre.startsWith('F') || genre.toLowerCase().includes('femme')) ? 'Femme' : 'Homme',
            type_patient: typePat,
            phone: phone,
            address: parseString(getVal(row, 'Address', 'patients')) || 'Importé',
            street: parseString(getVal(row, 'Street', 'patients')) || 'Importé',
            city: parseString(getVal(row, 'City', 'patients')) || 'Alger',
            wilaya: parseString(getVal(row, 'Wilaya', 'patients')) || '16'
          };
          fresh.patients.push(newPat);
          report.patients.imported++;
          if (rawId !== null) patientIdMap.set(rawId, newId);
        }
      });
    } catch (e: any) {
      report.patients.errors.push(e.message || String(e));
    }
  }

  // Fonction pour résoudre l'ID Patient (gère le fallback si l'ID n'est pas mappé ou si le patient n'était pas dans l'onglet Patients)
  function resolveOrImportPatient(rawId: number | null, row: any): number {
    if (rawId !== null && patientIdMap.has(rawId)) {
      return patientIdMap.get(rawId)!;
    }
    // Fallback par Nom_Patient si l'ID d'origine est absent ou non mappé
    const rawNom = parseString(getVal(row, 'Nom_Patient', 'patients'));
    const rawPhone = parseString(getVal(row, 'Phone', 'patients')) || 'Non renseigné';
    if (rawNom) {
      const existing = fresh.patients.find(
        p => normalizeStr(p.Nom_Patient) === normalizeStr(rawNom) && normalizeStr(p.phone) === normalizeStr(rawPhone)
      );
      if (existing) {
        if (rawId !== null) patientIdMap.set(rawId, existing.ID_Patient);
        return existing.ID_Patient;
      }
      // Auto-création du patient s'il n'existe pas encore
      const nextId = fresh.patients.length > 0 ? Math.max(...fresh.patients.map(p => p.ID_Patient)) + 1 : 1;
      const newPat: Patient = {
        ID_Patient: nextId,
        Nom_Patient: rawNom,
        Genre_Patient: 'Homme',
        type_patient: 'Adulte',
        phone: rawPhone,
        address: 'Auto-généré à l\'import',
        street: 'Auto-généré',
        city: 'Alger',
        wilaya: '16'
      };
      fresh.patients.push(newPat);
      report.patients.imported++;
      if (rawId !== null) patientIdMap.set(rawId, nextId);
      return nextId;
    }
    // Si aucun nom, on renvoie le premier patient de la base ou 1
    return fresh.patients.length > 0 ? fresh.patients[0].ID_Patient : 1;
  }

  // =========================================================================
  // ÉTAPE 5 : Abonnements
  // =========================================================================
  const sheetAbnName = findCustomSheet('abonnements', ["Abonnements", "contrats", "subscriptions"]);
  if (sheetAbnName) {
    report.abonnements.sheetFound = true;
    report.abonnements.sheetNameUsed = sheetAbnName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetAbnName], { defval: '' });
      let maxId = fresh.abonnements.length > 0 ? Math.max(...fresh.abonnements.map(a => a.ID_Abn)) : 0;

      rows.forEach((row) => {
        const rawId = parseNumber(getVal(row, 'ID_Abn', 'abonnements'));
        const rawPatientId = parseNumber(getVal(row, 'ID_Patient', 'abonnements'));
        const rawPackId = parseNumber(getVal(row, 'ID_Pack', 'abonnements'));
        const dateDebut = parseExcelDate(getVal(row, 'Date_Debut_Abn', 'abonnements')) || new Date().toISOString().split('T')[0];
        const dateFin = parseExcelDate(getVal(row, 'Date_Fin_Abn', 'abonnements')) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const consomme = parseNumber(getVal(row, 'Nbre_Sean_Consom_Abn', 'abonnements')) || 0;

        const realPatientId = resolveOrImportPatient(rawPatientId, row);
        const realPackId = (rawPackId !== null && packIdMap.has(rawPackId)) ? packIdMap.get(rawPackId)! : (fresh.packs.length > 0 ? fresh.packs[0].ID_Pack : 1);

        // Déduplication de l'abonnement par (ID_Patient + ID_Pack + Date_Debut_Abn)
        const existing = fresh.abonnements.find(
          a => a.ID_Patient === realPatientId && a.ID_Pack === realPackId && a.Date_Debut_Abn === dateDebut
        );

        if (existing) {
          report.abonnements.updated++;
          if (rawId !== null) abnIdMap.set(rawId, existing.ID_Abn);
        } else {
          maxId++;
          const newId = maxId;
          const newAbn: Abonnement = {
            ID_Abn: newId,
            ID_Patient: realPatientId,
            ID_Pack: realPackId,
            Date_Debut_Abn: dateDebut,
            Date_Fin_Abn: dateFin,
            Nbre_Sean_Consom_Abn: consomme,
            ID_Acte_Add1: null,
            ID_Acte_Add2: null,
            Etat: 'Actif'
          };
          fresh.abonnements.push(newAbn);
          report.abonnements.imported++;
          if (rawId !== null) abnIdMap.set(rawId, newId);
        }
      });
    } catch (e: any) {
      report.abonnements.errors.push(e.message || String(e));
    }
  }

  // Résolveur d'abonnement
  function resolveOrImportAbonnement(rawId: number | null, patientId: number, row: any): number {
    if (rawId !== null && abnIdMap.has(rawId)) {
      return abnIdMap.get(rawId)!;
    }
    // Si absent, on essaie de trouver un abonnement existant pour ce patient
    const match = fresh.abonnements.find(a => a.ID_Patient === patientId);
    if (match) {
      if (rawId !== null) abnIdMap.set(rawId, match.ID_Abn);
      return match.ID_Abn;
    }
    // Création automatique
    const nextId = fresh.abonnements.length > 0 ? Math.max(...fresh.abonnements.map(a => a.ID_Abn)) + 1 : 1;
    const defaultPackId = fresh.packs.length > 0 ? fresh.packs[0].ID_Pack : 1;
    const newAbn: Abonnement = {
      ID_Abn: nextId,
      ID_Patient: patientId,
      ID_Pack: defaultPackId,
      Date_Debut_Abn: new Date().toISOString().split('T')[0],
      Date_Fin_Abn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Nbre_Sean_Consom_Abn: 0,
      ID_Acte_Add1: null,
      ID_Acte_Add2: null,
      Etat: 'Actif'
    };
    fresh.abonnements.push(newAbn);
    report.abonnements.imported++;
    if (rawId !== null) abnIdMap.set(rawId, nextId);
    return nextId;
  }

  // =========================================================================
  // ÉTAPE 6 : Séances Réalisées
  // =========================================================================
  const sheetSeancesName = findCustomSheet('seances', ["Séances Réalisées", "séances", "seances", "realisees"]);
  if (sheetSeancesName) {
    report.seances.sheetFound = true;
    report.seances.sheetNameUsed = sheetSeancesName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetSeancesName], { defval: '' });
      let maxId = fresh.seances.length > 0 ? Math.max(...fresh.seances.map(s => s.ID_Seanc)) : 0;

      rows.forEach((row) => {
        const rawId = parseNumber(getVal(row, 'ID_Seanc', 'seances'));
        const rawPatientId = parseNumber(getVal(row, 'ID_Patient', 'seances'));
        const rawActeId = parseNumber(getVal(row, 'ID_Acte', 'seances'));
        const rawPraticienId = parseNumber(getVal(row, 'ID_Prat', 'seances'));
        const rawAbnId = parseNumber(getVal(row, 'ID_Abn', 'seances'));
        const dateSeance = parseExcelDate(getVal(row, 'Date_Seanc_Realisee', 'seances'));
        const hDebut = parseExcelTime(getVal(row, 'H_Debut_Seanc', 'seances'));
        const hFin = parseExcelTime(getVal(row, 'H_Fin_Seanc', 'seances')) || '08:30';
        const prix = parseNumber(getVal(row, 'Prix_Seanc', 'seances')) || 1500;

        if (!dateSeance) {
          report.seances.ignored++;
          return;
        }

        const realPatientId = resolveOrImportPatient(rawPatientId, row);
        const realPratId = (rawPraticienId !== null && pratIdMap.has(rawPraticienId)) ? pratIdMap.get(rawPraticienId)! : (fresh.praticiens.length > 0 ? fresh.praticiens[0].ID_Prat : 1);
        const realActeId = (rawActeId !== null && acteIdMap.has(rawActeId)) ? acteIdMap.get(rawActeId)! : (fresh.actes.length > 0 ? fresh.actes[0].ID_Acte : 1);
        const realAbnId = resolveOrImportAbonnement(rawAbnId, realPatientId, row);

        // Déduplication : (Patient + Date + Heure_Début)
        const isDup = fresh.seances.some(
          s => s.ID_Patient === realPatientId && s.Date_Seanc_Realisee === dateSeance && s.H_Debut_Seanc === hDebut
        );

        if (isDup) {
          report.seances.updated++;
        } else {
          maxId++;
          const newId = maxId;
          const newSeance: Seance = {
            ID_Seanc: newId,
            ID_Patient: realPatientId,
            ID_Prat: realPratId,
            ID_Acte: realActeId,
            ID_Abn: realAbnId,
            ID_RDV: null,
            H_Debut_Seanc: hDebut,
            H_Fin_Seanc: hFin,
            Prix_Seanc: prix,
            Date_Seanc_Realisee: dateSeance
          };
          fresh.seances.push(newSeance);
          report.seances.imported++;
          if (rawId !== null) seanceIdMap.set(rawId, newId);

          // Mettre à jour le compteur d'abonnements consommé
          const idxAbn = fresh.abonnements.findIndex(a => a.ID_Abn === realAbnId);
          if (idxAbn !== -1) {
            fresh.abonnements[idxAbn].Nbre_Sean_Consom_Abn += 1;
          }
        }
      });
    } catch (e: any) {
      report.seances.errors.push(e.message || String(e));
    }
  }

  // =========================================================================
  // ÉTAPE 7 : Versements (Paiements)
  // =========================================================================
  const sheetVersName = findCustomSheet('versements', ["Versements (Paiements)", "versements", "paiements", "reglements"]);
  if (sheetVersName) {
    report.versements.sheetFound = true;
    report.versements.sheetNameUsed = sheetVersName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetVersName], { defval: '' });
      let maxId = fresh.versements.length > 0 ? Math.max(...fresh.versements.map(v => v.ID_Vers)) : 0;

      rows.forEach((row) => {
        const rawPatientId = parseNumber(getVal(row, 'ID_Patient', 'versements'));
        const rawAbnId = parseNumber(getVal(row, 'ID_Abn', 'versements'));
        const amount = parseNumber(getVal(row, 'Mont_Vers', 'versements'));
        const dateVers = parseExcelDate(getVal(row, 'Date_Vers', 'versements'));
        const mode = parseString(getVal(row, 'Mode_Vers', 'versements')) || 'Espèces';

        if (amount === null || !dateVers) {
          report.versements.ignored++;
          return;
        }

        const realPatientId = resolveOrImportPatient(rawPatientId, row);
        const realAbnId = resolveOrImportAbonnement(rawAbnId, realPatientId, row);

        const isDup = fresh.versements.some(
          v => v.ID_Abn === realAbnId && v.Mont_Vers === amount && v.Date_Vers === dateVers
        );

        if (isDup) {
          report.versements.updated++;
        } else {
          maxId++;
          const newId = maxId;
          const newVersement: Versement = {
            ID_Vers: newId,
            ID_Abn: realAbnId,
            Mont_Vers: amount,
            Date_Vers: dateVers,
            Mode_Vers: mode
          };
          fresh.versements.push(newVersement);
          report.versements.imported++;
        }
      });
    } catch (e: any) {
      report.versements.errors.push(e.message || String(e));
    }
  }

  // =========================================================================
  // ÉTAPE 8 : Transactions Caisses
  // =========================================================================
  const sheetCaissesName = findCustomSheet('caisses', ["Transactions Caisses", "caisses", "transactions"]);
  if (sheetCaissesName) {
    report.caisses.sheetFound = true;
    report.caisses.sheetNameUsed = sheetCaissesName;
    try {
      const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetCaissesName], { defval: '' });
      let maxId = fresh.transactions_caisses && fresh.transactions_caisses.length > 0
        ? Math.max(...fresh.transactions_caisses.map(t => t.ID_Trans || 0))
        : 0;

      rows.forEach((row) => {
        const rawPatientId = parseNumber(getVal(row, 'ID_Patient', 'caisses'));
        const rawSeanceId = parseNumber(getVal(row, 'ID_Seanc', 'caisses'));
        const rawAbnId = parseNumber(getVal(row, 'ID_Abn', 'caisses'));
        const amount = parseNumber(getVal(row, 'Montant', 'caisses'));
        const dateTrans = parseExcelDate(getVal(row, 'Date_Encaissement', 'caisses'));
        const mode = parseString(getVal(row, 'Mode_Paiement', 'caisses')) || 'Espèces';

        if (amount === null || !dateTrans) {
          report.caisses.ignored++;
          return;
        }

        const realPatientId = resolveOrImportPatient(rawPatientId, row);
        const patientObj = fresh.patients.find(p => p.ID_Patient === realPatientId);
        const patName = patientObj ? patientObj.Nom_Patient : 'Divers';

        const isDup = fresh.transactions_caisses && fresh.transactions_caisses.some(
          t => t.Date_Trans === dateTrans && t.Montant === amount && normalizeStr(t.Patient_Nom) === normalizeStr(patName)
        );

        if (isDup) {
          report.caisses.updated++;
        } else {
          maxId++;
          const newId = maxId;

          // Déduire le libellé de l'encaissement de manière humaine et polie
          let label = "Encaissement Forfait";
          if (rawSeanceId !== null) {
            label = "Règlement séance soins";
          } else if (rawAbnId !== null) {
            label = "Encaissement Abonnement Forfait";
          }

          const newTx: CaisseTransaction = {
            id: `tx-${newId}`, // format id string comme dans INITIAL_CAISSE_TRANSACTIONS
            type: 'recette',
            label: `${label} - ${patName}`,
            amount: amount,
            payment_method: (mode.toLowerCase().includes('carte') || mode.toLowerCase().includes('cib')) ? 'carte' : 'especes',
            date: dateTrans,
            user_role: 'admin'
          };

          // Ajouter aussi à transactions_caisses de type dénormalisé pour CaissesManager
          const newTxDenorm = {
            ID_Trans: newId,
            Caisse: 'Caisse RDC',
            Type: 'Recette',
            Montant: amount,
            Libelle: `${label} - ${patName}`,
            ModePaiement: mode,
            Date_Trans: dateTrans,
            Patient_Nom: patName
          };

          if (!fresh.transactions_caisses) {
            fresh.transactions_caisses = [];
          }
          fresh.transactions_caisses.push(newTxDenorm);

          // Si dbState a une autre clé ou si on synchronise, on peut injecter
          report.caisses.imported++;
        }
      });
    } catch (e: any) {
      report.caisses.errors.push(e.message || String(e));
    }
  }

  return { newState: fresh, report };
}
