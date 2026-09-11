/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit2, ShieldAlert, List, Layers, Users, Briefcase, Award, CheckCircle2, Upload, FileSpreadsheet, Download, RefreshCw, AlertCircle, HelpCircle, Check, Copy, Sparkles, Clock } from 'lucide-react';
import { DatabaseState, Sce, Utilisateur, Praticien, Acte, Pack, Patient, Abonnement, Type_Planning, Zone, Regle_Balneo, Seance, calculateAge, getRemainingSessions } from '../dbStore';
import { translateNameToArabic } from '../utils/translator';
import { analyzeExcelDifferences, executeExcelImport, MultiDiffReport, MultiImportFinalReport, findSheetByName } from '../utils/multiImportService';
import * as XLSX from 'xlsx';

export function cleanAlgerianWilaya(rawVal: string): { code: string; detectedCity?: string } {
  if (!rawVal) return { code: '16' };

  const normalized = rawVal.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .trim();

  // 1. Check if it already contains/starts with a valid 1-58 numeric code
  const numMatch = normalized.match(/^(?:0?([1-9])|([1-5][0-8]))(?:\s+|$|[^0-9])/);
  if (numMatch) {
    const codeNum = numMatch[1] || numMatch[2];
    const padded = codeNum.padStart(2, '0');
    return { code: padded };
  }

  // 2. Exact or substring matching for communes and known regions
  // Boumerdès (35)
  if (normalized.includes("ouled moussa") || normalized.includes("ouled-moussa") || normalized.includes("boumerdes") || normalized.includes("moussa")) {
    return { code: "35", detectedCity: "Ouled Moussa" };
  }
  
  // Alger (16)
  if (
    normalized.includes("beaulieu") || 
    normalized.includes("alger") || 
    normalized.includes("algiers") || 
    normalized.includes("el harrach") || 
    normalized.includes("harrach") || 
    normalized.includes("bab ezzouar") || 
    normalized.includes("cheraga") || 
    normalized.includes("baraki") || 
    normalized.includes("kouba") || 
    normalized.includes("reghaia") || 
    normalized.includes("bouzareah") || 
    normalized.includes("hydra") || 
    normalized.includes("dely ibrahim")
  ) {
    let city = undefined;
    if (normalized.includes("beaulieu")) city = "Beaulieu";
    else if (normalized.includes("el harrach") || normalized.includes("harrach")) city = "El Harrach";
    else if (normalized.includes("bab ezzouar")) city = "Bab Ezzouar";
    else if (normalized.includes("cheraga")) city = "Chéraga";
    return { code: "16", detectedCity: city };
  }

  // Blida (09)
  if (normalized.includes("blida") || normalized.includes("boufarik") || normalized.includes("ouled yaich")) {
    return { code: "09" };
  }

  // Oran (31)
  if (normalized.includes("oran") || normalized.includes("bir el djir")) {
    return { code: "31" };
  }

  // Constantine (25)
  if (normalized.includes("constantine") || normalized.includes("el khroub")) {
    return { code: "25" };
  }

  // Béjaïa (06)
  if (normalized.includes("bejaia") || normalized.includes("amizour") || normalized.includes("akbou")) {
    return { code: "06" };
  }

  // Tizi Ouzou (15)
  if (normalized.includes("tizi") || normalized.includes("azazga")) {
    return { code: "15" };
  }

  // Bouira (10)
  if (normalized.includes("bouira") || normalized.includes("lakhdaria")) {
    return { code: "10" };
  }

  // Tipaza (42)
  if (normalized.includes("tipaza") || normalized.includes("kolea") || normalized.includes("bou ismail")) {
    return { code: "42" };
  }

  const stdWilayas = [
    { code: "01", name: "adrar" }, { code: "02", name: "chlef" }, { code: "03", name: "laghouat" }, { code: "04", name: "oum el bouaghi" },
    { code: "05", name: "batna" }, { code: "06", name: "bejaia" }, { code: "07", name: "biskra" }, { code: "08", name: "bechar" },
    { code: "09", name: "blida" }, { code: "10", name: "bouira" }, { code: "11", name: "tamanrasset" }, { code: "12", name: "tebessa" },
    { code: "13", name: "tlemcen" }, { code: "14", name: "tiaret" }, { code: "15", name: "tizi ouzou" }, { code: "16", name: "alger" },
    { code: "17", name: "djelfa" }, { code: "18", name: "jijel" }, { code: "19", name: "setif" }, { code: "20", name: "saida" },
    { code: "21", name: "skikda" }, { code: "22", name: "sidi bel abbes" }, { code: "23", name: "annaba" }, { code: "24", name: "guelma" },
    { code: "25", name: "constantine" }, { code: "26", name: "medea" }, { code: "27", name: "mostaganem" }, { code: "28", name: "msila" },
    { code: "29", name: "mascara" }, { code: "30", name: "ouargla" }, { code: "31", name: "oran" }, { code: "32", name: "el bayadh" },
    { code: "33", name: "illizi" }, { code: "34", name: "bordj bou arreridj" }, { code: "35", name: "boumerdes" }, { code: "36", name: "el tarf" },
    { code: "37", name: "tindouf" }, { code: "38", name: "tissemsilt" }, { code: "39", name: "el oued" }, { code: "40", name: "khenchela" },
    { code: "41", name: "souk ahras" }, { code: "42", name: "tipaza" }, { code: "43", name: "mila" }, { code: "44", name: "ain defla" },
    { code: "45", name: "naama" }, { code: "46", name: "ain temouchent" }, { code: "47", name: "ghardaia" }, { code: "48", name: "relizane" },
    { code: "49", name: "timimoun" }, { code: "50", name: "bordj badji mokhtar" }, { code: "51", name: "ouled djellal" }, { code: "52", name: "beni abbes" },
    { code: "53", name: "in salah" }, { code: "54", name: "in guezzam" }, { code: "55", name: "touggourt" }, { code: "56", name: "djanet" },
    { code: "57", name: "el m'ghair" }, { code: "58", name: "el meniaa" }
  ];

  const matchedVal = stdWilayas.find(w => normalized.includes(w.name));
  if (matchedVal) {
    return { code: matchedVal.code };
  }

  return { code: '16' }; // Default fallback
}

const resolveServiceId = (serviceVal: any, services: any[], row?: any): number => {
  let finalValStr = serviceVal !== undefined && serviceVal !== null ? String(serviceVal).trim() : '';

  // Si la valeur mappée est vide ou vaut "1" par défaut mais que row contient des clés plus explicites
  if ((!finalValStr || finalValStr === "1") && row && typeof row === 'object') {
    const searchKeys = Object.keys(row);
    
    // 1. Chercher d'abord un match très précis sur l'ID du service
    let foundKey = searchKeys.find(k => {
      const kLower = k.toLowerCase().replace(/[_ ]/g, '');
      return kLower === 'idsce' || kLower === 'idscerattache' || kLower === 'serviceid' || kLower === 'idservice';
    });

    // 2. Chercher ensuite un match plus général sous forme de libellé / affectation
    if (!foundKey) {
      foundKey = searchKeys.find(k => {
        const kLower = k.toLowerCase().replace(/[_ ]/g, '');
        return kLower.includes('service') || kLower.includes('sce') || kLower.includes('affectation') || kLower.includes('rattac');
      });
    }

    if (foundKey) {
      const fallbackVal = row[foundKey];
      if (fallbackVal !== undefined && fallbackVal !== null && String(fallbackVal).trim()) {
        finalValStr = String(fallbackVal).trim();
      }
    }
  }

  if (!finalValStr) return 1;

  // 1. Si c'est un ID numérique direct ou qu'il commence par un chiffre
  const num = Number(finalValStr);
  if (!isNaN(num) && num > 0) {
    if (num >= 1 && num <= 5) {
      return num;
    }
    if (services && services.some(s => s.ID_Sce === num)) {
      return num;
    }
  }

  // 1b. Si la valeur ressemble à "Service 2" ou "Sce 3", on extrait le chiffre
  const digitMatch = finalValStr.match(/\d+/);
  if (digitMatch) {
    const extractedNum = Number(digitMatch[0]);
    if (extractedNum >= 1 && extractedNum <= 5) {
      return extractedNum;
    }
  }

  // 2. Correspondance intelligente par chaîne de caractères (désignation ou libellé de service)
  const valLower = finalValStr.toLowerCase();
  
  // Quelque alias courants pour la Balnéothérapie
  if (valLower.includes('balneo') || valLower.includes('balnéo') || valLower.includes('bassin')) {
    return 2; // Balnéothérapie (ID_Sce: 2)
  }
  
  // Quelques alias pour les Services Intensifs Étage 2
  if (valLower.includes('intensif') && (valLower.includes('2') || valLower.includes('deux') || valLower.includes('deuxième') || valLower.includes('2e') || valLower.includes('2ème'))) {
    return 3;
  }
  // Quelques alias pour les Services Intensifs Étage 3
  if (valLower.includes('intensif') && (valLower.includes('3') || valLower.includes('trois') || valLower.includes('troisième') || valLower.includes('3e') || valLower.includes('3ème'))) {
    return 4;
  }
  // Quelques alias pour les Services Intensifs Étage 4
  if (valLower.includes('intensif') && (valLower.includes('4') || valLower.includes('quatre') || valLower.includes('quatrième') || valLower.includes('4e') || valLower.includes('4ème'))) {
    return 5;
  }

  // S'il n'y a pas le mot 'intensif' mais seulement les mentions d'étages
  if (valLower.includes('étage 2') || valLower.includes('etage 2') || valLower.includes('e2') || valLower.includes('floor 2') || valLower.includes('f2') || valLower.includes('level 2')) {
    return 3;
  }
  if (valLower.includes('étage 3') || valLower.includes('etage 3') || valLower.includes('e3') || valLower.includes('floor 3') || valLower.includes('f3') || valLower.includes('level 3') || valLower.includes('intensif 3')) {
    return 4;
  }
  if (valLower.includes('étage 4') || valLower.includes('etage 4') || valLower.includes('e4') || valLower.includes('floor 4') || valLower.includes('f4') || valLower.includes('level 4')) {
    return 5;
  }

  // Quelques correspondances pour la Rééducation Fonctionnelle
  if (
    valLower.includes('réeduc') || 
    valLower.includes('reeduc') || 
    valLower.includes('fonction') || 
    valLower.includes('kiné') || 
    valLower.includes('kine') || 
    valLower.includes('adulte') || 
    valLower.includes('rrf') || 
    valLower.includes('mpr') || 
    valLower.includes('rehab')
  ) {
    return 1; // Rééducation Fonctionnelle (ID_Sce: 1)
  }

  // S'il n'y a pas de correspondance évidente, faire une recherche floue dans la table des services
  if (services && Array.isArray(services)) {
    const matchedService = services.find(s => 
      s.Libelle_Sce.toLowerCase().includes(valLower) || 
      valLower.includes(s.Libelle_Sce.toLowerCase())
    );
    if (matchedService) {
      return matchedService.ID_Sce;
    }
  }

  return 1; // Par défaut s'il n'y a pas d'autre affectation résolue
};

interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
}

interface TableSchemaConfig {
  label: string;
  fields: FieldConfig[];
}

const TABLES_SCHEMA_CONFIG: Record<string, TableSchemaConfig> = {
  packs: {
    label: "Packs & Forfaits 📦",
    fields: [
      { key: "ID_Pack", label: "ID du Pack", required: true },
      { key: "Libelle_Pack", label: "Nom/Libellé du Pack", required: true },
      { key: "Nbre_Seance_Pack", label: "Nombre de séances", required: true },
      { key: "Prix_Seanc_Pack", label: "Prix d'une séance", required: false },
      { key: "Prix_Pack", label: "Prix global du pack", required: false }
    ]
  },
  praticiens: {
    label: "Praticiens (Personnel) 👨‍⚕️",
    fields: [
      { key: "ID_Prat", label: "ID Praticien", required: true },
      { key: "Nom_Prat", label: "Nom de famille", required: true },
      { key: "Prenom_Prat", label: "Prénom", required: true }
    ]
  },
  actes: {
    label: "Actes Médicaux 🏷️",
    fields: [
      { key: "ID_Acte", label: "ID Acte", required: true },
      { key: "Libelle_Acte", label: "Désignation/Nom de l'acte", required: true }
    ]
  },
  patients: {
    label: "Patients (Optionnel) 👥",
    fields: [
      { key: "ID_Patient", label: "ID Patient", required: true },
      { key: "Nom_Patient", label: "Nom complet du patient", required: true },
      { key: "Genre_Patient", label: "Genre", required: false },
      { key: "Type_Patient", label: "Type", required: false },
      { key: "Phone", label: "Numéro de téléphone", required: false },
      { key: "Address", label: "Adresse", required: false },
      { key: "Street", label: "Rue", required: false },
      { key: "City", label: "Ville", required: false },
      { key: "Wilaya", label: "Wilaya", required: false }
    ]
  },
  abonnements: {
    label: "Abonnements (Optionnel) 📑",
    fields: [
      { key: "ID_Abn", label: "ID Abonnement", required: true },
      { key: "ID_Patient", label: "ID Patient", required: true },
      { key: "ID_Pack", label: "ID Pack", required: true },
      { key: "Date_Debut_Abn", label: "Date de début", required: true },
      { key: "Date_Fin_Abn", label: "Date de fin", required: false },
      { key: "Nbre_Sean_Consom_Abn", label: "Séances consommées", required: false }
    ]
  },
  seances: {
    label: "Séances Réalisées 🕒",
    fields: [
      { key: "ID_Seanc", label: "ID Séance", required: true },
      { key: "ID_Patient", label: "ID Patient", required: true },
      { key: "ID_Acte", label: "ID Acte", required: true },
      { key: "ID_Prat", label: "ID Praticien", required: true },
      { key: "ID_Abn", label: "ID Abonnement rattaché", required: true },
      { key: "Date_Seanc_Realisee", label: "Date de réalisation", required: true },
      { key: "H_Debut_Seanc", label: "Heure de début", required: false },
      { key: "H_Fin_Seanc", label: "Heure de fin", required: false },
      { key: "Prix_Seanc", label: "Tarif de la séance", required: false }
    ]
  },
  versements: {
    label: "Versements (Paiements) 💰",
    fields: [
      { key: "ID_Vers", label: "ID Versement", required: true },
      { key: "ID_Patient", label: "ID Patient", required: true },
      { key: "ID_Abn", label: "ID Abonnement", required: true },
      { key: "Mont_Vers", label: "Montant payé", required: true },
      { key: "Date_Vers", label: "Date du paiement", required: true },
      { key: "Mode_Vers", label: "Mode de versement", required: false }
    ]
  },
  caisses: {
    label: "Transactions Caisses 💳",
    fields: [
      { key: "ID_Caisse", label: "ID Caisse", required: true },
      { key: "ID_Patient", label: "ID Patient", required: false },
      { key: "ID_Seanc", label: "ID Séance", required: false },
      { key: "ID_Abn", label: "ID Abonnement", required: false },
      { key: "Montant", label: "Montant de l'opération", required: true },
      { key: "Date_Encaissement", label: "Date de transaction", required: true },
      { key: "Mode_Paiement", label: "Mode de paiement", required: false }
    ]
  }
};

const LOCAL_HEADER_MAPPINGS: Record<string, string[]> = {
  ID_Pack: ["id pack", "رقم الحزمة", "id_pack", "id", "idpack"],
  Libelle_Pack: ["libelle pack", "libellé pack", "اسم الحزمة", "libelle_pack", "libelle", "nom pack", "nom"],
  Nbre_Seance_Pack: ["nombre seances", "nombre séances", "عدد الجلسات", "nbre_seance_pack", "seances", "séances", "nombre_seances"],
  Prix_Seanc_Pack: ["prix seance", "prix séance", "سعر الجلسة", "prix_seanc_pack", "tarif seance", "prix_seance"],
  Prix_Pack: ["prix pack", "سعر الحزمة", "prix_pack", "tarif pack", "montant pack"],
  ID_Prat: ["id praticien", "رقم المعالج", "id_prat", "id_praticien", "id", "idprat", "id_prat_fk"],
  Nom_Prat: ["nom praticien", "اسم المعالج", "nom_prat", "nom", "nom_praticien"],
  Prenom_Prat: ["prenom praticien", "prénom praticien", "الاسم الأول", "prenom_prat", "prenom", "prenom_praticien"],
  ID_Acte: ["id acte", "رقم العمل", "id_acte", "id", "idacte"],
  Libelle_Acte: ["libelle acte", "libellé acte", "اسم العمل", "libelle_acte", "libelle", "acte"],
  ID_Patient: ["id patient", "رقم المريض", "id_patient", "patient_id", "id", "idpatient"],
  Nom_Patient: ["nom patient", "اسم المريض", "nom_patient", "nom"],
  Genre_Patient: ["genre patient", "جنس المريض", "genre_patient", "genre", "sexe"],
  Type_Patient: ["type patient", "نوع المريض", "type_patient", "type"],
  Phone: ["phone", "الهاتف", "telephone", "téléphone", "tel"],
  Address: ["address", "العنوان", "adresse"],
  Street: ["street", "الشارع", "rue"],
  City: ["city", "المدينة", "ville"],
  Wilaya: ["wilaya", "الولاية"],
  ID_Abn: ["id abonnement", "رقم الاشتراك", "id_abn", "id_abonnement", "abonnement_id", "id", "idabn"],
  Date_Debut_Abn: ["date debut", "date début", "تاريخ البدء", "date_debut_abn", "date_debut", "debut"],
  Date_Fin_Abn: ["date fin", "تاريخ الانتهاء", "date_fin_abn", "date_fin", "fin"],
  Nbre_Sean_Consom_Abn: ["seances consommees", "séances consommées", "عدد الجلسات المستهلكة", "nbre_sean_consom_abn", "consommee", "consommées"],
  ID_Seanc: ["id seance", "id séance", "رقم الجلسة", "id_seanc", "id_seance", "id", "idseance"],
  Date_Seanc_Realisee: ["date seance", "date séance", "تاريخ الجلسة", "date_seanc_realisee", "date_seance", "date"],
  H_Debut_Seanc: ["heure debut", "heure début", "ساعة البدء", "h_debut_seanc", "heure_debut", "h_debut"],
  H_Fin_Seanc: ["heure fin", "ساعة الانتهاء", "h_fin_seanc", "heure_fin", "h_fin"],
  Prix_Seanc: ["prix seance", "prix séance", "سعر الجلسة", "prix_seanc", "prix_seance"],
  ID_Vers: ["id versement", "رقم الدفع", "id_vers", "id_versement", "id", "idversement"],
  Mont_Vers: ["montant verse", "montant versé", "المبلغ du versement", "mont_vers", "montant", "somme"],
  Date_Vers: ["date versement", "تاريخ الدفع", "date_vers", "date_versement", "date"],
  Mode_Vers: ["mode versement", "طريقة الدفع", "mode_vers", "mode_versement", "mode"],
  ID_Caisse: ["id caisse", "رقم الصندوق", "id_caisse", "id", "idcaisse"],
  Montant: ["montant", "المبلغ", "montant", "somme"],
  Date_Encaissement: ["date encaissement", "تاريخ التحصيل", "date_encaissement", "date_caisse", "date", "date_trans", "date_transaction"],
  Mode_Paiement: ["mode paiement", "طريقة الدفع", "mode_paiement", "paiement", "modepaiement"]
};

const findMatchingHeader = (headers: string[], destKey: string): string => {
  const candidates = LOCAL_HEADER_MAPPINGS[destKey] || [];
  const normalize = (s: string) => String(s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_ ]/g, '');
  const keyNorm = normalize(destKey);
  
  for (const header of headers) {
    const hNorm = normalize(header);
    for (const cand of candidates) {
      const candNorm = normalize(cand);
      if (hNorm === candNorm) {
        return header;
      }
    }
  }
  
  for (const header of headers) {
    const hNorm = normalize(header);
    if (hNorm.includes(keyNorm) || keyNorm.includes(hNorm)) {
      return header;
    }
  }
  return '';
};

interface DatabaseSectionProps {
  dbState: DatabaseState;
  setDbState: React.Dispatch<React.SetStateAction<DatabaseState>>;
  onSave: (state: DatabaseState, modifiedKeys?: string[]) => void;
  break1Start?: string;
  break1End?: string;
  break2Start?: string;
  break2End?: string;
  onUpdateBreaks?: (b1s: string, b1e: string, b2s: string, b2e: string) => void;
  intensifBreaks?: { [zoneId: number]: { start: string; end: string } };
  onUpdateIntensifBreaks?: (zoneId: number, start: string, end: string) => void;
  sleekTheme?: string;
  onChangeTheme?: (themeName: 'kacel-sante' | 'sleek-slate' | 'cosmic-dark' | 'emerald-clinical' | 'doctolib' | 'forest-cream' | 'apple-vercel' | 'rehab-soft') => void;
}

type TableName = 
  | 'services' 
  | 'utilisateurs' 
  | 'praticiens' 
  | 'actes' 
  | 'packs' 
  | 'patients' 
  | 'abonnements' 
  | 'typesPlanning' 
  | 'zones' 
  | 'reglesBalneo'
  | 'seances';

