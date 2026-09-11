/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Landmark,
  Trash2,
  CheckCircle2,
  User,
  Filter,
  CreditCard,
  X,
  Calendar,
  ClipboardList,
  Activity,
  Sparkles,
  Award,
  Plus,
  ArrowLeft,
  ChevronDown,
  Info,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Printer,
  RefreshCw,
  List,
  FileText,
  Maximize2,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DatabaseState,
  Patient,
  Utilisateur,
  getRemainingSessions,
  Abonnement,
  Pack,
  calculateAge,
  getFilteredActesForRole,
  isAbonnementGele,
  generateNextIMCNumRegistre,
} from "../dbStore";
import { translateNameToArabic } from "../utils/translator";
import { hasPermission } from "../utils/permissions";
import { KineAutomationPanel } from "./KineAutomationPanel";
import { PatientSearchCombobox } from "./PatientSearchCombobox";
import { IMCPatientModal } from "./IMCPatientModal";
import FicheEvaluationPediatrique from "./FicheEvaluationPediatrique";
import PlanningPrevisionnelIMC from "./PlanningPrevisionnelIMC";
import { DossierMedicalMPR } from "./DossierMedicalMPR";
import { OrientationTab, OrientationData, defaultOrientationData } from "./OrientationTab";
import CashReport from "./CashReport";

export const WILAYAS = [
  { code: "01", name: "01 Adrar" },
  { code: "02", name: "02 Chlef" },
  { code: "03", name: "03 Laghouat" },
  { code: "04", name: "04 Oum El Bouaghi" },
  { code: "05", name: "05 Batna" },
  { code: "06", name: "06 Béjaïa" },
  { code: "07", name: "07 Biskra" },
  { code: "08", name: "08 Béchar" },
  { code: "09", name: "09 Blida" },
  { code: "10", name: "10 Bouira" },
  { code: "11", name: "11 Tamanrasset" },
  { code: "12", name: "12 Tébessa" },
  { code: "13", name: "13 Tlemcen" },
  { code: "14", name: "14 Tiaret" },
  { code: "15", name: "15 Tizi Ouzou" },
  { code: "16", name: "16 Alger" },
  { code: "17", name: "17 Djelfa" },
  { code: "18", name: "18 Jijel" },
  { code: "19", name: "19 Sétif" },
  { code: "20", name: "20 Saïda" },
  { code: "21", name: "21 Skikda" },
  { code: "22", name: "22 Sidi Bel Abbès" },
  { code: "23", name: "23 Annaba" },
  { code: "24", name: "24 Guelma" },
  { code: "25", name: "25 Constantine" },
  { code: "26", name: "26 Médéa" },
  { code: "27", name: "27 Mostaganem" },
  { code: "28", name: "28 M'Sila" },
  { code: "29", name: "29 Mascara" },
  { code: "30", name: "30 Ouargla" },
  { code: "31", name: "31 Oran" },
  { code: "32", name: "32 El Bayadh" },
  { code: "33", name: "33 Illizi" },
  { code: "34", name: "34 Bordj Bou Arréridj" },
  { code: "35", name: "35 Boumerdès" },
  { code: "36", name: "36 El Tarf" },
  { code: "37", name: "37 Tindouf" },
  { code: "38", name: "38 Tissemsilt" },
  { code: "39", name: "39 El Oued" },
  { code: "40", name: "40 Khenchela" },
  { code: "41", name: "41 Souk Ahras" },
  { code: "42", name: "42 Tipaza" },
  { code: "43", name: "43 Mila" },
  { code: "44", name: "44 Aïn Defla" },
  { code: "45", name: "45 Naâma" },
  { code: "46", name: "46 Aïn Témouchent" },
  { code: "47", name: "47 Ghardaïa" },
  { code: "48", name: "48 Relizane" },
  { code: "49", name: "49 Timimoun" },
  { code: "50", name: "50 Bordj Badji Mokhtar" },
  { code: "51", name: "51 Ouled Djellal" },
  { code: "52", name: "52 Béni Abbes" },
  { code: "53", name: "53 In Salah" },
  { code: "54", name: "54 In Guezzam" },
  { code: "55", name: "55 Touggourt" },
  { code: "56", name: "56 Djanet" },
  { code: "57", name: "57 El M'Ghair" },
  { code: "58", name: "58 El Meniaa" },
];

export const getPatientAge = (pat: Patient): number => {
  if (pat.Age_Pat !== undefined && pat.Age_Pat !== null) {
    return pat.Age_Pat;
  }
  if (pat.Age_Patient !== undefined && pat.Age_Patient !== null) {
    return pat.Age_Patient;
  }
  if (pat.type_patient === "Enfant" || pat.type_patient === "Enfant IMC") {
    return 6 + (pat.ID_Patient % 10);
  }
  return 24 + ((pat.ID_Patient * 7) % 45);
};

export const getPatientAffectation = (p: Patient): string => {
  return p.affectation || p.Affect_Pat_IMC || "";
};

// Convertisseur de nombres en lettres en français pour les reçus officiels (type Word)
export function numberToFrenchWords(n: number): string {
  if (n === 0) return "zéro";

  const units = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ];
  const tens = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ];
  const teens = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];

  function convertGroup(num: number): string {
    let result = "";
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (h > 0) {
      if (h === 1) {
        result += "cent ";
      } else {
        result += units[h] + " cent ";
      }
    }

    if (t > 0) {
      if (t === 1) {
        result += teens[u] + " ";
      } else if (t === 7) {
        result += "soixante-" + teens[u] + " ";
      } else if (t === 9) {
        result += "quatre-vingt-" + teens[u] + " ";
      } else if (t === 8) {
        result += "quatre-vingt" + (u === 0 ? "s " : "-" + units[u] + " ");
      } else {
        result +=
          tens[t] +
          (u === 1 && t !== 8 ? "-et-un " : u > 0 ? "-" + units[u] + " " : " ");
      }
    } else if (u > 0) {
      result += units[u] + " ";
    }

    return result.trim();
  }

  let words = "";
  let temp = n;

  const millions = Math.floor(temp / 1000000);
  temp %= 1000000;
  const thousands = Math.floor(temp / 1000);
  temp %= 1000;
  const remainder = temp;

  if (millions > 0) {
    words +=
      convertGroup(millions) + " million" + (millions > 1 ? "s" : "") + " ";
  }

  if (thousands > 0) {
    if (thousands === 1) {
      words += "mille ";
    } else {
      words += convertGroup(thousands) + " mille ";
    }
  }

  if (remainder > 0) {
    words += convertGroup(remainder) + " ";
  }

  return words.trim().toUpperCase();
}

const formatAlgerianDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const clean = dateStr.split(" ")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const slashes = clean.split("/");
  if (slashes.length === 3) {
    return clean;
  }
  return dateStr;
};

