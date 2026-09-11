/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import LZString from 'lz-string';

// --- TypeScript Schemas for clinical tables ---

export interface Sce {
  ID_Sce: number;
  Libelle_Sce: string;
}

export interface Utilisateur {
  ID_Utilisateur: number;
  ID_Sce: number;
  Nom_Utilisateur: string;
  Role: string;
  Login: string;
  MotDePasse?: string;
  Attributions?: string[];
  Nom?: string;
  login?: string;
  Username?: string;
  Password?: string;
  ID_User?: number;
  id?: number | string;
}

export interface Praticien {
  ID_Prat: number;
  ID_Sce: number;
  Repere: 'K' | 'P' | 'O' | 'MPR';
  Pseudo?: string;
  Nom_Prat: string;
  Prenom_Prat: string;
  Nom_Arb?: string;
  Date_Nais_Prat: string;
  Date_Recrut_Prat: string;
  Type_Cont_Prat: 'CDD' | 'CDI' | 'Néant';
  Genre_Prat: 'H' | 'F';
  Dat_Debu_Trv?: string;
}

export interface Acte {
  ID_Acte: number;
  Libelle_Acte: string;
  Prix_Acte: number;
  Const_Act?: boolean;
  Receptionniste_Autorises?: string[];
}

export interface Pack {
  ID_Pack: number;
  Libelle_Pack: string;
  Nbre_Seance_Pack: number;
  Prix_Pack?: number;
  Prix_Seanc_Pack?: number;
  Cat_Pack?: 'R' | 'B' | 'I' | 'O' | 'P';
}

export interface Versement {
  ID_Vers: number;
  ID_Abn: number;
  Mont_Vers: number;
  Date_Vers: string;
  Mode_Vers?: string;
}

export interface Patient {
  ID_Patient: number;
  Nom_Patient: string;
  Nom_Pat_Arb?: string;
  Pren_Pat_Arb?: string;
  Genre_Patient: 'Homme' | 'Femme' | 'Enfant';
  type_patient: string;
  phone: string;
  address: string;
  street: string;
  city: string;
  wilaya: string;
  dossier_medical?: string;
  antecedents?: string;
  Age_Patient?: number;
  Age_Pat?: number;
  Date_Nais_Pat?: string;
  affectation?: 'Intensif 2e' | 'Intensif 3e' | 'Intensif 4e' | string;
  Affect_Pat_IMC?: 'Intensif 2e' | 'Intensif 3e' | 'Intensif 4e' | string;
  Nbre_Abn?: number;
  Nbre_Abn_Pat?: number;
  Pseudo?: string;
  numRegistre?: string;
  Num_Registre?: string;
}

export interface Abonnement {
  ID_Abn: number;
  ID_Patient: number;
  ID_Pack: number;
  Date_Debut_Abn: string;
  Date_Fin_Abn: string;
  Nbre_Sean_Consom_Abn: number;
  ID_Acte_Add1: number | null;
  ID_Acte_Add2: number | null;
  Etat?: 'Actif' | 'Fermé' | 'Gelé';
  Date_Abn?: string;
  updatedAt?: number;
}

export interface Type_Planning {
  ID_Type_Plan: number;
  Libelle_Type: string;
  Max_Patients_Simultanes: number;
}

export interface Zone {
  ID_Zone: number;
  Nom_Zone: string;
}

export interface Regle_Balneo {
  ID_Regle: number;
  Jour_Semaine: number;
  Demi_Journee: 'Matin' | 'Apres-midi';
  Genre_Autorise: 'H' | 'F';
}

export interface Rendez_Vous {
  ID_RDV: number;
  ID_Patient: number;
  ID_Prat: number;
  ID_Acte: number;
  ID_Type_Plan: number;
  ID_Zone: number;
  ID_Utilisateur: number;
  Date_RDV: string;
  H_Debut_RDV: string;
  H_Fin_RDV: string;
  Statut_RDV: 'Planifié' | 'Honoré' | 'Annulé' | 'Absent';
  Besoin?: string;
  updatedAt?: number;
  debloquePar?: string;
  debloqueLe?: string;
}

export interface Seance {
  ID_Seanc: number;
  ID_Patient: number;
  ID_Prat: number;
  ID_Acte: number;
  ID_Abn: number | null;
  ID_RDV: number | null;
  H_Debut_Seanc: string;
  H_Fin_Seanc: string;
  Prix_Seanc: number;
  Date_Seanc_Realisee: string;
  updatedAt?: number;
}

export interface Facture {
  ID_Facture: number;
  ID_Patient: number;
  Montant: number;
  Date_Facture: string;
  Statut: 'Payée' | 'Validée' | 'Annulée';
  updatedAt?: number;
}

export interface FileAttente {
  ID_File: number;
  ID_Patient: number;
  ID_RDV?: number | null;
  ID_Prat?: number;
  Num_Ticket?: string;
  Heure_Arrivee: string;
  Heure_Appel: string | null;
  Heure_Cloture: string | null;
  Statut_Attente: 'En Attente' | 'En Consultation' | 'Terminé' | 'Suspendu' | 'Nouveau' | 'Actif' | 'En pause';
  Date_File: string;
  Regle?: boolean;
  Type_Consultation?: string;
  Prix_Consultation?: number;
  Type_Soin?: string;
  Note?: string;
  Prix_Soin?: number;
  updatedAt?: number;
  debloquePar?: string;
  debloqueLe?: string;
}

export type FileAttenteIMC = FileAttente;

export interface ProgrammeMPR {
  ID_Programme: string | number;
  Nom_Programme: string;
  Description?: string;
  Items: number[];
  CustomItems?: string[];
  Date_Creation?: string;
  Actif?: boolean;
}

export interface DossierMedicalMPRRecord {
  id: string; // unique ID
  ID_Patient: number;
  date_dossier: string; // YYYY-MM-DD
  created_at: number; // timestamp
  created_by?: string;

  // En-tête
  mcd?: string;
  irm_cerebrale?: string;

  // Examen Clinique
  bct?: string; // Bilan Clinique Thérapeutique
  bo?: string; // Bilan Orthopédique
  genoux_flexion?: number | string; // °
  anteversion_bassin?: "Oui" | "Non" | "À évaluer" | "";
  bnm_mi_min?: string;
  bnm_mi_max?: string;
  bf_marche?: "sans_aide" | "avec_aide" | "fauteuil" | "non_evalue" | "";
  autres_observations?: string;

  // Programme Thérapeutique
  kine_seances_count?: number | string;
  kine_seances_freq?: number | string;
  balneo_seances_count?: number | string;
  balneo_seances_freq?: number | string;
  duree_seance_heures?: number | string;
  frequence_jours_semaine?: number | string;
  objectifs?: string;

  // Détail des Séances (Liste à cocher)
  programme?: string;
  programme_id?: string | number;
  checkboxes?: Record<number, boolean>;
  custom_items?: string[];
  observations_complementaires?: string;

  // Signatures
  medecin_prescripteur?: string;
  date_signature_medecin?: string;
  kinesitherapeute?: string;
  date_signature_kine?: string;
}

export interface FicheIMC {
  ID_Fiche_IMC: number;
  ID_Patient: number;
  Num_Registre: string;           // ex: "IMC-2026-001"
  Date_Consultation: string;
  Nom_Medecin: string;            // texte libre, ex: "Dr. Ahmed"

  // Section A
  Pregnancy_Duration: number | string;
  Labor_Nature: string;
  Birth_Weight: number | string;
  Neonatal_Maturity: string;
  Incubation_Period: number | string;
  Hypoxia: boolean;
  Jaundice: boolean;
  Cyanosis: boolean;

  // Section B
  Head_Control_Age: number | string;
  Rolling_Age: number | string;
  Crawling_Age: number | string;
  Sitting_Age: number | string;
  Get_To_Sit_Age: number | string;
  Get_To_Stand_Age: number | string;
  Standing_Age: number | string;
  Walking_Age: number | string;
  Balance_Age: number | string;

  // Section C
  Tonicity: string;
  Convulsions: boolean;
  Epilepsy: boolean;
  Cognition: string;
  Autism: boolean;
  Down_Syndrome: boolean;
  Vision: string;
  Breathing: string;
  Swallowing: string;
  Nutrition: string;
  Deformities: string;
  Orthopaedic_Surgery: string;

  // Section D
  Smiling: boolean;
  Play_With_Toys: boolean;
  Familiar_Stranger: boolean;
  Show_Like_Dislike: boolean;
  Show_Anger: boolean;
  Nervousness: boolean;
  Current_Medication: string;

  // Section E
  Therapeutic_Plan: string[];      // ["kine", "psycho", "ortho", "ergo"]
  Therapeutic_Duration: string;
  Number_Of_Sessions: number | string;
  Frequency_Per_Week: number | string;
  Observations: string;

  createdAt: number;
  updatedAt: number;

  // Pediatric Evaluation additions (A4 document fidelity)
  floor?: string;
  city?: string;
  phone?: string;
  diagnosis?: string;
  relationship?: string;
  other_therapy?: string;
  practitioner_signature?: string;
  pack_heures_prescrit?: string;
  jours_previsionnels?: string[];
  heure_debut_previsionnelle?: string;
}

