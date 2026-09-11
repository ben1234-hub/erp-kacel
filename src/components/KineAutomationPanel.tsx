import React, { useState } from 'react';
import { 
  Activity, 
  Calendar, 
  User, 
  FileText, 
  CheckSquare, 
  Layers, 
  Settings, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Printer, 
  Clock, 
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  Patient, 
  DatabaseState, 
  Consultation, 
  DeficitClinique, 
  RegleAutomatisation, 
  FicheKineAutomatisee, 
  DetailFicheActe, 
  Utilisateur 
} from '../dbStore';

interface KineAutomationPanelProps {
  patient: Patient;
  dbState: DatabaseState;
  onSave: (db: DatabaseState) => void;
  currentUser: Utilisateur;
  canEditMedical: boolean;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const KineAutomationPanel: React.FC<KineAutomationPanelProps> = ({
  patient,
  dbState,
  onSave,
  currentUser,
  canEditMedical,
  triggerToast
}) => {
  // Lists for this specific patient
  const patientConsultations = dbState.consultations.filter(c => c.patient_id === patient.ID_Patient);
  
  // UI states
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(
    patientConsultations.length > 0 ? patientConsultations[patientConsultations.length - 1].id : null
  );
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [isCreatingConsult, setIsCreatingConsult] = useState(false);
  
  // New Consultation Form States
  const [dateConsult, setDateConsult] = useState(new Date().toISOString().split('T')[0]);
  const [medecinNom, setMedecinNom] = useState(currentUser.Nom_Utilisateur || '');
  const [marcheSansAide, setMarcheSansAide] = useState(true);
  const [anteversionBassin, setAnteversionBassin] = useState(false);
  const [commentaires, setCommentaires] = useState('');
  
  // Deficit checklist states (boolean toggles)
  const [hasGenouFlex, setHasGenouFlex] = useState(false);
  const [hasForceInf, setHasForceInf] = useState(false);
  const [hasSpasticite, setHasSpasticite] = useState(false);
  
  // Extra custom deficits can be added
  const [customDeficits, setCustomDeficits] = useState<{ type: 'articulaire' | 'musculaire' | 'spasticite' | 'cicatrice', local: string, val: string }[]>([]);
  const [newCDefType, setNewCDefType] = useState<'articulaire' | 'musculaire' | 'spasticite' | 'cicatrice'>('articulaire');
  const [newCDefLocal, setNewCDefLocal] = useState('');
  const [newCDefVal, setNewCDefVal] = useState('');

  // Prescription Parameters
  const [nbSeancesKine, setNbSeancesKine] = useState(15);
  const [nbSeancesBalneo, setNbSeancesBalneo] = useState(10);
  const [frequenceHebdo, setFrequenceHebdo] = useState(3);
  const [dureeMinutes, setDureeMinutes] = useState(45);

  const handleAddCustomDeficit = () => {
    if (!newCDefLocal.trim() || !newCDefVal.trim()) {
      triggerToast('Veuillez remplir la localisation et la valeur mesurée.', 'error');
      return;
    }
    setCustomDeficits([
      ...customDeficits,
      { type: newCDefType, local: newCDefLocal.trim(), val: newCDefVal.trim() }
    ]);
    setNewCDefLocal('');
    setNewCDefVal('');
  };

  const handleRemoveCustomDeficit = (idx: number) => {
    setCustomDeficits(customDeficits.filter((_, i) => i !== idx));
  };

  const handleGenerateKineSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditMedical) {
      triggerToast('Permission refusée. Seul le médecin MPR est autorisé.', 'error');
      return;
    }

    const fresh = { ...dbState };
    
    // 1. Create a dynamic consultation record ID
    const nextConsultId = fresh.consultations.length > 0 
      ? Math.max(...fresh.consultations.map(c => c.id)) + 1 
      : 1;

    const newConsult: Consultation = {
      id: nextConsultId,
      patient_id: patient.ID_Patient,
      date_consultation: dateConsult,
      medecin_mpr_nom: medecinNom,
      marche_sans_aide_technique: marcheSansAide,
      anteversion_bassin: anteversionBassin,
      commentaires: commentaires.trim() || 'Examen clinique de routine pour rééducation.'
    };

    fresh.consultations = [...fresh.consultations, newConsult];

    // 2. Add Deficits
    const nextDeficitIdStart = fresh.deficitsCliniques.length > 0 
      ? Math.max(...fresh.deficitsCliniques.map(d => d.id)) + 1 
      : 1;
    
    let deficitCounter = nextDeficitIdStart;
    const addedDeficits: DeficitClinique[] = [];

    // Trigger checkboxes
    if (hasGenouFlex) {
      addedDeficits.push({
        id: deficitCounter++,
        consultation_id: nextConsultId,
        type_deficit: 'articulaire',
        localisation: 'Genou (Extension/Flexion limitée)',
        valeur_mesuree: '< 100° flexion',
        code_regle_declencheur: 'GENOU_FLEX_100'
      });
    }

    if (hasForceInf) {
      addedDeficits.push({
        id: deficitCounter++,
        consultation_id: nextConsultId,
        type_deficit: 'musculaire',
        localisation: 'Membres inférieurs (Triceps, Quadriceps distor)',
        valeur_mesuree: 'Force < 4/5',
        code_regle_declencheur: 'FORCE_INF_4'
      });
    }

    if (hasSpasticite) {
      addedDeficits.push({
        id: deficitCounter++,
        consultation_id: nextConsultId,
        type_deficit: 'spasticite',
        localisation: 'Ischio-jambiers / Adducteurs',
        valeur_mesuree: 'Spasticité positive',
        code_regle_declencheur: 'SPASTICITE_P_M'
      });
    }

