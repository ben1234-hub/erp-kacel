import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Database,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Undo2,
  Trash2,
  Check,
  AlertTriangle,
  ClipboardList,
  Download,
  CheckSquare,
  Square,
  User,
  CreditCard,
  Droplets,
  Activity
} from 'lucide-react';
import { 
  Patient, 
  Pack, 
  KinesitherapyAct, 
  GestionAbonnement, 
  BalneotherapieAppointment, 
  KinesitherapyAppointment 
} from '../types';
import * as XLSX from 'xlsx';
import { cleanAlgerianWilaya } from './DatabaseSection';

// Define the 4 sub-modes of import
type ImportMode = 'patients' | 'abonnements' | 'balneo' | 'kine';

interface AdminImportProps {
  patients: Patient[];
  onAddPatient: (pat: Omit<Patient, 'id' | 'date_creation'>) => void;
  onUpdatePatient?: (updated: Patient) => void;
  
  packs?: Pack[];
  acts?: KinesitherapyAct[];
  abonnements?: GestionAbonnement[];
  balneoApps?: BalneotherapieAppointment[];
  kineApps?: KinesitherapyAppointment[];

  // Batch insertion callbacks for maximum efficiency and security
  onAddPatientsBatch?: (newPats: Omit<Patient, 'id' | 'date_creation'>[]) => void;
  onAddAbonnementsBatch?: (newAbos: Omit<GestionAbonnement, 'id' | 'name'>[]) => void;
  onAddBalneoAppsBatch?: (newApps: Omit<BalneotherapieAppointment, 'id' | 'name'>[]) => void;
  onAddKineAppsBatch?: (newApps: Omit<KinesitherapyAppointment, 'id' | 'name'>[]) => void;

  onAddAbonnement?: (newAbo: Omit<GestionAbonnement, 'id' | 'name'>) => void;
  onAddBalneoApp?: (newApp: Omit<BalneotherapieAppointment, 'id' | 'name'>) => void;
  onAddKineApp?: (newApp: Omit<KinesitherapyAppointment, 'id' | 'name'>) => void;
}

interface ParsedRow {
  rowNumber: number;
  selected: boolean;
  isDuplicate: boolean;
  duplicateId?: string;
  rawData: Record<string, any>;
  
  // Decoded values
  patient_name: string; // Used across all modes
  
  // Mode-specific fields
  // 1. Patient Fields
  phone?: string;
  email?: string;
  gender?: 'M' | 'F' | 'Autre';
  age?: number;
  dossier_num?: string;
  pathology?: string;
  nss?: string;
  street?: string;
  city?: string;
  wilaya?: string;
  organisme?: string;
  date_naissance?: string;

  // 2. Abonnement Fields
  pack_name?: string;
  date_debut?: string;
  used_sessions?: number;
  remise_globale?: number;
  date_creation?: string;

  // 3. Appointments Shared Fields
  appointment_date?: string;
  duration?: number;
  state?: 'draft' | 'confirmed' | 'done' | 'canceled';
  paid?: boolean;
  act_name?: string; // Kine specific
}

// Database fields configuration for each mode
const TARGET_FIELDS_CONFIG: Record<ImportMode, { key: string; label: string; desc: string; required: boolean; type: string }[]> = {
  patients: [
    { key: 'name', label: 'Nom & Prénom', desc: 'Identifiant principal du patient', required: true, type: 'Texte' },
    { key: 'phone', label: 'N° de Téléphone', desc: 'Contact mobile du patient', required: false, type: 'Téléphone' },
    { key: 'age', label: 'Âge', desc: 'Âge du patient (détermine enfant/adulte)', required: false, type: 'Nombre' },
    { key: 'gender', label: 'Sexe (Genre)', desc: 'M, F ou Autre (sera normalisé)', required: false, type: 'M/F' },
    { key: 'dossier_num', label: 'N° Dossier', desc: 'Identifiant du dossier clinique papier', required: false, type: 'Texte' },
    { key: 'pathology', label: 'Diagnostic / Motif', desc: 'Pathologie ou motif de rééducation', required: false, type: 'Texte' },
    { key: 'nss', label: 'N° de Sécurite Sociale', desc: 'Numéro NSS ou matricule CNAS', required: false, type: 'Texte' },
    { key: 'city', label: 'Commune / Ville', desc: 'Ville de résidence du patient', required: false, type: 'Texte' },
    { key: 'street', label: 'Adresse / Rue', desc: 'Adresse résidentielle complète', required: false, type: 'Texte' },
    { key: 'wilaya', label: 'Wilaya', desc: 'Nom ou code wilaya', required: false, type: 'Texte' },
    { key: 'organisme', label: 'Caisse Payeur', desc: 'Affiliation mutuelle (CNAS, CASNOS...)', required: false, type: 'Texte' },
    { key: 'date_naissance', label: 'Date de Naissance', desc: 'Date de naissance', required: false, type: 'Date' },
    { key: 'email', label: 'E-mail', desc: 'Contact électronique secondaire', required: false, type: 'E-mail' }
  ],
  abonnements: [
    { key: 'patient_name', label: 'Nom du Patient', desc: 'Nom complet du patient (crée la fiche si inexistant)', required: true, type: 'Texte' },
    { key: 'pack_name', label: 'Nom du Forfait (Pack)', desc: 'Recherche le pack de soins correspondant (ex: Pack Kiné 10 S)', required: true, type: 'Texte' },
    { key: 'date_debut', label: 'Date de Début', desc: 'Date de début de validité de l\'abonnement', required: true, type: 'Date' },
    { key: 'used_sessions', label: 'Séances Consommées', desc: 'Nombre de séances déjà effectuées (Défaut : 0)', required: false, type: 'Nombre' },
    { key: 'remise_globale', label: 'Remise Globale (%)', desc: 'Taux de réduction accordé en pourcentage (Défaut : 0)', required: false, type: 'Nombre' },
    { key: 'date_creation', label: 'Date d\'Abonnement', desc: 'Date de signature du contrat (Sinon prend Date de Début)', required: false, type: 'Date' }
  ],
  balneo: [
    { key: 'patient_name', label: 'Nom du Patient', desc: 'Nom complet du patient bénéficiaire', required: true, type: 'Texte' },
    { key: 'appointment_date', label: 'Date & Heure Séance', desc: 'Date et l\'heure de la séance (ex: 2026-06-03 14:00)', required: true, type: 'Date/Heure' },
    { key: 'duration', label: 'Durée de la séance (h)', desc: 'Durée de traitement en heures (Défaut : 1.0)', required: false, type: 'Nombre' },
    { key: 'state', label: 'Statut de la séance', desc: 'État du rdv (draft, confirmed, done, canceled. Défaut : done)', required: false, type: 'Option' },
    { key: 'paid', label: 'Règlement / Payé', desc: 'La séance est-elle payée ? (Oui/Non, Défaut : Oui)', required: false, type: 'Option' }
  ],
  kine: [
    { key: 'patient_name', label: 'Nom du Patient', desc: 'Nom complet du patient bénéficiaire', required: true, type: 'Texte' },
    { key: 'appointment_date', label: 'Date & Heure RDV', desc: 'Date de la session de rééducation adult (ex: 2026-06-03)', required: true, type: 'Date/Heure' },
    { key: 'act_name', label: 'Acte Pratiqué', desc: 'Nom du soin dispensé (ex: Drainage Lymphatique, Massage...)', required: true, type: 'Texte' },
    { key: 'state', label: 'Statut du rdv', desc: 'État du rdv (draft, confirmed, done, canceled. Défaut : done)', required: false, type: 'Option' },
    { key: 'paid', label: 'Règlement / Payé', desc: 'La séance est-elle payée ? (Oui/Non, Défaut : Oui)', required: false, type: 'Option' }
  ]
};

