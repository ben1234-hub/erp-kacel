export interface Affectation {
  id: string;
  name: string; // e.g. "Kinésithérapie active", "Balnéothérapie", "Rééducation Pédiatrique"
  etage: string; // e.g. "RDC", "1er Étage", "2ème Étage"
  description: string;
}

export interface Tarif {
  id: string;
  name: string;
  montant: number;
  active: boolean;
  description?: string;
}

export interface TypeAbonnement {
  id: string;
  name: string; // e.g. "Abonnement Kiné", "Abonnement Balnéo", "Premium Mixte"
}

export interface KinesitherapyAct {
  id: string;
  name: string; // e.g. "Drainage Lymphatique", "Rééducation Post-Ligamentoplastie", "Massage Thérapeutique", "Gym Aquatique Individuelle"
}

export interface Versement {
  id: string;
  gestion_abonnement_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface Pack {
  id: string;
  name: string; // e.g. "Pack Kiné 10 S", "Pack Balnéo Aquafit 15 S"
  nombre_seance: number;
  amount: number;
  note?: string;
  type_abonnement_id: string;
  act_id?: string; // Associated act
  active: boolean;
  id_acte?: string; // 🔑 Le nouveau champ liant le pack à la table Actes
}

export interface Patient {
  id: string;
  dossier_num?: string;
  name: string;
  name_arab?: string;
  phone: string;
  email: string;
  date_creation: string;
  date_naissance?: string;
  gender: 'M' | 'F' | 'Autre';
  type_patient?: 'adulte' | 'enfant' | 'enfant_imc';
  age: number;
  organisme?: string;
  wilaya?: string;
  street?: string;       // Rue / Adresse
  city?: string;         // Ville
  nss?: string;          // Numéro de Sécurité Sociale
  pathology?: string;    // Diagnostic / Pathologie
  mecanisme?: string;    // Motif ou mécanisme de blessure
  Pseudo?: string;       // Pseudo pour Enfant IMC
  