    if (anteversionBassin) {
      addedDeficits.push({
        id: deficitCounter++,
        consultation_id: nextConsultId,
        type_deficit: 'articulaire',
        localisation: 'Complexe lombo-pelvien (Bassin)',
        valeur_mesuree: 'Antéversion anormale',
        code_regle_declencheur: 'BASSIN_ANTE'
      });
    }

    // Dynamic custom deficits mapping
    customDeficits.forEach(def => {
      // Map generic type to rules or default to none
      addedDeficits.push({
        id: deficitCounter++,
        consultation_id: nextConsultId,
        type_deficit: def.type,
        localisation: def.local,
        valeur_mesuree: def.val,
        code_regle_declencheur: 'CUSTOM_OBSERVATION'
      });
    });

    fresh.deficitsCliniques = [...fresh.deficitsCliniques, ...addedDeficits];

    // 3. Create Automated Kine Folder
    const nextFicheId = fresh.fichesKineAutomatisees.length > 0
      ? Math.max(...fresh.fichesKineAutomatisees.map(f => f.id)) + 1
      : 1;

    const newFiche: FicheKineAutomatisee = {
      id: nextFicheId,
      consultation_id: nextConsultId,
      nombre_seances_kine: nbSeancesKine,
      nombre_seances_balneo: nbSeancesBalneo,
      frequence_hebdo: frequenceHebdo,
      duree_quotidienne_minutes: dureeMinutes,
      date_generation: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    fresh.fichesKineAutomatisees = [...fresh.fichesKineAutomatisees, newFiche];

    // 4. Populate details_fiche_actes by matching active clinical triggers with rules!
    const nextDetailIdStart = fresh.detailsFicheActes.length > 0
      ? Math.max(...fresh.detailsFicheActes.map(d => d.id)) + 1
      : 1;
    
    let detailCounter = nextDetailIdStart;
    const addedDetails: DetailFicheActe[] = [];

    // Core rule logic matching: If deficiency trigger code exists, fetch act and append!
    addedDeficits.forEach(def => {
      const matchingRule = fresh.reglesAutomatisation.find(r => r.code_regle === def.code_regle_declencheur);
      if (matchingRule) {
        addedDetails.push({
          id: detailCounter++,
          fiche_id: nextFicheId,
          categorie_acte: matchingRule.categorie_acte,
          intitule_acte: matchingRule.intitule_acte_auto
        });
      }
    });

    // Handle generic custom acts indication
    if (addedDetails.length === 0) {
      // Fallback act if no specific rules trigger
      addedDetails.push({
        id: detailCounter++,
        fiche_id: nextFicheId,
        categorie_acte: 'therapie_manuelle',
        intitule_acte: 'Réhabilitation générale motrice et mobilisation active douce'
      });
    }

    fresh.detailsFicheActes = [...fresh.detailsFicheActes, ...addedDetails];

    // 5. Save and select newly generated consultation
    onSave(fresh);
    setSelectedConsultationId(nextConsultId);
    setIsCreatingConsult(false);
    
    // Clear forms
    setCommentaires('');
    setHasGenouFlex(false);
    setHasForceInf(false);
    setHasSpasticite(false);
    setCustomDeficits([]);
    
    triggerToast(`Fiche de kinésithérapie automatisée générée ! ${addedDetails.length} actes autonomes prescrits.`, 'success');
  };

  // Resolve active displayed data
  const selectedConsult = dbState.consultations.find(c => c.id === selectedConsultationId);
  const selectedDeficits = dbState.deficitsCliniques.filter(d => d.consultation_id === selectedConsultationId);
  const selectedFiche = dbState.fichesKineAutomatisees.find(f => f.consultation_id === selectedConsultationId);
  const selectedFicheDetails = selectedFiche ? dbState.detailsFicheActes.filter(d => d.fiche_id === selectedFiche.id) : [];

