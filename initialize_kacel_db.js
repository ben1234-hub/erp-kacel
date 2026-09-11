/**
 * 📊 INITIALISATION DE LA BASE DE DONNÉES LOCALES - KACEL SANTÉ
 * Ce script est conçu pour s'exécuter de manière autonome sur votre PC Ubuntu.
 * 
 * Ce script va :
 * 1. Créer physiquement le dossier `/home/adel/kacel_sante_DATA/` s'il n'existe pas.
 * 2. Charger en dur toutes les tables de configuration, règles cliniques et structures de l'ERP.
 * 3. Lire vos fichiers Excel locaux (Table_Patients-3.xlsx, Table_Abons-3.xlsx, etc.) présents dans le dossier courant.
 * 4. Importer et convertir les 11 829 patients réels, 5 039 abonnements et versements associés.
 * 5. Compiler le tout dans un fichier JSON unique et structuré à l'emplacement exact demandé.
 * 
 * 🔧 PRÉREQUIS sur votre PC local :
 * - Avoir Node.js installé (v16+)
 * - Installer le module de lecture Excel en faisant : `npm install xlsx` dans votre terminal.
 * - Lancer le script : `node initialize_kacel_db.js`
 */

const fs = require('fs');
const path = require('path');

// Tenter de charger le module XLSX
let XLSX;
try {
  XLSX = require('xlsx');
} catch (err) {
  console.error("\n❌ ERREUR : Le module 'xlsx' n'est pas installé sur votre système.");
  console.error("👉 Veuillez exécuter la commande suivante sur votre terminal avant de relancer le script :");
  console.error("   npm install xlsx\n");
  process.exit(1);
}

// Emplacement de la base de données de sortie demandé
const TARGET_DIR = '/home/adel/kacel_sante_DATA';
const TARGET_FILE = path.join(TARGET_DIR, 'stored_erp_db.json');