export default function AdminImport({ 
  patients, 
  onAddPatient, 
  onUpdatePatient,
  packs = [],
  acts = [],
  abonnements = [],
  balneoApps = [],
  kineApps = [],
  onAddPatientsBatch,
  onAddAbonnementsBatch,
  onAddBalneoAppsBatch,
  onAddKineAppsBatch,
  onAddAbonnement,
  onAddBalneoApp,
  onAddKineApp
}: AdminImportProps) {
  const [importMode, setImportMode] = useState<ImportMode>('patients');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'preview' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom interactive states
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [detectedMapping, setDetectedMapping] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'duplicate'>('all');
  const [logs, setLogs] = useState<string[]>([
    'Connexion établie avec la plateforme de stockage clinique KACEL...',
    'Sélectionnez un volet d\'importation et déposez votre fichier de données.',
  ]);
  const [dragActive, setDragActive] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // Fallbacks UI configuration (e.g. choose default pack or default act if sheet is blank or unmapped)
  const [defaultPackId, setDefaultPackId] = useState<string>(packs[0]?.id || '');
  const [defaultActId, setDefaultActId] = useState<string>(acts[0]?.id || '');

  // Advanced Mapping Overrides
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${msg}`]);
  };

  // Map of suggested column headers standard variations depending on database elements
  const HEADER_VARS: Record<string, string[]> = {
    // Shared / Patients
    name: ['nom', 'name', 'patient', 'nom complet', 'nom du patient', 'client', 'patient_name', 'identifiant'],
    patient_name: ['nom', 'name', 'patient', 'nom complet', 'nom du patient', 'client', 'patient_name', 'nom_patient'],
    phone: ['telephone', 'phone', 'tel', 'gsm', 'mobile', 'contact'],
    age: ['age', 'years', 'ans', 'birthday_age'],
    gender: ['sexe', 'gender', 'genre', 'm/f', 'mf'],
    dossier_num: ['dossier', 'n_dossier', 'fiche', 'code_patient', 'code', 'dossier_num', 'dossier_no'],
    pathology: ['diagnostic', 'motif', 'pathologie', 'maladie', 'symptomes', 'pathology'],
    nss: ['nss', 'securite', 'sociale', 'mutuelle_num', 'matricule'],
    city: ['ville', 'commune', 'city', 'adresse_ville', 'residence'],
    street: ['adresse', 'rue', 'street', 'domicile'],
    wilaya: ['wilaya', 'code_wilaya', 'wilaya_id'],
    organisme: ['organisme', 'caisse', 'mutuelle', 'payeur', 'cnas', 'casnos'],
    date_naissance: ['naissance', 'date_naissance', 'birth', 'date of birth', 'dob'],
    email: ['email', 'e-mail', 'courriel', 'mail'],

    // Abo specific
    pack_name: ['forfait', 'pack', 'offre', 'abonn', 'type', 'pack_name', 'contrat', 'service'],
    date_debut: ['debut', 'start', 'date_debut', 'date debut', 'date de debut', 'date_signature'],
    used_sessions: ['seances', 'seance', 'consommee', 'used', 'seances consommees', 'used_sessions', 'consommes'],
    remise_globale: ['remise', 'discount', 'pourcentage', 'reduction', 'remise_globale', 'rabais'],
    date_creation: ['creation', 'date', 'souscription', 'date_creation', 'date contrat'],

    // Apps shared
    appointment_date: ['date', 'rdv', 'heure', 'datetime', 'appointment_date', 'date rdv', 'date du rdv', 'date_heure'],
    duration: ['duree', 'duration', 'temps', 'heure', 'nombre d heure'],
    state: ['statut', 'etat', 'status', 'state', 'phase'],
    paid: ['paye', 'paid', 'regle', 'payement', 'statut de paiement'],
    act_name: ['acte', 'act', 'soin', 'type', 'patho', 'act_name', 'acte recu', 'nomenclature']
  };

  // Helper for soft matching column headers standard variations
  const matchHeader = (headers: string[], possibleNames: string[]): string | undefined => {
    return headers.find(h => {
      const norm = h.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, ""); // strip symbols
      
      return possibleNames.some(p => {
        const pNorm = p.toLowerCase().trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
        return norm === pNorm || norm.includes(pNorm) || pNorm.includes(norm);
      });
    });
  };

  // Download sample CSV templates based on active sub-mode
  const downloadSampleCSV = () => {
    addLog(`Téléchargement de la maquette modèle d'importation pour [${getModeLabel(importMode)}]...`);
    
    let headers: string[] = [];
    let row1: string[] = [];
    let row2: string[] = [];
    let row3: string[] = [];
    let filename = '';

    if (importMode === 'patients') {
      headers = ["Nom Complet", "Telephone", "Sexe (M/F)", "Age", "Diagnostic", "N° Dossier", "NSS", "Ville", "Adresse"];
      row1 = ["Mohamed Soltani", "0550123456", "M", "42", "Lombalgie chronique", "DOS-2026-001", "18216358110", "Alger", "12 Rue Didouche Mourad"];
      row2 = ["Zahra Mansouri", "0661987654", "F", "8", "Rééducation IMC post-opératoire", "DOS-2026-002", "09151234478", "Blida", "Cité des Martyrs"];
      row3 = ["Karim Larbi", "0777445566", "M", "48", "Périarthrite scapulo-humérale", "DOS-2026-003", "", "Mascara", "Bvd de l'Independance"];
      filename = "modele_importation_patients.csv";
    } else if (importMode === 'abonnements') {
      headers = ["Nom Patient", "Forfait", "Date Debut", "Seances Consommees", "Remise %", "Date Souscription"];
      row1 = ["Mohamed Soltani", packs[0]?.name || "Pack Kiné 10 S", "2026-06-01", "3", "10", "2026-06-01"];
      row2 = ["Zahra Mansouri", packs[1]?.name || "Pack Balnéo Aquafit 15 S", "2026-05-15", "0", "0", "2026-05-15"];
      row3 = ["Yacine Kacel", packs[0]?.name || "Pack Kiné 10 S", "2026-06-02", "1", "0", "2026-06-02"];
      filename = "modele_importation_abonnements.csv";
    } else if (importMode === 'balneo') {
      headers = ["Nom Patient", "Date RDV", "Duree (heures)", "Statut", "Paye (Oui/Non)"];
      row1 = ["Mohamed Soltani", "2026-06-03 10:00", "1.0", "done", "Oui"];
      row2 = ["Zahra Mansouri", "2026-06-03 11:30", "1.0", "confirmed", "Non"];
      row3 = ["Karim Larbi", "2026-06-03 15:00", "1.0", "done", "Oui"];
      filename = "modele_importation_historique_balneo.csv";
    } else if (importMode === 'kine') {
      headers = ["Nom Patient", "Date RDV", "Acte Recu", "Statut", "Paye (Oui/Non)"];
      row1 = ["Mohamed Soltani", "2026-06-03 09:00", acts[0]?.name || "Drainage Lymphatique", "done", "Oui"];
      row2 = ["Zahra Mansouri", "2026-06-03 14:00", acts[1]?.name || "Massage Thérapeutique", "done", "Oui"];
      row3 = ["Karim Larbi", "2026-06-03 16:30", acts[0]?.name || "Drainage Lymphatique", "confirmed", "Non"];
      filename = "modele_importation_historique_reeducation.csv";
    }
    
    const content = [headers, row1, row2, row3]
      .map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
      
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`Modèle enregistré sous le nom : "${filename}"`);
  };

  // Helper dictionary keys corresponding to current active Mode
  const getFieldsConfig = () => TARGET_FIELDS_CONFIG[importMode];

  const getModeLabel = (mode: ImportMode) => {
    switch(mode) {
      case 'patients': return "Fiches Patients";
      case 'abonnements': return "Abonnements / Forfaits";
      case 'balneo': return "Historique Séances Balnéothérapie";
      case 'kine': return "Historique Rééducation Adulte (Kiné)";
    }
  };

  // Normalize excel outputs to structured JSON
  const parseRowsWithMapping = (
    headers: string[], 
    rows: any[][], 
    mapping: Record<string, string>
  ): ParsedRow[] => {
    // Index mapping
    const getIdx = (key: string) => headers.indexOf(mapping[key] || '');

    const nameIdx = getIdx(importMode === 'patients' ? 'name' : 'patient_name');
    const phoneIdx = getIdx('phone');
    const emailIdx = getIdx('email');
    const genderIdx = getIdx('gender');
    const ageIdx = getIdx('age');
    const dossierIdx = getIdx('dossier_num');
    const pathologyIdx = getIdx('pathology');
    const nssIdx = getIdx('nss');
    const streetIdx = getIdx('street');
    const cityIdx = getIdx('city');
    const wilayaIdx = getIdx('wilaya');
    const organismeIdx = getIdx('organisme');
    const birthIdx = getIdx('date_naissance');

    // Subscription mapping indexes
    const packNameIdx = getIdx('pack_name');
    const dateDebutIdx = getIdx('date_debut');
    const usedSessionsIdx = getIdx('used_sessions');
    const remiseGlobaleIdx = getIdx('remise_globale');
    const dateCreationIdx = getIdx('date_creation');

    // Appointment mapping indexes
    const appDateIdx = getIdx('appointment_date');
    const durationIdx = getIdx('duration');
    const stateIdx = getIdx('state');
    const paidIdx = getIdx('paid');
    const actNameIdx = getIdx('act_name');

    const itemsToImport: ParsedRow[] = [];
    
    // Loop through the records matrix, skipping header (index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const rawName = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx] || '').trim() : '';
      if (!rawName) continue; // Skip blank patient names

      // Parse fields
      const rawPhone = phoneIdx !== -1 && row[phoneIdx] !== undefined ? String(row[phoneIdx] || '').trim() : '';
      const rawEmail = emailIdx !== -1 && row[emailIdx] !== undefined ? String(row[emailIdx] || '').trim() : '';
      const rawGenderVal = genderIdx !== -1 && row[genderIdx] !== undefined ? String(row[genderIdx] || '').trim().toLowerCase() : '';
      const rawAgeVal = ageIdx !== -1 && row[ageIdx] !== undefined ? parseInt(String(row[ageIdx]), 10) : 35;
      
      const dossierNum = dossierIdx !== -1 && row[dossierIdx] !== undefined ? String(row[dossierIdx] || '').trim() : '';
      const pathology = pathologyIdx !== -1 && row[pathologyIdx] !== undefined ? String(row[pathologyIdx] || '').trim() : 'Rééducation';
      const nss = nssIdx !== -1 && row[nssIdx] !== undefined ? String(row[nssIdx] || '').trim() : '';
      const street = streetIdx !== -1 && row[streetIdx] !== undefined ? String(row[streetIdx] || '').trim() : '';
      const rawWilaya = wilayaIdx !== -1 && row[wilayaIdx] !== undefined ? String(row[wilayaIdx] || '').trim() : '';
      const cleanedWilaya = cleanAlgerianWilaya(rawWilaya);
      const wilaya = cleanedWilaya.code;
      
      let city = cityIdx !== -1 && row[cityIdx] !== undefined ? String(row[cityIdx] || '').trim() : '';
      if (!city && cleanedWilaya.detectedCity) {
        city = cleanedWilaya.detectedCity;
      }
      const organisme = organismeIdx !== -1 && row[organismeIdx] !== undefined ? String(row[organismeIdx] || '').trim() : '';
      const birthDate = birthIdx !== -1 && row[birthIdx] !== undefined ? String(row[birthIdx] || '').trim() : '';

      // Mode-specific fields extraction
      const rawPackName = packNameIdx !== -1 && row[packNameIdx] !== undefined ? String(row[packNameIdx] || '').trim() : '';
      const dateDebut = dateDebutIdx !== -1 && row[dateDebutIdx] !== undefined ? String(row[dateDebutIdx] || '').trim() : new Date().toISOString().split('T')[0];
      const usedSessions = usedSessionsIdx !== -1 && row[usedSessionsIdx] !== undefined ? parseInt(String(row[usedSessionsIdx] || '0'), 10) : 0;
      const remiseGlobale = remiseGlobaleIdx !== -1 && row[remiseGlobaleIdx] !== undefined ? parseFloat(String(row[remiseGlobaleIdx] || '0')) : 0;
      const dateCreation = dateCreationIdx !== -1 && row[dateCreationIdx] !== undefined ? String(row[dateCreationIdx] || '').trim() : dateDebut;

      // RDV
      const rawAppDate = appDateIdx !== -1 && row[appDateIdx] !== undefined ? String(row[appDateIdx] || '').trim() : new Date().toISOString().replace('Z', '').substring(0, 16);
      const rawDuration = durationIdx !== -1 && row[durationIdx] !== undefined ? parseFloat(String(row[durationIdx] || '1.0')) : 1.0;
      const rawStateVal = stateIdx !== -1 && row[stateIdx] !== undefined ? String(row[stateIdx] || '').trim().toLowerCase() : 'done';
      
      const rawPaidVal = paidIdx !== -1 && row[paidIdx] !== undefined ? String(row[paidIdx] || '').trim().toLowerCase() : 'oui';
      const rawActName = actNameIdx !== -1 && row[actNameIdx] !== undefined ? String(row[actNameIdx] || '').trim() : '';

      // Normalize gender
      let gender: 'M' | 'F' | 'Autre' = 'M';
      if (rawGenderVal.startsWith('f') || rawGenderVal === 'femme' || rawGenderVal === 'female' || rawGenderVal === 'w' || rawGenderVal === 'fille') {
        gender = 'F';
      } else if (rawGenderVal.startsWith('a') || rawGenderVal === 'autre' || rawGenderVal === 'other') {
        gender = 'Autre';
      }

      // Convert paid value
      const paid = !(rawPaidVal === 'non' || rawPaidVal === 'no' || rawPaidVal === 'false' || rawPaidVal === '0');

      // Convert appointment state
      let state: 'draft' | 'confirmed' | 'done' | 'canceled' = 'done';
      if (rawStateVal === 'brouillon' || rawStateVal === 'draft') state = 'draft';
      else if (rawStateVal === 'confirme' || rawStateVal === 'confirmed' || rawStateVal === 'valide') state = 'confirmed';
      else if (rawStateVal === 'annule' || rawStateVal === 'canceled' || rawStateVal === 'cancelled') state = 'canceled';

      // Check duplicate existence checks
      const nameNormalized = rawName.toLowerCase().trim().replace(/\s+/g, '');
      let isDuplicate = false;
      let duplicateId: string | undefined = undefined;

      if (importMode === 'patients') {
        const existingPat = patients.find(p => p.name.toLowerCase().trim().replace(/\s+/g, '') === nameNormalized);
        isDuplicate = !!existingPat;
        duplicateId = existingPat?.id;
      } else if (importMode === 'abonnements') {
        const existingAbo = abonnements.find(a => {
          const pat = patients.find(p => p.id === a.patient_id);
          return pat && pat.name.toLowerCase().trim().replace(/\s+/g, '') === nameNormalized && a.date_debut === dateDebut;
        });
        isDuplicate = !!existingAbo;
        duplicateId = existingAbo?.id;
      } else if (importMode === 'balneo') {
        const existingBal = balneoApps.find(b => {
          // Check if appointment on same date & patient
          if (b.appointment_date.substring(0, 10) !== rawAppDate.substring(0, 10)) return false;
          return b.patients.some(pLine => {
            const patObj = patients.find(p => p.id === pLine.patient_id);
            return patObj && patObj.name.toLowerCase().trim().replace(/\s+/g, '') === nameNormalized;
          });
        });
        isDuplicate = !!existingBal;
        duplicateId = existingBal?.id;
      } else if (importMode === 'kine') {
        const existingKin = kineApps.find(k => {
          if (k.appointment_date.substring(0, 10) !== rawAppDate.substring(0, 10)) return false;
          return k.selected_acts.some(aLine => {
            const patObj = patients.find(p => p.id === aLine.patient_id);
            return patObj && patObj.name.toLowerCase().trim().replace(/\s+/g, '') === nameNormalized;
          });
        });
        isDuplicate = !!existingKin;
        duplicateId = existingKin?.id;
      }

      itemsToImport.push({
        rowNumber: i + 1,
        selected: true,
        isDuplicate,
        duplicateId,
        rawData: row,

        patient_name: rawName,
        phone: rawPhone,
        email: rawEmail,
        gender,
        age: isNaN(rawAgeVal) ? 35 : rawAgeVal,
        dossier_num: dossierNum,
        pathology,
        nss,
        street,
        city,
        wilaya,
        organisme,
        date_naissance: birthDate,

        pack_name: rawPackName,
        date_debut: dateDebut,
        used_sessions: usedSessions,
        remise_globale: isNaN(remiseGlobale) ? 0 : remiseGlobale,
        date_creation: dateCreation,

        appointment_date: rawAppDate,
        duration: isNaN(rawDuration) ? 1.0 : rawDuration,
        state,
        paid,
        act_name: rawActName
      });
    }

    return itemsToImport;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      setImportStatus('error');
      setErrorMessage("Format de fichier non pris en charge. Veuillez fournir un fichier Excel (.xlsx, .xls) ou un fichier texte (.csv).");
      addLog(`[ERREUR] Le format de fichier ".${extension}" n'est pas autorisé.`);
      return;
    }

    setFileName(file.name);
    // Format file size
    const kb = (file.size / 1024).toFixed(1);
    setFileSize(`${kb} KB`);
    setImportStatus('loading');
    addLog(`Analyse en cours de ${file.name} (${kb} KB)...`);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        
        if (extension === 'csv') {
          // Parse CSV
          const text = new TextDecoder('utf-8').decode(new Uint8Array(data as ArrayBuffer));
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          // Parse Binary Excel
          const bytes = new Uint8Array(data as ArrayBuffer);
          workbook = XLSX.read(bytes, { type: 'array' });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON 2D Array
        const jsonRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
        
        if (jsonRows.length < 2) {
          setImportStatus('error');
          setErrorMessage("Le document ne possède aucun registre ou uniquement des en-têtes.");
          addLog("[ERREUR CRITIQUE] Lignes insuffisantes détectées.");
          return;
        }

        const headers = (jsonRows[0] as string[]).map(h => String(h || '').trim());
        setExcelHeaders(headers);
        setRawRows(jsonRows);

        // Smart Mapping heuristic
        const mapping: Record<string, string> = {};
        getFieldsConfig().forEach(field => {
          const vars = HEADER_VARS[field.key] || [field.key];
          const matched = matchHeader(headers, vars);
          if (matched) {
            mapping[field.key] = matched;
          }
        });

        setDetectedMapping(mapping);
        addLog(`Document analysé avec succès. ${jsonRows.length - 1} lignes d'enregistrements lues.`);
        
        const parsed = parseRowsWithMapping(headers, jsonRows, mapping);
        setParsedRows(parsed);
        setImportStatus('preview');
        
      } catch (err: any) {
        setImportStatus('error');
        setErrorMessage(`Décodage échoué : ${err.message || "Erreur interne"}`);
        addLog(`[ECHEC BANCAIRE/FORMAT] ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (fieldKey: string, excelHeaderName: string) => {
    const nextMapping = { ...detectedMapping, [fieldKey]: excelHeaderName };
    setDetectedMapping(nextMapping);
    
    const freshlyParsed = parseRowsWithMapping(excelHeaders, rawRows, nextMapping);
    setParsedRows(freshlyParsed);
    addLog(`Redirection : Le champ clinique [${fieldKey}] recevra désormais la colonne Excel [${excelHeaderName || 'Laisser à blanc'}].`);
  };

  const getSampleValueForHeader = (headerName: string) => {
    if (!headerName || !excelHeaders.includes(headerName) || rawRows.length <= 1) return null;
    const colIndex = excelHeaders.indexOf(headerName);
    if (colIndex === -1) return null;

    for (let r = 1; r < rawRows.length; r++) {
      const cellVal = rawRows[r][colIndex];
      if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
        return String(cellVal).trim();
      }
    }
    return null;
  };

  const toggleSelectRow = (index: number) => {
    setParsedRows(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAll = () => {
    const displayedRows = getFilteredRows();
    const allSelected = displayedRows.every(r => r.selected);
    
    setParsedRows(prev => prev.map(item => {
      const isDisplayed = displayedRows.some(dr => dr.rowNumber === item.rowNumber);
      if (isDisplayed) {
        return { ...item, selected: !allSelected };
      }
      return item;
    }));
  };

  const getFilteredRows = () => {
    return parsedRows.filter(p => {
      const pName = p.patient_name || '';
      const matchSearch = pName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.phone && p.phone.includes(searchTerm)) || 
                          (p.pathology && p.pathology.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchSearch) return false;

      if (activeFilter === 'new') return !p.isDuplicate;
      if (activeFilter === 'duplicate') return p.isDuplicate;
      return true;
    });
  };

  // EXECUTE FINAL COMMIT TO DATABASE
  const handleCommitImport = () => {
    const selectedToImport = parsedRows.filter(p => p.selected);
    if (selectedToImport.length === 0) {
      alert("Veuillez cocher au moins une ligne à importer.");
      return;
    }

    // Safety checks
    if (importMode === 'patients' && !detectedMapping.name) {
      alert("Mappage obligatoire requis: Nom & Prénom.");
      return;
    }
    if (importMode !== 'patients' && !detectedMapping.patient_name) {
      alert("Mappage obligatoire requis: Nom du Patient.");
      return;
    }

    setImportStatus('loading');
    addLog(`Écriture en lot lancée pour ${selectedToImport.length} entrées...`);

    // We simulate database writing and trigger bulk/batch inserts for seamless reactivity
    setTimeout(() => {
      try {
        if (importMode === 'patients') {
          const listToAdd: Omit<Patient, 'id' | 'date_creation'>[] = [];
          selectedToImport.forEach(p => {
            if (p.isDuplicate && duplicateStrategy === 'update' && p.duplicateId && onUpdatePatient) {
              const orig = patients.find(exist => exist.id === p.duplicateId);
              if (orig) {
                onUpdatePatient({
                  ...orig,
                  phone: p.phone || orig.phone,
                  email: p.email || orig.email,
                  age: p.age || orig.age,
                  gender: p.gender || orig.gender,
                  dossier_num: p.dossier_num || orig.dossier_num,
                  pathology: p.pathology || orig.pathology,
                  nss: p.nss || orig.nss,
                  street: p.street || orig.street,
                  city: p.city || orig.city,
                  wilaya: p.wilaya || orig.wilaya,
                  organisme: p.organisme || orig.organisme,
                  date_naissance: p.date_naissance || orig.date_naissance
                });
              }
            } else if (!p.isDuplicate) {
              listToAdd.push({
                name: p.patient_name,
                phone: p.phone || '',
                email: p.email || '',
                gender: p.gender || 'M',
                age: p.age || 35,
                dossier_num: p.dossier_num || undefined,
                pathology: p.pathology || undefined,
                nss: p.nss || undefined,
                street: p.street || undefined,
                city: p.city || undefined,
                wilaya: p.wilaya || undefined,
                organisme: p.organisme || undefined,
                date_naissance: p.date_naissance || undefined,
                type_patient: (p.age && p.age < 15) ? 'enfant' : 'adulte'
              });
            }
          });

          if (listToAdd.length > 0) {
            if (onAddPatientsBatch) {
              onAddPatientsBatch(listToAdd);
            } else {
              listToAdd.forEach(p => onAddPatient(p));
            }
          }
          addLog(`Sauvegarde achevée : ${listToAdd.length} patients ajoutés.`);

        } else if (importMode === 'abonnements') {
          // Pre-register non-existent patients, update their IDs cache
          const patientsMap = { ...patients.reduce((acc, current) => ({ ...acc, [current.name.toLowerCase().trim().replace(/\s+/g, '')]: current.id }), {} as Record<string, string>) };
          const patientsToAdd: Omit<Patient, 'id' | 'date_creation'>[] = [];

          selectedToImport.forEach(p => {
            const normalizedName = p.patient_name.toLowerCase().trim().replace(/\s+/g, '');
            if (!patientsMap[normalizedName]) {
              const tempId = `pat-temp-${Date.now()}-${Math.random()}`; // will be overridden inside patients batch insert
              patientsMap[normalizedName] = tempId;
              patientsToAdd.push({
                name: p.patient_name,
                phone: '',
                email: '',
                gender: 'M',
                age: 35,
                type_patient: 'adulte'
              });
            }
          });

          // Add missing patients in bulk first
          if (patientsToAdd.length > 0 && onAddPatientsBatch) {
            onAddPatientsBatch(patientsToAdd);
          } else if (patientsToAdd.length > 0) {
            patientsToAdd.forEach(p => onAddPatient(p));
          }

          // Generate abonnements rows
          const abosToAdd: Omit<GestionAbonnement, 'id' | 'name'>[] = [];
          
          // Refresh patients query after creating them
          const currentPatientsList = [...patients];

          selectedToImport.forEach(p => {
            const normalizedName = p.patient_name.toLowerCase().trim().replace(/\s+/g, '');
            // Attempt to retrieve original patient ID, fallback to newly created or generated IDs
            let patientId = currentPatientsList.find(c => c.name.toLowerCase().trim().replace(/\s+/g, '') === normalizedName)?.id || patientsMap[normalizedName];
            
            if (!patientId || patientId.startsWith('pat-temp-')) {
              // Match by timestamp simulation if newly created, or fallback to first patient ID
              patientId = `pat-${Date.now()}`;
            }

            // Find matching pack by name
            const matchingPack = packs.find(pk => pk.name.toLowerCase().trim().replace(/\s+/g, '').includes(p.pack_name?.toLowerCase().trim().replace(/\s+/g, '') || 'xyz_notfound'));
            const finalPackId = matchingPack?.id || defaultPackId || packs[0]?.id || 'pack-1';

            abosToAdd.push({
              patient_id: patientId,
              pack_id: finalPackId,
              used_sessions: p.used_sessions || 0,
              remise_globale: p.remise_globale || 0,
              date_debut: p.date_debut || new Date().toISOString().split('T')[0],
              date: p.date_creation || new Date().toISOString().split('T')[0]
            });
          });

          if (abosToAdd.length > 0) {
            if (onAddAbonnementsBatch) {
              onAddAbonnementsBatch(abosToAdd);
            } else if (onAddAbonnement) {
              abosToAdd.forEach(a => onAddAbonnement(a));
            }
          }
          addLog(`Sauvegarde achevée : ${abosToAdd.length} contrats d'abonnement intégrés aux patients.`);

        } else if (importMode === 'balneo') {
          // Pre-register missing patients
          const patientsMap = { ...patients.reduce((acc, current) => ({ ...acc, [current.name.toLowerCase().trim().replace(/\s+/g, '')]: current.id }), {} as Record<string, string>) };
          const patientsToAdd: Omit<Patient, 'id' | 'date_creation'>[] = [];

          selectedToImport.forEach(p => {
            const normalizedName = p.patient_name.toLowerCase().trim().replace(/\s+/g, '');
            if (!patientsMap[normalizedName]) {
              patientsMap[normalizedName] = `pat-temp-${Date.now()}`;
              patientsToAdd.push({
                name: p.patient_name,
                phone: '',
                email: '',
                gender: 'M',
                age: 35,
                type_patient: 'adulte'
              });
            }
          });

          if (patientsToAdd.length > 0) {
            if (onAddPatientsBatch) onAddPatientsBatch(patientsToAdd);
            else patientsToAdd.forEach(p => onAddPatient(p));
          }

          const balneoToAdd: Omit<BalneotherapieAppointment, 'id' | 'name'>[] = [];
          const currentPatientsList = [...patients];

          selectedToImport.forEach(p => {
            const normalizedName = p.patient_name.toLowerCase().trim().replace(/\s+/g, '');
            const patientId = currentPatientsList.find(c => c.name.toLowerCase().trim().replace(/\s+/g, '') === normalizedName)?.id || patientsMap[normalizedName] || `pat-${Date.now()}`;

            balneoToAdd.push({
              appointment_date: p.appointment_date || new Date().toISOString().replace('Z', '').substring(0, 16),
              duration: p.duration || 1.0,
              state: p.state || 'done',
              patients: [
                { patient_id: patientId, paid: p.paid !== undefined ? p.paid : true }
              ]
            });
          });

          if (balneoToAdd.length > 0) {
            if (onAddBalneoAppsBatch) {
              onAddBalneoAppsBatch(balneoToAdd);
            } else if (onAddBalneoApp) {
              balneoToAdd.forEach(b => onAddBalneoApp(b));
            }
          }
          addLog(`Sauvegarde achevée : ${balneoToAdd.length} séances de balnéothérapie importées dans l'historique.`);

        } else if (importMode === 'kine') {
          // Pre-register missing patients
          const patientsMap = { ...patients.reduce((acc, current) => ({ ...acc, [current.name.toLowerCase().trim().replace(/\s+/g, '')]: current.id }), {} as Record<string, string>) };
          const patientsToAdd: Omit<Patient, 'id' | 'date_creation'>[] = [];

          selectedToImport.forEach(p => {
            const normalizedName = p.patient_name.toLowerCase().trim().replace(/\s+/g, '');
            if (!patientsMap[normalizedName]) {
              patientsMap[normalizedName] = `pat-temp-${Date.now()}`;
              patientsToAdd.push({
                name: p.patient_name,
                phone: '',
                email: '',
                gender: 'M',
                age: 35,
                type_patient: 'adulte'
              });
            }
          });

          if (patientsToAdd.length > 0) {
            if (onAddPatientsBatch) onAddPatientsBatch(patientsToAdd);
            else patientsToAdd.forEach(p => onAddPatient(p));
          }

          const kineToAdd: Omit<KinesitherapyAppointment, 'id' | 'name'>[] = [];
          const currentPatientsList = [...patients];

          selectedToImport.forEach((p, idx) => {
            const normalizedName = p.patient_name.toLowerCase().trim().replace(/\s+/g, '');
            const patientId = currentPatientsList.find(c => c.name.toLowerCase().trim().replace(/\s+/g, '') === normalizedName)?.id || patientsMap[normalizedName] || `pat-${Date.now()}`;

            // Match act by name or fallback to default
            const matchingAct = acts.find(a => a.name.toLowerCase().trim().includes(p.act_name?.toLowerCase().trim() || 'xyz_notfound'));
            const finalActId = matchingAct?.id || defaultActId || acts[0]?.id || 'act-1';

            kineToAdd.push({
              appointment_date: p.appointment_date || new Date().toISOString().replace('Z', '').substring(0, 16),
              state: p.state || 'done',
              selected_acts: [
                { 
                  id: `sa-import-${Date.now()}-${idx}`, 
                  act_id: finalActId, 
                  patient_id: patientId, 
                  paid: p.paid !== undefined ? p.paid : true 
                }
              ]
            });
          });

          if (kineToAdd.length > 0) {
            if (onAddKineAppsBatch) {
              onAddKineAppsBatch(kineToAdd);
            } else if (onAddKineApp) {
              kineToAdd.forEach(k => onAddKineApp(k));
            }
          }
          addLog(`Sauvegarde achevée : ${kineToAdd.length} séances de rééducation adulte enregistrées.`);
        }

        setImportStatus('success');
      } catch (err: any) {
        setImportStatus('error');
        setErrorMessage(`Erreur technique d'écriture : ${err.message || 'Interrompue.'}`);
        addLog(`[ECHEC CLINIQUE] Écriture annulée.`);
      }
    }, 1205);
  };

  // Launch pre-seeded quick simulations to help the administrator understand mapping
  const handleSimulateImport = () => {
    setImportStatus('loading');
    addLog(`Démarrage d'un test d'importation assistée pour : [${getModeLabel(importMode)}]...`);
    
    setTimeout(() => {
      let mockHeaders: string[] = [];
      let mockRows: any[][] = [];
      let mockMapping: Record<string, string> = {};

      if (importMode === 'patients') {
        mockHeaders = ['Nom Complet', 'Numéro de Tél', 'Âge', 'Sexe', 'Diagnostic', 'Caisse Mutuelle', 'Ville de Résidence'];
        mockRows = [
          mockHeaders,
          ['Amar Benkhedda', '0550123456', '45', 'M', 'Lombalgie chronique', 'CNAS', 'Alger Centre'],
          ['Zahra Mansouri', '0661987654', '8', 'F', 'Rééducation IMC Post-Op', 'CASNOS', 'Blida Centre']
        ];
        mockMapping = {
          name: 'Nom Complet',
          phone: 'Numéro de Tél',
          age: 'Âge',
          gender: 'Sexe',
          pathology: 'Diagnostic',
          organisme: 'Caisse Mutuelle',
          city: 'Ville de Résidence'
        };
      } else if (importMode === 'abonnements') {
        mockHeaders = ['Abonné', 'Forfait de soins', 'Début contrat', 'Séances déjà passées', 'Remise %', 'Date création'];
        mockRows = [
          mockHeaders,
          ['Amar Benkhedda', packs[0]?.name || 'Pack Kiné 10 S', '2026-06-01', '4', '15', '2026-06-01'],
          ['Zahra Mansouri', packs[1]?.name || 'Pack Balnéo Aquafit 15 S', '2026-05-15', '0', '0', '2026-05-15']
        ];
        mockMapping = {
          patient_name: 'Abonné',
          pack_name: 'Forfait de soins',
          date_debut: 'Début contrat',
          used_sessions: 'Séances déjà passées',
          remise_globale: 'Remise %',
          date_creation: 'Date création'
        };
      } else if (importMode === 'balneo') {
        mockHeaders = ['Patient de soin', 'Jour et Heure', 'Durée séance', 'Statut session', 'Payement effectué'];
        mockRows = [
          mockHeaders,
          ['Amar Benkhedda', '2026-06-03 10:00', '1.0', 'done', 'Oui'],
          ['Zahra Mansouri', '2026-06-03 14:30', '1.0', 'confirmed', 'Non']
        ];
        mockMapping = {
          patient_name: 'Patient de soin',
          appointment_date: 'Jour et Heure',
          duration: 'Durée séance',
          state: 'Statut session',
          paid: 'Payement effectué'
        };
      } else if (importMode === 'kine') {
        mockHeaders = ['Bénéficiaire', 'Date du Rdv', 'Acte dispensé', 'État rdv', 'Règlement séance'];
        mockRows = [
          mockHeaders,
          ['Amar Benkhedda', '2026-06-03 09:30', acts[0]?.name || 'Drainage Lymphatique', 'done', 'Oui'],
          ['Zahra Mansouri', '2026-06-03 11:00', acts[1]?.name || 'Massage Thérapeutique', 'done', 'Oui']
        ];
        mockMapping = {
          patient_name: 'Bénéficiaire',
          appointment_date: 'Date du Rdv',
          act_name: 'Acte dispensé',
          state: 'État rdv',
          paid: 'Règlement séance'
        };
      }

      setExcelHeaders(mockHeaders);
      setRawRows(mockRows);
      setDetectedMapping(mockMapping);
      
      const parsed = parseRowsWithMapping(mockHeaders, mockRows, mockMapping);
      setParsedRows(parsed);

      setFileName(`simulation_import_${importMode}.xlsx`);
      setFileSize('14 KB');
      setImportStatus('preview');
      addLog(`[SIMULATION] Analyse de la structure complétée. Prêt pour l'importation de test.`);
    }, 1000);
  };

  const handleReset = () => {
    setFileName('');
    setFileSize('');
    setParsedRows([]);
    setExcelHeaders([]);
    setRawRows([]);
    setDetectedMapping({});
    setErrorMessage('');
    setImportStatus('idle');
    addLog(`Session réinitialisée. Prêt pour un nouveau chargement [${getModeLabel(importMode)}].`);
  };

  // Change Import tab mode with full clear
  const handleModeChange = (mode: ImportMode) => {
    setImportMode(mode);
    setFileName('');
    setFileSize('');
    setParsedRows([]);
    setExcelHeaders([]);
    setRawRows([]);
    setDetectedMapping({});
    setErrorMessage('');
    setImportStatus('idle');
    setLogs([
      `Mode sélectionné : ${getModeLabel(mode)}.`,
      `En attente d'un document ou d'une simulation...`
    ]);
  };

  const displayedRows = getFilteredRows();
  const allSelected = displayedRows.length > 0 && displayedRows.every(r => r.selected);
  const someSelected = displayedRows.some(r => r.selected) && !allSelected;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" id="admin-import-panel">
      
      {/* Dynamic Sub-tab Switcher styled premiumly */}
      <div className="bg-slate-100 rounded-3xl p-2.5 flex flex-wrap gap-2 border border-slate-200">
        <button 
          onClick={() => handleModeChange('patients')}
          className={`flex-1 min-w-[150px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all focus:outline-none cursor-pointer ${
            importMode === 'patients' 
              ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          Fiches Patients
        </button>
        <button 
          onClick={() => handleModeChange('abonnements')}
          className={`flex-1 min-w-[150px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all focus:outline-none cursor-pointer ${
            importMode === 'abonnements' 
              ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Abonnements
        </button>
        <button 
          onClick={() => handleModeChange('balneo')}
          className={`flex-1 min-w-[150px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all focus:outline-none cursor-pointer ${
            importMode === 'balneo' 
              ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Droplets className="w-4 h-4" />
          Hist. Balnéothérapie
        </button>
        <button 
          onClick={() => handleModeChange('kine')}
          className={`flex-1 min-w-[150px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all focus:outline-none cursor-pointer ${
            importMode === 'kine' 
              ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Hist. Rééducation Adulte
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500 font-mono">Console d'Administration BDD</h3>
                <h2 className="text-3xl font-black tracking-tight leading-none mt-1">
                  IMPORTATION : {getModeLabel(importMode).toUpperCase()}
                </h2>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Outil intelligent de synchronisation. Importez, mappez vos colonnes et intégrez instantanément vos registres au format Excel (.xlsx, .xls) ou CSV pour enrichir vos archives.
            </p>
          </div>

          <div className="shrink-0">
             <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-4 min-w-[240px]">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <Database className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Total Actuel en base</p>
                      <p className="text-2xl font-black text-white">
                        {importMode === 'patients' && patients.length}
                        {importMode === 'abonnements' && abonnements.length}
                        {importMode === 'balneo' && balneoApps.length}
                        {importMode === 'kine' && kineApps.length}
                      </p>
                   </div>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div className="flex gap-2">
                  <button 
                    onClick={downloadSampleCSV}
                    className="flex-1 bg-white/10 hover:bg-white/25 text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Modèle CSV
                  </button>
                  <button 
                    onClick={handleSimulateImport}
                    disabled={importStatus === 'loading'}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Simulation
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Mode Fallbacks Panel */}
      {importMode === 'abonnements' && packs.length > 0 && (
        <div className="bg-indigo-50/20 border border-indigo-100 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-indigo-950 uppercase">Forfait de repli par défaut</p>
              <p className="text-[11px] text-slate-500">Utilisé si l'offre déclarée dans votre fichier Excel ne correspond à aucun pack existant.</p>
            </div>
          </div>
          <select 
            value={defaultPackId}
            onChange={(e) => setDefaultPackId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 shadow-xs"
          >
            {packs.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.nombre_seance}S - {p.amount} DA)</option>
            ))}
          </select>
        </div>
      )}

      {importMode === 'kine' && acts.length > 0 && (
        <div className="bg-indigo-50/20 border border-indigo-100 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-indigo-950 uppercase">Acte de soin de repli par défaut</p>
              <p className="text-[11px] text-slate-500">Utilisé si l'acte déclaré dans votre fichier Excel ne correspond à aucun acte clinique de kinésithérapie enregistré.</p>
            </div>
          </div>
          <select 
            value={defaultActId}
            onChange={(e) => setDefaultActId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 shadow-xs"
          >
            {acts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Guide */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-3xl border border-slate-150 p-6">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider">Guide de correspondance des fichiers ({getModeLabel(importMode)})</h4>
              <p className="text-xs text-slate-500 font-medium font-sans">Comment lier les informations pour éviter de doubler ou de fausser les données.</p>
            </div>
          </div>
          {showGuide ? <ChevronUp className="w-5 h-5 text-indigo-900" /> : <ChevronDown className="w-5 h-5 text-indigo-900" />}
        </button>

        {showGuide && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                <span className="text-xs font-black text-indigo-600 font-mono">01. CHAMPS RÉCEPTEURS</span>
                <p className="leading-relaxed text-slate-500">
                  À gauche, nos structures de stockage exigent des données vitales (comme le Nom du Patient ou les Dates). C'est le récepteur final de notre base de données.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                <span className="text-xs font-black text-indigo-600 font-mono">02. RECONNAISSANCE FACILITÉE</span>
                <p className="leading-relaxed text-slate-500">
                  Notre algorithme scanne les mots clés de la première ligne d'Excel (ex: 'Règlement' pour le champ 'Payé') pour lier l'en-tête automatiquement sans action requise.
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-2">
                <span className="text-xs font-black text-indigo-600 font-mono">03. CRÉATION AUTOMATIQUE DES DOSSIERS</span>
                <p className="leading-relaxed text-slate-500">
                  Important: lors de l'import des Abonnements ou de l'Historique, notre outil vérifie si le patient existe. S'il n'existe pas, sa fiche est créée de manière transparente !
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {importStatus === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Dropzone Area */}
           <div 
             onDragEnter={handleDrag}
             onDragOver={handleDrag}
             onDragLeave={handleDrag}
             onDrop={handleDrop}
             onClick={() => fileInputRef.current?.click()}
             className={`bg-white border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-6 hover:border-indigo-400 transition-colors group cursor-pointer relative overflow-hidden min-h-[340px] ${
               dragActive ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200'
             }`}
           >
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden" 
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity justify-center pt-10" />
              <div className="relative z-10 w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all shadow-inner">
                 <FileSpreadsheet className="w-10 h-10" />
              </div>
              <div className="relative z-10 space-y-2">
                 <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">Déposez votre fichier pour : [{getModeLabel(importMode)}]</h4>
                 <p className="text-sm text-slate-500 font-medium">Formats valides : Excel (.xlsx, .xls) ou Texte (.csv)</p>
              </div>
              <button 
                type="button"
                className="relative z-10 bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                 Parcourir mon ordinateur
              </button>
           </div>

           {/* Initial Debug Console */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col justify-between space-y-6 shadow-sm">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                   <Info className="w-4 h-4 text-indigo-500" />
                   Console de validation et traçabilité clinique
                </h4>
                
                <div className="mt-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-400 text-xs leading-relaxed font-semibold">
                   Choisissez le volet souhaité en haut (Patients, Contrats ou Historique médical). Les diagnostics de intégrité structurelle apparaitront en direct lors du chargement.
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-[10px] font-mono text-slate-500 space-y-2 overflow-y-auto max-h-[140px] border border-slate-850">
                 <p className="text-indigo-400 font-bold uppercase tracking-widest mb-1">[JOURNAL DES TRANSACTIONS]</p>
                 {logs.map((log, index) => (
                   <p key={index} className="leading-relaxed">{log}</p>
                 ))}
              </div>
           </div>
        </div>
      )}

      {importStatus === 'loading' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-sm">
           <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 animate-spin">
              <RefreshCw className="w-8 h-8 text-indigo-500" />
           </div>
           <div className="space-y-2">
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-wide">Décodage de votre document...</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Extraction des données binaires, formatage structurel et mise en correspondance clinique des fiches...
              </p>
           </div>
           <div className="w-64 bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-pulse" />
           </div>
        </div>
      )}

      {importStatus === 'error' && (
        <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center space-y-6">
           <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-sm">
              <AlertCircle className="w-8 h-8" />
           </div>
           <div className="space-y-2">
              <h4 className="text-lg font-black text-rose-950 uppercase">Erreur critique d'intégration</h4>
              <p className="text-xs text-rose-700 max-w-lg mx-auto font-medium leading-relaxed bg-white/60 p-4 rounded-2xl border border-rose-100/40">
                 {errorMessage || "Le document ne contient pas de données structurées valides ou la correspondance a échoué."}
              </p>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={handleReset}
                className="bg-rose-600 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                Sélectionner un autre fichier
              </button>
           </div>
        </div>
      )}

      {importStatus === 'preview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           
           {/* Info Strip */}
           <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Fichier chargé en mémoire</p>
                    <h3 className="text-lg font-black text-white">{fileName} <span className="text-xs text-indigo-400">({fileSize})</span></h3>
                 </div>
              </div>

              {/* Duplicate Strategy selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-850 p-3 rounded-2xl border border-slate-850">
                 <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-300">Gestion des homonymes (doublons) :</p>
                    <p className="text-[10px] text-slate-500">Si un enregistrement identique existe déjà ?</p>
                 </div>
                 <div className="flex bg-slate-900 border border-slate-850 rounded-xl p-1 gap-1">
                    <button 
                      onClick={() => setDuplicateStrategy('skip')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all focus:outline-none cursor-pointer ${
                        duplicateStrategy === 'skip' 
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                       Ignorer et passer
                    </button>
                    <button 
                      onClick={() => setDuplicateStrategy('update')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all focus:outline-none cursor-pointer ${
                        duplicateStrategy === 'update' 
                          ? 'bg-indigo-600 text-white font-black shadow-sm' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                       Écraser / Mettre à jour
                    </button>
                 </div>
              </div>
           </div>

           {/* Side-by-Side Interface Panel of correspondances */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Panel: Mapping Configuration */}
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Correspondance de Base de Données</h4>
                          <p className="text-xs text-slate-500 font-medium">Liez chaque champ requis à gauche à la colonne de votre document Excel à droite.</p>
                       </div>
                    </div>

                    <div className="h-px bg-slate-100" />
                    
                    {/* List of configuration rows */}
                    <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                       {getFieldsConfig().map((field) => {
                          const currentMappedHeader = detectedMapping[field.key] || '';
                          const sampleVal = getSampleValueForHeader(currentMappedHeader);

                          return (
                            <div 
                              key={field.key} 
                              className={`p-3 rounded-2xl border transition-all ${
                                field.required && !currentMappedHeader 
                                  ? 'border-rose-250 bg-rose-50/10' 
                                  : currentMappedHeader 
                                    ? 'border-indigo-100 bg-indigo-50/5' 
                                    : 'border-slate-100 hover:border-slate-205'
                              }`}
                            >
                               <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  {/* DB Target field descriptor */}
                                  <div className="space-y-1 md:max-w-[42%] shrink-0">
                                     <div className="flex items-center gap-1.5">
                                        <span className={`text-[12px] font-black leading-none ${field.required ? 'text-slate-950 font-black' : 'text-slate-800'}`}>
                                           {field.label}
                                        </span>
                                        {field.required && (
                                          <span className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase font-mono">
                                             Requis
                                          </span>
                                        )}
                                     </div>
                                     <p className="text-[10px] text-slate-400 font-medium leading-none">{field.desc}</p>
                                  </div>

                                  {/* Dynamic Arrow indicator */}
                                  <div className="hidden md:flex items-center text-slate-300">
                                     <ArrowRight className="w-4 h-4 animate-pulse shrink-0" />
                                  </div>

                                  {/* Dropdown for selecting Excel Column header */}
                                  <div className="flex-1 min-w-[160px]">
                                     <select
                                       value={currentMappedHeader}
                                       onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                       className={`w-full bg-slate-50 border px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                                         field.required && !currentMappedHeader 
                                           ? 'border-rose-450 text-rose-700 bg-rose-50' 
                                           : currentMappedHeader 
                                             ? 'border-indigo-305 text-indigo-950 bg-indigo-50/30' 
                                             : 'border-slate-205 text-slate-650'
                                       }`}
                                     >
                                        <option value="">(Laisser vide / Aucun)</option>
                                        {excelHeaders.map((hdr) => (
                                          <option key={hdr} value={hdr}>
                                             [Excel] {hdr}
                                          </option>
                                        ))}
                                     </select>
                                  </div>
                               </div>

                               {/* Valuation proof snippet */}
                               {currentMappedHeader && (
                                 <div className="mt-2 text-[10px] text-slate-500 font-semibold flex items-center justify-between bg-slate-100/60 p-2 rounded-xl border border-slate-150">
                                    <span className="flex items-center gap-1 font-sans">
                                       <Info className="w-3 h-3 text-slate-400 font-bold" />
                                       Aperçu de ligne :
                                    </span>
                                    <span className="font-mono text-indigo-900 font-black max-w-[150px] truncate">
                                       {sampleVal !== null ? `"${sampleVal}"` : <span className="text-slate-400 italic">(vide)</span>}
                                    </span>
                                 </div>
                               )}
                            </div>
                          );
                       })}
                    </div>
                 </div>

                 {/* Real-time System Debug Log */}
                 <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4 shadow-xl border border-slate-800">
                    <h5 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-2">
                       <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                       Rapports cliniques de validation
                    </h5>
                    <div className="text-[9px] font-mono text-slate-400 space-y-2 max-h-[120px] overflow-y-auto">
                       {logs.slice(-6).map((l, index) => <p key={index}>{l}</p>)}
                    </div>
                 </div>
              </div>

              {/* Right Panel: Reconstructed rows Based on Mappings */}
              <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-150 shadow-sm overflow-hidden flex flex-col h-full justify-between">
                 <div>
                    {/* Tabs / Filters and Search */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                       <div className="flex bg-slate-150 rounded-2xl p-1 gap-1">
                          <button 
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              activeFilter === 'all' 
                                ? 'bg-white text-slate-950 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                             Tous ({parsedRows.length})
                          </button>
                          <button 
                            onClick={() => setActiveFilter('new')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              activeFilter === 'new' 
                                ? 'bg-white text-slate-950 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                             Nouveaux ({parsedRows.filter(r => !r.isDuplicate).length})
                          </button>
                          <button 
                            onClick={() => setActiveFilter('duplicate')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              activeFilter === 'duplicate' 
                                ? 'bg-white text-slate-950 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                             Doublons ({parsedRows.filter(r => r.isDuplicate).length})
                          </button>
                       </div>

                       <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Filtrer l'aperçu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-52 shadow-2xs"
                          />
                       </div>
                    </div>

                    {/* Table View adapted to the active Sub-mode */}
                    <div className="overflow-x-auto max-h-[500px]">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">
                                  <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-100 rounded-md inline-block cursor-pointer">
                                    {allSelected ? (
                                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : someSelected ? (
                                      <div className="w-4 h-4 border border-indigo-600 bg-indigo-50 rounded flex items-center justify-center">
                                        <div className="w-2 h-0.5 bg-indigo-600 rounded mr-0.5" />
                                      </div>
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut BDD</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-indigo-900">Patient</th>
                                
                                {importMode === 'patients' && (
                                  <>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Âge / Genre</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tél & Ville</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic</th>
                                  </>
                                )}

                                {importMode === 'abonnements' && (
                                  <>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Forfait</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Début / Souscription</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consommé / Remise</th>
                                  </>
                                )}

                                {importMode === 'balneo' && (
                                  <>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jour & Heure</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durée (h)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payé ?</th>
                                  </>
                                )}

                                {importMode === 'kine' && (
                                  <>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jour / Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Soin Clinic Dispensé</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payé ?</th>
                                  </>
                                )}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                             {displayedRows.length === 0 ? (
                               <tr>
                                  <td colSpan={7} className="py-12 text-center text-slate-400 italic font-semibold">
                                     Aucun enregistrement ne peut être décodé. Veuillez choisir et lier la colonne principale "Nom du Patient" pour visualiser les lignes.
                                  </td>
                               </tr>
                             ) : (
                               displayedRows.map((item) => {
                                  const origIdx = parsedRows.findIndex(p => p.rowNumber === item.rowNumber);
                                  return (
                                    <tr 
                                      key={item.rowNumber} 
                                      onClick={() => toggleSelectRow(origIdx)}
                                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                        item.selected ? 'bg-indigo-50/30' : ''
                                      }`}
                                    >
                                       <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            onClick={() => toggleSelectRow(origIdx)}
                                            className="text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer"
                                          >
                                             {item.selected ? (
                                                <CheckSquare className="w-4 h-4 text-indigo-600 font-bold" />
                                             ) : (
                                                <Square className="w-4 h-4" />
                                             )}
                                          </button>
                                       </td>
                                       <td className="px-6 py-4">
                                          {item.isDuplicate ? (
                                             <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                En base (Doublon)
                                             </span>
                                          ) : (
                                             <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                                <Check className="w-2.5 h-2.5" />
                                                Nouveau
                                             </span>
                                          )}
                                       </td>
                                       <td className="px-6 py-4 font-black text-slate-900 uppercase">
                                          {item.patient_name || <span className="text-rose-500 italic">Vide</span>}
                                       </td>

                                       {importMode === 'patients' && (
                                         <>
                                            <td className="px-6 py-4 font-bold text-slate-500">
                                               {item.age} ans / <span className="text-slate-900 font-black">{item.gender}</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                               <div className="font-mono">{item.phone || <span className="text-slate-300 italic">Aucun</span>}</div>
                                               <div className="text-[10px] text-slate-400 font-bold uppercase">{item.city || '(Aucune ville)'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600 max-w-[150px] truncate">
                                               {item.pathology || <span className="text-slate-300 italic">Rééducation générale</span>}
                                            </td>
                                         </>
                                       )}

                                       {importMode === 'abonnements' && (
                                         <>
                                            <td className="px-6 py-4 font-bold text-slate-800 uppercase">
                                               {item.pack_name || <span className="text-rose-500 italic">Non renseigné</span>}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-500">
                                               <div>Déb : <span className="text-slate-900 font-mono text-[10px]">{item.date_debut}</span></div>
                                               <div className="text-[9px] text-slate-400 font-bold">Créée le : {item.date_creation}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600">
                                               <div>Sessions: <span className="text-indigo-650 font-black">{item.used_sessions || 0}</span> effect.</div>
                                               {item.remise_globale ? (
                                                  <div className="text-[10px] text-amber-650 font-extrabold">Remise: {item.remise_globale}%</div>
                                               ) : <div className="text-[10px] text-slate-300 font-normal">Sans remise</div>}
                                            </td>
                                         </>
                                       )}

                                       {importMode === 'balneo' && (
                                         <>
                                            <td className="px-6 py-4 font-bold text-slate-905 font-mono text-[10px]">
                                               {item.appointment_date}
                                            </td>
                                            <td className="px-6 py-4 font-black text-indigo-900 text-center">
                                               {item.duration || "1.0"} h
                                            </td>
                                            <td className="px-6 py-4">
                                               {item.paid ? (
                                                 <span className="bg-emerald-55 text-emerald-700 px-2.5 py-1 rounded font-black text-[9px] uppercase">RÉGLÉ</span>
                                               ) : (
                                                 <span className="bg-rose-55 text-rose-700 px-2.5 py-1 rounded font-black text-[9px] uppercase">NON PAYÉ / ABO</span>
                                               )}
                                            </td>
                                         </>
                                       )}

                                       {importMode === 'kine' && (
                                         <>
                                            <td className="px-6 py-4 font-bold text-slate-905 font-mono text-[10px]">
                                               {item.appointment_date}
                                            </td>
                                            <td className="px-6 py-4 font-extrabold text-slate-800 uppercase max-w-[170px] truncate">
                                               {item.act_name || <span className="text-slate-400 italic font-normal">Soin standard</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                               {item.paid ? (
                                                 <span className="bg-emerald-55 text-emerald-700 px-2.5 py-1 rounded font-black text-[9px] uppercase">RÉGLÉ</span>
                                               ) : (
                                                 <span className="bg-rose-55 text-rose-700 px-2.5 py-1 rounded font-black text-[9px] uppercase">NON PAYÉ / ABO</span>
                                               )}
                                            </td>
                                         </>
                                       )}
                                    </tr>
                                  );
                               })
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Bottom Action Footer */}
                 <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button 
                      onClick={handleReset}
                      className="text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                       <Undo2 className="w-4 h-4" />
                       Changer de document
                    </button>

                    <button 
                      onClick={handleCommitImport}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2 shadow-indigo-600/10 cursor-pointer"
                    >
                       <FileCheck className="w-4 h-4" />
                       Valider l'importation de ({parsedRows.filter(p => p.selected).length}) lignes
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {importStatus === 'success' && (
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center space-y-6">
           <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           
           <div className="space-y-2">
              <h4 className="text-2xl font-black text-emerald-950 uppercase tracking-wide">Importation Terminée !</h4>
              <p className="text-sm text-emerald-705 max-w-lg mx-auto font-semibold leading-relaxed bg-white/70 p-5 rounded-2xl border border-emerald-100/50">
                La base de données clinique a été synchronisée avec succès pour le registre [{getModeLabel(importMode)}]. Les fiches et planifications de soins sont maintenant à jour et prêtes.
              </p>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={handleReset}
                className="bg-emerald-650 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                 <Upload className="w-4 h-4" />
                 Faire un autre import
              </button>
           </div>
        </div>
      )}

      {/* Verify Register Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in delay-150 duration-300">
         <div className="px-10 py-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Registre Clinique Actuel de la Base de Données
              </h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Visualisez les fiches actuellement enregistrées en direct.</p>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Filtrer par nom..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-50 border border-slate-150 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 shadow-2xs"
                 />
              </div>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            {importMode === 'patients' && (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">N° Dossier</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type Patient</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Enregistrement</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-xs">
                    {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map(pat => (
                       <tr key={pat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-10 py-4 text-[10px] font-bold text-slate-550 font-mono">
                             {pat.dossier_num || pat.id}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">{pat.name}</td>
                          <td className="px-6 py-4 text-slate-600 font-mono">{pat.phone}</td>
                          <td className="px-6 py-4">
                             {pat.type_patient === 'enfant_imc' ? (
                                <span className="bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">Enfant IMC</span>
                             ) : pat.type_patient === 'enfant' ? (
                                <span className="bg-amber-55 text-amber-700 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">Enfant</span>
                             ) : (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider font-mono">Adulte</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400 font-mono">{pat.date_creation}</td>
                       </tr>
                    ))}
                    {patients.length === 0 && (
                       <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                             Aucun dossier patient en base.
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
            )}

            {importMode === 'abonnements' && (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Contrat</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Forfait / Pack</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Séances Consommées</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Début</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-xs">
                    {abonnements.filter(a => {
                      const pat = patients.find(p => p.id === a.patient_id);
                      return !searchTerm || (pat && pat.name.toLowerCase().includes(searchTerm.toLowerCase()));
                    }).slice(0, 5).map(abo => {
                       const pat = patients.find(p => p.id === abo.patient_id);
                       const pName = pat?.name || 'Inconnu';
                       const pack = packs.find(pk => pk.id === abo.pack_id);
                       const packName = pack?.name || 'Pack Personnalisé';

                       return (
                         <tr key={abo.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-4 text-[10px] font-bold text-slate-550 font-mono">
                               {abo.name}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">{pName}</td>
                            <td className="px-6 py-4 font-semibold text-slate-655">{packName}</td>
                            <td className="px-6 py-4">
                               <span className="text-indigo-600 font-bold">{abo.used_sessions}</span> / {pack?.nombre_seance || 10} séances
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 font-mono">{abo.date_debut}</td>
                         </tr>
                       );
                    })}
                    {abonnements.length === 0 && (
                       <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                             Aucun contrat d'abonnement actif en base.
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
            )}

            {importMode === 'balneo' && (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Séance</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient s</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Heure</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-xs">
                    {balneoApps.filter(b => {
                      return !searchTerm || b.patients.some(pLine => {
                        const pat = patients.find(p => p.id === pLine.patient_id);
                        return pat && pat.name.toLowerCase().includes(searchTerm.toLowerCase());
                      });
                    }).slice(0, 5).map(app => {
                       const patientsNames = app.patients.map(pLine => {
                          const pat = patients.find(p => p.id === pLine.patient_id);
                          return pat ? pat.name : 'Inconnu';
                       }).join(', ');

                       return (
                         <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-4 text-[10px] font-bold text-slate-550 font-mono">
                               {app.name}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">{patientsNames}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-500">{app.appointment_date}</td>
                            <td className="px-6 py-4">
                               {app.state === 'done' ? (
                                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">Effectué</span>
                               ) : app.state === 'confirmed' ? (
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">Confirmé</span>
                               ) : (
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider font-mono">{app.state}</span>
                               )}
                            </td>
                         </tr>
                       );
                    })}
                    {balneoApps.length === 0 && (
                       <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-400 italic">
                             Aucun historique d'actes de balnéothérapie disponible.
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
            )}

            {importMode === 'kine' && (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code RDV</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient s</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Séance</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Soin principal</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-xs">
                    {kineApps.filter(k => {
                      return !searchTerm || k.selected_acts.some(aLine => {
                        const pat = patients.find(p => p.id === aLine.patient_id);
                        return pat && pat.name.toLowerCase().includes(searchTerm.toLowerCase());
                      });
                    }).slice(0, 5).map(app => {
                       const patientsNames = app.selected_acts.map(aLine => {
                          const pat = patients.find(p => p.id === aLine.patient_id);
                          return pat ? pat.name : 'Inconnu';
                       }).join(', ');

                       // Extract act names
                       const actNames = app.selected_acts.map(aLine => {
                          const act = acts.find(a => a.id === aLine.act_id);
                          return act ? act.name : 'Soin Standard';
                       }).join(', ');

                       return (
                         <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-4 text-[10px] font-bold text-slate-550 font-mono">
                               {app.name}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">{patientsNames}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-505">{app.appointment_date}</td>
                            <td className="px-6 py-4 font-semibold text-slate-655 truncate max-w-[180px]">{actNames}</td>
                         </tr>
                       );
                    })}
                    {kineApps.length === 0 && (
                       <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-400 italic">
                             Aucun historique d'actes de rééducation adulte disponible.
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
            )}
         </div>
      </div>
    </div>
  );
}
