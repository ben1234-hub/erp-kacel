import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown, Wallet, FileText, Download, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { DatabaseState } from '../dbStore';

interface CaisseDailyReportProps {
  dbState: DatabaseState;
  currentUser: any;
}

interface CaisseConfig {
  nom: string;
  couleur: string;
  caisseFilter: string;
  idServiceDepense: number;
}

const CAISSES: CaisseConfig[] = [
  { nom: 'Rééducation', couleur: 'blue', caisseFilter: 'Caisse Rééducation', idServiceDepense: 1 },
  { nom: 'Balnéothérapie', couleur: 'cyan', caisseFilter: 'Caisse Balnéothérapie', idServiceDepense: 2 },
  { nom: 'RDC (MPR)', couleur: 'emerald', caisseFilter: 'Caisse RDC', idServiceDepense: 6 },
  { nom: 'IMC / Autres Soins', couleur: 'violet', caisseFilter: 'Caisse Abonnement / Autres Soins', idServiceDepense: 3 },
  { nom: 'Abonnement', couleur: 'amber', caisseFilter: 'Caisse Abonnement', idServiceDepense: 7 },
];

// Normalise les dates DD/MM/YYYY → YYYY-MM-DD
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
}

export function CaisseDailyReport({ dbState, currentUser }: CaisseDailyReportProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const dateStr = selectedDate;

  const { actesDuJour, depensesDuJour, recapCaisses } = useMemo(() => {
    const tx = dbState.transactions_caisses || [];
    const dep = dbState.depenses || [];

    // === ACTES RÉALISÉS LE JOUR (toutes transactions de caisse du jour) ===
    const actesDuJour = tx
      .filter((t: any) => normalizeDate(t.Date) === dateStr)
      .sort((a: any, b: any) => (a.Heure || '').localeCompare(b.Heure || ''));

    // === DÉPENSES DU JOUR ===
    const depensesDuJour = dep
      .filter((d: any) => normalizeDate(d.date_depense) === dateStr)
      .sort((a: any, b: any) => (a.heure_depense || '').localeCompare(b.heure_depense || ''));

    // === RÉCAP PAR CAISSE ===
    const recapCaisses = CAISSES.map(c => {
      const recettes = tx
        .filter((t: any) => t.Caisse === c.caisseFilter && normalizeDate(t.Date) === dateStr)
        .reduce((sum: number, t: any) => sum + (t.Montant || 0), 0);

      const depensesValidees = dep
        .filter((d: any) => d.id_service === c.idServiceDepense && d.statut === 'Validée' && normalizeDate(d.date_depense) === dateStr)
        .reduce((sum: number, d: any) => sum + d.montant, 0);

      return {
        ...c,
        recettes,
        depensesValidees,
        solde: recettes - depensesValidees,
      };
    });

    return { actesDuJour, depensesDuJour, recapCaisses };
  }, [dbState, dateStr]);

  const totalRecettes = recapCaisses.reduce((s, d) => s + d.recettes, 0);
  const totalDepensesValidees = recapCaisses.reduce((s, d) => s + d.depensesValidees, 0);
  const totalSolde = totalRecettes - totalDepensesValidees;

  const totalActes = actesDuJour.reduce((s: number, t: any) => s + (t.Montant || 0), 0);
  const totalDepensesJour = depensesDuJour.reduce((s: number, d: any) => s + d.montant, 0);

  const exportCSV = () => {
    let csv = 'RAPPORT CAISSE DU ' + dateStr + '\n\n';
    csv += '=== ACTES REALISES ===\n';
    csv += 'Heure;Patient;Acte;Caisse;Montant\n';
    actesDuJour.forEach((t: any) => {
      csv += `${t.Heure || ''};${t.Patient || ''};${t.Acte || ''};${t.Caisse || ''};${t.Montant || 0}\n`;
    });
    csv += `TOTAL ACTES;;;${totalActes}\n\n`;
    csv += '=== DEPENSES ===\n';
    csv += 'Heure;Description;Caisse/Service;Statut;Montant\n';
    depensesDuJour.forEach((d: any) => {
      const service = CAISSES.find(c => c.idServiceDepense === d.id_service)?.nom || `Service ${d.id_service}`;
      csv += `${d.heure_depense || ''};${d.description || ''};${service};${d.statut};${d.montant}\n`;
    });
    csv += `TOTAL DEPENSES;;;${totalDepensesJour}\n\n`;
    csv += '=== RECAP CAISSES ===\n';
    csv += 'Caisse;Recettes;Depenses Validees;Solde\n';
    recapCaisses.forEach(c => {
      csv += `${c.nom};${c.recettes};${c.depensesValidees};${c.solde}\n`;
    });
    csv += `TOTAL;${totalRecettes};${totalDepensesValidees};${totalSolde}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_caisse_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const couleurs: Record<string, any> = {
    blue:   { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', light: 'text-blue-600' },
    cyan:   { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700', light: 'text-cyan-600' },
    emerald:{ bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', light: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700', light: 'text-violet-600' },
    amber:  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', light: 'text-amber-600' },
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Rapport Caisse Quotidien</h2>
            <p className="text-xs text-slate-500">Actes réalisés et dépenses du jour</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-slate-700 outline-none bg-transparent"
            />
          </div>
          <button onClick={nextDay} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition"
          >
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {/* TOTAUX GLOBAUX */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase text-emerald-700">Recettes du jour</span>
          </div>
          <p className="text-2xl font-black text-emerald-800">{totalRecettes.toLocaleString()} DA</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle size={18} className="text-rose-600" />
            <span className="text-xs font-bold uppercase text-rose-700">Dépenses du jour</span>
          </div>
          <p className="text-2xl font-black text-rose-800">{totalDepensesJour.toLocaleString()} DA</p>
        </div>
        <div className={`border rounded-2xl p-5 ${totalSolde >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className={totalSolde >= 0 ? 'text-blue-600' : 'text-orange-600'} />
            <span className={`text-xs font-bold uppercase ${totalSolde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Solde Global</span>
          </div>
          <p className={`text-2xl font-black ${totalSolde >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{totalSolde.toLocaleString()} DA</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-slate-600" />
            <span className="text-xs font-bold uppercase text-slate-700">Nb Actes</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{actesDuJour.length}</p>
        </div>
      </div>

      {/* TABLEAU DES ACTES RÉALISÉS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Actes Réalisés le {dateStr}</h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Total: +{totalActes.toLocaleString()} DA
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">N°</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Heure</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Patient</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Acte</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Caisse</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {actesDuJour.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Aucun acte réalisé ce jour
                  </td>
                </tr>
              ) : (
                actesDuJour.map((t: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{t.Heure || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{t.Patient || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{t.Acte || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {t.Caisse || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      +{(t.Montant || 0).toLocaleString()} DA
                    </td>
                  </tr>
                ))
              )}
              {actesDuJour.length > 0 && (
                <tr className="bg-emerald-50/60 font-black">
                  <td colSpan={5} className="px-4 py-3 text-right text-[10px] uppercase text-emerald-800">Total Actes</td>
                  <td className="px-4 py-3 text-right text-emerald-800">+{totalActes.toLocaleString()} DA</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLEAU DES DÉPENSES */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-rose-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Dépenses du {dateStr}</h3>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
            Total: -{totalDepensesJour.toLocaleString()} DA
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">N°</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Heure</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Service</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Demandeur</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Statut</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {depensesDuJour.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Aucune dépense ce jour
                  </td>
                </tr>
              ) : (
                depensesDuJour.map((d: any, idx: number) => {
                  const serviceNom = CAISSES.find(c => c.idServiceDepense === d.id_service)?.nom || `Service ${d.id_service}`;
                  return (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{d.heure_depense || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{d.description || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {serviceNom}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{d.demandeur || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.statut === 'Validée' ? 'bg-emerald-100 text-emerald-700' :
                          d.statut === 'Refusée' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {d.statut || 'En attente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700">
                        -{d.montant.toLocaleString()} DA
                      </td>
                    </tr>
                  );
                })
              )}
              {depensesDuJour.length > 0 && (
                <tr className="bg-rose-50/60 font-black">
                  <td colSpan={6} className="px-4 py-3 text-right text-[10px] uppercase text-rose-800">Total Dépenses</td>
                  <td className="px-4 py-3 text-right text-rose-800">-{totalDepensesJour.toLocaleString()} DA</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RÉCAP PAR CAISSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recapCaisses.map(c => {
          const col = couleurs[c.couleur];
          return (
            <div key={c.nom} className={`${col.bg} border ${col.border} rounded-2xl p-5 hover:shadow-md transition`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-black uppercase tracking-wider ${col.text}`}>{c.nom}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${col.badge}`}>
                  {c.idServiceDepense === 7 ? 'Abonnement' : `Service ${c.idServiceDepense}`}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle size={14} className="text-emerald-600" />
                    <span className="text-xs text-slate-600">Recettes</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">+{c.recettes.toLocaleString()} DA</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle size={14} className="text-rose-600" />
                    <span className="text-xs text-slate-600">Dépenses Validées</span>
                  </div>
                  <span className="text-sm font-bold text-rose-700">-{c.depensesValidees.toLocaleString()} DA</span>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">SOLDE NET</span>
                  <span className={`text-lg font-black ${c.solde >= 0 ? 'text-slate-800' : 'text-orange-700'}`}>
                    {c.solde.toLocaleString()} DA
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