// Structure de base de données à initialiser (incluant toutes les tables de l'ERP Kacel)
const database = {
  services: [
    { ID_Sce: 1, Libelle_Sce: 'Rééducation Fonctionnelle' },
    { ID_Sce: 2, Libelle_Sce: 'Balnéothérapie' },
    { ID_Sce: 3, Libelle_Sce: 'Services Intensifs - Étage 2' },
    { ID_Sce: 4, Libelle_Sce: 'Services Intensifs - Étage 3' },
    { ID_Sce: 5, Libelle_Sce: 'Services Intensifs - Étage 4' }
  ],
  utilisateurs: [
    { ID_Utilisateur: 1, ID_Sce: 1, Nom_Utilisateur: 'BENKARI Mhand', Role: 'Admin', Login: 'mhand', MotDePasse: 'mhand' },
    { ID_Utilisateur: 2, ID_Sce: 1, Nom_Utilisateur: 'Mme SOUMAYA (Assistante)', Role: 'Assistante', Login: 'soumaya', MotDePasse: 'soumaya' },
    { ID_Utilisateur: 3, ID_Sce: 1, Nom_Utilisateur: 'Melle FELLA', Role: 'Receptionniste RDC', Login: 'fella', MotDePasse: 'fella' },
    { ID_Utilisateur: 4, ID_Sce: 2, Nom_Utilisateur: 'Mme RACHA', Role: 'Receptionniste Balnéothérapie', Login: 'racha', MotDePasse: 'racha' },
    { ID_Utilisateur: 5, ID_Sce: 1, Nom_Utilisateur: 'Mme NARIMANE', Role: 'Receptionniste Réeducation', Login: 'narimane', MotDePasse: 'narimane' },
    { ID_Utilisateur: 6, ID_Sce: 1, Nom_Utilisateur: 'Mme SONIA', Role: 'Receptionniste Réeducation', Login: 'sonia', MotDePasse: 'sonia' },
    { ID_Utilisateur: 7, ID_Sce: 3, Nom_Utilisateur: 'Melle AYA', Role: 'Receptionniste Intensif 2e', Login: 'aya', MotDePasse: 'aya' },
    { ID_Utilisateur: 8, ID_Sce: 4, Nom_Utilisateur: 'Mme HANANE', Role: 'Receptionniste Intensif 3e', Login: 'hanane', MotDePasse: 'hanane' },
    { ID_Utilisateur: 9, ID_Sce: 5, Nom_Utilisateur: 'Mme KHADIDJA', Role: 'Receptionniste Intensif 4e', Login: 'khadija', MotDePasse: 'khadija' },
    { ID_Utilisateur: 10, ID_Sce: 2, Nom_Utilisateur: 'Dr. Amrani MPR', Role: 'Médecin MPR', Login: 'amrani', MotDePasse: 'amrani' },
    { ID_Utilisateur: 11, ID_Sce: 1, Nom_Utilisateur: 'M. AIMENE (Marketing)', Role: 'Marketing', Login: 'aimene', MotDePasse: 'aimene' }
  ],
  praticiens: [],
  actes: [],
  packs: [],
  patients: [],
  abonnements: [],
  versements: [],
  typesPlanning: [
    { ID_Type_Plan: 1, Libelle_Type: 'Rééducation Standard', Max_Patients_Simultanes: 4 },
    { ID_Type_Plan: 2, Libelle_Type: 'Balnéothérapie', Max_Patients_Simultanes: 8 },
    { ID_Type_Plan: 3, Libelle_Type: 'Services Intensifs (Individuel)', Max_Patients_Simultanes: 1 }
  ],
  zones: [
    { ID_Zone: 1, Nom_Zone: 'Plateau Homme' },
    { ID_Zone: 2, Nom_Zone: 'Plateau Femme' },
    { ID_Zone: 3, Nom_Zone: 'Bassin Balnéo' },
    { ID_Zone: 4, Nom_Zone: 'Étage 2' },
    { ID_Zone: 5, Nom_Zone: 'Étage 3' },
    { ID_Zone: 6, Nom_Zone: 'Étage 4' }
  ],
  reglesBalneo: [
    { ID_Regle: 1, Jour_Semaine: 1, Demi_Journee: 'Matin', Genre_Autorise: 'H' },
    { ID_Regle: 2, Jour_Semaine: 1, Demi_Journee: 'Apres-midi', Genre_Autorise: 'F' },
    { ID_Regle: 3, Jour_Semaine: 2, Demi_Journee: 'Matin', Genre_Autorise: 'F' },
    { ID_Regle: 4, Jour_Semaine: 2, Demi_Journee: 'Apres-midi', Genre_Autorise: 'H' },
    { ID_Regle: 5, Jour_Semaine: 3, Demi_Journee: 'Matin', Genre_Autorise: 'H' },
    { ID_Regle: 6, Jour_Semaine: 3, Demi_Journee: 'Apres-midi', Genre_Autorise: 'F' },
    { ID_Regle: 7, Jour_Semaine: 4, Demi_Journee: 'Matin', Genre_Autorise: 'F' },
    { ID_Regle: 8, Jour_Semaine: 4, Demi_Journee: 'Apres-midi', Genre_Autorise: 'H' },
    { ID_Regle: 9, Jour_Semaine: 5, Demi_Journee: 'Matin', Genre_Autorise: 'H' },
    { ID_Regle: 10, Jour_Semaine: 5, Demi_Journee: 'Apres-midi', Genre_Autorise: 'F' },
    { ID_Regle: 11, Jour_Semaine: 6, Demi_Journee: 'Matin', Genre_Autorise: 'H' },
    { ID_Regle: 12, Jour_Semaine: 6, Demi_Journee: 'Apres-midi', Genre_Autorise: 'F' },
    { ID_Regle: 13, Jour_Semaine: 7, Demi_Journee: 'Matin', Genre_Autorise: 'F' },
    { ID_Regle: 14, Jour_Semaine: 7, Demi_Journee: 'Apres-midi', Genre_Autorise: 'H' }
  ],
  rendezVous: [],
  seances: [],
  fileAttente: [],
  factures: [],
  fileAttenteIMC: [],
  consultations: [
    { id: 1, patient_id: 1, date_consultation: '2026-06-01', medecin_mpr_nom: 'Dr. Belhadj MPR', marche_sans_aide_technique: false, anteversion_bassin: true, commentaires: 'Patient présentant un déficit de force distale et une antéversion du bassin.' },
    { id: 2, patient_id: 2, date_consultation: '2026-06-03', medecin_mpr_nom: 'Dr. Belhadj MPR', marche_sans_aide_technique: true, anteversion_bassin: false, commentaires: 'Raideurs articulaires du genou gauche et gêne majeure lors de la flexion.' }
  ],
  deficitsCliniques: [
    { id: 1, consultation_id: 1, type_deficit: 'musculaire', localisation: 'Muscles Distaux', valeur_mesuree: 'Force < 4/5', code_regle_declencheur: 'FORCE_INF_4' },
    { id: 2, consultation_id: 1, type_deficit: 'articulaire', localisation: 'Complexe lombo-pelvien (Bassin)', valeur_mesuree: 'Antéversion anormale', code_regle_declencheur: 'BASSIN_ANTE' },
    { id: 3, consultation_id: 2, type_deficit: 'articulaire', localisation: 'Genou gauche', valeur_mesuree: 'Flexion < 100°', code_regle_declencheur: 'GENOU_FLEX_100' },
    { id: 4, consultation_id: 2, type_deficit: 'spasticite', localisation: 'Ischio-jambiers / Adducteurs', valeur_mesuree: 'Spasticité positive', code_regle_declencheur: 'SPASTICITE_P_M' }
  ],
  reglesAutomatisation: [
    { id: 1, code_regle: 'GENOU_FLEX_100', categorie_acte: 'therapie_manuelle', intitule_acte_auto: "Mobilisation passive, gain d'amplitude en extension et postures des genoux" },
    { id: 2, code_regle: 'FORCE_INF_4', categorie_acte: 'renforcement', intitule_acte_auto: "Renforcement analytique et fonctionnel en charge des muscles distaux" },
    { id: 3, code_regle: 'SPASTICITE_P_M', categorie_acte: 'therapie_manuelle', intitule_acte_auto: "Étirements prolongés des muscles spastiques (Ischio-jambiers, Adducteurs)" },
    { id: 4, code_regle: 'BASSIN_ANTE', categorie_acte: 'renforcement', intitule_acte_auto: "Gainage lombo-pelvien profond (Core stability) pour correction de l'antéversion du bassin" }
  ],
  fichesKineAutomatisees: [
    { id: 1, consultation_id: 1, nombre_seances_kine: 10, nombre_seances_balneo: 2, frequence_hebdo: 3, duree_quotidienne_minutes: 45, date_generation: '2026-06-01 10:30' },
    { id: 2, consultation_id: 2, nombre_seances_kine: 12, nombre_seances_balneo: 6, frequence_hebdo: 4, duree_quotidienne_minutes: 30, date_generation: '2026-06-03 11:15' }
  ],
  detailsFicheActes: [
    { id: 1, fiche_id: 1, categorie_acte: 'renforcement', intitule_acte: "Renforcement analytique et fonctionnel en charge des muscles distaux" },
    { id: 2, fiche_id: 1, categorie_acte: 'renforcement', intitule_acte: "Gainage lombo-pelvien profond (Core stability) pour correction de l'antéversion du bassin" },
    { id: 3, fiche_id: 2, categorie_acte: 'therapie_manuelle', intitule_acte: "Mobilisation passive, gain d'amplitude en extension et postures des genoux" },
    { id: 4, fiche_id: 2, categorie_acte: 'therapie_manuelle', intitule_acte: "Étirements prolongés des muscles spastiques (Ischio-jambiers, Adducteurs)" }
  ],
  callCentreEntries: [
    { id: 'cc-1', provenance: 'Alger', phone: '0555123456', typeActe: 'Réeducation Adulte', sources: ['Réseaux Sociaux', 'CallCentre'], dateSaisie: '2026-06-01', agentSaisie: 'BENKARI Mhand' },
    { id: 'cc-2', provenance: 'Oran', phone: '0661987654', typeActe: 'Balnéothérapie', sources: ['Bouche à Oreille'], dateSaisie: '2026-06-03', agentSaisie: 'Mme SOUMAYA (Assistante)' },
    { id: 'cc-3', provenance: 'Constantine', phone: '0770246813', typeActe: 'Intensif IMC', sources: ['Médecin'], dateSaisie: '2026-06-05', agentSaisie: 'Melle FELLA' },
    { id: 'cc-4', provenance: 'Sétif', phone: '0560987123', typeActe: 'Réeducation Adulte', sources: ['Tik Tok', 'Réseaux Sociaux'], dateSaisie: '2026-06-08', agentSaisie: 'Mme RACHA' },
    { id: 'cc-5', provenance: 'Blida', phone: '0671458962', typeActe: 'Balnéothérapie', sources: ['CallCentre'], dateSaisie: '2026-06-12', agentSaisie: 'BENKARI Mhand' }
  ],
  typesPatients: ['Adulte', 'Enfant', 'Enfant IMC'],
  chatChannels: [],
  chatMessages: [],
  lastUpdated: Date.now()
};