  const handlePrintPrescription = () => {
    if (!selectedFiche || !selectedConsult) return;
    setShowPrintPreview(true);
    try {
      const pId = patient.ID_Patient;
      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Prescription Médicale MPR - PAT_#0${pId}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        body {
            font-family: "Plus Jakarta Sans", -apple-system, sans-serif;
            color: #1a3038;
            background: #fff;
            margin: 0;
            padding: 30px;
            line-height: 1.4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #c8e0de;
            border-radius: 16px;
            overflow: hidden;
            background: #fff;
        }
        .header {
            background-color: #102e3b;
            color: #fff;
            padding: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-title {
            margin: 0;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 800;
        }
        .header-sub {
            margin: 4px 0 0 0;
            font-size: 10px;
            color: #bcd4de;
            font-family: monospace;
            font-weight: bold;
        }
        .badge {
            background-color: #1b3d4f;
            color: #bcd4de;
            font-size: 9px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .identity-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 24px;
            background-color: #fcfdfe;
            border-bottom: 1px solid #c8e0de;
        }
        .label {
            font-size: 8px;
            text-transform: uppercase;
            color: #5c7f8a;
            font-weight: bold;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
        }
        .value-name {
            font-size: 14px;
            font-weight: 850;
            color: #102e3b;
        }
        .value-arabic {
            font-size: 13px;
            font-weight: 600;
            color: #1b3d4f;
            margin-top: 2px;
        }
        .grid-params {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            padding: 16px 24px;
            background-color: #f5fbfb;
            border-bottom: 1px solid #c8e0de;
            text-align: center;
        }
        .param-value {
            font-size: 15px;
            font-weight: 800;
            color: #102e3b;
            font-family: monospace;
        }
        .param-label {
            font-size: 8px;
            text-transform: uppercase;
            color: #5c7f8a;
            font-weight: bold;
            margin-top: 1px;
        }
        .content {
            padding: 24px;
        }
        .section-title {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            color: #5c7f8a;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 12px;
            border-bottom: 1px solid #c8e0de;
            padding-bottom: 4px;
        }
        .acte-card {
            border: 1px solid #c8e0de;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: #fff;
        }
        .acte-number {
            background-color: #f0fdfa;
            color: #0d9488;
            border: 1px solid #ccfbf1;
            font-weight: 900;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 2px;
        }
        .acte-title {
            font-size: 12px;
            font-weight: 800;
            color: #102e3b;
            margin: 0;
        }
        .acte-desc {
            font-size: 10px;
            color: #5c7f8a;
            margin: 2px 0 0 0;
        }
        .disclaimer {
            background-color: #f7fee7;
            border: 1px solid #ecfccb;
            border-radius: 8px;
            padding: 10px;
            font-size: 9px;
            color: #3f6212;
            font-weight: 600;
            margin-top: 16px;
        }
        .footer-signatures {
            display: flex;
            justify-content: space-between;
            padding: 24px;
            font-size: 10px;
            color: #5c7f8a;
            border-top: 1px solid #c8e0de;
            background-color: #fff;
        }
        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            .container {
                border: none;
                box-shadow: none;
                border-radius: 0;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;" class="no-print">
        <button onclick="window.print()" style="background: #102e3b; color: white; border: none; padding: 10px 18px; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            🖨️ Lancer l'Impression de la Prescription
        </button>
        <button onclick="window.close()" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 10px 18px; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            Fermer l'Onglet
        </button>
    </div>
    <div class="container">
        <div class="header">
            <div>
                <h1 class="header-title">Fiche de Rééducation Posturale & Autonome</h1>
                <p class="header-sub">REHAB_FICH_#0${selectedFiche.id}</p>
            </div>
            <div>
                <span class="badge">Générée par MPR AI Suite</span>
                <p class="header-sub" style="color: #cbd5e1; text-align: right; margin-top: 4px;">${selectedFiche.date_generation}</p>
            </div>
        </div>

        <div class="identity-grid">
            <div>
                <span class="label">Patient / المريض :</span>
                <span class="value-name">${patient.Nom_Patient}</span>
                ${patient.Nom_Pat_Arb ? `<div class="value-arabic">${patient.Pren_Pat_Arb || ''} ${patient.Nom_Pat_Arb}</div>` : ''}
                <div style="margin-top: 6px; color: #47555e; font-size: 10px; font-weight: bold;">
                    Âge : <span style="color: #102e3b;">${patient.Age_Patient || 30} ans</span> | Genre : <span style="color: #102e3b;">${patient.Genre_Patient}</span><br>
                    Tél : <span style="color: #102e3b; font-family: monospace;">${patient.phone || 'Non renseigné'}</span><br>
                    Adresse : <span style="color: #102e3b; font-style: italic;">${patient.address || 'Alger'}</span>
                </div>
            </div>
            <div>
                <span class="label">Médecin Prescripteur :</span>
                <span class="value-name">Dr. ${selectedConsult.medecin_mpr_nom}</span>
                <div style="margin-top: 6px; color: #47555e; font-size: 10px; font-weight: bold; line-height: 1.5;">
                    Qualité : <span style="color: #102e3b;">Médecin MPR Chef</span><br>
                    Date de Consultation : <span style="color: #102e3b; font-family: monospace;">${selectedConsult.date_consultation}</span><br>
                    Autonomie Marche : <span style="color: #102e3b;">${selectedConsult.marche_sans_aide_technique ? 'Autonome (Sans aide technique)' : 'Besoin d\'assistance technique'}</span>
                </div>
            </div>
        </div>

        <div class="grid-params">
            <div>
                <div class="param-value">${selectedFiche.nombre_seances_kine}</div>
                <div class="param-label">Sessions Kiné</div>
            </div>
            <div>
                <div class="param-value">${selectedFiche.nombre_seances_balneo}</div>
                <div class="param-label">Sessions Balnéo</div>
            </div>
            <div>
                <div class="param-value">${selectedFiche.frequence_hebdo}x / sem</div>
                <div class="param-label">Fréquence</div>
            </div>
            <div>
                <div class="param-value">${selectedFiche.duree_quotidienne_minutes} min</div>
                <div class="param-label">Durée</div>
            </div>
        </div>

        <div class="content">
            <span class="section-title">Actes Rééducatifs Prescrits (Relational Rules mapped)</span>
            ${selectedFicheDetails.map((act, idx) => `
                <div class="acte-card">
                    <span class="acte-number">#${idx + 1}</span>
                    <div>
                        <h4 class="acte-title">${act.intitule_acte}</h4>
                        <p class="acte-desc">Prescription systématique validée par les règles d'automatisation.</p>
                    </div>
                </div>
            `).join('')}

            <div class="disclaimer">
                A l'ensemble de l'évaluation systématique, cette fiche automatisée reste éditable et validée sous l'autorité absolue du Médecin Chef de Service MPR. Tout écart de testing musculaire autorise l'annulation de la séance.
            </div>
        </div>

        <div class="footer-signatures">
            <div>
                <strong style="text-transform: uppercase; font-size: 8px; color: #5c7f8a; display: block; margin-bottom: 25px;">Signature Caissier</strong>
                <span>Guichet Unique MPR</span>
            </div>
            <div style="text-align: right;">
                <strong style="text-transform: uppercase; font-size: 8px; color: #5c7f8a; display: block; margin-bottom: 25px;">Signature & Cachet</strong>
                <span style="font-weight: bold; color: #0d9488;">Validé Électroniquement</span>
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

      // Try local standard window print first
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error("Local window.print failed:", err);
      }

      // Generate HTML download to easily bypass iframe sandboxing popup blocks & standard restrictions
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = `Prescription_MPR_PAT_#0${pId}_FICH_${selectedFiche.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      triggerToast && triggerToast("Document d'impression (prescription autonome) téléchargé avec succès !", "success");
    } catch (error: any) {
      console.error(error);
      triggerToast && triggerToast("Erreur lors de l'envoi à l'imprimante : " + error.message, "error");
    }
  };

  return (
    <div className="space-y-4" id="kine-rehabilitation-automation-module">
      
      {/* Consultations History Selection rail */}
      <div className="flex gap-2 items-center overflow-x-auto py-1 border-b border-slate-200">
        <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 whitespace-nowrap pl-1">Examen Cliniques :</span>
        {patientConsultations.map((c, index) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setSelectedConsultationId(c.id);
              setIsCreatingConsult(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedConsultationId === c.id && !isCreatingConsult
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 opacity-90" />
            <span>Consultation #{index + 1} ({c.date_consultation})</span>
          </button>
        ))}

        {patientConsultations.length === 0 && !isCreatingConsult && (
          <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">Aucun bilan clinique enregistré</span>
        )}

        {canEditMedical && (
          <button
            type="button"
            onClick={() => {
              setIsCreatingConsult(true);
              setSelectedConsultationId(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg border border-dashed text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
              isCreatingConsult
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nouvelle Consultation & Fiche Auto</span>
          </button>
        )}
      </div>

      {isCreatingConsult ? (
        /* CREATE CONSULTATION FORM */
        <form onSubmit={handleGenerateKineSheet} className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-4 text-slate-900">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
            <div>
              <h5 className="font-extrabold text-xs text-emerald-900 uppercase tracking-wide">Assistant de Génération Fiche Clinique & Kiné MPR</h5>
              <p className="text-[10px] text-emerald-700 font-medium">L'algorithme de prescription va automatiquement mapper les déficits relevés aux actes de rééducation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side: parameters */}
            <div className="space-y-3.5">
              <h6 className="font-bold text-[11px] text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-1">1. Paramètres Administratifs</h6>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Examen</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white"
                    value={dateConsult}
                    onChange={(e) => setDateConsult(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Médecin MPR prescripteur</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white"
                    placeholder="Nom du médecin"
                    value={medecinNom}
                    onChange={(e) => setMedecinNom(e.target.value)}
                  />
                </div>
              </div>

              <h6 className="font-bold text-[11px] text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-1 pt-2">2. Observations Cliniques de base</h6>
              <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-850">
                  <input 
                    type="checkbox" 
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={marcheSansAide}
                    onChange={(e) => setMarcheSansAide(e.target.checked)}
                  />
                  <span>Capacité de marche sans aide technique (Canne, déambulateur)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-850">
                  <input 
                    type="checkbox" 
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={anteversionBassin}
                    onChange={(e) => setAnteversionBassin(e.target.checked)}
                  />
                  <span className="text-rose-900 font-bold">Anomalie : Bassin en antéversion prononcée</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Commentaires cliniques libres :</label>
                <textarea 
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Etat général de la posture, tonus et remarques d'évaluation..."
                  value={commentaires}
                  onChange={(e) => setCommentaires(e.target.value)}
                />
              </div>
            </div>

            {/* Right side: trigger deficits checkbox and setup parameters */}
            <div className="space-y-3.5">
              <h6 className="font-bold text-[11px] text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-1">3. Cochez les Déficits Systémiques Constatés</h6>
              
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    id="trigger-genou"
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={hasGenouFlex}
                    onChange={(e) => setHasGenouFlex(e.target.checked)}
                  />
                  <label htmlFor="trigger-genou" className="text-xs cursor-pointer">
                    <span className="block font-black text-slate-900 text-[10px] uppercase">Déficit d'amplitude au Genou (Articulaire)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Sensation de blocage en extension ou amplitude flexion inférieure à 100°</span>
                  </label>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    id="trigger-force"
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={hasForceInf}
                    onChange={(e) => setHasForceInf(e.target.checked)}
                  />
                  <label htmlFor="trigger-force" className="text-xs cursor-pointer">
                    <span className="block font-black text-slate-900 text-[10px] uppercase">Baisse de force musculaire distale (Musculaire)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Score d'évaluation du testing musculaire de force inférieur à 4/5</span>
                  </label>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    id="trigger-spas"
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={hasSpasticite}
                    onChange={(e) => setHasSpasticite(e.target.checked)}
                  />
                  <label htmlFor="trigger-spas" className="text-xs cursor-pointer">
                    <span className="block font-black text-slate-900 text-[10px] uppercase">Spasticité active sur Membres (Spasticité)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Contraction involontaire sur le groupe adducteurs/ischio-jambiers</span>
                  </label>
                </div>
              </div>

              {/* Extra Custom Deficit Adder */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <span className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Observations / Déficits Supplémentaires</span>
                {customDeficits.map((def, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] bg-white px-2 py-1 rounded border border-slate-150">
                    <span className="font-semibold text-slate-800">
                      [{def.type}] {def.local}: <strong className="text-indigo-600">{def.val}</strong>
                    </span>
                    <button type="button" onClick={() => handleRemoveCustomDeficit(idx)} className="text-rose-600 hover:text-rose-800 font-bold shrink-0">✕</button>
                  </div>
                ))}
                
                <div className="flex gap-1.5 pt-1">
                  <select 
                    className="border border-slate-300 rounded p-1 text-[11px] font-bold bg-white"
                    value={newCDefType}
                    onChange={(e) => setNewCDefType(e.target.value as any)}
                  >
                    <option value="articulaire">Articulaire</option>
                    <option value="musculaire">Musculaire</option>
                    <option value="spasticite">Spasticité</option>
                    <option value="cicatrice">Cicatrice</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Localisation" 
                    className="flex-1 border border-slate-300 rounded p-1 text-[11px] font-semibold bg-white"
                    value={newCDefLocal}
                    onChange={(e) => setNewCDefLocal(e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Mesure" 
                    className="flex-1 border border-slate-300 rounded p-1 text-[11px] font-semibold bg-white"
                    value={newCDefVal}
                    onChange={(e) => setNewCDefVal(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCustomDeficit}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-250 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-black"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <h6 className="font-bold text-[11px] text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-1 pt-1">4. Cadence & Séance Fiche de Soins</h6>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nb séances Kiné</label>
                  <input 
                    type="number" 
                    min={0}
                    className="w-full border border-slate-300 rounded-md p-1.5 text-xs font-bold bg-white"
                    value={nbSeancesKine}
                    onChange={(e) => setNbSeancesKine(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nb séances Balnéo</label>
                  <input 
                    type="number" 
                    min={0}
                    className="w-full border border-slate-300 rounded-md p-1.5 text-xs font-bold bg-white"
                    value={nbSeancesBalneo}
                    onChange={(e) => setNbSeancesBalneo(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Fréquence/semaine</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={7}
                    className="w-full border border-slate-300 rounded-md p-1.5 text-xs font-bold bg-white"
                    value={frequenceHebdo}
                    onChange={(e) => setFrequenceHebdo(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Durée séance (min)</label>
                  <input 
                    type="number" 
                    min={10}
                    className="w-full border border-slate-300 rounded-md p-1.5 text-xs font-bold bg-white"
                    value={dureeMinutes}
                    onChange={(e) => setDureeMinutes(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreatingConsult(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Générer la Fiche Kiné Automatisée</span>
            </button>
          </div>
        </form>
      ) : selectedConsult ? (
        /* DETAIL CONSULTATION & GENERATED AUTO REHAB SHEET VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="view-active-diagnostic-sheet">
          {/* Diagnostic Clinical evaluations Summary */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
            <div className="border-b border-indigo-100 pb-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Examen MPR clinique daté</span>
              <h5 className="font-extrabold text-xs text-slate-900 mt-0.5">Synthèse et anomalies relevées</h5>
            </div>

            <div className="space-y-2 text-[11px] text-slate-800">
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500 font-bold">Médecin :</span>
                <span className="font-extrabold text-slate-900">{selectedConsult.medecin_mpr_nom}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500 font-bold">Autonomie de Marche :</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  selectedConsult.marche_sans_aide_technique 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {selectedConsult.marche_sans_aide_technique ? 'Sans aide' : 'Avec aide' }
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500 font-bold">Antéversion du bassin :</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  selectedConsult.anteversion_bassin 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : 'bg-slate-150 text-slate-800'
                }`}>
                  {selectedConsult.anteversion_bassin ? 'Anormale (OUI)' : 'Néant' }
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Déficits Systémiques Rapprochés ({selectedDeficits.length}) :</span>
              <div className="space-y-1.5">
                {selectedDeficits.map(d => (
                  <div key={d.id} className="p-2 bg-slate-50 hover:bg-slate-100/85 rounded-xl border border-slate-155 text-[11px] leading-relaxed">
                    <div className="flex justify-between items-center">
                      <strong className="text-rose-950 font-black uppercase text-[9px]">{d.type_deficit}</strong>
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider">{d.code_regle_declencheur}</span>
                    </div>
                    <p className="font-medium text-slate-800 mt-0.5">Local : <span className="font-semibold text-slate-900">{d.localisation}</span></p>
                    <p className="text-[10px] text-slate-500 font-mono">Mesure : <strong className="text-slate-700">{d.valeur_mesuree}</strong></p>
                  </div>
                ))}

                {selectedDeficits.length === 0 && (
                  <span className="text-xs text-slate-400 block italic">Aucun déficit physique lourd détecté nécessitant l'indexation algorithmique.</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Commentaires MPR :</span>
              <p className="bg-slate-50 text-slate-700 italic border border-slate-200 rounded-xl p-2.5 text-xs font-mono whitespace-pre-line mt-1">
                {selectedConsult.commentaires}
              </p>
            </div>
          </div>

          {/* Generated Automated Rehabilitation Program Sheet (Print-friendly format requested) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            
            {selectedFiche ? (
              <div className="border border-indigo-200 rounded-2xl overflow-hidden shadow-sm" id="printable-kine-automated-sheet">
                
                {/* Official clinical Header */}
                <div className="bg-[#102e3b] text-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#1b3d4f] rounded-lg">
                      <FileText className="w-5 h-5 text-[#7fa4b3]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">Fiche de Rééducation Posturale & Autonome</h4>
                      <p className="text-[9px] text-slate-300 font-mono font-bold">Indexation ID : REHAB_FICH_#0{selectedFiche.id}</p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7fa4b3]/95 bg-[#1b3d4f] px-2 py-0.5 rounded">Générée par MPR AI Suite</span>
                    <p className="text-[9px] font-semibold text-slate-400 font-mono tracking-tight mt-0.5">{selectedFiche.date_generation}</p>
                  </div>
                </div>

                {/* Patient / Doctor Identity details inside sheet */}
                <div className="bg-slate-50 border-b border-indigo-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[8px] uppercase tracking-widest font-black text-slate-400">Patient / المريض :</span>
                    <div className="font-extrabold text-[#102e3b] text-sm">
                      {patient.Nom_Patient}
                    </div>
                    {patient.Nom_Pat_Arb && (
                      <div className="text-xs font-semibold text-indigo-900 leading-tight">
                        {patient.Pren_Pat_Arb || ''} {patient.Nom_Pat_Arb}
                      </div>
                    )}
                    <div className="text-slate-600 text-[10px] font-semibold space-y-0.5 mt-1">
                      <p>Âge : <span className="text-[#102e3b] font-extrabold">{patient.Age_Patient || 30} ans</span> | Genre : <span className="text-[#102e3b] font-extrabold">{patient.Genre_Patient}</span></p>
                      <p>Tél : <span className="text-[#102e3b] font-mono font-bold">{patient.phone || 'Non renseigné'}</span></p>
                      <p>Adresse : <span className="text-[#102e3b] italic">{patient.address || 'Alger'}</span></p>
                    </div>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200/55 pt-3 md:pt-0 md:pl-4">
                    <span className="block text-[8px] uppercase tracking-widest font-black text-slate-400">Médecin MPR Prescripteur :</span>
                    <div className="font-extrabold text-[#102e3b] text-sm">
                      Dr. {selectedConsult.medecin_mpr_nom}
                    </div>
                    <div className="text-slate-600 text-[10px] font-semibold space-y-0.5 mt-1">
                      <p>Qualité : <span className="text-[#102e3b] font-extrabold">Médecin MPR Chef</span></p>
                      <p>Date consultation : <span className="text-[#102e3b] font-mono font-bold">{selectedConsult.date_consultation}</span></p>
                      <p>Autonomie Marche : <span className="text-[#102e3b] font-bold">{selectedConsult.marche_sans_aide_technique ? 'Autonome (Sans aide technique)' : 'Besoin d\'assistance technique'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Prescription parameters summary bar */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-widest">Séances Kinésithérapie :</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm text-indigo-750">{selectedFiche.nombre_seances_kine} sessions</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-widest">Séances Balnéo :</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm text-indigo-750">{selectedFiche.nombre_seances_balneo} sessions</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-widest">Fréquence Hebdo :</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm text-indigo-750">{selectedFiche.frequence_hebdo} fois / sem</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-slate-400 uppercase font-bold text-[8px] tracking-widest">Durée Séance :</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm text-indigo-750">{selectedFiche.duree_quotidienne_minutes} minutes</span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Prescribed Actes List */}
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Actes Rééducatifs Prescrits (Relational Rule-matched Actes) :</span>
                    
                    <div className="space-y-2.5 mt-2">
                      {selectedFicheDetails.map((act, index) => (
                        <div key={act.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 hover:shadow-xs transition">
                          <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg border border-emerald-100 mt-0.5 text-xs font-black shrink-0">
                            #{index + 1}
                          </div>
                          <div>
                            <span className="bg-indigo-50 text-indigo-850 font-black text-[9px] uppercase px-1.5 py-0.2 rounded inline-block">
                              {act.categorie_acte}
                            </span>
                            <span className="bg-slate-50 text-slate-650 text-[9px] font-bold px-1.5 py-0.2 rounded ml-1 tracking-tight">Clé : ACT_AUTO_{act.id}</span>
                            <h6 className="font-extrabold text-slate-900 text-[11px] leading-snug mt-1">{act.intitule_acte}</h6>
                            <p className="text-[10px] text-slate-500 font-medium">Auto-prescrit en réponse aux anomalies du complexe moteur.</p>
                          </div>
                        </div>
                      ))}

                      {selectedFicheDetails.length === 0 && (
                        <span className="text-xs text-slate-400 italic block py-2">Aucun acte indexé sur cette fiche.</span>
                      )}
                    </div>
                  </div>

                  {/* Warning disclaimer */}
                  <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3 text-[10px] text-indigo-900 leading-relaxed font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      A l'évaluation systématique, cette fiche automatisée reste éditable et validée sous l'autorité absolue du Médecin Chef de Service MPR. Tout écart de testing musculaire autorise l'annulation de la séance.
                    </div>
                  </div>
                </div>

                {/* Print bottom bar action */}
                <div className="bg-slate-50/60 p-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 font-mono">Dernière synchronisation locale réussie</span>
                  <button
                    type="button"
                    onClick={handlePrintPrescription}
                    className="flex items-center gap-1.5 bg-[#102e3b] hover:bg-[#1b3d4f] text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer la Prescription</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-center text-rose-950 font-bold text-xs space-y-1">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <p>Aucune fiche de kinésithérapie générée pour cette consultation.</p>
                <p className="text-[10px] text-slate-500 font-normal">Veuillez générer ou lier des observations cliniques systématiques.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center space-y-2">
          <FileText className="w-10 h-10 text-indigo-300 mx-auto" />
          <div>
            <h5 className="font-extrabold text-[#112] text-xs uppercase tracking-wider">Pas de Bilan d'Échantillon Actif</h5>
            <p className="text-slate-500 text-[11px] font-medium">Sélectionnez une consultation en haut de l'onglet ou créez-en une nouvelle ci-dessus.</p>
          </div>
        </div>
      )}

      {showPrintPreview && selectedFiche && selectedConsult && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto animate-in fade-in duration-200" id="print-prescription-preview-modal">
          <div className="bg-slate-100 rounded-3xl p-6 border border-slate-205 w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal actions header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-650" />
                <h3 className="font-extrabold text-sm text-slate-800">Aperçu Avant Impression de l'Ordonnance Médicale MPR</h3>
              </div>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="text-slate-400 hover:text-slate-800 font-bold px-2 py-1 text-sm bg-white hover:bg-slate-50 border rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Sandbox Notice */}
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[10.5px] text-amber-850 font-semibold mb-3 shrink-0 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Information Pratique :</strong> Si l'impression directe est bloquée par votre navigateur, veuillez cliquer sur <strong>"Télécharger HTML"</strong> pour l'ouvrir et l'imprimer sans aucune restriction, ou utilisez le bouton d'impression ci-dessous.
              </span>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex-1 overflow-y-auto bg-white border border-slate-300 rounded-2xl p-8 max-w-[800px] mx-auto shadow-sm text-slate-900 font-serif leading-relaxed w-full" id="printable-prescription-preview-card">
              {/* HEADER */}
              <div className="flex justify-between items-start border-b-2 border-indigo-700 pb-4 text-xs font-sans not-italic">
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs text-indigo-950">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h4>
                  <p className="text-[10px] text-slate-650 font-extrabold">Service Publique de Rééducation & Réadaptation Fonctionnelle (MPR)</p>
                  <p className="text-[9.5px] text-slate-500 font-medium">Plateau d'Équipement Robotique & Rééducation Robotisée</p>
                </div>
                <div className="text-right space-y-0.5">
                  <h4 className="font-black text-xs text-indigo-900">الجمهورية الجزائرية الديمقراطية الشعبية</h4>
                  <p className="text-[10px] text-slate-650 font-extrabold">المصلحة العمومية لإنعاش و تأهيل الأعضاء الحركية طبقا للقوانين</p>
                </div>
              </div>

              {/* SHEET TITLE */}
              <div className="text-center my-6 space-y-1">
                <h2 className="font-sans font-black text-lg text-indigo-950 uppercase tracking-widest">PRESCRIPTION MEDICALE DE REEDUCATION</h2>
                <h3 className="font-sans font-extrabold text-[#112] text-xs">وصفة طبية لترويض الأعضاء</h3>
              </div>

              {/* IDENTITY METRICS */}
              <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 border border-slate-205 rounded-xl font-sans text-xs not-italic">
                <div className="space-y-1">
                  <p className="text-slate-400 uppercase tracking-wider font-extrabold text-[8px]">Nom du Patient (المريض) :</p>
                  <p className="font-black text-indigo-950 text-sm">{patient.Nom_Patient}</p>
                  {patient.Nom_Pat_Arb && (
                    <p className="text-xs font-semibold text-slate-750">{patient.Pren_Pat_Arb || ''} {patient.Nom_Pat_Arb}</p>
                  )}
                  <div className="text-slate-500 mt-1 font-bold">Âge : <strong className="text-slate-800">{patient.Age_Patient || 32} ans</strong> | Genre : <strong className="text-slate-800">{patient.Genre_Patient}</strong></div>
                </div>
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <p className="text-slate-400 uppercase tracking-wider font-extrabold text-[8px]">Médecin MPR Prescripteur (الطبيب المعالج) :</p>
                  <p className="font-black text-indigo-950 text-sm">Dr. {selectedConsult.medecin_mpr_nom}</p>
                  <p className="text-slate-500 font-bold">Qualité : <strong className="text-slate-800">Chef Praticien MPR</strong></p>
                  <p className="text-slate-500 font-bold">Le : <strong className="text-slate-800 font-mono">{selectedConsult.date_consultation}</strong></p>
                </div>
              </div>

              {/* GENERAL SESSIONS METRICS */}
              <div className="my-6 p-4 border-2 border-indigo-150 rounded-2xl font-sans text-xs not-italic grid grid-cols-2 md:grid-cols-4 gap-4 bg-indigo-50/20 text-indigo-950">
                <div>
                  <span className="block text-slate-500 font-bold text-[8.5px] uppercase">Séances Kiné :</span>
                  <strong className="text-sm font-black font-mono">{selectedFiche.nombre_seances_kine} sessions</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold text-[8.5px] uppercase">Séances Balnéo :</span>
                  <strong className="text-sm font-black font-mono">{selectedFiche.nombre_seances_balneo} sessions</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold text-[8.5px] uppercase">Fréquence Hebdo :</span>
                  <strong className="text-sm font-black font-mono">{selectedFiche.frequence_hebdo} fois/sem</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold text-[8.5px] uppercase">Durée Séance :</span>
                  <strong className="text-sm font-black font-mono">{selectedFiche.duree_quotidienne_minutes} mins</strong>
                </div>
              </div>

              {/* MEDICAL TREATMENT ACTS */}
              <div className="my-6 space-y-3 font-sans">
                <h4 className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Actes Systématiques Prescrits (برنامج التأهيل الحركي المستهدف) :</h4>
                <div className="divide-y divide-slate-150">
                  {selectedFicheDetails.map((det, index) => (
                    <div key={det.id} className="py-2.5 flex items-start gap-3">
                      <span className="bg-indigo-650 text-white font-extrabold px-1.5 py-0.5 rounded text-[9.5px] font-mono shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-[8px] bg-slate-100 border text-slate-600 font-bold px-1.5 py-0.2 rounded uppercase">
                          {det.categorie_acte}
                        </span>
                        <h5 className="font-extrabold text-[11px] text-slate-900 mt-0.5">{det.intitule_acte}</h5>
                      </div>
                    </div>
                  ))}
                  {selectedFicheDetails.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-2">Aucun acte d'évaluation trouvé.</p>
                  )}
                </div>
              </div>

              {/* FOOTER SIGNATURES */}
              <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 text-xs font-sans not-italic text-slate-650">
                <div>
                  <p className="font-bold">Cachet de la Caisse & Admission</p>
                  <p className="text-[10px] text-slate-400 mt-8 font-serif">Signature Administrative</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Signature & Cachet du Médecin MPR</p>
                  <div className="text-[10px] text-slate-400 mt-6 font-semibold">
                    <p>Dr. {selectedConsult.medecin_mpr_nom}</p>
                    <p className="text-[8px] text-indigo-750 font-black">VALIDATION NATIONALE MPR</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal actions footer */}
            <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-3.5 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try {
                    const printContents = document.getElementById('printable-prescription-preview-card')?.innerHTML;
                    const printWindow = window.open('', '_blank');
                    if (printWindow && printContents) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Prescription Médicale MPR - ${patient.Nom_Patient}</title>
                            <style>
                              body { font-family: sans-serif; padding: 40px; color: #1a3038; background: #fff; }
                              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                              .text-right { text-align: right; }
                              .border-b-2 { border-bottom: 2px solid #1d4ed8; }
                              .border-t { border-top: 1px solid #e2e8f0; }
                              .border-2 { border: 2px solid #e2e8f0; }
                              .p-4 { padding: 16px; }
                              .bg-slate-50 { background-color: #f8fafc; }
                              .rounded-xl { border-radius: 12px; }
                              .rounded-2xl { border-radius: 16px; }
                              .font-mono { font-family: monospace; }
                              .text-indigo-950 { color: #020617; }
                              .font-black { font-weight: 900; }
                              .font-extrabold { font-weight: 800; }
                              .font-bold { font-weight: 700; }
                              .uppercase { text-transform: uppercase; }
                              .tracking-wider { letter-spacing: 0.05em; }
                              .divide-y > * + * { border-top: 1px solid #e2e8f0; }
                              .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
                              .flex { display: flex; }
                              .justify-between { display: flex; justify-content: space-between; }
                              .gap-3 { gap: 12px; }
                              .mt-10 { margin-top: 40px; }
                              .pt-8 { padding-top: 32px; }
                              .text-center { text-align: center; }
                              @media print {
                                body { padding: 0; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContents}
                            <script>
                              setTimeout(function() {
                                window.print();
                                window.close();
                              }, 400);
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    } else {
                      window.print();
                    }
                  } catch (e: any) {
                    console.error("Window open print failed:", e);
                    window.focus();
                    window.print();
                  }
                }}
                className="px-5 py-2.5 bg-[#102e3b] hover:bg-[#1b3d4f] text-white text-[11px] font-black rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Lancer l'Impression native</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pId = patient.ID_Patient;
                  const content = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Prescription Médicale MPR - PAT_#0${pId}</title>
    <style>
        body { font-family: sans-serif; padding: 40px; color: #1a3038; max-width: 800px; margin: auto; border: 1px solid #ccc; border-radius: 12px; }
        .text-center { text-align: center; }
        .flex { display: flex; }
        .justify-between { display: flex; justify-content: space-between; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .p-4 { padding: 16px; }
        .bg-slate-50 { background-color: #f8fafc; border-radius: 8px; border: 1px solid #eee; }
        .border-t { border-top: 1px solid #eee; }
        @media print { body { border: none; padding: 0; } }
    </style>
</head>
<body>
    <div style="border-bottom: 2px solid #1a3038; padding-bottom: 15px;" class="justify-between flex">
        <div>
            <h3>REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</h3>
            <p>Service de Rééducation & Réadaptation Fonctionnelle (MPR)</p>
        </div>
        <div style="text-align: right;">
            <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
            <p>المصلحة العمومية لإنعاش و تأهيل الأعضاء الحركية</p>
        </div>
    </div>
    <div class="text-center" style="margin: 30px 0;">
        <h2>PRESCRIPTION MEDICALE DE REEDUCATION</h2>
    </div>
    <div class="grid p-4 bg-slate-50">
        <div>
            <strong>Patient :</strong> ${patient.Nom_Patient}<br>
            Âge : ${patient.Age_Patient || 30} ans | Genre : ${patient.Genre_Patient}
        </div>
        <div>
            <strong>Médecin MPR Prescripteur :</strong> Dr. ${selectedConsult.medecin_mpr_nom}<br>
            Date : ${selectedConsult.date_consultation}
        </div>
    </div>
    <div style="margin: 20px 0; padding: 15px; border: 1px solid #ccc; border-radius: 8px;">
        <p><strong>Séances de Kinésithérapie :</strong> ${selectedFiche.nombre_seances_kine} sessions</p>
        <p><strong>Séances de Balnéothérapie :</strong> ${selectedFiche.nombre_seances_balneo} sessions</p>
        <p><strong>Fréquence :</strong> ${selectedFiche.frequence_hebdo} fois par semaine | <strong>Durée :</strong> ${selectedFiche.duree_quotidienne_minutes} minutes</p>
    </div>
    <div style="margin: 30px 0;">
        <h4>Actes Rééducatifs Prescrits :</h4>
        <ul>
            ${selectedFicheDetails.map(act => `<li><strong>${act.categorie_acte}</strong> : ${act.intitule_acte}</li>`).join('')}
        </ul>
    </div>
    <div style="margin-top: 50px;" class="justify-between flex">
        <div>Cachet Administratif</div>
        <div style="text-align: right;">Dr. ${selectedConsult.medecin_mpr_nom}</div>
    </div>
    <script>
        setTimeout(function() { window.print(); }, 300);
    </script>
</body>
</html>`;
                  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Prescription_MPR_PAT_#0${patient.ID_Patient}_FICH_${selectedFiche.id}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  triggerToast("Document HTML d'ordonnance téléchargé avec succès !", "success");
                }}
                className="px-5 py-2.5 bg-[#102e3b]/85 hover:bg-[#102e3b] text-white text-[11px] font-black rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Télécharger HTML</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-5 py-2.5 bg-slate-350 bg-slate-300 hover:bg-slate-400 text-slate-700 text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
