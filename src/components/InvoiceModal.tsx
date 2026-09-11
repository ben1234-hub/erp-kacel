import React, { useState, useMemo } from 'react';
import { X, Printer, Download, ChevronRight, ChevronLeft } from 'lucide-react';


// ===== FONCTIONS UTILITAIRES =====

export const numberToFrenchLetters = (num: number): string => {
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-Sept', 'Dix-Huit', 'Dix-Neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-Dix', 'Quatre-Vingt', 'Quatre-Vingt-Dix'];

  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  if (intPart === 0 && decimalPart === 0) return 'Zéro Dinars';
  if (intPart >= 1000000000) return "Plus d'un Milliard Dinars";

  const convertUnder1000 = (n: number): string => {
    if (n === 0) return '';
    let res = '';
    const centaines = Math.floor(n / 100);
    const dizaines = Math.floor((n % 100) / 10);
    const unites = n % 10;

    if (centaines > 0) {
      res += (centaines === 1 ? 'Cent' : units[centaines] + ' Cent');
      if (dizaines === 0 && unites === 0) return res;
      res += ' ';
    }

    if (dizaines === 1) {
      res += teens[unites];
    } else if (dizaines === 7 || dizaines === 9) {
      res += tens[dizaines === 7 ? 6 : 8];
      if (unites > 0) res += '-' + teens[unites];
    } else {
      res += tens[dizaines];
      if (unites > 0 && dizaines > 0) res += '-' + units[unites];
      else if (unites > 0) res += units[unites];
    }
    return res;
  };

  let result = '';
  const millions = Math.floor(intPart / 1000000);
  const milliers = Math.floor((intPart % 1000000) / 1000);
  const reste = intPart % 1000;

  if (millions > 0) {
    result += convertUnder1000(millions) + (millions === 1 ? ' Million ' : ' Millions ');
  }
  if (milliers > 0) {
    result += (milliers === 1 ? 'Mille ' : convertUnder1000(milliers) + ' Mille ');
  }
  if (reste > 0) {
    result += convertUnder1000(reste);
  }

  result = result.trim() + ' Dinars';
  if (decimalPart > 0) {
    result += ' et ' + convertUnder1000(decimalPart) + ' Centimes';
  }
  return result;
};

export const calculerTIMBRE = (net: number): number => {
  if (net <= 70000) return net * 0.01;
  if (net <= 100000) return net * 0.015;
  return net * 0.02;
};