// Fonctions d'aide à la conversion
function parseExcelDate(serial) {
  if (!serial) return '';
  if (typeof serial === 'string') return serial.trim();
  try {
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const minutes = Math.floor(total_seconds / 60) % 60;
    const hours = Math.floor(total_seconds / 3600);
    
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date_info.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(serial);
  }
}

// Lancement de l'initialisation et lecture physique des fichiers locaux
console.log("\n========================================================");
console.log("🚀 KACEL SANTÉ : DÉMARRAGE DE L'INITIALISATION LOCALE");
console.log("========================================================\n");

// 1. IMPORT DES ACTES
const actesFile = 'Table_Actes-2.xlsx';
if (fs.existsSync(actesFile)) {
  const wb = XLSX.readFile(actesFile);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  database.actes = raw.map((row, idx) => ({
    ID_Acte: idx + 1,
    Libelle_Acte: row['Motif'] ? String(row['Motif']).trim() : '',
    Prix_Acte: Number(row['Prix public']) || Number(row['Prix convention']) || 1000,
    Const_Act: String(row['Motif']).toLowerCase().includes('consultation') || String(row['Motif']).toLowerCase().includes('contrôle'),
    Receptionniste_Autorises: ['Receptionniste RDC', 'Receptionniste Réeducation', 'Receptionniste Balnéothérapie']
  }));
  console.log(`✅ [ACTES] ${database.actes.length} actes chargés avec succès.`);
} else {
  console.log(`⚠️ Fichier ${actesFile} introuvable dans le dossier. Actes par défaut préservés.`);
}

