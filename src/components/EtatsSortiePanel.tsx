/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  Download, 
  Search, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Calendar, 
  Tag, 
  Award,
  Users,
  RefreshCw,
  Clock,
  ClipboardList
} from 'lucide-react';
import { DatabaseState, Abonnement, Patient, Pack, Acte, Versement, Seance, isAbonnementGele } from '../dbStore';
import * as XLSX from 'xlsx';

interface EtatsSortiePanelProps {
  dbState: DatabaseState;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type OutputView = 'abonnements' | 'recouvrements' | 'fiche_pointage';

export const EtatsSortiePanel: React.FC<EtatsSortiePanelProps> = ({ dbState, triggerToast }) => {
  const [activeView, setActiveView] = useState<OutputView>('abonnements');

  // --- ÉTAT 1 : LISTING DES ABONNEMENTS & CONSOMMATIONS ---
  const [searchAbnPatient, setSearchAbnPatient] = useState('');
  const [filterPackId, setFilterPackId] = useState<string>('all');
  const [filterEtatAbn, setFilterEtatAbn] = useState<string>('all');

  // --- ÉTAT 2 : BILAN FINANCIER DES RECOUVREMENTS ---
  const [searchFinPatient, setSearchFinPatient] = useState('');
  const [filterPayStatut, setFilterPayStatut] = useState<'all' | 'full' | 'partial' | 'unpaid'>('all');

  // --- ÉTAT 4 : SITUATION JOURNALIÈRE DES ABONNÉS ---
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [dailyReportDate, setDailyReportDate] = useState(new Date().toISOString().split('T')[0]);

  // --- ÉTAT 3 : FICHE CLINIQUE DE POINTAGE ---
  const [selectedPatIdForFiche, setSelectedPatIdForFiche] = useState<number | null>(null);
  const [selectedAbnIdForFiche, setSelectedAbnIdForFiche] = useState<number | null>(null);

  // helpers
  const getPatientName = (pId: number) => {
    const p = dbState.patients.find(x => x.ID_Patient === pId);
    return p ? p.Nom_Patient : `Patient ID ${pId}`;
  };

  const getPatientObj = (pId: number) => {
    return dbState.patients.find(x => x.ID_Patient === pId);
  };

  const getPackObj = (packId: number) => {
    return dbState.packs.find(x => x.ID_Pack === packId);
  };

  const getActeObj = (acteId: number | null) => {
    if (!acteId) return null;
    return dbState.actes.find(x => x.ID_Acte === acteId);
  };

  const getAbnCalculatedPrices = (abn: Abonnement) => {
    const pack = getPackObj(abn.ID_Pack);
    const packPrice = pack?.Prix_Pack ?? 0;
    const act1 = getActeObj(abn.ID_Acte_Add1);
    const act2 = getActeObj(abn.ID_Acte_Add2);
    
    const act1Price = act1?.Prix_Acte ?? 0;
    const act2Price = act2?.Prix_Acte ?? 0;
    
    const totalPrice = packPrice + act1Price + act2Price;
    
    // Versements
    const abnVersements = dbState.versements.filter(v => v.ID_Abn === abn.ID_Abn);
    const totalPaid = abnVersements.reduce((sum, v) => sum + v.Mont_Vers, 0);
    const remaining = totalPrice - totalPaid;

    return {
      packPrice,
      act1Price,
      act2Price,
      totalPrice,
      totalPaid,
      remaining
    };
  };

  // Filtrage d'abonnements
  const filteredAbonnements = dbState.abonnements.filter(abn => {
    const pName = getPatientName(abn.ID_Patient).toLowerCase();
    const matchSearch = pName.includes(searchAbnPatient.toLowerCase());
    const matchPack = filterPackId === 'all' || abn.ID_Pack === Number(filterPackId);
    
    const pack = getPackObj(abn.ID_Pack);
    const totalSessions = pack?.Nbre_Seance_Pack ?? 10;
    const isGele = isAbonnementGele(abn, dbState);
    
    let currentEtat = 'Actif';
    if (abn.Nbre_Sean_Consom_Abn >= totalSessions) {
      currentEtat = 'Fermé';
    } else if (isGele) {
      currentEtat = 'Gelé';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (abn.Date_Fin_Abn < today) {
        currentEtat = 'Expiré';
      }
    }

    const matchEtat = filterEtatAbn === 'all' || currentEtat === filterEtatAbn;

    return matchSearch && matchPack && matchEtat;
  });

  // Filtrage financier / recouvrement
  const filteredRecouvrements = dbState.abonnements.filter(abn => {
    const pName = getPatientName(abn.ID_Patient).toLowerCase();
    const matchSearch = pName.includes(searchFinPatient.toLowerCase());

    const { totalPrice, totalPaid, remaining } = getAbnCalculatedPrices(abn);
    
    let statut: 'full' | 'partial' | 'unpaid' = 'unpaid';
    if (remaining <= 0) statut = 'full';
    else if (totalPaid > 0) statut = 'partial';

    const matchStatut = filterPayStatut === 'all' || statut === filterPayStatut;

    return matchSearch && matchStatut;
  });

  // EXPORT VERS EXCEL : LISTING DES ABONNEMENTS
  const exportAbonnementsExcel = () => {
    try {
      const exportData = filteredAbonnements.map((abn) => {
        const pack = getPackObj(abn.ID_Pack);
        const act1 = getActeObj(abn.ID_Acte_Add1);
        const act2 = getActeObj(abn.ID_Acte_Add2);
        const { totalPrice, totalPaid, remaining } = getAbnCalculatedPrices(abn);
        
        let currentEtat = 'Actif';
        if (abn.Nbre_Sean_Consom_Abn >= (pack?.Nbre_Seance_Pack ?? 10)) currentEtat = 'Fermé';
        else if (!!(abn as any).Est_Gele) currentEtat = 'Désactivé';
        else if (abn.Date_Fin_Abn < new Date().toISOString().split('T')[0]) currentEtat = 'Expiré';

        return {
          "ID Abonnement": `ABN_${abn.ID_Abn}`,
          "Patient": getPatientName(abn.ID_Patient),
          "Forfait / Forfait principal": pack?.Libelle_Pack ?? "Néant",
          "Date de Début": abn.Date_Debut_Abn,
          "Date de Fin": abn.Date_Fin_Abn,
          "Séances Consommées": abn.Nbre_Sean_Consom_Abn,
          "Total Séances": pack?.Nbre_Seance_Pack ?? 10,
          "Solde Restant": (pack?.Nbre_Seance_Pack ?? 10) - abn.Nbre_Sean_Consom_Abn,
          "Acte Additionnel 1": act1?.Libelle_Acte ?? "Aucun",
          "Acte Additionnel 2": act2?.Libelle_Acte ?? "Aucun",
          "Prix global d'Abonnement (DA)": totalPrice,
          "Total Réglé (DA)": totalPaid,
          "Reste à Recouvrer (DA)": remaining,
          "Statut Clinique": currentEtat
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Abonnements");
      XLSX.writeFile(wb, `Listing_Abonnements_Patients_${new Date().toISOString().split('T')[0]}.xlsx`);
      triggerToast("Le listing des abonnements a été exporté au format Excel avec succès !", "success");
    } catch (err: any) {
      triggerToast(`Erreur lors de l'exportation : ${err.message}`, "error");
    }
  };

  // EXPORT VERS EXCEL : BILAN DES RECOUVREMENTS
  const exportFinancesExcel = () => {
    try {
      const exportData = filteredRecouvrements.map((abn) => {
        const pack = getPackObj(abn.ID_Pack);
        const { totalPrice, totalPaid, remaining } = getAbnCalculatedPrices(abn);
        
        let situation = "Non Réglé";
        if (remaining <= 0) situation = "Totalement Réglé";
        else if (totalPaid > 0) situation = "Partiellement Réglé";

        return {
          "Caisse Référence": "Caisse Abonnement / Autres Soins",
          "ID Abonnement": `ABN_${abn.ID_Abn}`,
          "Patient bénéficiaire": getPatientName(abn.ID_Patient),
          "Pack / Forfait": pack?.Libelle_Pack ?? "Forfait libre",
          "Montant Total d'Abonnement (DA)": totalPrice,
          "Versement Cumulé effectué (DA)": totalPaid,
          "Reste Dû à la Caisse (DA)": remaining,
          "Etat de Solvabilité": situation
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fiche_Recouvrement_Caisse");
      XLSX.writeFile(wb, `Bilan_Recouvrement_Caisse_${new Date().toISOString().split('T')[0]}.xlsx`);
      triggerToast("Le bilan des recouvrements caisse a été exporté avec succès !", "success");
    } catch (err: any) {
      triggerToast(`Erreur lors de l'exportation : ${err.message}`, "error");
    }
  };

  // DIRECT PRINT ENGINE FOR SECTIONS
  const handlePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
      triggerToast("Erreur : Impossible de trouver la zone imprimable.", "error");
      return;
    }
    
    // Sauvegarder l'état original
    const originalContent = document.body.innerHTML;
    const printHTML = printContent.innerHTML;
    
    // Créer une structure d'impression propre sans bruits d'interface
    document.body.innerHTML = `
      <html>
        <head>
          <title>État de Sortie Clinique</title>
          <style>
            @media print {
              body { 
                font-family: 'Inter', sans-serif, 'Times New Roman'; 
                color: #000; 
                background: #fff; 
                padding: 2.5cm 1.5cm;
              }
              .no-print { display: none !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
              th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 11px; }
              th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
              h1, h2, h3 { font-family: 'Times New Roman', serif; text-align: center; }
              .header-logo { text-align: center; font-weight: bold; margin-bottom: 25px; border-bottom: 2px double #000; padding-bottom: 12px; }
              .footer-signature { margin-top: 50px; display: flex; justify-content: space-between; }
              .signature-box { width: 45%; border-top: 1px dashed #000; text-align: center; padding-top: 10px; font-style: italic; }
              .arabic-text { font-family: 'Georgia', serif; direction: rtl; text-align: right; font-size: 13px; }
            }
          </style>
        </head>
        <body>
          <div class="header-logo">
            <div style="font-size: 16px; text-transform: uppercase;">République Algérienne Démocratique et Populaire</div>
            <div style="font-size: 15px; font-weight: bold; margin-top: 4px;">Cabinet Clinique de Médecine Clinique &amp; Rééducation Fonctionnelle</div>
            <div style="font-size: 10px; color: #555; margin-top: 2px;">Service MPR - Module des États de Sortie</div>
          </div>
          ${printHTML}
          <div class="footer-signature">
            <div class="signature-box">Signature &amp; Cachet du Praticien Responsable</div>
            <div class="signature-box">Signature du Patient Adhérent ou Tuteur</div>
          </div>
          <div style="text-align: center; font-size: 8px; color: #777; margin-top: 80px; position: fixed; bottom: 10px; left: 0; right: 0;">
            Imprimé le ${new Date().toLocaleString('fr-FR')} - v2.4 Clinique Active Connectée
          </div>
        </body>
      </html>
    `;
    
    window.print();
    
    // Recharger la page après impression pour restaurer l'application intacte
    window.location.reload();
  };

  // Fiche Active calculée
  const selectedPatientObj = dbState.patients.find(x => x.ID_Patient === selectedPatIdForFiche);
  const patientActiveAbonnements = selectedPatIdForFiche 
    ? dbState.abonnements.filter(a => a.ID_Patient === selectedPatIdForFiche) 
    : [];

  const selectedAbnObj = dbState.abonnements.find(x => x.ID_Abn === selectedAbnIdForFiche);
  const selectedAbnPack = selectedAbnObj ? getPackObj(selectedAbnObj.ID_Pack) : null;
  const selectedAbnPrices = selectedAbnObj ? getAbnCalculatedPrices(selectedAbnObj) : null;

  // Calculs statistiques
  const totalAbnCompte = dbState.abonnements.length;
  const activeAbnCompte = dbState.abonnements.filter(a => {
    const pack = getPackObj(a.ID_Pack);
    const tot = pack?.Nbre_Seance_Pack ?? 10;
    const isGele = isAbonnementGele(a, dbState);
    const today = new Date().toISOString().split('T')[0];
    return a.Nbre_Sean_Consom_Abn < tot && !isGele && a.Date_Fin_Abn >= today;
  }).length;
  
  const totalMoneyCollected = dbState.versements.reduce((sum, v) => sum + v.Mont_Vers, 0);
  const totalSessionsDone = dbState.seances.length;

  const dailyAbonnements = dbState.abonnements.filter(abn => abn.Date_Debut_Abn === dailyReportDate);

  const dailyReportView = (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Aperçu : Situation Journalière des Abonnés</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Édition & Mise en page avant tirage</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Journée du :</span>
              <input 
                type="date" 
                value={dailyReportDate}
                onChange={(e) => setDailyReportDate(e.target.value)}
                className="text-xs font-black text-indigo-700 focus:outline-none cursor-pointer"
              />
            </div>
            <button 
              onClick={() => setShowDailyReport(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
            >✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
          <div 
            id="daily-subscriber-report-content"
            className="bg-white w-[210mm] min-h-[297mm] p-[2cm] shadow-xl border border-slate-200 relative font-sans text-slate-900"
            contentEditable
            suppressContentEditableWarning
          >
            {/* Header Officiel */}
            <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 mb-8">
              <div className="font-bold text-[13px] uppercase tracking-[0.2em] text-slate-800">République Algérienne Démocratique et Populaire</div>
              <div className="font-black text-lg uppercase text-slate-950 font-serif">Cabinet de Médecine Clinique &amp; Rééducation</div>
              <div className="text-[10px] text-slate-500 font-bold tracking-widest">RAPPORT QUOTIDIEN DES NOUVELLES ADHÉSIONS</div>
            </div>

            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Situation Journalière</h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Extraite le : {new Date().toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  Date de référence : {new Date(dailyReportDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Tableau principal */}
            <table className="w-full border-collapse border-2 border-slate-900 mb-10">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900">
                  <th className="border-r-2 border-slate-900 p-2 text-[10px] font-black uppercase text-center w-12">N°</th>
                  <th className="border-r-2 border-slate-900 p-2 text-[10px] font-black uppercase text-left">Nom & Prénom du Patient</th>
                  <th className="border-r-2 border-slate-900 p-2 text-[10px] font-black uppercase text-left w-32">Pack / Forfait</th>
                  <th className="border-r-2 border-slate-900 p-2 text-[10px] font-black uppercase text-center w-24">Prix Pack</th>
                  <th className="border-r-2 border-slate-900 p-2 text-[10px] font-black uppercase text-center w-24">Versé</th>
                  <th className="p-2 text-[10px] font-black uppercase text-center w-24">Reste</th>
                </tr>
              </thead>
              <tbody>
                {dailyAbonnements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 italic text-xs">Aucune adhésion enregistrée pour cette journée.</td>
                  </tr>
                ) : (
                  dailyAbonnements.map((abn, idx) => {
                    const pack = getPackObj(abn.ID_Pack);
                    const prices = getAbnCalculatedPrices(abn);
                    return (
                      <tr key={abn.ID_Abn} className="border-b border-slate-300">
                        <td className="border-r-2 border-slate-900 p-2 text-center font-mono text-[11px] font-bold">{idx + 1}</td>
                        <td className="border-r-2 border-slate-900 p-2 text-xs font-bold">{getPatientName(abn.ID_Patient)}</td>
                        <td className="border-r-2 border-slate-900 p-2 text-[11px]">{pack?.Libelle_Pack}</td>
                        <td className="border-r-2 border-slate-900 p-2 text-center font-mono text-[11px] font-bold">{prices.totalPrice}</td>
                        <td className="border-r-2 border-slate-900 p-2 text-center font-mono text-[11px] font-bold text-emerald-800">{prices.totalPaid}</td>
                        <td className="p-2 text-center font-mono text-[11px] font-bold text-rose-700">{prices.remaining}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {dailyAbonnements.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-900">
                    <td colSpan={3} className="border-r-2 border-slate-900 p-2 text-[10px] font-black text-right uppercase">Totaux de la Journée :</td>
                    <td className="border-r-2 border-slate-900 p-2 text-center font-mono text-xs font-black">{dailyAbonnements.reduce((s, a) => s + (getPackObj(a.ID_Pack)?.Prix_Pack ?? 0), 0)}</td>
                    <td className="border-r-2 border-slate-900 p-2 text-center font-mono text-xs font-black text-emerald-900">
                      {dailyAbonnements.reduce((s, a) => s + getAbnCalculatedPrices(a).totalPaid, 0)}
                    </td>
                    <td className="p-2 text-center font-mono text-xs font-black text-rose-900">
                      {dailyAbonnements.reduce((s, a) => s + getAbnCalculatedPrices(a).remaining, 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            <div className="text-[10px] text-slate-500 italic mb-10 pb-4 border-b border-dotted">
              * Note : Ce document est un état de situation interne destiné à la gestion administrative quotidienne des flux d'abonnements.
            </div>

            <div className="flex justify-between items-start pt-10">
              <div className="text-center w-48">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-16">Le Gestionnaire / Accueil</p>
                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-400">Nom &amp; Signature</div>
              </div>
              <div className="text-center w-64">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-16">Visa du Responsable Administratif</p>
                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-400">Cachet &amp; Date</div>
              </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center text-[8px] text-slate-300 font-mono">
              SYSTEME CLINI-ACTIVE-PRO - GENERATED ON {new Date().toISOString()}
            </div>
          </div>
        </div>

        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 font-bold text-xs">
           <p className="mr-auto text-slate-400 flex items-center gap-1.5 italic font-medium">
             <AlertTriangle className="w-3.5 h-3.5" />
             Vous pouvez cliquer sur le texte pour le modifier manuellement avant impression (Mode Édition).
           </p>
          <button 
            onClick={() => setShowDailyReport(false)}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition"
          >Annuler</button>
          <button 
            onClick={() => handlePrint('daily-subscriber-report-content')}
            className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl flex items-center gap-2 transform active:scale-95 transition"
          >
            <Printer className="w-4.5 h-4.5" /> Lancer le tirage papier
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl border border-stone-250 shadow-md p-5 space-y-6 animate-fade-in" id="etats-sortie-main-panel">
      {/* HEADER DE LA COMPOSANTE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 text-white rounded-2xl shadow-sm" style={{ backgroundColor: '#606C5A' }}>
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#102e3b] font-serif text-lg">Les États de sortie cliniques &amp; administratifs</h3>
            <p className="text-xs text-slate-500">Générez et imprimez des listings d'abonnement officiels, bilans de caisse et fiches de pointage.</p>
          </div>
        </div>

        {/* COMMUTATEUR D'ONGLETS INTERNES */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveView('abonnements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'abonnements'
                ? 'bg-white shadow text-[#102e3b] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Abonnements
          </button>
          <button
            onClick={() => setActiveView('recouvrements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'recouvrements'
                ? 'bg-white shadow text-[#102e3b] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💵 Recouvrements
          </button>
          <button
            onClick={() => setActiveView('fiche_pointage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'fiche_pointage'
                ? 'bg-white shadow text-[#102e3b] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🖨️ Fiche de Pointage
          </button>
        </div>
      </div>

      {/* --- VUE 1 : LISTING DES ABONNEMENTS & CONSOMMATIONS --- */}
      {activeView === 'abonnements' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par nom de patient..."
                value={searchAbnPatient}
                onChange={(e) => setSearchAbnPatient(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <select
                value={filterPackId}
                onChange={(e) => setFilterPackId(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
              >
                <option value="all">📦 Tous les Packs</option>
                {dbState.packs.map(p => (
                  <option key={p.ID_Pack} value={p.ID_Pack}>{p.Libelle_Pack}</option>
                ))}
              </select>
              <select
                value={filterEtatAbn}
                onChange={(e) => setFilterEtatAbn(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
              >
                <option value="all">📍 Tous les États</option>
                <option value="Actif">Actif</option>
                <option value="Fermé">Fermé (Consommé)</option>
                <option value="Gelé">Gelé (Suspendu)</option>
                <option value="Expiré">Expiré (Date dépassée)</option>
              </select>
              <div className="col-span-2 md:col-span-1 flex gap-1">
                <button
                  onClick={() => setShowDailyReport(true)}
                  className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                  title="Situation Journalière des Absonnés"
                >
                  📊 Situation Journ.
                </button>
                <button
                  onClick={exportAbonnementsExcel}
                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={() => handlePrint('table-abonnements-print')}
                  className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer"
                  title="Imprimer directement"
                >
                  <Printer className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ZONE IMPRIMABLE DU LISTING */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-xs" id="table-abonnements-print">
            <h4 className="hidden print:block text-center font-bold text-lg mb-4">ÉTAT COMPLAINT DES ABONNEMENTS ET DES CONSOMMATIONS DES SÉANCES</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ backgroundColor: '#606C5A', color: 'white' }} className="print:bg-slate-100 print:text-black uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3 pl-4">Abonnement ID</th>
                    <th className="p-3">Identité Patient</th>
                    <th className="p-3">Forfait Principal</th>
                    <th className="p-3">Validité</th>
                    <th className="p-3 text-center">Séance Consommée</th>
                    <th className="p-3 text-center">Solde Restant</th>
                    <th className="p-3">Situation Clinique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredAbonnements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-405 italic">
                        Aucun abonnement trouvé avec les critères spécifiés.
                      </td>
                    </tr>
                  ) : (
                    filteredAbonnements.map((abn) => {
                      const pack = getPackObj(abn.ID_Pack);
                      const tot = pack?.Nbre_Seance_Pack ?? 10;
                      const rem = tot - abn.Nbre_Sean_Consom_Abn;
                      const isGele = isAbonnementGele(abn, dbState);

                      let badgeCol = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      let currentEtat = 'Actif';
                      if (abn.Nbre_Sean_Consom_Abn >= tot) {
                        badgeCol = "bg-stone-100 text-stone-600 border-stone-200";
                        currentEtat = "Fermé";
                      } else if (isGele) {
                        badgeCol = "bg-amber-100 text-amber-800 border-amber-200";
                        currentEtat = "Gelé";
                      } else {
                        const today = new Date().toISOString().split('T')[0];
                        if (abn.Date_Fin_Abn < today) {
                          badgeCol = "bg-rose-50 text-rose-800 border-rose-200";
                          currentEtat = "Expiré";
                        }
                      }

                      return (
                        <tr key={abn.ID_Abn} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 pl-4 font-bold text-slate-700">ABN_{abn.ID_Abn}</td>
                          <td className="p-3 font-semibold text-slate-900">{getPatientName(abn.ID_Patient)}</td>
                          <td className="p-3 text-slate-700 font-medium">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-slate-420 shrink-0" />
                              {pack?.Libelle_Pack ?? "Forfait Standard"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] font-medium font-mono">
                            Du {abn.Date_Debut_Abn} au {abn.Date_Fin_Abn}
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-900 text-sm">
                            {abn.Nbre_Sean_Consom_Abn} <span className="text-[10px] text-slate-400 font-normal">/ {tot}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800 text-sm">
                            {rem}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 border text-[9px] font-bold rounded-full ${badgeCol}`}>
                              {currentEtat}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VUE 2 : BILAN FINANCIER DES RECOUVREMENTS (CAISSE) --- */}
      {activeView === 'recouvrements' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par patient..."
                value={searchFinPatient}
                onChange={(e) => setSearchFinPatient(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterPayStatut}
                onChange={(e) => setFilterPayStatut(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
              >
                <option value="all">💳 Solvabilité (Tous)</option>
                <option value="full">🟢 Totalement Réglé</option>
                <option value="partial">🟡 Partiellement Réglé</option>
                <option value="unpaid">🔴 Non Réglé</option>
              </select>
              <button
                onClick={exportFinancesExcel}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={() => handlePrint('table-recouvrements-print')}
                className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer"
              >
                <Printer className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* ZONE IMPRIMABLE RECOUVREMENT */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="table-recouvrements-print">
            <h4 className="hidden print:block text-center font-bold text-lg mb-4">RAPPORT ET SOLDE DE RECOUVREMENT DE LA CAISSE CLINIQUE - ABONNEMENTS</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ backgroundColor: '#606C5A', color: 'white' }} className="print:bg-slate-100 print:text-black uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3 pl-4">Abonnement ID</th>
                    <th className="p-3">Patient Bénéficiaire</th>
                    <th className="p-3">Libellé du Pack</th>
                    <th className="p-3 text-right">Prix Total (Abonn. + Options)</th>
                    <th className="p-3 text-right">Total Versé</th>
                    <th className="p-3 text-right">Reste à Réglé</th>
                    <th className="p-3 text-center">État Caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredRecouvrements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-405 italic">
                        Aucun abonnement trouvé dans cette tranche financière.
                      </td>
                    </tr>
                  ) : (
                    filteredRecouvrements.map((abn) => {
                      const pack = getPackObj(abn.ID_Pack);
                      const { totalPrice, totalPaid, remaining } = getAbnCalculatedPrices(abn);

                      let badgeText = "Non Réglé";
                      let badgeCol = "bg-rose-50 text-rose-800 border-rose-200";

                      if (remaining <= 0) {
                        badgeText = "Réglé";
                        badgeCol = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      } else if (totalPaid > 0) {
                        badgeText = "Partiel";
                        badgeCol = "bg-amber-100 text-amber-800 border-amber-200";
                      }

                      return (
                        <tr key={abn.ID_Abn} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 pl-4 font-bold text-slate-700">ABN_{abn.ID_Abn}</td>
                          <td className="p-3 font-semibold text-slate-900">{getPatientName(abn.ID_Patient)}</td>
                          <td className="p-3 font-medium text-slate-700">{pack?.Libelle_Pack ?? "Forfait"}</td>
                          <td className="p-3 text-right font-bold text-slate-900 font-mono">{totalPrice.toLocaleString()} DA</td>
                          <td className="p-3 text-right font-bold text-emerald-700 font-mono">{totalPaid.toLocaleString()} DA</td>
                          <td className="p-3 text-right font-bold text-rose-700 font-mono">{remaining.toLocaleString()} DA</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 border text-[9px] font-bold rounded-lg uppercase ${badgeCol}`}>
                              {badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VUE 3 : FICHE CLINIQUE DE POINTAGE INDIVIDUELLE --- */}
      {activeView === 'fiche_pointage' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Étape 1 : Choisir le patient</label>
              <select
                value={selectedPatIdForFiche ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedPatIdForFiche(val);
                  setSelectedAbnIdForFiche(null);
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white font-bold"
              >
                <option value="">-- Sélectionnez un patient --</option>
                {dbState.patients.map(p => (
                  <option key={p.ID_Patient} value={p.ID_Patient}>{p.Nom_Patient}</option>
                ))}
              </select>
            </div>
            {selectedPatIdForFiche && (
              <div className="flex-1 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Étape 2 : Choisir l'abonnement en cours/passé</label>
                <select
                  value={selectedAbnIdForFiche ?? ''}
                  onChange={(e) => setSelectedAbnIdForFiche(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="">-- Sélectionnez un abonnement --</option>
                  {patientActiveAbonnements.map(ab => {
                    const pk = getPackObj(ab.ID_Pack);
                    return (
                      <option key={ab.ID_Abn} value={ab.ID_Abn}>
                        ABN_{ab.ID_Abn} - {pk?.Libelle_Pack} (du {ab.Date_Debut_Abn})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* FICHE DE POINTAGE PRÉVISUALISATION DIRECTE */}
          {selectedAbnObj && selectedPatientObj ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
                <span className="text-xs text-slate-600 font-semibold">🔍 Modèle de Fiche certifié prêt pour l'édition et l'impression clinique</span>
                <button
                  onClick={() => handlePrint('fiche-eval-pointage-print')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Lancer l'impression Papier
                </button>
              </div>

              {/* BLOC IMPRESSIF DE DESIGN */}
              <div 
                className="bg-white border rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-sm relative overflow-hidden" 
                id="fiche-eval-pointage-print"
              >
                {/* Cadre décoratif ou Filigrane Médical */}
                <div className="absolute right-4 top-4 border-2 border-slate-900 text-slate-900 p-2 font-mono text-[9px] font-bold text-center uppercase tracking-widest rounded-lg">
                  DOSSIER CLINIQUE<br/>ABN_{selectedAbnObj.ID_Abn}
                </div>

                <div className="text-center pb-5 border-b-2 border-slate-800">
                  <h3 className="font-serif font-black text-xl text-slate-900 uppercase">FICHE CLINIQUE DE SUIVI &amp; POINTAGE DES SÉANCES</h3>
                  <p className="text-xs text-slate-500 font-medium">Cabinet Spécialisé MPR &amp; Réadaptation Gériatrique, Pédiatrique &amp; Neurologique</p>
                </div>

                {/* IDENTITÉ DU PATIENT */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-3 bg-slate-50 border rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Identité Civile du Patient</span>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedPatientObj.Nom_Patient}</p>
                    {selectedPatientObj.Nom_Pat_Arb && (
                      <p className="arabic-text text-sm font-semibold text-slate-705 mt-1">{selectedPatientObj.Nom_Pat_Arb} {selectedPatientObj.Pren_Pat_Arb}</p>
                    )}
                    <span className="text-[10px] text-slate-500 block">Genre : <strong>{selectedPatientObj.Genre_Patient}</strong> | Âge : <strong>{selectedPatientObj.Age_Patient || selectedPatientObj.Age_Pat || "N/A"} ans</strong></span>
                    <span className="text-[10px] text-slate-500 block">Téléphone : <strong>{selectedPatientObj.phone || 'Non renseigné'}</strong></span>
                  </div>

                  <div className="space-y-1.5 p-3 bg-slate-50 border rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Caractéristiques de l'Abonnement</span>
                    <p className="font-bold text-slate-900 text-xs">Forfait souscrit : <span className="font-extrabold text-indigo-900">{selectedAbnPack?.Libelle_Pack}</span></p>
                    <p className="text-[11px] text-slate-600 font-medium">Nombre de séances : <strong>{selectedAbnPack?.Nbre_Seance_Pack ?? 10} séances</strong></p>
                    <p className="text-[11px] text-slate-600 font-medium font-mono text-[10px]">Période : Du {selectedAbnObj.Date_Debut_Abn} au {selectedAbnObj.Date_Fin_Abn}</p>
                    {selectedAbnPrices && (
                      <p className="text-[10.5px] text-slate-700 font-semibold">Règlement Caisse : <span className="font-extrabold text-emerald-800">{selectedAbnPrices.totalPaid.toLocaleString()} DA</span> versés / {selectedAbnPrices.totalPrice.toLocaleString()} DA</p>
                    )}
                  </div>
                </div>

                {/* ACTES MÉDICAUX & OPTIONNELS EN COUVERTURE */}
                <div className="border rounded-xl p-3 bg-[#c8e0de]/10 border-[#9bb8ba]/30">
                  <h5 className="font-bold text-xs text-[#102e3b] font-serif mb-2">Couverture Thérapétique &amp; Actes Associés</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 border bg-white rounded-lg">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Activité Principale</span>
                      <p className="font-semibold text-slate-800">{selectedAbnPack?.Libelle_Pack || "Forfait Général"}</p>
                    </div>
                    <div className="p-2 border bg-white rounded-lg">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Acte Optionnel 1</span>
                      <p className="font-semibold text-slate-800">{getActeObj(selectedAbnObj.ID_Acte_Add1)?.Libelle_Acte ?? "Aucun"}</p>
                    </div>
                    <div className="p-2 border bg-white rounded-lg">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Acte Optionnel 2</span>
                      <p className="font-semibold text-slate-800">{getActeObj(selectedAbnObj.ID_Acte_Add2)?.Libelle_Acte ?? "Aucun"}</p>
                    </div>
                  </div>
                </div>

                {/* GRILLE GRAPHATIVE DE POINTAGE DES DÉBITS DE SEANCE */}
                <div className="space-y-4">
                  <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-1 font-serif text-left">Grille de Pointage / Émargement des Séances Thérapeutiques</h5>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {Array.from({ length: selectedAbnPack?.Nbre_Seance_Pack ?? 10 }).map((_, idx) => {
                      const seanceNum = idx + 1;
                      const hasBeenDone = selectedAbnObj.Nbre_Sean_Consom_Abn >= seanceNum;

                      return (
                        <div 
                          key={idx} 
                          className={`border rounded-2xl p-3 flex flex-col justify-between items-center h-20 relative transition ${
                            hasBeenDone 
                              ? 'bg-slate-100/50 border-slate-300' 
                              : 'bg-white border-dashed border-slate-300 border-2'
                          }`}
                        >
                          <span className="text-[10px] font-extrabold text-slate-400 block">SÉANCE</span>
                          <span className="text-xl font-black text-slate-800 font-mono">{seanceNum}</span>
                          
                          {hasBeenDone ? (
                            <span className="text-[8px] font-bold text-emerald-800 uppercase bg-emerald-50 px-1 rounded">Pointée ✓</span>
                          ) : (
                            <span className="text-[6.5px] font-medium text-slate-300 uppercase block tracking-wider mt-1 print:block">Émargement</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NOTE CLINIQUE OU EXAMENS */}
                <div className="border border-stone-158 p-4 rounded-2xl bg-slate-50 text-xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observations Cliniques ou Particularités d&apos;Évolution :</span>
                  <div className="h-16 text-slate-400 italic">
                    {selectedPatientObj.antecedents ? (
                      <p className="text-slate-700 italic not-print">&ldquo; {selectedPatientObj.antecedents} &rdquo;</p>
                    ) : (
                      "Zone réservée au kinésithérapeute pour inscrire les amplitudes articulaires, évolution motrice, force ou remarques cliniques au cours des séances de réadaptation thérapeutique."
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 border rounded-3xl text-center bg-slate-50 border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold font-serif">Veuillez sélectionner un patient ainsi qu'un abonnement pour générer la Fiche Clinique de Pointage imprimable.</p>
            </div>
          )}
        </div>
      )}

      {showDailyReport && dailyReportView}
    </div>
  );
};