export function generateNextIMCNumRegistre(patients: Patient[] = [], fiches: FicheIMC[] = []): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `IMC-${currentYear}-`;
  let maxNum = 0;

  (patients || []).forEach(p => {
    const reg = (p as any).numRegistre || (p as any).Num_Registre;
    if (reg && typeof reg === 'string' && reg.startsWith(yearPrefix)) {
      const parts = reg.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  (fiches || []).forEach(f => {
    if (f && f.Num_Registre && typeof f.Num_Registre === 'string' && f.Num_Registre.startsWith(yearPrefix)) {
      const parts = f.Num_Registre.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${yearPrefix}${nextNum}`;
}


export interface Consultation {
  id: number;
  patient_id: number;
  date_consultation: string;
  medecin_mpr_nom: string;
  marche_sans_aide_technique: boolean;
  anteversion_bassin: boolean;
  commentaires: string;
  updatedAt?: number;
}

export interface DeficitClinique {
  id: number;
  consultation_id: number;
  type_deficit: 'articulaire' | 'musculaire' | 'spasticite' | 'cicatrice';
  localisation: string;
  valeur_mesuree: string;
  code_regle_declencheur: string;
}

export interface RegleAutomatisation {
  id: number;
  code_regle: string;
  categorie_acte: string;
  intitule_acte_auto: string;
}

export interface FicheKineAutomatisee {
  id: number;
  consultation_id: number;
  nombre_seances_kine: number;
  nombre_seances_balneo: number;
  frequence_hebdo: number;
  duree_quotidienne_minutes: number;
  date_generation: string;
}

export interface DetailFicheActe {
  id: number;
  fiche_id: number;
  categorie_acte: string;
  intitule_acte: string;
}

export interface CallCentreEntry {
  id: string;
  provenance: string;
  phone: string;
  typeActe: string;
  sources: string[];
  dateSaisie: string;
  agentSaisie?: string;
  statut?: 'En cours' | 'Terminé' | 'À rappeler';
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  receiverId?: number;
  content: string;
  timestamp: string;
  channel?: string;
  read?: boolean;
}

export interface AppNotification {
  id: string;
  destinataire: string;
  type: string;
  message: string;
  date: string;
  lue: boolean;
}

export interface PatientEnPause {
  idPatient: number;
  nom: string;
  prenom: string;
  service: string;           // 'Intensif 2e', 'Intensif 3e', 'Intensif 4e'
  praticienOrigine: string;  // ex: 'KINÉ'
  creneauOrigine: string;    // ex: '08:00'
  datePause: string;         // ex: '2026-07-17'
  periode: 'matin' | 'soir' | 'apres-midi';
  heurePause: string;        // ex: '10:30'
  id_seance?: string | number; // unique id for session/pause item
  updatedAt?: number;
}

export interface Depense {
  id: number;
  date_depense: string;        // YYYY-MM-DD
  montant: number;
  categorie: string;           // Texte libre
  description: string;
  id_utilisateur: number;
  nom_utilisateur: string;
  id_service: number;          // 1=Rééducation, 2=Balnéo, 6=RDC/MPR
  nom_service: string;
  statut: 'En attente' | 'Validée' | 'Refusée';
  mode_paiement: 'Espèces';    // TOUJOURS espèces, valeur fixe
  justificatif?: string;       // ex: "Facture N°123"
  createdAt: number;
  updatedAt?: number;
}


export interface DatabaseState {
  services: Sce[];
  utilisateurs: Utilisateur[];
  praticiens: Praticien[];
  actes: Acte[];
  packs: Pack[];
  patients: Patient[];
  abonnements: Abonnement[];
  versements: Versement[];
  typesPlanning: Type_Planning[];
  zones: Zone[];
  reglesBalneo: Regle_Balneo[];
  rendezVous: Rendez_Vous[];
  depenses: Depense[];
  categories_depenses: string[];
  seances: Seance[];
  fileAttente: FileAttente[];
  fileAttenteIMC?: FileAttenteIMC[];
  factures: Facture[];
  consultations: Consultation[];
  deficitsCliniques: DeficitClinique[];
  reglesAutomatisation: RegleAutomatisation[];
  fichesKineAutomatisees: FicheKineAutomatisee[];
  detailsFicheActes: DetailFicheActe[];
  callCentreEntries?: CallCentreEntry[];
  typesPatients?: string[];
  chatChannels?: any[];
  chatMessages?: any[];
  chat_messages?: ChatMessage[];
  transactions_caisses?: any[];
  gestionAbonnements?: any[];
  kinesitherapyAppointments?: any[];
  caisseTransactions?: any[];
  notifications?: AppNotification[];
  orthoPsychoAssignments?: Record<string, any>;
  orthoPsychoPresence?: Record<string, any>;
  intensifPresence?: Record<string, any>;
  intensifExcludedMatin?: Record<string, any>;
  intensifExcludedSoir?: Record<string, any>;
  patientsEnPause?: PatientEnPause[];
  fiches_imc?: FicheIMC[];
  dossiers_mpr?: DossierMedicalMPRRecord[];
  programmesMPR?: ProgrammeMPR[];
  lastUpdated?: number;
}

// --- Date helpers ---

const getTodayDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getRelativeDateString = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const TODAY_DATE = getTodayDateString();
export const YESTERDAY_DATE = getRelativeDateString(-1);

// --- Test data generator ---

export function generateTestPatientsAndAbonnements() {
  const newPatients: Patient[] = [];
  const newAbonnements: Abonnement[] = [];
  let currentPatientId = 101;
  let currentAbnId = 101;

  for (let i = 1; i <= 20; i++) {
    const id = currentPatientId++;
    let aff = 'Intensif 2e';
    if (i <= 7) aff = 'Intensif 2e';
    else if (i <= 14) aff = 'Intensif 3e';
    else aff = 'Intensif 4e';

    newPatients.push({
      ID_Patient: id,
      Nom_Patient: `IMC Test ${i}`,
      Nom_Pat_Arb: `إم سي ${i}`,
      Pren_Pat_Arb: `تجربة ${i}`,
      Genre_Patient: 'Enfant',
      type_patient: 'Enfant IMC',
      phone: `06001112${String(i).padStart(2, '0')}`,
      address: `Adresse IMC ${i}`,
      street: `Rue IMC ${i}`,
      city: 'Alger',
      wilaya: '16',
      Age_Patient: 9,
      Age_Pat: 9,
      affectation: aff,
      Affect_Pat_IMC: aff,
      Nbre_Abn: 1
    });

    newAbonnements.push({
      ID_Abn: currentAbnId++,
      ID_Patient: id,
      ID_Pack: 4,
      Date_Debut_Abn: '2026-01-01',
      Date_Fin_Abn: '2026-12-31',
      Nbre_Sean_Consom_Abn: 0,
      ID_Acte_Add1: null,
      ID_Acte_Add2: null,
      Etat: 'Actif'
    });
  }

  for (let i = 1; i <= 20; i++) {
    const id = currentPatientId++;
    newPatients.push({
      ID_Patient: id,
      Nom_Patient: `Enfant Test ${i}`,
      Nom_Pat_Arb: `طفل ${i}`,
      Pren_Pat_Arb: `تجربة ${i}`,
      Genre_Patient: 'Enfant',
      type_patient: 'Enfant',
      phone: `06002223${String(i).padStart(2, '0')}`,
      address: `Adresse Enfant ${i}`,
      street: `Rue Enfant ${i}`,
      city: 'Alger',
      wilaya: '16',
      Age_Patient: 10,
      Age_Pat: 10,
      Nbre_Abn: 0
    });
  }

  for (let i = 1; i <= 20; i++) {
    const id = currentPatientId++;
    const hasAbn = i <= 10;
    const genre = i % 2 === 0 ? 'Homme' : 'Femme';

    newPatients.push({
      ID_Patient: id,
      Nom_Patient: `Adulte Test ${i}`,
      Nom_Pat_Arb: `بالغ ${i}`,
      Pren_Pat_Arb: `تجربة ${i}`,
      Genre_Patient: genre as 'Homme' | 'Femme',
      type_patient: 'Adulte',
      phone: `06003334${String(i).padStart(2, '0')}`,
      address: `Adresse Adulte ${i}`,
      street: `Rue Adulte ${i}`,
      city: 'Alger',
      wilaya: '16',
      Age_Patient: 35,
      Age_Pat: 35,
      Nbre_Abn: hasAbn ? 1 : 0
    });

    if (hasAbn) {
      newAbonnements.push({
        ID_Abn: currentAbnId++,
        ID_Patient: id,
        ID_Pack: 1,
        Date_Debut_Abn: '2026-01-01',
        Date_Fin_Abn: '2026-12-31',
        Nbre_Sean_Consom_Abn: 0,
        ID_Acte_Add1: null,
        ID_Acte_Add2: null,
        Etat: 'Actif'
      });
    }
  }

  return { newPatients, newAbonnements };
}

const TEST_DATA = generateTestPatientsAndAbonnements();

// --- Pre-seeded initial data (immutable blueprint) ---

export const INITIAL_DATABASE: DatabaseState = {
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
    { ID_Utilisateur: 10, ID_Sce: 2, Nom_Utilisateur: 'Dr. ZOUAOUI MPR', Role: 'Médecin MPR', Login: 'zouaoui', MotDePasse: 'zouaoui' },
    { ID_Utilisateur: 11, ID_Sce: 1, Nom_Utilisateur: 'M. AIMENE (Marketing)', Role: 'Marketing', Login: 'aimene', MotDePasse: 'aimene' },
    { ID_Utilisateur: 12, ID_Sce: 1, Nom_Utilisateur: 'Super Réceptionniste', Role: 'SupperRec', Login: 'super_rec', MotDePasse: 'super_rec' }
  ],
  praticiens: [
    { ID_Prat: 1, ID_Sce: 1, Repere: 'K', Nom_Prat: 'Dupuis', Prenom_Prat: 'Jeanne', Nom_Arb: 'دوبوي', Date_Nais_Prat: '1988-04-12', Date_Recrut_Prat: '2020-01-15', Type_Cont_Prat: 'CDI', Genre_Prat: 'F' },
    { ID_Prat: 2, ID_Sce: 2, Repere: 'K', Nom_Prat: 'Robert', Prenom_Prat: 'Marc', Nom_Arb: 'روبير', Date_Nais_Prat: '1992-09-05', Date_Recrut_Prat: '2021-03-01', Type_Cont_Prat: 'CDI', Genre_Prat: 'H' },
    { ID_Prat: 3, ID_Sce: 3, Repere: 'P', Nom_Prat: 'Alami', Prenom_Prat: 'Sarah', Nom_Arb: 'علمي', Date_Nais_Prat: '1985-11-20', Date_Recrut_Prat: '2019-10-10', Type_Cont_Prat: 'CDI', Genre_Prat: 'F' },
    { ID_Prat: 4, ID_Sce: 1, Repere: 'O', Nom_Prat: 'Fassi', Prenom_Prat: 'Youssef', Nom_Arb: 'فاسي', Date_Nais_Prat: '1990-07-22', Date_Recrut_Prat: '2022-05-15', Type_Cont_Prat: 'CDD', Genre_Prat: 'H' },
    { ID_Prat: 5, ID_Sce: 3, Repere: 'K', Nom_Prat: 'Girard', Prenom_Prat: 'Léa', Nom_Arb: 'جيرار', Date_Nais_Prat: '1994-02-18', Date_Recrut_Prat: '2023-09-01', Type_Cont_Prat: 'CDD', Genre_Prat: 'F' },
    { ID_Prat: 6, ID_Sce: 4, Repere: 'K', Nom_Prat: 'Meziane', Prenom_Prat: 'Nadir', Nom_Arb: 'مزيان', Date_Nais_Prat: '1991-03-14', Date_Recrut_Prat: '2021-06-01', Type_Cont_Prat: 'CDI', Genre_Prat: 'H' },
    { ID_Prat: 7, ID_Sce: 4, Repere: 'K', Nom_Prat: 'Slimani', Prenom_Prat: 'Kahina', Nom_Arb: 'سليمانi', Date_Nais_Prat: '1995-07-19', Date_Recrut_Prat: '2022-11-01', Type_Cont_Prat: 'CDD', Genre_Prat: 'F' },
    { ID_Prat: 8, ID_Sce: 5, Repere: 'K', Nom_Prat: 'Belkacemi', Prenom_Prat: 'Kamel', Nom_Arb: 'بلقاسمي', Date_Nais_Prat: '1989-10-25', Date_Recrut_Prat: '2018-05-15', Type_Cont_Prat: 'CDI', Genre_Prat: 'H' },
    { ID_Prat: 9, ID_Sce: 5, Repere: 'K', Nom_Prat: 'Ould', Prenom_Prat: 'Amel', Nom_Arb: 'ولد', Date_Nais_Prat: '1993-12-04', Date_Recrut_Prat: '2023-01-10', Type_Cont_Prat: 'CDD', Genre_Prat: 'F' }
  ],
  actes: [
    { ID_Acte: 1, Libelle_Acte: 'Séance de Kinésithérapie', Prix_Acte: 150, Const_Act: false, Receptionniste_Autorises: ['Receptionniste Réeducation', 'Receptionniste RDC'] },
    { ID_Acte: 2, Libelle_Acte: 'Séances Balneothérapies', Prix_Acte: 200, Const_Act: false, Receptionniste_Autorises: ['Receptionniste Balnéothérapie', 'Receptionniste RDC'] },
    { ID_Acte: 3, Libelle_Acte: 'Séances Psychomotricités', Prix_Acte: 180, Const_Act: false, Receptionniste_Autorises: ['Receptionniste RDC', 'Receptionniste Réeducation', 'Receptionniste Balnéothérapie', 'Receptionniste Intensif 2e', 'Receptionniste Intensif 3e', 'Receptionniste Intensif 4e'] },
    { ID_Acte: 4, Libelle_Acte: 'Séances Orthophonies', Prix_Acte: 170, Const_Act: false, Receptionniste_Autorises: ['Receptionniste RDC', 'Receptionniste Réeducation', 'Receptionniste Balnéothérapie', 'Receptionniste Intensif 2e', 'Receptionniste Intensif 3e', 'Receptionniste Intensif 4e'] },
    { ID_Acte: 5, Libelle_Acte: "Séances d'ergothérapies", Prix_Acte: 160, Const_Act: false, Receptionniste_Autorises: ['Receptionniste RDC', 'Receptionniste Réeducation', 'Receptionniste Balnéothérapie', 'Receptionniste Intensif 2e', 'Receptionniste Intensif 3e', 'Receptionniste Intensif 4e'] },
    { ID_Acte: 6, Libelle_Acte: 'Consultation MPR Adulte', Prix_Acte: 2500, Const_Act: true, Receptionniste_Autorises: ['Receptionniste RDC'] },
    { ID_Acte: 7, Libelle_Acte: 'Consultation MPR Enfant', Prix_Acte: 2500, Const_Act: true, Receptionniste_Autorises: ['Receptionniste RDC'] }
  ],
  packs: [
    { ID_Pack: 1, Libelle_Pack: 'Forfait Kinésithérapie (10 séanc.)', Nbre_Seance_Pack: 10, Prix_Pack: 1500, Prix_Seanc_Pack: 150, Cat_Pack: 'R' },
    { ID_Pack: 2, Libelle_Pack: 'Forfait Balnéothérapie (12 séanc.)', Nbre_Seance_Pack: 12, Prix_Pack: 2400, Prix_Seanc_Pack: 200, Cat_Pack: 'B' },
    { ID_Pack: 3, Libelle_Pack: 'Forfait Multidisciplinaire Intensif (20 séanc.)', Nbre_Seance_Pack: 20, Prix_Pack: 4500, Prix_Seanc_Pack: 225, Cat_Pack: 'I' },
    { ID_Pack: 4, Libelle_Pack: 'Pack 62 H', Nbre_Seance_Pack: 62, Prix_Pack: 9300, Prix_Seanc_Pack: 150, Cat_Pack: 'R' }
  ],
  patients: [
    { ID_Patient: 1, Nom_Patient: 'Jean Martin', Nom_Pat_Arb: 'مارتن', Pren_Pat_Arb: 'جان', Genre_Patient: 'Homme', type_patient: 'Adulte', phone: '0550123456', address: "12 Rue Larbi Ben M'hidi", street: "Rue Larbi Ben M'hidi", city: 'Alger Centre', wilaya: '16', Age_Patient: 45, Age_Pat: 45, Nbre_Abn: 1, Nbre_Abn_Pat: 1, Date_Nais_Pat: '1981-05-15' },
    { ID_Patient: 2, Nom_Patient: 'Alice Dubois', Nom_Pat_Arb: 'دوبوا', Pren_Pat_Arb: 'أليس', Genre_Patient: 'Femme', type_patient: 'Adulte', phone: '0661987654', address: '04 Boulevard de la Soummam', street: 'Boulevard de la Soummam', city: 'Oran', wilaya: '31', Age_Patient: 34, Age_Pat: 34, Nbre_Abn: 1, Nbre_Abn_Pat: 1, Date_Nais_Pat: '1992-08-20' },
    { ID_Patient: 3, Nom_Patient: 'Ahmed Mansouri', Nom_Pat_Arb: 'منصوري', Pren_Pat_Arb: 'أحمد', Genre_Patient: 'Enfant', type_patient: 'Enfant IMC', phone: '0770456123', address: 'Villa 15, Les Eucalyptus', street: 'Les Eucalyptus', city: 'Constantine', wilaya: '25', Age_Patient: 12, Age_Pat: 12, affectation: 'Intensif 3e', Nbre_Abn: 1, Nbre_Abn_Pat: 1, Date_Nais_Pat: '2014-03-10' },
    { ID_Patient: 4, Nom_Patient: 'Clara Bernard', Nom_Pat_Arb: 'برنار', Pren_Pat_Arb: 'كلارا', Genre_Patient: 'Enfant', type_patient: 'Enfant', phone: '0555321654', address: 'Quartier Bab El Khouis', street: 'Bab El Khouis', city: 'Blida', wilaya: '09', Age_Patient: 8, Age_Pat: 8, Nbre_Abn: 0, Nbre_Abn_Pat: 0, Date_Nais_Pat: '2018-11-22' },
    { ID_Patient: 1000, Nom_Patient: 'GUELLAB ABDELKADER', Nom_Pat_Arb: 'غلاب', Pren_Pat_Arb: 'عبد القادر', Genre_Patient: 'Homme', type_patient: 'Adulte', phone: '0550112233', address: 'Alger', street: 'Rue Didouche Mourad', city: 'Alger', wilaya: '16', Age_Patient: 52, Age_Pat: 52, Nbre_Abn: 1, Nbre_Abn_Pat: 1, Date_Nais_Pat: '1974-03-12' },
    ...TEST_DATA.newPatients
  ],
  abonnements: [
    { ID_Abn: 1, ID_Patient: 1, ID_Pack: 1, Date_Debut_Abn: '2026-05-01', Date_Fin_Abn: '2026-08-31', Nbre_Sean_Consom_Abn: 3, ID_Acte_Add1: 4, ID_Acte_Add2: null, Etat: 'Actif', Date_Abn: '2026-05-01' },
    { ID_Abn: 2, ID_Patient: 2, ID_Pack: 2, Date_Debut_Abn: '2026-05-15', Date_Fin_Abn: '2026-09-15', Nbre_Sean_Consom_Abn: 5, ID_Acte_Add1: null, ID_Acte_Add2: null, Etat: 'Actif', Date_Abn: '2026-05-15' },
    { ID_Abn: 3, ID_Patient: 3, ID_Pack: 3, Date_Debut_Abn: '2026-06-01', Date_Fin_Abn: '2026-07-31', Nbre_Sean_Consom_Abn: 1, ID_Acte_Add1: 3, ID_Acte_Add2: 4, Etat: 'Actif', Date_Abn: '2026-06-01' },
    { ID_Abn: 1000, ID_Patient: 1000, ID_Pack: 1, Date_Debut_Abn: '2026-05-01', Date_Fin_Abn: '2026-11-30', Nbre_Sean_Consom_Abn: 2, ID_Acte_Add1: null, ID_Acte_Add2: null, Etat: 'Actif', Date_Abn: '2026-05-01' },
    ...TEST_DATA.newAbonnements
  ],
  versements: [
    { ID_Vers: 1, ID_Abn: 1, Mont_Vers: 500, Date_Vers: '2026-05-02 11:30' },
    { ID_Vers: 2, ID_Abn: 1, Mont_Vers: 1000, Date_Vers: '2026-05-12 15:45' },
    { ID_Vers: 1000, ID_Abn: 1000, Mont_Vers: 500, Date_Vers: '2026-05-02 10:00' },
    { ID_Vers: 1001, ID_Abn: 1000, Mont_Vers: 1000, Date_Vers: '2026-05-15 14:00' }
  ],
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
    { ID_Regle: 10, Jour_Semaine: 5, Demi_Journee: 'Apres-midi', Genre_Autorise: 'F' }
  ],
  rendezVous: [
    { ID_RDV: 1, ID_Patient: 1, ID_Prat: 1, ID_Acte: 1, ID_Type_Plan: 1, ID_Zone: 1, ID_Utilisateur: 2, Date_RDV: TODAY_DATE, H_Debut_RDV: '09:00', H_Fin_RDV: '10:00', Statut_RDV: 'Honoré' },
    { ID_RDV: 2, ID_Patient: 2, ID_Prat: 2, ID_Acte: 2, ID_Type_Plan: 2, ID_Zone: 3, ID_Utilisateur: 3, Date_RDV: TODAY_DATE, H_Debut_RDV: '14:30', H_Fin_RDV: '15:30', Statut_RDV: 'Planifié' },
    { ID_RDV: 3, ID_Patient: 3, ID_Prat: 3, ID_Acte: 3, ID_Type_Plan: 3, ID_Zone: 4, ID_Utilisateur: 4, Date_RDV: TODAY_DATE, H_Debut_RDV: '10:00', H_Fin_RDV: '11:00', Statut_RDV: 'Planifié' }
  ],
  seances: [
    { ID_Seanc: 1, ID_Patient: 1, ID_Prat: 1, ID_Acte: 1, ID_Abn: 1, ID_RDV: 1, H_Debut_Seanc: '09:00', H_Fin_Seanc: '10:00', Prix_Seanc: 150, Date_Seanc_Realisee: TODAY_DATE }
  ],
  fileAttente: [
    { ID_File: 1, ID_Patient: 1, ID_RDV: 1, ID_Prat: 1, Num_Ticket: 'C-01', Heure_Arrivee: '08:00', Heure_Appel: '08:15', Heure_Cloture: '08:45', Statut_Attente: 'Terminé', Date_File: TODAY_DATE },
    { ID_File: 2, ID_Patient: 2, ID_RDV: 2, ID_Prat: 2, Num_Ticket: 'C-02', Heure_Arrivee: '14:15', Heure_Appel: '14:30', Heure_Cloture: null, Statut_Attente: 'En Consultation', Date_File: TODAY_DATE },
    { ID_File: 3, ID_Patient: 4, ID_RDV: null, ID_Prat: 4, Num_Ticket: 'C-03', Heure_Arrivee: '15:00', Heure_Appel: null, Heure_Cloture: null, Statut_Attente: 'En Attente', Date_File: TODAY_DATE }
  ],
  fileAttenteIMC: [],
  factures: [
    { ID_Facture: 1, ID_Patient: 3, Montant: 450, Date_Facture: TODAY_DATE, Statut: 'Validée' },
    { ID_Facture: 2, ID_Patient: 1, Montant: 150, Date_Facture: YESTERDAY_DATE, Statut: 'Payée' },
    { ID_Facture: 3, ID_Patient: 2, Montant: 200, Date_Facture: TODAY_DATE, Statut: 'Payée' }
  ],
  consultations: [
    { id: 1, patient_id: 1, date_consultation: '2026-06-01', medecin_mpr_nom: 'Dr. Belhadj MPR', marche_sans_aide_technique: false, anteversion_bassin: true, commentaires: 'Patient présentant un déficit de force distale et une antéversion du bassin après entorse grave.' },
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
    { id: 2, code_regle: 'FORCE_INF_4', categorie_acte: 'renforcement', intitule_acte_auto: 'Renforcement analytique et fonctionnel en charge des muscles distaux' },
    { id: 3, code_regle: 'SPASTICITE_P_M', categorie_acte: 'therapie_manuelle', intitule_acte_auto: 'Étirements prolongés des muscles spastiques (Ischio-jambiers, Adducteurs)' },
    { id: 4, code_regle: 'BASSIN_ANTE', categorie_acte: 'renforcement', intitule_acte_auto: "Gainage lombo-pelvien profond (Core stability) pour correction de l'antéversion du bassin" }
  ],
  fichesKineAutomatisees: [
    { id: 1, consultation_id: 1, nombre_seances_kine: 10, nombre_seances_balneo: 2, frequence_hebdo: 3, duree_quotidienne_minutes: 45, date_generation: '2026-06-01 10:30' },
    { id: 2, consultation_id: 2, nombre_seances_kine: 12, nombre_seances_balneo: 6, frequence_hebdo: 4, duree_quotidienne_minutes: 30, date_generation: '2026-06-03 11:15' }
  ],
  detailsFicheActes: [
    { id: 1, fiche_id: 1, categorie_acte: 'renforcement', intitule_acte: 'Renforcement analytique et fonctionnel en charge des muscles distaux' },
    { id: 2, fiche_id: 1, categorie_acte: 'renforcement', intitule_acte: "Gainage lombo-pelvien profond (Core stability) pour correction de l'antéversion du bassin" },
    { id: 3, fiche_id: 2, categorie_acte: 'therapie_manuelle', intitule_acte: "Mobilisation passive, gain d'amplitude en extension et postures des genoux" },
    { id: 4, fiche_id: 2, categorie_acte: 'therapie_manuelle', intitule_acte: 'Étirements prolongés des muscles spastiques (Ischio-jambiers, Adducteurs)' }
  ],
  callCentreEntries: [
    { id: 'cc-1', provenance: 'Alger', phone: '0555123456', typeActe: 'Réeducation Adulte', sources: ['Réseaux Sociaux', 'CallCentre'], dateSaisie: '2026-06-01', agentSaisie: 'BENKARI Mhand' },
    { id: 'cc-2', provenance: 'Oran', phone: '0661987654', typeActe: 'Balnéothérapie', sources: ['Bouche à Oreille'], dateSaisie: '2026-06-03', agentSaisie: 'Mme SOUMAYA (Assistante)' },
    { id: 'cc-3', provenance: 'Constantine', phone: '0770246813', typeActe: 'Intensif IMC', sources: ['Médecin'], dateSaisie: TODAY_DATE, agentSaisie: 'Melle FELLA' },
    { id: 'cc-4', provenance: 'Sétif', phone: '0560987123', typeActe: 'Réeducation Adulte', sources: ['Tik Tok', 'Réseaux Sociaux'], dateSaisie: '2026-06-08', agentSaisie: 'Mme RACHA' },
    { id: 'cc-5', provenance: 'Blida', phone: '0671458962', typeActe: 'Balnéothérapie', sources: ['CallCentre'], dateSaisie: '2026-06-12', agentSaisie: 'BENKARI Mhand' }
  ],
  typesPatients: ['Adulte', 'Enfant', 'Enfant IMC'],
  chatChannels: [],
  chatMessages: [],
  chat_messages: [],
  notifications: [],
  patientsEnPause: [],
  depenses: [],
  categories_depenses: ['Fournitures médicales', 'Produits entretien', 'Équipement', 'Frais divers', 'Alimentation/Restauration', 'Transport', 'Salaires/Primes', 'Autre']
};

// --- Deep clone & helpers ---

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function createInitialDatabase(): DatabaseState {
  return deepClone(INITIAL_DATABASE);
}

function deduplicateById<T>(arr: T[], idKey: keyof T): T[] {
  const seen = new Set<string>();
  return arr.filter(item => {
    const val = String(item[idKey]);
    if (!val || seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

function mergeReferenceArrays<T>(
  defaults: T[],
  saved: T[] | undefined,
  idKey: keyof T,
  mergeFn?: (def: T, saved: T) => T
): T[] {
  if (!saved || !Array.isArray(saved)) return deepClone(defaults);
  const result = deepClone(saved);
  const savedIds = new Set(result.map(item => String(item[idKey])));
  defaults.forEach(def => {
    const defId = String(def[idKey]);
    if (!savedIds.has(defId)) {
      result.push(deepClone(def));
    } else if (mergeFn) {
      const idx = result.findIndex(item => String(item[idKey]) === defId);
      if (idx !== -1) {
        result[idx] = mergeFn(def, result[idx]);
      }
    }
  });
  return result;
}

// --- Local storage persistence ---

const STORAGE_KEY = 'mhand_rehabilitation_db';

export function getStoredDatabase(): DatabaseState {
  if (typeof window === 'undefined') {
    return createInitialDatabase();
  }

  let raw = localStorage.getItem('appState') || localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const initial = createInitialDatabase();
    try {
      localStorage.setItem('appState', JSON.stringify(initial));
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Initial localStorage write failed:', e);
    }
    return initial;
  }

  // Decompress if compressed with LZString
  if (raw.startsWith('LZ:')) {
    try {
      const decompressed = LZString.decompressFromUTF16(raw.slice(3));
      if (decompressed) {
        raw = decompressed;
      }
    } catch (err) {
      console.warn('Failed to decompress LZString data from localStorage', err);
    }
  }

  // Migrate old key if present
  if (localStorage.getItem(STORAGE_KEY)) {
    try {
      localStorage.setItem('appState', raw);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Migration to appState failed:', e);
    }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Parsed localStorage data is not a valid object, returning initial database.');
      return createInitialDatabase();
    }
    
    // Valider les actes du localStorage au démarrage
    if (parsed.actes && Array.isArray(parsed.actes)) {
      parsed.actes = parsed.actes.filter((a: any) => a && a.ID_Acte && a.Libelle_Acte);
    }

    const base = createInitialDatabase();
    if (Array.isArray(parsed.actes)) {
      base.actes = deepClone(parsed.actes);
    } else {
      base.actes = deepClone(INITIAL_DATABASE.actes);
    }

    // 1. Reference data: merge saved over defaults, add missing defaults
    base.utilisateurs = mergeReferenceArrays(
      base.utilisateurs,
      parsed.utilisateurs,
      'ID_Utilisateur',
      (def, saved) => ({ ...def, ...saved })
    );
    base.services = mergeReferenceArrays(base.services, parsed.services, 'ID_Sce');
    base.packs = mergeReferenceArrays(base.packs, parsed.packs, 'ID_Pack');
    base.praticiens = mergeReferenceArrays(base.praticiens, parsed.praticiens, 'ID_Prat');
    base.typesPlanning = mergeReferenceArrays(base.typesPlanning, parsed.typesPlanning, 'ID_Type_Plan');
    base.zones = mergeReferenceArrays(base.zones, parsed.zones, 'ID_Zone');
    base.reglesBalneo = mergeReferenceArrays(base.reglesBalneo, parsed.reglesBalneo, 'ID_Regle');

    // 2. Transactional / clinical data: trust saved data directly
    if (Array.isArray(parsed.patients)) base.patients = deepClone(parsed.patients);
    if (Array.isArray(parsed.abonnements)) base.abonnements = deepClone(parsed.abonnements);
    if (Array.isArray(parsed.versements)) base.versements = deepClone(parsed.versements);
    if (Array.isArray(parsed.rendezVous)) base.rendezVous = deepClone(parsed.rendezVous);
    if (Array.isArray(parsed.seances)) base.seances = deepClone(parsed.seances);
    if (Array.isArray(parsed.fileAttente)) base.fileAttente = deepClone(parsed.fileAttente);
    if (Array.isArray(parsed.fileAttenteIMC)) base.fileAttenteIMC = deepClone(parsed.fileAttenteIMC);
    if (Array.isArray(parsed.factures)) base.factures = deepClone(parsed.factures);
    if (Array.isArray(parsed.consultations)) base.consultations = deepClone(parsed.consultations);
    if (Array.isArray(parsed.deficitsCliniques)) base.deficitsCliniques = deepClone(parsed.deficitsCliniques);
    if (Array.isArray(parsed.fichesKineAutomatisees)) base.fichesKineAutomatisees = deepClone(parsed.fichesKineAutomatisees);
    if (Array.isArray(parsed.detailsFicheActes)) base.detailsFicheActes = deepClone(parsed.detailsFicheActes);
    if (Array.isArray(parsed.callCentreEntries)) base.callCentreEntries = deepClone(parsed.callCentreEntries);
    if (Array.isArray(parsed.typesPatients)) base.typesPatients = deepClone(parsed.typesPatients);
    if (Array.isArray(parsed.chatChannels)) base.chatChannels = deepClone(parsed.chatChannels);
    if (Array.isArray(parsed.chatMessages)) base.chatMessages = deepClone(parsed.chatMessages);
    if (Array.isArray(parsed.chat_messages)) base.chat_messages = deepClone(parsed.chat_messages);
    if (Array.isArray(parsed.transactions_caisses)) base.transactions_caisses = deepClone(parsed.transactions_caisses);
    if (Array.isArray(parsed.notifications)) base.notifications = deepClone(parsed.notifications);
    if (Array.isArray(parsed.patientsEnPause)) base.patientsEnPause = deepClone(parsed.patientsEnPause);
    if (Array.isArray(parsed.depenses)) base.depenses = deepClone(parsed.depenses);
    else base.depenses = [];

    if (Array.isArray(parsed.categories_depenses) && parsed.categories_depenses.length > 0) {
      base.categories_depenses = deepClone(parsed.categories_depenses);
    } else {
      base.categories_depenses = deepClone(INITIAL_DATABASE.categories_depenses);
    }

    // 3. Clinical rules: always use latest definitions
    base.reglesAutomatisation = deepClone(INITIAL_DATABASE.reglesAutomatisation);

    // 4. Deduplicate all ID-based arrays
    base.utilisateurs = deduplicateById(base.utilisateurs, 'ID_Utilisateur');
    base.actes = deduplicateById(base.actes, 'ID_Acte');
    base.services = deduplicateById(base.services, 'ID_Sce');
    base.packs = deduplicateById(base.packs, 'ID_Pack');
    base.praticiens = deduplicateById(base.praticiens, 'ID_Prat');
    base.typesPlanning = deduplicateById(base.typesPlanning, 'ID_Type_Plan');
    base.zones = deduplicateById(base.zones, 'ID_Zone');
    base.reglesBalneo = deduplicateById(base.reglesBalneo, 'ID_Regle');
    base.patients = deduplicateById(base.patients, 'ID_Patient');
    base.abonnements = deduplicateById(base.abonnements, 'ID_Abn');
    base.versements = deduplicateById(base.versements, 'ID_Vers');
    base.rendezVous = deduplicateById(base.rendezVous, 'ID_RDV');
    base.seances = deduplicateById(base.seances, 'ID_Seanc');
    base.fileAttente = deduplicateById(base.fileAttente, 'ID_File');
    base.fileAttenteIMC = deduplicateById(base.fileAttenteIMC || [], 'ID_File');
    base.factures = deduplicateById(base.factures, 'ID_Facture');
    base.consultations = deduplicateById(base.consultations, 'id');
    base.deficitsCliniques = deduplicateById(base.deficitsCliniques, 'id');
    base.fichesKineAutomatisees = deduplicateById(base.fichesKineAutomatisees, 'id');
    base.detailsFicheActes = deduplicateById(base.detailsFicheActes, 'id');

    // 5. Safety migrations
    // Garantie de l'existence et intégrité du compte Médecin MPR (zouaoui)
    const hasZouaoui = base.utilisateurs.some((u: any) => u.Login && u.Login.trim().toLowerCase() === 'zouaoui');
    if (!hasZouaoui) {
      base.utilisateurs.push({
        ID_Utilisateur: 10,
        ID_Sce: 2,
        Nom_Utilisateur: 'Dr. ZOUAOUI MPR',
        Role: 'Médecin MPR',
        Login: 'zouaoui',
        MotDePasse: 'zouaoui'
      });
    } else {
      base.utilisateurs = base.utilisateurs.map((u: any) => {
        if (u.Login && u.Login.trim().toLowerCase() === 'zouaoui') {
          return {
            ...u,
            ID_Utilisateur: 10,
            ID_Sce: 2,
            Nom_Utilisateur: 'Dr. ZOUAOUI MPR',
            Role: 'Médecin MPR',
            Login: 'zouaoui',
            MotDePasse: 'zouaoui'
          };
        }
        return u;
      });
    }

    base.actes.forEach((a: any) => {
      if (a.Const_Act === undefined) a.Const_Act = false;
    });

    base.packs.forEach((p: any) => {
      const initP = INITIAL_DATABASE.packs.find(ip => ip.ID_Pack === p.ID_Pack);
      if (initP) {
        if (p.Prix_Pack === undefined || p.Prix_Pack === null) p.Prix_Pack = initP.Prix_Pack;
        if (p.Prix_Seanc_Pack === undefined || p.Prix_Seanc_Pack === null) p.Prix_Seanc_Pack = initP.Prix_Seanc_Pack;
      }
    });

    base.abonnements.forEach((ab: any) => {
      if (!ab.Etat) ab.Etat = 'Actif';
    });

    base.patients.forEach((p: any) => {
      if (p.Genre_Patient === 'H') p.Genre_Patient = 'Homme';
      if (p.Genre_Patient === 'F') p.Genre_Patient = 'Femme';
      if (!p.type_patient) p.type_patient = 'Adulte';
      if (p.Age_Pat === undefined || p.Age_Pat === null) {
        p.Age_Pat = p.Age_Patient !== undefined ? p.Age_Patient : (p.Date_Nais_Pat ? calculateAge(p.Date_Nais_Pat) : 35);
      }
      if (p.Nbre_Abn === undefined) {
        p.Nbre_Abn = base.abonnements.filter((a: any) => a.ID_Patient === p.ID_Patient).length;
      }
    });

    base.praticiens.forEach((p: any) => {
      if (!p.Genre_Prat) {
        const lowerName = (p.Prenom_Prat || '').toLowerCase();
        const isFemme = ['jeanne', 'sarah', 'léa', 'amel', 'meriem', 'kahina', 'sonia', 'narimane', 'racha', 'hanane', 'khadidja', 'fella', 'aya', 'soumaya'].some(n => lowerName.includes(n));
        p.Genre_Prat = isFemme ? 'F' : 'H';
      }
    });

    // 6. Date alignment
    const today = TODAY_DATE;
    base.rendezVous = base.rendezVous.map((r: any) => r.Date_RDV === '2026-06-05' ? { ...r, Date_RDV: today } : r);
    base.seances = base.seances.map((s: any) => s.Date_Seanc_Realisee === '2026-06-05' ? { ...s, Date_Seanc_Realisee: today } : s);
    base.fileAttente = base.fileAttente.map((f: any) => f.Date_File === '2026-06-05' ? { ...f, Date_File: today } : f);
    base.fileAttenteIMC = (base.fileAttenteIMC || []).map((f: any) => f.Date_File === '2026-06-05' ? { ...f, Date_File: today } : f);
    base.factures = base.factures.map((f: any) => f.Date_Facture === '2026-06-05' ? { ...f, Date_Facture: today } : f);
    base.callCentreEntries = (base.callCentreEntries || []).map((cc: any) => cc.dateSaisie === '2026-06-05' ? { ...cc, dateSaisie: today } : cc);

    return base;
  } catch (e) {
    console.error('Failed to parse localStorage database, returning fresh initial database:', e);
    return createInitialDatabase();
  }
}

export function saveDatabase(db: DatabaseState): DatabaseState {
  if (typeof window === 'undefined') return db;

  const cleanOldKeys = () => {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 3);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        const match = key.match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
          const keyDate = new Date(match[0]);
          if (keyDate < threshold) localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.warn('Cleanup of old localStorage keys failed:', err);
    }
  };

  const pruneState = (state: DatabaseState): DatabaseState => {
    const pruned = deepClone(state);
    if (Array.isArray(pruned.chatMessages) && pruned.chatMessages.length > 30) pruned.chatMessages = pruned.chatMessages.slice(-30);
    if (Array.isArray(pruned.chat_messages) && pruned.chat_messages.length > 150) pruned.chat_messages = pruned.chat_messages.slice(-150);
    if (Array.isArray(pruned.seances) && pruned.seances.length > 80) pruned.seances = pruned.seances.slice(-80);
    if (Array.isArray(pruned.rendezVous) && pruned.rendezVous.length > 80) pruned.rendezVous = pruned.rendezVous.slice(-80);
    if (Array.isArray(pruned.transactions_caisses) && pruned.transactions_caisses.length > 50) pruned.transactions_caisses = pruned.transactions_caisses.slice(-50);
    if (Array.isArray(pruned.notifications) && pruned.notifications.length > 50) pruned.notifications = pruned.notifications.slice(-50);
    if (Array.isArray(pruned.fichesKineAutomatisees) && pruned.fichesKineAutomatisees.length > 40) pruned.fichesKineAutomatisees = pruned.fichesKineAutomatisees.slice(-40);
    if (Array.isArray(pruned.consultations) && pruned.consultations.length > 40) pruned.consultations = pruned.consultations.slice(-40);
    if (Array.isArray(pruned.fileAttente) && pruned.fileAttente.length > 50) pruned.fileAttente = pruned.fileAttente.slice(-50);
    return pruned;
  };

  try {
    const jsonStr = JSON.stringify(db);
    // Compress with LZString if string length is large (> 100KB)
    if (jsonStr.length > 100000) {
      const compressed = 'LZ:' + LZString.compressToUTF16(jsonStr);
      localStorage.setItem('appState', compressed);
    } else {
      localStorage.setItem('appState', jsonStr);
    }
    localStorage.removeItem(STORAGE_KEY);
    return db;
  } catch (e: any) {
    const isQuota = e.name === 'QuotaExceededError' ||
                    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                    e.code === 22 ||
                    e.code === 1014;
    if (isQuota) {
      try {
        cleanOldKeys();
        localStorage.removeItem(STORAGE_KEY);
        const jsonStr = JSON.stringify(db);
        const compressed = 'LZ:' + LZString.compressToUTF16(jsonStr);
        localStorage.setItem('appState', compressed);
        return db;
      } catch (e2: any) {
        try {
          const pruned = pruneState(db);
          const jsonStr = JSON.stringify(pruned);
          const compressed = 'LZ:' + LZString.compressToUTF16(jsonStr);
          localStorage.setItem('appState', compressed);
          console.warn('Database pruned & compressed successfully after quota exceeded.');
          return pruned;
        } catch (e3: any) {
          console.warn('localStorage quota totally exceeded. Database kept in RAM only for this session.');
          return db;
        }
      }
    } else {
      console.warn('localStorage save warning:', e);
      return db;
    }
  }
}

// --- Age calculation ---

export function calculateAge(birthdateStr: string): number {
  if (!birthdateStr) return 0;
  const birthDate = new Date(birthdateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// --- Subscription helpers ---

export function getRemainingSessions(abn: Abonnement, dbState: DatabaseState): number {
  if (!dbState.packs) return 0;
  const pkg = dbState.packs.find(p => Number(p.ID_Pack) === Number(abn.ID_Pack));
  if (!pkg) return 0;
  return Math.max(0, pkg.Nbre_Seance_Pack - abn.Nbre_Sean_Consom_Abn);
}

export function isSubscriptionCoveringActe(abn: Abonnement, acteId: number, dbState: DatabaseState): boolean {
  if (!abn || !dbState.packs) return false;
  if (abn.ID_Acte_Add1 !== null && Number(abn.ID_Acte_Add1) === Number(acteId)) return true;
  if (abn.ID_Acte_Add2 !== null && Number(abn.ID_Acte_Add2) === Number(acteId)) return true;
  const pack = dbState.packs.find(p => Number(p.ID_Pack) === Number(abn.ID_Pack));
  const packId = Number(abn.ID_Pack);
  const cat = pack?.Cat_Pack as any;
  if (packId === 1 && acteId === 1) return true;
  if (packId === 2 && acteId === 2) return true;
  if (packId === 3 && [1, 2, 3, 4, 5, 10].includes(acteId)) return true;
  if (packId === 4 && [1, 10].includes(acteId)) return true;
  if (cat === 'R' && [1, 10].includes(acteId)) return true;
  if (cat === 'B' && acteId === 2) return true;
  if (cat === 'P' && acteId === 3) return true;
  if (cat === 'O' && acteId === 4) return true;
  if (cat === 'E' && acteId === 5) return true;
  if (cat === 'I' && [1, 2, 3, 4, 5, 10].includes(acteId)) return true;
  return false;
}

export function synchroniserConsommationAbonnements(dbState: DatabaseState): DatabaseState {
  if (!dbState || !dbState.abonnements) return dbState;
  const updatedAbonnements = dbState.abonnements.map(abn => {
    if (abn.Etat === 'Fermé') return abn;
    const abnSeances = dbState.seances.filter(s => Number(s.ID_Abn) === Number(abn.ID_Abn));
    const packId = Number(abn.ID_Pack);
    const uniqueSlots = new Set<string>();
    abnSeances.forEach(seance => {
      const rdv = dbState.rendezVous.find(r => r.ID_RDV === seance.ID_RDV);
      const dateStr = seance.Date_Seanc_Realisee || rdv?.Date_RDV || '';
      if (!dateStr) return;
      if (packId === 2) {
        const timeStr = rdv?.H_Debut_RDV || '08:00';
        const hour = parseInt(timeStr.split(':')[0], 10);
        const period = hour < 13 ? 'Matin' : 'Apres-midi';
        uniqueSlots.add(`${dateStr}_${period}`);
      } else if (packId === 3) {
        const isBalneo = Number(seance.ID_Acte) === 2 || Number(rdv?.ID_Acte) === 2;
        if (isBalneo) {
          const timeStr = rdv?.H_Debut_RDV || '08:00';
          const hour = parseInt(timeStr.split(':')[0], 10);
          const period = hour < 14 ? 'Matin' : 'Apres-midi';
          uniqueSlots.add(`balneo_${dateStr}_${period}`);
        } else {
          const timeStr = seance.H_Debut_Seanc || rdv?.H_Debut_RDV || '08:00';
          uniqueSlots.add(`reeduc_${dateStr}_${timeStr}`);
        }
      } else {
        const timeStr = seance.H_Debut_Seanc || rdv?.H_Debut_RDV || '08:00';
        uniqueSlots.add(`${dateStr}_${timeStr}`);
      }
    });
    return { ...abn, Nbre_Sean_Consom_Abn: uniqueSlots.size };
  });
  return { ...dbState, abonnements: updatedAbonnements };
}

export function isAbonnementGele(abn: Abonnement, dbState: DatabaseState): boolean {
  if (!abn) return false;
  if (abn.Etat === 'Fermé') return false;
  if ((abn as any).Est_Gele === true) return true;
  const abnVersements = dbState.versements.filter(v => Number(v.ID_Abn) === Number(abn.ID_Abn));
  const totalPaidAmount = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
  if (totalPaidAmount <= 0) return true;
  const pack = dbState.packs.find(p => Number(p.ID_Pack) === Number(abn.ID_Pack));
  if (!pack) return false;
  const prixSeance = pack.Prix_Seanc_Pack || (pack.Prix_Pack ? pack.Prix_Pack / (pack.Nbre_Seance_Pack || 1) : 150);
  const montantConsomme = abn.Nbre_Sean_Consom_Abn * prixSeance;
  return montantConsomme > totalPaidAmount;
}

export function synchroniserEtatsAbonnements(dbState: DatabaseState): DatabaseState {
  if (!dbState || !dbState.abonnements) return dbState;
  const withRecalculated = synchroniserConsommationAbonnements(dbState);
  const updatedAbns = withRecalculated.abonnements.map(abn => {
    if (abn.Etat === 'Fermé') return abn;
    const isGele = isAbonnementGele(abn, withRecalculated);
    return { ...abn, Etat: (isGele ? 'Gelé' : 'Actif') as 'Gelé' | 'Actif' | 'Fermé' };
  });
  return { ...withRecalculated, abonnements: updatedAbns };
}

// --- Appointment helpers ---

export function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMin = (t: string) => {
    if (!t) return 0;
    const parts = String(t).split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };
  return toMin(startA) < toMin(endB) && toMin(startB) < toMin(endA);
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  info: string[];
}

export function validateAppointment(
  rdv: Omit<Rendez_Vous, 'ID_RDV'> & { ID_RDV?: number },
  db: DatabaseState
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const patient = db.patients.find(p => p.ID_Patient === Number(rdv.ID_Patient));
  const prat = db.praticiens.find(p => p.ID_Prat === Number(rdv.ID_Prat));
  const zone = db.zones.find(z => z.ID_Zone === Number(rdv.ID_Zone));
  const planType = db.typesPlanning.find(t => t.ID_Type_Plan === Number(rdv.ID_Type_Plan));
  const acte = db.actes.find(a => a.ID_Acte === Number(rdv.ID_Acte));

  if (!patient || !prat || !zone || !planType || !acte) {
    errors.push("Sélection d'éléments invalide ou inexistante à l'intérieur de nos tables parent.");
    return { errors, warnings, info };
  }

  // Anti-doublon patient
  const patientConflictRDVs = db.rendezVous.filter(r => {
    if (r.ID_RDV === rdv.ID_RDV) return false;
    if (r.Statut_RDV === 'Annulé') return false;
    if (Number(r.ID_Patient) !== Number(rdv.ID_Patient)) return false;
    if (r.Date_RDV !== rdv.Date_RDV) return false;
    return timesOverlap(rdv.H_Debut_RDV, rdv.H_Fin_RDV, r.H_Debut_RDV, r.H_Fin_RDV);
  });
  if (patientConflictRDVs.length > 0) {
    errors.push(`Erreur d'enclenchement : patient ${patient.Nom_Patient} figure déjà sur ce créneau horaire (${rdv.H_Debut_RDV}) de ce jour.`);
  }

  // Ortho/Psycho double booking check
  const savedOrthoAssignments = typeof window !== 'undefined' ? window.localStorage.getItem('ortho_psycho_assignments') : null;
  if (savedOrthoAssignments) {
    try {
      const orthoGrid = JSON.parse(savedOrthoAssignments);
      const orthoConflictKey = Object.keys(orthoGrid).find(key => {
        const parts = key.split('_');
        if (parts.length < 3) return false;
        const [date, , orthoHour] = parts;
        if (date !== rdv.Date_RDV) return false;
        const assign = orthoGrid[key];
        const pId = assign && typeof assign === 'object' ? assign.patientId : assign;
        if (Number(pId) !== Number(rdv.ID_Patient)) return false;
        const orthoEnd = `${String(parseInt(orthoHour.split(':')[0], 10) + 1).padStart(2, '0')}:00`;
        return timesOverlap(rdv.H_Debut_RDV, rdv.H_Fin_RDV, orthoHour, orthoEnd);
      });
      if (orthoConflictKey) {
        const parts = orthoConflictKey.split('_');
        const orthoHour = parts[2];
        const pratId = Number(parts[1]);
        const orthoPrat = db.praticiens.find(p => p.ID_Prat === pratId);
        const rep = (orthoPrat?.Repere || '').trim().toUpperCase();
        const specialty = rep === 'O' ? 'Orthophonie' : 'Psychomotricité';
        const pratName = orthoPrat ? `${orthoPrat.Prenom_Prat} ${orthoPrat.Nom_Prat}` : 'un thérapeute';
        errors.push(`[BLOQUÉ] Double réservation interdite : Le patient a déjà une séance de ${specialty} planifiée aujourd'hui à ${orthoHour} avec ${pratName} dans le module Ortho/Psycho.`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Subscription validation
  const abn = db.abonnements.find(a => {
    if (a.ID_Patient !== patient.ID_Patient) return false;
    if (a.Etat === 'Fermé') return false;
    if (!isSubscriptionCoveringActe(a, Number(acte.ID_Acte), db)) return false;
    const remaining = getRemainingSessions(a, db);
    return (rdv.Date_RDV <= a.Date_Fin_Abn || remaining > 0);
  });

  if (abn) {
    const remaining = getRemainingSessions(abn, db);
    let covered = isSubscriptionCoveringActe(abn, Number(acte.ID_Acte), db);
    if (abn.ID_Acte_Add1 === acte.ID_Acte) {
      info.push(`Soin couvert sous prescrit optionnel médical : Acte Optionnel Add_1 (${acte.Libelle_Acte}).`);
    } else if (abn.ID_Acte_Add2 === acte.ID_Acte) {
      info.push(`Soin couvert sous prescrit optionnel médical : Acte Optionnel Add_2 (${acte.Libelle_Acte}).`);
    }
    if (!covered) {
      warnings.push(`Soin Hors Forfait : Le soin "${acte.Libelle_Acte}" n'est pas couvert par son Abonnement actif. Ce rendez-vous sera facturé au tarif unitaire de ${acte.Prix_Acte} DH.`);
    } else if (remaining <= 0) {
      warnings.push(`Forfait Épuisé : L'Abonnement du patient pour ce pack n'a plus de séances disponibles. Ce rendez-vous sera facturé au tarif normal.`);
    } else {
      info.push(`Abonnement Validé : Couvert par son abonnement actif (Séances restantes : ${remaining}).`);
    }
  } else {
    warnings.push(`Aucun Abonnement Actif : Ce patient n'a pas d'abonnement actif à la date du ${rdv.Date_RDV}. Cette séance sera facturée au prix unitaire de ${acte.Prix_Acte} DH.`);
  }

  // Balnéo gender rules
  const isBalneoZone = zone.ID_Zone === 3 || zone.Nom_Zone.toLowerCase().includes('balneo') || zone.Nom_Zone.toLowerCase().includes('bassin');
  if (isBalneoZone) {
    const dateObj = new Date(rdv.Date_RDV);
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    const startHour = parseInt(rdv.H_Debut_RDV.split(':')[0], 10);
    const period: 'Matin' | 'Apres-midi' = startHour < 13 ? 'Matin' : 'Apres-midi';
    const matchingRule = db.reglesBalneo.find(r => r.Jour_Semaine === dayOfWeek && r.Demi_Journee === period);
    if (matchingRule) {
      const patGenderCode = patient.Genre_Patient === 'Homme' ? 'H' : patient.Genre_Patient === 'Femme' ? 'F' : 'E';
      if (patGenderCode !== matchingRule.Genre_Autorise) {
        errors.push(`[BLOQUÉ] Règle Balnéo Non Respectée : Le créneau du ${rdv.Date_RDV} (${period}) est STRICTEMENT réservé au genre "${matchingRule.Genre_Autorise}" pour éviter la mixité dans le Bassin. Or, le patient ${patient.Nom_Patient} a comme genre "${patient.Genre_Patient}".`);
      } else {
        info.push(`Règle Balnéo Validée : Le patient "${patient.Nom_Patient}" (Genre: ${patient.Genre_Patient}) respecte le créneau réservé pour cette demi-journée.`);
      }
    } else {
      warnings.push(`Aucune règle de mixité configurée pour ce créneau de Balnéothérapie. Vérification par défaut non bloquante.`);
    }
  }

  // Capacity / overload
  const isIndividualPlan = planType.Max_Patients_Simultanes === 1;
  if (isIndividualPlan) {
    const conflictingRDVs = db.rendezVous.filter(r => {
      if (r.ID_RDV === rdv.ID_RDV) return false;
      if (r.Statut_RDV === 'Annulé') return false;
      if (r.ID_Prat !== prat.ID_Prat) return false;
      if (r.Date_RDV !== rdv.Date_RDV) return false;
      return timesOverlap(rdv.H_Debut_RDV, rdv.H_Fin_RDV, r.H_Debut_RDV, r.H_Fin_RDV);
    });
    if (conflictingRDVs.length > 0) {
      const conflictList = conflictingRDVs.map(c => {
        const patName = db.patients.find(p => p.ID_Patient === c.ID_Patient)?.Nom_Patient ?? 'Patient';
        return `${c.H_Debut_RDV} - ${c.H_Fin_RDV} (${patName})`;
      }).join(', ');
      errors.push(`[BLOQUÉ] Surcharge Interdite : Le service sélectionné requiert une prise en charge Individuelle (1 pour 1). Or, le Dr ${prat.Prenom_Prat} ${prat.Nom_Prat} est déjà réservé à la même période : [${conflictList}].`);
    } else {
      info.push(`Surcharge Validée : Le praticien est libre pour ce créneau individuel.`);
    }
  } else {
    const patientCount = db.rendezVous.filter(r => {
      if (r.ID_RDV === rdv.ID_RDV) return false;
      if (r.Statut_RDV === 'Annulé') return false;
      if (r.ID_Prat !== prat.ID_Prat) return false;
      if (r.Date_RDV !== rdv.Date_RDV) return false;
      return timesOverlap(rdv.H_Debut_RDV, rdv.H_Fin_RDV, r.H_Debut_RDV, r.H_Fin_RDV);
    }).length;
    if (patientCount >= planType.Max_Patients_Simultanes) {
      errors.push(`[BLOQUÉ] Capacité Maximale Dépassée : Le planning collectif autorise au maximum ${planType.Max_Patients_Simultanes} patients simultanés. Or, le praticien s'occupe déjà de ${patientCount} patients.`);
    } else if (patientCount > 0) {
      info.push(`Planning Collectif : Le praticien a actuellement ${patientCount}/${planType.Max_Patients_Simultanes} patients programmés sur ce créneau.`);
    }
  }

  // Specialist transversal
  const isSpecialistTransversal = prat.Repere === 'O' || prat.Repere === 'P';
  if (isSpecialistTransversal) {
    info.push(`Spécialiste Transversal : Ce praticien (Orthopho/Psychom) est rattaché de façon transversale sans restriction de zone.`);
  } else {
    const pratService = db.services.find(s => s.ID_Sce === prat.ID_Sce);
    if (pratService) {
      if (prat.ID_Sce === 2 && zone.ID_Zone !== 3) {
        warnings.push(`Incohérence Géographique : Praticien du service Balnéo s'exerçant hors du Bassin Balnéothérapie standard.`);
      } else if (prat.ID_Sce === 3 && zone.ID_Zone !== 4) {
        warnings.push(`Incohérence Géographique : Praticien rattaché à l'Intensif 2e s'exerçant hors de sa zone (Étage 2).`);
      } else if (prat.ID_Sce === 4 && zone.ID_Zone !== 5) {
        warnings.push(`Incohérence Géographique : Praticien rattaché à l'Intensif 3e s'exerçant hors de sa zone (Étage 3).`);
      } else if (prat.ID_Sce === 5 && zone.ID_Zone !== 6) {
        warnings.push(`Incohérence Géographique : Praticien rattaché à l'Intensif 4e s'exerçant hors de sa zone (Étage 4).`);
      }
    }
  }

  return { errors, warnings, info };
}

// --- Acte filtering ---

export function getFilteredActesForRole(actes: Acte[] | DatabaseState | any, userRole: string): Acte[] {
  const list: Acte[] = Array.isArray(actes) ? actes : ((actes as any)?.actes && Array.isArray((actes as any).actes) ? (actes as any).actes : []);
  if (!userRole) return list;
  const role = userRole.trim();
  if (role === 'Admin' || role === 'Assistante' || role === 'Médecin MPR') return list;

  const targetGroups: string[] = [];
  const roleLower = role.toLowerCase();
  if (roleLower.includes('rdc')) {
    targetGroups.push('rdc', 'receptionniste rdc');
  } else if (roleLower.includes('supperrec') || roleLower.includes('super receptionniste') || roleLower.includes('super réceptionniste')) {
    targetGroups.push('rdc', 'receptionniste rdc', 'rééduc', 'reéduc', 'réeduc', 'reeduc', 'receptionniste réeducation', 'receptionniste reeducation', 'receptionniste rééduc', 'receptionniste reeduc', 'balnéo', 'balneo', 'receptionniste balnéothérapie', 'receptionniste balneotherapie');
  } else if (roleLower.includes('réeducation') || roleLower.includes('reeducation') || roleLower.includes('reéduc') || roleLower.includes('rééduc') || roleLower.includes('reeduc')) {
    targetGroups.push('rééduc', 'reéduc', 'réeduc', 'reeduc', 'receptionniste réeducation', 'receptionniste reeducation', 'receptionniste rééduc', 'receptionniste reeduc');
  } else if (roleLower.includes('balnéothérapie') || roleLower.includes('balneotherapie') || roleLower.includes('balnéo') || roleLower.includes('balneo')) {
    targetGroups.push('balnéo', 'balneo', 'receptionniste balnéothérapie', 'receptionniste balneotherapie');
  } else if (roleLower.includes('intensif 2')) {
    targetGroups.push('intensif 2e', 'intensif 2', 'receptionniste intensif 2e');
  } else if (roleLower.includes('intensif 3')) {
    targetGroups.push('intensif 3e', 'intensif 3', 'receptionniste intensif 3e');
  } else if (roleLower.includes('intensif 4')) {
    targetGroups.push('intensif 4e', 'intensif 4', 'receptionniste intensif 4e');
  }

  return list.filter(a => {
    if (a.Receptionniste_Autorises && a.Receptionniste_Autorises.length > 0) {
      const isVisibleToAll = a.Receptionniste_Autorises.some(aut => {
        const val = aut.toLowerCase().trim();
        return val === 'tous';
      });
      if (isVisibleToAll) return true;
      const isAdminOnly = a.Receptionniste_Autorises.some(aut => {
        const val = aut.toLowerCase().trim();
        return val === 'admin' || val === 'adm';
      });
      if (isAdminOnly) return false;
    }
    if (a.Receptionniste_Autorises && a.Receptionniste_Autorises.length > 0) {
      return a.Receptionniste_Autorises.some(aut => {
        const autLower = aut.toLowerCase().trim();
        return targetGroups.includes(autLower);
      });
    }
    const label = (a.Libelle_Acte || '').toLowerCase();
    const isStandard =
      label.includes('ergo') ||
      label.includes('psycho') ||
      label.includes('ortho') ||
      label.includes('orto') ||
      label.includes('consultation') ||
      label.includes('contrôle') ||
      label.includes('controle') ||
      label.includes('certificat');
    if (isStandard) return true;
    if (label.includes('kine') || label.includes('kiné') || label.includes('rééducation') || label.includes('reeducation') || label.includes('tecar') || label.includes('choc')) {
      return roleLower.includes('réeducation') || roleLower.includes('reeducation') || roleLower.includes('rééduc') || roleLower.includes('reeduc') || roleLower.includes('rdc') || roleLower.includes('supperrec') || roleLower.includes('super receptionniste') || roleLower.includes('super réceptionniste');
    }
    if (label.includes('balnéo') || label.includes('balneo') || label.includes('bassin') || label.includes('piscine')) {
      return roleLower.includes('balnéothérapie') || roleLower.includes('balneotherapie') || roleLower.includes('balnéo') || roleLower.includes('balneo') || roleLower.includes('rdc') || roleLower.includes('supperrec') || roleLower.includes('super receptionniste') || roleLower.includes('super réceptionniste');
    }
    if (label.includes('intensif') || label.includes('intensive') || label.includes('multidisciplinaire')) {
      return roleLower.includes('intensif 2') || roleLower.includes('intensif 3') || roleLower.includes('intensif 4') || roleLower.includes('rdc');
    }
    return true;
  });
}

export function getFilteredActesForService(actes: Acte[], serviceId: number, userRole?: string): Acte[] {
  if (userRole) {
    return getFilteredActesForRole(actes, userRole);
  }
  let mappedRole = '';
  if (serviceId === 1) mappedRole = 'Receptionniste Réeducation';
  else if (serviceId === 2) mappedRole = 'Receptionniste Balnéothérapie';
  else if (serviceId === 3) mappedRole = 'Receptionniste Intensif 2e';
  else if (serviceId === 4) mappedRole = 'Receptionniste Intensif 3e';
  else if (serviceId === 5) mappedRole = 'Receptionniste Intensif 4e';
  return getFilteredActesForRole(actes, mappedRole || 'Admin');
}

// --- Diagnostic ---

export function diagnosePatient(patientName: string, dbState: DatabaseState): void {
  console.group(`%c🔍 DIAGNOSTIC CLINIQUE ET FINANCIER : "${patientName.toUpperCase()}"`, "color: #0f2d37; font-size: 13px; font-weight: bold; background-color: #e2f0f0; padding: 6px 12px; border-radius: 6px; border: 1px solid #7fa4b3;");
  const patient = dbState.patients.find(p => p.Nom_Patient && p.Nom_Patient.toLowerCase().includes(patientName.toLowerCase()));
  if (!patient) {
    console.warn(`⚠️ Patient "${patientName}" non trouvé dans la base de données.`);
    console.log("%cListe des patients disponibles pour comparaison :", "font-weight: bold; color: #102e3b;");
    console.table(dbState.patients.map(p => ({ ID: p.ID_Patient, Nom: p.Nom_Patient, Type: p.type_patient })));
    console.groupEnd();
    return;
  }
  console.log(`%c👤 Fiche Patient :`, "font-weight: bold; color: #0f2d37; font-size: 11px; border-left: 3px solid #0f2d37; padding-left: 5px;");
  console.table({
    "ID Patient": patient.ID_Patient,
    "Nom Complet": patient.Nom_Patient,
    "Type de Patient": patient.type_patient,
    "Genre": patient.Genre_Patient,
    "Âge": `${patient.Age_Pat || patient.Age_Patient || 'N/A'} ans`,
    "Téléphone": patient.phone || 'Non renseigné',
    "Affectation": patient.affectation || 'N/A',
  });
  const patientAbns = dbState.abonnements.filter(a => a.ID_Patient === patient.ID_Patient);
  console.log(`%c🎁 Forfaits & Abonnements (${patientAbns.length}) :`, "font-weight: bold; color: #0f2d37; font-size: 11px; border-left: 3px solid #db8a14; padding-left: 5px;");
  if (patientAbns.length === 0) {
    console.warn("⚠️ Ce patient n'a aucun abonnement enregistré dans le système.");
  } else {
    patientAbns.forEach((abn) => {
      const pack = dbState.packs.find(p => p.ID_Pack === abn.ID_Pack);
      const remaining = getRemainingSessions(abn, dbState);
      const isFrozen = !!(abn as any).Est_Gele;
      const isClosed = abn.Etat === 'Fermé';
      const totalSessions = pack?.Nbre_Seance_Pack || 10;
      const prixSeance = pack ? (pack.Prix_Seanc_Pack || (pack.Prix_Pack ? (pack.Prix_Pack / totalSessions) : 150)) : 150;
      const consumedValue = abn.Nbre_Sean_Consom_Abn * prixSeance;
      const abnVersements = dbState.versements.filter(v => v.ID_Abn === abn.ID_Abn);
      const totalVerses = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
      const isInsolvent = totalVerses === 0 || totalVerses < prixSeance || (consumedValue + prixSeance) > totalVerses;
      let statusMsg = "🟢 Actif & Solvable";
      if (isClosed) statusMsg = "🔴 Fermé";
      else if (isFrozen) statusMsg = "❄️ Gelé";
      else if (remaining <= 0) statusMsg = "🛑 Épuisé (0 séance restante)";
      else if (isInsolvent) statusMsg = "⚠️ Insolvable / Solde Insuffisant";
      console.group(`%cAbonnement #${abn.ID_Abn} : ${pack?.Libelle_Pack || "Pack inconnu"} - [${statusMsg}]`, "font-weight: bold; color: #1b3d4f;");
      console.log(`%c📋 Fiche technique d'abonnement :`, "font-weight: bold; text-decoration: underline;");
      console.log(`- ID Abonnement: ${abn.ID_Abn}`);
      console.log(`- Pack choisi: ${pack?.Libelle_Pack || "Inconnu"} (ID Pack: ${abn.ID_Pack})`);
      console.log(`- Validité temporelle: du ${abn.Date_Debut_Abn} au ${abn.Date_Fin_Abn}`);
      console.log(`- Volume total prévu: ${totalSessions} séances`);
      console.log(`- Compteur de séances consommées: ${abn.Nbre_Sean_Consom_Abn}`);
      console.log(`- Sessions restantes autorisées : ${remaining}`);
      console.log(`- Coût unitaire d'une séance de ce pack : ${prixSeance} DA`);
      console.log(`- État (Etat): "${abn.Etat}"`);
      console.log(`- Est Gelé (Est_Gele): ${isFrozen}`);
      console.log(`%c💸 Historique financier des versements pour cet abonnement (${abnVersements.length}) :`, "font-weight: bold; text-decoration: underline; color: #2e7d32;");
      if (abnVersements.length === 0) {
        console.warn("  ⚠️ Aucun versement d'argent (paiement) n'a été enregistré pour cet abonnement !");
      } else {
        console.table(abnVersements.map(v => ({
          "ID Versement": v.ID_Vers,
          "Date de règlement": v.Date_Vers,
          "Mode de versement": v.Mode_Vers || "Espèces",
          "Montant reçu (DA)": v.Mont_Vers
        })));
      }
      console.log(`%c🧮 Analyse d'Insolvabilité analytique :`, "font-weight: bold; text-decoration: underline; color: #b78103;");
      console.log(`- Cumul total versé (A) : ${totalVerses} DA`);
      console.log(`- Valeur consommée estimée (B = Séances consom. * Prix séance) : ${abn.Nbre_Sean_Consom_Abn} * ${prixSeance} DA = ${consumedValue} DA`);
      console.log(`- Solde théorique disponible (A - B) : ${totalVerses - consumedValue} DA`);
      if (isInsolvent) {
        console.log(`%c🚨 EXPLICATION DE L'INSOLVABILITÉ :`, "font-weight: bold; color: #c62828;");
        if (totalVerses === 0) {
          console.log(`=> RÉSULTAT: Le patient est déclaré INSOLVABLE car il n'a effectué AUCUN VERSEMENT (Montant total versé = 0 DA) pour cet abonnement actif.`);
          console.log(`👉 FIX CONCRET: Allez dans l'onglet "Patient", sélectionnez "${patient.Nom_Patient}", rendez-vous à la section "Abonnements & Règlements", puis cliquez sur "Nouveau Versement" pour affecter une avance financière.`);
        } else if (consumedValue > totalVerses) {
          console.log(`=> RÉSULTAT: Le patient est déclaré INSOLVABLE car le coût total de ses séances consommées (${consumedValue} DA) dépasse le cumul de ses versements effectués (${totalVerses} DA). Son solde d'abonnement est débiteur de ${consumedValue - totalVerses} DA.`);
          console.log(`👉 FIX CONCRET: Le patient doit verser une somme complémentaire d'au moins ${consumedValue - totalVerses} DA pour stabiliser sa solvabilité.`);
        }
      } else {
        console.log(`%c🟢 CONSTAT: L'abonnement est parfaitement SOLVABLE et actif !`, "font-weight: bold; color: #2e7d32;");
        console.log(`- Le patient dispose d'une marge créditrice de +${totalVerses - consumedValue} DA.`);
      }
      console.groupEnd();
    });
  }
  const patientAbnIds = patientAbns.map(a => a.ID_Abn);
  const patientVersements = dbState.versements.filter(v => patientAbnIds.includes(v.ID_Abn));
  console.log(`%c🧾 Historique complet de tous les versements (${patientVersements.length}) :`, "font-weight: bold; color: #0f2d37; font-size: 11px; border-left: 3px solid #2e7d32; padding-left: 5px;");
  if (patientVersements.length === 0) {
    console.warn("⚠️ Aucun versement global n'a été trouvé pour ce patient.");
  } else {
    console.table(patientVersements.map(v => {
      const abn = patientAbns.find(a => a.ID_Abn === v.ID_Abn);
      const pack = abn ? dbState.packs.find(p => p.ID_Pack === abn.ID_Pack) : null;
      return {
        "ID Versement": v.ID_Vers,
        "ID Abonnement lié": v.ID_Abn,
        "Forfait associé": pack?.Libelle_Pack || "Inconnu",
        "Montant Versé (DA)": v.Mont_Vers,
        "Date du Versement": v.Date_Vers,
        "Mode de Paiement": v.Mode_Vers || "Espèces"
      };
    }));
  }
  const patientSeances = dbState.seances.filter(s => s.ID_Patient === patient.ID_Patient);
  console.log(`%c📅 Historique complet de ses Séances Réalisées (${patientSeances.length}) :`, "font-weight: bold; color: #0f2d37; font-size: 11px; border-left: 3px solid #102e3b; padding-left: 5px;");
  if (patientSeances.length === 0) {
    console.warn("⚠️ Aucune séance consommée n'a été trouvée dans le grand livre des séances réelles pour ce patient.");
  } else {
    console.table(patientSeances.map(s => {
      const act = dbState.actes.find(a => a.ID_Acte === s.ID_Acte);
      const prat = dbState.praticiens.find(p => p.ID_Prat === s.ID_Prat);
      return {
        "ID Séance": s.ID_Seanc,
        "Abonnement lié": s.ID_Abn ? `ABN #${s.ID_Abn}` : "Hors Abonnement (Paiement direct)",
        "Acte médical de soin": act?.Libelle_Acte || `Acte #${s.ID_Acte}`,
        "Date de réalisation": s.Date_Seanc_Realisee,
        "Tranche horaire": `${s.H_Debut_Seanc} - ${s.H_Fin_Seanc}`,
        "Thérapeute affecté": prat ? `${prat.Prenom_Prat} ${prat.Nom_Prat}` : "N/A",
        "Prix facturé de la séance": s.Prix_Seanc
      };
    }));
  }
  console.groupEnd();
}

export function mergeDatabaseStatesSmart(local: DatabaseState, server: DatabaseState): DatabaseState {
  const merged = { ...server } as any;

  const arrayKeys = [
    'services', 'utilisateurs', 'praticiens', 'actes', 'packs', 'typesPlanning', 'zones', 'reglesBalneo',
    'patients', 'abonnements', 'versements', 'rendezVous', 'seances', 'fileAttente', 'fileAttenteIMC',
    'factures', 'consultations', 'chatMessages', 'chat_messages', 'transactions_caisses', 'notifications', 'patientsEnPause', 'fiches_imc', 'depenses'
  ];

  const getID = (item: any, tableKey?: string) => {
    if (!item) return undefined;
    
    // Si tableKey est fourni, utiliser la clé primaire spécifique en premier
    if (tableKey) {
      switch (tableKey) {
        case 'fiches_imc':
          if (item.ID_Fiche_IMC !== undefined && item.ID_Fiche_IMC !== null) return item.ID_Fiche_IMC;
          break;
        case 'patientsEnPause':
          if (item.id_seance !== undefined && item.id_seance !== null) return item.id_seance;
          if (item.idPatient !== undefined && item.idPatient !== null) return `idpat-${item.idPatient}-${item.service}`;
          break;
        case 'patients':
          if (item.ID_Patient !== undefined && item.ID_Patient !== null) return item.ID_Patient;
          break;
        case 'abonnements':
          if (item.ID_Abn !== undefined && item.ID_Abn !== null) return item.ID_Abn;
          break;
        case 'versements':
          if (item.ID_Vers !== undefined && item.ID_Vers !== null) return item.ID_Vers;
          break;
        case 'rendezVous':
          if (item.ID_RDV !== undefined && item.ID_RDV !== null) return item.ID_RDV;
          break;
        case 'seances':
          if (item.ID_Seanc !== undefined && item.ID_Seanc !== null) return item.ID_Seanc;
          if (item.id !== undefined && item.id !== null) return item.id;
          break;
        case 'fileAttente':
        case 'fileAttenteIMC':
          if (item.ID_File !== undefined && item.ID_File !== null) return item.ID_File;
          break;
        case 'factures':
          if (item.ID_Facture !== undefined && item.ID_Facture !== null) return item.ID_Facture;
          break;
        case 'consultations':
          if (item.id !== undefined && item.id !== null) return item.id;
          break;
        case 'transactions_caisses':
          if (item.ID_Trans !== undefined && item.ID_Trans !== null) return item.ID_Trans;
          if (item.ID_Mouv_Caisse !== undefined && item.ID_Mouv_Caisse !== null) return item.ID_Mouv_Caisse;
          break;
        case 'utilisateurs':
          if (item.ID_Utilisateur !== undefined && item.ID_Utilisateur !== null) return item.ID_Utilisateur;
          break;
        case 'praticiens':
          if (item.ID_Prat !== undefined && item.ID_Prat !== null) return item.ID_Prat;
          break;
        case 'actes':
          if (item.ID_Acte !== undefined && item.ID_Acte !== null) return item.ID_Acte;
          break;
        case 'packs':
          if (item.ID_Pack !== undefined && item.ID_Pack !== null) return item.ID_Pack;
          break;
      }
    }

    if (item.id !== undefined && item.id !== null) return item.id;
    if (item.ID_Seanc !== undefined && item.ID_Seanc !== null) return item.ID_Seanc;
    const keys = [
      'ID_File', 'ID_RDV', 'ID_Abn', 'ID_Vers', 'ID_Mouv_Caisse', 'ID_Trans', 'ID_Patient',
      'ID_Sce', 'ID_Utilisateur', 'ID_Prat', 'ID_Acte', 'ID_Pack', 'ID_Type_Plan', 'ID_Zone', 'ID_Regle'
    ];
    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null) return item[k];
    }
    return undefined;
  };

  arrayKeys.forEach(key => {
    const localArr = (local as any)[key] || [];
    const serverArr = (server as any)[key] || [];

    const mergedMap = new Map();

    // D'abord ajouter les données du serveur
    serverArr.forEach((item: any) => {
      const id = getID(item, key);
      if (id !== undefined) {
        mergedMap.set(id, item);
      }
    });

    // Ensuite, fusionner avec les données locales si plus récentes ou nouvelles
    localArr.forEach((item: any) => {
      const id = getID(item, key);
      if (id === undefined) return;

      const serverItem = mergedMap.get(id);

      if (!serverItem) {
        mergedMap.set(id, item); // Nouvel élément local
      } else {
        const localTime = item.updatedAt ? new Date(item.updatedAt).getTime() : (item.lastUpdated ? Number(item.lastUpdated) : 0);
        const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : (serverItem.lastUpdated ? Number(serverItem.lastUpdated) : 0);
        if (localTime > serverTime) {
          mergedMap.set(id, item); // Local plus récent
        }
      }
    });

    merged[key] = Array.from(mergedMap.values());
  });

  // Filter out phantom acts like the existing filter
  if (Array.isArray(merged.actes)) {
    merged.actes = merged.actes.filter((a: any) => a && a.ID_Acte && a.Libelle_Acte);
  }

  const localCats = local.categories_depenses || [];
  const serverCats = server.categories_depenses || [];
  const allCats = Array.from(new Set([...(INITIAL_DATABASE.categories_depenses || []), ...serverCats, ...localCats])).sort((a, b) => a.localeCompare(b, 'fr'));
  merged.categories_depenses = allCats;

  merged.lastUpdated = Date.now();
  return merged as DatabaseState;
}
export function peutValiderDepense(role: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r.includes('admin');
}
export function stampDatabaseState(state: DatabaseState): DatabaseState {
  return {
    ...state,
    lastUpdated: Date.now()
  };
}

export function stampItem<T extends Record<string, any>>(item: T): T {
  return {
    ...item,
    updatedAt: new Date().toISOString()
  };
}

// --- Backward-compatible aliases ---
export const LoadDb = getStoredDatabase;
export const SaveDb = saveDatabase;