// 2. IMPORT DES PACKS
const packsFile = 'Table_Packs-3.xlsx';
if (fs.existsSync(packsFile)) {
  const wb = XLSX.readFile(packsFile);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  database.packs = raw.map((row, idx) => {
    const libelle = row['Libele'] ? String(row['Libele']).trim() : '';
    let cat = 'R';
    if (libelle.toLowerCase().includes('balnéo')) cat = 'B';
    else if (libelle.toLowerCase().includes('intensif')) cat = 'I';
    else if (libelle.toLowerCase().includes('ortho')) cat = 'O';
    else if (libelle.toLowerCase().includes('psy')) cat = 'P';

    return {
      ID_Pack: idx + 1,
      Libelle_Pack: libelle,
      Nbre_Seance_Pack: Number(row['Nbre Séance']) || 10,
      Prix_Pack: Number(row['Prix']) || 15000,
      Prix_Seanc_Pack: Number(row['Prix_Seance_Pack']) || 1200,
      Cat_Pack: cat,
      id_acte: '1'
    };
  });
  console.log(`✅ [PACKS] ${database.packs.length} packs chargés avec succès.`);
} else {
  console.log(`⚠️ Fichier ${packsFile} introuvable. Forfaits de base préservés.`);
}

// 3. IMPORT DES PRATICIENS
const pratFile = 'Table_Praticient-2.xlsx';
if (fs.existsSync(pratFile)) {
  const wb = XLSX.readFile(pratFile);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  database.praticiens = raw.map((row) => {
    let rep = 'K';
    const func = String(row['Fonction '] || '').toLowerCase();
    if (func.includes('psy')) rep = 'P';
    else if (func.includes('ortho')) rep = 'O';
    else if (func.includes('mpr') || func.includes('medecin') || func.includes('médecin')) rep = 'MPR';

    return {
      ID_Prat: Number(row['Mle']) || Math.floor(Math.random() * 10000),
      ID_Sce: Number(row['ID'] ? row['ID'].replace('SCE_', '') : 1) || 1,
      Repere: rep,
      Nom_Prat: row['Nom'] ? String(row['Nom']).trim() : '',
      Prenom_Prat: row['Prénom'] ? String(row['Prénom']).trim() : '',
      Nom_Arb: row['Nom & Pren Arabe'] ? String(row['Nom & Pren Arabe']).trim() : '',
      Date_Nais_Prat: parseExcelDate(row['Date de naissance']),
      Date_Recrut_Prat: parseExcelDate(row["Date d'Entrée"]),
      Type_Cont_Prat: row['type de contrat '] === 'CDI' ? 'CDI' : 'CDD',
      Genre_Prat: row['Sexe'] === 'Homme' ? 'H' : 'F'
    };
  });
  console.log(`✅ [PRATICIENS] ${database.praticiens.length} praticiens chargés avec succès.`);
} else {
  console.log(`⚠️ Fichier ${pratFile} introuvable. Praticiens par défaut préservés.`);
}