export const getJoursOuvres = (dateDebut: string, dateFin: string): Date[] => {
  if (!dateDebut || !dateFin) return [];
  const jours: Date[] = [];
  let current = new Date(dateDebut + 'T00:00:00');
  const fin = new Date(dateFin + 'T00:00:00');

  while (current <= fin) {
    const jourSemaine = current.getDay(); // 0=Dimanche, 5=Vendredi
    if (jourSemaine !== 5) { // Exclure VENDREDI uniquement
      jours.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return jours;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ===== COMPOSANT PRINCIPAL =====

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  abonnement: any;
  dateDebutInterval?: string;
  dateFinInterval?: string;
  dbState: any;
  onSave: (facture: any) => void;
}

export default function InvoiceModal({ 
  isOpen, onClose, patient, abonnement, dateDebutInterval, dateFinInterval, dbState, onSave 
}: InvoiceModalProps) {
  const [step, setStep] = useState(1);

  // Détection auto du type de caisse
  const caisse = useMemo(() => {
    const c = patient?.Type_Caisse || patient?.organisme || 'Standard';
    if (c.toLowerCase().includes('militaire')) return 'Militaire';
    return c;
  }, [patient]);

  // Détection auto du type de facture selon caisse
  const [typeFacture, setTypeFacture] = useState<'Standard' | 'Détaillée' | 'Proforma'>(
    caisse === 'Militaire' ? 'Détaillée' : 'Standard'
  );

  const [dateFacture, setDateFacture] = useState(() => {
    if (abonnement?.Date_Debut_Abn || abonnement?.Date_Debut) return abonnement.Date_Debut_Abn || abonnement.Date_Debut;
    if (dateDebutInterval) return dateDebutInterval;
    return new Date().toISOString().split('T')[0];
  });

  const [dateDebut, setDateDebut] = useState(
    abonnement?.Date_Debut_Abn || abonnement?.Date_Debut || dateDebutInterval || new Date().toISOString().split('T')[0]
  );
  const [dateFin, setDateFin] = useState(
    abonnement?.Date_Fin_Abn || abonnement?.Date_Fin || dateFinInterval || new Date().toISOString().split('T')[0]
  );
  const [remise, setRemise] = useState(0);

  // Pack et prix
  const pack = useMemo(() => {
    if (!abonnement) return null;
    return dbState.packs?.find((p: any) => p.ID_Pack === abonnement.ID_Pack) || null;
  }, [abonnement, dbState.packs]);

  const prixTotal = pack?.Prix_Pack || abonnement?.Prix || abonnement?.Prix_Pack || 0;
  const nbSeances = pack?.Nbre_Seance_Pack || abonnement?.Nbre_Seance_Pack || abonnement?.Nbre_Sean_Consom_Abn || 0;
  const prixUnitaire = nbSeances > 0 ? prixTotal / nbSeances : 0;

  // Options (actes complémentaires)
  const options = useMemo(() => {
    const opts: string[] = [];
    if (abonnement?.Options && typeof abonnement.Options === 'string') {
      opts.push(abonnement.Options);
    } else {
      if (abonnement?.ID_Acte_Add1) {
        const acte = dbState.actes?.find((a: any) => a.ID_Acte === abonnement.ID_Acte_Add1);
        if (acte) opts.push(acte.Libelle_Acte || acte.Nom_Acte || 'Option 1');
      }
      if (abonnement?.ID_Acte_Add2) {
        const acte = dbState.actes?.find((a: any) => a.ID_Acte === abonnement.ID_Acte_Add2);
        if (acte) opts.push(acte.Libelle_Acte || acte.Nom_Acte || 'Option 2');
      }
    }
    return opts;
  }, [abonnement, dbState.actes]);

  // Planning (pour facture détaillée)
  const planning = useMemo(() => {
    if (!dateDebut || !dateFin) return [];
    const jours = getJoursOuvres(dateDebut, dateFin);
    return jours.map((date, idx) => ({
      date,
      dateStr: formatDate(date),
      seances: 2, // Par défaut 2 séances/jour
      type: 'Rééducation Intensive',
      montant: prixUnitaire * 2,
      option: options.length > 0 ? options[idx % options.length] : null
    }));
  }, [dateDebut, dateFin, prixUnitaire, options]);

  // Calculs
  const ht = prixTotal;
  const remiseMontant = ht * (remise / 100);
  const htApresRemise = ht - remiseMontant;
  const tva = htApresRemise * 0.09;
  const net = htApresRemise + tva;
  const timbre = calculerTIMBRE(net);
  const ttc = net + timbre;

  // Numérotation auto
  const numeroFacture = useMemo(() => {
    const count = dbState.factures?.length || 0;
    const next = count + 1;
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${next}-${mm}/${yy}`;
  }, [dbState.factures]);

  const patientName = patient?.Nom_Patient || `${patient?.Nom || ''} ${patient?.Prenom || ''}`.trim();

  const handleSave = () => {
    const facture = {
      ID_Facture: Date.now(),
      Numero: numeroFacture,
      ID_Patient: patient.ID_Patient,
      ID_Abonnement: abonnement?.ID_Abn || abonnement?.ID_Abonnement || null,
      Patient_Nom: patientName,
      Date_Facture: dateFacture,
      Type_Caisse: caisse,
      Type_Facture: typeFacture,
      HT: htApresRemise,
      Remise: remiseMontant,
      TVA: tva,
      TIMBRE: timbre,
      Montant_TTC: ttc,
      Montant_Total: ttc,
      Montant_Lettres: numberToFrenchLetters(ttc),
      Planning: typeFacture === 'Détaillée' ? planning : null,
      Date_Debut: dateDebut,
      Date_Fin: dateFin,
      Pack: pack?.Libelle_Pack || abonnement?.Libelle || 'Abonnement'
    };
    onSave(facture);
  };

  const exportExcel = () => {
    const BOM = '\uFEFF';
    let csv = BOM;

    if (typeFacture === 'Détaillée') {
      csv += "Date,Nombre d'heure,Type de soins,Montant\n";
      planning.forEach((p: any) => {
        csv += `${p.dateStr},${p.seances} Séances,${p.type}${p.option ? ' + ' + p.option : ''},${p.montant.toFixed(2)}\n`;
      });
    } else {
      csv += 'ACTES,Prix Unitaire,QTE,TTC\n';
      csv += `${nbSeances} Séances de ${pack?.Libelle_Pack || abonnement?.Libelle || 'Rééducation'},${prixTotal.toFixed(2)},1,${ttc.toFixed(2)}\n`;
    }

    csv += `\nTotal HT,${htApresRemise.toFixed(2)}\n`;
    csv += `Remise,${remiseMontant.toFixed(2)}\n`;
    csv += `TVA 9%,${tva.toFixed(2)}\n`;
    csv += `NET,${net.toFixed(2)}\n`;
    csv += `TIMBRE,${timbre.toFixed(2)}\n`;
    csv += `Total TTC,${ttc.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Facture-${typeFacture}-${numeroFacture}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {typeFacture === 'Proforma' ? 'Facture Proforma' : `Facture ${typeFacture}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient : <span className="font-semibold text-slate-700">{patientName}</span> — Caisse : <span className="font-semibold text-slate-700">{caisse}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">1. Paramètres de la facture</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date de facture</label>
                  <input
                    type="date"
                    value={dateFacture}
                    onChange={(e) => setDateFacture(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de facture</label>
                  <select
                    value={typeFacture}
                    onChange={(e) => setTypeFacture(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Standard">Standard (CNAS/CASNOS)</option>
                    <option value="Détaillée">Détaillée (Militaire)</option>
                    <option value="Proforma">Proforma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date début période</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date fin période</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remise (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={remise}
                  onChange={(e) => setRemise(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {options.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-0.5">Options incluses :</p>
                  <p className="text-sm font-semibold text-blue-600">{options.join(' + ')}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">2. Aperçu de la facture</h3>

              {/* APERÇU FACTURE */}
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm print:shadow-none print:border-none">
                {/* ENTÊTE KACEL SANTÉ */}
                <div className="bg-gradient-to-b from-[#faf8f5] to-[#f5f0e8] border-b-4 border-[#c9a84c] p-5 flex items-center justify-between">
                  <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <img src="/logo-kacel-sante.png" alt="KACEL Santé" className="max-w-full max-h-full object-contain" onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    <img src="/logo-kacel.png" alt="KACEL Santé" className="w-full h-full object-contain" />
                    }} />
                  </div>
                  <div className="text-center flex-1 px-4">
                    <div className="text-3xl font-light tracking-[14px] text-[#1a1a2e]">K A C E L</div>
                    <div className="text-xl tracking-[6px] text-[#c9a84c] -mt-1 font-semibold">S a n t é</div>
                    <div className="text-[11px] text-slate-600 tracking-widest uppercase mt-1 font-semibold">
                      Centre de Médecine physique et de Réadaptation Fonctionnelle
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Cité du 01 Novembre Ouled Moussa Boumerdes<br/>
                      Tél: 024 72 59 96 | 024 72 59 99 / 0561 82 77 52
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1 flex justify-center gap-4 font-mono">
                      <span>RC: 35/00-0728617 B 19</span>
                      <span>NIF: 001935072861735</span>
                      <span>ART: 35204699921</span>
                    </div>
                  </div>
                  <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <img src="/logo-kacel-sante.png" alt="KACEL Santé" className="max-w-full max-h-full object-contain" onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }} />
                  </div>
                </div>

                {/* CORPS */}
                <div className="p-6 sm:p-8">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-dashed border-[#d4c9b8]">
                    <div>
                      <div className="text-base font-extrabold text-[#1a1a2e] tracking-wide">
                        {typeFacture === 'Proforma' ? 'FACTURE PROFORMA' : 'FACTURE'} N° {numeroFacture}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">Algerie le {new Date(dateFacture).toLocaleDateString('fr-FR')}</div>
                      {typeFacture === 'Détaillée' && (
                        <div className="text-[11px] text-slate-700 italic mt-2 bg-[#f5f0e8] px-3 py-1.5 rounded-lg border-l-4 border-[#c9a84c] inline-block font-medium">
                          Période Allant du {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}<br/>
                          soit {nbSeances} heures à raison de 2 Séances par jour
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Nom & Prénom</div>
                      <div className="text-base font-bold text-[#1a1a2e]">{patientName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Age : {patient.Age || '—'} an(s)</div>
                    </div>
                  </div>

                  {/* TABLEAU */}
                  {typeFacture === 'Détaillée' ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#1a1a2e] text-white font-bold">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-center">Nombre d'heure</th>
                          <th className="px-3 py-2 text-left">Type de soins</th>
                          <th className="px-3 py-2 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {planning.slice(0, 10).map((p: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-1.5 font-medium">{p.dateStr}</td>
                            <td className="px-3 py-1.5 text-center font-medium">{p.seances} Séances</td>
                            <td className="px-3 py-1.5">{p.type}{p.option ? ` + ${p.option}` : ''}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold">{p.montant.toFixed(2)} DA</td>
                          </tr>
                        ))}
                        {planning.length > 10 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-center text-slate-400 italic">
                              ... {planning.length - 10} lignes supplémentaires ...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#1a1a2e] text-white font-bold">
                          <th className="px-3 py-2 text-left">ACTES</th>
                          <th className="px-3 py-2 text-right">Prix Unitaire</th>
                          <th className="px-3 py-2 text-center">QTE</th>
                          <th className="px-3 py-2 text-right">TTC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-3 py-2.5 font-medium">{nbSeances} Séances de {pack?.Libelle_Pack || abonnement?.Libelle || 'Rééducation Fonctionnelle'}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold">{prixTotal.toLocaleString('fr-FR')} DA</td>
                          <td className="px-3 py-2.5 text-center font-medium">1</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">{prixTotal.toLocaleString('fr-FR')} DA</td>
                        </tr>
                        {options.length > 0 && (
                          <tr className="bg-slate-50">
                            <td className="px-3 py-2 text-blue-700 font-medium">Options : {options.join(' + ')}</td>
                            <td className="px-3 py-2 text-right text-slate-400">—</td>
                            <td className="px-3 py-2 text-center text-slate-400">—</td>
                            <td className="px-3 py-2 text-right text-blue-700 font-semibold">Inclus</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* TOTAUX */}
                  <div className="mt-6 pt-3 border-t-2 border-[#1a1a2e] w-[300px] ml-auto">
                    <div className="flex justify-between py-1 text-xs border-b border-dotted border-slate-200">
                      <span className="text-slate-600 font-medium">Total HT</span>
                      <span className="font-mono font-semibold text-slate-900">{htApresRemise.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                    </div>
                    {remise > 0 && (
                      <div className="flex justify-between py-1 text-xs border-b border-dotted border-slate-200 text-red-600">
                        <span className="font-medium">Remise ({remise}%)</span>
                        <span className="font-mono font-semibold">- {remiseMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 text-xs border-b border-dotted border-slate-200">
                      <span className="text-slate-600 font-medium">TVA 9%</span>
                      <span className="font-mono font-semibold text-slate-900">{tva.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                    </div>
                    <div className="flex justify-between py-1 text-xs border-b border-dotted border-slate-200">
                      <span className="text-slate-600 font-medium">NET</span>
                      <span className="font-mono font-semibold text-slate-900">{net.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                    </div>
                    <div className="flex justify-between py-1 text-xs border-b border-dotted border-slate-200">
                      <span className="text-slate-600 font-medium">TIMBRE ({net <= 70000 ? '1%' : net <= 100000 ? '1,5%' : '2%'})</span>
                      <span className="font-mono font-semibold text-slate-900">{timbre.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                    </div>
                    <div className="flex justify-between py-2 mt-1.5 border-t-2 border-[#c9a84c]">
                      <span className="text-sm font-bold text-[#1a1a2e]">Total TTC</span>
                      <span className="text-base font-extrabold text-[#c9a84c] font-mono">{ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>
                    </div>
                  </div>

                  {/* MONTANT EN LETTRES */}
                  <div className="mt-6 p-4 bg-gradient-to-br from-[#faf8f5] to-[#f5f0e8] border-l-4 border-[#c9a84c] rounded-r-lg">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Arrêtée la Présente Facture à la somme de :</div>
                    <div className="text-xs font-bold italic text-[#1a1a2e]">{numberToFrenchLetters(ttc)}</div>
                  </div>

                  {/* SIGNATURE */}
                  <div className="mt-10 text-right pr-2">
                    <div className="inline-block w-[180px] border-t border-slate-400 pt-1.5 text-xs text-slate-600 text-center italic font-semibold">
                      La Direction
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-1 font-semibold text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={exportExcel}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Excel
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimer
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-xs transition cursor-pointer"
                  >
                    Enregistrer la facture
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