  // Developed medical record (Dossier Médical) clinical fields
  tension?: string;            // Tension Artérielle
  heart_rate?: string;         // Fréquence Cardiaque
  temperature?: string;        // Température (°C)
  weight?: string;             // Poids (kg)
  height?: string;             // Taille (cm)
  antecedents?: string;        // Antécédents médicaux / chirurgicaux
  ashworth_score?: string;     // Tonus Musculaire (Score d'Ashworth)
  rom_assessment?: string;     // Amplitudes Articulaires (ROM)
  gait_assessment?: string;    // Bilan Posture & Marche
  prescription_acts?: string;  // Prescription & Objectif de soins
  contraindications?: string;  // Contre-indications (Risque épileptique, etc.)
  rehab_progress_notes?: string;// Observations & Notes d'évolution
  satisfaction_score?: number; // Score d'évolution (1 - 5)
  date_de_consultation?: string;
}

export const ALGERIAN_WILAYAS = [
  { id: '01', name: '01 Adrar' }, { id: '02', name: '02 Chlef' }, { id: '03', name: '03 Laghouat' }, { id: '04', name: '04 Oum El Bouaghi' },
  { id: '05', name: '05 Batna' }, { id: '06', name: '06 Béjaïa' }, { id: '07', name: '07 Biskra' }, { id: '08', name: '08 Béchar' },
  { id: '09', name: '09 Blida' }, { id: '10', name: '10 Bouira' }, { id: '11', name: '11 Tamanrasset' }, { id: '12', name: '12 Tébessa' },
  { id: '13', name: '13 Tlemcen' }, { id: '14', name: '14 Tiaret' }, { id: '15', name: '15 Tizi Ouzou' }, { id: '16', name: '16 Alger' },
  { id: '17', name: '17 Djelfa' }, { id: '18', name: '18 Jijel' }, { id: '19', name: '19 Sétif' }, { id: '20', name: '20 Saïda' },
  { id: '21', name: '21 Skikda' }, { id: '22', name: '22 Sidi Bel Abbès' }, { id: '23', name: '23 Annaba' }, { id: '24', name: '24 Guelma' },
  { id: '25', name: '25 Constantine' }, { id: '26', name: '26 Médéa' }, { id: '27', name: '27 Mostaganem' }, { id: '28', name: '28 M\'Sila' },
  { id: '29', name: '29 Mascara' }, { id: '30', name: '30 Ouargla' }, { id: '31', name: '31 Oran' }, { id: '32', name: '32 El Bayadh' },
  { id: '33', name: '33 Illizi' }, { id: '34', name: '34 Bordj Bou Arréridj' }, { id: '35', name: '35 Boumerdès' }, { id: '36', name: '36 El Tarf' },
  { id: '37', name: '37 Tindouf' }, { id: '38', name: '38 Tissemsilt' }, { id: '39', name: '39 El Oued' }, { id: '40', name: '40 Khenchela' },
  { id: '41', name: '41 Souk Ahras' }, { id: '42', name: '42 Tipaza' }, { id: '43', name: '43 Mila' }, { id: '44', name: '44 Aïn Defla' },
  { id: '45', name: '45 Naâma' }, { id: '46', name: '46 Aïn Témouchent' }, { id: '47', name: '47 Ghardaïa' }, { id: '48', name: '48 Relizane' },
  { id: '49', name: '49 Timimoun' }, { id: '50', name: '50 Bordj Badji Mokhtar' }, { id: '51', name: '51 Ouled Djellal' }, { id: '52', name: '52 Béni Abbes' },
  { id: '53', name: '53 In Salah' }, { id: '54', name: '54 In Guezzam' }, { id: '55', name: '55 Touggourt' }, { id: '56', name: '56 Djanet' },
  { id: '57', name: '57 El M\'Ghair' }, { id: '58', name: '58 El Meniaa' },
];

export interface GestionAbonnement {
  id: string;
  name: string; // Computed code: e.g., ABN/Jean/30/05/26
  patient_id: string;
  pack_id: string;
  used_sessions: number;
  remise_globale: number; // e.g. 10 for 10%
  date_debut: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD (date creation)
  etat?: 'Actif' | 'Fermé';
}

export interface BalneotherapieAppointmentPatient {
  patient_id: string;
  paid: boolean;
}

export interface BalneotherapieAppointment {
  id: string;
  name: string; // Computed code
  appointment_date: string; // YYYY-MM-DDTHH:MM
  duration: number; // hours (e.g. 1.0)
  state: 'draft' | 'confirmed' | 'done' | 'canceled';
  patients: BalneotherapieAppointmentPatient[];
  creneau_gender?: 'H' | 'F' | 'Mixte';
}

export interface KinesitherapyAppointmentSelectedAct {
  id: string;
  act_id: string;
  patient_id: string;
  paid: boolean;
}

export interface KinesitherapyAppointment {
  id: string;
  name: string; // Computed
  appointment_date: string; // YYYY-MM-DDTHH:MM
  state: 'draft' | 'confirmed' | 'done' | 'canceled';
  selected_acts: KinesitherapyAppointmentSelectedAct[];
}

// Preseeded Mock Data
export const INITIAL_AFFECTATIONS: Affectation[] = [
  { id: 'aff-1', name: 'Service Balnéothérapie', etage: 'Rez-de-chaussée (RDC)', description: 'Grand bassin avec jets de massage, couloir de marche et piscine de rééducation contractile.' },
  { id: 'aff-2', name: 'Service Kinésithérapie active', etage: '1er Étage', description: 'Gymnase équipé de tapis, vélos de rééducation, espaliers et cage de pouliethérapie.' },
  { id: 'aff-3', name: 'Cabinets Individuels', etage: '1er Étage', description: 'Salles de soins individuelles pour thérapie manuelle, massages et ondes de choc.' },
  { id: 'aff-4', name: 'Service Pédiatrie & Psychomotricité', etage: '2ème Étage', description: 'Espace adapté aux enfants avec tapis d\'éveil, ballons géants et matériel ludique.' }
];

export const INITIAL_TARIFS: Tarif[] = [
  { id: 'tar-1', name: 'Séance Kinésithérapie Standard', montant: 35, active: true, description: 'Tarif unitaire de base pour acte de masso-kinésithérapie.' },
  { id: 'tar-2', name: 'Séance Balnéothérapie Individuelle', montant: 45, active: true, description: 'Accès bassin thérapeutique avec encadrement de kinésithérapeute.' },
  { id: 'tar-3', name: 'Bilan Diagnostic Initial', montant: 50, active: true, description: 'Diagnostic et établissement du parcours thérapeutique de réhabilitation.' },
  { id: 'tar-4', name: 'Drainage Lymphatique Manuel', montant: 55, active: true, description: 'Massage thérapeutique manuel spécifique de relance circulatoire.' }
];

export const INITIAL_TYPES_ABONNEMENT: TypeAbonnement[] = [
  { id: 'tab-1', name: 'Abonnement Kinésithérapie' },
  { id: 'tab-2', name: 'Abonnement Balnéothérapie' },
  { id: 'tab-3', name: 'Abonnement Mixte (Kiné + Balnéo)' }
];

export const INITIAL_ACTS: KinesitherapyAct[] = [
  { id: 'act-1', name: 'Rééducation du Genou (Post-Ligamentoplastie)' },
  { id: 'act-2', name: 'Drainage Lymphatique Manuel Complet' },
  { id: 'act-3', name: 'Gymnastique Aquatique Corrective' },
  { id: 'act-4', name: 'Massage Décontracturant Rachis' },
  { id: 'act-5', name: 'Réhabilitation Respiratoire' }
];

export const INITIAL_PACKS: Pack[] = [
  { id: 'pack-1', name: 'Pack Kiné Genou 10 Séances', nombre_seance: 10, amount: 300, type_abonnement_id: 'tab-1', act_id: 'act-1', active: true, note: 'Pour rééducation ligamentaire progressive, idéalement 2 séances par semaine.' },
  { id: 'pack-2', name: 'Pack Drainage Premium 5 Séances', nombre_seance: 5, amount: 240, type_abonnement_id: 'tab-1', act_id: 'act-2', active: true, note: 'Soin relance circulatoire post-opératoire immédiate.' },
  { id: 'pack-3', name: 'Pack Balnéothérapie Aquafit 12 Séances', nombre_seance: 12, amount: 480, type_abonnement_id: 'tab-2', act_id: 'act-3', active: true, note: 'Séances collectives de 45 min en piscine chauffée.' },
  { id: 'pack-4', name: 'Pack Rachis Complet 15 Séances', nombre_seance: 15, amount: 450, type_abonnement_id: 'tab-3', act_id: 'act-4', active: true, note: 'Rééducation fonctionnelle globale, physiothérapie adjuvante.' }
];

export const INITIAL_PATIENTS: Patient[] = [
  { 
    id: 'pat-1', 
    dossier_num: 'PAT-2026-001',
    name: 'Jean Dupont', 
    name_arab: 'جون دوبون',
    phone: '06 12 34 56 78', 
    email: 'jean.dupont@gmail.com', 
    date_creation: '2026-04-10', 
    gender: 'M', 
    age: 43,
    date_naissance: '1983-05-12',
    street: '12 Rue des Glycines',
    city: 'Alger Center',
    wilaya: '16',
    organisme: 'CNAS',
    nss: '1830416300124',
    pathology: 'Entorse LLI genou droit',
    mecanisme: 'Torsion lors d’un entraînement de football (traumatisme sportif)'
  },
  { 
    id: 'pat-2', 
    dossier_num: 'PAT-2026-002',
    name: 'Marie Laurent', 
    name_arab: 'ماري لوران',
    phone: '07 89 45 12 32', 
    email: 'm.laurent@yahoo.fr', 
    date_creation: '2026-04-15', 
    gender: 'F', 
    age: 29,
    date_naissance: '1997-08-22',
    street: 'Batiment C appartement 4, Cité 200 logts',
    city: 'Hydra, Alger',
    wilaya: '16',
    organisme: 'MILITAIRE',
    nss: '2970916200543',
    pathology: 'Œdème lymphatique post-opératoire',
    mecanisme: 'Chirurgie orthopédique suite à une fracture'
  },
  { 
    id: 'pat-3', 
    dossier_num: 'PAT-2026-003',
    name: 'Alain Martin', 
    name_arab: 'آلان مارتن',
    phone: '06 54 87 98 65', 
    email: 'alainmartin@bbox.fr', 
    date_creation: '2026-05-01', 
    gender: 'M', 
    age: 67,
    date_naissance: '1959-11-05',
    street: '05 Avenue Boumediene',
    city: 'Oran',
    wilaya: '31',
    nss: '1591131100223',
    pathology: 'Lombalgie chronique invalidante',
    mecanisme: 'Usure posturale et efforts répétés durant la carrière professionnelle'
  },
  { 
    id: 'pat-4', 
    dossier_num: 'PAT-2026-004',
    name: 'Sophie Bernard', 
    name_arab: 'صوفي برنارد',
    phone: '06 99 88 77 66', 
    email: 'sophie.bernard@gmail.com', 
    date_creation: '2026-05-12', 
    gender: 'F', 
    age: 52,
    date_naissance: '1974-03-30',
    street: 'Villas des Pins n°45',
    city: 'Zeralda',
    wilaya: '16',
    nss: '2740516100987',
    pathology: 'Torticolis spasmodique & sciatalgie gauche',
    mecanisme: 'Faux mouvement brutal au réveil combiné à une hernie discale discrète'
  },
  { 
    id: 'pat-5', 
    dossier_num: 'PAT-2026-005',
    name: 'Thomas Petit', 
    name_arab: 'توماس بوتي',
    phone: '07 61 22 34 45', 
    email: 'thomas.petit@outlook.fr', 
    date_creation: '2026-05-20', 
    gender: 'M', 
    age: 35,
    date_naissance: '1991-12-10',
    street: '08 Rue Didouche Mourad',
    city: 'Alger Center',
    wilaya: '16',
    nss: '1910816300456',
    pathology: 'Insuffisante respiratoire restrictive chronique',
    mecanisme: 'Séquelles d’une pneumopathie sévère avec diminution du volume pulmonaire'
  }
];

export const INITIAL_ABONNEMENTS: GestionAbonnement[] = [
  {
    id: 'abo-1',
    name: 'ABN/Jean/12/04/26',
    patient_id: 'pat-1',
    pack_id: 'pack-1',
    used_sessions: 6,
    remise_globale: 10,
    date_debut: '2026-04-12',
    date: '2026-04-12'
  },
  {
    id: 'abo-2',
    name: 'ABN/Marie/16/04/26',
    patient_id: 'pat-2',
    pack_id: 'pack-2',
    used_sessions: 5, // All sessions user - should be status Finished
    remise_globale: 0,
    date_debut: '2026-04-16',
    date: '2026-04-16'
  },
  {
    id: 'abo-3',
    name: 'ABN/Alain/02/05/26',
    patient_id: 'pat-3',
    pack_id: 'pack-3',
    used_sessions: 4,
    remise_globale: 5,
    date_debut: '2026-05-02',
    date: '2026-05-02'
  },
  {
    id: 'abo-4',
    name: 'ABN/Sophie/13/05/26',
    patient_id: 'pat-4',
    pack_id: 'pack-4',
    used_sessions: 2,
    remise_globale: 15, // Let's make Sophie have a debt to showcase debt actions
    date_debut: '2026-05-13',
    date: '2026-05-13'
  }
];

export const INITIAL_VERSEMENTS: Versement[] = [
  // For Jean: Plan total with 10% discount on 300 = 270. Versement: 270 (Paid, no debt)
  { id: 'v-1', gestion_abonnement_id: 'abo-1', amount: 200, date: '2026-04-12' },
  { id: 'v-2', gestion_abonnement_id: 'abo-1', amount: 70, date: '2026-04-20' },
  
  // For Marie: Pack 240. Versement 240 (Paid)
  { id: 'v-3', gestion_abonnement_id: 'abo-2', amount: 240, date: '2026-04-16' },
  
  // For Alain: Pack 480 with 5% discount = 456. Versement 456
  { id: 'v-4', gestion_abonnement_id: 'abo-3', amount: 456, date: '2026-05-02' },
  
  // For Sophie: Pack 450 with 15% discount = 382.5. Versement 150 (Debt = 232.5)
  { id: 'v-5', gestion_abonnement_id: 'abo-4', amount: 150, date: '2026-05-13' }
];

export const INITIAL_BALNEO_APPOINTMENTS: BalneotherapieAppointment[] = [
  {
    id: 'bal-1',
    name: 'BAL/30/05/26/09h',
    appointment_date: '2026-05-30T09:00',
    duration: 1.5,
    state: 'done',
    patients: [
      { patient_id: 'pat-1', paid: true },
      { patient_id: 'pat-3', paid: true }
    ],
    creneau_gender: 'H'
  },
  {
    id: 'bal-2',
    name: 'BAL/31/05/26/14h',
    appointment_date: '2026-05-31T14:30',
    duration: 1.0,
    state: 'confirmed',
    patients: [
      { patient_id: 'pat-3', paid: true },
      { patient_id: 'pat-4', paid: false } //Sophie has debt/unpaid
    ],
    creneau_gender: 'F'
  }
];

export const INITIAL_KINE_APPOINTMENTS: KinesitherapyAppointment[] = [
  {
    id: 'kin-1',
    name: 'KIN/29/05/26',
    appointment_date: '2026-05-29T10:00',
    state: 'done',
    selected_acts: [
      { id: 'sa-1', act_id: 'act-1', patient_id: 'pat-1', paid: true }
    ]
  },
  {
    id: 'kin-2',
    name: 'KIN/30/05/26',
    appointment_date: '2026-05-30T11:00',
    state: 'draft',
    selected_acts: [
      { id: 'sa-2', act_id: 'act-2', patient_id: 'pat-2', paid: true },
      { id: 'sa-3', act_id: 'act-4', patient_id: 'pat-4', paid: false }
    ]
  }
];

export interface AideKine {
  id: string;
  name: string;
  active: boolean;
  etage: '2' | '3' | '4';
}

export interface ConsultationQueueItem {
  id: string;
  patient_name: string;
  phone: string;
  age: number;
  type: 'adulte' | 'imc';
  status: 'attente' | 'consultation' | 'termine';
  paye: boolean;
  date: string; // YYYY-MM-DD
  amount: number;
  is_controle?: boolean;
}

export interface CaisseTransaction {
  id: string;
  type: 'recette' | 'depense';
  label: string;
  amount: number;
  payment_method: 'especes' | 'carte' | 'cheque';
  date: string;
  user_role: string;
}

export interface IntensifCell {
  patient_id: string;
  saved: boolean;
}

export interface IntensifGrid {
  id: string; // e.g. "grid-2-2026-05-30" (etage-date)
  etage: '2' | '3' | '4';
  date: string; // YYYY-MM-DD
  schedule: {
    [timeSlot: string]: {
      [kineId: string]: IntensifCell;
    };
  };
}

export const INITIAL_AIDE_KINES: AideKine[] = [
  { id: 'k-1', name: 'Merzak', active: true, etage: '2' },
  { id: 'k-2', name: 'Ahmed', active: true, etage: '2' },
  { id: 'k-3', name: 'Mostapha', active: true, etage: '3' },
  { id: 'k-4', name: 'Slimane', active: true, etage: '3' },
  { id: 'k-5', name: 'Youssef', active: true, etage: '4' },
  { id: 'k-6', name: 'Zidane', active: false, etage: '4' }
];

export interface TypeConsultation {
  id: string;
  code: string;
  designation: string;
  prix: number;
}

export const INITIAL_TYPE_CONSULTATIONS: TypeConsultation[] = [
  { id: 'tc-1', code: 'ADU', designation: 'Consultation Adulte', prix: 2500 },
  { id: 'tc-2', code: 'ENF', designation: 'Consultation Enfant', prix: 2500 },
  { id: 'tc-3', code: 'IMC', designation: 'Consultation Enfant IMC', prix: 3000 },
];

export const INITIAL_CONSULTATION_QUEUE: ConsultationQueueItem[] = [
  { id: 'cq-1', patient_name: 'Imad El-Samy', phone: '0555332211', age: 11, type: 'imc', status: 'attente', paye: false, date: '2026-05-30', amount: 3000 },
  { id: 'cq-2', patient_name: 'Zaky Reda', phone: '0666112233', age: 8, type: 'imc', status: 'consultation', paye: true, date: '2026-05-30', amount: 3000 },
  { id: 'cq-3', patient_name: 'Karim Larbi', phone: '0777445566', age: 48, type: 'adulte', status: 'attente', paye: false, date: '2026-05-30', amount: 2500 },
  { id: 'cq-4', patient_name: 'Houdaifa Belgacem', phone: '0544889900', age: 34, type: 'adulte', status: 'termine', paye: true, date: '2026-05-30', amount: 2500 }
];

export const INITIAL_CAISSE_TRANSACTIONS: CaisseTransaction[] = [
  { id: 'tx-1', type: 'recette', label: 'Règlement séance Balnéothérapie - Jean Dupont', amount: 45, payment_method: 'especes', date: '2026-05-30', user_role: 'recept_balneo' },
  { id: 'tx-2', type: 'recette', label: 'Vente Pack Kiné Genou 10S - Marie Laurent', amount: 300, payment_method: 'carte', date: '2026-05-30', user_role: 'recept_adultes' },
  { id: 'tx-3', type: 'depense', label: 'Achat fournitures de soins gazo-serviettes', amount: 80, payment_method: 'especes', date: '2026-05-30', user_role: 'admin' }
];

export interface SubscriptionDetails {
  pack?: Pack | null;
  number_of_sessions: number;
  total_sans_remise: number;
  total_avec_remise: number;
  remaining_sessions: number;
  total_versement: number;
  amount_remaining: number;
  state: 'with_debt' | 'without_debt' | 'abonnement_end';
}

export type AppointmentState = 'draft' | 'confirm' | 'consult' | 'endconsult' | 'done' | 'cancel';

export interface MedicalAppointment {
  id: string;
  name: string; // Code calculé ex: Nom/Date/Heure
  patient_id: string;
  patient_name: string; // Dénormalisé pour performance
  patient_phone?: string;
  patient_age?: number;
  appointment_date: string; // ISO Datetime
  amount: number;
  discount: number; // Pourcentage
  discounted_amount: number;
  is_controle: boolean; // Si true, c'est un contrôle
  amount_display: string; // "Contrôle", "VIP", ou Montant
  notes?: string;
  state: AppointmentState;
  paye: boolean;
  type: 'adulte' | 'enfant' | 'imc';
}