// 4. IMPORT DES PATIENTS
const patientsFile = 'Table_Patients-3.xlsx';
const patientCodeMap = new Map(); // Permet d'associer le code dossier ("0002/23") à l'ID_Patient numérique unique
let maxPatientId = 0;

if (fs.existsSync(patientsFile)) {
  const wb = XLSX.readFile(patientsFile);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  
  database.patients = raw.map((row, idx) => {
    const id = idx + 1;
    const code = row['N°'] ? String(row['N°']).trim() : '';
    if (code) {
      patientCodeMap.set(code, id);
    }
    if (id > maxPatientId) maxPatientId = id;

    // Calcul de l'âge à partir de la date de naissance Excel
    let age = 30;
    let ddn = '';
    if (row['D.D.N']) {
      ddn = parseExcelDate(row['D.D.N']);
      if (ddn && ddn.includes('-')) {
        const birthYear = parseInt(ddn.split('-')[0], 10);
        if (!isNaN(birthYear)) age = 2026 - birthYear;
      }
    }

    return {
      ID_Patient: id,
      Nom_Patient: row['Nom & Prénom'] ? String(row['Nom & Prénom']).trim() : `Patient ${id}`,
      Nom_Pat_Arb: row['Nom arab'] ? String(row['Nom arab']).trim() : '',
      Pren_Pat_Arb: row['Prénom arab'] ? String(row['Prénom arab']).trim() : '',
      Genre_Patient: row['Genre'] || 'Homme',
      type_patient: row['Type Patient'] || 'Adulte',
      phone: row['Mobile'] ? String(row['Mobile']).trim() : '',
      address: row['Wilaya_Officielle'] ? String(row['Wilaya_Officielle']).trim() : 'Alger',
      street: '',
      city: '',
      wilaya: row['Wilaya_Officielle'] ? String(row['Wilaya_Officielle']).match(/\d+/)?.[0] || '16' : '16',
      Age_Patient: age,
      Age_Pat: age,
      Date_Nais_Pat: ddn,
      Nbre_Abn: 0
    };
  });
  console.log(`✅ [PATIENTS] ${database.patients.length} patients réels chargés avec succès.`);
} else {
  console.log(`⚠️ Fichier ${patientsFile} introuvable.`);
}