const formatDA = (num: number): string => {
  if (num === undefined || num === null || isNaN(num)) return "0,00 DA";
  const parts = num.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${parts[0]},${parts[1]} DA`;
};

const KacelLogoSVG = ({ className = "w-14 h-14" }: { className?: string }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="60"
      cy="60"
      r="54"
      fill="#1d2630"
      stroke="#facc15"
      strokeWidth="3.5"
    />
    <circle cx="60" cy="38" r="7.5" fill="#facc15" />
    <path
      d="M42 42 C45 60, 50 78, 60 84 C56 70, 50 56, 42 42 Z"
      fill="#facc15"
    />
    <path
      d="M48 48 C55 35, 70 32, 78 42 C68 46, 58 50, 48 48 Z"
      fill="#facc15"
    />
    <path
      d="M48 48 C58 54, 70 66, 75 78 C66 70, 56 60, 48 48 Z"
      fill="#facc15"
    />
    <text
      x="60"
      y="93"
      fill="#ffffff"
      fontFamily="'Inter', sans-serif"
      fontWeight="900"
      fontSize="8"
      textAnchor="middle"
      letterSpacing="0.8"
    >
      KACELSANTÉ
    </text>
    <path
      d="M35 100 Q47 97, 60 100 T85 100"
      stroke="#facc15"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M35 104 Q47 101, 60 104 T85 104"
      stroke="#facc15"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

interface PatientsManagerProps {
  dbState: DatabaseState;
  currentUser: Utilisateur;
  onSave: (state: DatabaseState) => void;
  triggerToast: (msg: string, type: "success" | "info" | "error") => void;
  isConsultationOnly?: boolean;
  hideMedicalDossierTab?: boolean;
  initialSelectedPatientId?: number | null;
  initialFolderTab?: "medical_dossier" | "subscriptions" | "seances_record";
  onClearInitialSelectedPatient?: () => void;
  onGoBack?: () => void;
  onRedirectToQueue?: (type?: 'MPR' | 'IMC') => void;
}

export const PatientsManager: React.FC<PatientsManagerProps> = ({
  dbState,
  currentUser,
  onSave,
  triggerToast,
  isConsultationOnly = false,
  hideMedicalDossierTab = false,
  initialSelectedPatientId = null,
  initialFolderTab,
  onClearInitialSelectedPatient,
  onGoBack,
  onRedirectToQueue,
}) => {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDatePlus30Days = (startDateStr: string) => {
    if (!startDateStr) return "";
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const ensureSingleActiveSubscriptionForPatient = (
    abonnements: Abonnement[],
    patientId: number,
    newlyActiveAbnId: number,
  ): Abonnement[] => {
    // Récupérer la catégorie de l'abonnement nouvellement activé
    const newlyActiveAbn = abonnements.find(
      (a) => a.ID_Abn === newlyActiveAbnId,
    );
    const newPack = newlyActiveAbn
      ? (dbState.packs ? dbState.packs.find((p) => p.ID_Pack === newlyActiveAbn.ID_Pack) : null)
      : null;
    const targetCat = newPack?.Cat_Pack;

    // Rend les autres abonnements du patient "Gelés" et "Fermés" de la même catégorie
    return abonnements.map((ab: any) => {
      if (ab.ID_Patient === patientId && ab.ID_Abn !== newlyActiveAbnId) {
        const abPack = dbState.packs ? dbState.packs.find((p) => p.ID_Pack === ab.ID_Pack) : null;
        const abCat = abPack?.Cat_Pack;

        // Si les deux abonnements partagent la même catégorie, on gèle l'ancien
        if (targetCat && abCat && targetCat === abCat) {
          return {
            ...ab,
            Etat: "Fermé",
            Est_Gele: true,
          };
        }
      }
      return ab;
    });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<string>("patients");
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [tableFontSize, setTableFontSize] = useState<
    "100%" | "120%" | "140%" | "160%" | "180%" | "200%"
  >("120%");

  // États de filtrage dynamique par colonne
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [filterPatientName, setFilterPatientName] = useState("");
  const [filterPatientArb, setFilterPatientArb] = useState("");
  const [filterPatientAge, setFilterPatientAge] = useState<number[]>([]);
  const [filterTypePat, setFilterTypePat] = useState<string[]>([]);
  const [filterPhoneInput, setFilterPhoneInput] = useState("");
  const [filterWilaya, setFilterWilaya] = useState<string[]>([]);
  const [filterNbreAbn, setFilterNbreAbn] = useState<number[]>([]);
  const [filterAffectation, setFilterAffectation] = useState<string[]>([]);
  const [filterFirstConsultDate, setFilterFirstConsultDate] = useState<string[]>([]);
  const [filterOrientation, setFilterOrientation] = useState<string[]>([]);

  // Missing common states restored
  const [currentPage, setCurrentPage] = useState(1);
  const [activeVersementAbnId, setActiveVersementAbnId] = useState<
    number | null
  >(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Espèces");
  const [paymentRemise, setPaymentRemise] = useState<string>("0");
  const [paymentDuration, setPaymentDuration] = useState<string>("1 mois");
  const [createdVersement, setCreatedVersement] = useState<any | null>(null);
  const [editingVersementId, setEditingVersementId] = useState<number | null>(
    null,
  );
  const [editingVersementAmount, setEditingVersementAmount] =
    useState<string>("");
  const [versementToDelete, setVersementToDelete] = useState<number | null>(
    null,
  );

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
    dbState.patients.length,
    searchTerm,
    filterPatientName,
    filterTypePat.join(","),
    filterWilaya.join(","),
    currentPage,
  ]);

  // New Patient states (local form states)
  const [nom, setNom] = useState("");
  const [nomArb, setNomArb] = useState("");
  const [prenomArb, setPrenomArb] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [genre, setGenre] = useState<"Homme" | "Femme" | "Enfant">("Homme");
  const [typePatient, setTypePatient] = useState<string>("Adulte");
  const [phone, setPhone] = useState("");
  const [dateNais, setDateNais] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [affectation, setAffectation] = useState("Sce Réeducation Adulte");
  const [address, setAddress] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [wilaya, setWilaya] = useState("16");
  const [antecedents, setAntecedents] = useState("");

  // Affectation automatique pour Enfant IMC
  React.useEffect(() => {
    if (typePatient === "Enfant IMC") {
      setAffectation("Intensif 2e");
    }
  }, [typePatient]);

  // Saisie par onglets pour Nouveau Patient
  const [addPatientTab, setAddPatientTab] = useState<
    "identity" | "subscription" | "medical" | "sessions"
  >("identity");
  const [newPatientHasAbn, setNewPatientHasAbn] = useState(false);
  const [newPatientPackId, setNewPatientPackId] = useState<number>(
    dbState.packs?.[0]?.ID_Pack || 1,
  );
  const [newPatientStartDate, setNewPatientStartDate] =
    useState(getTodayString());
  const [newPatientDateAbn, setNewPatientDateAbn] = useState<string>(getTodayString());
  const [newPatientEndDate, setNewPatientEndDate] = useState(
    getDatePlus30Days(getTodayString()),
  );
  const [newPatientAdd1, setNewPatientAdd1] = useState<string>("none");
  const [newPatientAdd2, setNewPatientAdd2] = useState<string>("none");
  const [newPatientNotesMpr, setNewPatientNotesMpr] = useState("");

  // Selected Patient for Folder view
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [orientationData, setOrientationData] = useState<OrientationData>(defaultOrientationData);

  const handleClosePatientFiche = () => {
    setSelectedPatient(null);
    if (onGoBack) {
      onGoBack();
    }
  };

  const exportToWord = (patient: Patient) => {
    if (!patient) return;

    const patientSessions = dbState.seances.filter(
      (s) => Number(s.ID_Patient) === Number(patient.ID_Patient)
    );

    const patientConsultations = dbState.consultations?.filter(
      (c) => Number(c.patient_id) === Number(patient.ID_Patient)
    ) || [];

    const patientAbonnements = dbState.abonnements?.filter(
      (a) => Number(a.ID_Patient) === Number(patient.ID_Patient)
    ) || [];

    const sessionsList = patientSessions.map(s => {
      const act = dbState.actes.find(a => a.ID_Acte === s.ID_Acte);
      const prat = dbState.praticiens.find(p => p.ID_Prat === s.ID_Prat);
      const actTitle = act?.Libelle_Acte || "Séance de Soins";
      const pratName = prat ? `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}` : "Non spécifié";
      return `- Séance #${s.ID_Seanc} du ${s.Date_Seanc_Realisee} (${s.H_Debut_Seanc} - ${s.H_Fin_Seanc}) : ${actTitle} par ${pratName}`;
    }).join('\r\n') || "Aucune séance enregistrée";

    const consultationsList = patientConsultations.map(c => {
      return `- Consultation du ${c.date_consultation} par Dr. ${c.medecin_mpr_nom} : ${c.commentaires || 'Aucun commentaire'}`;
    }).join('\r\n') || "Aucune consultation enregistrée";

    const abonnementsList = patientAbonnements.map(a => {
      const pack = dbState.packs?.find(p => p.id === a.pack_id || p.ID_Pack === a.ID_Pack);
      const packName = pack?.Libelle_Pack || pack?.name || "Pack Inconnu";
      return `- Abonnement Code: ${a.Nom_Abn || a.name || 'ABN'} (Pack: ${packName}) - État: ${a.etat || 'Actif'}`;
    }).join('\r\n') || "Aucun abonnement souscrit";

    const content = `========================================================================
                      CENTRE DE RÉÉDUCATION FONCTIONNELLE
                              FICHE KINÉSITHÉRAPIQUE
========================================================================

1. IDENTITÉ ET RÉSIDENCE DU PATIENT
------------------------------------------------------------------------
Code Patient : PAT_#0${patient.ID_Patient}
Nom Complet  : ${patient.Nom_Patient || "Non spécifié"}
Nom Arabe    : ${patient.Pren_Pat_Arb || ""} ${patient.Nom_Pat_Arb || ""}
Genre        : ${patient.Genre_Patient || "Non précisé"}
Âge          : ${patient.Age_Patient || 30} ans (Né(e) le: ${patient.Date_Nais_Pat || "Non précisée"})
Téléphone    : ${patient.phone || "Non renseigné"}
Adresse      : ${patient.address || "Non renseignée"}
Type Patient : ${patient.type_patient || "Adulte"}
Affectation  : ${patient.Affect_Pat_IMC || patient.affectation || "Aucune"}

2. DOSSIER MÉDICAL ET CLINIQUE (MPR)
------------------------------------------------------------------------
Antécédents :
${patient.antecedents || "Aucun antécédent particulier consigné"}

Observations cliniques / Notes :
${patient.dossier_medical || "Aucune observation clinique libre enregistrée"}

3. HISTORIQUE DES CONSULTATIONS MPR
------------------------------------------------------------------------
${consultationsList}

4. HISTORIQUE DES ABONNEMENTS ET PACKS
------------------------------------------------------------------------
${abonnementsList}

5. HISTORIQUE DES SÉANCES DE KINÉSITHÉRAPIE / ACTES RÉALISÉS
------------------------------------------------------------------------
${sessionsList}

========================================================================
Document généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
Source : Logiciel de Gestion de Rééducation MPR
========================================================================
`;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fiche_Kine_${(patient.Nom_Patient || "Patient").replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    if (initialSelectedPatientId !== null) {
      const match = dbState.patients.find(
        (p) => p.ID_Patient === initialSelectedPatientId,
      );
      if (match) {
        setSelectedPatient(match);
        if (initialFolderTab) {
          setFolderTab(initialFolderTab);
        } else {
          setFolderTab(
            hideMedicalDossierTab ? "subscriptions" : "medical_dossier",
          );
        }
        if (onClearInitialSelectedPatient) {
          onClearInitialSelectedPatient();
        }
      }
    }
  }, [
    initialSelectedPatientId,
    dbState.patients,
    onClearInitialSelectedPatient,
    initialFolderTab,
    hideMedicalDossierTab,
  ]);

  const [folderTab, setFolderTab] = useState<
    "medical_dossier" | "subscriptions" | "seances_record" | "fiche_pediatrique" | "planning_previsionnel" | "orientation"
  >(() => {
    if (selectedPatient?.type_patient === "Enfant IMC") return "fiche_pediatrique";
    return hideMedicalDossierTab ? "subscriptions" : "medical_dossier";
  });

  const [showIMCModal, setShowIMCModal] = useState(false);

  const [upperSplitRatio, setUpperSplitRatio] = useState<number>(50);

  // Checked patient rows state
  const [checkedPatientIds, setCheckedPatientIds] = useState<number[]>([]);

  // Archives & sessions collapse states for patients abonnements
  const [showArchives, setShowArchives] = useState(false);
  const [expandedSessionsAbnId, setExpandedSessionsAbnId] = useState<
    number | null
  >(null);

  const [selectedSeanceIds, setSelectedSeanceIds] = useState<number[]>([]);

  React.useEffect(() => {
    setSelectedSeanceIds([]);
  }, [expandedSessionsAbnId]);

  const handleDeleteSeances = (seanceIds: number[], abnId?: number | null) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirmation de suppression",
      message: seanceIds.length === 1 ? "Voulez-vous vraiment supprimer cette séance ?" : `Voulez-vous vraiment supprimer les ${seanceIds.length} séances sélectionnées ?`,
      onConfirm: () => {
        const updatedSeances = dbState.seances.filter(
          (s) => !seanceIds.includes(s.ID_Seanc),
        );

        // reset status of associated rendez-vous back to 'Planifié'
        const rdvIdsToReset = dbState.seances
          .filter((s) => seanceIds.includes(s.ID_Seanc) && s.ID_RDV !== null)
          .map((s) => s.ID_RDV as number);

        const updatedRendezVous = dbState.rendezVous.map((rdv) => {
          if (rdvIdsToReset.includes(rdv.ID_RDV)) {
            return {
              ...rdv,
              Statut_RDV: "Planifié" as const,
            };
          }
          return rdv;
        });

        const updatedAbonnements = dbState.abonnements.map((abn) => {
          const deletedFromThisAbn = seanceIds.filter((id) => {
            const sObj = dbState.seances.find((se) => se.ID_Seanc === id);
            return (
              sObj &&
              (abnId !== undefined && abnId !== null
                ? abn.ID_Abn === abnId
                : sObj.ID_Abn === abn.ID_Abn)
            );
          }).length;

          if (deletedFromThisAbn > 0) {
            const newConsumed = Math.max(
              0,
              abn.Nbre_Sean_Consom_Abn - deletedFromThisAbn,
            );
            return {
              ...abn,
              Nbre_Sean_Consom_Abn: newConsumed,
              Etat: abn.Etat === "Fermé" ? "Actif" : abn.Etat,
            };
          }
          return abn;
        });

        const nextState = {
          ...dbState,
          seances: updatedSeances,
          rendezVous: updatedRendezVous,
          abonnements: updatedAbonnements,
        };

        onSave(nextState);
        triggerToast(
          seanceIds.length === 1
            ? "La séance a été supprimée et son rendez-vous associé a été replanifié !"
            : `${seanceIds.length} séance(s) supprimée(s) avec succès !`,
          "success",
        );
      }
    });
  };

  // Versement et règlement rapide depuis la fiche patient
  const [quickPayAmounts, setQuickPayAmounts] = useState<{
    [abnId: number]: string;
  }>({});

  const handleQuickVersement = (abnId: number, amount: number) => {
    if (isNaN(amount) || amount <= 0) {
      triggerToast(
        "Paiement invalide. Veuillez renseigner un montant valide supérieur à 0 DA.",
        "error",
      );
      return;
    }

    const fresh = { ...dbState } as any;

    // Interdire tout encaissement prévisionnel (sur le futur)
    const abnMatchCheck = fresh.abonnements.find(
      (a: any) => a.ID_Abn === abnId,
    );
    if (abnMatchCheck) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (abnMatchCheck.Date_Debut_Abn > todayStr) {
        triggerToast(
          `Interdit : Encaissement prévisionnel non autorisé. Cet abonnement débute le ${abnMatchCheck.Date_Debut_Abn}.`,
          "error",
        );
        return;
      }
    }

    const nextVersId =
      fresh.versements.length > 0
        ? Math.max(...fresh.versements.map((v: any) => v.ID_Vers)) + 1
        : 1;

    // Date & Heure actuelle formatting
    const localNow = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedDate = `${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())} ${pad(localNow.getHours())}:${pad(localNow.getMinutes())}:${pad(localNow.getSeconds())}`;

    const newVers = {
      ID_Vers: nextVersId,
      ID_Abn: abnId,
      Mont_Vers: amount,
      Date_Vers: formattedDate,
    };

    fresh.versements = [...(fresh.versements || []), newVers];

    // Trouver le patient lié à cet abonnement
    const abnMatch = fresh.abonnements.find((a: any) => a.ID_Abn === abnId);
    const patId = abnMatch ? abnMatch.ID_Patient : 0;
    const patientMatch = fresh.patients.find(
      (p: any) => p.ID_Patient === patId,
    );
    const patientName = patientMatch
      ? patientMatch.Nom_Patient
      : `Patient #${patId}`;

    // Auto-enregistrement en caisse d'abonnement
    if (!fresh.transactions_caisses) {
      fresh.transactions_caisses = [];
    }
    const nextTransId =
      fresh.transactions_caisses.length > 0
        ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) +
          1
        : 1;

    const newCaisseTrans = {
      ID_Trans: nextTransId,
      Caisse: "Caisse Abonnement / Autres Soins" as any,
      Type: "Recette" as any,
      Montant: amount,
      Libelle: `Versement direct Fiche Patient ABN_#${abnId} (${patientName})`,
      ModePaiement: "Espèces" as any,
      Date_Trans: formattedDate.split(" ")[0], // YYYY-MM-DD
      Patient_Nom: patientName,
    };

    fresh.transactions_caisses = [
      ...fresh.transactions_caisses,
      newCaisseTrans,
    ];

    onSave(fresh);
    triggerToast(
      `Versement de ${amount} DA enregistré sous ABN_#${abnId} avec succès !`,
      "success",
    );

    // Reset local state input
    setQuickPayAmounts((prev) => ({ ...prev, [abnId]: "" }));
  };

  const handleSaveAntecedentsDirect = () => {
    if (!selectedPatient) return;
    const fresh = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
    const pIdx = fresh.patients.findIndex(
      (p) => p.ID_Patient === selectedPatient.ID_Patient,
    );
    if (pIdx !== -1) {
      fresh.patients[pIdx].antecedents = editAntecedents;
      onSave(fresh);
      setSelectedPatient({ ...selectedPatient, antecedents: editAntecedents });
      triggerToast("Antécédents médicaux enregistrés avec succès !", "success");
    }
  };

  // Sync folderTab if constraints change or patient type changes
  React.useEffect(() => {
    const isIMC = selectedPatient?.type_patient === "Enfant IMC";
    if (isIMC) {
      if (folderTab === "medical_dossier") {
        setFolderTab("fiche_pediatrique");
      }
    } else {
      if (folderTab === "fiche_pediatrique" || folderTab === "planning_previsionnel") {
        setFolderTab(hideMedicalDossierTab ? "subscriptions" : "medical_dossier");
      } else if (hideMedicalDossierTab && folderTab === "medical_dossier") {
        setFolderTab("subscriptions");
      }
    }
  }, [hideMedicalDossierTab, folderTab, selectedPatient]);

  // States for Admin creating subscription in patient's folder
  const [showAddAbnInline, setShowAddAbnInline] = useState(false);
  const [newAbnPackId, setNewAbnPackId] = useState<number>(1);
  const [newAbnStartDate, setNewAbnStartDate] =
    useState<string>(getTodayString());
  const [newAbnEndDate, setNewAbnEndDate] = useState<string>(
    getDatePlus30Days(getTodayString()),
  );
  const [newAbnAdd1, setNewAbnAdd1] = useState<string>("none");
  const [newAbnAdd2, setNewAbnAdd2] = useState<string>("none");
  const [newAbnDateAbn, setNewAbnDateAbn] = useState<string>(getTodayString());

  // États de modification d'un abonnement pour Admin & Assistante
  const [editingAbonnement, setEditingAbonnement] = useState<Abonnement | null>(
    null,
  );
  const [editAbnPackId, setEditAbnPackId] = useState<number>(1);
  const [editAbnStartDate, setEditAbnStartDate] = useState<string>("");
  const [editAbnEndDate, setEditAbnEndDate] = useState<string>("");
  const [editAbnConsumed, setEditAbnConsumed] = useState<number>(0);
  const [editAbnAdd1, setEditAbnAdd1] = useState<string>("none");
  const [editAbnAdd2, setEditAbnAdd2] = useState<string>("none");
  const [editAbnEtat, setEditAbnEtat] = useState<"Actif" | "Fermé" | "Gelé">("Actif");
  const [editAbnDateAbn, setEditAbnDateAbn] = useState<string>("");

  const handleStartEditAbn = (abn: Abonnement) => {
    setEditingAbonnement(abn);
    setEditAbnPackId(abn.ID_Pack);
    setEditAbnStartDate(abn.Date_Debut_Abn);
    setEditAbnEndDate(abn.Date_Fin_Abn);
    setEditAbnConsumed(abn.Nbre_Sean_Consom_Abn);
    setEditAbnAdd1(abn.ID_Acte_Add1 ? String(abn.ID_Acte_Add1) : "none");
    setEditAbnAdd2(abn.ID_Acte_Add2 ? String(abn.ID_Acte_Add2) : "none");
    setEditAbnEtat(abn.Etat || "Actif");
    setEditAbnDateAbn(abn.Date_Abn || abn.Date_Debut_Abn);
  };

  const handleSaveEditedAbn = () => {
    if (!editingAbonnement) return;

    if (editAbnAdd1 !== "none" && editAbnAdd1 === editAbnAdd2) {
      triggerToast(
        "Erreur : l'acte optionnel 1 et l'acte optionnel 2 ne peuvent pas être identiques !",
        "error",
      );
      return;
    }

    const fresh = { ...dbState };
    const idx = fresh.abonnements.findIndex(
      (a) => a.ID_Abn === editingAbonnement.ID_Abn,
    );
    if (idx !== -1) {
      fresh.abonnements[idx] = {
        ...fresh.abonnements[idx],
        ID_Pack: Number(editAbnPackId),
        Date_Debut_Abn: editAbnStartDate,
        Date_Fin_Abn: editAbnEndDate,
        Nbre_Sean_Consom_Abn: Number(editAbnConsumed),
        ID_Acte_Add1: editAbnAdd1 === "none" ? null : Number(editAbnAdd1),
        ID_Acte_Add2: editAbnAdd2 === "none" ? null : Number(editAbnAdd2),
        Etat: editAbnEtat,
        Est_Gele: editAbnEtat === "Fermé" ? true : false,
        Date_Abn: editAbnDateAbn,
      } as any;

      if (editAbnEtat === "Actif") {
        fresh.abonnements = ensureSingleActiveSubscriptionForPatient(
          fresh.abonnements,
          editingAbonnement.ID_Patient,
          editingAbonnement.ID_Abn,
        );
      }

      onSave(fresh);
      setEditingAbonnement(null);
      triggerToast(
        `Abonnement ABN_${editingAbonnement.ID_Abn} modifié avec succès par ${currentUser.Nom_Utilisateur} !`,
        "success",
      );
    }
  };

  // Interactive edit fields for Admin / Receptionniste RDC & MPR doctor
  const [editNom, setEditNom] = useState("");
  const [editNomArb, setEditNomArb] = useState("");
  const [editPrenomArb, setEditPrenomArb] = useState("");
  const [editPseudo, setEditPseudo] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGenre, setEditGenre] = useState<"Homme" | "Femme" | "Enfant">(
    "Homme",
  );
  const [editTypePat, setEditTypePat] = useState<string>("Adulte");
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  const handleAddPatientType = () => {
    const val = prompt(
      "Saisissez le nom du nouveau type de patient (ex: Sénior, Gériatrique, Sportif, Nourrisson...) :",
    );
    if (val && val.trim()) {
      const trimmed = val.trim();
      const list = dbState.typesPatients || ["Adulte", "Enfant", "Enfant IMC"];
      if (list.map((l) => l.toLowerCase()).includes(trimmed.toLowerCase())) {
        triggerToast("Ce type de patient existe déjà !", "info");
        return;
      }
      const updatedList = [...list, trimmed];
      onSave({
        ...dbState,
        typesPatients: updatedList,
      });
      triggerToast(
        `Type de patient "${trimmed}" ajouté avec succès.`,
        "success",
      );
      setTypePatient(trimmed);
      setEditTypePat(trimmed);
    }
  };

  const [editAffectation, setEditAffectation] = useState<string>("Intensif 3e");
  const [editAddress, setEditAddress] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editWilaya, setEditWilaya] = useState("16");
  const [editNotesMedicales, setEditNotesMedicales] = useState("");
  const [editAntecedents, setEditAntecedents] = useState("");
  const [editAge, setEditAge] = useState<number>(30);
  const [editDateNais, setEditDateNais] = useState<string>("");

  // Sync edit states when selected patient changes
  React.useEffect(() => {
    if (selectedPatient) {
      setIsEditingPatient(false);
      setShowArchives(false);
      setExpandedSessionsAbnId(null);
      setEditNom(selectedPatient.Nom_Patient || "");
      setEditNomArb(selectedPatient.Nom_Pat_Arb || "");
      setEditPrenomArb(selectedPatient.Pren_Pat_Arb || "");
      setEditPseudo(selectedPatient.Pseudo || "");
      setEditPhone(selectedPatient.phone || "");
      setEditGenre(selectedPatient.Genre_Patient || "Homme");
      setEditTypePat(selectedPatient.type_patient || "Adulte");
      setEditAffectation(
        selectedPatient.Affect_Pat_IMC ||
          selectedPatient.affectation ||
          "Intensif 3e",
      );
      setEditAddress(selectedPatient.address || "");
      setEditStreet(selectedPatient.street || "");
      setEditCity(selectedPatient.city || "");
      setEditWilaya(selectedPatient.wilaya || "16");
      setEditAntecedents(
        selectedPatient.antecedents || "Néant / Aucun antécédent particulier",
      );
      setEditAge(selectedPatient.Age_Patient || 30);
      setEditDateNais(selectedPatient.Date_Nais_Pat || "");
      setEditNotesMedicales(
        selectedPatient.dossier_medical ||
          `### Bilan Initial MPR
- Antécédents : ${selectedPatient.antecedents || "Aucun antécédent particulier."}
- Diagnostic principal : Déficit fonctionnel à rééduquer.
- Objectifs Thérapeutiques : Renforcement musculaire, gain d'amplitude, amélioration de la marche.
- Prescription recommandée : Séances régulières.`,
      );
    }
  }, [selectedPatient]);

  // Sync orientation data when selected patient changes
  React.useEffect(() => {
    if (selectedPatient) {
      setOrientationData((selectedPatient as any).orientation || defaultOrientationData);
    }
  }, [selectedPatient]);

  const handleSaveOrientation = () => {
    if (!selectedPatient) return;
    const updatedPatients = dbState.patients.map((p) => {
      if (p.ID_Patient === selectedPatient.ID_Patient) {
        return {
          ...p,
          orientation: orientationData,
        };
      }
      return p;
    });
    const updatedState = {
      ...dbState,
      patients: updatedPatients,
    };
    onSave(updatedState);
    setSelectedPatient({ ...selectedPatient, orientation: orientationData } as any);
    triggerToast("Orientation du patient enregistrée avec succès !", "success");
  };

  const handleSaveAdminInfo = () => {
    if (currentUser.Role === "Médecin MPR") {
      triggerToast(
        "Le médecin MPR n'est pas autorisé à modifier les fiches d'identité des patients.",
        "error",
      );
      return;
    }
    if (!editNom.trim()) {
      triggerToast("Le nom complet est obligatoire.", "error");
      return;
    }
    if (editTypePat === "Enfant IMC" && !editPseudo.trim()) {
      triggerToast("Le Pseudo est obligatoire pour les enfants IMC.", "error");
      return;
    }
    const updatedPatients = dbState.patients.map((p) => {
      if (p.ID_Patient === selectedPatient!.ID_Patient) {
        return {
          ...p,
          Nom_Patient: editNom.trim().toUpperCase(),
          Nom_Pat_Arb: editNomArb.trim(),
          Pren_Pat_Arb: editPrenomArb.trim(),
          Pseudo: editTypePat === "Enfant IMC" ? editPseudo.trim() : undefined,
          Genre_Patient: editGenre,
          type_patient: editTypePat,
          affectation: editAffectation,
          Affect_Pat_IMC: editAffectation,
          phone: editPhone.trim(),
          address: editAddress.trim(),
          street: editStreet.trim(),
          city: editCity.trim(),
          wilaya: editWilaya,
          antecedents: editAntecedents.trim(),
          Age_Patient: editDateNais
            ? calculateAge(editDateNais)
            : Number(editAge) || 30,
          Age_Pat: editDateNais
            ? calculateAge(editDateNais)
            : Number(editAge) || 30,
          Date_Nais_Pat: editDateNais || undefined,
          orientation: orientationData,
        };
      }
      return p;
    });

    const updatedState = {
      ...dbState,
      patients: updatedPatients,
    };
    onSave(updatedState);

    const freshPat = updatedPatients.find(
      (p) => p.ID_Patient === selectedPatient!.ID_Patient,
    );
    if (freshPat) {
      setSelectedPatient(freshPat);
    }
    triggerToast(
      "Informations administratives enregistrées avec succès.",
      "success",
    );
  };

  const handleSaveMedicalNotes = () => {
    const updatedPatients = dbState.patients.map((p) => {
      if (p.ID_Patient === selectedPatient!.ID_Patient) {
        return {
          ...p,
          dossier_medical: editNotesMedicales,
          antecedents: editAntecedents.trim(),
          Age_Patient: editDateNais
            ? calculateAge(editDateNais)
            : Number(editAge) || p.Age_Patient || 30,
          Age_Pat: editDateNais
            ? calculateAge(editDateNais)
            : Number(editAge) || p.Age_Patient || 30,
          Date_Nais_Pat: editDateNais || undefined,
          orientation: orientationData,
        };
      }
      return p;
    });

    const updatedState = {
      ...dbState,
      patients: updatedPatients,
    };
    onSave(updatedState);

    const freshPat = updatedPatients.find(
      (p) => p.ID_Patient === selectedPatient!.ID_Patient,
    );
    if (freshPat) {
      setSelectedPatient(freshPat);
    }
    triggerToast(
      "Dossier médical & Antécédents MPR mis à jour avec de nouvelles notes.",
      "success",
    );
  };

  // Form states (Opened in sliding modal dialog)
  const [isAddingPatient, setIsAddingPatient] = useState(() => {
    return (
      (currentUser.Role === "Admin" || currentUser.Role === "Receptionniste RDC" || currentUser.Role === "SupperRec") &&
      initialSelectedPatientId === null
    );
  });

  const resetBlankPatientFields = () => {
    setNom("");
    setNomArb("");
    setPrenomArb("");
    setPseudo("");
    setGenre("Homme");
    setTypePatient("Adulte");
    setAffectation("Sce Réeducation Adulte");
    setPhone("");
    setAddress("");
    setStreet("");
    setCity("");
    setWilaya("16");
    setAntecedents("");
    setAge("");
    setDateNais("");
    setNewPatientHasAbn(false);
    setNewPatientPackId(dbState.packs?.[0]?.ID_Pack || 1);
    setNewPatientStartDate(getTodayString());
    setNewPatientDateAbn(getTodayString());
    setNewPatientEndDate(getDatePlus30Days(getTodayString()));
    setNewPatientAdd1("none");
    setNewPatientAdd2("none");
    setNewPatientNotesMpr("");
    setAddPatientTab("identity");
  };

  const handleTriggerAddPatient = () => {
    setSelectedPatient(null);
    resetBlankPatientFields();
    setIsAddingPatient(true);
  };

  // Vider tous les champs lors du chargement de la fiche patient vierge
  React.useEffect(() => {
    if (isAddingPatient) {
      resetBlankPatientFields();
    }
  }, [isAddingPatient, dbState.packs]);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.Role === "Médecin MPR") {
      triggerToast(
        "Le médecin MPR n'est pas autorisé à créer des fiches patients.",
        "error",
      );
      return;
    }
    if (!nom.trim()) {
      triggerToast(
        "Le nom du patient est obligatoire (Onglet Identité).",
        "error",
      );
      setAddPatientTab("identity");
      return;
    }
    if (typePatient === "Enfant IMC" && !pseudo.trim()) {
      triggerToast(
        "Le Pseudo est obligatoire pour les enfants IMC (Onglet Identité).",
        "error",
      );
      setAddPatientTab("identity");
      return;
    }

    if (
      newPatientHasAbn &&
      newPatientAdd1 !== "none" &&
      newPatientAdd1 === newPatientAdd2
    ) {
      triggerToast(
        "Erreur : l'acte optionnel 1 et l'acte optionnel 2 ne peuvent pas être identiques ! (Onglet Abonnement)",
        "error",
      );
      setAddPatientTab("subscription");
      return;
    }

    const fresh = { ...dbState };
    const nextId =
      fresh.patients.length > 0
        ? Math.max(...fresh.patients.map((p) => p.ID_Patient)) + 1
        : 1;

    let hasAbnCreated = false;
    let createdAbn: Abonnement | null = null;

    if (newPatientHasAbn) {
      const nextAbnId =
        fresh.abonnements.length > 0
          ? Math.max(...fresh.abonnements.map((a) => a.ID_Abn)) + 1
          : 1;
      createdAbn = {
        ID_Abn: nextAbnId,
        ID_Patient: nextId,
        ID_Pack: Number(newPatientPackId),
        Date_Debut_Abn: newPatientStartDate,
        Date_Fin_Abn: newPatientEndDate,
        Nbre_Sean_Consom_Abn: 0,
        ID_Acte_Add1: newPatientAdd1 === "none" ? null : Number(newPatientAdd1),
        ID_Acte_Add2: newPatientAdd2 === "none" ? null : Number(newPatientAdd2),
        Etat: "Gelé",
        Date_Abn: newPatientDateAbn,
      };
      fresh.abonnements = ensureSingleActiveSubscriptionForPatient(
        [...fresh.abonnements, createdAbn],
        nextId,
        nextAbnId,
      );
      hasAbnCreated = true;
    }

    const resolvedAffectation = typePatient === "Enfant IMC" && (!affectation || affectation === "Sce Réeducation Adulte") ? "Intensif 2e" : affectation;
    const generatedNumReg = typePatient === "Enfant IMC" ? generateNextIMCNumRegistre(fresh.patients, fresh.fiches_imc) : undefined;

    const newPatient: Patient = {
      ID_Patient: nextId,
      Nom_Patient: nom.trim().toUpperCase(),
      Nom_Pat_Arb: nomArb.trim() || undefined,
      Pren_Pat_Arb: prenomArb.trim() || undefined,
      Pseudo: typePatient === "Enfant IMC" ? pseudo.trim() : undefined,
      Genre_Patient: genre,
      type_patient: typePatient,
      numRegistre: generatedNumReg,
      Num_Registre: generatedNumReg,
      affectation: resolvedAffectation,
      Affect_Pat_IMC: resolvedAffectation,
      phone: phone.trim() || "Non renseigné",
      address: address.trim() || "Non renseignée",
      street: street.trim() || "Non renseignée",
      city: city.trim() || "Non renseignée",
      wilaya: wilaya,
      antecedents: antecedents.trim() || "Néant / Aucun antécédent particulier",
      Age_Patient: dateNais ? calculateAge(dateNais) : Number(age) || 30,
      Age_Pat: dateNais ? calculateAge(dateNais) : Number(age) || 30,
      Date_Nais_Pat: dateNais || undefined,
      Nbre_Abn: hasAbnCreated ? 1 : 0,
      Nbre_Abn_Pat: hasAbnCreated ? 1 : 0,
      dossier_medical: newPatientNotesMpr.trim() || undefined,
    };

    fresh.patients = [...fresh.patients, newPatient];

    let autoAddedToQueue = false;
    const isMprType = typePatient === "Adulte" || typePatient === "Enfant";
    const isImcType = typePatient === "Enfant IMC";

    if (isMprType) {
      if (!fresh.fileAttente) {
        fresh.fileAttente = [];
      }
      const nextFileId = fresh.fileAttente.length > 0
        ? Math.max(...fresh.fileAttente.map((q) => q.ID_File)) + 1
        : 1;

      const actLabel = typePatient === "Adulte" ? "Consultation MPR Adulte" : "Consultation MPR Enfant";
      const matchedAct = (fresh.actes || []).find((a) => a.Libelle_Acte === actLabel);
      let actPrice = 0;
      if (matchedAct) {
        actPrice = matchedAct.Prix_Acte;
      } else {
        console.warn(`Acte non trouvé dans la table actes: "${actLabel}"`);
        actPrice = 0;
      }

      const todayStr = getTodayString();
      const todayCount = fresh.fileAttente.filter((q) => q.Date_File === todayStr).length + 1;
      const ticketNum = `F-MPR-${todayCount.toString().padStart(3, '0')}`;

      const getHHMM = () => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      };

      const newQueueEntry: any = {
        ID_File: nextFileId,
        ID_Patient: nextId,
        Nom_Patient: newPatient.Nom_Patient,
        Type_Patient: typePatient,
        Acte: actLabel,
        Prix: actPrice,
        Type_Consultation: actLabel,
        Prix_Consultation: actPrice,
        Statut_Attente: "En Attente",
        Regle: false,
        Date_File: todayStr,
        Heure_Arrivee: getHHMM(),
        Position: todayCount,
        Num_Ticket: ticketNum,
        Heure_Appel: null,
        Heure_Cloture: null,
        updatedAt: Date.now()
      };

      fresh.fileAttente = [...fresh.fileAttente, newQueueEntry];
      autoAddedToQueue = true;
    } else if (isImcType) {
      if (!fresh.fileAttenteIMC) {
        fresh.fileAttenteIMC = [];
      }
      const nextFileIdImc = fresh.fileAttenteIMC.length > 0
        ? Math.max(...fresh.fileAttenteIMC.map((q) => q.ID_File)) + 1
        : 1;

      const actLabel = "Consultation Enfant IMC";
      const matchedAct = (fresh.actes || []).find((a) => a.Libelle_Acte === actLabel);
      let actPrice = 0;
      if (matchedAct) {
        actPrice = matchedAct.Prix_Acte;
      }

      const todayStr = getTodayString();
      const getHHMM = () => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      };

      const newQueueEntry: any = {
        ID_File: nextFileIdImc,
        ID_Patient: nextId,
        Nom_Patient: newPatient.Nom_Patient,
        Type_Patient: typePatient,
        Type_Soin: actLabel,
        Prix_Soin: actPrice,
        Statut_Attente: "En attente d'abonnement",
        Regle: false,
        Date_File: todayStr,
        Heure_Arrivee: getHHMM(),
        Heure_Appel: null,
        Heure_Cloture: null,
        updatedAt: Date.now()
      };

      fresh.fileAttenteIMC = [...fresh.fileAttenteIMC, newQueueEntry];
      autoAddedToQueue = true;
    }

    onSave(fresh);

    // Reset fields
    setNom("");
    setNomArb("");
    setPrenomArb("");
    setPseudo("");
    setGenre("Homme");
    setTypePatient("Adulte");
    setAffectation("Sce Réeducation Adulte");
    setPhone("");
    setAddress("");
    setStreet("");
    setCity("");
    setWilaya("16");
    setAntecedents("");
    setAge("");
    setDateNais("");
    setNewPatientHasAbn(false);
    setNewPatientPackId(dbState.packs?.[0]?.ID_Pack || 1);
    setNewPatientStartDate(getTodayString());
    setNewPatientEndDate(getDatePlus30Days(getTodayString()));
    setNewPatientAdd1("none");
    setNewPatientAdd2("none");
    setNewPatientNotesMpr("");
    setAddPatientTab("identity");
    setIsAddingPatient(false);

    setSelectedPatient(newPatient);

    if (autoAddedToQueue) {
      if (isMprType) {
        triggerToast(
          "Patient créé et ajouté à la file MPR",
          "success"
        );
      } else if (isImcType) {
        triggerToast(
          "Patient créé et ajouté à la file IMC",
          "success"
        );
      }
    } else if (hasAbnCreated && createdAbn) {
      triggerToast(
        `Dossier d'admission PAT_${nextId} et Abonnement de Soins ABN_${createdAbn.ID_Abn} créés avec succès par l'Admin !`,
        "success"
      );
    } else {
      triggerToast(
        `Fiche d'Admission Patient ${newPatient.Nom_Patient} ajoutée avec succès. Code : PAT_${newPatient.ID_Patient}`,
        "success"
      );
    }
  };

  const handleProcessVersement = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast("Veuillez saisir un montant valide supérieur à 0.", "error");
      return;
    }

    const fresh = { ...dbState };
    const abnMatch = fresh.abonnements.find(
      (a) => a.ID_Abn === activeVersementAbnId,
    );
    if (!abnMatch) {
      triggerToast("Abonnement introuvable.", "error");
      return;
    }

    // Interdire tout encaissement prévisionnel (sur le futur)
    const todayStr = new Date().toISOString().split("T")[0];
    if (abnMatch.Date_Debut_Abn > todayStr) {
      triggerToast(
        `Interdit : Encaissement prévisionnel non autorisé. Cet abonnement débute le ${abnMatch.Date_Debut_Abn}.`,
        "error",
      );
      return;
    }

    const abnVersements = fresh.versements.filter(
      (v: any) => v.ID_Abn === activeVersementAbnId,
    );
    const totalVerses = abnVersements.reduce(
      (sum: number, v: any) => sum + v.Mont_Vers,
      0,
    );

    // Récupération dynamique du prix depuis le pack associé
    const getPackPrice = (packId: number) => {
      const foundPack = fresh.packs.find((p) => p.ID_Pack === packId);
      return foundPack?.Prix_Pack ?? 0;
    };
    const price = getPackPrice(abnMatch.ID_Pack);
    const remiseVal = Number(paymentRemise) || 0;
    const durationVal = paymentDuration || "1 mois";
    const maxAllowed = Math.max(0, price - remiseVal - totalVerses);

    if (amount > maxAllowed) {
      triggerToast(
        `Le montant maximal autorisé est de ${maxAllowed} DA (prix total après remise: ${price - remiseVal} DA).`,
        "error",
      );
      return;
    }

    const nextVersId =
      fresh.versements.length > 0
        ? Math.max(...fresh.versements.map((v: any) => v.ID_Vers)) + 1
        : 1;
    const localNow = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedDate = `${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())} ${pad(localNow.getHours())}:${pad(localNow.getMinutes())}:${pad(localNow.getSeconds())}`;

    const newVers = {
      ID_Vers: nextVersId,
      ID_Abn: activeVersementAbnId!,
      Mont_Vers: amount,
      Date_Vers: formattedDate,
    };

    fresh.versements = [...fresh.versements, newVers];

    // Enregistrer comme recette dans transactions_caisses
    if (!fresh.transactions_caisses) {
      fresh.transactions_caisses = [];
    }
    const nextTransId =
      fresh.transactions_caisses.length > 0
        ? Math.max(...fresh.transactions_caisses.map((t: any) => t.ID_Trans)) +
          1
        : 1;

    const patientMatch = fresh.patients.find(
      (p) => p.ID_Patient === abnMatch.ID_Patient,
    );
    const patientName = patientMatch
      ? patientMatch.Nom_Patient
      : `Patient #${abnMatch.ID_Patient}`;

    const newCaisseTrans = {
      ID_Trans: nextTransId,
      Caisse: "Caisse Abonnement / Autres Soins" as any,
      Type: "Recette" as any,
      Montant: amount,
      Libelle: `Versement direct ABN_#${activeVersementAbnId} (${patientName})`,
      ModePaiement: paymentMode as any,
      Date_Trans: formattedDate.split(" ")[0], // YYYY-MM-DD
      Patient_Nom: patientName,
    };
    fresh.transactions_caisses = [
      ...fresh.transactions_caisses,
      newCaisseTrans,
    ];

    // Sauvegarder dans dbState
    onSave(fresh);

    // Enregistrer pour l'édition de reçu
    setCreatedVersement({
      ...newVers,
      patientName,
      patientPhone: patientMatch?.phone || "Non spécifié",
      patientAddress:
        [
          patientMatch?.address || "",
          patientMatch?.city || "",
          patientMatch?.wilaya || "",
        ]
          .filter(Boolean)
          .join(", ") || "Non spécifiée",
      patientAge:
        patientMatch?.Age_Patient || patientMatch?.Age_Pat || "Non renseigné",
      patientType: patientMatch?.type_patient || "Adulte",
      packLabel:
        fresh.packs.find((p) => p.ID_Pack === abnMatch.ID_Pack)?.Libelle_Pack ||
        "Pack de Soins",
      packPrice: price,
      remise: remiseVal,
      duration: durationVal,
      dateAbn: abnMatch.Date_Debut_Abn,
      dateDebutAbn: abnMatch.Date_Debut_Abn,
      dateFinAbn: abnMatch.Date_Fin_Abn,
      totalPaidSoFar: totalVerses + amount,
      paymentMode: paymentMode,
      ID_Trans: nextTransId,
      referenceAbn: `ABN_#0${abnMatch.ID_Abn}`,
    });

    setPaymentAmount("");
    setPaymentRemise("0");
    setPaymentDuration("1 mois");
    triggerToast(
      "Paiement enregistré avec succès ! Reçu disponible.",
      "success",
    );
  };

  const handleUpdateVersement = (vId: number) => {
    const newAmount = Number(editingVersementAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      triggerToast("Montant invalide.", "error");
      return;
    }

    const fresh = { ...dbState };
    const vMatch = fresh.versements.find((v) => v.ID_Vers === vId);
    if (!vMatch) return;

    const abnMatch = fresh.abonnements.find((a) => a.ID_Abn === vMatch.ID_Abn);
    if (!abnMatch) return;

    const pack = fresh.packs.find((p) => p.ID_Pack === abnMatch.ID_Pack);
    const packPrice = pack?.Prix_Pack ?? 0;

    const otherVersements = fresh.versements.filter(
      (v) => v.ID_Abn === vMatch.ID_Abn && v.ID_Vers !== vId,
    );
    const otherTotal = otherVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);

    if (newAmount + otherTotal > packPrice) {
      triggerToast(
        `Montant trop élevé. Le total ne peut excéder ${packPrice} DA.`,
        "error",
      );
      return;
    }

    // Update Versement
    fresh.versements = fresh.versements.map((v) =>
      v.ID_Vers === vId ? { ...v, Mont_Vers: newAmount } : v,
    );

    // Update Transaction Caisse (find by libelle pattern)
    if (fresh.transactions_caisses) {
      const searchLib = `Versement direct ABN_#${vMatch.ID_Abn}`;
      fresh.transactions_caisses = fresh.transactions_caisses.map((t) => {
        if (t.Libelle.includes(searchLib) && t.Montant === vMatch.Mont_Vers) {
          return { ...t, Montant: newAmount };
        }
        return t;
      });
    }

    onSave(fresh);
    setEditingVersementId(null);
    triggerToast("Versement mis à jour.", "success");
  };

  const handleDeleteVersement = (vId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirmation de suppression",
      message: "Voulez-vous vraiment supprimer ce versement ?",
      onConfirm: () => {
        const fresh = { ...dbState };
        const vMatch = fresh.versements.find((v) => v.ID_Vers === vId);
        if (!vMatch) return;

        fresh.versements = fresh.versements.filter((v) => v.ID_Vers !== vId);

        // Update Transaction Caisse
        if (fresh.transactions_caisses) {
          const searchLib = `Versement direct ABN_#${vMatch.ID_Abn}`;
          fresh.transactions_caisses = fresh.transactions_caisses.filter(
            (t) =>
              !(t.Libelle.includes(searchLib) && t.Montant === vMatch.Mont_Vers),
          );
        }

        onSave(fresh);
        triggerToast("Versement supprimé.", "info");
      }
    });
  };

  const handlePrintVersement = (vId: number) => {
    const fresh = { ...dbState };
    const vMatch = fresh.versements.find((v) => v.ID_Vers === vId);
    if (!vMatch) return;
    const abnMatch = fresh.abonnements.find((a) => a.ID_Abn === vMatch.ID_Abn);
    if (!abnMatch) return;

    const patientMatch = fresh.patients.find(
      (p) => p.ID_Patient === abnMatch.ID_Patient,
    );
    const patientName = patientMatch
      ? patientMatch.Nom_Patient
      : `Patient #${abnMatch.ID_Patient}`;

    const sortedVersements = fresh.versements
      .filter((v) => v.ID_Abn === abnMatch.ID_Abn)
      .sort((a, b) => a.ID_Vers - b.ID_Vers);

    const vIdx = sortedVersements.findIndex((v) => v.ID_Vers === vId);
    const totalPaidUntilThis = sortedVersements
      .slice(0, vIdx + 1)
      .reduce((sum, v) => sum + v.Mont_Vers, 0);

    const getPackPrice = (packId: number) => {
      const foundPack = fresh.packs.find((p) => p.ID_Pack === packId);
      return foundPack?.Prix_Pack ?? 0;
    };
    const price = getPackPrice(abnMatch.ID_Pack);

    setCreatedVersement({
      ...vMatch,
      patientName,
      patientPhone: patientMatch?.phone || "Non spécifié",
      patientAddress:
        [
          patientMatch?.address || "",
          patientMatch?.city || "",
          patientMatch?.wilaya || "",
        ]
          .filter(Boolean)
          .join(", ") || "Non spécifiée",
      patientAge:
        patientMatch?.Age_Patient || patientMatch?.Age_Pat || "Non renseigné",
      patientType: patientMatch?.type_patient || "Adulte",
      packLabel:
        fresh.packs.find((p) => p.ID_Pack === abnMatch.ID_Pack)?.Libelle_Pack ||
        "Pack de Soins",
      packPrice: price,
      remise: abnMatch.Remise || 0,
      duration: abnMatch.Duree_Abn || "1 mois",
      dateAbn: abnMatch.Date_Debut_Abn,
      dateDebutAbn: abnMatch.Date_Debut_Abn,
      dateFinAbn: abnMatch.Date_Fin_Abn,
      totalPaidSoFar: totalPaidUntilThis,
      paymentMode: vMatch.paymentMode || "Espèces",
      ID_Trans: vMatch.ID_Trans || vMatch.ID_Vers,
      referenceAbn: `ABN_#0${abnMatch.ID_Abn}`,
    });
  };

  const handleDeletePatient = (patientId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row selection modal
    setConfirmDialog({
      isOpen: true,
      title: "Confirmation de suppression",
      message: "Voulez-vous vraiment supprimer ce patient ? Cette action supprimera définitivement sa fiche s'il n'a pas d'abonnement ou de rendez-vous.",
      onConfirm: () => {
        // Check if patient has active subscriptions or consults first
        const hasAbn = dbState.abonnements.some((a) => a.ID_Patient === patientId);
        const hasRDV = dbState.rendezVous.some((r) => r.ID_Patient === patientId);

        if (hasAbn || hasRDV) {
          triggerToast(
            "Impossible de supprimer ce patient car il possède un abonnement ou des rendez-vous.",
            "error",
          );
          return;
        }

        const fresh = { ...dbState };
        fresh.patients = fresh.patients.filter((p) => p.ID_Patient !== patientId);
        onSave(fresh);
        if (selectedPatient?.ID_Patient === patientId) {
          setSelectedPatient(null);
        }
        triggerToast("Le patient a été supprimé de la base de données.", "info");
      }
    });
  };

  const getWilayaLabel = (code: string) => {
    const wObj = WILAYAS.find((w) => w.code === code);
    return wObj ? wObj.name : `${code} Wilaya`;
  };

  // Enrich high-performance full list once
  const patientsWithDetails = React.useMemo(() => {
    return dbState.patients.map((p) => {
      const patAge = getPatientAge(p);
      const patAffectation = getPatientAffectation(p).trim() || "Aucune";
      const nbreAbn = p.Nbre_Abn_Pat ?? 0;
      const typePatVal = p.type_patient || "Adulte";
      const wilayaVal = p.wilaya || "01";
      const arrBioArb = (
        (p.Pren_Pat_Arb || "") +
        " " +
        (p.Nom_Pat_Arb || "")
      ).toLowerCase();

      return {
        p,
        patAge,
        patAffectation,
        nbreAbn,
        typePatVal,
        wilayaVal,
        arrBioArb,
        firstConsultDate: (() => {
          // Source 1: Rendez-vous classiques
          const patientRDVs = (dbState?.rendezVous || []).filter(
            r => Number(r.ID_Patient) === Number(p.ID_Patient)
          );

          // Source 2: File d'attente MPR (consultations terminées)
          const patientFileAttente = (dbState?.fileAttente || []).filter(
            f => Number(f.ID_Patient) === Number(p.ID_Patient)
              && f.Statut_Attente === 'Terminé'
              && (f.Type_Consultation || '').toLowerCase().includes('consultation')
          );

          // Source 3: File d'attente IMC (consultations terminées)
          const patientFileAttenteIMC = (dbState?.fileAttenteIMC || []).filter(
            f => Number(f.ID_Patient) === Number(p.ID_Patient)
              && f.Statut_Attente === 'Terminé'
              && (f.Type_Soin || '').toLowerCase().includes('consultation')
          );

          // Collecter toutes les dates
          const allDates = [
            ...patientRDVs.map(r => r.Date_RDV),
            ...patientFileAttente.map(f => f.Date_File),
            ...patientFileAttenteIMC.map(f => f.Date_File)
          ].filter(Boolean);

          if (allDates.length === 0) return null;

          // Trier par date croissante (plus ancienne = 1ère consultation)
          const sorted = allDates.sort((a, b) => (a || '').localeCompare(b || ''));
          return sorted[0] || null;
        })(),
        orientationLabels: (() => {
          const orient = (p as any).orientation;
          if (!orient) return [];
          const labels = [];
          if (orient.boucheAOreille) labels.push("Bouche à Oreille");
          if (orient.reseauxSociaux) labels.push("Réseaux Sociaux");
          if (orient.tiktok) labels.push("TikTok");
          if (orient.medecin) {
            if (orient.medecinType === "liberal") {
              labels.push("Médecin Cabinet");
            } else if (orient.medecinType === "hopital") {
              labels.push("Médecin Hôpital");
            } else {
              labels.push("Médecin");
            }
          }
          if (orient.callCentre) labels.push("Call Centre");
          return labels;
        })(),
      };
    });
  }, [dbState.patients, dbState.rendezVous, dbState.fileAttente, dbState.fileAttenteIMC]);
    // Options uniques pour le dropdown 1ère Consultation (avec comptage)
  const consultDateOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    patientsWithDetails.forEach((d) => {
      const date = d.firstConsultDate;
      if (date) counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ value: date, label: `${date} (${count})` }));
  }, [patientsWithDetails]);

  // Options uniques pour le dropdown Orientation (avec comptage)
  const orientationOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    patientsWithDetails.forEach((d) => {
      d.orientationLabels?.forEach((label: string) => {
        counts[label] = (counts[label] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ value: label, label: `${label} (${count})` }));
  }, [patientsWithDetails]);

  // Unified filter checking logic with optional exclusion parameter
  const checkMatchesPat = React.useCallback(
    (item: any, excludeKey?: string) => {
      // Filtre global de recherche rapide
      if (excludeKey !== "searchTerm" && searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          item.p.Nom_Patient.toLowerCase().includes(q) ||
          (item.p.phone && item.p.phone.includes(searchTerm)) ||
          (item.p.city && item.p.city.toLowerCase().includes(q)) ||
          item.arrBioArb.includes(q) ||
          (item.p.type_patient &&
            item.p.type_patient.toLowerCase().includes(q)) ||
          (item.p.wilaya && item.p.wilaya.toLowerCase().includes(q)) ||
          (item.firstConsultDate || "").toLowerCase().includes(q) ||
          (item.orientationLabels || []).join(" ").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 1. Filtre Nom Patient (Non Uniforme)
      if (
        excludeKey !== "patientName" &&
        filterPatientName &&
        !item.p.Nom_Patient.toLowerCase().includes(
          filterPatientName.toLowerCase(),
        )
      ) {
        return false;
      }

      // 2. Filtre Nom Arabe (Non Uniforme)
      if (excludeKey !== "patientArb" && filterPatientArb) {
        if (!item.arrBioArb.includes(filterPatientArb.toLowerCase())) {
          return false;
        }
      }

      // 3. Filtre Âge (Uniforme)
      if (
        excludeKey !== "age" &&
        filterPatientAge.length > 0 &&
        !filterPatientAge.includes(item.patAge)
      ) {
        return false;
      }

      // 4. Filtre Type Patient (Uniforme)
      if (
        excludeKey !== "typePat" &&
        filterTypePat.length > 0 &&
        !filterTypePat.includes(item.p.type_patient || "")
      ) {
        return false;
      }

      // 5. Filtre Téléphone (Non Uniforme)
      if (
        excludeKey !== "phone" &&
        filterPhoneInput &&
        (!item.p.phone || !item.p.phone.includes(filterPhoneInput))
      ) {
        return false;
      }

      // 6. Filtre Wilaya (Uniforme)
      if (
        excludeKey !== "wilaya" &&
        filterWilaya.length > 0 &&
        !filterWilaya.includes(item.p.wilaya || "")
      ) {
        return false;
      }

      // 7. Filtre Nbre Abonnement (Uniforme)
      if (
        excludeKey !== "nbreAbn" &&
        filterNbreAbn.length > 0 &&
        !filterNbreAbn.includes(item.nbreAbn)
      ) {
        return false;
      }

      // 8. Filtre Affectation (Uniforme)
      if (
        excludeKey !== "affectation" &&
        filterAffectation.length > 0 &&
        !filterAffectation.includes(item.patAffectation)
      ) {
        return false;
      }

      // 9. Filtre 1ère Consult Date (multi-sélection checkboxes)
      if (
        excludeKey !== "firstConsultDate" &&
        filterFirstConsultDate.length > 0 &&
        !filterFirstConsultDate.includes(item.firstConsultDate || "")
      ) {
        return false;
      }

      // 10. Filtre Orientation (multi-sélection checkboxes)
      if (
        excludeKey !== "orientation" &&
        filterOrientation.length > 0 &&
        !filterOrientation.some((val) => (item.orientationLabels || []).includes(val))
      ) {
        return false;
      }

      return true;
    },
    [
      searchTerm,
      filterPatientName,
      filterPatientArb,
      filterPatientAge,
      filterTypePat,
      filterPhoneInput,
      filterWilaya,
      filterNbreAbn,
      filterAffectation,
      filterFirstConsultDate,
      filterOrientation,
    ],
  );

  const filteredPatients = React.useMemo(() => {
    return patientsWithDetails
      .filter((item) => checkMatchesPat(item))
      .map((item) => item.p);
  }, [patientsWithDetails, checkMatchesPat]);

  // Reset page relativement aux filtres
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterPatientName,
    filterPatientArb,
    filterPatientAge,
    filterTypePat,
    filterPhoneInput,
    filterWilaya,
    filterNbreAbn,
    filterAffectation,
    filterFirstConsultDate,
    filterOrientation,
  ]);

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  React.useEffect(() => {
    if (searchTerm) {
      setActiveRowIndex(paginatedPatients.length > 0 ? 0 : -1);
    } else {
      setActiveRowIndex(-1);
    }
  }, [searchTerm, paginatedPatients]);

  const versementModal = (
    <AnimatePresence>
      {activeVersementAbnId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-3xl w-full border border-slate-150 shadow-2xl overflow-y-auto max-h-[92vh] font-sans text-xs text-slate-800 transition-all duration-300 ${
              createdVersement ? "max-w-2xl" : "max-w-md"
            }`}
          >
            {createdVersement ? (
              <div className="p-6 space-y-6">
                {/* Reçu de paiement style Word officiel */}
                <div
                  className="border-[3px] border-double border-slate-900 p-6 bg-white space-y-5 relative overflow-hidden text-left"
                  id="print-receipt-word-container"
                  style={{ minHeight: "400px" }}
                >
                  {/* Filigrane discret d'authenticité */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02] z-0">
                    <span className="text-[60px] font-black tracking-widest uppercase rotate-12 text-slate-900">
                      KACEL SANTÉ
                    </span>
                  </div>

                  {/* Section En-tête : Clinique vs Reçu Info */}
                  <div className="grid grid-cols-12 gap-3 border-b pb-4 border-slate-300 relative z-10">
                    {/* Infos Clinique */}
                    <div className="col-span-7 flex items-start gap-2.5">
                      <KacelLogoSVG className="w-[46.5px] h-[46.5px] flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-900 tracking-tight block uppercase">
                          Etablissement KACEL Santé
                        </span>
                        <div className="text-[8.5px] font-black text-indigo-950 uppercase leading-tight">
                          Centre de Médecine physique et de Réadaptation
                          Fonctionnelle
                        </div>
                        <p className="text-[8px] text-slate-500 leading-normal font-semibold">
                          Cité du 01 Novembre, Ouled-Moussa, BOUMERDES
                          <br />
                          Tél : 024 72 59 96 / 0561 39 07 90
                        </p>
                      </div>
                    </div>

                    {/* Titre & Metadonnées Reçu */}
                    <div className="col-span-5 border-l border-slate-200 pl-4 space-y-2">
                      <div className="border-[2px] border-double border-slate-800 bg-slate-50 p-2 text-center">
                        <h4 className="font-sans font-black text-slate-905 text-[11px] tracking-wider uppercase">
                          REÇU DE PAIEMENT
                        </h4>
                        <div className="text-[8.5px] font-mono mt-0.5 space-y-0.5 text-slate-700 text-left font-bold border-t border-slate-200 pt-1">
                          <div>
                            N° REÇU: #REC-2026-
                            {String(createdVersement.ID_Vers).padStart(4, "0")}
                          </div>
                          <div>Abonnement: {createdVersement.referenceAbn}</div>
                          <div>
                            Transaction ID: #TRA_{createdVersement.ID_Trans}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Core Receipt Text Content */}
                  <div className="relative z-10 grid grid-cols-2 gap-x-6 gap-y-3.5 text-[10px] text-slate-800 border-b pb-4 border-slate-200">
                    {/* Left Column: Patient info & Duration */}
                    <div className="space-y-2 border-r pr-6 border-slate-150">
                      <div>
                        <span className="text-slate-550 font-bold block text-[9px] uppercase">
                          Nom :
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">
                          {(() => {
                            const pName = createdVersement.patientName || "";
                            const parts = pName.trim().split(" ");
                            return parts[0]?.toUpperCase() || "-";
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-550 font-bold block text-[9px] uppercase">
                          Prénom :
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs tracking-wide">
                          {(() => {
                            const pName = createdVersement.patientName || "";
                            const parts = pName.trim().split(" ");
                            return parts.slice(1).join(" ") || "-";
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-550 font-bold block text-[9px] uppercase">
                          Nombre de séances / Mois :
                        </span>
                        <span className="font-extrabold text-slate-900 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[9.5px]">
                          {createdVersement.packLabel}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-550 font-bold block text-[9px] uppercase">
                          Durée du programme :
                        </span>
                        <span className="font-extrabold text-indigo-900 font-mono">
                          {createdVersement.duration || "1 mois"}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Financial Figures */}
                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-550 font-sans font-bold text-[9px] uppercase">
                          Montant total des séances :
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatDA(createdVersement.packPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-550 font-sans font-bold text-[9px] uppercase">
                          Remise :
                        </span>
                        <span className="font-semibold text-rose-700">
                          -{formatDA(createdVersement.remise || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 bg-slate-50 px-1.5 rounded">
                        <span className="text-slate-650 font-sans font-extrabold text-[9px] uppercase">
                          Montant à payer :
                        </span>
                        <span className="font-black text-[#102e3b]">
                          {formatDA(
                            createdVersement.packPrice -
                              (createdVersement.remise || 0),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 bg-emerald-50/50 px-1.5 rounded">
                        <span className="text-slate-650 font-sans font-extrabold text-[9px] uppercase">
                          Versé ce jour :
                        </span>
                        <span className="font-black text-emerald-800">
                          +{formatDA(createdVersement.Mont_Vers)}
                        </span>
                      </div>
                      {createdVersement.totalPaidSoFar >
                        createdVersement.Mont_Vers && (
                        <div className="flex justify-between items-center py-0.5 text-[8.5px] border-b border-slate-100 text-slate-500 pl-1.5">
                          <span>Total cumulé versé :</span>
                          <span>
                            {formatDA(createdVersement.totalPaidSoFar)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1 bg-amber-50/30 px-1.5 rounded">
                        <span className="text-slate-650 font-sans font-extrabold text-[9px] uppercase">
                          Reste :
                        </span>
                        <span className="font-black text-rose-600">
                          {formatDA(
                            Math.max(
                              0,
                              createdVersement.packPrice -
                                (createdVersement.remise || 0) -
                                createdVersement.totalPaidSoFar,
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates Grid block */}
                  <div className="relative z-10 grid grid-cols-4 gap-2 text-center text-[9px] border-b pb-4 border-slate-200">
                    <div className="bg-slate-50 outline-dotted outline-1 outline-slate-350 p-1.5 rounded">
                      <span className="text-slate-450 block text-[7.5px] uppercase font-bold mb-0.5">
                        Date d'abonnement
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {formatAlgerianDate(createdVersement.dateAbn)}
                      </strong>
                    </div>
                    <div className="bg-slate-50 outline-dotted outline-1 outline-slate-350 p-1.5 rounded">
                      <span className="text-slate-450 block text-[7.5px] uppercase font-bold mb-0.5">
                        Date du versement
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {formatAlgerianDate(createdVersement.Date_Vers)}
                      </strong>
                    </div>
                    <div className="bg-slate-50 outline-dotted outline-1 outline-slate-350 p-1.5 rounded">
                      <span className="text-slate-450 block text-[7.5px] uppercase font-bold mb-0.5">
                        Début séances
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {formatAlgerianDate(createdVersement.dateDebutAbn)}
                      </strong>
                    </div>
                    <div className="bg-slate-50 outline-dotted outline-1 outline-slate-350 p-1.5 rounded">
                      <span className="text-slate-450 block text-[7.5px] uppercase font-bold mb-0.5">
                        Fin séances
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {formatAlgerianDate(createdVersement.dateFinAbn)}
                      </strong>
                    </div>
                  </div>

                  {/* Commitment / Disclaimers Bilingual Block */}
                  <div className="relative z-10 grid grid-cols-2 gap-4 text-[7.5px] leading-[1.3] text-slate-750 bg-slate-50/40 border border-slate-200 p-2.5 rounded-lg">
                    {/* French copy */}
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-900 border-b pb-0.5 border-slate-200 uppercase tracking-wider text-[8px]">
                        Engagement
                      </h5>
                      <ul className="list-disc pl-3.5 space-y-1">
                        <li>
                          Le montant encaissé ne sera en aucun cas remboursé ni
                          partiellement ni totalement ;
                        </li>
                        <li>
                          Le patient détenteur de séances restantes et ayant
                          terminé son traitement, ne pourra en aucun cas les
                          céder à un autre patient ;
                        </li>
                        <li>
                          En cas d’absence sans avoir à fournir un motif
                          médical, la séance sera comptabilisée ;
                        </li>
                        <li>
                          Le patient ayant enregistré six (06) absences
                          consécutives sera systématiquement radié de nos
                          listes, un nouvel enregistrement est nécessaire pour
                          une reprise ;
                        </li>
                        <li>
                          Le patient ayant enregistré quinze (15) absences,
                          repartie sur l’ensemble de la durée du traitement sera
                          systématiquement radié de nos listes.
                        </li>
                      </ul>
                    </div>

                    {/* Arabic copy */}
                    <div className="space-y-1 text-right" dir="rtl">
                      <h5 className="font-extrabold text-slate-900 border-b pb-0.5 border-slate-200 text-[8.5px] font-sans">
                        تـــــــعهد
                      </h5>
                      <ul className="list-disc pr-3.5 space-y-1 font-sans text-[7.5px]">
                        <li>
                          لــن يتم استرداد المبلغ المدفوع بأي حال من الأحوال،
                          سواء جزئيًا أو كليًا؛
                        </li>
                        <li>
                          لا يـــتم تحت اي ظرف إعطاء حصص المريض الذي استكمل
                          العلاج لمريض اخر؛
                        </li>
                        <li>
                          في حــالة الغياب بدون تقديم عذر طبي سيتم تلقائيا
                          احتساب الجلسة على المريض؛
                        </li>
                        <li>
                          في حــالة غياب 6 أيام متواصلة او أكثر يتم حذف اسم
                          المريض من قوائم العلاج مما يستلزم إعادة التسجيل؛
                        </li>
                        <li>
                          في حــالة غياب 15 يوم متفرقة مهما كانت مدة العلاج يتم
                          حذف اسم المريض من قوائم العلاج.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Somme en toutes lettres */}
                  <div className="relative z-10 bg-slate-100/50 border border-dashed border-slate-300 p-2 rounded text-[9px] text-center font-bold">
                    La somme de :{" "}
                    <span className="font-black font-mono text-[#102e3b] uppercase">
                      {numberToFrenchWords(createdVersement.Mont_Vers)} DINARS
                      ALGÉRIENS ({createdVersement.paymentMode})
                    </span>
                  </div>

                  {/* Zones de signatures */}
                  <div className="grid grid-cols-2 gap-4 pt-4 text-[9px] relative z-10 border-t border-slate-200">
                    <div className="text-center space-y-1.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider block">
                        Lu et Approuvé
                      </span>
                      <p className="text-[7.5px] text-slate-500 italic">
                        J'ai pris connaissance des termes du présent engagement
                      </p>
                      <div className="h-10"></div>
                      <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
                    </div>
                    <div className="text-center space-y-1.5 border-l border-slate-150 font-sans">
                      <span className="font-bold text-slate-800 uppercase tracking-wider block">
                        L'Établissement
                      </span>
                      <p className="text-[7.5px] text-slate-500 italic">
                        Pour cachet et signature officielle
                      </p>
                      <div className="h-10"></div>
                      <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'impressions / actions */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Impresison isolée et parfaite du reçu de paiement
                      const printContents = document.getElementById(
                        "print-receipt-word-container",
                      )?.innerHTML;
                      if (!printContents) return;

                      const iframe = document.createElement("iframe");
                      iframe.style.position = "fixed";
                      iframe.style.bottom = "0";
                      iframe.style.right = "0";
                      iframe.style.width = "0";
                      iframe.style.height = "0";
                      iframe.style.border = "0";
                      document.body.appendChild(iframe);

                      const doc =
                        iframe.contentWindow?.document ||
                        iframe.contentDocument;
                      if (doc) {
                        doc.open();
                        doc.write(`
                          <html>
                            <head>
                              <title>Reçu de Paiement</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@405;500;600;700;850;900&display=swap');
                                @media print {
                                  body {
                                    margin: 0;
                                    padding: 10px;
                                  }
                                }
                                body {
                                  font-family: 'Inter', sans-serif;
                                  color: #0c111d;
                                  background-color: #ffffff;
                                  margin: 0;
                                  padding: 30.5px;
                                  -webkit-print-color-adjust: exact;
                                  print-color-adjust: exact;
                                  font-size: 11px;
                                }
                                .container {
                                  border: 2px solid #000000;
                                  padding: 24.5px;
                                  background-color: #ffffff;
                                  position: relative;
                                }
                                .watermark {
                                  position: absolute;
                                  top: 50%;
                                  left: 50%;
                                  transform: translate(-50%, -50%) rotate(-25deg);
                                  font-size: 55px;
                                  font-weight: 900;
                                  color: rgba(220, 225, 230, 0.40);
                                  letter-spacing: 4px;
                                  pointer-events: none;
                                  z-index: 0;
                                }
                                .header-table {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin-bottom: 22px;
                                  border-bottom: 1px solid #000;
                                  padding-bottom: 12px;
                                }
                                .header-left {
                                  width: 60%;
                                  vertical-align: top;
                                }
                                .header-right {
                                  width: 40%;
                                  vertical-align: top;
                                  padding-left: 15px;
                                }
                                .title-clinic {
                                  font-size: 14.5px;
                                  font-weight: 900;
                                  margin: 0 0 3px 0;
                                  text-transform: uppercase;
                                  color: #111;
                                }
                                .sub-title-clinic {
                                  font-size: 11px;
                                  font-weight: 800;
                                  color: #333;
                                  margin: 0 0 6px 0;
                                  text-transform: uppercase;
                                }
                                .clinic-info {
                                  font-size: 9.5px;
                                  color: #555;
                                  line-height: 1.4;
                                  margin: 0;
                                }
                                .meta-box {
                                  border: 2px double #000;
                                  padding: 10px;
                                  background-color: #fafafa;
                                  text-align: center;
                                }
                                .meta-title {
                                  font-size: 12.5px;
                                  font-weight: 900;
                                  margin: 0 0 5px 0;
                                  text-transform: uppercase;
                                }
                                .meta-line {
                                  font-family: monospace;
                                  font-size: 10.5px;
                                  margin: 2px 0;
                                  font-weight: bold;
                                }
                                .section-header {
                                  font-size: 11px;
                                  font-weight: 900;
                                  border-bottom: 1.5px solid #000;
                                  padding-bottom: 3.5px;
                                  margin: 20px 0 8px 0;
                                  text-transform: uppercase;
                                  letter-spacing: 0.5px;
                                }
                                .patient-card {
                                  border: 1px solid #999;
                                  background-color: #fafafa;
                                  padding: 10px 14.5px;
                                  font-size: 11px;
                                  line-height: 1.5;
                                }
                                .pat-row {
                                  display: flex;
                                  justify-content: space-between;
                                  margin-bottom: 2.5px;
                                }
                                .pat-key {
                                  color: #555;
                                  font-weight: bold;
                                  font-size: 9.5px;
                                }
                                .pat-val {
                                  color: #000;
                                  font-weight: 800;
                                }
                                .finances-tbl {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin: 12px 0;
                                }
                                .finances-tbl th {
                                  border: 1.5px solid #000;
                                  background-color: #eaeaea;
                                  padding: 7px 9px;
                                  font-size: 10px;
                                  font-weight: 950;
                                  text-transform: uppercase;
                                  text-align: center;
                                }
                                .finances-tbl td {
                                  border: 1px solid #000;
                                  padding: 8.5px 9px;
                                  font-size: 10.5px;
                                  text-align: center;
                                  font-weight: bold;
                                }
                                .summary-box {
                                  font-size: 11px;
                                  font-style: italic;
                                  line-height: 1.45;
                                  border: 1.5px dashed #000;
                                  padding: 9px 14px;
                                  background-color: #ffffff;
                                  margin-top: 15px;
                                }
                                .footer-signs {
                                  margin-top: 45px;
                                  display: flex;
                                  justify-content: space-between;
                                }
                                .sign-block {
                                  width: 45%;
                                  text-align: center;
                                }
                                .sign-lbl {
                                  font-weight: 900;
                                  text-transform: uppercase;
                                  text-decoration: underline;
                                  margin-bottom: 40px;
                                  font-size: 10px;
                                }
                                .sign-line {
                                  border-bottom: 1px dotted #555;
                                  width: 75%;
                                  margin: 8px auto;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <div class="watermark">KACEL SANTÉ</div>
                                <table class="header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 22px; border-bottom: 2px solid #000; padding-bottom: 12px;">
                                  <tr>
                                    <!-- logo cell using inline SVG of KACELSANTÉ -->
                                    <td style="width: 65px; vertical-align: top; padding-right: 12px;">
                                      <svg viewBox="0 0 120 120" style="width: 58px; height: 58px;" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="60" cy="60" r="54" fill="#1d2630" stroke="#facc15" stroke-width="3.5" />
                                        <circle cx="60" cy="38" r="7.5" fill="#facc15" />
                                        <path d="M42 42 C45 60, 50 78, 60 84 C56 70, 50 56, 42 42 Z" fill="#facc15" />
                                        <path d="M48 48 C55 35, 70 32, 78 42 C68 46, 58 50, 48 48 Z" fill="#facc15" />
                                        <path d="M48 48 C58 54, 70 66, 75 78 C66 70, 56 60, 48 48 Z" fill="#facc15" />
                                        <text x="60" y="93" fill="#ffffff" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="900" font-size="8" text-anchor="middle" letter-spacing="0.8">KACELSANTÉ</text>
                                        <path d="M35 100 Q47 97, 60 100 T85 100" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" />
                                        <path d="M35 104 Q47 101, 60 104 T85 104" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" />
                                      </svg>
                                    </td>
                                    <td class="header-left" style="vertical-align: top;">
                                      <h1 class="title-clinic" style="font-size: 13.5px; font-weight: 900; margin: 0 0 2px 0; text-transform: uppercase;">Etablissement KACEL Santé</h1>
                                      <div class="sub-title-clinic" style="font-size: 10px; font-weight: 800; color: #1e3a8a; margin: 0 0 4px 0; text-transform: uppercase;">Centre de Médecine physique et de Réadaptation Fonctionnelle</div>
                                      <div class="clinic-info" style="font-size: 9px; color: #4b5563; line-height: 1.4; margin: 0; font-weight: 600;">
                                        <strong>Adresse :</strong> Cité du 01 Novembre, Ouled-Moussa, BOUMERDES<br/>
                                        <strong>Tél :</strong> 024 72 59 96 / 0561 39 07 90
                                      </div>
                                    </td>
                                    <td class="header-right">
                                      <div class="meta-box" style="border: 2px double #000; padding: 8px; background-color: #fafafa; text-align: center;">
                                        <div class="meta-title" style="font-size: 11px; font-weight: 900; margin: 0 0 3px 0; text-transform: uppercase;">REÇU DE PAIEMENT</div>
                                        <div class="meta-line" style="font-family: monospace; font-size: 9.5px; margin: 2px 0; font-weight: bold;">N° REÇU: #REC-2026-\${String(${createdVersement.ID_Vers}).padStart(4, '0')}</div>
                                        <div class="meta-line" style="font-family: monospace; font-size: 9px; margin: 2px 0; font-weight: bold; color: #444;">Abonnement: \${'${createdVersement.referenceAbn}'}</div>
                                        <div class="meta-line" style="font-family: monospace; font-size: 8px; margin: 2px 0; color: #666;">Code Tr: #TRA_\${'${createdVersement.ID_Trans}'}</div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>

                                <!-- Patient & Program grid -->
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
                                  <tr>
                                    <td style="width: 50%; padding-right: 15px; border-right: 1px solid #ddd; vertical-align: top;">
                                      <div style="margin-bottom: 8px;">
                                        <span style="font-size: 8.5px; color: #666; display: block; font-weight: bold; text-transform: uppercase;">Nom :</span>
                                        <span style="font-size: 11px; font-weight: 905; text-transform: uppercase; color: #000;">
                                          \${(() => {
                                            const pName = '${createdVersement.patientName || ""}';
                                            const parts = pName.trim().split(' ');
                                            return parts[0]?.toUpperCase() || '-';
                                          })()}
                                        </span>
                                      </div>
                                      <div style="margin-bottom: 8px;">
                                        <span style="font-size: 8.5px; color: #666; display: block; font-weight: bold; text-transform: uppercase;">Prénom :</span>
                                        <span style="font-size: 11px; font-weight: 905; color: #000;">
                                          \${(() => {
                                            const pName = '${createdVersement.patientName || ""}';
                                            const parts = pName.trim().split(' ');
                                            return parts.slice(1).join(' ') || '-';
                                          })()}
                                        </span>
                                      </div>
                                      <div style="margin-bottom: 8px;">
                                        <span style="font-size: 8.5px; color: #666; display: block; font-weight: bold; text-transform: uppercase;">Nombre de séances / Mois :</span>
                                        <span style="font-size: 10.5px; font-weight: 800; color: #111;">\${'${createdVersement.packLabel}'}</span>
                                      </div>
                                      <div style="margin-bottom: 8px;">
                                        <span style="font-size: 8.5px; color: #666; display: block; font-weight: bold; text-transform: uppercase;">Durée du programme :</span>
                                        <span style="font-size: 10.5px; font-weight: bold; font-family: monospace; color: #1f2937;">\${'${createdVersement.duration || "1 mois"}'}</span>
                                      </div>
                                    </td>
                                    <td style="width: 50%; padding-left: 20px; vertical-align: top; font-family: monospace;">
                                      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                                        <span style="font-family: sans-serif; font-size: 9px; color: #555; text-transform: uppercase;">Montant total des séances :</span>
                                        <span style="font-weight: bold; color: #000;">\${formatDA(${createdVersement.packPrice})}</span>
                                      </div>
                                      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                                        <span style="font-family: sans-serif; font-size: 9px; color: #555; text-transform: uppercase;">Remise :</span>
                                        <span style="font-weight: bold; color: #b91c1c;">-\${formatDA(${createdVersement.remise || 0})}</span>
                                      </div>
                                      <div style="display: flex; justify-content: space-between; padding: 5px 4px; background-color: #fafafa; border-bottom: 1px solid #ddd; margin-top: 1px;">
                                        <span style="font-family: sans-serif; font-size: 9px; font-weight: bold; text-transform: uppercase;">Montant à payer :</span>
                                        <span style="font-weight: 900; font-size: 11px; color: #111;">\${formatDA(${createdVersement.packPrice} - (${createdVersement.remise || 0}))}</span>
                                      </div>
                                      <div style="display: flex; justify-content: space-between; padding: 5px 4px; background-color: #f0fdf4; border-bottom: 1px solid #ccfbf1; margin-top: 1px;">
                                        <span style="font-family: sans-serif; font-size: 9px; font-weight: bold; text-transform: uppercase;">Versé ce jour :</span>
                                        <span style="font-weight: 900; font-size: 11.5px; color: #166534;">+\${formatDA(${createdVersement.Mont_Vers})}</span>
                                      </div>
                                      <div style="display: flex; justify-content: space-between; padding: 5px 4px; background-color: #fffbeb; border-bottom: 1px solid #fef3c7; margin-top: 1px;">
                                        <span style="font-family: sans-serif; font-size: 9px; font-weight: bold; text-transform: uppercase;">Reste :</span>
                                        <span style="font-weight: 900; font-size: 11.5px; color: #b91c1c;">\${formatDA(Math.max(0, (${createdVersement.packPrice} - (${createdVersement.remise || 0})) - ${createdVersement.totalPaidSoFar}))}</span>
                                      </div>
                                    </td>
                                  </tr>
                                </table>

                                <!-- Dates strip -->
                                <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 15px; font-size: 9px;">
                                  <tr>
                                    <td style="width: 25%; padding: 6px; border: 1px dotted #ccc; background-color: #fafafa; border-radius: 4px;">
                                      <span style="font-size: 7.5px; color: #666; text-transform: uppercase; display: block; font-weight: bold; margin-bottom: 2px;">Date d'abonnement</span>
                                      <strong style="color: #000; font-family: monospace;">\${formatAlgerianDate('${createdVersement.dateAbn}')}</strong>
                                    </td>
                                    <td style="width: 25%; padding: 6px; border: 1px dotted #ccc; background-color: #fafafa; border-radius: 4px;">
                                      <span style="font-size: 7.5px; color: #666; text-transform: uppercase; display: block; font-weight: bold; margin-bottom: 2px;">Date du versement</span>
                                      <strong style="color: #000; font-family: monospace;">\${formatAlgerianDate('${createdVersement.Date_Vers}')}</strong>
                                    </td>
                                    <td style="width: 25%; padding: 6px; border: 1px dotted #ccc; background-color: #fafafa; border-radius: 4px;">
                                      <span style="font-size: 7.5px; color: #666; text-transform: uppercase; display: block; font-weight: bold; margin-bottom: 2px;">Début séances</span>
                                      <strong style="color: #000; font-family: monospace;">\${formatAlgerianDate('${createdVersement.dateDebutAbn}')}</strong>
                                    </td>
                                    <td style="width: 25%; padding: 6px; border: 1px dotted #ccc; background-color: #fafafa; border-radius: 4px;">
                                      <span style="font-size: 7.5px; color: #666; text-transform: uppercase; display: block; font-weight: bold; margin-bottom: 2px;">Fin séances</span>
                                      <strong style="color: #000; font-family: monospace;">\${formatAlgerianDate('${createdVersement.dateFinAbn}')}</strong>
                                    </td>
                                  </tr>
                                </table>

                                <!-- Commitment / Disclaimers Bilingual Block -->
                                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; background-color: #fafafa; border-radius: 6px; margin-bottom: 12px; font-size: 8px; line-height: 1.35; color: #333;">
                                  <tr>
                                    <td style="width: 50%; padding: 10px; vertical-align: top; border-right: 1px solid #ddd;">
                                      <h5 style="font-size: 8.5px; font-weight: bold; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; text-transform: uppercase;">Engagement</h5>
                                      <ul style="margin: 0; padding-left: 12px; list-style-type: disc;">
                                        <li style="margin-bottom: 3px;">Le montant encaissé ne sera en aucun cas remboursé ni partiellement ni totalement ;</li>
                                        <li style="margin-bottom: 3px;">Le patient détenteur de séances restantes et ayant terminé son traitement, ne pourra en aucun cas les céder à un autre patient ;</li>
                                        <li style="margin-bottom: 3px;">En cas d’absence sans avoir à fournir un motif médical, la séance sera comptabilisée ;</li>
                                        <li style="margin-bottom: 3px;">Le patient ayant enregistré six (06) absences consécutives sera systématiquement radié de nos listes, un nouvel enregistrement est nécessaire pour une reprise ;</li>
                                        <li style="margin-bottom: 3px;">Le patient ayant enregistré quinze (15) absences, repartie sur l’ensemble de la durée du traitement sera systématiquement radié de nos listes.</li>
                                      </ul>
                                    </td>
                                    <td style="width: 50%; padding: 10px; vertical-align: top; text-align: right;" dir="rtl">
                                      <h5 style="font-size: 9px; font-weight: bold; color: #000; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0;">تـــــــعهد</h5>
                                      <ul style="margin: 0; padding-right: 12px; list-style-type: disc; text-align: right;">
                                        <li style="margin-bottom: 3px;">لــن يتم استرداد المبلغ المدفوع بأي حال من الأحوال، سواء جزئيًا أو كليًا؛</li>
                                        <li style="margin-bottom: 3px;">لا يـــتم تحت اي ظرف إعطاء حصص المريض الذي استكمل العلاج لمريض اخر؛</li>
                                        <li style="margin-bottom: 3px;">في حــالة الغياب بدون تقديم عذر طبي سيتم تلقائيا احتساب الجلسة على المريض؛</li>
                                        <li style="margin-bottom: 3px;">في حــالة غياب 6 أيام متواصلة او أكثر يتم حذف اسم المريض من قوائم العلاج مما يستلزم إعادة التسجيل؛</li>
                                        <li style="margin-bottom: 3px;">في حــالة غياب 15 jour متفرقة مهما كانت مدة العلاج يتم حذف اسم المريض من قوائم العلاج.</li>
                                      </ul>
                                    </td>
                                  </tr>
                                </table>

                                <!-- Summary written amount -->
                                <div style="border: 1px dashed #000; padding: 8px 12px; background-color: #fff; margin-bottom: 15px; font-size: 9.5px; font-weight: bold; text-align: center;">
                                  La somme de : <span style="font-family: monospace; font-size: 11px; text-transform: uppercase;">\${numberToFrenchWords(${createdVersement.Mont_Vers})} DINARS ALGÉRIENS ({createdVersement.paymentMode})</span>
                                </div>

                                <!-- Signatures block -->
                                <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 9.5px;">
                                  <tr>
                                    <td style="width: 50%; text-align: center; vertical-align: top;">
                                      <div style="font-weight: bold; text-transform: uppercase; text-decoration: underline; margin-bottom: 45px;">Lu et Approuvé</div>
                                      <div style="font-size: 8px; color: #666;">(Signature manuscrite du Tuteur/Patient)</div>
                                      <div style="border-bottom: 1px dotted #555; width: 65%; margin: 8px auto;"></div>
                                    </td>
                                    <td style="width: 50%; text-align: center; vertical-align: top; border-left: 1px dotted #ddd;">
                                      <div style="font-weight: bold; text-transform: uppercase; text-decoration: underline; margin-bottom: 45px;">L'Établissement</div>
                                      <div style="font-size: 8px; color: #666;">(Cachet et signature officielle)</div>
                                      <div style="border-bottom: 1px dotted #555; width: 65%; margin: 8px auto;"></div>
                                    </td>
                                  </tr>
                                </table>
                              </div>
                            </body>
                          </html>
                        `);
                        doc.close();

                        // Lancement de l'impression réelle sur l'iframe
                        iframe.focus();
                        setTimeout(() => {
                          iframe.contentWindow?.print();
                          // Suppression de l'iframe du document après utilisation
                          setTimeout(() => {
                            if (document.body.contains(iframe)) {
                              document.body.removeChild(iframe);
                            }
                          }, 1500);
                        }, 250);
                      }

                      triggerToast(
                        "Impression du reçu Word lancée...",
                        "success",
                      );
                    }}
                    className="flex-1 py-3 bg-[#102e3b] hover:bg-[#1f4e61] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer text-center flex items-center justify-center gap-2 select-none active:scale-95"
                  >
                    <span>🖨️ Imprimer Reçu (Format Word Officiel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVersementAbnId(null);
                      setCreatedVersement(null);
                    }}
                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase rounded-2xl border border-slate-200 shadow-sm transition cursor-pointer text-center select-none active:scale-95"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessVersement}>
                <div
                  className="text-white p-5 flex items-center justify-between animate-fade-in"
                  style={{ backgroundColor: "#606C5A" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <div>
                      <h3 className="font-bold text-sm">
                        Enregistrer un Versement
                      </h3>
                      <p className="text-[10px] text-indigo-200">
                        Enregistrer un règlement d'abonnement en caisse.
                      </p>
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

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {(() => {
                    const fresh = { ...dbState };
                    const abnMatch = fresh.abonnements.find(
                      (a) => a.ID_Abn === activeVersementAbnId,
                    );
                    if (!abnMatch) return null;

                    const abnVersements = fresh.versements.filter(
                      (v: any) => v.ID_Abn === activeVersementAbnId,
                    );
                    const totalVerses = abnVersements.reduce(
                      (sum: number, v: any) => sum + v.Mont_Vers,
                      0,
                    );

                    const getPackPrice = (packId: number) => {
                      const foundPack = fresh.packs.find(
                        (p) => p.ID_Pack === packId,
                      );
                      return foundPack?.Prix_Pack ?? 0;
                    };
                    const price = getPackPrice(abnMatch.ID_Pack);
                    const remaining = price - totalVerses;
                    const maxAllowed = Math.max(
                      0,
                      price - (Number(paymentRemise) || 0) - totalVerses,
                    );
                    const pack = fresh.packs.find(
                      (p) => p.ID_Pack === abnMatch.ID_Pack,
                    );

                    return (
                      <div className="space-y-5 text-xs font-semibold">
                        {/* 1. Liste des versements existants (Mode Edition) */}
                        <div className="space-y-2">
                          <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider">
                            Versements Effectués
                          </label>
                          <div className="space-y-1.5 font-mono">
                            {abnVersements.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic py-2 border-t border-slate-100">
                                Aucun versement enregistré.
                              </p>
                            ) : (
                              abnVersements.map((v: any, idx: number) => (
                                <div
                                  key={`p-vers-${v.ID_Vers}-${idx}`}
                                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg group animate-in fade-in duration-100"
                                >
                                  {editingVersementId === v.ID_Vers ? (
                                    <div className="flex gap-1 w-full">
                                      <input
                                        type="number"
                                        autoFocus
                                        value={editingVersementAmount}
                                        onChange={(e) =>
                                          setEditingVersementAmount(
                                            e.target.value,
                                          )
                                        }
                                        className="flex-1 border p-1 rounded font-bold text-indigo-700 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateVersement(v.ID_Vers)
                                        }
                                        className="px-2 py-1 bg-indigo-600 text-white rounded font-bold text-[9px]"
                                      >
                                        Ok
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingVersementId(null)
                                        }
                                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded font-bold text-[9px]"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex flex-col">
                                        <span className="font-extrabold text-[#102e3b]">
                                          {v.Mont_Vers} DA
                                        </span>
                                        <span className="text-[8px] text-slate-400">
                                          {v.Date_Vers}
                                        </span>
                                      </div>
                                      <div className="flex gap-1.5 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePrintVersement(v.ID_Vers)
                                          }
                                          className="p-1 hover:bg-slate-100 rounded border shadow-sm text-indigo-600 border-indigo-100 flex items-center justify-center cursor-pointer"
                                          title="Imprimer le reçu"
                                        >
                                          <Printer className="w-3 h-3" />
                                        </button>
                                        {(currentUser.Role === "Admin" ||
                                          currentUser.Role ===
                                            "Receptionniste RDC") && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingVersementId(
                                                  v.ID_Vers,
                                                );
                                                setEditingVersementAmount(
                                                  v.Mont_Vers.toString(),
                                                );
                                              }}
                                              className="p-1 hover:bg-white rounded border shadow-sm text-blue-600 border-blue-100 flex items-center justify-center cursor-pointer"
                                              title="Modifier"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            {versementToDelete === v.ID_Vers ? (
                                              <div className="flex items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleDeleteVersement(
                                                      v.ID_Vers,
                                                    );
                                                    setVersementToDelete(null);
                                                  }}
                                                  className="bg-rose-600 hover:bg-rose-700 text-white px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer shadow-xs transition animate-pulse"
                                                >
                                                  Confirmer
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setVersementToDelete(null)
                                                  }
                                                  className="bg-slate-200 hover:bg-slate-300 text-slate-805 px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer transition"
                                                >
                                                  Annuler
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setVersementToDelete(
                                                    v.ID_Vers,
                                                  )
                                                }
                                                className="p-1 hover:bg-rose-50 text-rose-500 rounded border border-rose-100 shadow-sm flex items-center justify-center cursor-pointer"
                                                title="Supprimer"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </>
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
                          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                            Abonnement Référent :
                          </p>
                          <div className="flex justify-between items-center text-slate-800">
                            <span>
                              Forfait :{" "}
                              <strong>
                                {pack?.Libelle_Pack || "Pack de Soins"}
                              </strong>
                            </span>
                            <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black">
                              ABN_#0{abnMatch.ID_Abn}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 text-[10px]">
                            <div className="bg-white border rounded p-1.5">
                              <span className="text-[8px] text-slate-400 block uppercase">
                                Prix Total
                              </span>
                              <strong className="font-mono text-slate-900">
                                {price} DA
                              </strong>
                            </div>
                            <div className="bg-white border rounded p-1.5">
                              <span className="text-[8px] text-slate-400 block uppercase">
                                Déjà Versé
                              </span>
                              <strong className="font-mono text-emerald-800">
                                +{totalVerses} DA
                              </strong>
                            </div>
                            <div className="bg-white border rounded p-1.5">
                              <span className="text-[8px] text-slate-400 block uppercase">
                                Reste
                              </span>
                              <strong className="font-mono text-rose-600 font-black">
                                {remaining} DA
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <p className="text-slate-700 font-black text-[10px] uppercase tracking-wider mb-2">
                            ➕ Ajouter un nouveau Versement
                          </p>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1 text-left">
                                <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider">
                                  Montant à Encaisser (DA)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  max={maxAllowed}
                                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  value={paymentAmount}
                                  onChange={(e) =>
                                    setPaymentAmount(e.target.value)
                                  }
                                  placeholder="Montant..."
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider">
                                  Mode de Règlement
                                </label>
                                <select
                                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  value={paymentMode}
                                  onChange={(e) =>
                                    setPaymentMode(e.target.value)
                                  }
                                >
                                  <option value="Espèces">Espèces</option>
                                  <option value="CCP / Dahabia">CCP / Dahabia</option>
                                  <option value="Chèque">Chèque</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1 text-left">
                                <label className="block text-slate-700 font-black text-[9px] uppercase tracking-wider">
                                  Remise Accordée (DA)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={price - totalVerses}
                                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  value={paymentRemise}
                                  onChange={(e) =>
                                    setPaymentRemise(e.target.value)
                                  }
                                  placeholder="Ex: 10000"
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[#102e3b] font-black text-[9px] uppercase tracking-wider">
                                  Durée du programme
                                </label>
                                <input
                                  type="text"
                                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  value={paymentDuration}
                                  onChange={(e) =>
                                    setPaymentDuration(e.target.value)
                                  }
                                  placeholder="Ex: 1 mois"
                                />
                              </div>
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
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl transition cursor-pointer text-slate-700"
                  >
                    Annuler
                  </button>
                  {currentUser.Role === "Admin" ? (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md cursor-pointer"
                    >
                      ✓ Enregistrer le Versement
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2 bg-slate-300 text-slate-500 rounded-xl transition cursor-not-allowed"
                    >
                      🔒 Enregistrement Réservé à l'Admin
                    </button>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const editAbonnementModal = (
    <AnimatePresence>
      {editingAbonnement !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden font-sans text-xs text-slate-800 animate-fade-in"
          >
            {/* Header peign en #606C5A */}
            <div
              className="text-white p-5 flex justify-between items-center shrink-0"
              style={{ backgroundColor: "#606C5A" }}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-white animate-pulse" />
                <div>
                  <h3 className="font-sans font-bold text-sm text-white">
                    Modifier l'Abonnement #0{editingAbonnement.ID_Abn}
                  </h3>
                  <p className="text-[10px] text-slate-200 font-medium">
                    Modifications réservées exclusivement à l'Admin et à
                    l'Assistante
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAbonnement(null)}
                className="p-1 px-2 text-white hover:text-red-300 font-extrabold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3.5">
                {/* 1. Sélection du Pack */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Pack Thérapeutique
                  </label>
                  <select
                    className="w-full border border-slate-350 rounded-lg p-2 bg-white font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    value={editAbnPackId}
                    onChange={(e) => setEditAbnPackId(Number(e.target.value))}
                  >
                    {dbState.packs?.map((p) => (
                      <option key={p.ID_Pack} value={p.ID_Pack}>
                        {p.Libelle_Pack} ({p.Nbre_Seance_Pack} séances)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Date de l'Abonnement (Création) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Date de l'Abonnement (Création)
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-350 rounded-lg p-2 font-semibold bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    value={editAbnDateAbn}
                    onChange={(e) => setEditAbnDateAbn(e.target.value)}
                  />
                </div>

                {/* 3. Dates de Début & Fin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Date de Début
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-350 rounded-lg p-2 font-semibold bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      value={editAbnStartDate}
                      onChange={(e) => setEditAbnStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Date de Fin
                    </label>
                    <input
                      type="date"
                      className="w-full border border-slate-350 rounded-lg p-2 font-semibold bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      value={editAbnEndDate}
                      onChange={(e) => setEditAbnEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. Nombre de Séances Consommées et État */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Séances Consommées
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-350 rounded-lg p-2 font-mono font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      value={editAbnConsumed}
                      onChange={(e) =>
                        setEditAbnConsumed(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      État de l'Abonnement
                    </label>
                    <select
                      className="w-full border border-slate-350 rounded-lg p-2 bg-white font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      value={editAbnEtat}
                      onChange={(e) =>
                        setEditAbnEtat(e.target.value as "Actif" | "Fermé" | "Gelé")
                      }
                    >
                      <option value="Actif">Actif</option>
                      <option value="Fermé">Fermé (Archivé)</option>
                      <option value="Gelé">Gelé (Inactif/Non payé)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Actes Optionnels */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Acte Optionnel 1
                    </label>
                    <select
                      className="w-full border border-slate-350 rounded-lg p-2 bg-white font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      value={editAbnAdd1}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditAbnAdd1(val);
                        if (val !== "none" && val === editAbnAdd2) {
                          setEditAbnAdd2("none");
                          triggerToast(
                            "Les deux actes optionnels ne peuvent pas être identiques !",
                            "warning",
                          );
                        }
                      }}
                    >
                      <option value="none">Aucun</option>
                      {getFilteredActesForRole(
                        dbState.actes,
                        currentUser?.Role || "Admin",
                      )
                        .filter(
                          (act) =>
                            ![
                              "Consultation Adulte",
                              "Consultation Enfant",
                              "Contrôle",
                              "Intensif",
                            ].includes(act.Libelle_Acte),
                        )
                        .map((act) => (
                          <option key={act.ID_Acte} value={act.ID_Acte}>
                            {act.Libelle_Acte}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Acte Optionnel 2
                    </label>
                    <select
                      className="w-full border border-slate-350 rounded-lg p-2 bg-white font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                      value={editAbnAdd2}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditAbnAdd2(val);
                        if (val !== "none" && val === editAbnAdd1) {
                          setEditAbnAdd1("none");
                          triggerToast(
                            "Les deux actes optionnels ne peuvent pas être identiques !",
                            "warning",
                          );
                        }
                      }}
                    >
                      <option value="none">Aucun</option>
                      {getFilteredActesForRole(
                        dbState.actes,
                        currentUser?.Role || "Admin",
                      )
                        .filter(
                          (act) =>
                            ![
                              "Consultation Adulte",
                              "Consultation Enfant",
                              "Contrôle",
                              "Intensif",
                            ].includes(act.Libelle_Acte),
                        )
                        .map((act) => (
                          <option key={act.ID_Acte} value={act.ID_Acte}>
                            {act.Libelle_Acte}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pied de page du modal */}
              <div className="border-t pt-4 flex gap-3 justify-end text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditingAbonnement(null)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-xl transition cursor-pointer text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedAbn}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾 Enregistrer les modifications</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (selectedPatient) {
    const detailPatient = patientsWithDetails.find(
      (dp) => Number(dp.ID_Patient) === Number(selectedPatient.ID_Patient)
    );
    const selPat = {
      ...selectedPatient,
      firstConsultDate:
        (selectedPatient as any).firstConsultDate ??
        detailPatient?.firstConsultDate ??
        null,
      orientationLabels:
        (selectedPatient as any).orientationLabels ??
        detailPatient?.orientationLabels ??
        [],
    };
    const isAdminOrReceptionistRDC =
      currentUser.Role === "Admin" || currentUser.Role === "Receptionniste RDC" || currentUser.Role === "SupperRec";
    const canEditMedical = currentUser.Role === "Médecin MPR";

    return (
      <div className="space-y-6" id="patient-fiche-detail-viewport">
        {/* Navigation / Return bar back to list inside the Main Viewport */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClosePatientFiche}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-850 text-[10px] font-bold rounded-xl transition border border-slate-300 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Retour</span>
            </button>
            <div>
              <h2 className="font-bold text-[8px] text-slate-500 uppercase tracking-widest font-sans">
                Fiche Patient
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-extrabold text-[#102e3b] text-xs sm:text-sm">
                  {selectedPatient.Nom_Patient}
                </span>
                {(selectedPatient.Pren_Pat_Arb ||
                  selectedPatient.Nom_Pat_Arb) && (
                  <span
                    className="text-[10px] text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded font-black border border-emerald-100"
                    dir="rtl"
                  >
                    {selectedPatient.Pren_Pat_Arb} {selectedPatient.Nom_Pat_Arb}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-72">
            <PatientSearchCombobox
              patients={dbState.patients || []}
              onSelect={(patient) => setSelectedPatient(patient)}
              placeholder="Rechercher / Basculer de patient..."
            />
          </div>
        </div>

        {/* The Beautiful Full-Width Patient Folder directly in Viewport */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
          {/* Patient Profile / Medical-Admin Banner with premium styling */}
          <div
            className={`p-4 sm:p-5 border-b transition-all duration-300 ${
              isAdminOrReceptionistRDC
                ? "bg-linear-to-br from-[#709CA7]/8 to-slate-100/50"
                : "bg-linear-to-br from-indigo-50/20 via-slate-50/80 to-slate-100/30"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/55">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-slate-100/90 backdrop-blur-xs text-slate-800 text-[9.5px] font-extrabold uppercase tracking-wider rounded-md border border-slate-250/70 font-mono">
                  Code: PAT_#0{selectedPatient.ID_Patient}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-500 font-sans tracking-wide">
                    {isAdminOrReceptionistRDC
                      ? "✍️ Édition"
                      : "🔒 Consultation"}
                  </span>
                </div>
              </div>

              {/* Patient Category Badge strictly matching requested colors */}
              <div className="flex items-center gap-2">
                {selectedPatient.type_patient === "Adulte" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#709CA7]/15 text-[#2B4B52] border border-[#709CA7]/40 rounded-full text-xs font-bold leading-none animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-[#709CA7]"></span>
                    <span>Adulte</span>
                  </span>
                )}
                {selectedPatient.type_patient === "Enfant IMC" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B8CBD0]/20 text-[#3F5054] border border-[#B8CBD0]/50 rounded-full text-xs font-bold leading-none animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-[#B8CBD0]"></span>
                    <span>Enfant IMC</span>
                  </span>
                )}
                {selectedPatient.type_patient === "Enfant" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7A90A4]/15 text-[#243545] border border-[#7A90A4]/40 rounded-full text-xs font-bold leading-none animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-[#7A90A4]"></span>
                    <span>Enfant</span>
                  </span>
                )}
                {canEditMedical && (
                  <button
                    type="button"
                    onClick={() => exportToWord(selectedPatient)}
                    className="bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-600 rounded-xl px-3 py-2 flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-xs font-bold"
                    title="Exporter la fiche kinésithérapique complète pour Microsoft Word"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Word</span>
                  </button>
                )}
              </div>
            </div>

            {/* Resizable Two-Column Split Layout */}
            <div className="flex flex-col md:flex-row items-stretch gap-0 border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-xs relative">
              {/* Partie GAUCHE: Identité & État Civil */}
              <div
                style={{ width: `${upperSplitRatio}%` }}
                className="w-full md:min-w-[25%] p-5 border-b md:border-b-0 md:border-r border-slate-200 bg-white space-y-4"
              >
                <div className="border-b border-slate-100 pb-2 mb-1">
                  <h4 className="text-[11px] font-extrabold text-[#2B4B52] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-505 text-emerald-600" />
                    <span>Identité &amp; État Civil</span>
                  </h4>
                </div>

                {isAdminOrReceptionistRDC ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                        Nom complet (Français)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none animate-none"
                        value={editNom}
                        onChange={(e) => setEditNom(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Nom (Arabe)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold text-right transition rounded-none animate-none"
                          value={editNomArb}
                          onChange={(e) => setEditNomArb(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Prénom (Arabe)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold text-right transition rounded-none animate-none"
                          value={editPrenomArb}
                          onChange={(e) => setEditPrenomArb(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!editNom.trim()) return;
                          const res = translateNameToArabic(editNom);
                          setEditNomArb(res.Nom_Pat_Arb);
                          setEditPrenomArb(res.Pren_Pat_Arb);
                          triggerToast("Champs arabe mis à jour", "success");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#2B4B52] rounded-lg font-bold text-[9px] transition cursor-pointer shadow-xs border border-teal-200 uppercase tracking-widest font-mono"
                      >
                        🌐 Traduire en arabe
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Date de Naissance :
                        </label>
                        <input
                          type="date"
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold font-mono transition rounded-none animate-none"
                          value={editDateNais}
                          onChange={(e) => {
                            setEditDateNais(e.target.value);
                            if (e.target.value) {
                              setEditAge(calculateAge(e.target.value));
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Âge (ans) :
                        </label>
                        <input
                          type="number"
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold font-mono transition rounded-none animate-none"
                          value={editAge}
                          onChange={(e) =>
                            setEditAge(Number(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Genre / Sexe :
                        </label>
                        <select
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none cursor-pointer appearance-none animate-none"
                          value={editGenre}
                          onChange={(e) => {
                            const nextGenre = e.target.value as
                              | "Homme"
                              | "Femme"
                              | "Enfant";
                            setEditGenre(nextGenre);
                          }}
                        >
                          <option value="Homme">Homme</option>
                          <option value="Femme">Femme</option>
                          <option value="Enfant">Enfant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Type Patient :
                        </label>
                        <div className="flex gap-2">
                          <select
                            className="flex-1 bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none cursor-pointer appearance-none animate-none"
                            value={editTypePat}
                            onChange={(e) => setEditTypePat(e.target.value)}
                          >
                            {(dbState.typesPatients || [
                              'Adulte',
                              'Enfant',
                              'Enfant IMC'
                            ]).map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddPatientType}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-xs"
                            title="Ajouter un type"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {editTypePat === "Enfant IMC" && (
                      <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl space-y-1 animate-fade-in mt-2">
                        <label className="block text-[10px] uppercase font-black text-amber-800 tracking-widest mb-1">
                          Pseudo (Dédié Enfant IMC) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="EX: Petit Lion"
                          className="w-full bg-transparent border-0 border-b border-amber-250 focus:border-amber-550 focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none animate-none"
                          value={editPseudo}
                          onChange={(e) => setEditPseudo(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Reading state Left side
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#606C5A] to-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-md border border-white/20">
                        {selectedPatient.Nom_Patient?.charAt(0).toUpperCase() ||
                          "P"}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black font-mono">
                          Nom complet
                        </span>
                        <h3 className="text-sm font-black text-slate-900">
                          {selectedPatient.Nom_Patient}
                        </h3>
                      </div>
                    </div>

                    {(selectedPatient.Pren_Pat_Arb ||
                      selectedPatient.Nom_Pat_Arb) && (
                      <div
                        className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-right animate-fade-in"
                        dir="rtl"
                      >
                        <span
                          className="text-[10px] uppercase font-bold text-emerald-600 block mb-0.5"
                          dir="ltr"
                        >
                          Nom Arabe
                        </span>
                        <span className="text-xs font-black text-emerald-950">
                          {selectedPatient.Pren_Pat_Arb}{" "}
                          {selectedPatient.Nom_Pat_Arb}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                          Genre / Sexe
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {selectedPatient.Genre_Patient === "Homme"
                            ? "👨 Homme"
                            : selectedPatient.Genre_Patient === "Femme"
                              ? "👩 Femme"
                              : "👶 Enfant"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                          Type de Patient
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#709CA7]/10 text-[#2B4B52] border border-[#709CA7]/25 self-start">
                            {selectedPatient.type_patient}
                          </span>
                          {selectedPatient.type_patient === "Enfant IMC" && (
                            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-0.5">
                              👤 Pseudo: <span className="font-black text-rose-600">{selectedPatient.Pseudo || "Non renseigné"}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                          Âge certifié
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {selectedPatient.Age_Patient || 30} ans
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                          Date Naissance
                        </span>
                        <span className="text-xs font-semibold text-slate-600 font-mono">
                          {selectedPatient.Date_Nais_Pat || "Non précisée"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1ère Consultation */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">1ère Consultation</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selPat.firstConsultDate ? (
                            <span className="font-mono">{selPat.firstConsultDate}</span>
                          ) : (
                            <span className="text-slate-400 italic">Non consulté</span>
                          )}
                        </p>
                      </div>

                      {/* Orientation */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Orientation</p>
                        <div className="flex flex-wrap gap-1">
                          {(!selPat.orientationLabels || selPat.orientationLabels.length === 0) ? (
                            <span className="text-slate-400 italic text-sm">Non renseignée</span>
                          ) : (
                            selPat.orientationLabels.map((label, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100"
                              >
                                {label}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Draggable/Resizable Splitter handle for desktop */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  const sX = e.clientX;
                  const sR = upperSplitRatio;
                  const moveHandler = (mE: MouseEvent) => {
                    const delta = mE.clientX - sX;
                    const updated = Math.max(
                      25,
                      Math.min(75, sR + (delta / 850) * 100),
                    );
                    setUpperSplitRatio(updated);
                  };
                  const upHandler = () => {
                    window.removeEventListener("mousemove", moveHandler);
                    window.removeEventListener("mouseup", upHandler);
                  };
                  window.addEventListener("mousemove", moveHandler);
                  window.addEventListener("mouseup", upHandler);
                }}
                className="hidden md:flex flex-col items-center justify-center w-3 bg-slate-50 hover:bg-slate-200 border-x border-slate-200 cursor-col-resize select-none shrink-0 transition"
                title="Glissez pour réajuster le séparateur"
              >
                <div className="w-1.5 h-16 bg-slate-300 rounded-full hover:bg-slate-400" />
              </div>

              {/* Partie DROITE: Coordonnées & Logistique + Affectation et le Bouton Enregistrer */}
              <div
                style={{ width: `${100 - upperSplitRatio}%` }}
                className="w-full md:min-w-[25%] p-5 bg-slate-50/20 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="border-b border-slate-100 pb-2 mb-3">
                    <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Coordonnées &amp; Logistique + Affectation</span>
                    </h4>
                  </div>

                  {isAdminOrReceptionistRDC ? (
                    <div className="space-y-3 px-0.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                            N° Téléphone :
                          </label>
                          <div className="relative">
                            <span className="absolute left-0 top-1 text-xs text-slate-400">
                              📞
                            </span>
                            <input
                              type="text"
                              className="w-full pl-6 bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-mono font-bold transition rounded-none animate-none"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                            Wilaya :
                          </label>
                          <select
                            className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none cursor-pointer appearance-none animate-none"
                            value={editWilaya}
                            onChange={(e) => setEditWilaya(e.target.value)}
                          >
                            {WILAYAS.map((w) => (
                              <option key={w.code} value={w.code}>
                                {w.code} - {w.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Adresse complète :
                        </label>
                        <input
                          type="text"
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none animate-none"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black text-[#5E7A8A] tracking-widest mb-1">
                          Service d'Affectation du patient :
                        </label>
                        <select
                          className="w-full bg-transparent border-0 border-b border-slate-200/80 focus:border-[#2563eb] focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none cursor-pointer appearance-none animate-none"
                          value={editAffectation}
                          onChange={(e) => setEditAffectation(e.target.value)}
                        >
                          {editGenre === "Homme" || editGenre === "Femme" ? (
                            <>
                              <option value="Sce Réeducation Adulte">
                                Sce Réeducation Adulte
                              </option>
                              <option value="Sce Balnéothérapie">
                                Sce Balnéothérapie
                              </option>
                            </>
                          ) : (
                            <>
                              <option value="Intensif 2e">Intensif 2e</option>
                              <option value="Intensif 3e">Intensif 3e</option>
                              <option value="Intensif 4e">Intensif 4e</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    // Consultation state Right side
                    <div className="space-y-3 px-0.5 text-xs">
                      <div className="flex gap-2.5 items-start">
                        <span className="text-sm">📞</span>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                            Téléphone Mobile
                          </span>
                          <a
                            href={`tel:${selectedPatient.phone}`}
                            className="text-xs font-mono font-black text-slate-900 hover:text-indigo-650 transition"
                          >
                            {selectedPatient.phone || "Non renseigné"}
                          </a>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start">
                        <span className="text-sm">📍</span>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                            Adresse &amp; Wilaya
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {selectedPatient.address || "Adresse non rédigée"}{" "}
                            (Wilaya : {getWilayaLabel(selectedPatient.wilaya)})
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start">
                        <span className="text-sm">🏢</span>
                        <div className="w-full bg-white p-2.5 rounded-lg border border-slate-150 shadow-2xs">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block mb-1">
                            Service d'Affectation
                          </span>
                          <select
                            className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-250 focus:border-indigo-500 rounded-md px-2 py-1 text-xs text-purple-950 font-black focus:outline-none transition cursor-pointer"
                            value={
                              selectedPatient.Affect_Pat_IMC ||
                              selectedPatient.affectation ||
                              ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const fresh = { ...dbState };
                              const patIdx = fresh.patients.findIndex(
                                (p) =>
                                  p.ID_Patient === selectedPatient.ID_Patient,
                              );
                              if (patIdx !== -1) {
                                fresh.patients[patIdx] = {
                                  ...fresh.patients[patIdx],
                                  Affect_Pat_IMC: val || undefined,
                                  affectation: val || undefined,
                                };
                                onSave(fresh);
                                triggerToast(
                                  val 
                                    ? `Affectation du patient mise à jour : ${val}`
                                    : "Affectation du patient réinitialisée (Non Affecté)",
                                  "success",
                                );
                              }
                            }}
                          >
                            <option value="">-- Non Affecté --</option>
                            {selectedPatient.Genre_Patient === "Homme" ||
                            selectedPatient.Genre_Patient === "Femme" ? (
                              <>
                                <option value="Sce Réeducation Adulte">
                                  Sce Réeducation Adulte
                                </option>
                                <option value="Sce Balnéothérapie">
                                  Sce Balnéothérapie
                                </option>
                              </>
                            ) : (
                              <>
                                <option value="Intensif 2e">Intensif 2e</option>
                                <option value="Intensif 3e">Intensif 3e</option>
                                <option value="Intensif 4e">Intensif 4e</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Le Bouton Enregistrer / Statut lecture seule dans la partie droite */}
                <div className="pt-2">
                  {isAdminOrReceptionistRDC ? (
                    <button
                      type="button"
                      onClick={handleSaveAdminInfo}
                      className="w-full text-white font-black text-xs py-2.5 px-4 rounded-xl transition shadow-lg bg-[#606C5A] hover:bg-[#4E5849] flex items-center justify-center gap-1.5 duration-150 cursor-pointer active:scale-[0.99]"
                    >
                      <span>💾 Enregistrer les Modifications</span>
                    </button>
                  ) : (
                    <div className="w-full p-2 rounded-xl bg-slate-100 border border-slate-200 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      🔒 Lecture Seule (Consultation)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABS SELECTOR */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 flex-wrap">
            {selectedPatient.type_patient === "Enfant IMC" ? (
              <>
                <button
                  type="button"
                  onClick={() => setFolderTab("fiche_pediatrique")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "fiche_pediatrique"
                      ? "border-rose-600 text-rose-700 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>1. Fiche d'évaluation pédiatrique</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFolderTab("planning_previsionnel")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "planning_previsionnel"
                      ? "border-indigo-600 text-indigo-700 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>2. Planning prévisionnel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFolderTab("subscriptions")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "subscriptions"
                      ? "border-[#606C5A] text-slate-900 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Ses Abonnements</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFolderTab("seances_record")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "seances_record"
                      ? "border-[#606C5A] text-slate-900 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. {selectedPatient?.type_patient === "Enfant IMC" || selectedPatient?.patient?.Type_Patient === "Enfant IMC" ? "Historique Hors Forfait" : "Historique Actes"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFolderTab("orientation")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "orientation"
                      ? "border-indigo-600 text-indigo-700 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>5. Orientation</span>
                </button>


              </>
            ) : (
              <>
                {!hideMedicalDossierTab && (
                  <button
                    onClick={() => setFolderTab("medical_dossier")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                      folderTab === "medical_dossier"
                        ? "border-[#606C5A] text-slate-900 bg-white font-black"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dossier Médical</span>
                  </button>
                )}

                <button
                  onClick={() => setFolderTab("subscriptions")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "subscriptions"
                      ? "border-[#606C5A] text-slate-900 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ses Abonnements</span>
                </button>

                <button
                  onClick={() => setFolderTab("seances_record")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "seances_record"
                      ? "border-[#606C5A] text-slate-900 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedPatient?.type_patient === "Enfant IMC" || selectedPatient?.patient?.Type_Patient === "Enfant IMC" ? "Historique Hors Forfait" : "Historique Actes"}</span>
                </button>

                <button
                  onClick={() => setFolderTab("orientation")}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold transition duration-150 border-b-2 cursor-pointer ${
                    folderTab === "orientation"
                      ? "border-indigo-600 text-indigo-700 bg-white font-black"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Orientation</span>
                </button>


              </>
            )}
          </div>

          {/* TABS CONTENT WITH HIGHLY SCROLLABLE DESIGNS */}
          <div className="p-4 sm:p-5 bg-slate-50/30 font-medium text-slate-900">
            {/* TAB IMC 1: FICHE EVALUATION PEDIATRIQUE */}
            {folderTab === "fiche_pediatrique" && selectedPatient && (
              <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200">
                <FicheEvaluationPediatrique
                  dbState={dbState}
                  onSave={onSave}
                  patient={selectedPatient}
                  triggerToast={triggerToast}
                  currentRole={currentUser.Role}
                />
              </div>
            )}

            {/* TAB IMC 2: PLANNING PREVISIONNEL */}
            {folderTab === "planning_previsionnel" && selectedPatient && (
              <div className="bg-slate-800 text-slate-100 p-4 rounded-2xl border border-slate-700 shadow-sm">
                <PlanningPrevisionnelIMC
                  dbState={dbState}
                  onSave={onSave}
                  patient={selectedPatient}
                  triggerToast={triggerToast}
                  currentRole={currentUser.Role}
                />
              </div>
            )}

            {/* TAB 1: DOSSIER MEDICAL MPR */}
            {folderTab === "medical_dossier" && (
              <div className="space-y-6">
                <DossierMedicalMPR
                  dbState={dbState}
                  onSave={onSave}
                  patient={selectedPatient}
                  triggerToast={triggerToast}
                  currentUser={currentUser}
                  canEditMedical={canEditMedical}
                />

                {/* Section Kine Automation Panel (Optionnelle) */}
                <div className="space-y-2.5 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider font-sans">
                      ⚙️ Automatisation de Prescription & Relational Engine
                    </h4>
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      MCD SQL Rules Integrated
                    </span>
                  </div>
                  <KineAutomationPanel
                    patient={selectedPatient}
                    dbState={dbState}
                    onSave={onSave}
                    currentUser={currentUser}
                    canEditMedical={canEditMedical}
                    triggerToast={triggerToast}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SES ABONNEMENTS */}
            {folderTab === "subscriptions" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-widest">
                    Forfaits et Abonnements de Soins
                  </h4>
                  {currentUser.Role === "Admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAbnInline(!showAddAbnInline);
                        const firstPack = dbState.packs[0]?.ID_Pack || 1;
                        setNewAbnPackId(firstPack);
                        setNewAbnStartDate(getTodayString());
                        setNewAbnEndDate(getDatePlus30Days(getTodayString()));
                        setNewAbnAdd1("none");
                        setNewAbnAdd2("none");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1 rounded transition max-w-max cursor-pointer self-end shadow-xs"
                    >
                      {showAddAbnInline ? "Fermer" : "+ Nouveau"}
                    </button>
                  )}
                </div>

                {currentUser.Role === "Admin" && showAddAbnInline && (
                  <div className="bg-slate-100 border border-slate-250 rounded-xl p-3 sm:p-4 shadow-sm space-y-3 text-slate-900 font-medium">
                    <h5 className="font-extrabold text-[10px] text-indigo-950 uppercase tracking-wider font-sans">
                      💳 Nouveau Forfait (Admin)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                          Pack Thérapeutique
                        </label>
                        <select
                          className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white font-semibold outline-none"
                          value={newAbnPackId}
                          onChange={(e) =>
                            setNewAbnPackId(Number(e.target.value))
                          }
                        >
                          {dbState.packs.map((p) => (
                            <option key={p.ID_Pack} value={p.ID_Pack}>
                              {p.Libelle_Pack} ({p.Nbre_Seance_Pack} séances)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                            Début
                          </label>
                          <input
                            type="date"
                            className="w-full border border-slate-300 rounded px-2 py-1 font-semibold bg-white outline-none"
                            value={newAbnStartDate}
                            onChange={(e) => {
                              const nextStart = e.target.value;
                              setNewAbnStartDate(nextStart);
                              setNewAbnEndDate(getDatePlus30Days(nextStart));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                            Fin
                          </label>
                          <input
                            type="date"
                            className="w-full border border-slate-300 rounded px-2 py-1 font-semibold bg-white outline-none"
                            value={newAbnEndDate}
                            onChange={(e) => setNewAbnEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                          Option 1
                        </label>
                        <select
                          className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white font-semibold outline-none"
                          value={newAbnAdd1}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewAbnAdd1(val);
                            if (val !== "none" && val === newAbnAdd2) {
                              setNewAbnAdd2("none");
                              triggerToast(
                                "Les deux actes optionnels ne peuvent pas être identiques !",
                                "warning",
                              );
                            }
                          }}
                        >
                          <option value="none">Aucun</option>
                          {getFilteredActesForRole(
                            dbState.actes,
                            currentUser?.Role || "Admin",
                          )
                            .filter(
                              (act) =>
                                ![
                                  "Consultation Adulte",
                                  "Consultation Enfant",
                                  "Contrôle",
                                  "Intensif",
                                ].includes(act.Libelle_Acte),
                            )
                            .map((act) => (
                              <option key={act.ID_Acte} value={act.ID_Acte}>
                                {act.Libelle_Acte}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                          Option 2
                        </label>
                        <select
                          className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white font-semibold outline-none"
                          value={newAbnAdd2}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewAbnAdd2(val);
                            if (val !== "none" && val === newAbnAdd1) {
                              setNewAbnAdd1("none");
                              triggerToast(
                                "Les deux actes optionnels ne peuvent pas être identiques !",
                                "warning",
                              );
                            }
                          }}
                        >
                          <option value="none">Aucun</option>
                          {getFilteredActesForRole(
                            dbState.actes,
                            currentUser?.Role || "Admin",
                          )
                            .filter(
                              (act) =>
                                ![
                                  "Consultation Adulte",
                                  "Consultation Enfant",
                                  "Contrôle",
                                  "Intensif",
                                ].includes(act.Libelle_Acte),
                            )
                            .map((act) => (
                              <option key={act.ID_Acte} value={act.ID_Acte}>
                                {act.Libelle_Acte}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          newAbnAdd1 !== "none" &&
                          newAbnAdd1 === newAbnAdd2
                        ) {
                          triggerToast(
                            "Erreur : l'acte optionnel 1 et l'acte optionnel 2 ne peuvent pas être identiques !",
                            "error",
                          );
                          return;
                        }

                        const alreadyHasAbn = dbState.abonnements.find((a) => {
                          if (a.ID_Patient !== selectedPatient.ID_Patient)
                            return false;
                          return (
                            (newAbnStartDate >= a.Date_Debut_Abn &&
                              newAbnStartDate <= a.Date_Fin_Abn) ||
                            (newAbnEndDate >= a.Date_Debut_Abn &&
                              newAbnEndDate <= a.Date_Fin_Abn)
                          );
                        });
                        if (alreadyHasAbn) {
                          triggerToast(
                            "Attention : Ce patient dispose déjà d'un abonnement de soins chevauchant.",
                            "error",
                          );
                        }

                        const fresh = { ...dbState };
                        const nextId =
                          fresh.abonnements.length > 0
                            ? Math.max(
                                ...fresh.abonnements.map((a) => a.ID_Abn),
                              ) + 1
                            : 1;
                        const newAbn: Abonnement = {
                          ID_Abn: nextId,
                          ID_Patient: selectedPatient.ID_Patient,
                          ID_Pack: Number(newAbnPackId),
                          Date_Debut_Abn: newAbnStartDate,
                          Date_Fin_Abn: newAbnEndDate,
                          Nbre_Sean_Consom_Abn: 0,
                          ID_Acte_Add1:
                            newAbnAdd1 === "none" ? null : Number(newAbnAdd1),
                          ID_Acte_Add2:
                            newAbnAdd2 === "none" ? null : Number(newAbnAdd2),
                          Etat: "Gelé",
                        };

                        const patIdx = fresh.patients.findIndex(
                          (p) => p.ID_Patient === selectedPatient.ID_Patient,
                        );
                        if (patIdx !== -1) {
                          fresh.patients[patIdx] = {
                            ...fresh.patients[patIdx],
                            Nbre_Abn:
                              (fresh.patients[patIdx].Nbre_Abn || 0) + 1,
                            Nbre_Abn_Pat:
                              (fresh.patients[patIdx].Nbre_Abn_Pat || 0) + 1,
                          };
                        }

                        fresh.abonnements =
                          ensureSingleActiveSubscriptionForPatient(
                            [...fresh.abonnements, newAbn],
                            selectedPatient.ID_Patient,
                            nextId,
                          );
                        onSave(fresh);
                        setShowAddAbnInline(false);
                        triggerToast(
                          `Abonnement ABN_${newAbn.ID_Abn} créé !`,
                          "success",
                        );
                      }}
                      className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded transition uppercase tracking-widest cursor-pointer font-sans"
                    >
                      Enregistrer le Forfait
                    </button>
                  </div>
                )}

                {(() => {
                  const patientAbns = dbState.abonnements.filter(
                    (a) => a.ID_Patient === selectedPatient.ID_Patient,
                  );

                  // Price map helper
                  const getPackPrice = (packId: number) => {
                    const foundPack = dbState.packs.find(
                      (p) => p.ID_Pack === packId,
                    );
                    return foundPack?.Prix_Pack ?? 0;
                  };

                  // Helper for freeze/gel toggle action
                  const toggleGelAbonnement = (abnId: number) => {
                    const fresh = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
                    const idx = fresh.abonnements.findIndex(
                      (a) => a.ID_Abn === abnId,
                    );
                    if (idx !== -1) {
                      const isCurrentlyGele = !!(fresh.abonnements[idx] as any)
                        .Est_Gele;
                      const nextGele = !isCurrentlyGele;
                      (fresh.abonnements[idx] as any).Est_Gele = nextGele;
                      if (!nextGele) {
                        fresh.abonnements[idx].Etat = "Actif";
                        fresh.abonnements =
                          ensureSingleActiveSubscriptionForPatient(
                            fresh.abonnements,
                            selectedPatient.ID_Patient,
                            abnId,
                          );
                      }
                      onSave(fresh);
                      triggerToast(
                        `Abonnement #${abnId} ${nextGele ? "Désactivé" : "Activé"} avec succès.`,
                        "success",
                      );
                    }
                  };

                  return (
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-bold uppercase tracking-wider text-[8px] font-sans">
                              <th className="py-2 px-3 pl-4">Libellé</th>
                              <th className="py-2 px-3">Sessions</th>
                              <th className="py-2 px-3">Début</th>
                              <th className="py-2 px-3 text-center">Conso.</th>
                              <th className="py-2 px-3">Prix</th>
                              <th className="py-2 px-3">Extras</th>
                              <th className="py-2 px-3">Etat</th>
                              <th className="py-2 px-3 text-center pr-4">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {patientAbns.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={8}
                                  className="p-6 text-center text-slate-400 italic font-medium"
                                >
                                  Aucun forfait thérapeutique enregistré.
                                </td>
                              </tr>
                            ) : (
                              patientAbns.map((abn) => {
                                const pack = dbState.packs.find(
                                  (p) => p.ID_Pack === abn.ID_Pack,
                                );
                                const totalSessions =
                                  pack?.Nbre_Seance_Pack ?? 10;
                                const price = getPackPrice(abn.ID_Pack);
                                const isGele = isAbonnementGele(abn, dbState);
                                const isAdminGele = !!(abn as any).Est_Gele;

                                const act1 = abn.ID_Acte_Add1
                                  ? dbState.actes.find(
                                      (a) => a.ID_Acte === abn.ID_Acte_Add1,
                                    )
                                  : null;
                                const act2 = abn.ID_Acte_Add2
                                  ? dbState.actes.find(
                                      (a) => a.ID_Acte === abn.ID_Acte_Add2,
                                    )
                                  : null;
                                const totalPaid = dbState.versements
                                  .filter((v) => v.ID_Abn === abn.ID_Abn)
                                  .reduce((sum, v) => sum + v.Mont_Vers, 0);

                                // Determine exact Etat condition
                                let etat:
                                  | "Actif"
                                  | "Fermé"
                                  | "Gelé"
                                  | "Expiré" = "Actif";
                                if (abn.Nbre_Sean_Consom_Abn >= totalSessions) {
                                  etat = "Fermé";
                                } else if (abn.Etat === "Gelé" || isGele) {
                                  etat = "Gelé";
                                } else {
                                  const today = new Date()
                                    .toISOString()
                                    .split("T")[0];
                                  if (abn.Date_Fin_Abn < today) {
                                    etat = "Expiré";
                                  }
                                }

                                const isExpanded =
                                  expandedSessionsAbnId === abn.ID_Abn;
                                const sessions = dbState.seances.filter(
                                  (s) => s.ID_Abn === abn.ID_Abn,
                                );

                                return (
                                  <React.Fragment key={abn.ID_Abn}>
                                    <tr
                                      onClick={() => {
                                        if (
                                          currentUser.Role === "Admin" ||
                                          currentUser.Role === "Assistante"
                                        ) {
                                          handleStartEditAbn(abn);
                                        } else {
                                          setExpandedSessionsAbnId(
                                            isExpanded ? null : abn.ID_Abn,
                                          );
                                        }
                                      }}
                                      className={`transition group cursor-pointer select-none border-l-4 ${
                                        totalPaid >= price
                                          ? "bg-[#A7E0E0]/35 hover:bg-[#A7E0E0]/50 text-slate-900 border-[#A7E0E0]"
                                          : totalPaid > 0
                                            ? "bg-[#E3CD8B]/35 hover:bg-[#E3CD8B]/50 text-slate-900 border-[#E3CD8B]"
                                            : "bg-[#F9968B]/35 hover:bg-[#F9968B]/50 text-slate-900 border-[#F9968B]"
                                      }`}
                                    >
                                      <td className="py-2 px-3 pl-4 font-bold text-slate-800">
                                        <div className="flex flex-col">
                                          <span className="text-[7.5px] text-slate-400 font-mono">
                                            ID_#0{abn.ID_Abn}
                                          </span>
                                          <span className="group-hover:text-indigo-650 transition text-[10px] leading-tight">
                                            {pack?.Libelle_Pack ||
                                              "Pack personnalisé"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-600 text-[10px]">
                                        {totalSessions}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500 font-semibold font-mono text-[9px]">
                                        {abn.Date_Debut_Abn}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span
                                          className={`inline-block px-1.5 py-0.5 rounded font-extrabold font-mono text-[9px] ${
                                            abn.Nbre_Sean_Consom_Abn >=
                                            totalSessions
                                              ? "bg-rose-50 text-rose-700 border border-rose-150"
                                              : "bg-indigo-50 text-indigo-800 border border-indigo-100"
                                          }`}
                                        >
                                          {abn.Nbre_Sean_Consom_Abn} /{" "}
                                          {totalSessions}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-slate-705 text-[10px]">
                                        {price}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex flex-col gap-0.5 max-w-[100px]">
                                          {act1 && (
                                            <span className="bg-indigo-50 border border-indigo-100 text-[7px] font-black text-indigo-800 px-1 py-0.5 rounded leading-none truncate uppercase">
                                              {act1.Libelle_Acte}
                                            </span>
                                          )}
                                          {act2 && (
                                            <span className="bg-indigo-50 border border-indigo-100 text-[7px] font-black text-indigo-800 px-1 py-0.5 rounded leading-none truncate uppercase">
                                              {act2.Libelle_Acte}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        {(() => {
                                          if (
                                            abn.Nbre_Sean_Consom_Abn >=
                                            totalSessions
                                          ) {
                                            return (
                                              <span className="bg-stone-100 text-stone-600 border border-stone-250 text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                                Fermé
                                              </span>
                                            );
                                          }
                                          if (isGele) {
                                            return (
                                              <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                                ❄️ Désactivé
                                              </span>
                                            );
                                          }
                                          const today = new Date()
                                            .toISOString()
                                            .split("T")[0];
                                          if (abn.Date_Fin_Abn < today) {
                                            return (
                                              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                                Expiré
                                              </span>
                                            );
                                          }
                                          return (
                                            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                              Actif
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td
                                        className="py-2 px-3 text-center pr-4"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-center gap-1">
                                          {currentUser.Role === "Admin" &&
                                            etat !== "Fermé" &&
                                            etat !== "Expiré" && (
                                              <label className="flex items-center gap-1 cursor-pointer select-none border border-slate-200 hover:border-slate-300 px-1.5 py-0.5 rounded bg-slate-50 transition">
                                                <input
                                                  type="checkbox"
                                                  checked={!isAdminGele}
                                                  onChange={() =>
                                                    toggleGelAbonnement(
                                                      abn.ID_Abn,
                                                    )
                                                  }
                                                  className="w-3 h-3 accent-emerald-600 rounded cursor-pointer"
                                                />
                                                <span className="text-[8px] font-black uppercase text-slate-700">
                                                  {!isAdminGele ? "Activé" : "Désactivé"}
                                                </span>
                                              </label>
                                            )}

                                          {etat !== "Fermé" && (
                                            <button
                                              type="button"
                                              disabled={currentUser.Role !== "Admin"}
                                              onClick={() => setActiveVersementAbnId(abn.ID_Abn)}
                                              className={`p-1 rounded font-bold text-[8px] flex items-center gap-1 transition ${
                                                currentUser.Role === "Admin"
                                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-3xs"
                                                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
                                              }`}
                                              title={
                                                currentUser.Role === "Admin"
                                                  ? "Enregistrer un versement"
                                                  : "L'enregistrement des versements est désactivé"
                                              }
                                            >
                                              {currentUser.Role === "Admin" ? "💰 Verser" : "🔒 Versé"}
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedSessionsAbnId(
                                                isExpanded ? null : abn.ID_Abn,
                                              )
                                            }
                                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 p-1 rounded font-black text-[8px] transition cursor-pointer"
                                          >
                                            {isExpanded ? "▲" : "👁️"}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded row with session detail mapping */}
                                    {isExpanded && (
                                      <tr>
                                        <td
                                          colSpan={8}
                                          className="bg-slate-50/70 p-4 pr-5 pl-8 border-b border-slate-200"
                                        >
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <span className="block text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                                                📌 Inscriptions &amp; Séances
                                                rattachées à cet abonnement (Clé
                                                : ABN_#0{abn.ID_Abn}) :
                                              </span>
                                              {selectedSeanceIds.length > 0 && hasPermission(currentUser?.Role, 'fiche_patient', 'canDelete') && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (
                                                      confirm(
                                                        `Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedSeanceIds.length} séance(s) ?`,
                                                      )
                                                    ) {
                                                      handleDeleteSeances(
                                                        selectedSeanceIds,
                                                        abn.ID_Abn,
                                                      );
                                                      setSelectedSeanceIds([]);
                                                    }
                                                  }}
                                                  className="bg-red-650 hover:bg-red-750 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg transition shadow-3xs"
                                                >
                                                  🗑️ Supprimer la sélection (
                                                  {selectedSeanceIds.length})
                                                </button>
                                              )}
                                            </div>
                                            {sessions.length === 0 ? (
                                              <p className="text-[11px] text-slate-400 italic font-medium pl-2">
                                                Aucune séance d'acte n'a été
                                                validée ou rattachée à cet
                                                abonnement dans notre registre.
                                              </p>
                                            ) : (
                                              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 mt-2">
                                                <table className="w-full text-left border-collapse text-[10px]">
                                                  <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-slate-700 font-sans text-[9px] uppercase tracking-wider">
                                                      <th className="p-2.5 pl-4 w-20 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                          <input
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-505 cursor-pointer h-3.5 w-3.5"
                                                            checked={
                                                              sessions.length >
                                                                0 &&
                                                              sessions.every(
                                                                (s) =>
                                                                  selectedSeanceIds.includes(
                                                                    s.ID_Seanc,
                                                                  ),
                                                              )
                                                            }
                                                            onChange={(e) => {
                                                              if (
                                                                e.target.checked
                                                              ) {
                                                                setSelectedSeanceIds(
                                                                  sessions.map(
                                                                    (s) =>
                                                                      s.ID_Seanc,
                                                                  ),
                                                                );
                                                              } else {
                                                                setSelectedSeanceIds(
                                                                  [],
                                                                );
                                                              }
                                                            }}
                                                          />
                                                          <span className="text-[9px] text-slate-400 font-bold ml-1">
                                                            Sél.
                                                          </span>
                                                        </div>
                                                      </th>
                                                      <th className="p-2.5">
                                                        Date de Séance
                                                      </th>
                                                      <th className="p-2.5">
                                                        Heure Début
                                                      </th>
                                                      <th className="p-2.5">
                                                        Heure Fin
                                                      </th>
                                                      <th className="p-2.5">
                                                        Nature Séance
                                                      </th>
                                                      <th className="p-2.5">
                                                        Praticien
                                                      </th>
                                                      {(selectedPatient.type_patient ===
                                                        "Adulte" ||
                                                        selectedPatient.type_patient ===
                                                          "Enfant") && (
                                                        <th className="p-2.5 text-right pr-4">
                                                          Prix
                                                        </th>
                                                      )}
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100">
                                                    {sessions.map((s) => {
                                                      const prat =
                                                        dbState.praticiens.find(
                                                          (p) =>
                                                            p.ID_Prat ===
                                                            s.ID_Prat,
                                                        );
                                                      const act =
                                                        dbState.actes.find(
                                                          (a) =>
                                                            a.ID_Acte ===
                                                            s.ID_Acte,
                                                        );
                                                      const isChecked =
                                                        selectedSeanceIds.includes(
                                                          s.ID_Seanc,
                                                        );
                                                      return (
                                                        <tr
                                                          key={`${s.ID_Seanc}-${s.Date_Seanc_Realisee}-${s.H_Debut_Seanc}`}
                                                          className="hover:bg-slate-55 transition-colors"
                                                        >
                                                          <td className="p-2.5 text-center w-20">
                                                            <div className="flex items-center justify-center gap-2">
                                                              <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-505 cursor-pointer h-3.5 w-3.5"
                                                                checked={
                                                                  isChecked
                                                                }
                                                                onChange={() => {
                                                                  if (
                                                                    isChecked
                                                                  ) {
                                                                    setSelectedSeanceIds(
                                                                      (prev) =>
                                                                        prev.filter(
                                                                          (
                                                                            id,
                                                                          ) =>
                                                                            id !==
                                                                            s.ID_Seanc,
                                                                        ),
                                                                    );
                                                                  } else {
                                                                    setSelectedSeanceIds(
                                                                      (
                                                                        prev,
                                                                      ) => [
                                                                        ...prev,
                                                                        s.ID_Seanc,
                                                                      ],
                                                                    );
                                                                  }
                                                                }}
                                                              />
                                                              {hasPermission(currentUser?.Role, 'fiche_patient', 'canDelete') && (
                                                                <button
                                                                  type="button"
                                                                  title="Supprimer cette séance"
                                                                onClick={(
                                                                  e,
                                                                ) => {
                                                                  e.stopPropagation();
                                                                  if (
                                                                    confirm(
                                                                      `Voulez-vous vraiment supprimer définitivement la séance SEANCE_#0${s.ID_Seanc} ?`,
                                                                    )
                                                                  ) {
                                                                    handleDeleteSeances(
                                                                      [
                                                                        s.ID_Seanc,
                                                                      ],
                                                                      abn.ID_Abn,
                                                                    );
                                                                    setSelectedSeanceIds(
                                                                      (prev) =>
                                                                        prev.filter(
                                                                          (
                                                                            id,
                                                                          ) =>
                                                                            id !==
                                                                            s.ID_Seanc,
                                                                        ),
                                                                    );
                                                                  }
                                                                }}
                                                                className="text-slate-400 hover:text-rose-600 transition p-1 hover:bg-rose-50 rounded cursor-pointer"
                                                              >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                              </button>
                                                            )}
                                                            </div>
                                                          </td>
                                                          <td className="p-2.5 font-bold text-slate-755 font-mono">
                                                            {
                                                              s.Date_Seanc_Realisee
                                                            }
                                                          </td>
                                                          <td className="p-2.5 text-slate-600 font-mono">
                                                            {s.H_Debut_Seanc}
                                                          </td>
                                                          <td className="p-2.5 text-slate-600 font-mono">
                                                            {s.H_Fin_Seanc}
                                                          </td>
                                                          <td className="p-2.5 text-slate-800 font-sans font-bold">
                                                            {act?.Libelle_Acte ||
                                                              "Soin Thérapeutique"}
                                                          </td>
                                                          <td className="p-2.5 text-slate-800 font-sans">
                                                            <span className="bg-indigo-50 text-indigo-805 px-2.5 py-0.5 rounded font-black text-[9.5px]">
                                                              Dr.{" "}
                                                              {prat?.Nom_Prat}{" "}
                                                              {
                                                                prat?.Prenom_Prat
                                                              }
                                                            </span>
                                                          </td>
                                                          {(selectedPatient.type_patient ===
                                                            "Adulte" ||
                                                            selectedPatient.type_patient ===
                                                              "Enfant") && (
                                                            <td className="p-2.5 text-right pr-4 font-mono font-bold text-emerald-700">
                                                              {s.Prix_Seanc ===
                                                              0 ? (
                                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                                                  Forfait
                                                                </span>
                                                              ) : (
                                                                `${s.Prix_Seanc} DA`
                                                              )}
                                                            </td>
                                                          )}
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: HISTORIQUE DES SEANCES */}
            {folderTab === "seances_record" && (
              <div className="mt-4">
                {(() => {
                  const patientId = Number(selectedPatient.ID_Patient);

                  // Séances de soins
                  const seances = (dbState?.seances || [])
                    .filter((s) => Number(s.ID_Patient) === patientId)
                    .map((s) => {
                      const act = dbState?.actes?.find((a) => a.ID_Acte === s.ID_Acte);
                      const prat = dbState?.praticiens?.find((p) => p.ID_Prat === s.ID_Prat);
                      return {
                        id: s.ID_Seanc,
                        date: s.Date_Seanc_Realisee || s.Date,
                        heureDebut: s.H_Debut_Seanc || s.Heure_Debut || s.HeureDebut || s.HDebut || s.heure_debut || null,
                        heureFin: s.H_Fin_Seanc || s.Heure_Fin || s.HeureFin || s.HFin || s.heure_fin || null,
                        type: act?.Libelle_Acte || s.Nom_Acte || "Séance",
                        praticien: prat ? `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}` : s.Nom_Medecin || "—",
                        prix: s.Prix_Seanc,
                        source: "seance",
                        originalSeance: s,
                      };
                    });

                  // Consultations / Contrôles
                  const consults = (dbState?.rendezVous || [])
                    .filter((r) => Number(r.ID_Patient) === patientId)
                    .map((r) => ({
                      id: r.ID_RDV || r.id,
                      date: r.Date_RDV || r.Date || r.date,
                      heureDebut: r.H_Debut_RDV || r.H_Debut || r.Heure_RDV || r.HeureDebut || r.HDebut || r.heure_debut || null,
                      heureFin: r.H_Fin_RDV || r.H_Fin || r.Heure_Fin_RDV || r.HeureFin || r.HFin || r.heure_fin || null,
                      type:
                        (r.Type_RDV || "").includes("Arrêt") || r.Type_RDV === "Contrôle Médical"
                          ? "Contrôle Médical"
                          : r.Type_RDV || "Consultation",
                      praticien: r.Nom_Medecin || r.Medecin || r.ID_Medecin || r.Praticien || "—",
                      prix: null,
                      source: "rdv",
                    }));

                  // 3. Actes de la file d'attente MPR (statut "Terminé")
                  const fileAttenteActes = (dbState?.fileAttente || [])
                    .filter((a: any) => {
                      const samePatient = Number(a.ID_Patient) === patientId;
                      const isDone = a.Statut_Attente === "Terminé";
                      return samePatient && isDone;
                    })
                    .map((a: any) => {
                      const prat = (dbState?.praticiens || []).find(
                        (p: any) => Number(p.ID_Prat) === Number(a.ID_Prat)
                      );
                      const pratName = prat
                        ? `Dr. ${prat.Prenom_Prat || ""} ${prat.Nom_Prat || ""}`.trim()
                        : "Médecin MPR";

                      return {
                        id: a.Num_Ticket || `FA-${a.ID_File}`,
                        date: a.Date_File || "—",
                        type: a.Type_Consultation || "Consultation",
                        praticien: pratName,
                        prix: a.Prix_Consultation ?? null,
                        heureDebut: a.Heure_Arrivee || null,
                        heureFin: a.Heure_Cloture || null,
                        source: "fileAttente",
                      };
                    });

                  // 4. Actes de la file d'attente IMC
                  const fileAttenteIMCActes = (dbState?.fileAttenteIMC || [])
                    .filter((a: any) => {
                      const samePatient = Number(a.ID_Patient) === patientId;
                      const isDone = a.Statut_Attente === "Terminé";
                      return samePatient && isDone;
                    })
                    .map((a: any) => ({
                      id: `IMC-${a.ID_File}`,
                      date: a.Date_File || "—",
                      type: a.Type_Soin || "Soin IMC",
                      praticien: "—",
                      prix: a.Prix_Soin ?? null,
                      heureDebut: a.Heure_Arrivee || null,
                      heureFin: a.Heure_Cloture || null,
                      source: "fileAttenteIMC",
                    }));

                  // Filtrage spécial Enfant IMC : uniquement hors abonnement
                  const isEnfantIMC =
                    selectedPatient?.type_patient === "Enfant IMC" ||
                    selectedPatient?.patient?.Type_Patient === "Enfant IMC" ||
                    selectedPatient?.patient?.type_patient === "Enfant IMC" ||
                    selectedPatient?.Type_Patient === "Enfant IMC";

                  const seancesFiltrees = isEnfantIMC
                    ? seances.filter((s: any) => {
                        const idAbn = s.originalSeance?.ID_Abn ?? s.originalSeance?.id_abn ?? s.originalSeance?.ID_Abonnement;
                        return !idAbn || idAbn === 0 || idAbn === "0" || idAbn === null;
                      })
                    : seances;

                  const allActes = [...seancesFiltrees, ...consults, ...fileAttenteActes, ...fileAttenteIMCActes].sort((a, b) => {
                    const da = (a.date || "").toString();
                    const db_ = (b.date || "").toString();
                    return db_.localeCompare(da);
                  });

                  if (allActes.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 italic text-sm">
                        Aucun acte enregistré pour ce patient
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-10">
                              N°
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                              Date Acte
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-20">
                              H-Début
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-20">
                              H-Fin
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                              Type Acte
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                              Praticien
                            </th>
                            <th className="px-3 py-2.5 text-right font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-24">
                              Prix
                            </th>
                            <th className="px-3 py-2.5 text-center font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-12">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allActes.map((acte, idx) => (
                            <tr
                              key={`${acte.source}-${acte.id || idx}`}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5 text-slate-800 text-xs font-medium">
                                {acte.date || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">
                                {acte.heureDebut || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">
                                {acte.heureFin || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-slate-700 text-xs">
                                {acte.type}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 text-xs">
                                {acte.praticien}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-800 text-xs font-bold">
                                {acte.prix !== null && acte.prix !== undefined ? `${acte.prix} DA` : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {acte.source === "seance" && acte.originalSeance && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Voulez-vous vraiment supprimer définitivement cette séance ? Son statut de planification repassera en 'Planifié'`,
                                        )
                                      ) {
                                        handleDeleteSeances([acte.originalSeance.ID_Seanc], acte.originalSeance.ID_Abn);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

            {/* TAB: ORIENTATION */}
            {folderTab === "orientation" && (
              <div className="space-y-6 animate-fade-in">
                <OrientationTab
                  data={orientationData}
                  onChange={setOrientationData}
                  translucentWhite={true}
                />
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleSaveOrientation}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition shadow-md cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Enregistrer l'orientation
                  </button>
                </div>
              </div>
            )}

          {/* Close footer */}
          <div className="bg-slate-100 border-t border-slate-200 p-3 px-5 flex justify-between items-center">
            {(currentUser.Role === "Admin" || currentUser.Role === "Receptionniste RDC" || currentUser.Role === "SupperRec") && (
              <button
                type="button"
                onClick={handleTriggerAddPatient}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-md transition cursor-pointer uppercase tracking-widest font-sans flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Nouveau patient</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClosePatientFiche}
              className="px-4 py-1.5 bg-[#102e3b] hover:bg-[#102e3b]/95 text-white font-black text-[10px] rounded-lg shadow-md transition cursor-pointer uppercase tracking-widest font-sans"
            >
              Fermer la Fiche
            </button>
          </div>
        </div>
        {versementModal}
        {editAbonnementModal}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="patients-management-workspace">
      {versementModal}
      {editAbonnementModal}

      {/* VUE PRINCIPALE : FORMULAIRE NOUVEAU PATIENT (PAYSAGE) */}
      <AnimatePresence mode="wait">
        {isAddingPatient && (
          <motion.div
            key="add-patient-view"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8"
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-100 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border border-teal-100">
                      Registre Clinique
                    </span>
                    <span className="text-teal-500 text-[10px] font-bold">Identité &amp; Dossiers</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Gestion des Patients &amp; Dossiers
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Recherchez, mettez à jour ou créez les dossiers des patients...
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    Date Active : {new Date().toLocaleDateString('fr-FR')}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      const btn = document.getElementById('btn-back-to-patients') || document.querySelector('[title="Basculer Plein écran"]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }}
                    className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Plein Écran
                  </button>
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Serveur HP
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingPatient(false)}
                    className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all text-slate-400 group cursor-pointer"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>
              <div className="mt-4 max-w-md">
                <PatientSearchCombobox 
                  patients={dbState.patients} 
                  onSelect={(patient) => {
                    setSelectedPatient(patient);
                    setIsAddingPatient(false);
                    triggerToast(`Dossier de ${patient.Nom_Patient} chargé avec succès !`, "success");
                  }} 
                />
              </div>
            </div>

            {/* Barre des Onglets pour Nouveau Patient */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100 max-w-max flex-wrap">
                {[
                  { id: "identity", label: "Identité & Résidence", icon: <User className="w-4 h-4 text-teal-600" /> },
                  { id: "subscription", label: "Abonnement Initial", icon: <Award className="w-4 h-4 text-teal-600" /> },
                  { id: "medical", label: "Dossier Médical MPR", icon: <ClipboardList className="w-4 h-4 text-teal-600" /> },
                  { id: "sessions", label: "Historique Séances", icon: <Activity className="w-4 h-4 text-teal-600" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddPatientTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      addPatientTab === tab.id
                        ? 'bg-white text-teal-700 shadow-sm border border-slate-100'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleCreatePatient}
              className="p-4 sm:p-6 space-y-4 text-slate-900 bg-slate-50/10"
            >
              <AnimatePresence mode="wait">
                {/* 1. ONGLET : IDENTITÉ & RÉSIDENCE */}
                {addPatientTab === "identity" && (
                  <motion.div
                    key="tab-identity"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  >
                    {/* Colonne Gauche : Identité Civile */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                          <User className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Identité Civile</h3>
                      </div>

                      <div className="space-y-4">
                        {/* Nom en Français */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                            Nom Complet (Français) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative flex gap-1.5">
                            <input
                              type="text"
                              required
                              placeholder="EX: BENMOHAMED ABDELLAH"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                              value={nom}
                              onChange={(e) => setNom(e.target.value.toUpperCase())}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!nom.trim()) return;
                                const res = translateNameToArabic(nom);
                                setNomArb(res.Nom_Pat_Arb);
                                setPrenomArb(res.Pren_Pat_Arb);
                                triggerToast(
                                  "Traduction automatique OK !",
                                  "success",
                                );
                              }}
                              className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-[9px] uppercase transition shadow-2xs border border-indigo-100 cursor-pointer shrink-0"
                            >
                              Trad. Arabe
                            </button>
                          </div>
                        </div>

                        {/* Nom et Prénom en Arabe */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50/30 p-3 rounded-xl border border-slate-100">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 text-right font-sans">
                              اللقب (Nom Arabe)
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="اللقب العائلي"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all text-right outline-none"
                              value={nomArb}
                              onChange={(e) => setNomArb(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 text-right font-sans">
                              الإسم (Prénom Arabe)
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="الاسم الشخصي"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all text-right outline-none"
                              value={prenomArb}
                              onChange={(e) => setPrenomArb(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Genre, Type & Âge */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Genre
                            </label>
                            <select
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 transition-all outline-none cursor-pointer"
                              value={genre}
                              onChange={(e) => {
                                const next = e.target.value as any;
                                setGenre(next);
                              }}
                            >
                              <option value="Homme">Homme</option>
                              <option value="Femme">Femme</option>
                              <option value="Enfant">Enfant</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Type
                            </label>
                            <div className="flex gap-1.5">
                              <select
                                className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 transition-all outline-none cursor-pointer"
                                value={typePatient}
                                onChange={(e) => setTypePatient(e.target.value)}
                              >
                                {(dbState.typesPatients || [
                                  'Adulte',
                                  'Enfant',
                                  'Enfant IMC'
                                ]).map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleAddPatientType}
                                className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-xl font-bold text-sm cursor-pointer border border-indigo-150 shrink-0"
                                title="Nouveau Type"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Âge (Ans)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="125"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none font-mono"
                              value={age}
                              onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {typePatient === "Enfant IMC" && (
                          <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl space-y-1 animate-fade-in">
                            <label className="text-[10px] font-black text-amber-800 uppercase tracking-wider block mb-1.5">
                              Pseudo (Dédié Enfant IMC) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="EX: Petit Lion"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                              value={pseudo}
                              onChange={(e) => setPseudo(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Colonne Droite : Coordonnées de Contact & Résidence */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Coordonnées &amp; Résidence</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              N° de Téléphone
                            </label>
                            <input
                              type="tel"
                              placeholder="0X XX XX XX XX"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none font-mono"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Wilaya
                            </label>
                            <select
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 transition-all outline-none cursor-pointer"
                              value={wilaya}
                              onChange={(e) => setWilaya(e.target.value)}
                            >
                              {WILAYAS.map((w) => (
                                <option key={w.code} value={w.code}>
                                  {w.code} - {w.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Commune
                            </label>
                            <input
                              type="text"
                              placeholder="Alger, Oran..."
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                              Adresse Complète
                            </label>
                            <input
                              type="text"
                              placeholder="Quartier, N° porte, Rue..."
                              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Date de Naissance Optionnelle */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                            Date de Naissance (Calcule l'âge automatiquement)
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none font-mono"
                            value={dateNais}
                            onChange={(e) => {
                              const dt = e.target.value;
                              setDateNais(dt);
                              if (dt) {
                                setAge(calculateAge(dt));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. ONGLET : ABONNEMENT INITIAL */}
                {addPatientTab === "subscription" && (
                  <motion.div
                    key="tab-subscription"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100/60">
                      <div className="flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-emerald-600" />
                        <div>
                          <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest leading-none">
                            Abonnement Initial (Admission)
                          </h4>
                          <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">
                            Inscrire directement le patient à un forfait de
                            soins
                          </span>
                        </div>
                      </div>

                      {/* Toggle activation abonnement direct */}
                      <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/55 hover:bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl transition">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                          checked={newPatientHasAbn}
                          onChange={(e) =>
                            setNewPatientHasAbn(e.target.checked)
                          }
                        />
                        <span className="text-[9.5px] font-black text-emerald-900 uppercase tracking-wide">
                          Activer un forfait immédiatement
                        </span>
                      </label>
                    </div>

                    {newPatientHasAbn ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Config Forfait */}
                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                              Pack de Forfait Thérapeutique
                            </label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-555 rounded-lg px-3 py-2 text-xs font-black text-slate-800 outline-none cursor-pointer"
                              value={newPatientPackId}
                              onChange={(e) =>
                                setNewPatientPackId(Number(e.target.value))
                              }
                            >
                              {dbState.packs?.map((p) => (
                                <option key={p.ID_Pack} value={p.ID_Pack}>
                                  {p.Libelle_Pack} — ({p.Nbre_Seance_Pack}{" "}
                                  Séances / {p.Prix_Pack.toLocaleString()} DA)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                                Date Création
                              </label>
                              <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-550 rounded-lg px-2 py-1 text-xs font-bold outline-none text-slate-800"
                                value={newPatientDateAbn}
                                onChange={(e) => setNewPatientDateAbn(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                                Échéance : Début
                              </label>
                              <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-550 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                value={newPatientStartDate}
                                onChange={(e) => {
                                  const start = e.target.value;
                                  setNewPatientStartDate(start);
                                  setNewPatientEndDate(
                                    getDatePlus30Days(start),
                                  );
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                                Échéance : Fin
                              </label>
                              <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-550 rounded-lg px-2.5 py-1 text-xs font-bold outline-none"
                                value={newPatientEndDate}
                                onChange={(e) =>
                                  setNewPatientEndDate(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actes complémentaires Optionnels */}
                        <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                          <label className="block text-[8.5px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1">
                            Actes Exceptionnels Optionnels
                          </label>

                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div>
                              <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                                Exceptionnel 1
                              </label>
                              <select
                                className="w-full border border-slate-250 rounded-lg px-2 py-1.5 bg-white font-bold text-xs outline-none"
                                value={newPatientAdd1}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewPatientAdd1(val);
                                  if (
                                    val !== "none" &&
                                    val === newPatientAdd2
                                  ) {
                                    setNewPatientAdd2("none");
                                    triggerToast(
                                      "Les deux actes optionnels ne peuvent pas être identiques !",
                                      "warning",
                                    );
                                  }
                                }}
                              >
                                <option value="none">
                                  Aucun acte supplémentaire
                                </option>
                                {getFilteredActesForRole(
                                  dbState.actes,
                                  currentUser?.Role || "Admin",
                                )
                                  .filter(
                                    (act) =>
                                      ![
                                        "Consultation Adulte",
                                        "Consultation Enfant",
                                        "Contrôle",
                                        "Intensif",
                                      ].includes(act.Libelle_Acte),
                                  )
                                  .map((act) => (
                                    <option
                                      key={act.ID_Acte}
                                      value={act.ID_Acte}
                                    >
                                      {act.Libelle_Acte}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] font-extrabold text-slate-500 uppercase mb-1 tracking-wider">
                                Exceptionnel 2
                              </label>
                              <select
                                className="w-full border border-slate-250 rounded-lg px-2 py-1.5 bg-white font-bold text-xs outline-none"
                                value={newPatientAdd2}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewPatientAdd2(val);
                                  if (
                                    val !== "none" &&
                                    val === newPatientAdd1
                                  ) {
                                    setNewPatientAdd1("none");
                                    triggerToast(
                                      "Les deux actes optionnels ne peuvent pas être identiques !",
                                      "warning",
                                    );
                                  }
                                }}
                              >
                                <option value="none">
                                  Aucun acte supplémentaire
                                </option>
                                {getFilteredActesForRole(
                                  dbState.actes,
                                  currentUser?.Role || "Admin",
                                )
                                  .filter(
                                    (act) =>
                                      ![
                                        "Consultation Adulte",
                                        "Consultation Enfant",
                                        "Contrôle",
                                        "Intensif",
                                      ].includes(act.Libelle_Acte),
                                  )
                                  .map((act) => (
                                    <option
                                      key={act.ID_Acte}
                                      value={act.ID_Acte}
                                    >
                                      {act.Libelle_Acte}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-500 font-medium leading-relaxed mt-2 p-2 bg-emerald-50/20 rounded border border-emerald-100/20">
                            💡 L'activation immédiate d'un pack à l'admission
                            permet au secrétariat de valider les premières
                            séances du patient sans avoir besoin d'ouvrir sa
                            fiche ultérieurement.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                        ❌ Aucun abonnement de soins n'est configuré pour
                        l'admission immédiate. Le patient sera enregistré avec
                        un statut "Sans Abonnement Actif".
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. ONGLET : DOSSIER MÉDICAL */}
                {addPatientTab === "medical" && (
                  <motion.div
                    key="tab-medical"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-rose-100/60">
                      <ClipboardList className="w-4.5 h-4.5 text-rose-600" />
                      <div>
                        <h4 className="text-[11px] font-black text-rose-950 uppercase tracking-widest leading-none">
                          Dossier Médical Initial (Admin &amp; MPR)
                        </h4>
                        <span className="text-[8px] text-rose-600 font-bold uppercase tracking-wider">
                          Affectation et facteurs cliniques
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[8px] font-black text-slate-500 mb-1 uppercase tracking-wider">
                            Service d'Affectation Initiale
                          </label>
                          <select
                            className="w-full bg-rose-50/40 hover:bg-rose-50 border border-rose-100 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                            value={affectation}
                            onChange={(e) => setAffectation(e.target.value)}
                          >
                            {genre !== "Enfant" ? (
                              <>
                                <option value="Sce Réeducation Adulte">
                                  Sce Réadaptation Adulte
                                </option>
                                <option value="Sce Balnéothérapie">
                                  Sce Balnéothérapie
                                </option>
                              </>
                            ) : (
                              <>
                                <option value="Intensif 2e">
                                  Intensif (2e Étage - Pédiatrie)
                                </option>
                                <option value="Intensif 3e">
                                  Intensif (3e Étage - Pédiatrie)
                                </option>
                                <option value="Intensif 4e">
                                  Intensif (4e Étage - Pédiatrie)
                                </option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-black text-slate-500 mb-1 uppercase tracking-wider">
                            Antécédents Mises en Évidence
                          </label>
                          <input
                            type="text"
                            placeholder="Traumatismes antérieurs, Chirurgies, AVC, Neurologie..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-rose-505 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                            value={antecedents}
                            onChange={(e) => setAntecedents(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black text-slate-500 mb-1 uppercase tracking-wider">
                          Orientation &amp; Diagnostic Clinique du Médecin MPR
                        </label>
                        <textarea
                          placeholder="Saisissez ici les observations initiales du Médecin MPR ou les détails de l'ordonnance d'orientation..."
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-rose-505 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none resize-none"
                          value={newPatientNotesMpr}
                          onChange={(e) =>
                            setNewPatientNotesMpr(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. ONGLET : HISTORIQUE SÉANCES */}
                {addPatientTab === "sessions" && (
                  <motion.div
                    key="tab-sessions"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-xs p-8 text-center space-y-3"
                  >
                    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-sky-100">
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                        Chronologie Séances de Soins
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                        Espace de suivi technique activité
                      </p>
                    </div>
                    <div className="max-w-md mx-auto p-4 bg-sky-50/30 rounded-2xl border border-sky-100/50 text-[11px] text-slate-600 font-semibold leading-relaxed">
                      Aucune séance enregistrée pour ce patient. L'historique
                      des séances d'activité se remplira automatiquement chaque
                      fois qu'une séance est enregistrée de manière sécurisée
                      dans nos plateaux techniques de réhabilitation
                      (Rééducation Fonctionnelle, Balnéothérapie, Soin Intensif,
                      Orthophonie ou Psychomotricité).
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Barre de validation administrative */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingPatient(false);
                      setSelectedPatient(null);
                    }}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-extrabold text-xs tracking-wider py-2 px-4 shadow-2xs transition"
                  >
                    <List className="w-3.5 h-3.5 text-slate-500" />
                    <span>Liste des Patients</span>
                  </button>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide hidden lg:flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block"></span>
                    Renseignez tous les onglets pour une création de dossier optimale.
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddingPatient(false)}
                    className="w-full sm:w-auto bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 rounded-xl font-extrabold text-xs tracking-wider py-2 px-4 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl py-3 px-6 shadow-md shadow-teal-500/15 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valider l'Admission Administrative
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!selectedPatient && !isAddingPatient && (
          <div className="space-y-4">
            {/* Barre de Navigation Principale */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveView('patients')}
                className={`px-4 py-2 rounded-xl font-extrabold uppercase text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeView !== 'cashReport'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                👥 Patients
              </button>
              <button
                type="button"
                onClick={() => setActiveView('cashReport')}
                className={`px-4 py-2 rounded-xl font-extrabold uppercase text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'cashReport'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📊 Rapport Caisse
              </button>
            </div>

            {activeView === 'cashReport' ? (
              <CashReport dbState={dbState} />
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-white border-b border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border border-teal-100">
                      Registre Clinique
                    </span>
                    <span className="text-teal-500 text-[10px] font-bold">Identité &amp; Dossiers</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Registre des Admissions Cliniques
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Consultez l'historique complet des dossiers d'admission, l'état d'affectation et les informations d'identité.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl">
                    {filteredPatients.length} Patients
                  </span>
                  {(searchTerm ||
                    filterPatientName ||
                    filterPatientArb ||
                    filterPatientAge.length > 0 ||
                    filterTypePat.length > 0 ||
                    filterPhoneInput ||
                    filterWilaya.length > 0 ||
                    filterNbreAbn.length > 0 ||
                    filterAffectation.length > 0 ||
                    filterFirstConsultDate.length > 0 ||
                    filterOrientation.length > 0) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterPatientName("");
                        setFilterPatientArb("");
                        setFilterPatientAge([]);
                        setFilterTypePat([]);
                        setFilterPhoneInput("");
                        setFilterWilaya([]);
                        setFilterNbreAbn([]);
                        setFilterAffectation([]);
                        setFilterFirstConsultDate([]);
                        setFilterOrientation([]);
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
                    onClick={() => {
                      if (onGoBack) onGoBack();
                      else setIsAddingPatient(false);
                    }}
                    className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-extrabold uppercase text-xs py-1.5 px-3.5 shadow-2xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Retour</span>
                  </button>

                  {!isConsultationOnly && (currentUser.Role === "Admin" || currentUser.Role === "Receptionniste RDC" || currentUser.Role === "SupperRec") && (
                    <button
                      id="btn-trigger-add-patient-view"
                      onClick={handleTriggerAddPatient}
                      className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-extrabold uppercase text-xs shadow-md shadow-teal-500/15 py-1.5 px-3.5 transition flex items-center gap-2 cursor-pointer animate-pulse"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Admission Patient</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Échelle de taille des caractères */}
                  <div
                    className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200"
                    title="Ajuster la taille des caractères du tableau"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Échelle :
                    </span>
                    <select
                      value={tableFontSize}
                      onChange={(e) => setTableFontSize(e.target.value as any)}
                      className="bg-transparent border-none p-0 text-[10px] font-black text-slate-600 focus:outline-none cursor-pointer"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Recherche rapide (patient, téléphone, pseudo)..."
                      className="w-full md:w-64 bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition font-semibold"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveRowIndex((prev) => {
                            if (paginatedPatients.length === 0) return -1;
                            return (prev + 1) % paginatedPatients.length;
                          });
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveRowIndex((prev) => {
                            if (paginatedPatients.length === 0) return -1;
                            return (prev - 1 + paginatedPatients.length) % paginatedPatients.length;
                          });
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (activeRowIndex >= 0 && paginatedPatients[activeRowIndex]) {
                            setSelectedPatient(paginatedPatients[activeRowIndex]);
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

              {/* Dynamic scaling stylesheet */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
          .scaled-table-patient {
            --table-scale: ${parseInt(tableFontSize) / 100};
          }
          .scaled-table-patient .text-\\[9\\.5px\\] { font-size: calc(9.5px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[9px\\] { font-size: calc(9px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[8\\.5px\\] { font-size: calc(8.5px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[8px\\] { font-size: calc(8px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[7\\.5px\\] { font-size: calc(7.5px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[7px\\] { font-size: calc(7px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[6\\.5px\\] { font-size: calc(6.5px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[10px\\] { font-size: calc(10px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[11px\\] { font-size: calc(11px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[12px\\] { font-size: calc(12px * var(--table-scale)) !important; }
          .scaled-table-patient .text-\\[13px\\] { font-size: calc(13px * var(--table-scale)) !important; }
          .scaled-table-patient thead tr th { font-size: calc(10.5px * var(--table-scale)) !important; }
          .scaled-table-patient thead tr th span { font-size: calc(10.5px * var(--table-scale)) !important; }
        `,
                }}
              />

              <div
                ref={tableContainerRef}
                onScroll={handleTableScroll}
                className="overflow-x-auto relative custom-scrollbar-horizontal pb-4 shadow-sm rounded-xl border border-slate-200 bg-white/50"
              >
                <table
                  className={`w-full text-left border-separate border-spacing-0 scaled-table-patient min-w-[1050px]`}
                >
                  <thead>
                    <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] font-sans">
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 pl-5 w-[60px] text-slate-500 border-b border-slate-200">
                        Sél.
                      </th>

                      {/* 1. Patient (Nom/Prénom) - NON UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 min-w-[150px] relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span>Patient (Nom/Prénom)</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "nom_patient"
                                  ? null
                                  : "nom_patient",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterPatientName ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "nom_patient" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "nom_patient" && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in slide-in-from-top-1 text-left normal-case">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Recherche prédictive (Contient)
                              </span>
                              {filterPatientName && (
                                <button
                                  type="button"
                                  onClick={() => setFilterPatientName("")}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                autoFocus
                                type="text"
                                placeholder="Rechercher par nom..."
                                value={filterPatientName}
                                onChange={(e) =>
                                  setFilterPatientName(e.target.value)
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
                              />
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 2. Nom Arabe - NON UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 text-right min-w-[125px] relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "nom_arabe"
                                  ? null
                                  : "nom_arabe",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterPatientArb ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "nom_arabe" ? "rotate-180" : ""}`}
                            />
                          </button>
                          <span>Nom Arabe</span>
                        </div>
                        {activeFilterMenu === "nom_arabe" && (
                          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in slide-in-from-top-1 text-right normal-case">
                            <div className="flex items-center justify-between mb-2">
                              {filterPatientArb && (
                                <button
                                  type="button"
                                  onClick={() => setFilterPatientArb("")}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  مسح
                                </button>
                              )}
                              <span className="text-[10px] font-bold text-slate-500">
                                البحث بالاسم العربي
                              </span>
                            </div>
                            <input
                              autoFocus
                              type="text"
                              dir="rtl"
                              placeholder="..."
                              value={filterPatientArb}
                              onChange={(e) =>
                                setFilterPatientArb(e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-[11px] focus:outline-none focus:border-indigo-500 font-bold"
                            />
                          </div>
                        )}
                      </th>

                      {/* 3. Âge - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-3 px-2.5 relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span>Âge</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "age" ? null : "age",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterPatientAge.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "age" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "age" && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Filtrer par Âge
                              </span>
                              {filterPatientAge.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setFilterPatientAge([])}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer ({filterPatientAge.length})
                                </button>
                              )}
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                              {(() => {
                                const ageCounts = patientsWithDetails.reduce(
                                  (acc, item) => {
                                    if (checkMatchesPat(item, "age")) {
                                      const val = item.patAge;
                                      acc[val] = (acc[val] || 0) + 1;
                                    }
                                    return acc;
                                  },
                                  {} as Record<number, number>,
                                );
                                const uniqueAges = Object.keys(ageCounts)
                                  .map(Number)
                                  .sort((a, b) => a - b);

                                return uniqueAges.map((ageVal) => (
                                  <label
                                    key={`filter-age-${ageVal}`}
                                    className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filterPatientAge.includes(
                                        ageVal,
                                      )}
                                      onChange={(e) => {
                                        if (e.target.checked)
                                          setFilterPatientAge([
                                            ...filterPatientAge,
                                            ageVal,
                                          ]);
                                        else
                                          setFilterPatientAge(
                                            filterPatientAge.filter(
                                              (v) => v !== ageVal,
                                            ),
                                          );
                                      }}
                                      className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                    />
                                    <span>
                                      {ageVal} ans ({ageCounts[ageVal]})
                                    </span>
                                  </label>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 4. Type Patient - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-3 px-2.5 relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span>Type Patient</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "type_patient"
                                  ? null
                                  : "type_patient",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterTypePat.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "type_patient" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "type_patient" && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Filtrer par Type
                              </span>
                              {filterTypePat.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setFilterTypePat([])}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                            <div className="space-y-1 p-1">
                              {(() => {
                                const typePatCounts =
                                  patientsWithDetails.reduce(
                                    (acc, item) => {
                                      if (checkMatchesPat(item, "typePat")) {
                                        const val =
                                          item.p.type_patient || "Adulte";
                                        acc[val] = (acc[val] || 0) + 1;
                                      }
                                      return acc;
                                    },
                                    {} as Record<string, number>,
                                  );
                                const uniqueTypePats =
                                  Array.from(new Set([...(dbState.typesPatients || ["Adulte", "Enfant", "Enfant IMC"]), ...Object.keys(typePatCounts)])).sort();

                                return uniqueTypePats.map((val) => (
                                  <label
                                    key={`filter-type-${val}`}
                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-medium text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filterTypePat.includes(val)}
                                      onChange={(e) => {
                                        if (e.target.checked)
                                          setFilterTypePat([
                                            ...filterTypePat,
                                            val,
                                          ]);
                                        else
                                          setFilterTypePat(
                                            filterTypePat.filter(
                                              (v) => v !== val,
                                            ),
                                          );
                                      }}
                                      className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                    />
                                    <span>
                                      {val} ({typePatCounts[val]})
                                    </span>
                                  </label>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 5. Téléphone - NON UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-3 px-2.5 relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span>Téléphone</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "phone" ? null : "phone",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterPhoneInput ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "phone" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "phone" && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Recherche de téléphone
                              </span>
                              {filterPhoneInput && (
                                <button
                                  type="button"
                                  onClick={() => setFilterPhoneInput("")}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                            <input
                              autoFocus
                              type="text"
                              placeholder="Rechercher par tel..."
                              value={filterPhoneInput}
                              onChange={(e) =>
                                setFilterPhoneInput(e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10.5px] focus:outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                            />
                          </div>
                        )}
                      </th>

                      {/* 6. Wilaya - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-3 px-2.5 relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span>Wilaya</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "wilaya" ? null : "wilaya",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterWilaya.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "wilaya" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "wilaya" && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500 font-sans">
                                Filtrer par Wilaya
                              </span>
                              {filterWilaya.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setFilterWilaya([])}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer ({filterWilaya.length})
                                </button>
                              )}
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                              {(() => {
                                const wilayaCounts = patientsWithDetails.reduce(
                                  (acc, item) => {
                                    if (checkMatchesPat(item, "wilaya")) {
                                      const val = item.p.wilaya || "";
                                      acc[val] = (acc[val] || 0) + 1;
                                    }
                                    return acc;
                                  },
                                  {} as Record<string, number>,
                                );
                                const uniqueWilayas =
                                  Object.keys(wilayaCounts).sort();

                                return uniqueWilayas.map((wCode) => {
                                  const label = getWilayaLabel(wCode);
                                  return (
                                    <label
                                      key={`filter-wilaya-${wCode}`}
                                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] normal-case text-slate-700"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={filterWilaya.includes(wCode)}
                                        onChange={(e) => {
                                          if (e.target.checked)
                                            setFilterWilaya([
                                              ...filterWilaya,
                                              wCode,
                                            ]);
                                          else
                                            setFilterWilaya(
                                              filterWilaya.filter(
                                                (v) => v !== wCode,
                                              ),
                                            );
                                        }}
                                        className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                      />
                                      <span>
                                        {label} ({wilayaCounts[wCode]})
                                      </span>
                                    </label>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 7. Nbre Abonnement - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 text-center min-w-[80px] relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-500">Abn.</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "nbre_abonnement"
                                  ? null
                                  : "nbre_abonnement",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterNbreAbn.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "nbre_abonnement" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "nbre_abonnement" && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500-sans">
                                Filtrer par Forfaits
                              </span>
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
                            <div className="space-y-1 max-h-48 overflow-y-auto p-1 text-slate-700">
                              {(() => {
                                const nbreAbnCounts =
                                  patientsWithDetails.reduce(
                                    (acc, item) => {
                                      if (checkMatchesPat(item, "nbreAbn")) {
                                        const val = item.nbreAbn;
                                        acc[val] = (acc[val] || 0) + 1;
                                      }
                                      return acc;
                                    },
                                    {} as Record<number, number>,
                                  );
                                const uniqueNbreAbns = Object.keys(
                                  nbreAbnCounts,
                                )
                                  .map(Number)
                                  .sort((a, b) => a - b);

                                return uniqueNbreAbns.map((val) => (
                                  <label
                                    key={`filter-nbre-ab-${val}`}
                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filterNbreAbn.includes(val)}
                                      onChange={(e) => {
                                        if (e.target.checked)
                                          setFilterNbreAbn([
                                            ...filterNbreAbn,
                                            val,
                                          ]);
                                        else
                                          setFilterNbreAbn(
                                            filterNbreAbn.filter(
                                              (v) => v !== val,
                                            ),
                                          );
                                      }}
                                      className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                    />
                                    <span>
                                      {val}{" "}
                                      {val > 1 ? "abonnements" : "abonnement"} (
                                      {nbreAbnCounts[val]})
                                    </span>
                                  </label>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 8. Affectation - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 min-w-[130px] relative group/th border-b border-slate-200">
                        <div className="flex items-center justify-between gap-1">
                          <span>Affectation</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "affectation"
                                  ? null
                                  : "affectation",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterAffectation.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "affectation" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "affectation" && (
                          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Filtrer par Affectation
                              </span>
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
                            <div className="space-y-1 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                              {(() => {
                                const affectationCounts =
                                  patientsWithDetails.reduce(
                                    (acc, item) => {
                                      if (
                                        checkMatchesPat(item, "affectation")
                                      ) {
                                        const val = item.patAffectation;
                                        acc[val] = (acc[val] || 0) + 1;
                                      }
                                      return acc;
                                    },
                                    {} as Record<string, number>,
                                  );
                                const uniqueAffectations =
                                  Object.keys(affectationCounts).sort();

                                return uniqueAffectations.map((val) => (
                                  <label
                                    key={`filter-aff-${val}`}
                                    className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={filterAffectation.includes(val)}
                                      onChange={(e) => {
                                        if (e.target.checked)
                                          setFilterAffectation([
                                            ...filterAffectation,
                                            val,
                                          ]);
                                        else
                                          setFilterAffectation(
                                            filterAffectation.filter(
                                              (v) => v !== val,
                                            ),
                                          );
                                      }}
                                      className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                    />
                                    <span>
                                      {val} ({affectationCounts[val]})
                                    </span>
                                  </label>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 9. 1ère Consult - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 min-w-[130px] border-b border-slate-200 relative group/th">
                        <div className="flex items-center justify-between gap-1">
                          <span>1ère Consult.</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "firstConsultDate"
                                  ? null
                                  : "firstConsultDate",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterFirstConsultDate.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "firstConsultDate" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "firstConsultDate" && (
                          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Filtrer 1ère Consult.
                              </span>
                              {filterFirstConsultDate.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setFilterFirstConsultDate([])}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                              {consultDateOptions.map((opt) => (
                                <label
                                  key={`filter-consult-${opt.value}`}
                                  className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterFirstConsultDate.includes(opt.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFilterFirstConsultDate((prev) => [...prev, opt.value]);
                                      } else {
                                        setFilterFirstConsultDate((prev) =>
                                          prev.filter((v) => v !== opt.value),
                                        );
                                      }
                                    }}
                                    className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                  />
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>

                      {/* 10. Orientation - UNIFORME */}
                      <th className="sticky top-0 z-30 bg-slate-50 py-2 px-1.5 min-w-[140px] border-b border-slate-200 relative group/th">
                        <div className="flex items-center justify-between gap-1">
                          <span>Orientation</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(
                                activeFilterMenu === "orientation"
                                  ? null
                                  : "orientation",
                              );
                            }}
                            className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${filterOrientation.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${activeFilterMenu === "orientation" ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                        {activeFilterMenu === "orientation" && (
                          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-top-1 text-left normal-case text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 px-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                Filtrer Orientation
                              </span>
                              {filterOrientation.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setFilterOrientation([])}
                                  className="text-[9px] font-bold text-rose-500 hover:underline"
                                >
                                  Effacer
                                </button>
                              )}
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                              {orientationOptions.map((opt) => (
                                <label
                                  key={`filter-orient-${opt.value}`}
                                  className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-semibold text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterOrientation.includes(opt.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFilterOrientation((prev) => [...prev, opt.value]);
                                      } else {
                                        setFilterOrientation((prev) =>
                                          prev.filter((v) => v !== opt.value),
                                        );
                                      }
                                    }}
                                    className="h-3 w-3 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                                  />
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-10 text-slate-400 italic"
                          >
                            Aucun patient ne correspond à vos filtres de recherche.
                            {(currentUser.Role === "Admin" || currentUser.Role === "Receptionniste RDC" || currentUser.Role === "SupperRec") && " Autrement, cliquez sur \"+ Admission Patient\"."}
                          </td>
                        </tr>
                      ) : (
                        paginatedPatients.map((p, idx) => {
                          const isChecked = checkedPatientIds.includes(
                            p.ID_Patient,
                          );
                          const pType = p.type_patient || "Adulte";
                          const detail = patientsWithDetails.find(
                            (d) => d.p.ID_Patient === p.ID_Patient,
                          ) || { firstConsultDate: null, orientationLabels: [] };
                          return (
                            <tr
                              key={`patient-row-${p.ID_Patient}-${idx}`}
                              onClick={() => setSelectedPatient(p)}
                              className={`cursor-pointer transition duration-150 border-b border-slate-100 text-slate-700 hover:bg-slate-50/60 ${
                                idx === activeRowIndex
                                  ? "bg-teal-50/80 text-teal-950 font-extrabold shadow-inner"
                                  : idx % 2 === 0
                                    ? "bg-white"
                                    : "bg-slate-50/30"
                              }`}
                            >
                              <td className="py-2.5 px-2 pl-4 flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCheckedPatientIds((prev) => [
                                        ...prev,
                                        p.ID_Patient,
                                      ]);
                                    } else {
                                      setCheckedPatientIds((prev) =>
                                        prev.filter(
                                          (id) => id !== p.ID_Patient,
                                        ),
                                      );
                                    }
                                  }}
                                  className="h-5 w-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500 cursor-pointer accent-teal-500"
                                />
                                {isChecked && !isConsultationOnly && hasPermission(currentUser?.Role, 'fiche_patient', 'canDelete') && (
                                  <button
                                    id={`delete-pat-checked-${p.ID_Patient}`}
                                    onClick={(e) => {
                                      handleDeletePatient(p.ID_Patient, e);
                                      setCheckedPatientIds((prev) =>
                                        prev.filter(
                                          (id) => id !== p.ID_Patient,
                                        ),
                                      );
                                    }}
                                    className="p-1 text-rose-600 hover:text-rose-850 hover:bg-rose-50/80 rounded border border-rose-100 shadow-3xs transition cursor-pointer flex items-center justify-center"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-slate-800 text-[11px] font-semibold">
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                      p.Genre_Patient === "Homme"
                                        ? "bg-indigo-50 text-indigo-700"
                                        : p.Genre_Patient === "Femme"
                                          ? "bg-rose-50 text-rose-700"
                                          : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {p.Nom_Patient.charAt(0)}
                                  </span>
                                  <div className="truncate max-w-[120px]">
                                    <span className="block text-slate-900 group-hover:text-indigo-600 transition truncate font-bold font-sans text-[11px] leading-tight">
                                      {p.Nom_Patient}
                                    </span>
                                    <span className="block font-mono text-[8px] text-slate-400 font-bold scale-90 origin-left">
                                      #0{p.ID_Patient}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="py-2.5 px-2 font-sans text-right"
                                dir="rtl"
                              >
                                {p.Pren_Pat_Arb || p.Nom_Pat_Arb ? (
                                  <span className="bg-slate-50 text-slate-700 text-[10.5px] font-bold px-1 py-0.2 rounded border border-slate-100 inline-block truncate max-w-[90px]">
                                    {p.Pren_Pat_Arb || ""} {p.Nom_Pat_Arb || ""}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic text-[9.5px]">
                                    N/T
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 font-sans text-slate-600 text-[11px]">
                                {getPatientAge(p)} a.
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`px-1 rounded text-[9.5px] font-bold border ${
                                    p.type_patient === "Adulte"
                                      ? "bg-slate-50 text-slate-600 border-slate-200"
                                      : p.type_patient === "Enfant"
                                        ? "bg-cyan-50 text-cyan-800 border-cyan-100"
                                        : "bg-emerald-50 text-emerald-800 border-emerald-100"
                                  }`}
                                >
                                  {p.type_patient === "Enfant IMC"
                                    ? "E-IMC"
                                    : p.type_patient === "Adulte"
                                      ? "Ad."
                                      : "Enf."}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 font-mono text-slate-500 font-bold text-[10px] whitespace-nowrap">
                                {p.phone}
                              </td>
                              <td className="py-2.5 px-2 font-medium text-slate-500 text-[10px] truncate max-w-[70px]">
                                {getWilayaLabel(p.wilaya)
                                  .split(" ")
                                  .slice(1)
                                  .join(" ")}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="inline-block bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 font-black text-[10px] font-mono">
                                  {p.Nbre_Abn_Pat ?? 0}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-[10.5px] font-bold text-indigo-650 pr-3 truncate max-w-[90px]">
                                {getPatientAffectation(p) || (
                                  <span className="text-slate-300 italic text-[9.5px]">
                                    N/A
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-2 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                                {detail.firstConsultDate || <span className="text-slate-300 italic">—</span>}
                              </td>
                              <td className="py-2.5 px-2">
                                {detail.orientationLabels.length === 0 ? (
                                  <span className="text-slate-300 italic text-[9.5px]">—</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {detail.orientationLabels.map((label, idx) => (
                                      <span key={idx} className="inline-block bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-100">
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* CELLULE VIDE POUR ALIGNEMENT BOUTON TOGGLE */}
                              <td className="py-2.5 px-2"></td>
                            </tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Barre de défilement intelligente & Sticky en bas de l'écran */}
              <div
                ref={stickyScrollRef}
                onScroll={handleStickyScroll}
                className="overflow-x-auto overflow-y-hidden sticky bottom-0 z-40 bg-slate-100/90 backdrop-blur-xs border-y border-slate-200 h-3 shadow-md flex items-center md:hidden-scrollbar"
                style={{ position: "sticky", bottom: 1 }}
              >
                <div
                  style={{ width: `${tableScrollWidth}px`, height: "1px" }}
                />
              </div>
            </div>

            {/* PAGINATION ZONE */}
            {totalPages >= 1 && (
              <div className="bg-white px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 rounded-2xl shadow-sm text-xs font-sans mt-4">
                <div className="text-slate-500 font-medium">
                  Affichage de{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredPatients.length === 0 ? 0 : Math.min(
                      filteredPatients.length,
                      (currentPage - 1) * itemsPerPage + 1,
                    )}
                  </span>{" "}
                  à{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(
                      filteredPatients.length,
                      currentPage * itemsPerPage,
                    )}
                  </span>{" "}
                  sur{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredPatients.length}
                  </span>{" "}
                  patients ({totalPages} {totalPages > 1 ? "pages" : "page"})
                </div>

                <div className="flex items-center justify-center">
                  <div 
                    className="inline-flex rounded-2xl shadow-3xs bg-slate-50 p-1.5 border border-slate-200/80 gap-1.5 flex-wrap justify-center"
                    id="patients-aligned-10-btn-pagination"
                  >
                    {/* 1er Bouton "Précédant" */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border border-slate-200 hover:border-slate-300 disabled:opacity-30 disabled:hover:border-transparent cursor-pointer disabled:cursor-not-allowed select-none bg-white text-slate-700 shadow-3xs hover:bg-slate-50"
                      id="patients-pg-btn-prev"
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
                          key={`patients-pg-slot-${index}`}
                          type="button"
                          onClick={() => !slot.isDisabled && setCurrentPage(slot.page)}
                          disabled={slot.isDisabled}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 min-w-[36px] text-center border ${
                            slot.isDisabled 
                              ? "bg-slate-100 border-transparent text-slate-300 cursor-not-allowed select-none"
                              : currentPage === slot.page
                                ? "bg-teal-600 border-teal-600 text-white font-black shadow-sm shrink-0 scale-105"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer hover:border-slate-300"
                          }`}
                          id={`patients-pg-btn-slot-${index + 1}`}
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
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border border-slate-200 hover:border-slate-300 disabled:opacity-30 disabled:hover:border-transparent cursor-pointer disabled:cursor-not-allowed select-none bg-white text-slate-700 shadow-3xs hover:bg-slate-50"
                      id="patients-pg-btn-next"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EXPLICATION - PLACÉE EN DESSOUS DU TABLEAU */}
            <div className="bg-indigo-50/40 rounded-xl border border-indigo-100 p-4 shadow-xs text-center">
              <p className="text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                Consulter les dossiers administratifs complets, abonnements et
                l'historique complet des soins
              </p>
            </div>
              </>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: CLINICAL SHEET PATIENT FOLDER VIEW */}
      <AnimatePresence>
        {selectedPatient &&
          (() => {
            const isAdminOrReceptionistRDC =
              currentUser.Role === "Admin" ||
              currentUser.Role === "Receptionniste RDC" ||
              currentUser.Role === "SupperRec";
            const canEditMedical = currentUser.Role === "Médecin MPR";

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="bg-white rounded-3xl w-full max-w-4xl border border-slate-150 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                  {/* En-tête de fenêtre peinte avec la couleur #606C5A */}
                  <div
                    style={{ backgroundColor: "#606C5A" }}
                    className="p-4 text-white flex items-center justify-between font-sans border-b border-white/10 shrink-0"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-slate-100" />
                      <div>
                        <h3 className="font-extrabold text-xs uppercase tracking-wider">
                          Fiche Clinique & Dossier Patient complet
                        </h3>
                        <p className="text-[10px] text-slate-200">
                          Consulter l'identité complète, l'historique de soins,
                          les abonnements et les règlements.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClosePatientFiche}
                      className="p-1 px-3 bg-white/10 hover:bg-white/20 transition rounded-lg text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer"
                    >
                      ✕ Fermer
                    </button>
                  </div>

                  {/* Patient Profile / Medical-Admin Banner with premium styling */}
                  <div
                    className={`p-6 border-b transition-all duration-300 ${
                      isAdminOrReceptionistRDC
                        ? "bg-linear-to-br from-[#709CA7]/8 to-slate-100/50"
                        : "bg-linear-to-br from-indigo-50/20 via-slate-50/80 to-slate-100/30"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/55">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-slate-100/90 backdrop-blur-xs text-slate-800 text-[10.5px] font-extrabold uppercase tracking-wider rounded-lg border border-slate-250/70 font-mono">
                          Code: PAT_#0{selectedPatient.ID_Patient}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[11px] font-bold text-slate-500 font-sans tracking-wide">
                            {isAdminOrReceptionistRDC
                              ? "✍️ Mode Édition Administrative"
                              : "🔒 Fiche Patient en Consultation"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Patient Category Badge strictly matching requested colors */}
                        <div className="flex items-center gap-2">
                          {selectedPatient.type_patient === "Adulte" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#709CA7]/15 text-[#2B4B52] border border-[#709CA7]/40 rounded-full text-xs font-bold leading-none">
                              <span className="w-2 h-2 rounded-full bg-[#709CA7]"></span>
                              <span>Adulte</span>
                            </span>
                          )}
                          {selectedPatient.type_patient === "Enfant IMC" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B8CBD0]/20 text-[#3F5054] border border-[#B8CBD0]/50 rounded-full text-xs font-bold leading-none">
                              <span className="w-2 h-2 rounded-full bg-[#B8CBD0]"></span>
                              <span>Enfant IMC</span>
                            </span>
                          )}
                          {selectedPatient.type_patient === "Enfant" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7A90A4]/15 text-[#243545] border border-[#7A90A4]/40 rounded-full text-xs font-bold leading-none">
                              <span className="w-2 h-2 rounded-full bg-[#7A90A4]"></span>
                              <span>Enfant</span>
                            </span>
                          )}
                        </div>

                        {currentUser.Role !== "Receptionniste RDC" && (
                          <button
                            onClick={handleClosePatientFiche}
                            className="p-1 px-2.5 rounded-lg transition text-xs font-bold bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 cursor-pointer"
                          >
                            ✕ Fermer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Resizable Two-Column Split Layout */}
                    <div className="flex flex-col md:flex-row items-stretch gap-0 border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm relative">
                      {/* Partie GAUCHE: Identité & État Civil */}
                      <div
                        style={{ width: `${upperSplitRatio}%` }}
                        className="w-full md:min-w-[25%] p-5 border-b md:border-b-0 md:border-r border-slate-200 bg-white space-y-4"
                      >
                        <div className="border-b border-slate-100 pb-2 mb-1">
                          <h4 className="text-[11px] font-extrabold text-[#2B4B52] uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span>Identité &amp; État Civil</span>
                          </h4>
                        </div>

                        {isAdminOrReceptionistRDC ? (
                          <div className="space-y-4 text-xs">
                            <div>
                              <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                Nom complet (Français)
                              </label>
                              <input
                                type="text"
                                className="w-full bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none font-semibold transition animate-none"
                                value={editNom}
                                onChange={(e) => setEditNom(e.target.value.toUpperCase())}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Nom (Arabe)
                                </label>
                                <input
                                  type="text"
                                  dir="rtl"
                                  className="w-full bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none font-bold text-right transition animate-none"
                                  value={editNomArb}
                                  onChange={(e) =>
                                    setEditNomArb(e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Prénom (Arabe)
                                </label>
                                <input
                                  type="text"
                                  dir="rtl"
                                  className="w-full bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none font-bold text-right transition animate-none"
                                  value={editPrenomArb}
                                  onChange={(e) =>
                                    setEditPrenomArb(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editNom.trim()) return;
                                  const res = translateNameToArabic(editNom);
                                  setEditNomArb(res.Nom_Pat_Arb);
                                  setEditPrenomArb(res.Pren_Pat_Arb);
                                  triggerToast(
                                    "Champs arabe mis à jour",
                                    "success",
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#2B4B52] rounded-lg font-bold text-[9px] transition cursor-pointer shadow-xs border border-teal-200 uppercase tracking-widest font-mono"
                              >
                                🌐 Traduire en arabe
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Date de Naissance :
                                </label>
                                <input
                                  type="date"
                                  className="w-full bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-semibold font-mono transition animate-none"
                                  value={editDateNais}
                                  onChange={(e) => {
                                    setEditDateNais(e.target.value);
                                    if (e.target.value) {
                                      setEditAge(calculateAge(e.target.value));
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Âge (ans) :
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-bold font-mono transition animate-none"
                                  value={editAge}
                                  onChange={(e) =>
                                    setEditAge(Number(e.target.value) || 0)
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Genre / Sexe :
                                </label>
                                <select
                                  className="w-full bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-semibold transition"
                                  value={editGenre}
                                  onChange={(e) => {
                                    const nextGenre = e.target.value as
                                      | "Homme"
                                      | "Femme"
                                      | "Enfant";
                                    setEditGenre(nextGenre);
                                  }}
                                >
                                  <option value="Homme">Homme</option>
                                  <option value="Femme">Femme</option>
                                  <option value="Enfant">Enfant</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Type Patient :
                                </label>
                                <div className="flex gap-2">
                                  <select
                                    className="flex-1 bg-[#fcfdfd] border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.1 text-xs text-slate-900 focus:outline-none font-bold transition"
                                    value={editTypePat}
                                    onChange={(e) => setEditTypePat(e.target.value)}
                                  >
                                    {(dbState.typesPatients || [
                                      'Adulte',
                                      'Enfant',
                                      'Enfant IMC'
                                    ]).map((type) => (
                                      <option key={type} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={handleAddPatientType}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-xs"
                                    title="Ajouter un type"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            {editTypePat === "Enfant IMC" && (
                              <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl space-y-1 animate-fade-in mt-2">
                                <label className="block text-[10px] uppercase font-black text-amber-800 tracking-widest mb-1">
                                  Pseudo (Dédié Enfant IMC) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="EX: Petit Lion"
                                  className="w-full bg-transparent border-0 border-b border-amber-250 focus:border-amber-550 focus:ring-0 focus:outline-none px-0 py-1 text-xs text-slate-800 font-bold transition rounded-none animate-none"
                                  value={editPseudo}
                                  onChange={(e) => setEditPseudo(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          // Reading state Left side
                          <div className="space-y-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#606C5A] to-emerald-700 text-white flex items-center justify-center font-black text-xs shadow">
                                {selectedPatient.Nom_Patient?.charAt(
                                  0,
                                ).toUpperCase() || "P"}
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black font-mono">
                                  Nom complet
                                </span>
                                <h3 className="text-sm font-black text-slate-900">
                                  {selectedPatient.Nom_Patient}
                                </h3>
                              </div>
                            </div>

                            {(selectedPatient.Pren_Pat_Arb ||
                              selectedPatient.Nom_Pat_Arb) && (
                              <div
                                className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-right"
                                dir="rtl"
                              >
                                <span
                                  className="text-[10px] uppercase font-bold text-emerald-600 block mb-0.5"
                                  dir="ltr"
                                >
                                  Nom Arabe
                                </span>
                                <span className="text-xs font-black text-emerald-950">
                                  {selectedPatient.Pren_Pat_Arb}{" "}
                                  {selectedPatient.Nom_Pat_Arb}
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                                  Genre / Sexe
                                </span>
                                <span className="text-xs font-semibold text-slate-800">
                                  {selectedPatient.Genre_Patient === "Homme"
                                    ? "👨 Homme"
                                    : selectedPatient.Genre_Patient === "Femme"
                                      ? "👩 Femme"
                                      : "👶 Enfant"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                                  Type de Patient
                                </span>
                                <div className="flex flex-col gap-1">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#709CA7]/10 text-[#2B4B52] border border-[#709CA7]/25 self-start">
                                    {selectedPatient.type_patient}
                                  </span>
                                  {selectedPatient.type_patient === "Enfant IMC" && (
                                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-0.5">
                                      👤 Pseudo: <span className="font-black text-rose-600">{selectedPatient.Pseudo || "Non renseigné"}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                                  Âge certifié
                                </span>
                                <span className="text-xs font-black text-slate-900">
                                  {selectedPatient.Age_Patient || 30} ans
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                                  Date Naissance
                                </span>
                                <span className="text-xs font-semibold text-slate-600 font-mono">
                                  {selectedPatient.Date_Nais_Pat ||
                                    "Non précisée"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Draggable/Resizable Splitter handle for desktop */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const sX = e.clientX;
                          const sR = upperSplitRatio;
                          const moveHandler = (mE: MouseEvent) => {
                            const delta = mE.clientX - sX;
                            const updated = Math.max(
                              25,
                              Math.min(75, sR + (delta / 850) * 100),
                            );
                            setUpperSplitRatio(updated);
                          };
                          const upHandler = () => {
                            window.removeEventListener(
                              "mousemove",
                              moveHandler,
                            );
                            window.removeEventListener("mouseup", upHandler);
                          };
                          window.addEventListener("mousemove", moveHandler);
                          window.addEventListener("mouseup", upHandler);
                        }}
                        className="hidden md:flex flex-col items-center justify-center w-3 bg-slate-50 hover:bg-slate-200 border-x border-slate-200 cursor-col-resize select-none shrink-0 transition"
                        title="Glissez pour réajuster le séparateur"
                      >
                        <div className="w-1.5 h-16 bg-slate-300 rounded-full hover:bg-slate-400" />
                      </div>

                      {/* Partie DROITE: Coordonnées & Logistique + Affectation et le Bouton Enregistrer */}
                      <div
                        style={{ width: `${100 - upperSplitRatio}%` }}
                        className="w-full md:min-w-[25%] p-5 bg-slate-50/20 flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="border-b border-slate-100 pb-2 mb-3">
                            <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-indigo-500" />
                              <span>
                                Coordonnées &amp; Logistique + Affectation
                              </span>
                            </h4>
                          </div>

                          {isAdminOrReceptionistRDC ? (
                            <div className="space-y-3 px-0.5 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                    N° Téléphone :
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">
                                      📞
                                    </span>
                                    <input
                                      type="text"
                                      className="w-full pl-7 bg-white border border-slate-350 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-mono font-semibold transition animate-none"
                                      value={editPhone}
                                      onChange={(e) =>
                                        setEditPhone(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                    Wilaya :
                                  </label>
                                  <select
                                    className="w-full bg-white border border-slate-350 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none font-semibold transition"
                                    value={editWilaya}
                                    onChange={(e) =>
                                      setEditWilaya(e.target.value)
                                    }
                                  >
                                    {WILAYAS.map((w) => (
                                      <option key={w.code} value={w.code}>
                                        {w.code} - {w.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Adresse complète :
                                </label>
                                <input
                                  type="text"
                                  className="w-full bg-white border border-slate-350 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none font-semibold transition"
                                  value={editAddress}
                                  onChange={(e) =>
                                    setEditAddress(e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <label className="block text-slate-500 font-extrabold text-[9px] uppercase tracking-wider mb-1">
                                  Service d'Affectation du patient :
                                </label>
                                <select
                                  className="w-full bg-white border border-slate-350 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:outline-none transition cursor-pointer"
                                  value={editAffectation}
                                  onChange={(e) =>
                                    setEditAffectation(e.target.value)
                                  }
                                >
                                  {editGenre === "Homme" ||
                                  editGenre === "Femme" ? (
                                    <>
                                      <option value="Sce Réeducation Adulte">
                                        Sce Réeducation Adulte
                                      </option>
                                      <option value="Sce Balnéothérapie">
                                        Sce Balnéothérapie
                                      </option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="Intensif 2e">
                                        Intensif 2e
                                      </option>
                                      <option value="Intensif 3e">
                                        Intensif 3e
                                      </option>
                                      <option value="Intensif 4e">
                                        Intensif 4e
                                      </option>
                                    </>
                                  )}
                                </select>
                              </div>
                            </div>
                          ) : (
                            // Consultation state Right side
                            <div className="space-y-3 px-0.5 text-xs">
                              <div className="flex gap-2.5 items-start">
                                <span className="text-sm">📞</span>
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                                    Téléphone Mobile
                                  </span>
                                  <a
                                    href={`tel:${selectedPatient.phone}`}
                                    className="text-xs font-mono font-black text-slate-900 hover:text-indigo-600 transition"
                                  >
                                    {selectedPatient.phone || "Non renseigné"}
                                  </a>
                                </div>
                              </div>

                              <div className="flex gap-2.5 items-start">
                                <span className="text-sm">📍</span>
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                                    Adresse &amp; Wilaya
                                  </span>
                                  <span className="text-xs font-semibold text-slate-800">
                                    {selectedPatient.address ||
                                      "Adresse non rédigée"}{" "}
                                    (Wilaya :{" "}
                                    {getWilayaLabel(selectedPatient.wilaya)})
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2.5 items-start">
                                <span className="text-sm">🏢</span>
                                <div className="w-full bg-white p-2.5 rounded-lg border border-slate-150 shadow-2xs">
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block mb-1">
                                    Service d'Affectation
                                  </span>
                                  <select
                                    className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-250 focus:border-indigo-500 rounded-md px-2 py-1 text-xs text-purple-950 font-black focus:outline-none transition cursor-pointer"
                                    value={
                                      selectedPatient.Affect_Pat_IMC ||
                                      selectedPatient.affectation ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const fresh = { ...dbState };
                                      const patIdx = fresh.patients.findIndex(
                                        (p) =>
                                          p.ID_Patient ===
                                          selectedPatient.ID_Patient,
                                      );
                                      if (patIdx !== -1) {
                                        fresh.patients[patIdx] = {
                                          ...fresh.patients[patIdx],
                                          Affect_Pat_IMC: val || undefined,
                                          affectation: val || undefined,
                                        };
                                        onSave(fresh);
                                        triggerToast(
                                          val
                                            ? `Affectation du patient mise à jour : ${val}`
                                            : "Affectation du patient réinitialisée (Non Affecté)",
                                          "success",
                                        );
                                      }
                                    }}
                                  >
                                    <option value="">-- Non Affecté --</option>
                                    {selectedPatient.Genre_Patient ===
                                      "Homme" ||
                                    selectedPatient.Genre_Patient ===
                                      "Femme" ? (
                                      <>
                                        <option value="Sce Réeducation Adulte">
                                          Sce Réeducation Adulte
                                        </option>
                                        <option value="Sce Balnéothérapie">
                                          Sce Balnéothérapie
                                        </option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="Intensif 2e">
                                          Intensif 2e
                                        </option>
                                        <option value="Intensif 3e">
                                          Intensif 3e
                                        </option>
                                        <option value="Intensif 4e">
                                          Intensif 4e
                                        </option>
                                      </>
                                    )}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Le Bouton Enregistrer / Statut lecture seule dans la partie droite */}
                        <div className="pt-2">
                          {isAdminOrReceptionistRDC ? (
                            <button
                              type="button"
                              onClick={handleSaveAdminInfo}
                              className="w-full text-white font-black text-xs py-2.5 px-4 rounded-xl transition shadow-lg bg-[#606C5A] hover:bg-[#4E5849] flex items-center justify-center gap-1.5 duration-150 cursor-pointer active:scale-[0.99]"
                            >
                              <span>💾 Enregistrer les Modifications</span>
                            </button>
                          ) : (
                            <div className="w-full p-2 rounded-xl bg-slate-100 border border-slate-200 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              🔒 Lecture Seule (Consultation)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TABS SELECTOR */}
                  <div className="flex border-b border-slate-100 bg-slate-50/50 flex-wrap">
                    {selectedPatient.type_patient === "Enfant IMC" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setFolderTab("fiche_pediatrique")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 cursor-pointer ${
                            folderTab === "fiche_pediatrique"
                              ? "border-rose-600 text-rose-700 bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <FileText className="w-4 h-4 text-rose-500" />
                          <span>1. Fiche d'évaluation pédiatrique</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFolderTab("planning_previsionnel")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 cursor-pointer ${
                            folderTab === "planning_previsionnel"
                              ? "border-indigo-600 text-indigo-700 bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>2. Planning prévisionnel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFolderTab("subscriptions")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 cursor-pointer ${
                            folderTab === "subscriptions"
                              ? "border-[#606C5A] text-slate-900 bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>3. Ses Abonnements</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFolderTab("seances_record")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 cursor-pointer ${
                            folderTab === "seances_record"
                              ? "border-[#606C5A] text-slate-900 bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>4. {selectedPatient?.type_patient === "Enfant IMC" || selectedPatient?.patient?.Type_Patient === "Enfant IMC" ? "Historique Hors Forfait" : "Historique Actes"}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {!hideMedicalDossierTab && (
                          <button
                            onClick={() => setFolderTab("medical_dossier")}
                            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 ${
                              folderTab === "medical_dossier"
                                ? "border-indigo-600 text-indigo-150 bg-white font-black"
                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <ClipboardList className="w-4 h-4" />
                            <span>Dossier Médical MPR</span>
                          </button>
                        )}

                        <button
                          onClick={() => setFolderTab("subscriptions")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 ${
                            folderTab === "subscriptions"
                              ? "border-indigo-600 text-indigo-650 bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Award className="w-4 h-4" />
                          <span>Ses Abonnements</span>
                        </button>

                        <button
                          onClick={() => setFolderTab("seances_record")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 ${
                            folderTab === "seances_record"
                              ? "border-[#606C5A] text-[#2B4B52] bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>{selectedPatient?.type_patient === "Enfant IMC" || selectedPatient?.patient?.Type_Patient === "Enfant IMC" ? "Historique Hors Forfait" : "Historique Actes"}</span>
                        </button>

                        <button
                          onClick={() => setFolderTab("facturation")}
                          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition duration-150 border-b-2 ${
                            folderTab === "facturation"
                              ? "border-blue-600 text-blue-700 bg-white font-black"
                              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Facturation</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* TABS CONTENT WITH HIGHLY SCROLLABLE DESIGNS */}
                  <div className="p-6 overflow-y-auto max-h-[600px] bg-slate-50/30 font-medium">
                    {/* TAB IMC 1: FICHE EVALUATION PEDIATRIQUE */}
                    {folderTab === "fiche_pediatrique" && selectedPatient && (
                      <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200">
                        <FicheEvaluationPediatrique
                          dbState={dbState}
                          onSave={onSave}
                          patient={selectedPatient}
                          triggerToast={triggerToast}
                          currentRole={currentUser.Role}
                        />
                      </div>
                    )}

                    {/* TAB IMC 2: PLANNING PREVISIONNEL */}
                    {folderTab === "planning_previsionnel" && selectedPatient && (
                      <div className="bg-slate-800 text-slate-100 p-4 rounded-2xl border border-slate-700 shadow-sm">
                        <PlanningPrevisionnelIMC
                          dbState={dbState}
                          onSave={onSave}
                          patient={selectedPatient}
                          triggerToast={triggerToast}
                          currentRole={currentUser.Role}
                        />
                      </div>
                    )}
                    {/* TAB 1: DOSSIER MEDICAL MPR */}
                    {folderTab === "medical_dossier" && (
                      <div className="space-y-6">
                        <DossierMedicalMPR
                          dbState={dbState}
                          onSave={onSave}
                          patient={selectedPatient}
                          triggerToast={triggerToast}
                          currentUser={currentUser}
                          canEditMedical={canEditMedical}
                        />

                        {/* Section Kine Automation Panel (Optionnelle) */}
                        <div className="space-y-2.5 border-t border-slate-200 pt-6">
                          <div className="flex items-center justify-between border-b pb-1">
                            <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider font-sans">
                              ⚙️ Automatisation de Prescription & Relational Engine
                            </h4>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              MCD SQL Rules Integrated
                            </span>
                          </div>
                          <KineAutomationPanel
                            patient={selectedPatient}
                            dbState={dbState}
                            onSave={onSave}
                            currentUser={currentUser}
                            canEditMedical={canEditMedical}
                            triggerToast={triggerToast}
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SES ABONNEMENTS */}
                    {folderTab === "subscriptions" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-widest">
                            Forfaits et Abonnements de Soins
                          </h4>
                          {currentUser.Role === "Admin" && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddAbnInline(!showAddAbnInline);
                                // Sync base packet in state
                                const firstPack =
                                  dbState.packs?.[0]?.ID_Pack || 1;
                                setNewAbnPackId(firstPack);
                                setNewAbnStartDate(getTodayString());
                                setNewAbnEndDate(
                                  getDatePlus30Days(getTodayString()),
                                );
                                setNewAbnAdd1("none");
                                setNewAbnAdd2("none");
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1 rounded transition max-w-max cursor-pointer self-end"
                            >
                              {showAddAbnInline ? "Fermer" : "+ Nouveau"}
                            </button>
                          )}
                        </div>

                        {/* INLINE ADMIN ABONNEMENT CREATOR */}
                        {currentUser.Role === "Admin" && showAddAbnInline && (
                          <div className="bg-slate-100 border border-slate-250 rounded-2xl p-4 shadow-sm space-y-3 text-slate-900">
                            <h5 className="font-extrabold text-[11px] text-indigo-950 uppercase tracking-wider">
                              💳 Création d'Abonnement (Admin)
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                  Pack Thérapeutique
                                </label>
                                <select
                                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                                  value={newAbnPackId}
                                  onChange={(e) =>
                                    setNewAbnPackId(Number(e.target.value))
                                  }
                                >
                                  {dbState.packs?.map((p) => (
                                    <option key={p.ID_Pack} value={p.ID_Pack}>
                                      {p.Libelle_Pack} ({p.Nbre_Seance_Pack}{" "}
                                      séances)
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                    Date Création
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full border border-slate-300 rounded p-1 font-semibold bg-white text-slate-800"
                                    value={newAbnDateAbn}
                                    onChange={(e) =>
                                      setNewAbnDateAbn(e.target.value)
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                    Date Début
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full border border-slate-300 rounded p-1 font-semibold bg-white"
                                    value={newAbnStartDate}
                                    onChange={(e) => {
                                      const nextStart = e.target.value;
                                      setNewAbnStartDate(nextStart);
                                      setNewAbnEndDate(
                                        getDatePlus30Days(nextStart),
                                      );
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                    Date Fin
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full border border-slate-300 rounded p-1 font-semibold bg-white"
                                    value={newAbnEndDate}
                                    onChange={(e) =>
                                      setNewAbnEndDate(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                  Acte Optionnel 1
                                </label>
                                <select
                                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold animate-none"
                                  value={newAbnAdd1}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewAbnAdd1(val);
                                    if (val !== "none" && val === newAbnAdd2) {
                                      setNewAbnAdd2("none");
                                      triggerToast(
                                        "Les deux actes optionnels ne peuvent pas être identiques !",
                                        "warning",
                                      );
                                    }
                                  }}
                                >
                                  <option value="none">Aucun</option>
                                  {getFilteredActesForRole(
                                    dbState.actes,
                                    currentUser?.Role || "Admin",
                                  )
                                    .filter(
                                      (act) =>
                                        ![
                                          "Consultation Adulte",
                                          "Consultation Enfant",
                                          "Contrôle",
                                          "Intensif",
                                        ].includes(act.Libelle_Acte),
                                    )
                                    .map((act) => (
                                      <option
                                        key={act.ID_Acte}
                                        value={act.ID_Acte}
                                      >
                                        {act.Libelle_Acte}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                  Acte Optionnel 2
                                </label>
                                <select
                                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold animate-none"
                                  value={newAbnAdd2}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewAbnAdd2(val);
                                    if (val !== "none" && val === newAbnAdd1) {
                                      setNewAbnAdd1("none");
                                      triggerToast(
                                        "Les deux actes optionnels ne peuvent pas être identiques !",
                                        "warning",
                                      );
                                    }
                                  }}
                                >
                                  <option value="none">Aucun</option>
                                  {getFilteredActesForRole(
                                    dbState.actes,
                                    currentUser?.Role || "Admin",
                                  )
                                    .filter(
                                      (act) =>
                                        ![
                                          "Consultation Adulte",
                                          "Consultation Enfant",
                                          "Contrôle",
                                          "Intensif",
                                        ].includes(act.Libelle_Acte),
                                    )
                                    .map((act) => (
                                      <option
                                        key={act.ID_Acte}
                                        value={act.ID_Acte}
                                      >
                                        {act.Libelle_Acte}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  newAbnAdd1 !== "none" &&
                                  newAbnAdd1 === newAbnAdd2
                                ) {
                                  triggerToast(
                                    "Erreur : l'acte optionnel 1 et l'acte optionnel 2 ne peuvent pas être identiques !",
                                    "error",
                                  );
                                  return;
                                }

                                const alreadyHasAbn = dbState.abonnements.find(
                                  (a) => {
                                    if (
                                      a.ID_Patient !==
                                      selectedPatient.ID_Patient
                                    )
                                      return false;
                                    return (
                                      (newAbnStartDate >= a.Date_Debut_Abn &&
                                        newAbnStartDate <= a.Date_Fin_Abn) ||
                                      (newAbnEndDate >= a.Date_Debut_Abn &&
                                        newAbnEndDate <= a.Date_Fin_Abn)
                                    );
                                  },
                                );
                                if (alreadyHasAbn) {
                                  triggerToast(
                                    "Attention : Ce patient dispose déjà d'un abonnement de soins chevauchant.",
                                    "error",
                                  );
                                }

                                const fresh = { ...dbState };
                                const nextId =
                                  fresh.abonnements.length > 0
                                    ? Math.max(
                                        ...fresh.abonnements.map(
                                          (a) => a.ID_Abn,
                                        ),
                                      ) + 1
                                    : 1;
                                const newAbn: Abonnement = {
                                  ID_Abn: nextId,
                                  ID_Patient: selectedPatient.ID_Patient,
                                  ID_Pack: Number(newAbnPackId),
                                  Date_Debut_Abn: newAbnStartDate,
                                  Date_Fin_Abn: newAbnEndDate,
                                  Nbre_Sean_Consom_Abn: 0,
                                  ID_Acte_Add1:
                                    newAbnAdd1 === "none"
                                      ? null
                                      : Number(newAbnAdd1),
                                  ID_Acte_Add2:
                                    newAbnAdd2 === "none"
                                      ? null
                                      : Number(newAbnAdd2),
                                  Etat: "Gelé",
                                  Date_Abn: newAbnDateAbn,
                                };

                                const patIdx = fresh.patients.findIndex(
                                  (p) =>
                                    p.ID_Patient === selectedPatient.ID_Patient,
                                );
                                if (patIdx !== -1) {
                                  fresh.patients[patIdx] = {
                                    ...fresh.patients[patIdx],
                                    Nbre_Abn:
                                      (fresh.patients[patIdx].Nbre_Abn || 0) +
                                      1,
                                    Nbre_Abn_Pat:
                                      (fresh.patients[patIdx].Nbre_Abn_Pat ||
                                        0) + 1,
                                  };
                                }

                                fresh.abonnements =
                                  ensureSingleActiveSubscriptionForPatient(
                                    [...fresh.abonnements, newAbn],
                                    selectedPatient.ID_Patient,
                                    nextId,
                                  );
                                onSave(fresh);
                                setShowAddAbnInline(false);
                                triggerToast(
                                  `Abonnement ABN_${newAbn.ID_Abn} créé avec succès par l'Admin !`,
                                  "success",
                                );
                              }}
                              className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded transition uppercase tracking-wider cursor-pointer mt-2"
                            >
                              ✅ Enregistrer ce nouvel Abonnement
                            </button>
                          </div>
                        )}

                        {(() => {
                          const patientAbns = dbState.abonnements.filter(
                            (a) => a.ID_Patient === selectedPatient.ID_Patient,
                          );

                          // Price map helper
                          const getPackPrice = (packId: number) => {
                            const foundPack = dbState.packs ? dbState.packs.find(
                              (p) => p.ID_Pack === packId,
                            ) : null;
                            return foundPack?.Prix_Pack ?? 0;
                          };

                          // Helper for freeze/gel toggle action
                          const toggleGelAbonnement = (abnId: number) => {
                            const fresh = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
                            const idx = fresh.abonnements.findIndex(
                              (a) => a.ID_Abn === abnId,
                            );
                            if (idx !== -1) {
                              const isCurrentlyGele = !!(
                                fresh.abonnements[idx] as any
                              ).Est_Gele;
                              const nextGele = !isCurrentlyGele;
                              (fresh.abonnements[idx] as any).Est_Gele =
                                nextGele;
                              if (!nextGele) {
                                fresh.abonnements[idx].Etat = "Actif";
                                fresh.abonnements =
                                  ensureSingleActiveSubscriptionForPatient(
                                    fresh.abonnements,
                                    selectedPatient.ID_Patient,
                                    abnId,
                                  );
                              }
                              onSave(fresh);
                              triggerToast(
                                `Abonnement #${abnId} ${nextGele ? "Désactivé" : "Activé"} avec succès.`,
                                "success",
                              );
                            }
                          };

                          const toggleEtatAbonnement = (abnId: number, currentEtat?: string) => {
                            const fresh = JSON.parse(JSON.stringify(dbState)) as DatabaseState;
                            const idx = fresh.abonnements.findIndex(
                              (a) => a.ID_Abn === abnId,
                            );
                            if (idx !== -1) {
                              const nextEtat = currentEtat === "Fermé" ? "Actif" : "Fermé";
                              fresh.abonnements[idx].Etat = nextEtat;
                              onSave(fresh);
                              triggerToast(
                                `Abonnement #${abnId} marqué comme ${nextEtat === "Fermé" ? "Fermé" : "Ouvert"}`,
                                "success",
                              );
                            }
                          };

                          return (
                            <div className="space-y-4">
                              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-bold uppercase tracking-wider text-[9px] font-sans">
                                      <th className="p-3 pl-4">Libellé</th>
                                      <th className="p-3">Traitements Additionnels</th>
                                      <th className="p-3">Nbre Séance</th>
                                      <th className="p-3">Date Début</th>
                                      <th className="p-3">Date Fin</th>
                                      <th className="p-3 text-center">
                                        Nbre de Séance
                                      </th>
                                      <th className="p-3">Prix</th>
                                      <th className="p-3">Montant Consommé</th>
                                      <th className="p-3">Montant Versé</th>
                                      <th className="p-3">Etat</th>
                                      <th className="p-3 text-center pr-4">
                                        Actions / Règlement
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-150">
                                    {patientAbns.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={11}
                                          className="p-8 text-center text-slate-400 italic"
                                        >
                                          Aucun forfait thérapeutique enregistré
                                          pour ce patient.
                                        </td>
                                      </tr>
                                    ) : (
                                      patientAbns.map((abn) => {
                                        const pack = dbState.packs ? dbState.packs.find(
                                          (p) => p.ID_Pack === abn.ID_Pack,
                                        ) : null;
                                        const totalSessions =
                                          pack?.Nbre_Seance_Pack ?? 10;
                                        const price = getPackPrice(abn.ID_Pack);
                                        const isGele = isAbonnementGele(abn, dbState);
                                        const isAdminGele = !!(abn as any).Est_Gele;

                                        const act1 = abn.ID_Acte_Add1
                                          ? dbState.actes.find(
                                              (a) =>
                                                a.ID_Acte === abn.ID_Acte_Add1,
                                            )
                                          : null;
                                        const act2 = abn.ID_Acte_Add2
                                          ? dbState.actes.find(
                                              (a) =>
                                                a.ID_Acte === abn.ID_Acte_Add2,
                                            )
                                          : null;

                                        const associatedVersements =
                                          dbState.versements.filter(
                                            (v) => v.ID_Abn === abn.ID_Abn,
                                          );
                                        const totalPaid =
                                          associatedVersements.reduce(
                                            (sum, v) => sum + v.Mont_Vers,
                                            0,
                                          );
                                        const isPayedFull = totalPaid >= price;

                                        // Determine exact Etat condition
                                        let etat:
                                          | "Actif"
                                          | "Fermé"
                                          | "Gelé"
                                          | "Expiré" = "Actif";
                                        if (
                                          abn.Nbre_Sean_Consom_Abn >=
                                          totalSessions
                                        ) {
                                          etat = "Fermé";
                                        } else if (abn.Etat === "Gelé" || isGele) {
                                          etat = "Gelé";
                                        } else {
                                          const today = new Date()
                                            .toISOString()
                                            .split("T")[0];
                                          if (abn.Date_Fin_Abn < today) {
                                            etat = "Expiré";
                                          }
                                        }

                                        const isExpanded =
                                          expandedSessionsAbnId === abn.ID_Abn;
                                        const sessions = dbState.seances.filter(
                                          (s) => s.ID_Abn === abn.ID_Abn,
                                        );

                                        return (
                                          <React.Fragment key={abn.ID_Abn}>
                                            <tr
                                              onClick={() => {
                                                if (
                                                  currentUser.Role ===
                                                    "Admin" ||
                                                  currentUser.Role ===
                                                    "Assistante"
                                                ) {
                                                  handleStartEditAbn(abn);
                                                } else {
                                                  setExpandedSessionsAbnId(
                                                    isExpanded
                                                      ? null
                                                      : abn.ID_Abn,
                                                  );
                                                }
                                              }}
                                              className={`transition group cursor-pointer select-none border-l-4 ${
                                                totalPaid >= price
                                                  ? "bg-[#A7E0E0]/35 hover:bg-[#A7E0E0]/50 text-slate-900 border-[#A7E0E0]"
                                                  : totalPaid > 0
                                                    ? "bg-[#E3CD8B]/35 hover:bg-[#E3CD8B]/50 text-slate-900 border-[#E3CD8B]"
                                                    : "bg-[#F9968B]/35 hover:bg-[#F9968B]/50 text-slate-900 border-[#F9968B]"
                                              }`}
                                            >
                                              <td className="p-3 pl-4 font-bold text-slate-800">
                                                <div className="flex flex-col">
                                                  <span className="group-hover:text-indigo-650 transition">
                                                    {pack?.Libelle_Pack ||
                                                      "Pack personnalisé"}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <div className="flex flex-col gap-1 max-w-[130px]">
                                                  {act1 && (
                                                    <span className="bg-indigo-50 border border-indigo-150 text-[8.5px] font-bold text-indigo-700 px-2 py-0.5 rounded-full select-none truncate">
                                                      ➕ {act1.Libelle_Acte}
                                                    </span>
                                                  )}
                                                  {act2 && (
                                                    <span className="bg-indigo-50 border border-indigo-150 text-[8.5px] font-bold text-indigo-700 px-2 py-0.5 rounded-full select-none truncate">
                                                      ➕ {act2.Libelle_Acte}
                                                    </span>
                                                  )}
                                                  {!act1 && !act2 && (
                                                    <span className="text-slate-400 italic text-[9px]">Aucun</span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="p-3 font-mono font-bold text-slate-600">
                                                {totalSessions}
                                              </td>
                                              <td className="p-3 text-slate-500 font-semibold font-mono">
                                                {abn.Date_Debut_Abn}
                                              </td>
                                              <td className="p-3 text-slate-500 font-semibold font-mono">
                                                {abn.Date_Fin_Abn}
                                              </td>

                                              <td className="p-3 text-center">
                                                <span
                                                  className={`inline-block px-2.5 py-0.5 rounded font-extrabold font-mono text-[10px] ${
                                                    abn.Nbre_Sean_Consom_Abn >=
                                                    totalSessions
                                                      ? "bg-rose-50 text-rose-700 border border-rose-150"
                                                      : "bg-indigo-50 text-indigo-800 border border-indigo-100"
                                                  }`}
                                                >
                                                  {abn.Nbre_Sean_Consom_Abn} /{" "}
                                                  {totalSessions}
                                                </span>
                                              </td>
                                              <td className="p-3 font-mono font-bold text-slate-705">
                                                {formatDA(price)}
                                              </td>
                                              <td className="p-3 font-mono font-bold text-slate-705">
                                                {formatDA(totalSessions > 0 ? (price / totalSessions) * abn.Nbre_Sean_Consom_Abn : 0)}
                                              </td>
                                              <td className="p-3 font-mono font-bold text-slate-705">
                                                {formatDA(totalPaid)}
                                              </td>
                                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                  <input
                                                    type="checkbox"
                                                    checked={abn.Etat === "Fermé"}
                                                    onChange={() => toggleEtatAbonnement(abn.ID_Abn, abn.Etat)}
                                                    className="w-3.5 h-3.5 accent-indigo-650 rounded cursor-pointer"
                                                  />
                                                  <span className={`text-[9.5px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                                    abn.Etat === "Fermé"
                                                      ? "text-stone-600 bg-stone-100 border border-stone-250"
                                                      : "text-emerald-950 bg-emerald-55/65 border border-emerald-200"
                                                  }`}>
                                                    {abn.Etat === "Fermé" ? "Fermé" : "Ouvert"}
                                                  </span>
                                                </label>
                                              </td>
                                              <td
                                                className="p-3 text-center pr-4"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <div className="flex items-center justify-center gap-2">
                                                  {/* Edit action for Admin / Assistante */}
                                                  {(currentUser.Role ===
                                                    "Admin" ||
                                                    currentUser.Role ===
                                                      "Assistante") && (
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleStartEditAbn(abn)
                                                      }
                                                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-7 h-7 rounded-md font-bold text-[10px] transition cursor-pointer flex items-center justify-center shadow-3xs"
                                                      title="Modifier cet abonnement"
                                                    >
                                                      <span>✏️</span>
                                                    </button>
                                                  )}
                                                  {/* Quick Versement Input & Button */}
                                                  {!isPayedFull &&
                                                    etat !== "Fermé" && (
                                                      <div className={`flex items-center gap-1 ${currentUser.Role === "Admin" ? "" : "opacity-60"}`}>
                                                        <input
                                                          type="number"
                                                          disabled={currentUser.Role !== "Admin"}
                                                          placeholder="DA"
                                                          className={`w-16 h-7 border rounded px-1.5 text-[10px] font-bold ${
                                                            currentUser.Role === "Admin"
                                                              ? "bg-white border-slate-300 text-slate-800"
                                                              : "bg-slate-100 border-slate-200 cursor-not-allowed"
                                                          }`}
                                                          value={
                                                            quickPayAmounts[
                                                              abn.ID_Abn
                                                            ] || ""
                                                          }
                                                          onChange={(e) =>
                                                            setQuickPayAmounts(
                                                              (prev) => ({
                                                                ...prev,
                                                                [abn.ID_Abn]:
                                                                  e.target
                                                                    .value,
                                                              }),
                                                            )
                                                          }
                                                        />
                                                        <button
                                                          type="button"
                                                          disabled={currentUser.Role !== "Admin"}
                                                          onClick={() => {
                                                            const val = parseFloat(quickPayAmounts[abn.ID_Abn]);
                                                            handleQuickVersement(abn.ID_Abn, val);
                                                          }}
                                                          className={`h-7 px-2 rounded text-[10px] font-black flex items-center gap-1 transition ${
                                                            currentUser.Role === "Admin"
                                                              ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-3xs"
                                                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                          }`}
                                                          title={
                                                            currentUser.Role === "Admin"
                                                              ? "Enregistrer ce versement direct"
                                                              : "L'enregistrement des versements est désactivé depuis la fiche patient"
                                                          }
                                                        >
                                                          <span>
                                                            {currentUser.Role === "Admin" ? "💰 Versement" : "🔒 Versement"}
                                                          </span>
                                                        </button>
                                                      </div>
                                                    )}

                                                  {/* Freeze toggle action (only for non closed/expired ones) */}
                                                  {etat !== "Fermé" &&
                                                    etat !== "Expiré" && (
                                                      <label className="flex items-center gap-1 cursor-pointer select-none border border-slate-200 hover:border-slate-350 px-2 py-1 rounded bg-slate-50 transition h-7">
                                                        <input
                                                          type="checkbox"
                                                          checked={!isAdminGele}
                                                          onChange={() =>
                                                            toggleGelAbonnement(
                                                              abn.ID_Abn,
                                                            )
                                                          }
                                                          className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer animate-none"
                                                        />
                                                        <span className="text-[9px] font-black uppercase text-slate-705">
                                                          {!isAdminGele ? "Activé" : "Désactivé"}
                                                        </span>
                                                      </label>
                                                    )}

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setExpandedSessionsAbnId(
                                                        isExpanded
                                                          ? null
                                                          : abn.ID_Abn,
                                                      )
                                                    }
                                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 px-2.5 py-1 rounded-md font-black text-[9.5px] transition cursor-pointer flex items-center gap-1"
                                                  >
                                                    {isExpanded ? "▲" : "👁️"}
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>

                                            {/* Expanded row with session detail mapping */}
                                            {isExpanded && (
                                              <tr>
                                                <td
                                                  colSpan={9}
                                                  className="bg-slate-50/70 p-4 pr-5 pl-8 border-b border-slate-200"
                                                >
                                                  <div className="space-y-4">
                                                    {/* Section Gestion financière de l'Abonnement (Passer Règlement & Versements) */}
                                                    {(() => {
                                                      const associatedVersements =
                                                        dbState.versements.filter(
                                                          (v) =>
                                                            v.ID_Abn ===
                                                            abn.ID_Abn,
                                                        );
                                                      const totalPaidAmount =
                                                        associatedVersements.reduce(
                                                          (sum, v) =>
                                                            sum + v.Mont_Vers,
                                                          0,
                                                        );
                                                      const packPrice =
                                                        price ?? 0;
                                                      const restToPay =
                                                        Math.max(
                                                          0,
                                                          packPrice -
                                                            totalPaidAmount,
                                                        );

                                                      return (
                                                        <div className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-4 space-y-3 mb-3">
                                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/50 pb-3">
                                                            <div className="flex items-center gap-2.5">
                                                              <span className="text-lg">
                                                                💵
                                                              </span>
                                                              <div>
                                                                <h4 className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-wide">
                                                                  Fiche Patient
                                                                  : Situation
                                                                  Financière
                                                                  &amp;
                                                                  Règlement
                                                                </h4>
                                                                <p className="text-[9.5px] text-slate-500 font-medium">
                                                                  Enregistrez de
                                                                  nouveaux
                                                                  versements ou
                                                                  soldez
                                                                  l'abonnement
                                                                  du patient en
                                                                  direct.
                                                                </p>
                                                              </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono font-bold select-none">
                                                              <div className="bg-white/80 border border-emerald-200/40 px-2 py-0.5 rounded">
                                                                <span className="text-slate-500">
                                                                  Coût
                                                                  Forfait:{" "}
                                                                </span>
                                                                <span className="text-slate-800">
                                                                  {packPrice} DA
                                                                </span>
                                                              </div>
                                                              <div className="bg-white/80 border border-emerald-200/40 px-2 py-0.5 rounded">
                                                                <span className="text-slate-500">
                                                                  Déjà
                                                                  réglé:{" "}
                                                                </span>
                                                                <span className="text-emerald-705 font-black">
                                                                  {
                                                                    totalPaidAmount
                                                                  }{" "}
                                                                  DA
                                                                </span>
                                                              </div>
                                                              <div className="border border-emerald-200/50 px-2 py-0.5 rounded">
                                                                <span className="text-slate-500">
                                                                  Reste à
                                                                  payer:{" "}
                                                                </span>
                                                                <span
                                                                  className={`px-1.5 rounded font-black ${restToPay > 0 ? "bg-rose-50 text-rose-700 font-extrabold" : "bg-emerald-100 text-emerald-905 font-medium"}`}
                                                                >
                                                                  {restToPay} DA
                                                                </span>
                                                              </div>
                                                            </div>
                                                          </div>

                                                          <div className="text-[10px] font-bold text-slate-500 bg-white/70 border border-slate-200 p-2.5 rounded-lg text-center">
                                                            🔒 Enregistrement
                                                            des règlements
                                                            désactivé depuis la
                                                            fiche patient. Les
                                                            règlements
                                                            s'effectuent au
                                                            niveau de
                                                            l'abonnement ou de
                                                            la caisse.
                                                          </div>

                                                          {/* Liste compacte des versements de cet abonnement */}
                                                          {associatedVersements.length >
                                                            0 && (
                                                            <div className="pt-2.5 border-t border-emerald-250/30 text-[9px] text-slate-500 flex flex-wrap gap-2 items-center">
                                                              <span className="font-extrabold uppercase text-[8.5px] tracking-wider text-slate-450">
                                                                Historique des
                                                                Versements:
                                                              </span>
                                                              {associatedVersements.map(
                                                                (v, idx) => (
                                                                  <span
                                                                    key={`pat-detail-vers-${v.ID_Vers || idx}-${idx}`}
                                                                    className="bg-white/80 border border-emerald-200/30 rounded pl-2 pr-1 py-0.5 font-semibold font-mono text-[#254f3b] text-[8.5px] inline-flex items-center gap-1.5 shadow-3xs"
                                                                  >
                                                                    <span>
                                                                      Vers. #
                                                                      {idx + 1}{" "}
                                                                      :{" "}
                                                                      <strong className="font-bold text-emerald-950">
                                                                        {
                                                                          v.Mont_Vers
                                                                        }{" "}
                                                                        DA
                                                                      </strong>{" "}
                                                                      (le{" "}
                                                                      {v.Date_Vers &&
                                                                        v.Date_Vers.substring(
                                                                          0,
                                                                          10,
                                                                        )}
                                                                      )
                                                                    </span>
                                                                    <button
                                                                      type="button"
                                                                      onClick={() =>
                                                                        handlePrintVersement(
                                                                          v.ID_Vers,
                                                                        )
                                                                      }
                                                                      className="p-0.5 hover:bg-emerald-100 rounded text-emerald-700 bg-emerald-50/50 cursor-pointer transition-all flex items-center justify-center border border-transparent hover:border-emerald-200/20"
                                                                      title="Imprimer ce reçu de versement"
                                                                    >
                                                                      <Printer className="w-2.5 h-2.5" />
                                                                    </button>
                                                                  </span>
                                                                ),
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })()}

                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                      <span className="block text-[8.5px] font-black uppercase text-slate-500 tracking-wider">
                                                        📌 Inscriptions &amp;
                                                        Séances rattachées à cet
                                                        abonnement (Clé : ABN_#0
                                                        {abn.ID_Abn}) :
                                                      </span>
                                                      {selectedSeanceIds.length >
                                                        0 && hasPermission(currentUser?.Role, 'fiche_patient', 'canDelete') && (
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            if (
                                                              confirm(
                                                                `Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedSeanceIds.length} séance(s) ?`,
                                                              )
                                                            ) {
                                                              handleDeleteSeances(
                                                                selectedSeanceIds,
                                                                abn.ID_Abn,
                                                              );
                                                              setSelectedSeanceIds(
                                                                [],
                                                              );
                                                            }
                                                          }}
                                                          className="bg-red-650 hover:bg-red-750 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg transition shadow-3xs"
                                                        >
                                                          🗑️ Supprimer la
                                                          sélection (
                                                          {
                                                            selectedSeanceIds.length
                                                          }
                                                          )
                                                        </button>
                                                      )}
                                                    </div>
                                                    {sessions.length === 0 ? (
                                                      <p className="text-[11px] text-slate-400 italic font-medium pl-2">
                                                        Aucune séance d'acte n'a
                                                        été validée ou rattachée
                                                        à cet abonnement dans
                                                        notre registre.
                                                      </p>
                                                    ) : (
                                                      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 mt-2">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                          <thead>
                                                            <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-slate-700 font-sans text-[9px] uppercase tracking-wider">
                                                              <th className="p-2.5 pl-4 w-20 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                  <input
                                                                    type="checkbox"
                                                                    className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-505 cursor-pointer h-3.5 w-3.5"
                                                                    checked={
                                                                      sessions.length >
                                                                        0 &&
                                                                      sessions.every(
                                                                        (s) =>
                                                                          selectedSeanceIds.includes(
                                                                            s.ID_Seanc,
                                                                          ),
                                                                      )
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) => {
                                                                      if (
                                                                        e.target
                                                                          .checked
                                                                      ) {
                                                                        setSelectedSeanceIds(
                                                                          sessions.map(
                                                                            (
                                                                              s,
                                                                            ) =>
                                                                              s.ID_Seanc,
                                                                          ),
                                                                        );
                                                                      } else {
                                                                        setSelectedSeanceIds(
                                                                          [],
                                                                        );
                                                                      }
                                                                    }}
                                                                  />
                                                                  <span className="text-[9px] text-slate-400 font-bold ml-1">
                                                                    Sél.
                                                                  </span>
                                                                </div>
                                                              </th>
                                                              <th className="p-2.5">
                                                                Date de Séance
                                                              </th>
                                                              <th className="p-2.5">
                                                                Heure Début
                                                              </th>
                                                              <th className="p-2.5">
                                                                Heure Fin
                                                              </th>
                                                              <th className="p-2.5">
                                                                Nature Séance
                                                              </th>
                                                              <th className="p-2.5">
                                                                Praticien
                                                              </th>
                                                              {(selectedPatient.type_patient ===
                                                                "Adulte" ||
                                                                selectedPatient.type_patient ===
                                                                  "Enfant") && (
                                                                <th className="p-2.5 text-right pr-4">
                                                                  Prix
                                                                </th>
                                                              )}
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-slate-100">
                                                            {sessions.map(
                                                              (s, sIdx) => {
                                                                const prat =
                                                                  dbState.praticiens.find(
                                                                    (p) =>
                                                                      p.ID_Prat ===
                                                                      s.ID_Prat,
                                                                  );
                                                                const act =
                                                                  dbState.actes.find(
                                                                    (a) =>
                                                                      a.ID_Acte ===
                                                                      s.ID_Acte,
                                                                  );
                                                                const isChecked =
                                                                  selectedSeanceIds.includes(
                                                                    s.ID_Seanc,
                                                                  );
                                                                return (
                                                                  <tr
                                                                    key={`patient-abn-seance-${s.ID_Seanc || sIdx}-${sIdx}`}
                                                                    className="hover:bg-slate-55 transition-colors"
                                                                  >
                                                                    <td className="p-2.5 text-center w-20">
                                                                      <div className="flex items-center justify-center gap-2">
                                                                        <input
                                                                          type="checkbox"
                                                                          className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-505 cursor-pointer h-3.5 w-3.5"
                                                                          checked={
                                                                            isChecked
                                                                          }
                                                                          onChange={() => {
                                                                            if (
                                                                              isChecked
                                                                            ) {
                                                                              setSelectedSeanceIds(
                                                                                (
                                                                                  prev,
                                                                                ) =>
                                                                                  prev.filter(
                                                                                    (
                                                                                      id,
                                                                                    ) =>
                                                                                      id !==
                                                                                      s.ID_Seanc,
                                                                                  ),
                                                                              );
                                                                            } else {
                                                                              setSelectedSeanceIds(
                                                                                (
                                                                                  prev,
                                                                                ) => [
                                                                                  ...prev,
                                                                                  s.ID_Seanc,
                                                                                ],
                                                                              );
                                                                            }
                                                                          }}
                                                                        />
                                                                        {hasPermission(currentUser?.Role, 'fiche_patient', 'canDelete') && (
                                                                          <button
                                                                            type="button"
                                                                            title="Supprimer cette séance"
                                                                          onClick={(
                                                                            e,
                                                                          ) => {
                                                                            e.stopPropagation();
                                                                            if (
                                                                              confirm(
                                                                                `Voulez-vous vraiment supprimer définitivement la séance SEANCE_#0${s.ID_Seanc} ?`,
                                                                              )
                                                                            ) {
                                                                              handleDeleteSeances(
                                                                                [
                                                                                  s.ID_Seanc,
                                                                                ],
                                                                                abn.ID_Abn,
                                                                              );
                                                                              setSelectedSeanceIds(
                                                                                (
                                                                                  prev,
                                                                                ) =>
                                                                                  prev.filter(
                                                                                    (
                                                                                      id,
                                                                                    ) =>
                                                                                      id !==
                                                                                      s.ID_Seanc,
                                                                                  ),
                                                                              );
                                                                            }
                                                                          }}
                                                                          className="text-slate-400 hover:text-rose-600 transition p-1 hover:bg-rose-50 rounded cursor-pointer"
                                                                        >
                                                                          <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                      )}
                                                                      </div>
                                                                    </td>
                                                                    <td className="p-2.5 font-bold text-slate-755 font-mono">
                                                                      {
                                                                        s.Date_Seanc_Realisee
                                                                      }
                                                                    </td>
                                                                    <td className="p-2.5 text-slate-600 font-mono">
                                                                      {
                                                                        s.H_Debut_Seanc
                                                                      }
                                                                    </td>
                                                                    <td className="p-2.5 text-slate-600 font-mono">
                                                                      {
                                                                        s.H_Fin_Seanc
                                                                      }
                                                                    </td>
                                                                    <td className="p-2.5 text-slate-800 font-sans font-bold">
                                                                      {act?.Libelle_Acte ||
                                                                        "Soin Thérapeutique"}
                                                                    </td>
                                                                    <td className="p-2.5 text-slate-800 font-sans">
                                                                      <span className="bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded font-black text-[9.5px]">
                                                                        Dr.{" "}
                                                                        {
                                                                          prat?.Nom_Prat
                                                                        }{" "}
                                                                        {
                                                                          prat?.Prenom_Prat
                                                                        }
                                                                      </span>
                                                                    </td>
                                                                    {(selectedPatient.type_patient ===
                                                                      "Adulte" ||
                                                                      selectedPatient.type_patient ===
                                                                        "Enfant") && (
                                                                      <td className="p-2.5 text-right pr-4 font-mono font-bold text-emerald-700">
                                                                        {s.Prix_Seanc ===
                                                                        0 ? (
                                                                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                                                            Forfait
                                                                          </span>
                                                                        ) : (
                                                                          `${s.Prix_Seanc} DA`
                                                                        )}
                                                                      </td>
                                                                    )}
                                                                  </tr>
                                                                );
                                                              },
                                                            )}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* TAB 3: HISTORIQUE DES SEANCES */}
                    {folderTab === "seances_record" && (() => {
                      const patientId = Number(selectedPatient.ID_Patient);

                      // Séances de soins
                      const seances = (dbState?.seances || [])
                        .filter((s) => Number(s.ID_Patient) === patientId)
                        .map((s) => {
                          const act = dbState?.actes?.find((a) => a.ID_Acte === s.ID_Acte);
                          const prat = dbState?.praticiens?.find((p) => p.ID_Prat === s.ID_Prat);
                          return {
                            id: s.ID_Seanc,
                            date: s.Date_Seanc_Realisee || s.Date,
                            heureDebut: s.H_Debut_Seanc || s.Heure_Debut || s.HeureDebut || s.HDebut || s.heure_debut || null,
                            heureFin: s.H_Fin_Seanc || s.Heure_Fin || s.HeureFin || s.HFin || s.heure_fin || null,
                            type: act?.Libelle_Acte || s.Nom_Acte || "Séance",
                            praticien: prat ? `Dr. ${prat.Prenom_Prat} ${prat.Nom_Prat}` : s.Nom_Medecin || "—",
                            prix: s.Prix_Seanc,
                            source: "seance",
                            originalSeance: s,
                          };
                        });

                      // Consultations / Contrôles
                      const consults = (dbState?.rendezVous || [])
                        .filter((r) => Number(r.ID_Patient) === patientId)
                        .map((r) => ({
                          id: r.ID_RDV || r.id,
                          date: r.Date_RDV || r.Date || r.date,
                          heureDebut: r.H_Debut_RDV || r.H_Debut || r.Heure_RDV || r.HeureDebut || r.HDebut || r.heure_debut || null,
                          heureFin: r.H_Fin_RDV || r.H_Fin || r.Heure_Fin_RDV || r.HeureFin || r.HFin || r.heure_fin || null,
                          type:
                            (r.Type_RDV || "").includes("Arrêt") || r.Type_RDV === "Contrôle Médical"
                              ? "Contrôle Médical"
                              : r.Type_RDV || "Consultation",
                          praticien: r.Nom_Medecin || r.Medecin || r.ID_Medecin || r.Praticien || "—",
                          prix: null,
                          source: "rdv",
                        }));

                      // 3. Actes de la file d'attente MPR (statut "Terminé")
                      const fileAttenteActes = (dbState?.fileAttente || [])
                        .filter((a: any) => {
                          const samePatient = Number(a.ID_Patient) === patientId;
                          const isDone = a.Statut_Attente === "Terminé";
                          return samePatient && isDone;
                        })
                        .map((a: any) => {
                          const prat = (dbState?.praticiens || []).find(
                            (p: any) => Number(p.ID_Prat) === Number(a.ID_Prat)
                          );
                          const pratName = prat
                            ? `Dr. ${prat.Prenom_Prat || ""} ${prat.Nom_Prat || ""}`.trim()
                            : "Médecin MPR";

                          return {
                            id: a.Num_Ticket || `FA-${a.ID_File}`,
                            date: a.Date_File || "—",
                            type: a.Type_Consultation || "Consultation",
                            praticien: pratName,
                            prix: a.Prix_Consultation ?? null,
                            heureDebut: a.Heure_Arrivee || null,
                            heureFin: a.Heure_Cloture || null,
                            source: "fileAttente",
                          };
                        });

                      // 4. Actes de la file d'attente IMC
                      const fileAttenteIMCActes = (dbState?.fileAttenteIMC || [])
                        .filter((a: any) => {
                          const samePatient = Number(a.ID_Patient) === patientId;
                          const isDone = a.Statut_Attente === "Terminé";
                          return samePatient && isDone;
                        })
                        .map((a: any) => ({
                          id: `IMC-${a.ID_File}`,
                          date: a.Date_File || "—",
                          type: a.Type_Soin || "Soin IMC",
                          praticien: "—",
                          prix: a.Prix_Soin ?? null,
                          heureDebut: a.Heure_Arrivee || null,
                          heureFin: a.Heure_Cloture || null,
                          source: "fileAttenteIMC",
                        }));

                      // Filtrage spécial Enfant IMC : uniquement hors abonnement
                      const isEnfantIMC =
                        selectedPatient?.type_patient === "Enfant IMC" ||
                        selectedPatient?.patient?.Type_Patient === "Enfant IMC" ||
                        selectedPatient?.patient?.type_patient === "Enfant IMC" ||
                        selectedPatient?.Type_Patient === "Enfant IMC";

                      const seancesFiltrees = isEnfantIMC
                        ? seances.filter((s: any) => {
                            const idAbn = s.originalSeance?.ID_Abn ?? s.originalSeance?.id_abn ?? s.originalSeance?.ID_Abonnement;
                            return !idAbn || idAbn === 0 || idAbn === "0" || idAbn === null;
                          })
                        : seances;

                      const allActes = [...seancesFiltrees, ...consults, ...fileAttenteActes, ...fileAttenteIMCActes].sort((a, b) => {
                        const da = (a.date || "").toString();
                        const db_ = (b.date || "").toString();
                        return db_.localeCompare(da);
                      });

                      if (allActes.length === 0) {
                        return (
                          <div className="text-center py-8 text-slate-400 italic text-sm">
                            Aucun acte enregistré pour ce patient
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                              <tr>
                                <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-10">
                                  N°
                                </th>
                                <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                  Date Acte
                                </th>
                                <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-20">
                                  H-Début
                                </th>
                                <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-20">
                                  H-Fin
                                </th>
                                <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                  Type Acte
                                </th>
                                <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                  Praticien
                                </th>
                                <th className="px-3 py-2.5 text-right font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-24">
                                  Prix
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200 w-12">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {allActes.map((acte, idx) => (
                                <tr
                                  key={`${acte.source}-${acte.id || idx}`}
                                  className="hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-800 text-xs font-medium">
                                    {acte.date || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">
                                    {acte.heureDebut || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">
                                    {acte.heureFin || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-700 text-xs">
                                    {acte.type}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                                    {acte.praticien}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-slate-800 text-xs font-bold">
                                    {acte.prix !== null && acte.prix !== undefined ? `${acte.prix} DA` : "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {acte.source === "seance" && acte.originalSeance && hasPermission(currentUser?.Role, 'fiche_patient', 'canDelete') && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              `Voulez-vous vraiment supprimer définitivement cette séance ? Son statut de planification repassera en 'Planifié'`,
                                            )
                                          ) {
                                            handleDeleteSeances([acte.originalSeance.ID_Seanc], acte.originalSeance.ID_Abn);
                                          }
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                                        title="Supprimer"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}


                  </div>

                  {/* Close footer */}
                  <div className="bg-slate-100 border-t border-slate-200 p-4 px-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleClosePatientFiche}
                      className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition"
                    >
                      Fermer la Fiche Patient
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>

      <AnimatePresence>{/* ... End of list logic ... */}</AnimatePresence>

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs">
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

      {showIMCModal && selectedPatient && (
        <IMCPatientModal
          patient={selectedPatient}
          dbState={dbState}
          onClose={() => setShowIMCModal(false)}
          onSave={(updatedState) => {
            onSave(updatedState);
            const updatedPatient = updatedState.patients.find(
              (p) => p.ID_Patient === selectedPatient.ID_Patient
            );
            if (updatedPatient) {
              setSelectedPatient(updatedPatient);
            }
          }}
          triggerToast={triggerToast}
          currentRole={currentUser?.Role}
        />
      )}

    </div>
  );
};

export default PatientsManager;