export const DatabaseSection: React.FC<DatabaseSectionProps> = ({ 
  dbState, 
  setDbState, 
  onSave,
  break1Start = '12:00',
  break1End = '13:00',
  break2Start = '17:00',
  break2End = '17:30',
  onUpdateBreaks,
  intensifBreaks = {
    4: { start: '12:00', end: '13:00' },
    5: { start: '12:00', end: '13:00' },
    6: { start: '12:00', end: '13:00' }
  },
  onUpdateIntensifBreaks,
  sleekTheme = 'rehab-soft',
  onChangeTheme
}) => {
  const [activeDbSubTab, setActiveDbSubTab] = useState<'correction' | 'clear' | 'pauses' | 'multi_import' | 'themes'>('correction');
  const [excelFileBuffer, setExcelFileBuffer] = useState<ArrayBuffer | null>(null);
  const [detectedSheets, setDetectedSheets] = useState<Array<{ sheetName: string; rowsCount: number; targetTable: string; status: 'OK' | 'Inconnu' }>>([]);
  const [diffReport, setDiffReport] = useState<MultiDiffReport | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<Record<string, number>>({});
  const [finalImportReport, setFinalImportReport] = useState<MultiImportFinalReport | null>(null);
  const [multiImportError, setMultiImportError] = useState<string | null>(null);
  const [multiImportSuccessMsg, setMultiImportSuccessMsg] = useState<string | null>(null);
  const [multiImportFileName, setMultiImportFileName] = useState<string>('');
  const [multiImportLoading, setMultiImportLoading] = useState<boolean>(false);
  
  const [headersBySheet, setHeadersBySheet] = useState<Record<string, string[]>>({});
  const [sheetToTableMap, setSheetToTableMap] = useState<Record<string, string>>({});
  const [columnMappings, setColumnMappings] = useState<Record<string, Record<string, string>>>({});
  const [isManualMappingEnabled, setIsManualMappingEnabled] = useState<boolean>(false);
  
  const [activePauseTab, setActivePauseTab] = useState<'reeducation' | 'intensif'>('reeducation');
  const [tempBreak1Start, setTempBreak1Start] = useState<string>(break1Start);
  const [tempBreak1End, setTempBreak1End] = useState<string>(break1End);
  const [tempBreak2Start, setTempBreak2Start] = useState<string>(break2Start);
  const [tempBreak2End, setTempBreak2End] = useState<string>(break2End);
  const [tempIntensifBreaks, setTempIntensifBreaks] = useState<{ [zoneId: number]: { start: string; end: string } }>(intensifBreaks);

  React.useEffect(() => {
    setTempBreak1Start(break1Start);
  }, [break1Start]);

  React.useEffect(() => {
    setTempBreak1End(break1End);
  }, [break1End]);

  React.useEffect(() => {
    setTempBreak2Start(break2Start);
  }, [break2Start]);

  React.useEffect(() => {
    setTempBreak2End(break2End);
  }, [break2End]);

  React.useEffect(() => {
    setTempIntensifBreaks(intensifBreaks);
  }, [intensifBreaks]);
  // États de sauvegarde provisoires pour les actes, praticiens, abonnements et packs (pour accélérer les tests)
  const [tempBackup, setTempBackup] = useState<{
    actes: Acte[];
    praticiens: Praticien[];
    abonnements: Abonnement[];
    packs: Pack[];
    savedAt: string;
  } | null>(() => {
    const actesStr = localStorage.getItem('provisoire_actes');
    const praticiensStr = localStorage.getItem('provisoire_praticiens');
    const abonnementsStr = localStorage.getItem('provisoire_abonnements');
    const packsStr = localStorage.getItem('provisoire_packs');
    const savedAtStr = localStorage.getItem('provisoire_saved_at');
    if (actesStr && praticiensStr && abonnementsStr) {
      try {
        return {
          actes: JSON.parse(actesStr),
          praticiens: JSON.parse(praticiensStr),
          abonnements: JSON.parse(abonnementsStr),
          packs: packsStr ? JSON.parse(packsStr) : [],
          savedAt: savedAtStr || ''
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleSaveProvisoire = () => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    localStorage.setItem('provisoire_actes', JSON.stringify(dbState.actes));
    localStorage.setItem('provisoire_praticiens', JSON.stringify(dbState.praticiens));
    localStorage.setItem('provisoire_abonnements', JSON.stringify(dbState.abonnements));
    localStorage.setItem('provisoire_packs', JSON.stringify(dbState.packs));
    localStorage.setItem('provisoire_saved_at', nowStr);
    
    setTempBackup({
      actes: [...dbState.actes],
      praticiens: [...dbState.praticiens],
      abonnements: [...dbState.abonnements],
      packs: [...dbState.packs],
      savedAt: nowStr
    });
    
    alert(`💾 Sauvegarde réussie sur les tables provisoires !\n- Actes : ${dbState.actes.length}\n- Praticiens : ${dbState.praticiens.length}\n- Abonnements : ${dbState.abonnements.length}\n- Packs : ${dbState.packs.length}\nDate : ${nowStr}`);
  };

  const handleRestoreProvisoire = () => {
    if (!tempBackup) {
      alert("⚠️ Aucune sauvegarde provisoire trouvée.");
      return;
    }
    
    // Integrity checks/merges
    const fresh = { ...dbState };
    fresh.actes = [...tempBackup.actes];
    fresh.praticiens = [...tempBackup.praticiens];
    fresh.abonnements = [...tempBackup.abonnements];
    if (tempBackup.packs) {
      fresh.packs = [...tempBackup.packs];
    }
    
    // Recalculate Nbre_Abn for patients to maintain clinical consistency
    fresh.patients = fresh.patients.map(p => ({
      ...p,
      Nbre_Abn: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length,
      Nbre_Abn_Pat: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length
    }));
    
    updateDB(fresh);
    alert(`🔄 Restauration effectuée avec succès depuis les tables provisoires !\n- Actes : ${tempBackup.actes.length}\n- Praticiens : ${tempBackup.praticiens.length}\n- Abonnements : ${tempBackup.abonnements.length}\n- Packs : ${tempBackup.packs ? tempBackup.packs.length : 0}`);
  };

  const handleClearProvisoire = () => {
    localStorage.removeItem('provisoire_actes');
    localStorage.removeItem('provisoire_praticiens');
    localStorage.removeItem('provisoire_abonnements');
    localStorage.removeItem('provisoire_packs');
    localStorage.removeItem('provisoire_saved_at');
    setTempBackup(null);
    alert("🗑️ Tables provisoires supprimées.");
  };

  const [activeTable, setActiveTable] = useState<TableName>('praticiens');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  
  // States pour la modification groupée d'actes
  const [selectedActesForBulk, setSelectedActesForBulk] = useState<number[]>([]);
  const [bulkRoles, setBulkRoles] = useState<string[]>([]);
  
  // States pour la modification groupée de packs
  const [selectedPacksForBulk, setSelectedPacksForBulk] = useState<number[]>([]);
  const [bulkCatPack, setBulkCatPack] = useState<'R' | 'B' | 'I' | 'O' | 'P'>('R');
  
  // Generic single-item states for additions
  const [patientName, setPatientName] = useState<string>('');
  const [patientGenre, setPatientGenre] = useState<'H' | 'F'>('H');

  const [serviceName, setServiceName] = useState<string>('');

  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('Receptionniste RDC');
  const [userService, setUserService] = useState<number>(1);
  const [userLogin, setUserLogin] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');

  React.useEffect(() => {
    if (activeTable === 'utilisateurs' && selectedRowId !== null) {
      const u = (dbState.utilisateurs || []).find(x => x.ID_Utilisateur === selectedRowId || (x as any).ID_User === selectedRowId);
      if (u) {
        const pwd = (u.MotDePasse || u.Password || '').trim();
        const name = (u.Nom_Utilisateur || u.Nom || '').trim();
        const login = (u.Login || u.login || u.Username || '').trim();
        setUserPassword(pwd);
        setUserName(name);
        setUserLogin(login);
        setUserRole(u.Role || 'Receptionniste RDC');
        setUserService(Number(u.ID_Sce) || 1);
        setEditValues((prev: any) => ({
          ...u,
          ...prev,
          Nom_Utilisateur: prev.Nom_Utilisateur || name,
          Nom: prev.Nom || name,
          Login: prev.Login || login,
          login: prev.login || login,
          Username: prev.Username || login,
          MotDePasse: prev.MotDePasse || pwd,
          Password: prev.Password || pwd
        }));
      }
    }
  }, [selectedRowId, activeTable, dbState.utilisateurs]);

  const [pratNom, setPratNom] = useState<string>('');
  const [pratPseudo, setPratPseudo] = useState<string>('');
  const [pratPrenom, setPratPrenom] = useState<string>('');
  const [pratNomArb, setPratNomArb] = useState<string>('');
  const [pratRepere, setPratRepere] = useState<'K' | 'P' | 'O' | 'MPR'>('K');
  const [pratGenre, setPratGenre] = useState<'H' | 'F'>('H');
  const [pratService, setPratService] = useState<number>(1);
  const [pratDob, setPratDob] = useState<string>('1990-01-01');
  const [pratRecruit, setPratRecruit] = useState<string>('2026-06-01');
  const [pratContrat, setPratContrat] = useState<'CDD' | 'CDI' | 'Néant'>('CDI');
  const [pratDatDebuTrv, setPratDatDebuTrv] = useState<string>('');
  const [pratSearchQuery, setPratSearchQuery] = useState<string>('');

  const [acteLibelle, setActeLibelle] = useState<string>('');
  const [actePrix, setActePrix] = useState<number>(150);

  const [packLibelle, setPackLibelle] = useState<string>('');
  const [packQty, setPackQty] = useState<number>(10);
  const [packPrix, setPackPrix] = useState<number>(0);
  const [packPrixSeance, setPackPrixSeance] = useState<number>(0);
  const [packCat, setPackCat] = useState<'R' | 'B' | 'I' | 'O' | 'P'>('R');
  const [packIdActe, setPackIdActe] = useState<string>('');

  const [abnPatientId, setAbnPatientId] = useState<number>(1);
  const [abnPackId, setAbnPackId] = useState<number>(1);
  const [abnStart, setAbnStart] = useState<string>('2026-06-01');
  const [abnEnd, setAbnEnd] = useState<string>('2026-09-30');
  const [abnDateAbn, setAbnDateAbn] = useState<string>('2026-06-01');
  const [abnConsom, setAbnConsom] = useState<number>(0);
  const [abnAdd1, setAbnAdd1] = useState<string>('none');
  const [abnAdd2, setAbnAdd2] = useState<string>('none');

  const [planTypeLibelle, setPlanTypeLibelle] = useState<string>('');
  const [planTypeMax, setPlanTypeMax] = useState<number>(4);

  const [zoneName, setZoneName] = useState<string>('');

  const [balneoDay, setBalneoDay] = useState<number>(1);
  const [balneoPeriod, setBalneoPeriod] = useState<'Matin' | 'Apres-midi'>('Matin');
  const [balneoGenre, setBalneoGenre] = useState<'H' | 'F'>('F');
  // File import states
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [importTarget, setImportTarget] = useState<'patients' | 'abonnements' | 'actes' | 'praticiens' | 'packs' | 'services'>('patients');
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [autoTranslateMissingArb, setAutoTranslateMissingArb] = useState(true);

  // States for Excel mapping window (.xls, .xlsx, .csv)
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [fixedValueSettings, setFixedValueSettings] = useState<Record<string, string>>({});
  
  // States for server-side automatic injection
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionResult, setInjectionResult] = useState<string | null>(null);

  // States and maps for high-performance filtering & pagination
  const [dbSearchQuery, setDbSearchQuery] = useState<string>('');
  const [dbPage, setDbPage] = useState<number>(1);
  const itemsPerPage = 50;

  const patientsMap = React.useMemo(() => {
    const map = new Map<number, Patient>();
    (dbState.patients || []).forEach(p => {
      map.set(p.ID_Patient, p);
    });
    return map;
  }, [dbState.patients]);

  const packsMap = React.useMemo(() => {
    const map = new Map<number, Pack>();
    (dbState.packs || []).forEach(p => {
      map.set(p.ID_Pack, p);
    });
    return map;
  }, [dbState.packs]);

  const actesMap = React.useMemo(() => {
    const map = new Map<number, Acte>();
    (dbState.actes || []).forEach(a => {
      map.set(a.ID_Acte, a);
    });
    return map;
  }, [dbState.actes]);

  const servicesMap = React.useMemo(() => {
    const map = new Map<number, Sce>();
    (dbState.services || []).forEach(s => {
      map.set(s.ID_Sce, s);
    });
    return map;
  }, [dbState.services]);

  const praticiensMap = React.useMemo(() => {
    const map = new Map<number, Praticien>();
    (dbState.praticiens || []).forEach(p => {
      map.set(p.ID_Prat, p);
    });
    return map;
  }, [dbState.praticiens]);

  const filteredPatientsList = React.useMemo(() => {
    let list = dbState.patients || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(p => 
        String(p.ID_Patient).includes(q) ||
        (p.Nom_Patient && p.Nom_Patient.toLowerCase().includes(q)) ||
        (p.Genre_Patient && p.Genre_Patient.toLowerCase().includes(q)) ||
        (p.type_patient && p.type_patient.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.patients, dbSearchQuery]);

  const filteredAbonnementsList = React.useMemo(() => {
    let list = dbState.abonnements || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(abn => {
        const pat = patientsMap.get(abn.ID_Patient);
        const pkg = packsMap.get(abn.ID_Pack);
        return (
          String(abn.ID_Abn).includes(q) ||
          (pat?.Nom_Patient && pat.Nom_Patient.toLowerCase().includes(q)) ||
          (pkg?.Libelle_Pack && pkg.Libelle_Pack.toLowerCase().includes(q)) ||
          (abn.Date_Debut_Abn && abn.Date_Debut_Abn.includes(q)) ||
          (abn.Date_Fin_Abn && abn.Date_Fin_Abn.includes(q))
        );
      });
    }
    return list;
  }, [dbState.abonnements, dbSearchQuery, patientsMap, packsMap]);

  const filteredPraticiensList = React.useMemo(() => {
    let list = dbState.praticiens || [];
    const q = dbSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p => {
        const service = servicesMap.get(p.ID_Sce);
        const speciality = p.Repere === 'K' ? 'aide-kiné' : p.Repere === 'P' ? 'psychomot./psy/ergo' : p.Repere === 'O' ? 'orthophoniste' : 'mpr';
        return (
          String(p.ID_Prat).includes(q) ||
          (p.Nom_Prat && p.Nom_Prat.toLowerCase().includes(q)) ||
          (p.Prenom_Prat && p.Prenom_Prat.toLowerCase().includes(q)) ||
          (p.Genre_Prat && p.Genre_Prat.toLowerCase().includes(q)) ||
          speciality.includes(q) ||
          (service?.Nom_Sce && service.Nom_Sce.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [dbState.praticiens, dbSearchQuery, servicesMap]);

  const filteredSeancesList = React.useMemo(() => {
    let list = dbState.seances || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(s => {
        const pat = patientsMap.get(s.ID_Patient);
        const prat = praticiensMap.get(s.ID_Prat);
        const act = actesMap.get(s.ID_Acte);
        return (
          String(s.ID_Seanc).includes(q) ||
          (pat?.Nom_Patient && pat.Nom_Patient.toLowerCase().includes(q)) ||
          (prat?.Nom_Prat && prat.Nom_Prat.toLowerCase().includes(q)) ||
          (act?.Libelle_Acte && act.Libelle_Acte.toLowerCase().includes(q)) ||
          (s.Date_Seanc_Realisee && s.Date_Seanc_Realisee.includes(q))
        );
      });
    }
    return list;
  }, [dbState.seances, dbSearchQuery, patientsMap, praticiensMap, actesMap]);

  const filteredActesList = React.useMemo(() => {
    let list = dbState.actes || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(a => 
        String(a.ID_Acte).includes(q) ||
        (a.Libelle_Acte && a.Libelle_Acte.toLowerCase().includes(q)) ||
        (a.Code_Tarification && a.Code_Tarification.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.actes, dbSearchQuery]);

  const filteredPacksList = React.useMemo(() => {
    let list = dbState.packs || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(pk => 
        String(pk.ID_Pack).includes(q) ||
        (pk.Libelle_Pack && pk.Libelle_Pack.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.packs, dbSearchQuery]);

  const filteredServicesList = React.useMemo(() => {
    let list = dbState.services || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(s => 
        String(s.ID_Sce).includes(q) ||
        (s.Nom_Sce && s.Nom_Sce.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.services, dbSearchQuery]);

  const filteredUtilisateursList = React.useMemo(() => {
    let list = dbState.utilisateurs || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(u => 
        String(u.ID_Utilisateur).includes(q) ||
        (u.Identifiant && u.Identifiant.toLowerCase().includes(q)) ||
        (u.Role && u.Role.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.utilisateurs, dbSearchQuery]);

  const filteredTypesPlanningList = React.useMemo(() => {
    let list = dbState.typesPlanning || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(t => 
        String(t.ID_Type_Plan).includes(q) ||
        (t.Libelle_Type_Plan && t.Libelle_Type_Plan.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.typesPlanning, dbSearchQuery]);

  const filteredZonesList = React.useMemo(() => {
    let list = dbState.zones || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      list = list.filter(z => 
        String(z.ID_Zone).includes(q) ||
        (z.Nom_Zone && z.Nom_Zone.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dbState.zones, dbSearchQuery]);

  const filteredReglesBalneoList = React.useMemo(() => {
    let list = dbState.reglesBalneo || [];
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase().trim();
      const dayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
      list = list.filter(r => {
        const dayName = r.Jour_Semaine >= 1 && r.Jour_Semaine <= 7 ? dayNames[r.Jour_Semaine - 1] : "";
        return (
          String(r.ID_Regle).includes(q) ||
          String(r.Jour_Semaine).includes(q) ||
          dayName.includes(q) ||
          (r.Demi_Journee && r.Demi_Journee.toLowerCase().includes(q)) ||
          (r.Genre_Autorise && r.Genre_Autorise.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [dbState.reglesBalneo, dbSearchQuery]);

  const activeFilteredList = React.useMemo(() => {
    switch (activeTable) {
      case 'patients': return filteredPatientsList;
      case 'abonnements': return filteredAbonnementsList;
      case 'praticiens': return filteredPraticiensList;
      case 'seances': return filteredSeancesList;
      case 'actes': return filteredActesList;
      case 'packs': return filteredPacksList;
      case 'services': return filteredServicesList;
      case 'utilisateurs': return filteredUtilisateursList;
      case 'typesPlanning': return filteredTypesPlanningList;
      case 'zones': return filteredZonesList;
      case 'reglesBalneo': return filteredReglesBalneoList;
      default: return [];
    }
  }, [
    activeTable,
    filteredPatientsList,
    filteredAbonnementsList,
    filteredPraticiensList,
    filteredSeancesList,
    filteredActesList,
    filteredPacksList,
    filteredServicesList,
    filteredUtilisateursList,
    filteredTypesPlanningList,
    filteredZonesList,
    filteredReglesBalneoList
  ]);

  // States and data list for clinical tables clearing tool
  const [selectedTablesToClear, setSelectedTablesToClear] = useState<Record<string, boolean>>({
    patients: false,
    abonnements: false,
    rendezVous: false,
    seances: false,
    versements: false,
    factures: false,
    fileAttente: false,
    consultations: false,
    deficitsCliniques: false,
    fichesKineAutomatisees: false,
    detailsFicheActes: false,
    praticiens: false,
    actes: false,
    packs: false,
    reglesBalneo: false,
    rdv_intensif_2e: false,
    rdv_intensif_3e: false,
    rdv_intensif_4e: false,
  });

  // Custom confirmation modal states for clearing tables
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [clearanceAllMode, setClearanceAllMode] = useState(false);
  const [clearanceInputText, setClearanceInputText] = useState('');
  const [clearanceErrorMsg, setClearanceErrorMsg] = useState('');

  const clinicalTablesList: { key: keyof DatabaseState | 'rdv_intensif_2e' | 'rdv_intensif_3e' | 'rdv_intensif_4e'; label: string; description: string; icon: string }[] = [
    { key: 'patients', label: 'Patients (Dossiers)', description: 'Fiches de patients enregistrées (Adultes, Enfants, Enfant IMC).', icon: '👥' },
    { key: 'abonnements', label: 'Abonnements', description: 'Forfaits souscrits et solde de séances consommées.', icon: '🛡️' },
    { key: 'rendezVous', label: 'Rendez-vous (Agenda / RDV)', description: 'Séances planifiées, passées ou à venir sur tous les plateaux.', icon: '🗓️' },
    { key: 'versements', label: 'Versements (Caisse)', description: 'Historique des paiements encaissés de forfaits.', icon: '💰' },
    { key: 'factures', label: 'Factures (Transactions)', description: 'Pièces de facturation émises par le MPR ou la rééducation.', icon: '📄' },
    { key: 'fileAttente', label: 'File d\'Attente MPR', description: 'File active des patients en cours de consultation aujourd\'hui.', icon: '⏱️' },
    { key: 'consultations', label: 'Consultations MPR', description: 'Examens cliniques et fiches de rééducation générées par le MPR.', icon: '🩺' },
    { key: 'deficitsCliniques', label: 'Déficits Cliniques (MPR)', description: 'Déficits articulaires/musculaires issus des consultations.', icon: '💪' },
    { key: 'fichesKineAutomatisees', label: 'Fiches Kine de Rééducation', description: 'Rapports automatisés de rééducation tirés de la consultation.', icon: '📝' },
    { key: 'detailsFicheActes', label: 'Détails des Actes Auto', description: 'Actes recommandés automatiquement par le MPR.', icon: '⚙️' },
    { key: 'praticiens', label: 'Praticiens (Personnel)', description: 'Médecins MPR, kinésithérapeutes, d\'ergothérapeutes et praticiens du cabinet.', icon: '👨‍⚕️' },
    { key: 'actes', label: 'Actes Médicaux (Liste de prix)', description: 'Prestations médicales de base et leurs tarifs d\'actes.', icon: '🏷️' },
    { key: 'packs', label: 'Packs et Forfaits', description: 'Tarifications forfaitaires (ex: Forfait 10 séances, Pack 62 H).', icon: '📦' },
    { key: 'reglesBalneo', label: 'Règles d\'Accès Balnéo', description: 'Calendrier hebdomadaire de mixité (H/F) du bassin.', icon: '🩱' },
    { key: 'transactions_caisses', label: 'Transactions de Caisse', description: 'Mouvements et encaissements enregistrés dans la caisse globale.', icon: '🏦' },
    { key: 'rdv_intensif_2e', label: 'RDV Intensif 2e', description: 'Rendez-vous de l\'Étage Soins Intensifs 2e (Zone ID 4).', icon: '⚡' },
    { key: 'rdv_intensif_3e', label: 'RDV Intensif 3e', description: 'Rendez-vous de l\'Étage Soins Intensifs 3e (Zone ID 5).', icon: '⚡' },
    { key: 'rdv_intensif_4e', label: 'RDV Intensif 4e', description: 'Rendez-vous de l\'Étage Soins Intensifs 4e (Zone ID 6).', icon: '⚡' },
  ];

  const handlePurgerCaisses = () => {
    if (window.confirm("Êtes-vous sûr ? Cette action est irréversible.")) {
      const fresh = {
        ...dbState,
        transactions_caisses: []
      };
      if (setDbState) setDbState(fresh);
      onSave(fresh, ['transactions_caisses']);
      alert("Les caisses ont été purgées avec succès.");
    }
  };

  const handleClearSelectedTables = (clearAll: boolean = false) => {
    const tablesToProcess = clearAll 
      ? clinicalTablesList.map(t => t.key) 
      : (Object.keys(selectedTablesToClear) as Array<keyof DatabaseState | 'rdv_intensif_2e' | 'rdv_intensif_3e' | 'rdv_intensif_4e'>).filter(key => selectedTablesToClear[key]);

    if (tablesToProcess.length === 0) {
      alert("Veuillez cocher au moins une table à vider.");
      return;
    }

    setClearanceAllMode(clearAll);
    setClearanceInputText('');
    setClearanceErrorMsg('');
    setClearanceModalOpen(true);
  };

  const executeClearance = () => {
    const phraseExpected = clearanceAllMode ? "VIDER TOUT" : "CONFIRMER";
    if (clearanceInputText.trim().toUpperCase() !== phraseExpected) {
      setClearanceErrorMsg(`Phrase de confirmation incorrecte. Saisissez exactement "${phraseExpected}" en majuscules.`);
      return;
    }

    const tablesToProcess = clearanceAllMode 
      ? clinicalTablesList.map(t => t.key) 
      : (Object.keys(selectedTablesToClear) as Array<keyof DatabaseState | 'rdv_intensif_2e' | 'rdv_intensif_3e' | 'rdv_intensif_4e'>).filter(key => selectedTablesToClear[key]);

    const fresh = { ...dbState };

    tablesToProcess.forEach((tableKey) => {
      if (tableKey === 'rdv_intensif_2e') {
        fresh.rendezVous = fresh.rendezVous ? fresh.rendezVous.filter(r => r.ID_Zone !== 4) : [];
      } else if (tableKey === 'rdv_intensif_3e') {
        fresh.rendezVous = fresh.rendezVous ? fresh.rendezVous.filter(r => r.ID_Zone !== 5) : [];
      } else if (tableKey === 'rdv_intensif_4e') {
        fresh.rendezVous = fresh.rendezVous ? fresh.rendezVous.filter(r => r.ID_Zone !== 6) : [];
      } else {
        // Cast safely to clear arrays
        if (tableKey in fresh) {
          (fresh as any)[tableKey] = [];
        }
      }
    });

    // Special integrity cleanup checks post-deletion
    if (tablesToProcess.includes('abonnements') && fresh.patients) {
      fresh.patients = fresh.patients.map(p => ({ ...p, Nbre_Abn: 0, Nbre_Abn_Pat: 0 }));
    }
    
    // Reset consumptions if appointments or realized sessions are dropped but abn holds
    if ((tablesToProcess.includes('rendezVous') || tablesToProcess.includes('seances') || tablesToProcess.includes('rdv_intensif_2e') || tablesToProcess.includes('rdv_intensif_3e') || tablesToProcess.includes('rdv_intensif_4e')) && fresh.abonnements) {
      fresh.abonnements = fresh.abonnements.map(ab => ({ ...ab, Nbre_Sean_Consom_Abn: 0 }));
    }

    // Save and apply state update
    onSave(fresh);
    setDbState(fresh);

    // Reset checked status
    const resetChecked = { ...selectedTablesToClear };
    Object.keys(resetChecked).forEach(k => {
      resetChecked[k] = false;
    });
    setSelectedTablesToClear(resetChecked);

    setClearanceModalOpen(false);
    alert(`🍾 Réussite : Les ${tablesToProcess.length} table(s) ont été vidées avec efficacité !`);
  };

  const handleSelectAllClear = (val: boolean) => {
    const updated = { ...selectedTablesToClear };
    Object.keys(updated).forEach(k => {
      updated[k] = val;
    });
    setSelectedTablesToClear(updated);
  };

  interface TargetFieldDef {
    key: string;
    label: string;
    required: boolean;
    type: 'text' | 'number' | 'date' | 'enum';
    description: string;
    example: string;
  }

  const getTargetFieldsFor = (target: 'patients' | 'abonnements' | 'actes' | 'praticiens' | 'packs' | 'services'): TargetFieldDef[] => {
    if (target === 'patients') {
      return [
        { key: 'Nom_Patient', label: 'Nom & Prénom (FR)', required: true, type: 'text', description: 'Le nom complet en Français', example: '"Benamara Farida"' },
        { key: 'Genre_Patient', label: 'Genre / Sexe', required: false, type: 'enum', description: 'Homme, Femme ou Enfant', example: '"Femme"' },
        { key: 'type_patient', label: 'Type Patient', required: false, type: 'enum', description: 'Adulte, Enfant ou Enfant IMC', example: '"Adulte"' },
        { key: 'phone', label: 'N° de Téléphone', required: false, type: 'text', description: 'Contact téléphonique', example: '"0550112233"' },
        { key: 'address', label: 'Adresse', required: false, type: 'text', description: 'Adresse complète', example: '"Bab Ezzouar, Alger"' },
        { key: 'street', label: 'Rue', required: false, type: 'text', description: 'Quartier / Rue', example: '"Rue des 500 logts"' },
        { key: 'city', label: 'Commune / Ville', required: false, type: 'text', description: 'Nom de la commune', example: '"Alger"' },
        { key: 'wilaya', label: 'Code Wilaya', required: false, type: 'text', description: 'Code de 1 à 58', example: '"16"' },
        { key: 'Nom_Pat_Arb', label: 'Nom en Arabe', required: false, type: 'text', description: 'Nom en arabe (Optionnel)', example: '"بن عمارة"' },
        { key: 'Pren_Pat_Arb', label: 'Prénom en Arabe', required: false, type: 'text', description: 'Prénom en arabe (Optionnel)', example: '"فريدة"' },
      ];
    } else if (target === 'abonnements') {
      return [
        { key: 'Nom_Patient', label: 'Nom Complet du Patient', required: false, type: 'text', description: 'Nom complet du patient en Français (recherche/croisement intelligent)', example: '"Benamara Farida"' },
        { key: 'Libelle_Pack', label: 'Nom/Désignation du Forfait/Pack', required: false, type: 'text', description: 'Désignation complète du pack (recherche/croisement intelligent)', example: '"Forfait Kinésithérapie (10 séanc.)"' },
        { key: 'ID_Patient', label: 'ID Patient d\'origine (Optionnel)', required: false, type: 'number', description: 'ID numérique unique du patient d\'origine si connu', example: '124' },
        { key: 'ID_Pack', label: 'ID Pack d\'origine (Optionnel)', required: false, type: 'number', description: 'ID numérique du pack d\'origine si connu', example: '1' },
         { key: 'Date_Debut_Abn', label: 'Date de Début', required: false, type: 'date', description: 'Début au format AAAA-MM-JJ', example: '"2026-06-01"' },
        { key: 'Date_Fin_Abn', label: 'Date d\'Échéance', required: false, type: 'date', description: 'Expiration au format AAAA-MM-JJ', example: '"2026-09-01"' },
        { key: 'Date_Abn', label: "Date de l'Abonnement", required: false, type: 'date', description: "Création / Validation au format AAAA-MM-JJ", example: '"2026-06-01"' },
        { key: 'Nbre_Sean_Consom_Abn', label: 'Séances Consommées', required: false, type: 'number', description: 'Séances déjà consommées', example: '0' },
      ];
    } else if (target === 'praticiens') {
      return [
        { key: 'Nom_Prat', label: 'Nom de Famille', required: true, type: 'text', description: 'Nom de famille du praticien', example: '"Benkari"' },
        { key: 'Prenom_Prat', label: 'Prénom', required: true, type: 'text', description: 'Prénom du praticien', example: '"Mhand"' },
        { key: 'Nom_Arb', label: 'Nom Arabe', required: false, type: 'text', description: 'Nom en arabe pour le praticien', example: '"دوبوي"' },
        { key: 'Repere', label: 'Repère Médical (K/P/O/MPR)', required: true, type: 'enum', description: 'K = Kiné, P = Psychomotricien, O = Orthophoniste, MPR = Médecin MPR', example: '"K"' },
        { key: 'Genre_Prat', label: 'Genre (H/F)', required: true, type: 'enum', description: 'Genre : H = Homme, F = Femme', example: '"H"' },
        { key: 'ID_Sce', label: 'ID Service rattaché', required: false, type: 'number', description: 'Numéro ID du service (ex: 1)', example: '1' },
        { key: 'Date_Nais_Prat', label: 'Date de Naissance', required: false, type: 'date', description: 'Format AAAA-MM-JJ', example: '"1985-04-12"' },
        { key: 'Date_Recrut_Prat', label: 'Date Recrutement', required: false, type: 'date', description: 'Format AAAA-MM-JJ', example: '"2020-09-01"' },
        { key: 'Type_Cont_Prat', label: 'Type Contrat', required: false, type: 'enum', description: 'CDD, CDI, ou Néant', example: '"CDI"' },
        { key: 'Dat_Debu_Trv', label: 'Début Travail', required: false, type: 'text', description: 'Date et heure de début de travail', example: '"2026-06-10T08:00"' },
      ];
    } else if (target === 'packs') {
      return [
        { key: 'Libelle_Pack', label: 'Désignation du Pack/Forfait', required: true, type: 'text', description: 'Désignation complète du pack', example: '"Forfait Kinésithérapie (10 séanc.)"' },
        { key: 'Nbre_Seance_Pack', label: 'Nombre total de séances', required: true, type: 'number', description: 'Nombre total de séances', example: '10' },
        { key: 'Prix_Pack', label: 'Prix de la Carte / Forfait (DA)', required: false, type: 'number', description: 'Montant global du forfait', example: '12000' },
        { key: 'Prix_Seanc_Pack', label: 'Prix Unitaire de Séance (DA)', required: false, type: 'number', description: 'Prix unitaire calculé de la séance', example: '1200' },
      ];
    } else if (target === 'services') {
      return [
        { key: 'ID_Sce', label: 'ID Service / Sce', required: true, type: 'number', description: 'Identifiant unique numérique du service', example: '1' },
        { key: 'Libelle_Sce', label: 'Désignation / Libellé Service', required: true, type: 'text', description: 'Nom complet du service ou de l\'unité', example: '"Rééducation Fonctionnelle"' },
      ];
    } else {
      return [
        { key: 'Libelle_Acte', label: 'Libellé de l\'Acte', required: true, type: 'text', description: 'Désignation de la prestation', example: '"Rééducation de la cheville"' },
        { key: 'Prix_Acte', label: 'Tarif de l\'Acte (DA)', required: false, type: 'number', description: 'Tarif ou prix en Dinars', example: '1500' },
      ];
    }
  };

  const resolveMappedField = (row: any, targetKey: string): string => {
    const colSource = fieldMappings[targetKey];
    if (colSource === '__fixed__') {
      return (fixedValueSettings[targetKey] || '').trim();
    }
    if (colSource && colSource !== '__none__') {
      const val = row[colSource];
      return val !== undefined && val !== null ? String(val).trim() : '';
    }
    return '';
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) {
      throw new Error("Le fichier CSV doit contenir au moins une ligne d'en-tête et une ligne de données.");
    }
    
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      if (currentline.length === 1 && currentline[0] === "") continue;
      
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = currentline[index] || '';
      });
      parsed.push(obj);
    }
    return parsed;
  };

  const handlePreview = (text: string, type: 'csv' | 'json', targetParam?: 'patients' | 'abonnements' | 'actes') => {
    setImportSuccessMsg(null);
    const activeTarget = targetParam || importTarget;
    if (!text.trim()) {
      setPreviewData([]);
      setImportError(null);
      return;
    }
    try {
      if (type === 'json') {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("Le format JSON doit être un tableau d'objets.");
        }
        setPreviewData(parsed);
        setImportError(null);
      } else {
        const parsed = parseCSV(text);
        setPreviewData(parsed);
        setImportError(null);
      }
    } catch (err: any) {
      setImportError(err.message || "Erreur de syntaxe dans les données insérées.");
      setPreviewData([]);
    }
  };

  const executeImportAction = () => {
    if (previewData.length === 0) {
      return;
    }

    try {
      const fresh = { ...dbState };
      let importedCount = 0;

      if (importTarget === 'patients') {
        let maxId = fresh.patients.length > 0 ? Math.max(...fresh.patients.map(p => p.ID_Patient)) : 0;
        const newPatientsList: Patient[] = [...fresh.patients];

        previewData.forEach(row => {
          if (!row.Nom_Patient || !row.Nom_Patient.trim()) return;

          const alreadyExists = fresh.patients.some(p => p.Nom_Patient.toLowerCase() === row.Nom_Patient.trim().toLowerCase());
          if (alreadyExists) return;

          maxId++;

          let targetNomArb = row.Nom_Pat_Arb || '';
          let targetPrenArb = row.Pren_Pat_Arb || '';

          if (autoTranslateMissingArb && !targetNomArb && !targetPrenArb) {
            const trans = translateNameToArabic(row.Nom_Patient);
            targetNomArb = trans.Nom_Pat_Arb;
            targetPrenArb = trans.Pren_Pat_Arb;
          }

          let rowGenre: 'Homme' | 'Femme' | 'Enfant' = 'Homme';
          const rawGenre = String(row.Genre_Patient || '').toLowerCase();
          if (rawGenre.startsWith('f') || rawGenre.includes('femme') || rawGenre.includes('fille')) {
            rowGenre = 'Femme';
          } else if (rawGenre.includes('enfant') || rawGenre.startsWith('e') || rawGenre.startsWith('b')) {
            rowGenre = 'Enfant';
          }

          let rowType: 'Adulte' | 'Enfant' | 'Enfant IMC' = 'Adulte';
          const rawType = String(row.type_patient || '').toLowerCase();
          if (rawType.includes('imc')) {
            rowType = 'Enfant IMC';
          } else if (rawType.includes('enfant')) {
            rowType = 'Enfant';
          }

          const newPat: Patient = {
            ID_Patient: maxId,
            Nom_Patient: row.Nom_Patient.trim(),
            Nom_Pat_Arb: targetNomArb || undefined,
            Pren_Pat_Arb: targetPrenArb || undefined,
            Genre_Patient: rowGenre,
            type_patient: rowType,
            phone: row.phone || 'Non renseigné',
            address: row.address || 'Non renseignée',
            street: row.street || 'Non renseignée',
            city: row.city || 'Non renseignée',
            wilaya: row.wilaya || '16'
          };

          newPatientsList.push(newPat);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error("Tous les patients de la liste existent déjà (déduplication active) ou les lignes sont vides.");
        }

        fresh.patients = newPatientsList;
        setImportSuccessMsg(`Félicitations ! L'intégration de ${importedCount} nouveaux dossiers patients a été effectuée avec succès.`);

      } else if (importTarget === 'abonnements') {
        let maxId = fresh.abonnements.length > 0 ? Math.max(...fresh.abonnements.map(a => a.ID_Abn)) : 0;
        const newAbns: Abonnement[] = [...fresh.abonnements];

        previewData.forEach(row => {
          if (!row.ID_Patient || !row.ID_Pack) return;

          maxId++;
          const newAbn: Abonnement = {
            ID_Abn: maxId,
            ID_Patient: Number(row.ID_Patient),
            ID_Pack: Number(row.ID_Pack),
            Date_Debut_Abn: row.Date_Debut_Abn || new Date().toISOString().split('T')[0],
            Date_Fin_Abn: row.Date_Fin_Abn || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            Nbre_Sean_Consom_Abn: row.Nbre_Sean_Consom_Abn ? Number(row.Nbre_Sean_Consom_Abn) : 0,
            ID_Acte_Add1: row.ID_Acte_Add1 ? Number(row.ID_Acte_Add1) : null,
            ID_Acte_Add2: row.ID_Acte_Add2 ? Number(row.ID_Acte_Add2) : null
          };

          newAbns.push(newAbn);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error("Aucun abonnement valide n'a pu être importé (assurez-vous des colonnes ID_Patient et ID_Pack).");
        }

        fresh.abonnements = newAbns;
        // Recalculate Nbre_Abn for all patients
        fresh.patients = fresh.patients.map(p => ({
          ...p,
          Nbre_Abn: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length,
          Nbre_Abn_Pat: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length
        }));
        setImportSuccessMsg(`Félicitations ! L'intégration de ${importedCount} nouveaux abonnements patients a été effectuée avec succès.`);

      } else if (importTarget === 'actes') {
        let maxId = fresh.actes.length > 0 ? Math.max(...fresh.actes.map(a => a.ID_Acte)) : 0;
        const newActes: Acte[] = [...fresh.actes];

        previewData.forEach(row => {
          if (!row.Libelle_Acte || !row.Libelle_Acte.trim()) return;

          const alreadyExists = fresh.actes.some(a => a.Libelle_Acte.toLowerCase() === row.Libelle_Acte.trim().toLowerCase());
          if (alreadyExists) return;

          maxId++;
          const newActe: Acte = {
            ID_Acte: maxId,
            Libelle_Acte: row.Libelle_Acte.trim(),
            Prix_Acte: row.Prix_Acte ? Number(row.Prix_Acte) : 1500
          };

          newActes.push(newActe);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error("Tous les actes de la liste existent déjà ou les lignes sont vides.");
        }

        fresh.actes = newActes;
        setImportSuccessMsg(`Félicitations ! L'intégration de ${importedCount} nouveaux actes médicaux a été effectuée avec succès.`);
      } else if (importTarget === 'praticiens') {
        let maxId = fresh.praticiens.length > 0 ? Math.max(...fresh.praticiens.map(p => p.ID_Prat)) : 0;
        const newPrats: Praticien[] = [...fresh.praticiens];

        previewData.forEach(row => {
          if (!row.Nom_Prat || !row.Nom_Prat.trim() || !row.Prenom_Prat || !row.Prenom_Prat.trim()) return;

          const alreadyExists = fresh.praticiens.some(p => 
            p.Nom_Prat.toLowerCase() === row.Nom_Prat.trim().toLowerCase() &&
            p.Prenom_Prat.toLowerCase() === row.Prenom_Prat.trim().toLowerCase()
          );
          if (alreadyExists) return;

          maxId++;

          let repValue: 'K' | 'P' | 'O' | 'MPR' = 'K';
          const rawRep = String(row.Repere || '').toUpperCase().trim();
          if (rawRep === 'P' || rawRep === 'O' || rawRep === 'MPR') {
            repValue = rawRep;
          }

          let contValue: 'CDD' | 'CDI' | 'Néant' = 'CDI';
          const rawCont = String(row.Type_Cont_Prat || '').toUpperCase().trim();
          if (rawCont === 'CDD' || rawCont === 'NÉANT' || rawCont === 'NEANT') {
            contValue = rawCont === 'CDD' ? 'CDD' : 'Néant';
          }

          let genderPrat: 'H' | 'F' = 'H';
          const rawGen = String(row.Genre_Prat || '').toUpperCase().trim();
          if (rawGen === 'F' || rawGen === 'FEMME') {
            genderPrat = 'F';
          }

          const newP: Praticien = {
            ID_Prat: maxId,
            ID_Sce: resolveServiceId(row.ID_Sce, fresh.services || dbState.services, row),
            Repere: repValue,
            Nom_Prat: row.Nom_Prat.trim(),
            Prenom_Prat: row.Prenom_Prat.trim(),
            Date_Nais_Prat: row.Date_Nais_Prat ? String(row.Date_Nais_Prat).trim() : '1985-01-01',
            Date_Recrut_Prat: row.Date_Recrut_Prat ? String(row.Date_Recrut_Prat).trim() : '2020-01-01',
            Type_Cont_Prat: contValue,
            Genre_Prat: genderPrat,
            Dat_Debu_Trv: row.Dat_Debu_Trv ? String(row.Dat_Debu_Trv).trim() : undefined
          };

          newPrats.push(newP);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error("Tous les praticiens de la liste existent déjà ou les lignes sont vides.");
        }

        fresh.praticiens = newPrats;
        setImportSuccessMsg(`Félicitations ! L'intégration de ${importedCount} nouveaux praticiens a été effectuée avec succès.`);
      } else if (importTarget === 'packs') {
        let maxId = fresh.packs.length > 0 ? Math.max(...fresh.packs.map(p => p.ID_Pack)) : 0;
        const newPacks: Pack[] = [...fresh.packs];

        previewData.forEach(row => {
          if (!row.Libelle_Pack || !row.Libelle_Pack.trim()) return;

          const alreadyExists = fresh.packs.some(p => 
            p.Libelle_Pack.toLowerCase() === row.Libelle_Pack.trim().toLowerCase()
          );
          if (alreadyExists) return;

          maxId++;
          const rawPrix = row.Prix_Pack !== undefined ? Number(row.Prix_Pack) : undefined;
          const rawPrixSeance = row.Prix_Seanc_Pack !== undefined ? Number(row.Prix_Seanc_Pack) : (row.Prix_Seance_Pack !== undefined ? Number(row.Prix_Seance_Pack) : undefined);

          const newPack: Pack = {
            ID_Pack: maxId,
            Libelle_Pack: row.Libelle_Pack.trim(),
            Nbre_Seance_Pack: row.Nbre_Seance_Pack ? Number(row.Nbre_Seance_Pack) : 10,
            Prix_Pack: rawPrix !== undefined && !isNaN(rawPrix) ? rawPrix : undefined,
            Prix_Seanc_Pack: rawPrixSeance !== undefined && !isNaN(rawPrixSeance) ? rawPrixSeance : undefined
          };

          newPacks.push(newPack);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error("Tous les forfaits/packs de la liste existent déjà ou les lignes sont vides.");
        }

        fresh.packs = newPacks;
        setImportSuccessMsg(`Félicitations ! L'intégration de ${importedCount} nouveaux forfaits/packs a été effectuée avec succès.`);
      } else if (importTarget === 'services') {
        const newServices = [...fresh.services];

        previewData.forEach(row => {
          if (!row.Libelle_Sce || !row.Libelle_Sce.trim()) return;

          const alreadyExists = fresh.services.some(s => 
            s.Libelle_Sce.toLowerCase() === row.Libelle_Sce.trim().toLowerCase()
          );
          if (alreadyExists) return;

          const targetId = row.ID_Sce ? Number(row.ID_Sce) : (newServices.length > 0 ? Math.max(...newServices.map(s => s.ID_Sce)) + 1 : 1);

          const newSce: Sce = {
            ID_Sce: isNaN(targetId) ? (newServices.length > 0 ? Math.max(...newServices.map(s => s.ID_Sce)) + 1 : 1) : targetId,
            Libelle_Sce: row.Libelle_Sce.trim()
          };

          newServices.push(newSce);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error("Tous les services de la liste existent déjà ou les lignes sont vides.");
        }

        fresh.services = newServices;
        setImportSuccessMsg(`Félicitations ! L'intégration de ${importedCount} nouveaux services (Sce) a été effectuée avec succès.`);
      }

      onSave(fresh, [importTarget]);
      setDbState(fresh);
      setPreviewData([]);
      setImportText('');
    } catch (err: any) {
      setImportError(err.message || "Échec de l'intégration.");
    }
  };

  const handleGlobalInjection = async () => {
    setIsInjecting(true);
    setInjectionResult(null);
    setImportError(null);
    setImportSuccessMsg(null);
    try {
      const response = await fetch('/api/db/inject', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setImportSuccessMsg(data.summary);
        setInjectionResult(data.summary);
        if (data.database) {
          onSave(data.database);
          setDbState(data.database);
        }
      } else {
        const errData = await response.json();
        setImportError(errData.details || "Échec de l'injection globale.");
      }
    } catch (err: any) {
      setImportError("Erreur réseau ou serveur lors de l'injection : " + err.message);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleExcelImport = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setImportSuccessMsg(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error("Aucune feuille de calcul trouvée dans ce fichier Excel d'import.");
        }
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

        if (!jsonData || jsonData.length === 0) {
          throw new Error("La feuille Excel sélectionnée ne contient pas de données.");
        }

        const headers = Object.keys(jsonData[0]);
        setExcelRows(jsonData);
        setExcelHeaders(headers);

        // Auto-match mappings:
        const targets = getTargetFieldsFor(importTarget);
        const autoMappings: Record<string, string> = {};
        const autoFixedValues: Record<string, string> = {};

        targets.forEach(tgt => {
          autoFixedValues[tgt.key] = '';
          // Simple intelligent matching
          const matched = headers.find(h => {
            const hLower = h.toLowerCase().trim().replace(/[_ ]/g, '');
            const kLower = tgt.key.toLowerCase().trim().replace(/[_ ]/g, '');
            const lLower = tgt.label.toLowerCase().trim().replace(/[_ ]/g, '');
            return hLower === kLower || hLower === lLower || hLower.includes(kLower) || kLower.includes(hLower) || hLower.includes(lLower);
          });
          autoMappings[tgt.key] = matched || '__none__';
        });

        setFieldMappings(autoMappings);
        setFixedValueSettings(autoFixedValues);
        setIsMappingModalOpen(true);
      } catch (err: any) {
        setImportError("Échec de la lecture du fichier Excel: " + (err.message || err));
      }
    };
    reader.onerror = () => {
      setImportError("Impossible de charger le fichier.");
    };
    reader.readAsArrayBuffer(file);
  };

  const executeMappingImport = () => {
    try {
      const targets = getTargetFieldsFor(importTarget);
      
      // Validation: verify required targeted parameters are mapped
      const missingRequired = targets.filter(t => t.required && fieldMappings[t.key] === '__none__');
      if (missingRequired.length > 0) {
        throw new Error(`Le(s) champ(s) obligatoire(s) suivant(s) n'ont pas d'association : ${missingRequired.map(m => m.label).join(', ')}.`);
      }

      const fresh = { ...dbState };
      let importedCount = 0;
      let duplicateCount = 0;
      let ignoredCount = 0;

      if (importTarget === 'patients') {
        let maxId = fresh.patients.length > 0 ? Math.max(...fresh.patients.map(p => p.ID_Patient)) : 0;
        const newPatientsList: Patient[] = [...fresh.patients];

        excelRows.forEach(row => {
          const rawName = resolveMappedField(row, 'Nom_Patient').trim();
          if (!rawName) {
            ignoredCount++;
            return;
          }

          // Deduplicate
          const alreadyExists = fresh.patients.some(p => p.Nom_Patient.toLowerCase() === rawName.toLowerCase());
          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          maxId++;

          let targetNomArb = resolveMappedField(row, 'Nom_Pat_Arb').trim();
          let targetPrenArb = resolveMappedField(row, 'Pren_Pat_Arb').trim();

          if (autoTranslateMissingArb && !targetNomArb && !targetPrenArb) {
            const trans = translateNameToArabic(rawName);
            targetNomArb = trans.Nom_Pat_Arb;
            targetPrenArb = trans.Pren_Pat_Arb;
          }

          let rawGenre = resolveMappedField(row, 'Genre_Patient').trim().toLowerCase();
          let rowGenre: 'Homme' | 'Femme' | 'Enfant' = 'Homme';
          if (rawGenre.startsWith('f') || rawGenre.includes('femme') || rawGenre.includes('fille')) {
            rowGenre = 'Femme';
          } else if (rawGenre.includes('enfant') || rawGenre.startsWith('e') || rawGenre.startsWith('b') || rawGenre.includes('fils') || rawGenre.includes('garcon') || rawGenre.includes('garçon')) {
            rowGenre = 'Enfant';
          }

          let rawType = resolveMappedField(row, 'type_patient').trim().toLowerCase();
          let rowType: 'Adulte' | 'Enfant' | 'Enfant IMC' = 'Adulte';
          if (rawType.includes('imc')) {
            rowType = 'Enfant IMC';
          } else if (rawType.includes('enfant') || rowGenre === 'Enfant') {
            rowType = 'Enfant';
          }

          const rawWilayaVal = resolveMappedField(row, 'wilaya');
          const cleanedWilaya = cleanAlgerianWilaya(rawWilayaVal);
          
          let cityVal = resolveMappedField(row, 'city') || 'Non renseignée';
          if ((cityVal === 'Non renseignée' || !cityVal) && cleanedWilaya.detectedCity) {
            cityVal = cleanedWilaya.detectedCity;
          }

          const newPat: Patient = {
            ID_Patient: maxId,
            Nom_Patient: rawName,
            Nom_Pat_Arb: targetNomArb || undefined,
            Pren_Pat_Arb: targetPrenArb || undefined,
            Genre_Patient: rowGenre,
            type_patient: rowType,
            phone: resolveMappedField(row, 'phone') || 'Non renseigné',
            address: resolveMappedField(row, 'address') || 'Non renseignée',
            street: resolveMappedField(row, 'street') || 'Non renseignée',
            city: cityVal,
            wilaya: cleanedWilaya.code
          };

          newPatientsList.push(newPat);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error(`Tous les patients de la feuille Excel existent déjà (${duplicateCount} doublons ignorés) ou sont vides.`);
        }

        fresh.patients = newPatientsList;
        setImportSuccessMsg(`Félicitations ! L'importation de ${importedCount} nouveaux dossiers patients s'est déroulée avec succès. (${duplicateCount} doublons détectés et filtrés).`);

      } else if (importTarget === 'abonnements') {
        let maxId = fresh.abonnements.length > 0 ? Math.max(...fresh.abonnements.map(a => a.ID_Abn)) : 0;
        const newAbns: Abonnement[] = [...fresh.abonnements];

        excelRows.forEach(row => {
          let patId: number | null = null;
          let packId: number | null = null;

          const mappedPatientIdStr = resolveMappedField(row, 'ID_Patient').trim();
          const mappedPatientNameStr = resolveMappedField(row, 'Nom_Patient').trim();
          const mappedPackIdStr = resolveMappedField(row, 'ID_Pack').trim();
          const mappedPackLibelleStr = resolveMappedField(row, 'Libelle_Pack').trim();

          // 1. Resolve Patient ID
          if (mappedPatientNameStr) {
            const matchedPat = fresh.patients.find(p => 
              p.Nom_Patient.toLowerCase().trim() === mappedPatientNameStr.toLowerCase().trim()
            );
            if (matchedPat) {
              patId = matchedPat.ID_Patient;
            }
          }

          if (patId === null && mappedPatientIdStr) {
            const parsedId = Number(mappedPatientIdStr);
            if (!isNaN(parsedId)) {
              const matchedPat = fresh.patients.find(p => p.ID_Patient === parsedId);
              if (matchedPat) {
                patId = parsedId;
              }
            } else {
              // Maybe the name was accidentally mapped to ID column
              const matchedPat = fresh.patients.find(p => 
                p.Nom_Patient.toLowerCase().trim() === mappedPatientIdStr.toLowerCase().trim()
              );
              if (matchedPat) {
                patId = matchedPat.ID_Patient;
              }
            }
          }

          // Fallback auto-create patient so we don't lose the record
          if (patId === null) {
            const candidateName = mappedPatientNameStr || (mappedPatientIdStr && isNaN(Number(mappedPatientIdStr)) ? mappedPatientIdStr : '');
            if (candidateName) {
              const maxPatId = fresh.patients.length > 0 ? Math.max(...fresh.patients.map(p => p.ID_Patient)) + 1 : 1;
              const newPat: Patient = {
                ID_Patient: maxPatId,
                Nom_Patient: candidateName,
                Nom_Pat_Arb: '',
                Pren_Pat_Arb: '',
                Genre_Patient: 'Homme',
                type_patient: 'Adulte',
                phone: '',
                address: 'Créé automatiquement via import abonnements',
                street: '',
                city: 'Non renseignée',
                wilaya: '16',
                Nbre_Abn: 1,
                Nbre_Abn_Pat: 1
              };
              fresh.patients.push(newPat);
              patId = maxPatId;
            }
          }

          // 2. Resolve Pack ID
          if (mappedPackLibelleStr) {
            const matchedPack = fresh.packs.find(p => 
              p.Libelle_Pack.toLowerCase().trim() === mappedPackLibelleStr.toLowerCase().trim()
            );
            if (matchedPack) {
              packId = matchedPack.ID_Pack;
            } else {
              // Try partial search
              const partialMatched = fresh.packs.find(p => 
                p.Libelle_Pack.toLowerCase().includes(mappedPackLibelleStr.toLowerCase()) ||
                mappedPackLibelleStr.toLowerCase().includes(p.Libelle_Pack.toLowerCase())
              );
              if (partialMatched) {
                packId = partialMatched.ID_Pack;
              }
            }
          }

          if (packId === null && mappedPackIdStr) {
            const parsedId = Number(mappedPackIdStr);
            if (!isNaN(parsedId)) {
              const matchedPack = fresh.packs.find(p => p.ID_Pack === parsedId);
              if (matchedPack) {
                packId = parsedId;
              }
            } else {
              // Maybe the pack name was mapped to ID column
              const matchedPack = fresh.packs.find(p => 
                p.Libelle_Pack.toLowerCase().trim() === mappedPackIdStr.toLowerCase().trim()
              );
              if (matchedPack) {
                packId = matchedPack.ID_Pack;
              }
            }
          }

          // Fallback auto-create pack/forfait so we don't lose the record
          if (packId === null) {
            const candidatePackName = mappedPackLibelleStr || (mappedPackIdStr && isNaN(Number(mappedPackIdStr)) ? mappedPackIdStr : 'Forfait Importé');
            const maxPackId = fresh.packs.length > 0 ? Math.max(...fresh.packs.map(p => p.ID_Pack)) + 1 : 1;
            const newPack: Pack = {
              ID_Pack: maxPackId,
              Libelle_Pack: candidatePackName,
              Nbre_Seance_Pack: 10,
              Prix_Pack: 12000,
              Prix_Seanc_Pack: 1200
            };
            fresh.packs.push(newPack);
            packId = maxPackId;
          }

          if (!patId || !packId) {
            ignoredCount++;
            return;
          }

          let debut = resolveMappedField(row, 'Date_Debut_Abn').trim();
          if (!debut) debut = new Date().toISOString().split('T')[0];

          // Deduplicate
          const alreadyExists = fresh.abonnements.some(a => a.ID_Patient === patId && a.ID_Pack === packId && a.Date_Debut_Abn === debut);
          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          maxId++;
          
          let fin = resolveMappedField(row, 'Date_Fin_Abn').trim();
          if (!fin) fin = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const consumedStr = resolveMappedField(row, 'Nbre_Sean_Consom_Abn').trim();
          const consumed = consumedStr ? Number(consumedStr) : 0;

          const newAbn: Abonnement = {
            ID_Abn: maxId,
            ID_Patient: patId,
            ID_Pack: packId,
            Date_Debut_Abn: debut,
            Date_Fin_Abn: fin,
            Nbre_Sean_Consom_Abn: isNaN(consumed) ? 0 : consumed,
            ID_Acte_Add1: null,
            ID_Acte_Add2: null,
            Date_Abn: resolveMappedField(row, 'Date_Abn').trim() || debut
          };

          newAbns.push(newAbn);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error(`Aucun abonnement n'a pu être importé. (${duplicateCount} abonnements doublons détectés et ignorés).`);
        }

        fresh.abonnements = newAbns;
        // Recalculate Nbre_Abn for all patients
        fresh.patients = fresh.patients.map(p => ({
          ...p,
          Nbre_Abn: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length,
          Nbre_Abn_Pat: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length
        }));
        setImportSuccessMsg(`Félicitations ! L'importation de ${importedCount} nouveaux abonnements s'est déroulée avec succès. (${duplicateCount} doublons ignorés).`);

      } else if (importTarget === 'actes') {
        let maxId = fresh.actes.length > 0 ? Math.max(...fresh.actes.map(a => a.ID_Acte)) : 0;
        const newActes: Acte[] = [...fresh.actes];

        excelRows.forEach(row => {
          const libInFR = resolveMappedField(row, 'Libelle_Acte').trim();
          if (!libInFR) {
            ignoredCount++;
            return;
          }

          const alreadyExists = fresh.actes.some(a => a.Libelle_Acte.toLowerCase() === libInFR.toLowerCase());
          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          maxId++;
          
          const rawPrice = resolveMappedField(row, 'Prix_Acte').trim();
          const numPrice = rawPrice ? Number(rawPrice) : 1500;

          const newActe: Acte = {
            ID_Acte: maxId,
            Libelle_Acte: libInFR,
            Prix_Acte: isNaN(numPrice) ? 1500 : numPrice
          };

          newActes.push(newActe);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error(`Tous les actes de la liste existent déjà dans la base d'actes (${duplicateCount} doublons ignorés).`);
        }

        fresh.actes = newActes;
        setImportSuccessMsg(`Félicitations ! L'importation de ${importedCount} nouveaux actes médicaux s'est déroulée avec succès. (${duplicateCount} doublons ignorés).`);
      } else if (importTarget === 'praticiens') {
        let maxId = fresh.praticiens.length > 0 ? Math.max(...fresh.praticiens.map(p => p.ID_Prat)) : 0;
        const newPrat: Praticien[] = [...fresh.praticiens];

        excelRows.forEach(row => {
          const rawNom = resolveMappedField(row, 'Nom_Prat').trim();
          const rawPrenom = resolveMappedField(row, 'Prenom_Prat').trim();
          if (!rawNom || !rawPrenom) {
            ignoredCount++;
            return;
          }

          const alreadyExists = fresh.praticiens.some(p => 
            p.Nom_Prat.toLowerCase() === rawNom.toLowerCase() &&
            p.Prenom_Prat.toLowerCase() === rawPrenom.toLowerCase()
          );
          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          maxId++;

          let repValue: 'K' | 'P' | 'O' | 'MPR' = 'K';
          const rawRep = resolveMappedField(row, 'Repere').toUpperCase().trim();
          if (rawRep === 'P' || rawRep === 'O' || rawRep === 'MPR') {
            repValue = rawRep;
          }

          let contValue: 'CDD' | 'CDI' | 'Néant' = 'CDI';
          const rawCont = resolveMappedField(row, 'Type_Cont_Prat').toUpperCase().trim();
          if (rawCont === 'CDD' || rawCont === 'NÉANT' || rawCont === 'NEANT') {
            contValue = rawCont === 'CDD' ? 'CDD' : 'Néant';
          }

          let genderPrat: 'H' | 'F' = 'H';
          const rawGen = resolveMappedField(row, 'Genre_Prat').toUpperCase().trim();
          if (rawGen === 'F' || rawGen === 'FEMME') {
            genderPrat = 'F';
          }

          const newP: Praticien = {
            ID_Prat: maxId,
            ID_Sce: resolveServiceId(resolveMappedField(row, 'ID_Sce'), fresh.services || dbState.services, row),
            Repere: repValue,
            Nom_Prat: rawNom,
            Prenom_Prat: rawPrenom,
            Date_Nais_Prat: resolveMappedField(row, 'Date_Nais_Prat') || '1985-01-01',
            Date_Recrut_Prat: resolveMappedField(row, 'Date_Recrut_Prat') || '2020-01-01',
            Type_Cont_Prat: contValue,
            Genre_Prat: genderPrat,
            Dat_Debu_Trv: resolveMappedField(row, 'Dat_Debu_Trv') || undefined
          };

          newPrat.push(newP);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error(`Tous les praticiens de la feuille Excel existent déjà dans la base (${duplicateCount} doublons ignorés).`);
        }

        fresh.praticiens = newPrat;
        setImportSuccessMsg(`Félicitations ! L'importation de ${importedCount} nouveaux praticiens s'est déroulée avec succès. (${duplicateCount} doublons ignorés).`);
      } else if (importTarget === 'packs') {
        let maxId = fresh.packs.length > 0 ? Math.max(...fresh.packs.map(p => p.ID_Pack)) : 0;
        const newPacks: Pack[] = [...fresh.packs];

        excelRows.forEach(row => {
          const rawLib = resolveMappedField(row, 'Libelle_Pack').trim();
          if (!rawLib) {
            ignoredCount++;
            return;
          }

          const alreadyExists = fresh.packs.some(p => 
            p.Libelle_Pack.toLowerCase() === rawLib.toLowerCase()
          );
          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          maxId++;

          const rawSeances = resolveMappedField(row, 'Nbre_Seance_Pack').trim();
          const numSeances = rawSeances ? Number(rawSeances) : 10;

          const rawPrix = resolveMappedField(row, 'Prix_Pack').trim();
          const rawPrixSeance = (resolveMappedField(row, 'Prix_Seanc_Pack') || resolveMappedField(row, 'Prix_Seance_Pack')).trim();

          const numPrix = rawPrix ? Number(rawPrix) : undefined;
          const numPrixSeance = rawPrixSeance ? Number(rawPrixSeance) : undefined;

          const newPack: Pack = {
            ID_Pack: maxId,
            Libelle_Pack: rawLib,
            Nbre_Seance_Pack: isNaN(numSeances) ? 10 : numSeances,
            Prix_Pack: numPrix !== undefined && !isNaN(numPrix) ? numPrix : undefined,
            Prix_Seanc_Pack: numPrixSeance !== undefined && !isNaN(numPrixSeance) ? numPrixSeance : undefined
          };

          newPacks.push(newPack);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error(`Tous les forfaits/packs de la feuille Excel existent déjà dans la base (${duplicateCount} doublons ignorés).`);
        }

        fresh.packs = newPacks;
        setImportSuccessMsg(`Félicitations ! L'importation de ${importedCount} nouveaux forfaits/packs s'est déroulée avec succès. (${duplicateCount} doublons ignorés).`);
      } else if (importTarget === 'services') {
        const newServices = [...fresh.services];

        excelRows.forEach(row => {
          const rawLib = resolveMappedField(row, 'Libelle_Sce').trim();
          if (!rawLib) {
            ignoredCount++;
            return;
          }

          const alreadyExists = fresh.services.some(s => 
            s.Libelle_Sce.toLowerCase() === rawLib.toLowerCase()
          );
          if (alreadyExists) {
            duplicateCount++;
            return;
          }

          const rawId = resolveMappedField(row, 'ID_Sce').trim();
          const targetId = rawId ? Number(rawId) : (newServices.length > 0 ? Math.max(...newServices.map(s => s.ID_Sce)) + 1 : 1);

          const newSce: Sce = {
            ID_Sce: isNaN(targetId) ? (newServices.length > 0 ? Math.max(...newServices.map(s => s.ID_Sce)) + 1 : 1) : targetId,
            Libelle_Sce: rawLib
          };

          newServices.push(newSce);
          importedCount++;
        });

        if (importedCount === 0) {
          throw new Error(`Tous les services de la feuille Excel existent déjà dans la base (${duplicateCount} doublons ignorés).`);
        }

        fresh.services = newServices;
        setImportSuccessMsg(`Félicitations ! L'importation de ${importedCount} nouveaux services (Sce) s'est déroulée avec succès. (${duplicateCount} doublons ignorés).`);
      }

      onSave(fresh, [importTarget]);
      setDbState(fresh);
      setIsMappingModalOpen(false);
      setPreviewData([]);
      setImportText('');
    } catch (err: any) {
      setImportError(err.message || "Échec de l'importation.");
    }
  };

  const updateDB = (newState: DatabaseState) => {
    setDbState(newState);
    onSave(newState, [activeTable]);
    setShowAddForm(false);
  };

  const handleRowClick = (row: any, id: number) => {
    if (selectedRowId === id) {
      setSelectedRowId(null);
      setEditValues({});
    } else {
      setSelectedRowId(id);
      if (activeTable === 'utilisateurs') {
        const pwd = (row.MotDePasse || row.Password || '').trim();
        const name = (row.Nom_Utilisateur || row.Nom || '').trim();
        const login = (row.Login || row.login || row.Username || '').trim();
        setEditValues({
          ...row,
          Nom_Utilisateur: name,
          Nom: name,
          Login: login,
          login: login,
          Username: login,
          MotDePasse: pwd,
          Password: pwd,
          Role: row.Role || 'Receptionniste RDC',
          ID_Sce: Number(row.ID_Sce) || 1
        });
        setUserName(name);
        setUserLogin(login);
        setUserRole(row.Role || 'Receptionniste RDC');
        setUserService(Number(row.ID_Sce) || 1);
        setUserPassword(pwd);
      } else {
        setEditValues({ ...row });
      }
    }
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedRowId === null) return;
    const fresh = {
      ...dbState,
      patients: dbState.patients ? [...dbState.patients] : [],
      services: dbState.services ? [...dbState.services] : [],
      utilisateurs: dbState.utilisateurs ? [...dbState.utilisateurs] : [],
      praticiens: dbState.praticiens ? [...dbState.praticiens] : [],
      actes: dbState.actes ? [...dbState.actes] : [],
      packs: dbState.packs ? [...dbState.packs] : [],
      abonnements: dbState.abonnements ? [...dbState.abonnements] : [],
      typesPlanning: dbState.typesPlanning ? [...dbState.typesPlanning] : [],
      zones: dbState.zones ? [...dbState.zones] : [],
      reglesBalneo: dbState.reglesBalneo ? [...dbState.reglesBalneo] : [],
      seances: dbState.seances ? [...dbState.seances] : []
    };

    if (activeTable === 'patients') {
      const idx = fresh.patients.findIndex(x => x.ID_Patient === selectedRowId);
      if (idx !== -1) fresh.patients[idx] = { ...editValues };
    } 
    else if (activeTable === 'services') {
      const idx = fresh.services.findIndex(x => x.ID_Sce === selectedRowId);
      if (idx !== -1) fresh.services[idx] = { ...editValues };
    }
    else if (activeTable === 'utilisateurs') {
      const idx = fresh.utilisateurs.findIndex(x => (x.ID_Utilisateur || (x as any).ID_User) === selectedRowId);
      if (idx !== -1) {
        const u = fresh.utilisateurs[idx];
        const nameVal = (editValues.Nom_Utilisateur || editValues.Nom || userName || u.Nom_Utilisateur || u.Nom || '').trim();
        const loginVal = (editValues.Login || editValues.login || editValues.Username || userLogin || u.Login || u.login || u.Username || '').trim();
        const pwdVal = (editValues.MotDePasse || editValues.Password || userPassword || u.MotDePasse || u.Password || loginVal).trim();
        const roleVal = editValues.Role || userRole || u.Role;
        const sceVal = Number(editValues.ID_Sce || userService || u.ID_Sce || 1);

        const updatedUser = {
          ...u,
          ...editValues,
          ID_Utilisateur: selectedRowId,
          ID_User: selectedRowId,
          Nom_Utilisateur: nameVal,
          Nom: nameVal,
          Login: loginVal,
          login: loginVal,
          Username: loginVal,
          MotDePasse: pwdVal,
          Password: pwdVal,
          Role: roleVal,
          ID_Sce: sceVal
        };

        fresh.utilisateurs[idx] = updatedUser;
        if ((fresh as any).users && Array.isArray((fresh as any).users)) {
          const userIdx = (fresh as any).users.findIndex((x: any) => (x.ID_Utilisateur || x.ID_User) === selectedRowId);
          if (userIdx !== -1) {
            (fresh as any).users[userIdx] = updatedUser;
          } else {
            (fresh as any).users.push(updatedUser);
          }
        }
      }
    }
    else if (activeTable === 'praticiens') {
      const idx = fresh.praticiens.findIndex(x => x.ID_Prat === selectedRowId);
      if (idx !== -1) fresh.praticiens[idx] = { ...editValues };
    }
    else if (activeTable === 'actes') {
      const idx = fresh.actes.findIndex(x => x.ID_Acte === selectedRowId);
      if (idx !== -1) fresh.actes[idx] = { ...editValues };
    }
    else if (activeTable === 'packs') {
      if (!editValues.id_acte) {
        alert("⚠️ Le champ 'ID_Acte rattaché' est obligatoire pour ce pack.");
        return;
      }
      const idx = fresh.packs.findIndex(x => x.ID_Pack === selectedRowId);
      if (idx !== -1) fresh.packs[idx] = { ...editValues };
    }
    else if (activeTable === 'abonnements') {
      const idx = fresh.abonnements.findIndex(x => x.ID_Abn === selectedRowId);
      if (idx !== -1) fresh.abonnements[idx] = { ...editValues };
    }
    else if (activeTable === 'typesPlanning') {
      const idx = fresh.typesPlanning.findIndex(x => x.ID_Type_Plan === selectedRowId);
      if (idx !== -1) fresh.typesPlanning[idx] = { ...editValues };
    }
    else if (activeTable === 'zones') {
      const idx = fresh.zones.findIndex(x => x.ID_Zone === selectedRowId);
      if (idx !== -1) fresh.zones[idx] = { ...editValues };
    }
    else if (activeTable === 'reglesBalneo') {
      const idx = fresh.reglesBalneo.findIndex(x => x.ID_Regle === selectedRowId);
      if (idx !== -1) fresh.reglesBalneo[idx] = { ...editValues };
    }
    else if (activeTable === 'seances') {
      const idx = fresh.seances.findIndex(x => x.ID_Seanc === selectedRowId);
      if (idx !== -1) fresh.seances[idx] = { ...editValues };
    }

    updateDB(fresh);
    setSelectedRowId(null);
    setEditValues({});
  };

  // Safe row deletion triggers to prove flexibility
  const handleDeleteRow = (tableName: TableName, id: number) => {
    const fresh = { ...dbState };
    if (tableName === 'patients') {
      fresh.patients = fresh.patients.filter(p => p.ID_Patient !== id);
    } else if (tableName === 'abonnements') {
      fresh.abonnements = fresh.abonnements.filter(a => a.ID_Abn !== id);
      // Recalculate Nbre_Abn for patients
      fresh.patients = fresh.patients.map(p => ({
        ...p,
        Nbre_Abn: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length,
        Nbre_Abn_Pat: fresh.abonnements.filter(a => a.ID_Patient === p.ID_Patient).length
      }));
    } else if (tableName === 'praticiens') {
      fresh.praticiens = fresh.praticiens.filter(p => p.ID_Prat !== id);
    } else if (tableName === 'actes') {
      fresh.actes = fresh.actes.filter(a => a.ID_Acte !== id);
    } else if (tableName === 'packs') {
      fresh.packs = fresh.packs.filter(p => p.ID_Pack !== id);
    } else if (tableName === 'services') {
      fresh.services = fresh.services.filter(s => s.ID_Sce !== id);
    } else if (tableName === 'utilisateurs') {
      fresh.utilisateurs = fresh.utilisateurs.filter(u => u.ID_Utilisateur !== id && (u as any).ID_User !== id);
      if ((fresh as any).users && Array.isArray((fresh as any).users)) {
        (fresh as any).users = (fresh as any).users.filter((u: any) => u.ID_Utilisateur !== id && u.ID_User !== id);
      }
    } else if (tableName === 'typesPlanning') {
      fresh.typesPlanning = fresh.typesPlanning.filter(t => t.ID_Type_Plan !== id);
    } else if (tableName === 'zones') {
      fresh.zones = fresh.zones.filter(z => z.ID_Zone !== id);
    } else if (tableName === 'reglesBalneo') {
      fresh.reglesBalneo = fresh.reglesBalneo.filter(r => r.ID_Regle !== id);
    } else if (tableName === 'seances') {
      fresh.seances = fresh.seances.filter(s => s.ID_Seanc !== id);
    }
    updateDB(fresh);
  };

  const handleTranslatePraticien = () => {
    const targetNom = editValues.Nom_Prat || '';
    const targetPrenom = editValues.Prenom_Prat || '';
    const fullName = `${targetPrenom} ${targetNom}`.trim();
    if (fullName) {
      const res = translateNameToArabic(fullName);
      const arabName = `${res.Pren_Pat_Arb} ${res.Nom_Pat_Arb}`.trim();
      setEditValues({
        ...editValues,
        Nom_Arb: arabName
      });
    }
  };

  const handleTranslateNewPraticien = () => {
    const fullName = `${pratPrenom} ${pratNom}`.trim();
    if (fullName) {
      const res = translateNameToArabic(fullName);
      const arabName = `${res.Pren_Pat_Arb} ${res.Nom_Pat_Arb}`.trim();
      setPratNomArb(arabName);
    }
  };

  const handleSubmitNewRow = (e: React.FormEvent) => {
    e.preventDefault();
    const fresh = {
      ...dbState,
      patients: dbState.patients ? [...dbState.patients] : [],
      services: dbState.services ? [...dbState.services] : [],
      utilisateurs: dbState.utilisateurs ? [...dbState.utilisateurs] : [],
      praticiens: dbState.praticiens ? [...dbState.praticiens] : [],
      actes: dbState.actes ? [...dbState.actes] : [],
      packs: dbState.packs ? [...dbState.packs] : [],
      abonnements: dbState.abonnements ? [...dbState.abonnements] : [],
      typesPlanning: dbState.typesPlanning ? [...dbState.typesPlanning] : [],
      zones: dbState.zones ? [...dbState.zones] : [],
      reglesBalneo: dbState.reglesBalneo ? [...dbState.reglesBalneo] : [],
      seances: dbState.seances ? [...dbState.seances] : []
    };

    if (activeTable === 'patients') {
      const nextId = fresh.patients.length > 0 ? Math.max(...fresh.patients.map(p => p.ID_Patient)) + 1 : 1;
      fresh.patients.push({
        ID_Patient: nextId,
        Nom_Patient: patientName || 'Nouveau Patient',
        Genre_Patient: patientGenre
      });
      setPatientName('');
    } 
    else if (activeTable === 'services') {
      const nextId = fresh.services.length > 0 ? Math.max(...fresh.services.map(s => s.ID_Sce)) + 1 : 1;
      fresh.services.push({
        ID_Sce: nextId,
        Libelle_Sce: serviceName || 'Nouveau Service'
      });
      setServiceName('');
    }
    else if (activeTable === 'utilisateurs') {
      const nextId = fresh.utilisateurs.length > 0 ? Math.max(...fresh.utilisateurs.map(u => u.ID_Utilisateur)) + 1 : 1;
      const loginValue = (userLogin || '').trim();
      const passwordValue = (userPassword || '').trim();

      if (!loginValue || !passwordValue) {
        alert("⚠️ Le login et le mot de passe sont obligatoires.");
        return;
      }

      const newUser: any = {
        ID_Utilisateur: nextId,
        ID_User: nextId,
        ID_Sce: Number(userService),
        Nom_Utilisateur: userName.trim() || 'Nouvel Utilisateur',
        Nom: userName.trim() || 'Nouvel Utilisateur',
        Role: userRole,
        Login: loginValue,
        login: loginValue,
        Username: loginValue,
        MotDePasse: passwordValue,
        Password: passwordValue
      };

      fresh.utilisateurs = [...(fresh.utilisateurs || []), newUser];
      if ((fresh as any).users) {
        (fresh as any).users = [...((fresh as any).users || []), newUser];
      }

      setUserName('');
      setUserLogin('');
      setUserPassword('');
      alert(`Utilisateur créé. Login: ${loginValue} | Mot de passe: ${passwordValue}`);
    }
    else if (activeTable === 'praticiens') {
      const nextId = fresh.praticiens.length > 0 ? Math.max(...fresh.praticiens.map(p => p.ID_Prat)) + 1 : 1;
      fresh.praticiens.push({
        ID_Prat: nextId,
        ID_Sce: Number(pratService),
        Repere: pratRepere,
        Pseudo: pratPseudo.trim() || undefined,
        Genre_Prat: pratGenre,
        Nom_Prat: pratNom || 'Dupont',
        Prenom_Prat: pratPrenom || 'Pierre',
        Nom_Arb: pratNomArb.trim() || undefined,
        Date_Nais_Prat: pratDob,
        Date_Recrut_Prat: pratRecruit,
        Type_Cont_Prat: pratContrat,
        Dat_Debu_Trv: pratDatDebuTrv || undefined
      });
      setPratNom('');
      setPratPrenom('');
      setPratNomArb('');
      setPratDatDebuTrv('');
    }
    else if (activeTable === 'actes') {
      const nextId = fresh.actes.length > 0 ? Math.max(...fresh.actes.map(a => a.ID_Acte)) + 1 : 1;
      fresh.actes.push({
        ID_Acte: nextId,
        Libelle_Acte: acteLibelle || 'Nouveau Soin',
        Prix_Acte: Number(actePrix) || 150
      });
      setActeLibelle('');
    }
    else if (activeTable === 'packs') {
      if (!packIdActe) {
        alert("⚠️ Le champ 'ID_Acte rattaché' est obligatoire pour créer un pack d'abonnements.");
        return;
      }
      const nextId = fresh.packs.length > 0 ? Math.max(...fresh.packs.map(p => p.ID_Pack)) + 1 : 1;
      fresh.packs.push({
        ID_Pack: nextId,
        Libelle_Pack: packLibelle || 'Nouveau Forfait',
        Nbre_Seance_Pack: Number(packQty) || 10,
        Prix_Pack: packPrix !== undefined && packPrix > 0 ? packPrix : undefined,
        Prix_Seanc_Pack: packPrixSeance !== undefined && packPrixSeance > 0 ? packPrixSeance : undefined,
        Cat_Pack: packCat,
        id_acte: packIdActe || undefined
      });
      setPackLibelle('');
      setPackQty(10);
      setPackPrix(0);
      setPackPrixSeance(0);
      setPackCat('R');
      setPackIdActe('');
    }
    else if (activeTable === 'abonnements') {
      const nextId = fresh.abonnements.length > 0 ? Math.max(...fresh.abonnements.map(a => a.ID_Abn)) + 1 : 1;
      fresh.abonnements.push({
        ID_Abn: nextId,
        ID_Patient: Number(abnPatientId),
        ID_Pack: Number(abnPackId),
        Date_Debut_Abn: abnStart,
        Date_Fin_Abn: abnEnd,
        Nbre_Sean_Consom_Abn: Number(abnConsom) || 0,
        ID_Acte_Add1: abnAdd1 === 'none' ? null : Number(abnAdd1),
        ID_Acte_Add2: abnAdd2 === 'none' ? null : Number(abnAdd2),
        Date_Abn: abnDateAbn || abnStart,
      });
    }
    else if (activeTable === 'typesPlanning') {
      const nextId = fresh.typesPlanning.length > 0 ? Math.max(...fresh.typesPlanning.map(t => t.ID_Type_Plan)) + 1 : 1;
      fresh.typesPlanning.push({
        ID_Type_Plan: nextId,
        Libelle_Type: planTypeLibelle || 'Nouveau Type',
        Max_Patients_Simultanes: Number(planTypeMax) || 1
      });
      setPlanTypeLibelle('');
    }
    else if (activeTable === 'zones') {
      const nextId = fresh.zones.length > 0 ? Math.max(...fresh.zones.map(z => z.ID_Zone)) + 1 : 1;
      fresh.zones.push({
        ID_Zone: nextId,
        Nom_Zone: zoneName || 'Nouvelle Zone'
      });
      setZoneName('');
    }
    else if (activeTable === 'reglesBalneo') {
      const nextId = fresh.reglesBalneo.length > 0 ? Math.max(...fresh.reglesBalneo.map(r => r.ID_Regle)) + 1 : 1;
      fresh.reglesBalneo.push({
        ID_Regle: nextId,
        Jour_Semaine: Number(balneoDay),
        Demi_Journee: balneoPeriod,
        Genre_Autorise: balneoGenre
      });
    }

    updateDB(fresh);
  };

  const handleMultiImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMultiImportFileName(file.name);
    setMultiImportLoading(true);
    setMultiImportError(null);
    setMultiImportSuccessMsg(null);
    setDiffReport(null);
    setFinalImportReport(null);
    setIsVerified(false);
    setDetectedSheets([]);
    setImportProgress({});

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        setExcelFileBuffer(buffer);

        // Lire le classeur pour détecter les onglets et estimer les lignes
        const workbook = XLSX.read(buffer, { type: 'array' });
        const localHeaders: Record<string, string[]> = {};
        const localSheetToTable: Record<string, string> = {};
        const localColumnMappings: Record<string, Record<string, string>> = {};

        const sheetsInfo = workbook.SheetNames.map(name => {
          const sheet = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
          const rowsCount = Math.max(0, range.e.r); // Exclure l'en-tête (ligne 1) si possible, sinon compter brut

          // Extraction des en-têtes
          const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
          const headers = rows && rows.length > 0 && Array.isArray(rows[0])
            ? rows[0].map((h: any) => String(h || '').trim()).filter(Boolean)
            : [];
          localHeaders[name] = headers;

          // Correspondance de la table cible
          let targetTable = 'Inconnu';
          let status: 'OK' | 'Inconnu' = 'Inconnu';

          const n = name.trim().toLowerCase();
          if (n.includes('pack') || n.includes('forfait') || n.includes('الحزمة')) {
            targetTable = 'packs';
            status = 'OK';
          } else if (n.includes('praticien') || n.includes('personnel') || n.includes('طبيب') || n.includes('ممارس')) {
            targetTable = 'praticiens';
            status = 'OK';
          } else if (n.includes('acte') || n.includes('médic') || n.includes('سند') || n.includes('إجراء')) {
            targetTable = 'actes';
            status = 'OK';
          } else if (n.includes('séance') || n.includes('seance') || n.includes('حصص') || n.includes('حصة')) {
            targetTable = 'seances';
            status = 'OK';
          } else if (n.includes('versement') || n.includes('paiement') || n.includes('دفعة') || n.includes('تسديد')) {
            targetTable = 'versements';
            status = 'OK';
          } else if (n.includes('caisse') || n.includes('transaction') || n.includes('صندوق') || n.includes('خzينة')) {
            targetTable = 'caisses';
            status = 'OK';
          } else if (n.includes('patient') || n.includes('المعالجين') || n.includes('fiches m&eacute;dicales')) {
            targetTable = 'patients';
            status = 'OK';
          } else if (n.includes('abonnement') || n.includes('contrat') || n.includes('اشتراك')) {
            targetTable = 'abonnements';
            status = 'OK';
          }

          if (targetTable !== 'Inconnu') {
            localSheetToTable[name] = targetTable;
          }

          return {
            sheetName: name,
            rowsCount,
            targetTable,
            status: targetTable !== 'Inconnu' ? 'OK' as const : 'Inconnu' as const
          };
        });

        // Initialiser les mappings de colonnes par table détectée
        Object.entries(localSheetToTable).forEach(([sheetName, tableKey]) => {
          const headers = localHeaders[sheetName] || [];
          const schema = TABLES_SCHEMA_CONFIG[tableKey];
          if (schema) {
            const tableMap: Record<string, string> = {};
            schema.fields.forEach(f => {
              const matched = findMatchingHeader(headers, f.key);
              if (matched) {
                tableMap[f.key] = matched;
              }
            });
            localColumnMappings[tableKey] = tableMap;
          }
        });

        setHeadersBySheet(localHeaders);
        setSheetToTableMap(localSheetToTable);
        setColumnMappings(localColumnMappings);
        setDetectedSheets(sheetsInfo);
        setMultiImportSuccessMsg(`📄 Fichier Excel chargé avec succès. ${workbook.SheetNames.length} onglet(s) détecté(s). Veuillez lancer la vérification des différences.`);
      } catch (err: any) {
        setMultiImportError(`Erreur lors de la lecture du fichier : ${err.message || err}`);
      } finally {
        setMultiImportLoading(false);
      }
    };
    reader.onerror = () => {
      setMultiImportError("Impossible de lire le fichier.");
      setMultiImportLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleVerifyDifferences = () => {
    if (!excelFileBuffer) {
      setMultiImportError("Veuillez d'abord sélectionner un fichier Excel.");
      return;
    }

    // Validation du mapping manuel
    if (isManualMappingEnabled) {
      const mappedTables = Object.values(sheetToTableMap) as string[];
      if (mappedTables.length === 0) {
        setMultiImportError("Veuillez associer au moins un onglet Excel à une table clinique de destination.");
        return;
      }
      for (const tableKey of mappedTables) {
        const schema = TABLES_SCHEMA_CONFIG[tableKey];
        if (!schema) continue;
        const currentTableMapping = columnMappings[tableKey] || {};
        for (const field of schema.fields) {
          if (field.required && !currentTableMapping[field.key]) {
            setMultiImportError(`Le champ requis "${field.label}" pour la table "${schema.label}" n'est pas associé à une colonne Excel.`);
            return;
          }
        }
      }
    }

    setMultiImportLoading(true);
    setMultiImportError(null);
    setMultiImportSuccessMsg(null);

    // Un petit timeout pour laisser l'UI respirer
    setTimeout(() => {
      try {
        const report = analyzeExcelDifferences(
          excelFileBuffer,
          dbState,
          isManualMappingEnabled ? sheetToTableMap : undefined,
          isManualMappingEnabled ? columnMappings : undefined
        );
        setDiffReport(report);
        setIsVerified(true);
        setMultiImportSuccessMsg("✓ Analyse des différences terminée ! Veuillez examiner le rapport ci-dessous avant d'appliquer l'importation.");
      } catch (err: any) {
        setMultiImportError(`Erreur d'analyse : ${err.message || err}`);
      } finally {
        setMultiImportLoading(false);
      }
    }, 100);
  };

  const handleExecuteImport = async () => {
    if (!excelFileBuffer) {
      setMultiImportError("Aucun fichier n'est chargé.");
      return;
    }

    // Validation du mapping manuel
    if (isManualMappingEnabled) {
      const mappedTables = Object.values(sheetToTableMap) as string[];
      if (mappedTables.length === 0) {
        setMultiImportError("Veuillez associer au moins un onglet Excel à une table clinique de destination.");
        return;
      }
      for (const tableKey of mappedTables) {
        const schema = TABLES_SCHEMA_CONFIG[tableKey];
        if (!schema) continue;
        const currentTableMapping = columnMappings[tableKey] || {};
        for (const field of schema.fields) {
          if (field.required && !currentTableMapping[field.key]) {
            setMultiImportError(`Le champ requis "${field.label}" pour la table "${schema.label}" n'est pas associé à une colonne Excel.`);
            return;
          }
        }
      }
    }

    setMultiImportLoading(true);
    setMultiImportError(null);
    setMultiImportSuccessMsg(null);

    const steps = [
      { key: 'packs', label: 'Packs & Forfaits' },
      { key: 'praticiens', label: 'Praticiens (Personnel)' },
      { key: 'actes', label: 'Actes Médicaux' },
      { key: 'seances', label: 'Séances Réalisées' },
      { key: 'versements', label: 'Versements (Paiements)' },
      { key: 'caisses', label: 'Transactions Caisses' }
    ];

    try {
      // Simulation asynchrone d'une barre de progression par étape pour le confort visuel de l'utilisateur
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setImportProgress(prev => ({ ...prev, [step.key]: 10 })); // début
        await new Promise(resolve => setTimeout(resolve, 100));
        setImportProgress(prev => ({ ...prev, [step.key]: 60 })); // en cours
        await new Promise(resolve => setTimeout(resolve, 80));
        setImportProgress(prev => ({ ...prev, [step.key]: 100 })); // fini
      }

      const result = executeExcelImport(
        excelFileBuffer,
        dbState,
        isManualMappingEnabled ? sheetToTableMap : undefined,
        isManualMappingEnabled ? columnMappings : undefined
      );
      updateDB(result.newState);
      setFinalImportReport(result.report);
      
      const importedCount = Object.values(result.report).reduce((acc, curr) => acc + (curr as any).imported, 0);
      const updatedCount = Object.values(result.report).reduce((acc, curr) => acc + (curr as any).updated, 0);
      const ignoredCount = Object.values(result.report).reduce((acc, curr) => acc + (curr as any).ignored, 0);

      setMultiImportSuccessMsg(`🎉 Importation terminée avec succès ! ${importedCount} nouvelles fiches insérées, ${updatedCount} mises à jour effectuées, et ${ignoredCount} lignes ignorées.`);
      setIsVerified(false); // Réinitialiser après exécution réussie
    } catch (err: any) {
      setMultiImportError(`Erreur lors de l'importation réelle : ${err.message || err}`);
    } finally {
      setMultiImportLoading(false);
    }
  };

  const downloadJsonReport = () => {
    if (!finalImportReport) return;
    try {
      const dataStr = JSON.stringify(finalImportReport, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `rapport_import_${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert("Erreur lors de la génération du fichier JSON.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="database-section">
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="font-bold text-lg text-slate-900">Console d'Administration &amp; Correction</h2>
            <p className="text-slate-550 text-xs">Anti-bug, modifications à chaud, sauvegardes et vidanges sécurisées.</p>
          </div>
        </div>

        {activeDbSubTab === 'correction' && (
          <button
            id="btn-add-db-entry"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-705 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-150 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </button>
        )}
      </div>

      {/* Onglets de navigation élégants */}
      <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/40 p-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveDbSubTab('correction')}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
            activeDbSubTab === 'correction'
              ? 'bg-indigo-600 text-white border-transparent shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🔧 Correction des Tables Cliniques
        </button>
        <button
          type="button"
          onClick={() => setActiveDbSubTab('clear')}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
            activeDbSubTab === 'clear'
              ? 'bg-indigo-600 text-white border-transparent shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🗑️ Nettoyage &amp; Purge des Tables
        </button>
        <button
          type="button"
          onClick={() => setActiveDbSubTab('pauses')}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
            activeDbSubTab === 'pauses'
              ? 'bg-indigo-600 text-white border-transparent shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🕒 Réajustement des Pauses
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveDbSubTab('multi_import');
            setDiffReport(null);
            setFinalImportReport(null);
            setMultiImportError(null);
            setMultiImportSuccessMsg(null);
          }}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
            activeDbSubTab === 'multi_import'
              ? 'bg-indigo-600 text-white border-transparent shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          📥 Importation Multi-Tables (.xlsx)
        </button>
        <button
          type="button"
          onClick={() => setActiveDbSubTab('themes')}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 border cursor-pointer ${
            activeDbSubTab === 'themes'
              ? 'bg-indigo-600 text-white border-transparent shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🎨 Thèmes de la Clinique
        </button>
      </div>

      {activeDbSubTab === 'correction' && (
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
        {/* SIDE BAR SELECTION OF TABLES */}
        <div className="bg-slate-57 border-r border-slate-200 p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2 px-2">Table Selection</span>
          {[
            { id: 'praticiens', name: 'Praticiens (DOB/Specs)', count: dbState.praticiens.length },
            { id: 'actes', name: 'Actes & Prix', count: dbState.actes.length },
            { id: 'packs', name: 'Packs Forfaits', count: dbState.packs.length },
            { id: 'services', name: 'Services (Sce)', count: dbState.services.length },
            { id: 'utilisateurs', name: 'Utilisateurs (Session)', count: dbState.utilisateurs.length },
            { id: 'typesPlanning', name: 'Types Plannings', count: dbState.typesPlanning.length },
            { id: 'zones', name: 'Zones (Lieux)', count: dbState.zones.length },
            { id: 'reglesBalneo', name: 'Règles Balnéo', count: dbState.reglesBalneo.length }
          ].map((tbl) => (
            <button
              key={tbl.id}
              id={`tab-select-table-${tbl.id}`}
              onClick={() => {
                setActiveTable(tbl.id as TableName);
                setShowAddForm(false);
                setSelectedRowId(null);
                setEditValues({});
                setSelectedActesForBulk([]);
                setSelectedPacksForBulk([]);
                setBulkRoles([]);
                setDbPage(1);
                setDbSearchQuery('');
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                activeTable === tbl.id
                  ? 'bg-indigo-50 text-indigo-750 border border-indigo-150/30 font-bold'
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tbl.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTable === tbl.id
                  ? 'bg-indigo-200 text-indigo-805'
                  : 'bg-slate-200/50 text-slate-500'
              }`}>{tbl.count}</span>
            </button>
          ))}
        </div>

        {/* DATA CONTAINER GRID AREA */}
        <div className="md:col-span-3 p-6 space-y-6">
          {/* Form injection drawer if visible */}
          {showAddForm && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4" id="db-inline-add-row-form">
              <h3 className="font-bold text-sm text-slate-800">Ajouter une ligne dans la table: {activeTable}</h3>
              <form onSubmit={handleSubmitNewRow} className="space-y-3">
                {/* Condition blocks for fields render */}
                {activeTable === 'patients' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-pat-name" className="block text-xs font-bold text-slate-700 mb-1">Nom du Patient</label>
                      <input id="input-pat-name" type="text" className="w-full border rounded p-1.5 text-xs bg-white" placeholder="Ex: Marc Antoine" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="select-pat-genre" className="block text-xs font-bold text-slate-700 mb-1">Genre</label>
                      <select id="select-pat-genre" className="w-full border rounded p-1.5 text-xs bg-white" value={patientGenre} onChange={(e) => setPatientGenre(e.target.value as 'H' | 'F')}>
                        <option value="H">Homme (H)</option>
                        <option value="F">Femme (F)</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTable === 'services' && (
                  <div>
                    <label htmlFor="input-service-libelle" className="block text-xs font-bold text-slate-700 mb-1">Libellé du Service</label>
                    <input id="input-service-libelle" type="text" className="w-full border rounded p-1.5 text-xs bg-white" placeholder="Ex: Pédiatrie clinique" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
                  </div>
                )}

                {activeTable === 'utilisateurs' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-user-name" className="block text-xs font-bold text-slate-700 mb-1">Nom Complet</label>
                      <input id="input-user-name" type="text" className="w-full border rounded p-1.5 text-xs bg-white" value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="select-user-sce" className="block text-xs font-bold text-slate-700 mb-1">Service</label>
                      <select id="select-user-sce" className="w-full border rounded p-1.5 text-xs bg-white" value={userService} onChange={(e) => setUserService(Number(e.target.value))}>
                        {dbState.services.map(s => <option key={s.ID_Sce} value={s.ID_Sce}>{s.Libelle_Sce}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-user-role" className="block text-xs font-bold text-slate-700 mb-1">Rôle</label>
                      <select id="select-user-role" className="w-full border rounded p-1.5 text-xs bg-white" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                        <option value="Receptionniste RDC">Réceptionniste RDC</option>
                        <option value="Receptionniste Balnéothérapie">Réceptionniste Balnéothérapie</option>
                        <option value="Receptionniste Réeducation">Réceptionniste Rééducation</option>
                        <option value="Receptionniste Intensif 2e">Réceptionniste Intensif 2e</option>
                        <option value="Receptionniste Intensif 3e">Réceptionniste Intensif 3e</option>
                        <option value="Receptionniste Intensif 4e">Réceptionniste Intensif 4e</option>
                        <option value="Admin">Admin</option>
                        <option value="Médecin MPR">Médecin MPR</option>
                        <option value="Assistante">Assistante</option>
                        <option value="Marketing">Marketing</option>
                        <option value="SupperRec">Super Réceptionniste</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="input-user-login" className="block text-xs font-bold text-slate-700 mb-1">Login (Identifiant) *</label>
                      <input id="input-user-login" type="text" name="Login" required className="w-full border rounded p-1.5 text-xs bg-white font-mono" value={userLogin} onChange={(e) => setUserLogin(e.target.value)} placeholder="Ex: supperrec" />
                    </div>
                    <div>
                      <label htmlFor="input-user-password" className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
                      <input id="input-user-password" type="password" name="MotDePasse" required className="w-full border rounded p-1.5 text-xs bg-white font-mono" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                  </div>
                )}

                {activeTable === 'praticiens' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label htmlFor="input-prat-pseudo" className="block text-xs font-bold text-indigo-700 mb-1">Pseudo (Utilisé sur les grilles)</label>
                      <input id="input-prat-pseudo" type="text" className="w-full border border-indigo-200 rounded p-1.5 text-xs bg-white font-bold text-indigo-600" value={pratPseudo} onChange={(e) => setPratPseudo(e.target.value)} placeholder="Ex: Mhand.B" />
                    </div>
                    <div>
                      <label htmlFor="input-prat-prenom" className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
                      <input id="input-prat-prenom" type="text" className="w-full border rounded p-1.5 text-xs bg-white" value={pratPrenom} onChange={(e) => setPratPrenom(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="input-prat-nom" className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
                      <input id="input-prat-nom" type="text" className="w-full border rounded p-1.5 text-xs bg-white" value={pratNom} onChange={(e) => setPratNom(e.target.value)} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="input-prat-nom-arb" className="block text-xs font-bold text-indigo-905">Nom Arabe</label>
                        <button 
                          type="button" 
                          onClick={handleTranslateNewPraticien}
                          className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold transition flex items-center gap-1"
                        >
                          Traduire 🌐
                        </button>
                      </div>
                      <input id="input-prat-nom-arb" type="text" className="w-full border border-indigo-200 rounded p-1.5 text-xs bg-white font-semibold text-right text-indigo-950" value={pratNomArb} onChange={(e) => setPratNomArb(e.target.value)} placeholder="مثال: دوبوي" />
                    </div>
                    <div>
                      <label htmlFor="select-prat-rep" className="block text-xs font-bold text-slate-700 mb-1">Repère Spécialité</label>
                      <select id="select-prat-rep" className="w-full border rounded p-1.5 text-xs bg-white" value={pratRepere} onChange={(e) => setPratRepere(e.target.value as 'K' | 'P' | 'O' | 'MPR')}>
                        <option value="K">K (Aide-Kiné)</option>
                        <option value="P">P (Psychomotricien/Psychophysiologue)</option>
                        <option value="O">O (Orthophoniste)</option>
                        <option value="MPR">MPR (Médecin MPR / Spécialiste)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-prat-sce" className="block text-xs font-bold text-slate-700 mb-1">Service de rattachement</label>
                      <select id="select-prat-sce" className="w-full border rounded p-1.5 text-xs bg-white" value={pratService} onChange={(e) => setPratService(Number(e.target.value))}>
                        {dbState.services.map(s => <option key={s.ID_Sce} value={s.ID_Sce}>{s.Libelle_Sce}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="input-prat-dob" className="block text-xs font-bold text-slate-700 mb-1">Date de Naissance (Anti-bug âge)</label>
                      <input id="input-prat-dob" type="date" className="w-full border rounded p-1.5 text-xs bg-white" value={pratDob} onChange={(e) => setPratDob(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="input-prat-rec" className="block text-xs font-bold text-slate-700 mb-1">Recrutement</label>
                      <input id="input-prat-rec" type="date" className="w-full border rounded p-1.5 text-xs bg-white" value={pratRecruit} onChange={(e) => setPratRecruit(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="select-prat-cont" className="block text-xs font-bold text-slate-700 mb-1">Type Contrat</label>
                      <select id="select-prat-cont" className="w-full border rounded p-1.5 text-xs bg-white" value={pratContrat} onChange={(e) => setPratContrat(e.target.value as 'CDD' | 'CDI' | 'Néant')}>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Néant">Néant</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-prat-genre" className="block text-xs font-bold text-slate-700 mb-1">Genre / Civilité</label>
                      <select id="select-prat-genre" className="w-full border rounded p-1.5 text-xs bg-white" value={pratGenre} onChange={(e) => setPratGenre(e.target.value as 'H' | 'F')}>
                        <option value="H">Homme / Mr</option>
                        <option value="F">Femme / Mme</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="input-prat-datdebutrv" className="block text-xs font-bold text-slate-700 mb-1">Début de Travail (Dat_Debu_Trv)</label>
                      <input id="input-prat-datdebutrv" type="datetime-local" className="w-full border rounded p-1.5 text-xs bg-white font-mono" value={pratDatDebuTrv} onChange={(e) => setPratDatDebuTrv(e.target.value)} />
                    </div>
                  </div>
                )}

                {activeTable === 'actes' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-acte-lib" className="block text-xs font-bold text-slate-700 mb-1">Nom du Soin Acte</label>
                      <input id="input-acte-lib" type="text" className="w-full border rounded p-1.5 text-xs bg-white" placeholder="Ex: Rééducation Spinale" value={acteLibelle} onChange={(e) => setActeLibelle(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="input-acte-prix" className="block text-xs font-bold text-slate-700 mb-1">Prix Brut (DH)</label>
                      <input id="input-acte-prix" type="number" className="w-full border rounded p-1.5 text-xs bg-white" value={actePrix} onChange={(e) => setActePrix(Number(e.target.value))} />
                    </div>
                  </div>
                )}

                {activeTable === 'packs' && (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-left">
                    <div>
                      <label htmlFor="input-pack-lib" className="block text-xs font-bold text-slate-700 mb-1">Nom du Pack</label>
                      <input id="input-pack-lib" type="text" className="w-full border rounded p-1.5 text-xs bg-white font-bold" placeholder="Ex: Forfait Post-AVC" value={packLibelle} onChange={(e) => setPackLibelle(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="select-pack-cat" className="block text-xs font-bold text-slate-700 mb-1">Catégorie du Pack</label>
                      <select id="select-pack-cat" className="w-full border rounded p-1.5 text-xs bg-white font-bold text-indigo-750" value={packCat} onChange={(e) => setPackCat(e.target.value as any)}>
                        <option value="R">Rééducation (R)</option>
                        <option value="B">Balnéothérapie (B)</option>
                        <option value="I">Intensif (I)</option>
                        <option value="O">Orthophonie (O)</option>
                        <option value="P">Psychomotricité (P)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="input-pack-qty" className="block text-xs font-bold text-slate-700 mb-1">Séances réglementaires</label>
                      <input id="input-pack-qty" type="number" className="w-full border rounded p-1.5 text-xs bg-white font-bold font-mono" value={packQty} onChange={(e) => {
                        const qty = Number(e.target.value) || 0;
                        setPackQty(qty);
                        if (packPrix && qty) {
                          setPackPrixSeance(Math.round(packPrix / qty));
                        }
                      }} />
                    </div>
                    <div>
                      <label htmlFor="input-pack-prix" className="block text-xs font-bold text-slate-700 mb-1">Prix Global Pack (DA)</label>
                      <input id="input-pack-prix" type="number" className="w-full border rounded p-1.5 text-xs bg-white font-bold font-mono text-emerald-750" value={packPrix} onChange={(e) => {
                        const pr = Number(e.target.value) || 0;
                        setPackPrix(pr);
                        if (packQty) {
                          setPackPrixSeance(Math.round(pr / packQty));
                        }
                      }} />
                    </div>
                    <div>
                      <label htmlFor="input-pack-prix-seance" className="block text-xs font-bold text-slate-700 mb-1">Prix séance (DA)</label>
                      <input id="input-pack-prix-seance" type="number" className="w-full border rounded p-1.5 text-xs bg-white font-bold font-mono text-indigo-700" value={packPrixSeance} onChange={(e) => setPackPrixSeance(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label htmlFor="select-pack-acte" className="block text-xs font-bold text-slate-700 mb-1">ID_Acte rattaché</label>
                      <select id="select-pack-acte" className="w-full border rounded p-1.5 text-xs bg-white font-bold text-emerald-800" value={packIdActe} onChange={(e) => setPackIdActe(e.target.value)}>
                        <option value="">-- Sélectionner un Acte (Obligatoire) * --</option>
                        {dbState.actes.map(act => (
                          <option key={act.ID_Acte} value={String(act.ID_Acte)}>
                            {act.Libelle_Acte} (ID: {act.ID_Acte})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {activeTable === 'abonnements' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="select-ab-pat" className="block text-xs font-bold text-slate-700 mb-1">Patient</label>
                        <select id="select-ab-pat" className="w-full border rounded p-1.5 text-xs bg-white" value={abnPatientId} onChange={(e) => setAbnPatientId(Number(e.target.value))}>
                          {dbState.patients.map(p => <option key={p.ID_Patient} value={p.ID_Patient}>{p.Nom_Patient}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="input-ab-pack" className="block text-xs font-bold text-slate-700 mb-1">Pack Forfait Associé</label>
                        <select id="select-ab-pack" className="w-full border rounded p-1.5 text-xs bg-white" value={abnPackId} onChange={(e) => setAbnPackId(Number(e.target.value))}>
                          {dbState.packs.map(pk => <option key={pk.ID_Pack} value={pk.ID_Pack}>{pk.Libelle_Pack} ({pk.Nbre_Seance_Pack} s.)</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="input-ab-dateabn" className="block text-xs font-bold text-slate-700 mb-1">Date d'Abonnement (Création)</label>
                        <input id="input-ab-dateabn" type="date" className="w-full border rounded p-1.5 text-xs bg-white" value={abnDateAbn} onChange={(e) => setAbnDateAbn(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="input-ab-start" className="block text-xs font-bold text-slate-700 mb-1">Date Début</label>
                        <input id="input-ab-start" type="date" className="w-full border rounded p-1.5 text-xs bg-white" value={abnStart} onChange={(e) => setAbnStart(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="input-ab-end" className="block text-xs font-bold text-slate-700 mb-1">Date Fin</label>
                        <input id="input-ab-end" type="date" className="w-full border rounded p-1.5 text-xs bg-white" value={abnEnd} onChange={(e) => setAbnEnd(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="input-ab-cons" className="block text-xs font-bold text-slate-700 mb-1">Séances Consommées Initialement</label>
                        <input id="input-ab-cons" type="number" className="w-full border rounded p-1.5 text-xs bg-white" value={abnConsom} onChange={(e) => setAbnConsom(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t pt-2 mt-2">
                      <div>
                        <label htmlFor="select-ab-add1" className="block text-xs font-semibold text-emerald-800 mb-1">
                          [Anti-Bug Link] Soin Clinique Optionnel Add_1
                        </label>
                        <select id="select-ab-add1" className="w-full border rounded p-1.5 text-xs bg-emerald-50/50" value={abnAdd1} onChange={(e) => setAbnAdd1(e.target.value)}>
                          <option value="none">Aucun (Néant)</option>
                          {dbState.actes.map(a => <option key={a.ID_Acte} value={a.ID_Acte}>{a.Libelle_Acte}</option>)}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="select-ab-add2" className="block text-xs font-semibold text-emerald-800 mb-1">
                          [Anti-Bug Link] Soin Clinique Optionnel Add_2
                        </label>
                        <select id="select-ab-add2" className="w-full border rounded p-1.5 text-xs bg-emerald-50/50" value={abnAdd2} onChange={(e) => setAbnAdd2(e.target.value)}>
                          <option value="none">Aucun (Néant)</option>
                          {dbState.actes.map(a => <option key={a.ID_Acte} value={a.ID_Acte}>{a.Libelle_Acte}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTable === 'typesPlanning' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-pt-lib" className="block text-xs font-bold text-slate-700 mb-1">Identifiant du Planning</label>
                      <input id="input-pt-lib" type="text" className="w-full border rounded p-1.5 text-xs bg-white" placeholder="Ex: Multidisciplinaire" value={planTypeLibelle} onChange={(e) => setPlanTypeLibelle(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="input-pt-max" className="block text-xs font-bold text-slate-700 mb-1">Capacité simultanée max</label>
                      <input id="input-pt-max" type="number" className="w-full border rounded p-1.5 text-xs bg-white" value={planTypeMax} onChange={(e) => setPlanTypeMax(Number(e.target.value))} />
                    </div>
                  </div>
                )}

                {activeTable === 'zones' && (
                  <div>
                    <label htmlFor="input-zone-name" className="block text-xs font-bold text-slate-700 mb-1">Nom de la Zone / Lieu</label>
                    <input id="input-zone-name" type="text" className="w-full border rounded p-1.5 text-xs bg-white" placeholder="Ex: Secrétariat" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
                  </div>
                )}

                {activeTable === 'reglesBalneo' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="select-rb-day" className="block text-xs font-bold text-slate-700 mb-1">Jour de la Semaine</label>
                      <select id="select-rb-day" className="w-full border rounded p-1.5 text-xs bg-white" value={balneoDay} onChange={(e) => setBalneoDay(Number(e.target.value))}>
                        <option value={1}>Lundi</option>
                        <option value={2}>Mardi</option>
                        <option value={3}>Mercredi</option>
                        <option value={4}>Jeudi</option>
                        <option value={5}>Vendredi</option>
                        <option value={6}>Samedi</option>
                        <option value={7}>Dimanche</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-rb-period" className="block text-xs font-bold text-slate-700 mb-1">Période Jour</label>
                      <select id="select-rb-period" className="w-full border rounded p-1.5 text-xs bg-white" value={balneoPeriod} onChange={(e) => setBalneoPeriod(e.target.value as 'Matin' | 'Apres-midi')}>
                        <option value="Matin">Matin</option>
                        <option value="Apres-midi">Après-midi</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="select-rb-genre" className="block text-xs font-bold text-slate-700 mb-1">Genre Autorisé</label>
                      <select id="select-rb-genre" className="w-full border rounded p-1.5 text-xs bg-white" value={balneoGenre} onChange={(e) => setBalneoGenre(e.target.value as 'H' | 'F')}>
                        <option value="H">Homme (H)</option>
                        <option value="F">Femme (F)</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTable === 'seances' && (
                  <div className="text-xs bg-yellow-50 border border-yellow-100 p-3 rounded text-yellow-800">
                    Les séances réalisées sont crées dynamiquement lors du pointage d'un rendez-vous sur le planning (Bouton pointage "Enregistrer Séance").
                  </div>
                )}

                {activeTable !== 'seances' && (
                  <div className="flex gap-2 justify-end mt-4">
                    <button id="btn-submit-db-entry" type="submit" className="bg-emerald-600 text-white rounded font-semibold text-xs px-4 py-1.5 hover:bg-emerald-700">
                      Enregistrer la ligne
                    </button>
                    <button id="btn-cancel-db-entry" type="button" onClick={() => setShowAddForm(false)} className="bg-slate-200 text-slate-700 rounded font-semibold text-xs px-3 py-1.5 hover:bg-slate-305">
                      Supprimer la saisie
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* DYNAMIC LISTING RENDER WITH SIDE-BY-SIDE MODIFIER PANEL */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className={`${selectedRowId !== null ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-4`}>
              {selectedRowId !== null && (
                <div className="bg-amber-50 border border-amber-200/70 p-3.5 rounded-xl text-amber-900 text-xs flex justify-between items-center animate-fade-in shadow-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="animate-pulse text-amber-500 font-bold">◑</span>
                    <strong>Saisie Active :</strong> Cliquez sur Enregistrer à droite pour persister l'édition de la ligne sélectionnée.
                  </span>
                  <button 
                    onClick={() => { setSelectedRowId(null); setEditValues({}); }} 
                    className="text-[10px] font-black uppercase hover:underline text-amber-950 font-mono tracking-wider ml-2"
                  >
                    Fermer
                  </button>
                </div>
              )}
              
              {/* BARRE DE RECHERCHE UNIFIÉE POUR TOUTES LES TABLES DE LA BASE DE DONNÉES */}
              <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2 font-sans">
                <span className="text-slate-500 text-xs font-bold shrink-0 flex items-center gap-1">
                  <span>🔍</span> Rechercher dans {activeTable === 'patients' ? 'Patients' : activeTable === 'abonnements' ? 'Abonnements' : activeTable === 'seances' ? 'Séances' : activeTable} :
                </span>
                <input
                  type="text"
                  placeholder="Saisissez un mot-clé, nom, ID, date..."
                  value={dbSearchQuery}
                  onChange={(e) => {
                    setDbSearchQuery(e.target.value);
                    setDbPage(1);
                  }}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-slate-50 font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
                {dbSearchQuery && (
                  <button
                    onClick={() => {
                      setDbSearchQuery('');
                      setDbPage(1);
                    }}
                    className="text-xs text-rose-600 hover:underline font-bold shrink-0 px-2"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* ACTIONS GROUPÉES POUR LES AUTORISATIONS DES ACTES */}
              {activeTable === 'actes' && selectedActesForBulk.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200/80 p-4 rounded-xl text-slate-850 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-sm my-2">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 font-extrabold text-indigo-900 text-sm">
                      <span className="text-indigo-600">⚙️</span>
                      Actions Groupées ({selectedActesForBulk.length} acte{selectedActesForBulk.length > 1 ? 's' : ''} sélectionné{selectedActesForBulk.length > 1 ? 's' : ''})
                    </span>
                    <p className="text-[11px] text-slate-600 font-medium">Cochez les réceptionnistes autorisés pour TOUS ces actes simultanément :</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-w-xl bg-white/60 p-2 rounded-lg border border-slate-100">
                    {[
                      { role: 'Adm', label: 'Adm' },
                      { role: 'Receptionniste RDC', label: 'RDC' },
                      { role: 'Receptionniste Réeducation', label: 'Rééducation' },
                      { role: 'Receptionniste Balnéothérapie', label: 'Balnéo' },
                      { role: 'Receptionniste Intensif 2e', label: 'Intensif 2e' },
                      { role: 'Receptionniste Intensif 3e', label: 'Intensif 3e' },
                      { role: 'Receptionniste Intensif 4e', label: 'Intensif 4e' },
                      { role: 'Tous', label: 'Tous' }
                    ].map(roleItem => {
                      const isRoleChecked = bulkRoles.includes(roleItem.role);
                      return (
                        <button
                          type="button"
                          key={`bulk-role-${roleItem.role}`}
                          onClick={() => {
                            if (isRoleChecked) {
                              setBulkRoles(bulkRoles.filter(r => r !== roleItem.role));
                            } else {
                              setBulkRoles([...bulkRoles, roleItem.role]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer ${
                            isRoleChecked 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-350'
                          }`}
                        >
                          {roleItem.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const fresh = { ...dbState };
                        fresh.actes = fresh.actes.map(a => {
                          if (selectedActesForBulk.includes(a.ID_Acte)) {
                            return {
                              ...a,
                              Receptionniste_Autorises: [...bulkRoles]
                            };
                          }
                          return a;
                        });
                        updateDB(fresh);
                        setSelectedActesForBulk([]);
                        setBulkRoles([]);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg shadow-sm cursor-pointer transition active:scale-95 shrink-0"
                    >
                      Appliquer aux actes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedActesForBulk([]);
                        setBulkRoles([]);
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] px-3.5 py-2 rounded-lg border border-slate-200 cursor-pointer transition shrink-0"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              
              {/* ACTIONS GROUPÉES POUR LES PACKS (MODIFICATION DE CATÉGORIE) */}
              {activeTable === 'packs' && selectedPacksForBulk.length > 0 && (
                <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-indigo-200/80 p-4 rounded-xl text-slate-850 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-sm my-2">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 font-extrabold text-indigo-900 text-sm">
                      <span className="text-indigo-600">📦</span>
                      Actions Groupées ({selectedPacksForBulk.length} pack{selectedPacksForBulk.length > 1 ? 's' : ''} sélectionné{selectedPacksForBulk.length > 1 ? 's' : ''})
                    </span>
                    <p className="text-[11px] text-slate-600 font-medium">Modifier la catégorie pour TOUS ces packs simultanément :</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 p-2 rounded-lg border border-slate-150 max-w-sm flex-1 md:justify-end">
                    <span className="text-slate-500 font-bold text-[11.5px]">Catégorie cible :</span>
                    <select
                      value={bulkCatPack}
                      onChange={(e) => setBulkCatPack(e.target.value as any)}
                      className="border border-slate-300 bg-white rounded-lg px-2.5 py-1 text-xs font-extrabold text-indigo-805 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="R">Rééducation (R)</option>
                      <option value="B">Balnéothérapie (B)</option>
                      <option value="I">Intensif (I)</option>
                      <option value="O">Orthophonie (O)</option>
                      <option value="P">Psychomotricité (P)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const fresh = { ...dbState };
                        fresh.packs = fresh.packs.map(p => {
                          if (selectedPacksForBulk.includes(p.ID_Pack)) {
                            return {
                              ...p,
                              Cat_Pack: bulkCatPack
                            };
                          }
                          return p;
                        });
                        const targetCount = selectedPacksForBulk.length;
                        updateDB(fresh);
                        setSelectedPacksForBulk([]);
                        const listLabel: {[key: string]: string} = {
                          'R': 'Rééducation',
                          'B': 'Balnéothérapie',
                          'I': 'Intensif',
                          'O': 'Orthophonie',
                          'P': 'Psychomotricité'
                        };
                        alert(`✅ Modification Réussie !\nLa catégorie de ${targetCount} pack(s) a été changée pour "${listLabel[bulkCatPack]}".`);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg shadow-sm cursor-pointer transition active:scale-95 shrink-0"
                    >
                      Appliquer aux packs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPacksForBulk([]);
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] px-3.5 py-2 rounded-lg border border-slate-200 cursor-pointer transition shrink-0"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs" id="table-results-container">
                <table className="w-full border-collapse text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">
                    {activeTable === 'abonnements' && (
                      <tr>
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Pack forfait</th>
                        <th className="p-3">Validité dates</th>
                        <th className="p-3">Création Abn</th>
                        <th className="p-3">Consommé</th>
                        <th className="p-3">Séanc. Restantes</th>
                        <th className="p-3">Ajouts prescrits (Adds)</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'patients' && (
                      <tr>
                        <th className="py-1.5 px-3">Patient ID</th>
                        <th className="py-1.5 px-3">Nom du Patient</th>
                        <th className="py-1.5 px-3">Genre</th>
                        <th className="py-1.5 px-3">Age</th>
                        <th className="py-1.5 px-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'praticiens' && (
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Praticien</th>
                        <th className="p-3">Pseudo</th>
                        <th className="p-3">Classification</th>
                        <th className="p-3">Genre</th>
                        <th className="p-3">ID_Sce</th>
                        <th className="p-3">Service</th>
                        <th className="p-3">Âge Calculé</th>
                        <th className="p-3">Recrutement</th>
                        <th className="p-3">Contrat</th>
                        <th className="p-3">Début Travail</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'actes' && (
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedActesForBulk.length === dbState.actes.length && dbState.actes.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedActesForBulk(dbState.actes.map(a => a.ID_Acte));
                              } else {
                                setSelectedActesForBulk([]);
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                          />
                        </th>
                        <th className="p-3">ID</th>
                        <th className="p-3">Libellé Acte</th>
                        <th className="p-3">Tarif Unitaire</th>
                        <th className="p-3">Réceptionnistes Autorisés</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'packs' && (
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedPacksForBulk.length === dbState.packs.length && dbState.packs.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPacksForBulk(dbState.packs.map(p => p.ID_Pack));
                              } else {
                                setSelectedPacksForBulk([]);
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                          />
                        </th>
                        <th className="p-3">ID</th>
                        <th className="p-3">Libellé Pack</th>
                        <th className="p-3">Catégorie</th>
                        <th className="p-3">Séances Total</th>
                        <th className="p-3 text-right">Prix Pack (DA)</th>
                        <th className="p-3 text-right">Prix Séance (DA)</th>
                        <th className="p-3 text-center">ID_Acte rattaché</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'services' && (
                      <tr>
                        <th className="p-3">ID_Sce</th>
                        <th className="p-3">Libellé Service</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'utilisateurs' && (
                      <tr>
                        <th className="p-3">ID_User</th>
                        <th className="p-3">Nom Utilisateur</th>
                        <th className="p-3">Rôle</th>
                        <th className="p-3">Service d'affectation</th>
                        <th className="p-3">Login</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'typesPlanning' && (
                      <tr>
                        <th className="p-3">ID_Type</th>
                        <th className="p-3">Genre Planning</th>
                        <th className="p-3">Max Patients Parallèles</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'zones' && (
                      <tr>
                        <th className="p-3">ID_Zone</th>
                        <th className="p-3">Lieu physique</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'reglesBalneo' && (
                      <tr>
                        <th className="p-3">ID_Regle</th>
                        <th className="p-3">Jour semaine</th>
                        <th className="p-3">Période</th>
                        <th className="p-3">Genre Autorisé</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    )}
                    {activeTable === 'seances' && (
                      <tr>
                        <th className="p-3">ID_Séance</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Praticien</th>
                        <th className="p-3">Acte réalisé</th>
                        <th className="p-3">Forfait Déduit</th>
                        <th className="p-3">Durée</th>
                        <th className="p-3">Tarif Facturé</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeTable === 'abonnements' && filteredAbonnementsList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((abn, index) => {
                      const pat = patientsMap.get(abn.ID_Patient);
                      const pkg = packsMap.get(abn.ID_Pack);
                      const add1 = actesMap.get(abn.ID_Acte_Add1);
                      const add2 = actesMap.get(abn.ID_Acte_Add2);
                      const remaining = getRemainingSessions(abn, dbState);
                      const isSelected = selectedRowId === abn.ID_Abn;
                      return (
                        <tr 
                          key={`db-abn-${abn.ID_Abn}-${index}`} 
                          onClick={() => handleRowClick(abn, abn.ID_Abn)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">ABN_{abn.ID_Abn}</td>
                          <td className="p-3 font-bold text-slate-900">{pat?.Nom_Patient}</td>
                          <td className="p-3">{pkg?.Libelle_Pack}</td>
                          <td className="p-3 text-slate-400 text-[11px]">{abn.Date_Debut_Abn} au {abn.Date_Fin_Abn}</td>
                           <td className="p-3 font-mono text-[11px] text-slate-500">{abn.Date_Abn || '—'}</td>
                          <td className="p-3">{abn.Nbre_Sean_Consom_Abn} s.</td>
                          <td className={`p-3 font-bold ${remaining <= 1 ? 'text-amber-600' : 'text-indigo-650'}`}>
                            {remaining} s. rest.
                          </td>
                          <td className="p-3 font-semibold">
                            <div className="flex flex-col gap-1 text-[10px]">
                              {add1 && <span className="bg-indigo-50 text-indigo-800 border-indigo-100 border rounded px-1">{add1.Libelle_Acte}</span>}
                              {add2 && <span className="bg-indigo-50 text-indigo-800 border-indigo-100 border rounded px-1">{add2.Libelle_Acte}</span>}
                              {!add1 && !add2 && <span className="text-slate-400">Aucun</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-abn-${abn.ID_Abn}`} onClick={() => handleDeleteRow('abonnements', abn.ID_Abn)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'patients' && filteredPatientsList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((p, index) => {
                      const isSelected = selectedRowId === p.ID_Patient;
                      const getPatientAge = (pat: Patient): number => {
                        if (pat.type_patient === 'Enfant' || pat.type_patient === 'Enfant IMC') {
                          return 6 + (pat.ID_Patient % 10);
                        }
                        return 24 + ((pat.ID_Patient * 7) % 45);
                      };
                      return (
                        <tr 
                          key={`db-pat-${p.ID_Patient}-${index}`} 
                          onClick={() => handleRowClick(p, p.ID_Patient)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-1.5 px-3 font-semibold text-slate-800 font-mono">PAT_{p.ID_Patient}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{p.Nom_Patient}</td>
                          <td className="py-1.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              p.Genre_Patient === 'Homme' ? 'bg-blue-50 text-blue-700 border border-blue-150' : 
                              p.Genre_Patient === 'Femme' ? 'bg-pink-50 text-pink-700 border border-pink-150' : 
                              'bg-amber-50 text-amber-700 border border-amber-150'
                            }`}>
                              {p.Genre_Patient}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 font-medium text-slate-700">
                            {getPatientAge(p)} ans
                          </td>
                          <td className="py-1.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-pat-${p.ID_Patient}`} onClick={() => handleDeleteRow('patients', p.ID_Patient)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'praticiens' && filteredPraticiensList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((p, index) => {
                      const service = servicesMap.get(p.ID_Sce);
                      const speciality = p.Repere === 'K' ? 'Aide-Kiné' : p.Repere === 'P' ? 'Psychomot./Psy/Ergo' : p.Repere === 'O' ? 'Orthophoniste' : 'Médecin MPR';
                      const isSelected = selectedRowId === p.ID_Prat;
                      return (
                        <tr 
                          key={`db-prat-${p.ID_Prat}-${index}`} 
                          onClick={() => handleRowClick(p, p.ID_Prat)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">PRAT_{p.ID_Prat}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center justify-between">
                              <span>{p.Prenom_Prat} {p.Nom_Prat}</span>
                              {p.Nom_Arb && (
                                <span className="text-indigo-700 bg-indigo-50 border border-indigo-150 rounded px-1.5 py-0.5 text-xs font-serif font-semibold ml-2">
                                  {p.Nom_Arb}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{p.Pseudo || '—'}</td>
                          <td className="p-3">({p.Repere}) {speciality}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.Genre_Prat === 'H' ? 'bg-blue-50 text-blue-700 border border-blue-150' : 
                              p.Genre_Prat === 'F' ? 'bg-pink-50 text-pink-700 border border-pink-150' : 
                              'bg-slate-50 text-slate-700 border border-slate-150'
                            }`}>
                              {p.Genre_Prat === 'H' ? 'Homme' : p.Genre_Prat === 'F' ? 'Femme' : p.Genre_Prat || 'Néant'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-600 text-[11px]">{p.ID_Sce}</td>
                          <td className="p-3 font-bold text-teal-800">{service?.Libelle_Sce}</td>
                          <td className="p-3 text-slate-700">{calculateAge(p.Date_Nais_Prat)} ans (Né le {p.Date_Nais_Prat})</td>
                          <td className="p-3 text-slate-400">{p.Date_Recrut_Prat}</td>
                          <td className="p-3 font-semibold">{p.Type_Cont_Prat}</td>
                          <td className="p-3 font-mono text-[11px] text-indigo-900 font-semibold">{p.Dat_Debu_Trv ? p.Dat_Debu_Trv.replace('T', ' ') : 'Néant'}</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-prat-${p.ID_Prat}`} onClick={() => handleDeleteRow('praticiens', p.ID_Prat)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'actes' && filteredActesList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((a, index) => {
                      const isSelected = selectedRowId === a.ID_Acte;
                      const isCheckSelected = selectedActesForBulk.includes(a.ID_Acte);
                      const roles = a.Receptionniste_Autorises || [];
                      return (
                        <tr 
                          key={`db-acte-${a.ID_Acte}-${index}`} 
                          onClick={() => handleRowClick(a, a.ID_Acte)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isCheckSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedActesForBulk([...selectedActesForBulk, a.ID_Acte]);
                                } else {
                                  setSelectedActesForBulk(selectedActesForBulk.filter(id => id !== a.ID_Acte));
                                }
                              }}
                              className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                            />
                          </td>
                          <td className="p-3 font-semibold text-slate-800">ACTE_{a.ID_Acte}</td>
                          <td className="p-3 font-bold text-slate-900">{a.Libelle_Acte}</td>
                          <td className="p-3 font-black text-indigo-700 font-mono">{a.Prix_Acte} DH</td>
                          <td className="p-3">
                            {roles.length === 0 ? (
                              <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold py-0.5 px-1.5 rounded">Tous</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {roles.map(r => {
                                  let short = r;
                                  let badgeClass = 'bg-slate-100 text-slate-700';
                                  const rLower = r.toLowerCase().trim();
                                  if (rLower === 'adm' || rLower === 'admin') {
                                    short = 'Adm';
                                    badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
                                  } else if (rLower === 'tous') {
                                    short = 'Tous';
                                    badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
                                  } else if (r === 'Receptionniste RDC') {
                                    short = 'RDC';
                                    badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-150';
                                  } else if (r === 'Receptionniste Réeducation') {
                                    short = 'Rééduc';
                                    badgeClass = 'bg-blue-50 text-blue-700 border border-blue-150';
                                  } else if (r === 'Receptionniste Balnéothérapie') {
                                    short = 'Balnéo';
                                    badgeClass = 'bg-cyan-50 text-cyan-700 border border-cyan-150';
                                  } else if (r.startsWith('Receptionniste Intensif')) {
                                    short = r.replace('Receptionniste ', '');
                                    badgeClass = 'bg-purple-50 text-purple-700 border border-purple-150';
                                  }
                                  return (
                                    <span key={r} className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded ${badgeClass}`}>
                                      {short}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-acte-${a.ID_Acte}`} onClick={() => handleDeleteRow('actes', a.ID_Acte)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'packs' && filteredPacksList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((pk, index) => {
                      const isSelected = selectedRowId === pk.ID_Pack;
                      const isCheckSelected = selectedPacksForBulk.includes(pk.ID_Pack);
                      const catLabels: {[key: string]: string} = {
                        'R': 'Rééducation',
                        'B': 'Balnéothérapie',
                        'I': 'Intensif',
                        'O': 'Orthophonie',
                        'P': 'Psychomotricité'
                      };
                      const catColors: {[key: string]: string} = {
                        'R': 'bg-blue-50 text-blue-700 border-blue-150',
                        'B': 'bg-cyan-50 text-cyan-700 border-cyan-150',
                        'I': 'bg-purple-50 text-purple-700 border-purple-150',
                        'O': 'bg-amber-50 text-amber-700 border-amber-150',
                        'P': 'bg-pink-50 text-pink-700 border-pink-150',
                      };
                      return (
                        <tr 
                          key={`db-pack-${pk.ID_Pack}-${index}`} 
                          onClick={() => handleRowClick(pk, pk.ID_Pack)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isCheckSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPacksForBulk([...selectedPacksForBulk, pk.ID_Pack]);
                                } else {
                                  setSelectedPacksForBulk(selectedPacksForBulk.filter(id => id !== pk.ID_Pack));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                            />
                          </td>
                          <td className="p-3 font-semibold text-slate-800 font-mono">PACK_{pk.ID_Pack}</td>
                          <td className="p-3 font-bold text-slate-900">{pk.Libelle_Pack}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catColors[pk.Cat_Pack || 'R']}`}>
                              {catLabels[pk.Cat_Pack || 'R']}
                            </span>
                          </td>
                          <td className="p-3 font-bold">{pk.Nbre_Seance_Pack} séances</td>
                          <td className="p-3 font-black text-rose-600 text-right font-mono">{pk.Prix_Pack !== undefined ? `${pk.Prix_Pack} DA` : 'Néant'}</td>
                          <td className="p-3 font-black text-indigo-700 text-right font-mono">{pk.Prix_Seanc_Pack !== undefined ? `${pk.Prix_Seanc_Pack} DA` : 'Néant'}</td>
                          <td className="p-3 text-center">
                            {pk.id_acte ? (
                              <span className="bg-emerald-50 text-emerald-850 font-extrabold border border-emerald-150 rounded px-1.5 py-0.5 text-[10px]">
                                {dbState.actes.find(a => Number(a.ID_Acte) === Number(pk.id_acte))?.Libelle_Acte || `ID: ${pk.id_acte}`}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[10px]">Aucun</span>
                            )}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-pack-${pk.ID_Pack}`} onClick={() => handleDeleteRow('packs', pk.ID_Pack)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'services' && filteredServicesList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((s, index) => {
                      const isSelected = selectedRowId === s.ID_Sce;
                      return (
                        <tr 
                          key={`db-sce-${s.ID_Sce}-${index}`} 
                          onClick={() => handleRowClick(s, s.ID_Sce)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">SCE_{s.ID_Sce}</td>
                          <td className="p-3 font-bold text-slate-900">{s.Libelle_Sce}</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-sce-${s.ID_Sce}`} onClick={() => handleDeleteRow('services', s.ID_Sce)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'utilisateurs' && filteredUtilisateursList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((u, index) => {
                      const service = servicesMap.get(u.ID_Sce);
                      const isSelected = selectedRowId === u.ID_Utilisateur;
                      return (
                        <tr 
                          key={`db-user-${u.ID_Utilisateur}-${index}`} 
                          onClick={() => handleRowClick(u, u.ID_Utilisateur)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">USER_{u.ID_Utilisateur}</td>
                          <td className="p-3 font-bold text-slate-900">{u.Nom_Utilisateur}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.Role === 'Admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{u.Role}</span>
                          </td>
                          <td className="p-3">{service?.Libelle_Sce || 'Global Admin'}</td>
                          <td className="p-3 text-slate-500 font-mono">{u.Login}</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-user-${u.ID_Utilisateur}`} onClick={() => handleDeleteRow('utilisateurs', u.ID_Utilisateur)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-55 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'typesPlanning' && filteredTypesPlanningList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((t, index) => {
                      const isSelected = selectedRowId === t.ID_Type_Plan;
                      return (
                        <tr 
                          key={`db-tplan-${t.ID_Type_Plan}-${index}`} 
                          onClick={() => handleRowClick(t, t.ID_Type_Plan)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">PLAN_{t.ID_Type_Plan}</td>
                          <td className="p-3 font-bold text-slate-900">{t.Libelle_Type}</td>
                          <td className="p-3">{t.Max_Patients_Simultanes} patients max</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-pt-${t.ID_Type_Plan}`} onClick={() => handleDeleteRow('typesPlanning', t.ID_Type_Plan)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-55 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'zones' && filteredZonesList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((z, index) => {
                      const isSelected = selectedRowId === z.ID_Zone;
                      return (
                        <tr 
                          key={`db-zone-${z.ID_Zone}-${index}`} 
                          onClick={() => handleRowClick(z, z.ID_Zone)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">ZONE_{z.ID_Zone}</td>
                          <td className="p-3 font-bold text-slate-900">{z.Nom_Zone}</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-zone-${z.ID_Zone}`} onClick={() => handleDeleteRow('zones', z.ID_Zone)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-55 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'reglesBalneo' && filteredReglesBalneoList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((r, index) => {
                      const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                      const isSelected = selectedRowId === r.ID_Regle;
                      return (
                        <tr 
                          key={`db-rbal-${r.ID_Regle}-${index}`} 
                          onClick={() => handleRowClick(r, r.ID_Regle)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">RULE_{r.ID_Regle}</td>
                          <td className="p-3 font-bold text-slate-900">{dayNames[r.Jour_Semaine - 1]}</td>
                          <td className="p-3">{r.Demi_Journee}</td>
                          <td className="p-3"><span className="bg-indigo-55 text-indigo-800 font-bold px-2.5 py-0.5 rounded border border-indigo-100">{r.Genre_Autorise} strict</span></td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button id={`btn-delete-rule-${r.ID_Regle}`} onClick={() => handleDeleteRow('reglesBalneo', r.ID_Regle)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-55 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeTable === 'seances' && filteredSeancesList.slice((dbPage - 1) * itemsPerPage, dbPage * itemsPerPage).map((s, index) => {
                      const pat = patientsMap.get(s.ID_Patient);
                      const prat = praticiensMap.get(s.ID_Prat);
                      const act = actesMap.get(s.ID_Acte);
                      const isSelected = selectedRowId === s.ID_Seanc;
                      return (
                        <tr 
                          key={`db-seanc-${s.ID_Seanc}-${index}`} 
                          onClick={() => handleRowClick(s, s.ID_Seanc)}
                          className={`cursor-pointer transition border-b border-slate-100/70 ${
                            isSelected 
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-slate-900 font-semibold border-l-4 border-indigo-600' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">SEANC_{s.ID_Seanc}</td>
                          <td className="p-3 font-bold text-slate-900">{pat?.Nom_Patient}</td>
                          <td className="p-3">Dr. {prat?.Nom_Prat}</td>
                          <td className="p-3">{act?.Libelle_Acte}</td>
                          <td className="p-3 font-bold text-indigo-750">{s.ID_Abn ? `Forfait ABN_${s.ID_Abn}` : 'Hors Forfait'}</td>
                          <td className="p-3 text-slate-400 text-[11px]">{s.Date_Seanc_Realisee} - {s.H_Debut_Seanc} à {s.H_Fin_Seanc}</td>
                          <td className="p-3 font-black text-slate-900 font-mono">{s.Prix_Seanc} DH</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {activeFilteredList.length > itemsPerPage && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl mt-2 text-xs font-sans">
                  <span className="text-slate-650 font-medium">
                    Affichage de <strong>{Math.min(activeFilteredList.length, (dbPage - 1) * itemsPerPage + 1)}</strong> à{' '}
                    <strong>{Math.min(activeFilteredList.length, dbPage * itemsPerPage)}</strong> sur{' '}
                    <strong>{activeFilteredList.length}</strong> éléments ({Math.ceil(activeFilteredList.length / itemsPerPage)} pages)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={dbPage === 1}
                      onClick={() => {
                        setDbPage(prev => Math.max(1, prev - 1));
                        const container = document.getElementById('table-results-container');
                        if (container) container.scrollTop = 0;
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Précédent
                    </button>
                    <span className="px-2.5 py-1.5 font-extrabold text-indigo-750 bg-indigo-50 border border-indigo-150 rounded-lg">
                      Page {dbPage} / {Math.ceil(activeFilteredList.length / itemsPerPage)}
                    </span>
                    <button
                      type="button"
                      disabled={dbPage >= Math.ceil(activeFilteredList.length / itemsPerPage)}
                      onClick={() => {
                        setDbPage(prev => Math.min(Math.ceil(activeFilteredList.length / itemsPerPage), prev + 1));
                        const container = document.getElementById('table-results-container');
                        if (container) container.scrollTop = 0;
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FLOATING ACTIONABLE EDIT PANEL ON THE RIGHT */}
            {selectedRowId !== null && (
              <div className="xl:col-span-4 bg-slate-50/90 border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 font-sans animate-fade-in self-start sticky top-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Formulaire de modification
                    </span>
                    <h3 className="font-extrabold text-[#112a32] text-sm mt-1">
                      Modifier l'enregistrement
                    </h3>
                  </div>
                  <button 
                    onClick={() => { setSelectedRowId(null); setEditValues({}); }}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-200/50 hover:bg-slate-200 rounded-full w-6 h-6 flex items-center justify-center transition"
                    title="Fermer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  {activeTable === 'abonnements' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Réf Abonnement</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`ABN_${editValues.ID_Abn || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Patient bénéficiaire</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" 
                          value={editValues.ID_Patient || ''} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Patient: Number(e.target.value) })}
                        >
                          {dbState.patients.map(p => <option key={p.ID_Patient} value={p.ID_Patient}>{p.Nom_Patient}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pack Forfait</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" 
                          value={editValues.ID_Pack || ''} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Pack: Number(e.target.value) })}
                        >
                          {dbState.packs.map(pk => <option key={pk.ID_Pack} value={pk.ID_Pack}>{pk.Libelle_Pack}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Date d'Abonnement (Création)</label>
                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Date_Abn || ''} onChange={(e) => setEditValues({ ...editValues, Date_Abn: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date Début</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Date_Debut_Abn || ''} onChange={(e) => setEditValues({ ...editValues, Date_Debut_Abn: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date Fin</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Date_Fin_Abn || ''} onChange={(e) => setEditValues({ ...editValues, Date_Fin_Abn: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Séances Consommées</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono font-black" value={editValues.Nbre_Sean_Consom_Abn !== undefined ? editValues.Nbre_Sean_Consom_Abn : 0} onChange={(e) => setEditValues({ ...editValues, Nbre_Sean_Consom_Abn: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-emerald-800 mb-1">Acte Additionnel 1 (Optionnel)</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-emerald-50/20 text-emerald-950 font-bold" 
                          value={editValues.ID_Acte_Add1 === null ? 'none' : editValues.ID_Acte_Add1} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Acte_Add1: e.target.value === 'none' ? null : Number(e.target.value) })}
                        >
                          <option value="none">Aucun (Néant)</option>
                          {dbState.actes.map(a => <option key={a.ID_Acte} value={a.ID_Acte}>{a.Libelle_Acte}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-emerald-800 mb-1">Acte Additionnel 2 (Optionnel)</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-emerald-50/20 text-emerald-950 font-bold" 
                          value={editValues.ID_Acte_Add2 === null ? 'none' : editValues.ID_Acte_Add2} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Acte_Add2: e.target.value === 'none' ? null : Number(e.target.value) })}
                        >
                          <option value="none">Aucun (Néant)</option>
                          {dbState.actes.map(a => <option key={a.ID_Acte} value={a.ID_Acte}>{a.Libelle_Acte}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTable === 'patients' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Réf Patient</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`PAT_${editValues.ID_Patient || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nom Complet</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Nom_Patient || ''} onChange={(e) => setEditValues({ ...editValues, Nom_Patient: e.target.value.toUpperCase() })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Genre</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.Genre_Patient || 'Homme'} 
                          onChange={(e) => setEditValues({ ...editValues, Genre_Patient: e.target.value })}
                        >
                          <option value="Homme">Homme</option>
                          <option value="Femme">Femme</option>
                          <option value="Enfant">Enfant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Catégorie Patient</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.type_patient || 'Adulte'} 
                          onChange={(e) => setEditValues({ ...editValues, type_patient: e.target.value })}
                        >
                          <option value="Adulte">Adulte</option>
                          <option value="Enfant">Enfant</option>
                          <option value="Enfant IMC">Enfant IMC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Numéro Téléphone</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono font-bold" value={editValues.phone || ''} onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Adresse Complète</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" value={editValues.address || ''} onChange={(e) => setEditValues({ ...editValues, address: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {activeTable === 'praticiens' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Réf Praticien</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`PRAT_${editValues.ID_Prat || ''}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Prénom</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Prenom_Prat || ''} onChange={(e) => setEditValues({ ...editValues, Prenom_Prat: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nom</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Nom_Prat || ''} onChange={(e) => setEditValues({ ...editValues, Nom_Prat: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pseudo (Utilisé sur les grilles)</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Pseudo || ''} onChange={(e) => setEditValues({ ...editValues, Pseudo: e.target.value })} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] uppercase font-bold text-indigo-900">Nom Arabe</label>
                          <button 
                            type="button" 
                            onClick={handleTranslatePraticien}
                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold transition flex items-center gap-1"
                          >
                            Traduire 🌐
                          </button>
                        </div>
                        <input type="text" className="w-full border border-indigo-200 rounded-lg p-2 text-xs bg-white font-semibold text-right text-indigo-950" value={editValues.Nom_Arb || ''} onChange={(e) => setEditValues({ ...editValues, Nom_Arb: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service Principal</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.ID_Sce || 1} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Sce: Number(e.target.value) })}
                        >
                          {dbState.services.map(s => <option key={s.ID_Sce} value={s.ID_Sce}>{s.Libelle_Sce}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Spécialité (Repère)</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.Repere || 'K'} 
                          onChange={(e) => setEditValues({ ...editValues, Repere: e.target.value })}
                        >
                          <option value="K">K (Kiné)</option>
                          <option value="P">P (Psychomot./Psy/Ergo)</option>
                          <option value="O">O (Orthophoniste)</option>
                          <option value="MPR">MPR (Médecin MPR / Spécialiste)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date Naissance</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" value={editValues.Date_Nais_Prat || ''} onChange={(e) => setEditValues({ ...editValues, Date_Nais_Prat: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Recrutement</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" value={editValues.Date_Recrut_Prat || ''} onChange={(e) => setEditValues({ ...editValues, Date_Recrut_Prat: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Type Contrat</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.Type_Cont_Prat || 'CDI'} 
                          onChange={(e) => setEditValues({ ...editValues, Type_Cont_Prat: e.target.value })}
                        >
                          <option value="CDI">CDI</option>
                          <option value="CDD">CDD</option>
                          <option value="Néant">Néant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Civilité / Genre</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.Genre_Prat || 'H'} 
                          onChange={(e) => setEditValues({ ...editValues, Genre_Prat: e.target.value })}
                        >
                          <option value="H">Homme / Mr</option>
                          <option value="F">Femme / Mme</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Début de Travail (Dat_Debu_Trv)</label>
                        <input 
                          type="datetime-local" 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" 
                          value={editValues.Dat_Debu_Trv || ''} 
                          onChange={(e) => setEditValues({ ...editValues, Dat_Debu_Trv: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}

                  {activeTable === 'actes' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Réf Acte</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`ACTE_${editValues.ID_Acte || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Libellé Acte</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold" value={editValues.Libelle_Acte || ''} onChange={(e) => setEditValues({ ...editValues, Libelle_Acte: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tarif Unitaire (DH)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono text-indigo-700 font-bold" value={editValues.Prix_Acte !== undefined ? editValues.Prix_Acte : 0} onChange={(e) => setEditValues({ ...editValues, Prix_Acte: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Réceptionnistes Autorisés "Receptionniste_Autorises"</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {[
                            { role: 'Adm', label: 'Adm' },
                            { role: 'Receptionniste RDC', label: 'RDC' },
                            { role: 'Receptionniste Réeducation', label: 'Rééducation' },
                            { role: 'Receptionniste Balnéothérapie', label: 'Balnéothérapie' },
                            { role: 'Receptionniste Intensif 2e', label: 'Intensif 2e' },
                            { role: 'Receptionniste Intensif 3e', label: 'Intensif 3e' },
                            { role: 'Receptionniste Intensif 4e', label: 'Intensif 4e' },
                            { role: 'Tous', label: 'Tous' }
                          ].map(roleItem => {
                            const currentList: string[] = editValues.Receptionniste_Autorises || [];
                            const isChecked = currentList.includes(roleItem.role);
                            return (
                              <button
                                type="button"
                                key={roleItem.role}
                                onClick={() => {
                                  const nextList = isChecked 
                                    ? currentList.filter(r => r !== roleItem.role)
                                    : [...currentList, roleItem.role];
                                  setEditValues({ ...editValues, Receptionniste_Autorises: nextList });
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                  isChecked 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {roleItem.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                   {activeTable === 'packs' && (
                     <div className="space-y-3 text-left">
                       <div>
                         <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Réf Pack</label>
                         <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-semibold" value={`PACK_${editValues.ID_Pack || ''}`} />
                       </div>
                       <div>
                         <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Libellé Forfait Pack</label>
                         <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold" value={editValues.Libelle_Pack || ''} onChange={(e) => setEditValues({ ...editValues, Libelle_Pack: e.target.value })} />
                       </div>
                       <div>
                         <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Catégorie du Pack (Cat_Pack)</label>
                         <select className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold text-indigo-750" value={editValues.Cat_Pack || 'R'} onChange={(e) => setEditValues({ ...editValues, Cat_Pack: e.target.value as any })}>
                           <option value="R">Rééducation (R)</option>
                           <option value="B">Balnéothérapie (B)</option>
                           <option value="I">Intensif (I)</option>
                           <option value="O">Orthophonie (O)</option>
                           <option value="P">Psychomotricité (P)</option>
                         </select>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                         <div>
                           <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nb Séances</label>
                           <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono font-bold" value={editValues.Nbre_Seance_Pack !== undefined ? editValues.Nbre_Seance_Pack : 0} onChange={(e) => {
                             const qty = Number(e.target.value) || 0;
                             setEditValues({
                               ...editValues,
                               Nbre_Seance_Pack: qty,
                               Prix_Seanc_Pack: qty && editValues.Prix_Pack ? Math.round(editValues.Prix_Pack / qty) : editValues.Prix_Seanc_Pack
                             });
                           }} />
                         </div>
                         <div>
                           <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Prix Pack (DA)</label>
                           <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono font-bold text-rose-600" value={editValues.Prix_Pack !== undefined ? editValues.Prix_Pack : 0} onChange={(e) => {
                             const pr = Number(e.target.value) || 0;
                             setEditValues({
                               ...editValues,
                               Prix_Pack: pr,
                               Prix_Seanc_Pack: editValues.Nbre_Seance_Pack ? Math.round(pr / editValues.Nbre_Seance_Pack) : 0
                             });
                           }} />
                         </div>
                         <div>
                           <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Prix Séance (DA)</label>
                           <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono font-bold text-indigo-700" value={editValues.Prix_Seanc_Pack !== undefined ? editValues.Prix_Seanc_Pack : 0} onChange={(e) => setEditValues({ ...editValues, Prix_Seanc_Pack: Number(e.target.value) || 0 })} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID_Acte rattaché (id_acte)</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold text-emerald-800" 
                            value={editValues.id_acte || ''} 
                            onChange={(e) => setEditValues({ ...editValues, id_acte: e.target.value })}
                          >
                            <option value="">-- Sélectionner un Acte (Obligatoire) * --</option>
                            {dbState.actes.map(act => (
                              <option key={act.ID_Acte} value={String(act.ID_Acte)}>
                                {act.Libelle_Acte} (ID: {act.ID_Acte})
                              </option>
                            ))}
                          </select>
                         </div>
                       </div>
                   )}

                  {activeTable === 'services' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Service</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`SCE_${editValues.ID_Sce || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Libellé Service</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-extrabold" value={editValues.Libelle_Sce || ''} onChange={(e) => setEditValues({ ...editValues, Libelle_Sce: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {activeTable === 'utilisateurs' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Utilisateur</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`USER_${editValues.ID_Utilisateur || editValues.ID_User || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nom Complet</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" 
                          value={editValues.Nom_Utilisateur || editValues.Nom || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditValues({ ...editValues, Nom_Utilisateur: val, Nom: val });
                            setUserName(val);
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rôle</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-bold text-amber-950" 
                          value={editValues.Role || 'Receptionniste RDC'} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditValues({ ...editValues, Role: val });
                            setUserRole(val);
                          }}
                        >
                          <option value="Receptionniste RDC">Réceptionniste RDC</option>
                          <option value="Receptionniste Balnéothérapie">Réceptionniste Balnéothérapie</option>
                          <option value="Receptionniste Réeducation">Réceptionniste Rééducation</option>
                          <option value="Receptionniste Intensif 2e">Réceptionniste Intensif 2e</option>
                          <option value="Receptionniste Intensif 3e">Réceptionniste Intensif 3e</option>
                          <option value="Receptionniste Intensif 4e">Réceptionniste Intensif 4e</option>
                          <option value="Admin">Admin</option>
                          <option value="Médecin MPR">Médecin MPR</option>
                          <option value="Assistante">Assistante</option>
                          <option value="Marketing">Marketing</option>
                          <option value="SupperRec">Super Réceptionniste</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service Rattachement</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.ID_Sce || 1} 
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditValues({ ...editValues, ID_Sce: val });
                            setUserService(val);
                          }}
                        >
                          {dbState.services.map(s => <option key={s.ID_Sce} value={s.ID_Sce}>{s.Libelle_Sce}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Username (Login)</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono font-bold" 
                          value={editValues.Login || editValues.login || editValues.Username || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditValues({ ...editValues, Login: val, login: val, Username: val });
                            setUserLogin(val);
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mot de passe</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" 
                          value={editValues.MotDePasse || editValues.Password || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditValues({ ...editValues, MotDePasse: val, Password: val });
                            setUserPassword(val);
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  {activeTable === 'typesPlanning' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Type Plan</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`PLAN_${editValues.ID_Type_Plan || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Genre de Planning</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Libelle_Type || ''} onChange={(e) => setEditValues({ ...editValues, Libelle_Type: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Simultanéité Max Patients</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono text-indigo-750 font-bold" value={editValues.Max_Patients_Simultanes !== undefined ? editValues.Max_Patients_Simultanes : 1} onChange={(e) => setEditValues({ ...editValues, Max_Patients_Simultanes: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}

                  {activeTable === 'zones' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Zone</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`ZONE_${editValues.ID_Zone || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Lieu Physique</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" value={editValues.Nom_Zone || ''} onChange={(e) => setEditValues({ ...editValues, Nom_Zone: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {activeTable === 'reglesBalneo' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Règle</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`RULE_${editValues.ID_Regle || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Jour Semaine</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" 
                          value={editValues.Jour_Semaine || 1} 
                          onChange={(e) => setEditValues({ ...editValues, Jour_Semaine: Number(e.target.value) })}
                        >
                          <option value={1}>Lundi</option>
                          <option value={2}>Mardi</option>
                          <option value={3}>Mercredi</option>
                          <option value={4}>Jeudi</option>
                          <option value={5}>Vendredi</option>
                          <option value={6}>Samedi</option>
                          <option value={7}>Dimanche</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Période</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" 
                          value={editValues.Demi_Journee || 'Matin'} 
                          onChange={(e) => setEditValues({ ...editValues, Demi_Journee: e.target.value })}
                        >
                          <option value="Matin">Matin</option>
                          <option value="Apres-midi">Après-midi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Genre Autorisé</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-semibold" 
                          value={editValues.Genre_Autorise || 'H'} 
                          onChange={(e) => setEditValues({ ...editValues, Genre_Autorise: e.target.value })}
                        >
                          <option value="H">H (Homme uniquement)</option>
                          <option value="F">F (Femme uniquement)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTable === 'seances' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">ID Séance</label>
                        <input type="text" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-100 font-bold" value={`SEANC_${editValues.ID_Seanc || ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Patient</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.ID_Patient || ''} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Patient: Number(e.target.value) })}
                        >
                          {dbState.patients.map(p => <option key={p.ID_Patient} value={p.ID_Patient}>{p.Nom_Patient}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Praticien Dispensateur</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.ID_Prat || ''} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Prat: Number(e.target.value) })}
                        >
                          {dbState.praticiens.map(p => <option key={p.ID_Prat} value={p.ID_Prat}>Dr. {p.Nom_Prat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Soin Réalisé</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium" 
                          value={editValues.ID_Acte || ''} 
                          onChange={(e) => setEditValues({ ...editValues, ID_Acte: Number(e.target.value) })}
                        >
                          {dbState.actes.map(a => <option key={a.ID_Acte} value={a.ID_Acte}>{a.Libelle_Acte}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date Réalisation</label>
                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" value={editValues.Date_Seanc_Realisee || ''} onChange={(e) => setEditValues({ ...editValues, Date_Seanc_Realisee: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Heure Début</label>
                          <input type="time" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" value={editValues.H_Debut_Seanc || ''} onChange={(e) => setEditValues({ ...editValues, H_Debut_Seanc: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Heure Fin</label>
                          <input type="time" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" value={editValues.H_Fin_Seanc || ''} onChange={(e) => setEditValues({ ...editValues, H_Fin_Seanc: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tarif payé / imputé (DH)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono text-indigo-700 font-bold" value={editValues.Prix_Seanc !== undefined ? editValues.Prix_Seanc : 0} onChange={(e) => setEditValues({ ...editValues, Prix_Seanc: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-slate-200 justify-end">
                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
                    >
                      Enregistrer
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedRowId(null); setEditValues({}); }} 
                      className="bg-slate-200 hover:bg-slate-305 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* VOLET IMPORTATIONS DES DONNÉES DEPUIS EXCEL / CSV */}
      <div className="hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Upload className="w-5 h-5 text-indigo-650" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Volet Importation de Données (Fichiers Excel / CSV)</h3>
              <p className="text-slate-500 text-[11px]">Alimentez en masse vos Patients, Abonnements, Actes Médicaux, Praticiens ou Packs d'abonnements à partir de fichiers Excel convertis en CSV.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              let sampleCSV = "";
              if (importTarget === 'patients') {
                sampleCSV = `Nom_Patient,Genre_Patient,type_patient,phone,address,wilaya,Nom_Pat_Arb,Pren_Pat_Arb\n"Benamara Farida","Femme","Adulte","0550112233","Cité des 500 logts, Bab Ezzouar","16","بن عمارة","فريدة"\n"Hadidi Brahim","Homme","Adulte","0661223344","Rue de la République","31","",""\n"Merbah Lynda","Enfant","Enfant IMC","0770556677","Amizour","06","",""`;
              } else if (importTarget === 'abonnements') {
                sampleCSV = `ID_Patient,ID_Pack,Date_Debut_Abn,Date_Fin_Abn,Nbre_Sean_Consom_Abn\n1,1,"2026-06-01","2026-09-01",0\n2,2,"2026-06-05","2026-12-05",4`;
              } else if (importTarget === 'praticiens') {
                sampleCSV = `Nom_Prat,Prenom_Prat,Repere,Genre_Prat,ID_Sce,Date_Nais_Prat,Date_Recrut_Prat,Type_Cont_Prat\n"Benkari","Mhand","K","H",1,"1988-06-15","2021-10-01","CDI"\n"Meriem","Amel","O","F",1,"1992-03-24","2022-01-15","CDD"`;
              } else if (importTarget === 'packs') {
                sampleCSV = `Libelle_Pack,Nbre_Seance_Pack,Prix_Pack,Prix_Seanc_Pack\n"Forfait Kinésithérapie (10 séanc.)",10,12000,1200\n"Forfait Balnéothérapie (12 séanc.)",12,18000,1500`;
              } else if (importTarget === 'services') {
                sampleCSV = `ID_Sce,Libelle_Sce\n1,"Rééducation Fonctionnelle"\n2,"Balnéothérapie"\n3,"Services Intensifs"`;
              } else {
                sampleCSV = `Libelle_Acte,Prix_Acte\n"Consultation de contrôle MPR",2500\n"Rééducation Motrice active",1500\n"Séance d'Orthophonie",2000`;
              }
              navigator.clipboard.writeText(sampleCSV);
              setCopiedTemplate(true);
              setTimeout(() => setCopiedTemplate(false), 2000);
            }}
            className="text-[11px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{copiedTemplate ? 'Modèle Copié !' : `Copier gabarit Excel CSV (${importTarget === 'patients' ? 'Patients' : importTarget === 'abonnements' ? 'Abonnements' : importTarget === 'praticiens' ? 'Praticiens' : importTarget === 'packs' ? 'Packs' : importTarget === 'services' ? 'Services' : 'Actes'})`}</span>
          </button>
        </div>

        {/* BOUTON D'INJECTION AUTOMATIQUE DE L'ANCIEN LOGICIEL */}
        <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-100 text-indigo-700 rounded-md">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </span>
              <h4 className="font-extrabold text-xs text-slate-900">Restauration & Injection Globale des Tables</h4>
            </div>
            <p className="text-[11px] text-slate-600 max-w-2xl leading-relaxed">
              Les fichiers de votre ancien logiciel (Patients, Praticiens, Actes, Packs et Abonnements) ont été détectés sur le serveur. Vous pouvez lancer une injection automatique globale pour alimenter l'ensemble de la base de données d'un seul clic en préservant tous les index et correspondances de dossiers.
            </p>
          </div>
          <button
            type="button"
            disabled={isInjecting}
            onClick={handleGlobalInjection}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs border transition ${
              isInjecting 
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
            }`}
          >
            {isInjecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Injection en cours...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Injecter les tables de l'ancien logiciel</span>
              </>
            )}
          </button>
        </div>

        {/* DESTINATION TABLE SELECTOR TABS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setImportTarget('patients');
              setImportText('');
              setPreviewData([]);
              setImportError(null);
              setImportSuccessMsg(null);
            }}
            className={`text-center py-2 text-xs font-bold rounded-lg transition ${
              importTarget === 'patients'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            📋 Dossiers Patients
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTarget('abonnements');
              setImportText('');
              setPreviewData([]);
              setImportError(null);
              setImportSuccessMsg(null);
            }}
            className={`text-center py-2 text-xs font-bold rounded-lg transition ${
              importTarget === 'abonnements'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            💳 Abonnements
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTarget('actes');
              setImportText('');
              setPreviewData([]);
              setImportError(null);
              setImportSuccessMsg(null);
            }}
            className={`text-center py-2 text-xs font-bold rounded-lg transition ${
              importTarget === 'actes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            🩺 Actes Médicaux
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTarget('praticiens');
              setImportText('');
              setPreviewData([]);
              setImportError(null);
              setImportSuccessMsg(null);
            }}
            className={`text-center py-2 text-xs font-bold rounded-lg transition ${
              importTarget === 'praticiens'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            🧑‍⚕️ Praticiens
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTarget('packs');
              setImportText('');
              setPreviewData([]);
              setImportError(null);
              setImportSuccessMsg(null);
            }}
            className={`text-center py-2 text-xs font-bold rounded-lg transition ${
              importTarget === 'packs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            📦 Packs / Forfaits
          </button>
          <button
            type="button"
            onClick={() => {
              setImportTarget('services');
              setImportText('');
              setPreviewData([]);
              setImportError(null);
              setImportSuccessMsg(null);
            }}
            className={`text-center py-2 text-xs font-bold rounded-lg transition ${
              importTarget === 'services'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-200'
            }`}
          >
            🏢 Services (Sce)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-450">Format de fichier d'import</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setImportType('csv'); handlePreview(importText, 'csv'); }}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition ${
                    importType === 'csv'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  Document Excel/CSV Semicolon (;) ou (,)
                </button>
                <button
                  type="button"
                  onClick={() => { setImportType('json'); handlePreview(importText, 'json'); }}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition ${
                    importType === 'json'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  Format JSON
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-450">Données à importer</span>
              </div>
              
              <div className="relative">
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    handlePreview(e.target.value, importType);
                  }}
                  placeholder={
                    importTarget === 'patients'
                      ? (importType === 'csv' 
                        ? 'Collez vos lignes de patients CSV ici...\n\nModèle:\nNom_Patient,Genre_Patient,type_patient,phone,address,wilaya,Nom_Pat_Arb,Pren_Pat_Arb\n"Benamara Farida","Femme","Adulte","0550112233","Bab Ezzouar","16","بن عمارة","فريدة"'
                        : 'Collez votre tableau JSON de patients ici...')
                      : importTarget === 'abonnements'
                      ? (importType === 'csv'
                        ? 'Collez vos lignes d\'abonnements CSV ici...\n\nModèle:\nID_Patient,ID_Pack,Date_Debut_Abn,Date_Fin_Abn,Nbre_Sean_Consom_Abn\n1,1,"2026-06-01","2026-09-01",3'
                        : 'Collez votre tableau JSON d\'abonnements ici...')
                      : importTarget === 'praticiens'
                      ? (importType === 'csv'
                        ? 'Collez vos lignes de praticiens CSV ici...\n\nModèle:\nNom_Prat,Prenom_Prat,Repere,Genre_Prat,ID_Sce,Date_Nais_Prat,Date_Recrut_Prat,Type_Cont_Prat\n"Benkari","Mhand","K","H",1,"1988-06-15","2021-10-01","CDI"'
                        : 'Collez votre tableau JSON de praticiens ici...')
                      : importTarget === 'packs'
                      ? (importType === 'csv'
                        ? 'Collez vos lignes de packs d\'abonnements CSV ici...\n\nModèle:\nLibelle_Pack,Nbre_Seance_Pack,Prix_Pack,Prix_Seanc_Pack\n"Forfait Kinésithérapie (10 séanc.)",10,12000,1200'
                        : 'Collez votre tableau JSON de packs d\'abonnements ici...')
                      : importTarget === 'services'
                      ? (importType === 'csv'
                        ? 'Collez vos lignes de services (Sce) CSV ici...\n\nModèle:\nID_Sce,Libelle_Sce\n1,"Rééducation Fonctionnelle"\n2,"Balnéothérapie"'
                        : 'Collez votre tableau JSON de services (Sce) ici...')
                      : (importType === 'csv'
                        ? 'Collez vos lignes d\'actes médicaux CSV ici...\n\nModèle:\nLibelle_Acte,Prix_Acte\n"Contrôle MPR régulier",2500'
                        : 'Collez votre tableau JSON d\'actes ici...')
                  }
                  className="w-full h-40 bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                />
                
                <div className="absolute bottom-2.5 right-2 text-slate-400 text-[9px] font-bold bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                  Traitement direct
                </div>
              </div>
            </div>

            {/* File direct Selector with prominent Excel support */}
            <div className="bg-white border text-center border-slate-200 rounded-xl p-4.5 space-y-2 text-center relative shadow-2xs hover:border-indigo-400 transition">
              <FileSpreadsheet className="w-8 h-8 text-indigo-600 mx-auto" />
              <div>
                <label className="block text-xs font-black text-slate-800">
                  Fichier Excel (.xlsx, .xls) ou CSV
                </label>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  Importez directement avec alignement dynamique des colonnes de votre feuille.
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    handleExcelImport(file);
                  } else {
                    // Fallback for JSON or others
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const text = evt.target?.result as string;
                      setImportText(text);
                      handlePreview(text, importType);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-55 file:text-indigo-750 hover:file:bg-indigo-100 transition cursor-pointer"
              />
            </div>

            {/* Translation helper options check */}
            {importTarget === 'patients' && (
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-start gap-2.5">
                <input
                  id="auto-translate-import"
                  type="checkbox"
                  checked={autoTranslateMissingArb}
                  onChange={(e) => setAutoTranslateMissingArb(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="auto-translate-import" className="block text-xs font-bold text-slate-800 leading-none mb-1 cursor-pointer">
                    Traduire automatiquement en arabe
                  </label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Pour les fiches ne spécifiant pas de nom d'arabe, l'outil déduira de manière phonétique par dictionnaire local le couple Nom/Prénom.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 min-h-[180px] flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-2">Aperçu & Rapports</span>
                
                {importError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-lg text-rose-800 text-xs flex items-start gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>{importError}</div>
                  </div>
                )}

                {importSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-800 text-xs flex items-start gap-2 font-bold animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>{importSuccessMsg}</div>
                  </div>
                )}

                {!importError && !importSuccessMsg && previewData.length === 0 && (
                  <div className="py-12 text-center text-slate-400 italic text-xs space-y-2">
                    <FileSpreadsheet className="w-7 h-7 mx-auto text-slate-300 stroke-1" />
                    <p>En attente de chargement de données.</p>
                    <p className="text-[10px] text-slate-405 font-sans">Collez ou chargez le document Excel exporté au format CSV.</p>
                  </div>
                )}

                {previewData.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                      <span>{previewData.length} élément(s) détecté(s) prêt(s) à l'import</span>
                      <span className="text-emerald-600">✓ Structure vérifiée</span>
                    </div>

                    <div className="max-h-52 overflow-y-auto border border-slate-150 rounded-lg">
                      <table className="w-full text-left text-xs text-slate-650">
                        {importTarget === 'patients' && (
                          <>
                            <thead className="bg-[#c8e0de]/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b sticky top-0">
                              <tr>
                                <th className="py-1 px-2.5">Nom (FR)</th>
                                <th className="py-1 px-2.5">Genre/Sexe</th>
                                <th className="py-1 px-2.5">Type</th>
                                <th className="py-1 px-2.5 text-right font-sans">Traduction Arabe</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewData.slice(0, 5).map((row, index) => {
                                const showRes = autoTranslateMissingArb && !row.Nom_Pat_Arb && !row.Pren_Pat_Arb;
                                let translatedView = "";
                                if (showRes && row.Nom_Patient) {
                                  const t = translateNameToArabic(row.Nom_Patient);
                                  translatedView = `${t.Pren_Pat_Arb} ${t.Nom_Pat_Arb}`;
                                } else if (row.Nom_Pat_Arb || row.Pren_Pat_Arb) {
                                  translatedView = `${row.Pren_Pat_Arb || ''} ${row.Nom_Pat_Arb || ''}`.trim();
                                }
                                return (
                                  <tr key={`import-prev-pat-${row.Nom_Patient || 'unnamed'}-${index}`} className="hover:bg-slate-50/50">
                                    <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.Nom_Patient || 'Identité brute vide'}</td>
                                    <td className="py-1.5 px-2.5 text-slate-500 text-[11px]">{row.Genre_Patient || 'Homme'}</td>
                                    <td className="py-1.5 px-2.5 text-slate-555 text-[11px]">{row.type_patient || 'Adulte'}</td>
                                    <td className="py-1.5 px-2.5 text-right font-bold text-indigo-750 font-sans" dir="rtl">{translatedView || <span className="text-slate-450 italic text-[10px]">Non traduit</span>}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </>
                        )}

                        {importTarget === 'abonnements' && (
                          <>
                            <thead className="bg-[#c8e0de]/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b sticky top-0">
                              <tr>
                                <th className="py-1 px-2.5">ID Patient</th>
                                <th className="py-1 px-2.5">ID Pack</th>
                                <th className="py-1 px-2.5">Date Début</th>
                                <th className="py-1 px-2.5">Date Fin</th>
                                <th className="py-1 px-2.5 text-right">Séances Consom.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewData.slice(0, 5).map((row, index) => (
                                <tr key={`import-prev-abn-${row.ID_Patient || ''}-${row.ID_Pack || ''}-${index}`} className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-2.5 font-bold text-slate-800">PAT_#0{row.ID_Patient}</td>
                                  <td className="py-1.5 px-2.5 text-slate-600 font-medium">Pack #{row.ID_Pack}</td>
                                  <td className="py-1.5 px-2.5 text-[11px] text-slate-500">{row.Date_Debut_Abn || 'Automatique'}</td>
                                  <td className="py-1.5 px-2.5 text-[11px] text-slate-500">{row.Date_Fin_Abn || 'Automatique'}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-700">{row.Nbre_Sean_Consom_Abn || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {importTarget === 'actes' && (
                          <>
                            <thead className="bg-[#c8e0de]/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b sticky top-0">
                              <tr>
                                <th className="py-1 px-2.5">Libellé de l'Acte</th>
                                <th className="py-1 px-2.5 text-right">Prix Acte (DA)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewData.slice(0, 5).map((row, index) => (
                                <tr key={`import-prev-acte-${row.Libelle_Acte || 'unnamed'}-${index}`} className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.Libelle_Acte}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-800">{row.Prix_Acte ? `${row.Prix_Acte} DA` : '1500 DA'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {importTarget === 'praticiens' && (
                          <>
                            <thead className="bg-[#c8e0de]/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b sticky top-0">
                              <tr>
                                <th className="py-1 px-2.5">Nom du Praticien</th>
                                <th className="py-1 px-2.5">Prénom</th>
                                <th className="py-1 px-2.5">Genre</th>
                                <th className="py-1 px-2.5">Repère</th>
                                <th className="py-1 px-2.5 text-right">Type de Contrat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewData.slice(0, 5).map((row, index) => (
                                <tr key={`import-prev-prat-${row.Nom_Prat || ''}-${row.Prenom_Prat || ''}-${index}`} className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.Nom_Prat}</td>
                                  <td className="py-1.5 px-2.5 font-medium text-slate-600">{row.Prenom_Prat}</td>
                                  <td className="py-1.5 px-2.5"><span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">{row.Genre_Prat || 'H'}</span></td>
                                  <td className="py-1.5 px-2.5"><span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">{row.Repere || 'K'}</span></td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-800">{row.Type_Cont_Prat || 'CDI'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {importTarget === 'packs' && (
                          <>
                            <thead className="bg-[#c8e0de]/30 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b sticky top-0">
                              <tr>
                                <th className="py-1 px-2.5">Désignation du Pack</th>
                                <th className="py-1 px-2.5 text-right">Séances Incluses</th>
                                <th className="py-1 px-2.5 text-right">Prix Pack (DA)</th>
                                <th className="py-1 px-2.5 text-right">Prix Séance (DA)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewData.slice(0, 5).map((row, index) => (
                                <tr key={`import-prev-pack-${row.Libelle_Pack || 'unnamed'}-${index}`} className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-2.5 font-bold text-slate-800">{row.Libelle_Pack}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-850">{row.Nbre_Seance_Pack || 10}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-rose-600">{row.Prix_Pack !== undefined ? `${row.Prix_Pack} DA` : 'Néant'}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-700">{row.Prix_Seanc_Pack !== undefined ? `${row.Prix_Seanc_Pack} DA` : (row.Prix_Seance_Pack !== undefined ? `${row.Prix_Seance_Pack} DA` : 'Néant')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                      </table>
                      {previewData.length > 5 && (
                        <div className="p-2 bg-slate-100/50 text-center text-[10px] font-semibold text-slate-450 tracking-wide border-t">
                          ... + {previewData.length - 5} autres lignes détectées
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {previewData.length > 0 && (
                <div className="pt-3 border-t border-slate-150 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setImportText('');
                      setPreviewData([]);
                      setImportError(null);
                      setImportSuccessMsg(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Vider
                  </button>
                  <button
                    type="button"
                    onClick={executeImportAction}
                    className="bg-indigo-600 hover:bg-indigo-705 text-white font-extrabold px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Lancer l'importation massive ({importTarget === 'patients' ? 'Patients' : importTarget === 'abonnements' ? 'Abonnements' : importTarget === 'praticiens' ? 'Praticiens' : importTarget === 'packs' ? 'Packs' : 'Actes'})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* =======================================================================
          CONSEIL ET OUTIL D'ADMINISTRATION : VIDANGE SÉCURISÉE DES TABLES
          ======================================================================= */}
      {activeDbSubTab === 'clear' && (
      <div className="border-t border-slate-200 bg-slate-50/50 p-6 space-y-6" id="tables-clearance-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1 text-left">
            <h3 className="font-extrabold text-sm text-[#102e3b] font-serif flex items-center gap-2">
              <span className="text-lg">🗑️</span>
              <span>Console de Nettoyage & Vidange Sécurisée des Tables Cliniques</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Sélectionnez ci-dessous les tables que vous souhaitez purger ou réinitialiser. Vous pouvez vider une sélection cible ou procéder à un effacement total.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAllClear(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Tout cocher
            </button>
            <button
              type="button"
              onClick={() => handleSelectAllClear(false)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Tout décocher
            </button>
          </div>
        </div>

        {/* SECTION GESTION DES CAISSES */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="text-base">🏦</span>
                <span>Gestion des Caisses &amp; Trésorerie</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Purger l'intégralité des transactions et mouvements enregistrés dans la caisse globale.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePurgerCaisses}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              🗑️ Purger les caisses
            </button>
          </div>
        </div>

        {/* Dynamic Table checkboxes with live count records */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {clinicalTablesList.map((tbl) => {
            let count = 0;
            if (tbl.key === 'rdv_intensif_2e') {
              count = dbState.rendezVous ? dbState.rendezVous.filter(r => r.ID_Zone === 4).length : 0;
            } else if (tbl.key === 'rdv_intensif_3e') {
              count = dbState.rendezVous ? dbState.rendezVous.filter(r => r.ID_Zone === 5).length : 0;
            } else if (tbl.key === 'rdv_intensif_4e') {
              count = dbState.rendezVous ? dbState.rendezVous.filter(r => r.ID_Zone === 6).length : 0;
            } else {
              count = (dbState[tbl.key as keyof DatabaseState] as any)?.length || 0;
            }
            const isChecked = selectedTablesToClear[tbl.key] || false;
            
            return (
              <div 
                key={tbl.key}
                onClick={() => {
                  setSelectedTablesToClear({
                    ...selectedTablesToClear,
                    [tbl.key]: !isChecked
                  });
                }}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none text-left ${
                  isChecked 
                    ? 'bg-rose-50/70 border-rose-200/90 shadow-2xs' 
                    : count > 0 
                      ? 'bg-white border-slate-200 hover:border-slate-300' 
                      : 'bg-stone-50/50 border-stone-150 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setSelectedTablesToClear({
                        ...selectedTablesToClear,
                        [tbl.key]: e.target.checked
                      });
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                </div>
                
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-800 truncate flex items-center gap-1.5">
                      <span>{tbl.icon}</span>
                      <span>{tbl.label}</span>
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-mono font-black shrink-0 ${
                      count > 0 
                        ? 'bg-slate-250/60 bg-slate-100 text-slate-700 border border-slate-200/40' 
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {count} lig.
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    {tbl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action triggers */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-start gap-2 text-left">
            <span className="text-lg mt-0.5">💡</span>
            <div className="text-[10.5px] font-medium text-slate-550 leading-relaxed">
              <span className="font-bold text-slate-700 block">Note de Sécurité Clinique</span>
              Pour vider les tables qui alimentent l&apos;application ou faire des tests, cochez simplement les cases au-dessus. Les compteurs d&apos;abonnements associés seront réajustés pour maintenir la comptabilité.
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleClearSelectedTables(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider la sélection</span>
            </button>
            <button
              type="button"
              onClick={() => handleClearSelectedTables(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🚨</span>
              <span>Tout Vider (Réinitialisation)</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {activeDbSubTab === 'pauses' && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-6 space-y-6" id="tables-pauses-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1 text-left">
              <h3 className="font-extrabold text-sm text-[#102e3b] font-serif flex items-center gap-2">
                <span className="text-lg">🕒</span>
                <span>Console de Réajustement des Pauses Horaires</span>
              </h3>
              <p className="text-slate-550 text-[11px] leading-relaxed">
                Ajustez les heures des pauses pour le service Rééducation Adulte et les services Intensifs des 2ème, 3ème, et 4ème étages.
              </p>
            </div>
          </div>

          {/* Double onglets pour le réajustement */}
          <div className="flex border-b border-slate-200 bg-slate-100 p-1 rounded-xl max-w-md gap-1">
            <button
              type="button"
              onClick={() => setActivePauseTab('reeducation')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePauseTab === 'reeducation'
                  ? 'bg-white text-[#102e3b] shadow-xs'
                  : 'text-slate-550 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              Plateau Rééducation Adulte
            </button>
            <button
              type="button"
              onClick={() => setActivePauseTab('intensif')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePauseTab === 'intensif'
                  ? 'bg-white text-[#102e3b] shadow-xs'
                  : 'text-slate-550 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              Soins Intensifs (2e, 3e, 4e)
            </button>
          </div>

          {/* Contenu Onglet 1 : Rééducation Adulte */}
          {activePauseTab === 'reeducation' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5 shadow-xs max-w-2xl text-left">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Horaires des Pauses - Rééducation Adulte
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block">Pause Repas 1 - Début</label>
                  <input
                    type="time"
                    value={tempBreak1Start}
                    onChange={(e) => setTempBreak1Start(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block">Pause Repas 1 - Fin</label>
                  <input
                    type="time"
                    value={tempBreak1End}
                    onChange={(e) => setTempBreak1End(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block">Pause Repas 2 - Début</label>
                  <input
                    type="time"
                    value={tempBreak2Start}
                    onChange={(e) => setTempBreak2Start(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block">Pause Repas 2 - Fin</label>
                  <input
                    type="time"
                    value={tempBreak2End}
                    onChange={(e) => setTempBreak2End(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateBreaks) {
                      onUpdateBreaks(tempBreak1Start, tempBreak1End, tempBreak2Start, tempBreak2End);
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer les Pauses Rééducation</span>
                </button>
              </div>
            </div>
          )}

          {/* Contenu Onglet 2 : Soins Intensifs */}
          {activePauseTab === 'intensif' && (
            <div className="space-y-6">
              {[
                { zoneId: 4, name: "Intensif 2e Étage (Soin Intensif 2e)", color: "border-blue-200 bg-blue-50/20" },
                { zoneId: 5, name: "Intensif 3e Étage (Soin Intensif 3e)", color: "border-amber-200 bg-amber-50/20" },
                { zoneId: 6, name: "Intensif 4e Étage (Soin Intensif 4e)", color: "border-purple-200 bg-purple-50/20" },
              ].map((service) => (
                <div key={service.zoneId} className={`p-5 rounded-2xl border ${service.color} space-y-4 max-w-2xl text-left shadow-2xs bg-white`}>
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg uppercase">
                      Zone ID: {service.zoneId}
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">
                      {service.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block">Pause Déjeuner - Début</label>
                      <input
                        type="time"
                        value={tempIntensifBreaks[service.zoneId]?.start || '12:00'}
                        onChange={(e) => {
                          setTempIntensifBreaks({
                            ...tempIntensifBreaks,
                            [service.zoneId]: {
                              ...(tempIntensifBreaks[service.zoneId] || { start: '12:00', end: '13:00' }),
                              start: e.target.value
                            }
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-550 block">Pause Déjeuner - Fin</label>
                      <input
                        type="time"
                        value={tempIntensifBreaks[service.zoneId]?.end || '13:00'}
                        onChange={(e) => {
                          setTempIntensifBreaks({
                            ...tempIntensifBreaks,
                            [service.zoneId]: {
                              ...(tempIntensifBreaks[service.zoneId] || { start: '12:00', end: '13:00' }),
                              end: e.target.value
                            }
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateIntensifBreaks) {
                          const config = tempIntensifBreaks[service.zoneId] || { start: '12:00', end: '13:00' };
                          onUpdateIntensifBreaks(service.zoneId, config.start, config.end);
                        }
                      }}
                      className="px-4 py-2 bg-[#102e3b] hover:bg-[#1b3d4f] text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      <span>Enregistrer la pause {service.zoneId - 2}e</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeDbSubTab === 'multi_import' && (
        <div className="p-6 space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-left space-y-3 shadow-3xs">
            <h3 className="font-extrabold text-base text-teal-900 flex items-center gap-2">
              📥 Section Import / Mise à jour des données (Excel .xlsx)
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed max-w-4xl">
              Synchronisez et injectez en une seule opération toutes les tables restantes issues de l&apos;ancien logiciel (<strong>Packs</strong>, <strong>Praticiens</strong>, <strong>Actes</strong>, <strong>Séances</strong>, <strong>Versements</strong>, <strong>Caisses</strong>) à partir d&apos;un fichier Excel unique (.xlsx) contenant les 6 onglets réglementaires. Les liaisons relationnelles clés étrangères sont automatiquement recalculées et sécurisées.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-white p-3 rounded-xl border border-teal-50 shadow-3xs flex items-start gap-2.5">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg text-xs">🔗</div>
                <div>
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase">Mises en relation</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Mappe automatiquement les anciens IDs aux nouveaux IDs générés et réécrit les jointures relationnelles des séances, versements et caisses.</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-teal-50 shadow-3xs flex items-start gap-2.5">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg text-xs">🛡️</div>
                <div>
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase">Anti-Doublons Actif</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Ignore intelligemment les doublons sur des clés d&apos;identification métier uniques pour préserver la sincérité de vos historiques.</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-teal-50 shadow-3xs flex items-start gap-2.5">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg text-xs">✓</div>
                <div>
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase">Non-Destructif</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">N&apos;altère pas vos tables de patients et d&apos;abonnements déjà peuplées avec soin. Seules les nouvelles fiches sont annexées.</p>
                </div>
              </div>
            </div>
          </div>

          {/* DRAG AND DROP ZONE */}
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50 p-8 rounded-2xl text-center transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleMultiImportExcel}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={multiImportLoading}
              />
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shadow-3xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">
                    Déposez votre fichier Excel d&apos;importation ou <span className="text-teal-600 underline">parcourez votre ordinateur</span>
                  </p>
                  <p className="text-[10px] text-slate-450 mt-1">
                    Format pris en charge : Excel (.xlsx) uniquement. Les onglets doivent correspondre aux tables à importer.
                  </p>
                </div>
              </div>
            </div>

            {multiImportFileName && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600 bg-slate-100/70 p-2 rounded-xl border border-slate-200">
                <span className="font-black">Fichier chargé :</span>
                <span className="font-mono text-teal-700">{multiImportFileName}</span>
              </div>
            )}

            {multiImportLoading && (
              <div className="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">Traitement, croisement des dépendances et déduplication en cours...</span>
              </div>
            )}

            {multiImportError && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-150 rounded-xl text-left text-xs text-rose-800 flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <p className="font-black">Erreur rencontrée :</p>
                  <p className="mt-1 font-semibold">{multiImportError}</p>
                </div>
              </div>
            )}

            {multiImportSuccessMsg && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-left text-xs text-emerald-800 flex items-start gap-2.5 shadow-2xs">
                <span className="text-base leading-none">✓</span>
                <div>
                  <p className="font-black">Action accomplie :</p>
                  <p className="mt-1 font-semibold">{multiImportSuccessMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* 1. DETECTED SHEETS SUMMARY */}
          {detectedSheets.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-4 shadow-3xs max-w-4xl mx-auto">
              <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
                <span>📋</span>
                <span>1. Onglets détectés dans le fichier Excel</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3 text-left">Nom de l&apos;onglet</th>
                      <th className="p-3 text-left">Table de destination</th>
                      <th className="p-3 text-center">Lignes détectées</th>
                      <th className="p-3 text-right">Statut de conformité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {detectedSheets.map((sh, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-700">{sh.sheetName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            sh.targetTable !== 'Inconnu' ? 'bg-teal-50 text-teal-700 border border-teal-150' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {sh.targetTable}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800 font-mono">{sh.rowsCount} l.</td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            sh.status === 'OK' ? 'text-emerald-600' : 'text-amber-500'
                          }`}>
                            {sh.status === 'OK' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Reconnu &amp; Mappé</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                <span>Ignoré ou Hors-gabarit</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ⚙️ SECTION MAPPING DE CHAMPS */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4.5 text-left space-y-4.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                      <span>⚙️</span>
                      <span>Mapping personnalisé champ par champ (Facultatif)</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Associez manuellement vos onglets Excel et leurs colonnes aux tables de destination si les en-têtes diffèrent.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input 
                      type="checkbox" 
                      checked={isManualMappingEnabled}
                      onChange={(e) => {
                        setIsManualMappingEnabled(e.target.checked);
                        setIsVerified(false); // require re-verification when toggling manual mapping
                        setDiffReport(null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    <span className="ml-2 text-[11px] font-bold text-slate-700">Activer le mapping</span>
                  </label>
                </div>

                {isManualMappingEnabled && (
                  <div className="space-y-5.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Part A: Sheets to Tables mapping */}
                    <div className="space-y-2.5">
                      <h5 className="font-extrabold text-[10px] text-teal-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>📂</span>
                        <span>Étape A : Association des Onglets aux Tables</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(TABLES_SCHEMA_CONFIG).map(([tableKey, config]) => {
                          const currentSheetMapped = Object.entries(sheetToTableMap).find(([sName, tKey]) => tKey === tableKey)?.[0] || '';
                          
                          return (
                            <div key={tableKey} className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between gap-2 shadow-3xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[11px] text-slate-700">{config.label}</span>
                                <span className="text-[9px] text-slate-400 font-mono">table: {tableKey}</span>
                              </div>
                              <select
                                value={currentSheetMapped}
                                onChange={(e) => {
                                  const newSheet = e.target.value;
                                  setSheetToTableMap(prev => {
                                    const copy = { ...prev };
                                    // Clean other occurrences of this tableKey
                                    Object.keys(copy).forEach(k => {
                                      if (copy[k] === tableKey) delete copy[k];
                                    });
                                    if (newSheet) {
                                      copy[newSheet] = tableKey;
                                    }
                                    return copy;
                                  });
                                  setIsVerified(false);
                                  setDiffReport(null);

                                  // Trigger auto-column-mapping helper when sheet changes
                                  if (newSheet) {
                                    const headers = headersBySheet[newSheet] || [];
                                    setColumnMappings(prev => {
                                      const nextMap = { ...prev };
                                      const tableMap: Record<string, string> = {};
                                      config.fields.forEach(f => {
                                        const matched = findMatchingHeader(headers, f.key);
                                        if (matched) {
                                          tableMap[f.key] = matched;
                                        }
                                      });
                                      nextMap[tableKey] = tableMap;
                                      return nextMap;
                                    });
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg p-1.5 font-bold focus:ring-1 focus:ring-teal-500 outline-none"
                              >
                                <option value="">-- Ignorer cette table --</option>
                                {detectedSheets.map(sh => (
                                  <option key={sh.sheetName} value={sh.sheetName}>
                                    {sh.sheetName} ({sh.rowsCount} lignes)
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Part B: Columns mappings */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <h5 className="font-extrabold text-[10px] text-teal-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>📋</span>
                        <span>Étape B : Association des Colonnes (Champs)</span>
                      </h5>
                      <div className="space-y-4">
                        {Object.entries(TABLES_SCHEMA_CONFIG).map(([tableKey, config]) => {
                          const mappedSheet = Object.entries(sheetToTableMap).find(([sName, tKey]) => tKey === tableKey)?.[0];
                          if (!mappedSheet) return null; // Only show if mapped to a sheet

                          const sheetHeaders = headersBySheet[mappedSheet] || [];
                          const currentTableColMapping = columnMappings[tableKey] || {};

                          return (
                            <div key={tableKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                              <div className="bg-slate-50/70 p-2.5 px-3.5 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-xs text-slate-800">{config.label}</span>
                                  <span className="text-[9.5px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded border border-teal-150">
                                    onglet : {mappedSheet}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {config.fields.map(field => {
                                  const mappedCol = currentTableColMapping[field.key] || '';
                                  return (
                                    <div key={field.key} className="flex flex-col gap-1 text-[11px]">
                                      <label className="font-bold text-slate-700 flex items-center gap-1 truncate">
                                        <span>{field.label}</span>
                                        {field.required && <span className="text-rose-500 font-bold">*</span>}
                                      </label>
                                      <select
                                        value={mappedCol}
                                        onChange={(e) => {
                                          const newVal = e.target.value;
                                          setColumnMappings(prev => {
                                            const nextMap = { ...prev };
                                            if (!nextMap[tableKey]) nextMap[tableKey] = {};
                                            nextMap[tableKey][field.key] = newVal;
                                            return nextMap;
                                          });
                                          setIsVerified(false);
                                          setDiffReport(null);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-lg p-1.5 font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                                      >
                                        <option value="">-- Non associé --</option>
                                        {sheetHeaders.map(h => (
                                          <option key={h} value={h}>{h}</option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SYNC ACTIONS PANEL */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-left space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>2. Actions de synchronisation par lot</span>
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-xl">
                    Vérifiez les différences pour examiner le rapport avant d&apos;injecter les données de manière définitive.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleVerifyDifferences}
                    className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-3xs hover:shadow-2xs transition flex items-center gap-2 cursor-pointer"
                    disabled={multiImportLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${multiImportLoading ? 'animate-spin' : ''}`} />
                    <span>Vérifier les différences</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer ${
                      isVerified
                        ? 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                    disabled={!isVerified || multiImportLoading}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Appliquer l&apos;import</span>
                  </button>
                </div>
              </div>

              {/* STEP PROGRESS BARS */}
              {Object.keys(importProgress).length > 0 && (
                <div className="bg-white border border-slate-150 rounded-xl p-4 space-y-3.5 shadow-2xs">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                    <span>Progression d&apos;injection séquentielle en base :</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'packs', label: 'Packs & Forfaits 📦' },
                      { key: 'praticiens', label: 'Praticiens (Personnel) 👨‍⚕️' },
                      { key: 'actes', label: 'Actes Médicaux 🏷️' },
                      { key: 'seances', label: 'Séances Réalisées 🕒' },
                      { key: 'versements', label: 'Versements (Paiements) 💰' },
                      { key: 'caisses', label: 'Transactions Caisses 💳' }
                    ].map(step => {
                      const prog = importProgress[step.key] || 0;
                      return (
                        <div key={step.key} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <div className="flex items-center justify-between text-[10px] font-extrabold">
                            <span className="text-slate-700 truncate">{step.label}</span>
                            <span className="text-teal-600 font-mono">{prog}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${prog}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. DIFFERENCES ALIGNMENT REPORT */}
          {diffReport && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-4 shadow-3xs max-w-4xl mx-auto">
              <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
                <span>📊</span>
                <span>3. Rapport de comparaison avant importation</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'packs', title: 'Packs & Forfaits 📦', desc: 'Sera synchronisé dans packs d\'abonnement.' },
                  { key: 'praticiens', title: 'Praticiens (Personnel) 👨‍⚕️', desc: 'Sera synchronisé dans praticiens.' },
                  { key: 'actes', title: 'Actes Médicaux 🏷️', desc: 'Sera synchronisé dans prestations.' },
                  { key: 'seances', title: 'Séances Réalisées 🕒', desc: 'Sera synchronisé dans l\'historique des séances.' },
                  { key: 'versements', title: 'Versements (Paiements) 💰', desc: 'Sera synchronisé dans l\'historique financier.' },
                  { key: 'caisses', title: 'Transactions Caisses 💳', desc: 'Sera synchronisé dans mouvements caisses.' },
                ].map((item) => {
                  const r = diffReport[item.key as keyof MultiDiffReport];
                  return (
                    <div key={item.key} className="bg-white border rounded-2xl shadow-3xs overflow-hidden transition hover:shadow-xs flex flex-col justify-between">
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-black text-xs text-slate-800">{item.title}</h5>
                          {r.sheetFound ? (
                            <span className="text-[9px] bg-teal-100 text-teal-800 border border-teal-200 font-bold px-2 py-0.5 rounded-md truncate max-w-[150px]">
                              ✓ Mappé
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-450 border border-slate-200 font-semibold px-2 py-0.5 rounded-md">
                              Absent
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">{item.desc}</p>
                      </div>

                      {r.sheetFound ? (
                        <div className="bg-slate-50 border-t border-slate-100 p-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-1">
                            <span className="block text-[8px] uppercase font-black tracking-wider text-emerald-700">Nouveaux</span>
                            <span className="font-black text-emerald-700 text-sm font-mono">+{r.newRowsCount}</span>
                          </div>
                          <div className="bg-slate-100 rounded-lg p-1 text-slate-600">
                            <span className="block text-[8px] uppercase font-black tracking-wider text-slate-400">Existants</span>
                            <span className="font-black text-slate-600 text-sm font-mono">{r.existingRowsCount}</span>
                          </div>
                          <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-1 text-amber-700">
                            <span className="block text-[8px] uppercase font-black tracking-wider text-amber-600">Ignorés</span>
                            <span className="font-black text-amber-600 text-sm font-mono">{r.ignoredRowsCount}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-[10px] text-slate-400 font-semibold">
                          Fiche absente ou non mappée dans le fichier
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. FINAL INTEGRATION REPORT */}
          {finalImportReport && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-4 shadow-3xs max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
                <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>📊</span>
                  <span>4. Rapport final d&apos;intégration &amp; Alignement</span>
                </h4>
                <button
                  type="button"
                  onClick={downloadJsonReport}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le rapport JSON</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'packs', title: 'Packs & Forfaits 📦' },
                  { key: 'praticiens', title: 'Praticiens (Personnel) 👨‍⚕️' },
                  { key: 'actes', title: 'Actes Médicaux 🏷️' },
                  { key: 'seances', title: 'Séances Réalisées 🕒' },
                  { key: 'versements', title: 'Versements (Paiements) 💰' },
                  { key: 'caisses', title: 'Transactions Caisses 💳' },
                ].map((item) => {
                  const r = finalImportReport[item.key as keyof MultiImportFinalReport];
                  if (!r) return null;
                  return (
                    <div key={item.key} className="bg-white border rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between">
                      <div className="p-4 bg-slate-50/50 border-b">
                        <h5 className="font-black text-xs text-slate-800">{item.title}</h5>
                      </div>

                      <div className="p-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-1.5">
                          <span className="block text-[8px] uppercase font-black tracking-wider text-emerald-700">Insérés</span>
                          <span className="font-black text-emerald-700 text-sm font-mono">+{r.imported}</span>
                        </div>
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-1.5 text-teal-700">
                          <span className="block text-[8px] uppercase font-black tracking-wider text-teal-600">Mis à jour</span>
                          <span className="font-black text-teal-700 text-sm font-mono">{r.updated}</span>
                        </div>
                        <div className="bg-slate-100 rounded-lg p-1.5 text-slate-400">
                          <span className="block text-[8px] uppercase font-black tracking-wider text-slate-400">Ignorés</span>
                          <span className="font-black text-slate-500 text-sm font-mono">{r.ignored}</span>
                        </div>
                      </div>

                      {r.errors && r.errors.length > 0 && (
                        <div className="bg-rose-50 p-2.5 px-3 border-t border-rose-100 max-h-24 overflow-y-auto">
                          <span className="block text-[8px] uppercase font-black tracking-wider text-rose-700 mb-1">Journal d&apos;anomalies :</span>
                          <ul className="text-[9.5px] text-rose-850 list-disc list-inside space-y-0.5 leading-relaxed font-semibold">
                            {r.errors.map((err, errIdx) => (
                              <li key={errIdx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECURE CLEANUP CONFIRMATION MODAL OVERLAY */}
      {clearanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Header banner */}
            <div className={`p-5 text-white flex items-center gap-3 shrink-0 ${clearanceAllMode ? 'bg-gradient-to-r from-red-600 to-rose-700' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
              <div className="p-2 bg-white/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">
                  {clearanceAllMode ? '🚨 Action Critique : Vidange Totale' : '🗑️ Confirmation de Nettoyage Sécurisé'}
                </h4>
                <p className="text-[10px] text-white/80 font-medium">
                  Régulation de sincérité clinique & cohérence
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="text-[11.5px] font-medium leading-relaxed text-slate-600">
                {clearanceAllMode ? (
                  <span className="text-red-700 font-bold block bg-red-50 p-3 rounded-lg border border-red-150">
                    Sachez que vous êtes sur le point de purger INTÉGRALEMENT l&apos;ensemble de la base de données clinique (patients, abonnements, séances, rendez-vous, versements, etc.). Cette action remet à zéro l&apos;application et est totalement irréversible.
                  </span>
                ) : (
                  <span>
                    Vous demandez la suppression définitive des données dans les tables sélectionnées. Les autres tables resteront inchangées. Les compteurs d&apos;abonnements et de consommations associés seront recalibrés automatiquement pour maintenir la comptabilité.
                  </span>
                )}
              </div>

              {!clearanceAllMode && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Tables ciblées :</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 border rounded-lg">
                    {clinicalTablesList
                      .filter(t => selectedTablesToClear[t.key])
                      .map(t => {
                        let count = 0;
                        if (t.key === 'rdv_intensif_2e') {
                          count = dbState.rendezVous ? dbState.rendezVous.filter(r => r.ID_Zone === 4).length : 0;
                        } else if (t.key === 'rdv_intensif_3e') {
                          count = dbState.rendezVous ? dbState.rendezVous.filter(r => r.ID_Zone === 5).length : 0;
                        } else if (t.key === 'rdv_intensif_4e') {
                          count = dbState.rendezVous ? dbState.rendezVous.filter(r => r.ID_Zone === 6).length : 0;
                        } else {
                          count = (dbState[t.key as keyof DatabaseState] as any)?.length || 0;
                        }
                        return (
                          <span key={`targeted-${t.key}`} className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 border border-rose-150 text-rose-700 rounded-lg px-2 py-0.5 shadow-3xs">
                            <span>{t.icon}</span>
                            <span>{t.label} ({count})</span>
                          </span>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t pt-3.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Saisissez <span className="underline font-black text-rose-600"> {clearanceAllMode ? 'VIDER TOUT' : 'CONFIRMER'} </span> pour déverrouiller l&apos;opération :
                </label>
                <input
                  type="text"
                  value={clearanceInputText}
                  onChange={(e) => setClearanceInputText(e.target.value)}
                  placeholder={clearanceAllMode ? "Saisir VIDER TOUT en majuscules" : "Saisir CONFIRMER en majuscules"}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 uppercase"
                />
              </div>

              {clearanceErrorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
                  <span className="text-xs">⚠️</span>
                  <span>{clearanceErrorMsg}</span>
                </div>
              )}
            </div>

            {/* Footer triggers */}
            <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setClearanceModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeClearance}
                disabled={clearanceInputText.trim().toUpperCase() !== (clearanceAllMode ? 'VIDER TOUT' : 'CONFIRMER')}
                className={`px-4 py-2 font-extrabold text-xs text-white rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                  clearanceInputText.trim().toUpperCase() === (clearanceAllMode ? 'VIDER TOUT' : 'CONFIRMER')
                    ? clearanceAllMode
                      ? 'bg-rose-650 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer hover:shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer hover:shadow-sm'
                    : 'bg-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer et Purger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL MAPPING & ALIGNMENT MODAL OVERLAY */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto font-sans" id="excel-mapping-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-250">
            
            {/* Header banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white p-5 px-6 shrink-0 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    Assistant d'Alignement & Importation Excel
                    <span className="text-[10px] bg-indigo-550 font-bold px-2 py-0.5 rounded uppercase">Table {importTarget}</span>
                  </h3>
                  <p className="text-[11px] text-indigo-200 font-semibold mt-0.5">
                    Fichier : <strong className="text-white font-black">{uploadedFileName}</strong> ({excelRows.length} lignes valides détectées)
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsMappingModalOpen(false)}
                className="p-1.5 px-3 bg-white/15 hover:bg-white/20 text-white rounded-lg text-xs font-black transition cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Main body split content */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-50">
              
              {/* LEFT SIDE: TARGET FIELDS (CHAMPS CIBLES) */}
              <div className="lg:col-span-5 p-5 overflow-y-auto space-y-4 max-h-[calc(90vh-130px)]">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    🎯 Champs Cibles ({importTarget === 'patients' ? 'Patients' : importTarget === 'abonnements' ? 'Abonnements' : importTarget === 'praticiens' ? 'Praticiens' : importTarget === 'packs' ? 'Packs' : 'Actes'})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    À gauche, configurez la destination de chaque donnée. Associez chaque champ de notre base à une colonne ou une valeur fixe.
                  </p>
                </div>

                <div className="space-y-3 mt-2">
                  {getTargetFieldsFor(importTarget).map((tgt) => {
                    const currentMappedCol = fieldMappings[tgt.key] || '__none__';
                    return (
                      <div key={tgt.key} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5 transition hover:border-indigo-300">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">
                                {tgt.label}
                              </span>
                              {tgt.required && (
                                <span className="text-[8.5px] font-black bg-rose-50 text-rose-600 border border-rose-100 rounded px-1 py-0.5">
                                  Obligatoire
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                              {tgt.description} <code className="text-slate-400">({tgt.key})</code>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <select
                            className={`w-full text-xs font-semibold rounded-lg p-2 bg-slate-50 border transition ${
                              currentMappedCol === '__none__' 
                                ? tgt.required ? 'border-rose-300 text-rose-700 bg-rose-55/10' : 'border-slate-200 text-slate-450'
                                : currentMappedCol === '__fixed__' ? 'border-indigo-300 text-indigo-700 bg-indigo-55/10' : 'border-emerald-300 text-emerald-800 bg-emerald-55/10'
                            }`}
                            value={currentMappedCol}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldMappings(prev => ({ ...prev, [tgt.key]: val }));
                            }}
                          >
                            <option value="__none__">❌ Ne pas importer / Laisser vide</option>
                            <option value="__fixed__">📌 Valeur constante fixe...</option>
                            {excelHeaders.map(header => (
                              <option key={header} value={header}>
                                📊 Colonne : {header}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* If fixed value option */}
                        {currentMappedCol === '__fixed__' && (
                          <div className="space-y-1 pt-1.5 animate-in fade-in duration-200">
                            <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-600">Saisir une valeur fixe constante</label>
                            <input
                              type={tgt.type === 'number' ? 'number' : tgt.type === 'date' ? 'date' : 'text'}
                              value={fixedValueSettings[tgt.key] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFixedValueSettings(prev => ({ ...prev, [tgt.key]: val }));
                              }}
                              placeholder={`Exemple: ${tgt.example}`}
                              className="w-full text-xs font-bold text-indigo-805 p-2 bg-indigo-50/30 border border-indigo-200 rounded-lg focus:outline-indigo-500 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDE: IMPORTED INFORMATION (INFORMATIONS IMPORTÉES) */}
              <div className="lg:col-span-7 p-5 overflow-y-auto max-h-[calc(90vh-130px)] flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        📊 Informations Importées du Fichier Excel
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Rendu calculé en temps réel avec contrôle de validité et détection intelligente de doublons.
                      </p>
                    </div>
                  </div>

                  {/* DUPLICATE DETECTOR ACTIVE BILLBOARD */}
                  {(() => {
                    let validNum = 0;
                    let dupNum = 0;
                    let emptyNum = 0;

                    excelRows.forEach(row => {
                      if (importTarget === 'patients') {
                        const nom = resolveMappedField(row, 'Nom_Patient').trim();
                        if (!nom) {
                          emptyNum++;
                        } else {
                          const isDup = dbState.patients.some(p => p.Nom_Patient.toLowerCase() === nom.toLowerCase());
                          if (isDup) {
                            dupNum++;
                          } else {
                            validNum++;
                          }
                        }
                      } else if (importTarget === 'actes') {
                        const lib = resolveMappedField(row, 'Libelle_Acte').trim();
                        if (!lib) {
                          emptyNum++;
                        } else {
                          const isDup = dbState.actes.some(a => a.Libelle_Acte.toLowerCase() === lib.toLowerCase());
                          if (isDup) {
                            dupNum++;
                          } else {
                            validNum++;
                          }
                        }
                      } else if (importTarget === 'praticiens') {
                        const nom = resolveMappedField(row, 'Nom_Prat').trim();
                        const prenom = resolveMappedField(row, 'Prenom_Prat').trim();
                        if (!nom || !prenom) {
                          emptyNum++;
                        } else {
                          const isDup = dbState.praticiens.some(p => 
                            p.Nom_Prat.toLowerCase() === nom.toLowerCase() &&
                            p.Prenom_Prat.toLowerCase() === prenom.toLowerCase()
                          );
                          if (isDup) {
                            dupNum++;
                          } else {
                            validNum++;
                          }
                        }
                      } else if (importTarget === 'abonnements') {
                        const patIdStr = resolveMappedField(row, 'ID_Patient').trim();
                        const packIdStr = resolveMappedField(row, 'ID_Pack').trim();
                        const start = resolveMappedField(row, 'Date_Debut_Abn').trim() || new Date().toISOString().split('T')[0];
                        const patId = Number(patIdStr);
                        const packId = Number(packIdStr);

                        if (!patIdStr || !packIdStr || isNaN(patId) || isNaN(packId)) {
                          emptyNum++;
                        } else {
                          const isDup = dbState.abonnements.some(a => 
                            a.ID_Patient === patId && 
                            a.ID_Pack === packId && 
                            a.Date_Debut_Abn === start
                          );
                          if (isDup) {
                            dupNum++;
                          } else {
                            validNum++;
                          }
                        }
                      } else if (importTarget === 'packs') {
                        const lib = resolveMappedField(row, 'Libelle_Pack').trim();
                        if (!lib) {
                          emptyNum++;
                        } else {
                          const isDup = dbState.packs.some(p => p.Libelle_Pack.toLowerCase() === lib.toLowerCase());
                          if (isDup) {
                            dupNum++;
                          } else {
                            validNum++;
                          }
                        }
                      }
                    });

                    return (
                      <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
                        <div className="bg-emerald-50/65 border border-emerald-100 p-2 text-center rounded-lg">
                          <span className="block text-[9px] uppercase font-black tracking-wider text-emerald-800">Prêts à intégrer</span>
                          <span className="text-lg font-black text-emerald-700">{validNum}</span>
                        </div>
                        <div className={`p-2 text-center rounded-lg border ${
                          dupNum > 0 ? 'bg-rose-50/65 border-rose-150 text-rose-800 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          <span className="block text-[9px] uppercase font-black tracking-wider">Doublons détectés</span>
                          <span className="text-lg font-black">{dupNum}</span>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100 p-2 text-center rounded-lg text-amber-800">
                          <span className="block text-[9px] uppercase font-black tracking-wider">Incomplets/Vides</span>
                          <span className="text-lg font-black">{emptyNum}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Translator helper card */}
                  {importTarget === 'patients' && (
                    <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex items-start gap-2.5 shadow-2xs">
                      <input
                        id="auto-translate-excel"
                        type="checkbox"
                        checked={autoTranslateMissingArb}
                        onChange={(e) => setAutoTranslateMissingArb(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-55 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="auto-translate-excel" className="block text-xs font-bold text-slate-800 leading-none mb-1 cursor-pointer">
                          Traduire automatiquement en arabe phonétique (Dictionnaire) 🌍
                        </label>
                        <p className="text-[10px] text-slate-505 leading-normal">
                          Les noms et prénoms français n'ayant pas de traduction explicite dans le fichier Excel seront déduits instantanément.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Simulated Output Preview list */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100/80 p-2 px-3.5 border-b border-slate-200 flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <span>Rendu des 5 premières fiches calculées</span>
                      <span className="text-slate-400">Total : {excelRows.length} lignes</span>
                    </div>

                    <div className="p-3.5 space-y-3 divide-y divide-slate-150">
                      {excelRows.slice(0, 5).map((row, index) => {
                        const isDuplicate = (() => {
                          if (importTarget === 'patients') {
                            const nom = resolveMappedField(row, 'Nom_Patient').trim();
                            return nom ? dbState.patients.some(p => p.Nom_Patient.toLowerCase() === nom.toLowerCase()) : false;
                          } else if (importTarget === 'actes') {
                            const lib = resolveMappedField(row, 'Libelle_Acte').trim();
                            return lib ? dbState.actes.some(a => a.Libelle_Acte.toLowerCase() === lib.toLowerCase()) : false;
                          } else if (importTarget === 'praticiens') {
                            const nom = resolveMappedField(row, 'Nom_Prat').trim();
                            const prenom = resolveMappedField(row, 'Prenom_Prat').trim();
                            return (nom && prenom) ? dbState.praticiens.some(p => 
                              p.Nom_Prat.toLowerCase() === nom.toLowerCase() &&
                              p.Prenom_Prat.toLowerCase() === prenom.toLowerCase()
                            ) : false;
                          } else if (importTarget === 'abonnements') {
                            const patId = Number(resolveMappedField(row, 'ID_Patient'));
                            const packId = Number(resolveMappedField(row, 'ID_Pack'));
                            const start = resolveMappedField(row, 'Date_Debut_Abn').trim() || new Date().toISOString().split('T')[0];
                            return (!isNaN(patId) && !isNaN(packId)) ? dbState.abonnements.some(a => a.ID_Patient === patId && a.ID_Pack === packId && a.Date_Debut_Abn === start) : false;
                          } else if (importTarget === 'packs') {
                            const lib = resolveMappedField(row, 'Libelle_Pack').trim();
                            return lib ? dbState.packs.some(p => p.Libelle_Pack.toLowerCase() === lib.toLowerCase()) : false;
                          }
                          return false;
                        })();

                        const isMissingRequired = (() => {
                          const targets = getTargetFieldsFor(importTarget);
                          return targets.some(t => t.required && !resolveMappedField(row, t.key).trim());
                        })();

                        return (
                          <div key={`import-sheet-row-${importTarget}-${index}`} className="pt-3 first:pt-0 pb-1 text-xs">
                            <div className="flex items-center justify-between font-black text-slate-700 mb-1.5 label text-[11px]">
                              <span>Fiche #{index + 1} du classeur</span>
                              {isMissingRequired ? (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                  ⚠️ Incomplet (Invalide)
                                </span>
                              ) : isDuplicate ? (
                                <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md border border-rose-200">
                                  ⚠️ Doublon Détecté (Sera Ignoré)
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-150">
                                  ✓ Unique (Prêt à Importer)
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 text-slate-650 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 font-medium">
                              {getTargetFieldsFor(importTarget).map((tgt) => {
                                const val = resolveMappedField(row, tgt.key);
                                let showVal: React.ReactNode = val || <span className="text-slate-405 italic font-normal">Non fourni (Vide)</span>;

                                // Auto phonetics translate check
                                if (importTarget === 'patients' && tgt.key === 'Nom_Pat_Arb' && !val && autoTranslateMissingArb) {
                                  const rawName = resolveMappedField(row, 'Nom_Patient');
                                  if (rawName) {
                                    const trans = translateNameToArabic(rawName);
                                    showVal = <span className="text-indigo-650 font-black" dir="rtl">{trans.Nom_Pat_Arb}</span>;
                                  }
                                }
                                if (importTarget === 'patients' && tgt.key === 'Pren_Pat_Arb' && !val && autoTranslateMissingArb) {
                                  const rawName = resolveMappedField(row, 'Nom_Patient');
                                  if (rawName) {
                                    const trans = translateNameToArabic(rawName);
                                    showVal = <span className="text-indigo-650 font-black" dir="rtl">{trans.Pren_Pat_Arb}</span>;
                                  }
                                }

                                return (
                                  <div key={tgt.key} className="text-[11px] truncate">
                                    <span className="text-slate-405 font-semibold block text-[8.5px] uppercase tracking-wide">{tgt.label}</span>
                                    <div className="text-slate-800 font-bold max-w-full truncate">{showVal}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Disclaimer notice */}
                  <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                    <h5 className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">🔒 Dépistage de l'intégrité de la base</h5>
                    <p className="text-[10px] text-slate-550 mt-1 leading-normal font-semibold">
                      Les patients portant un nom de famille identique déjà présent dans la base de données ne seront pas dupliqués par sécurité (fusion automatique).
                    </p>
                  </div>
                </div>

                {/* Confirmations footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMappingModalOpen(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Retour aux options d'import
                  </button>
                  <button
                    type="button"
                    onClick={executeMappingImport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Lancer l'intégration de {excelRows.length} lignes 🚀</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {activeDbSubTab === 'themes' && (
        <div className="p-6 space-y-6 animate-fade-in text-left">
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-slate-200/80 rounded-2xl p-6 text-left space-y-3 shadow-3xs">
            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>Personnalisation Visuelle de la Clinique</span>
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Sélectionnez une ambiance visuelle adaptée à vos écrans et à votre confort au quotidien. Chaque thème modifie l'identité colorimétrique, les contrastes et les bordures de l'ERP pour s'adapter à votre environnement de travail clinique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                id: 'kacel-sante',
                name: 'KACEL Sante (Design Officiel)',
                desc: 'Le design system officiel moderne de la Clinique KACEL, mariant un turquoise teal clinique épuré et des accents charcoal profonds.',
                colors: ['bg-[#00897b]', 'bg-[#e0f2f1]', 'bg-[#263238]'],
                accent: 'teal'
              },
              {
                id: 'doctolib',
                name: 'Bleu Clair Médical',
                desc: 'Ambiance Doctolib épurée, un bleu ciel professionnel et lumineux idéal pour la journée.',
                colors: ['bg-[#005387]', 'bg-sky-100', 'bg-white'],
                accent: 'sky'
              },
              {
                id: 'emerald-clinical',
                name: 'Vert Clair Apaisant',
                desc: 'Teintes émeraude et menthe douces, reposantes pour les yeux et inspirant la sérénité.',
                colors: ['bg-emerald-600', 'bg-emerald-50', 'bg-white'],
                accent: 'emerald'
              },
              {
                id: 'rehab-soft',
                name: 'Rééducation Douce (Or & Lin)',
                desc: 'Le thème signature aux tons lin, ocre doux et or mat. Prestigieux et chaleureux.',
                colors: ['bg-[#306568]', 'bg-[#dfd8ca]', 'bg-white'],
                accent: 'teal'
              },
              {
                id: 'forest-cream',
                name: 'Forêt & Crème',
                desc: 'Un mariage élégant de vert sapin profond et de crème chaleureuse.',
                colors: ['bg-emerald-900', 'bg-amber-50/70', 'bg-white'],
                accent: 'amber'
              },
              {
                id: 'sleek-slate',
                name: 'Ardoise Professionnelle',
                desc: 'Gris ardoise contemporain et neutre pour une lisibilité maximale.',
                colors: ['bg-slate-700', 'bg-slate-50', 'bg-white'],
                accent: 'slate'
              },
              {
                id: 'cosmic-dark',
                name: 'Foncé Cosmique',
                desc: 'Un thème sombre moderne pour réduire la fatigue visuelle lors des sessions tardives.',
                colors: ['bg-indigo-950', 'bg-slate-900', 'bg-slate-800'],
                accent: 'indigo'
              }
            ].map((t) => {
              const isSelected = sleekTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme && onChangeTheme(t.id as any)}
                  className={`relative p-5 rounded-3xl border text-left flex flex-col justify-between gap-4 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                    isSelected
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/20 shadow-md scale-[1.02]'
                      : 'bg-white border-slate-200 hover:border-slate-350 shadow-3xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="block font-sans font-extrabold text-sm text-slate-850">
                      {t.name}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {t.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-1">Palette :</span>
                    {t.colors.map((c, i) => (
                      <span key={i} className={`w-4 h-4 rounded-full border border-slate-200 ${c}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