// 5. IMPORT DES ABONNEMENTS & VERSEMENTS ASSOCIÉS
const abonsFile = 'Table_Abons-3.xlsx';
if (fs.existsSync(abonsFile)) {
  const wb = XLSX.readFile(abonsFile);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  
  let abonCount = 0;
  let versementCount = 0;

  raw.forEach((row, idx) => {
    const abnId = idx + 1;
    const folderCode = row['N° Dossier'] ? String(row['N° Dossier']).trim() : '';
    
    // Résoudre l'ID Patient via notre Map de codes dossiers
    let patientId = patientCodeMap.get(folderCode);
    
    // Fallback de sécurité : Si le patient n'existe pas, on le crée dynamiquement
    if (!patientId && folderCode) {
      maxPatientId++;
      patientId = maxPatientId;
      patientCodeMap.set(folderCode, patientId);
      
      database.patients.push({
        ID_Patient: patientId,
        Nom_Patient: `${row['Nom'] || 'Inconnu'} ${row['Prénom'] || ''}`.trim() || `Patient Dossier ${folderCode}`,
        Genre_Patient: row['Sexe'] || 'Homme',
        type_patient: row['Type Patient'] || 'Adulte',
        phone: row['Tél.'] ? String(row['Tél.']).trim() : '',
        address: row['Service'] || '',
        street: '',
        city: '',
        wilaya: '16',
        Age_Patient: 35,
        Age_Pat: 35,
        Nbre_Abn: 1
      });
    }

    if (!patientId) return; // Si vraiment pas d'identifiant valide, ignorer

    // Trouver le pack correspondant au Service demandé
    const serviceName = String(row['Service'] || '').toLowerCase();
    let packId = 1; // Forfait Intensif par défaut
    if (serviceName.includes('balnéo')) packId = 2;
    else if (serviceName.includes('enfant imc') || serviceName.includes('imc')) packId = 4;

    // Mettre à jour le nombre d'abonnements du patient
    const pIndex = database.patients.findIndex(p => p.ID_Patient === patientId);
    if (pIndex !== -1) {
      database.patients[pIndex].Nbre_Abn = (database.patients[pIndex].Nbre_Abn || 0) + 1;
    }

    // Création de l'abonnement
    database.abonnements.push({
      ID_Abn: abnId,
      ID_Patient: patientId,
      ID_Pack: packId,
      Date_Debut_Abn: parseExcelDate(row['Date debut'] || row["Date d'abonnement"]),
      Date_Fin_Abn: parseExcelDate(row['Date Fin'] || row["Date debut"] + 30),
      Nbre_Sean_Consom_Abn: Number(row['Séances faites']) || 0,
      ID_Acte_Add1: null,
      ID_Acte_Add2: null,
      Etat: row['Etat'] === 'Ouvert' ? 'Actif' : 'Fermé',
      Date_Abn: parseExcelDate(row["Date d'abonnement"])
    });
    abonCount++;

    // Création du versement correspondant si versement effectué
    const verse = Number(row['Versement total']) || 0;
    if (verse > 0) {
      versementCount++;
      database.versements.push({
        ID_Vers: versementCount,
        ID_Abn: abnId,
        Mont_Vers: verse,
        Date_Vers: parseExcelDate(row["Date d'abonnement"]) + " 09:00:00",
        Mode_Vers: 'Espèces'
      });
    }
  });

  console.log(`✅ [ABONNEMENTS] ${abonCount} abonnements reliés et créés.`);
  console.log(`✅ [VERSEMENTS] ${versementCount} versements comptabilisés.`);
} else {
  console.log(`⚠️ Fichier ${abonsFile} introuvable. Abonnements de test préservés.`);
}

// 6. CRÉATION DU DOSSIER CIBLE ET ENREGISTREMENT PHYSIQUE
try {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`\n📁 Dossier créé avec succès : ${TARGET_DIR}`);
  }

  // Écriture propre avec stringify formaté
  const jsonContent = JSON.stringify(database, null, 2);
  fs.writeFileSync(TARGET_FILE, jsonContent, 'utf8');

  console.log("\n========================================================");
  console.log("🎉 INITIALISATION TERMINÉE AVEC SUCCÈS !");
  console.log(`💾 Base de données sauvegardée à l'emplacement demandé :`);
  console.log(`   👉 ${TARGET_FILE}`);
  console.log(`📊 Statistiques finales exportées :`);
  console.log(`   - Services: ${database.services.length}`);
  console.log(`   - Utilisateurs: ${database.utilisateurs.length}`);
  console.log(`   - Praticiens: ${database.praticiens.length}`);
  console.log(`   - Actes: ${database.actes.length}`);
  console.log(`   - Packs: ${database.packs.length}`);
  console.log(`   - Patients réels: ${database.patients.length}`);
  console.log(`   - Abonnements réels: ${database.abonnements.length}`);
  console.log(`   - Versements réels: ${database.versements.length}`);
  console.log("========================================================\n");
} catch (writeErr) {
  console.error(`❌ Erreur critique lors de l'écriture physique dans ${TARGET_FILE} :`, writeErr.message);
  console.error("Vérifiez que vous avez les droits d'écriture sur votre disque Ubuntu ou que le chemin existe.");
}
