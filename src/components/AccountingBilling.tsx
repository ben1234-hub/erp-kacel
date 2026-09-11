import React, { useState } from 'react';
import { 
  Building,
  Coins as CoinsIcon,
  CreditCard as CardIcon,
  DollarSign as DollarIcon,
  Printer as PrintIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Filter as FilterIcon,
  BarChart2 as StatsIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Activity as SpeedIcon,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Patient, CaisseTransaction, GestionAbonnement, Pack } from '../types';

interface AccountingBillingProps {
  patients: Patient[];
  abonnements: GestionAbonnement[];
  packs: Pack[];
  transactions: CaisseTransaction[];
  onAddTransaction: (tx: Omit<CaisseTransaction, 'id' | 'date'>) => void;
}

export default function AccountingBilling({
  patients,
  abonnements,
  packs,
  transactions,
  onAddTransaction
}: AccountingBillingProps) {
  const [activeSubTab, setActiveSubTab] = useState<'caisse' | 'facture' | 'stats'>('caisse');
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [selectedTxFilter, setSelectedTxFilter] = useState<string>('all');
  const [invoiceTicket, setInvoiceTicket] = useState<any | null>(null);

  // New Transaction Form state
  const [txForm, setTxForm] = useState({
    type: 'recette' as 'recette' | 'depense',
    label: '',
    amount: 1000,
    payment_method: 'especes' as 'especes' | 'carte' | 'cheque',
    user_role: 'recept_rdc'
  });

  // Calculations for KPI cards
  const totalRecettes = transactions
    .filter(t => t.type === 'recette')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalDepenses = transactions
    .filter(t => t.type === 'depense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const caisseBalance = totalRecettes - totalDepenses;

  // Filtered transactions list
  const filteredTxs = transactions.filter(t => {
    if (selectedTxFilter === 'all') return true;
    return t.type === selectedTxFilter;
  });

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.label.trim()) return;

    onAddTransaction({
      type: txForm.type,
      label: txForm.label,
      amount: Number(txForm.amount),
      payment_method: txForm.payment_method,
      user_role: txForm.user_role
    });

    setShowAddTxModal(false);
    setTxForm({
      type: 'recette',
      label: '',
      amount: 1000,
      payment_method: 'especes',
      user_role: 'recept_rdc'
    });
  };

  // Recharts demo datasets
  const cashflowChartData = [
    { name: 'Lun 25', Recettes: 12000, Depenses: 3000 },
    { name: 'Mar 26', Recettes: 18500, Depenses: 4200 },
    { name: 'Mer 27', Recettes: 15400, Depenses: 8000 },
    { name: 'Jeu 28', Recettes: 24000, Depenses: 2500 },
    { name: 'Ven 29', Recettes: 31000, Depenses: 6000 },
    { name: 'Sam 30', Recettes: totalRecettes + 15000, Depenses: totalDepenses + 2000 }
  ];

  // Distribution of payments by service (Piechart data)
  const serviceShareData = [
    { name: 'Balnéothérapie', value: 45000, color: '#4f46e5' },
    { name: 'Kiné Adultes', value: 38000, color: '#06b6d4' },
    { name: 'Intensif CP Enfants', value: 72000, color: '#ec4899' },
    { name: 'Consultations', value: 18000, color: '#f59e0b' }
  ];

  // Invoices list generator (simulated invoices from our active subscriptions)
  const invoices = abonnements.map((abo, idx) => {
    const patientObj = patients.find(p => p.id === abo.patient_id);
    const packObj = packs.find(p => p.id === abo.pack_id);
    const cost = packObj?.amount || 0;
    
    return {
      id: `FAC-2026-${1000 + idx}`,
      patient_name: patientObj?.name || 'Abonné',
      description: `Contrat de rééducation - ${packObj?.name || 'KACEL Pack'}`,
      amount: cost,
      date: abo.date_debut,
      status: 'paye' as 'paye' | 'encours'
    };
  });

  return (
    <div className="space-y-6" id="accounting-billing-hub">
      
      {/* Visual Tab controller */}
      <div className="flex border-b border-slate-200" id="finance-tab-switch">
        <button
          onClick={() => setActiveSubTab('caisse')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'caisse' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/30' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          💱 Journal de Caisse
        </button>
        <button
          onClick={() => setActiveSubTab('facture')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'facture' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/30' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          🧾 Facturation & Reçus
        </button>
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'stats' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/30' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📈 Analyses Trésorerie
        </button>
      </div>

      {/* KPI TOPPING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="finance-kpis">
        <div className="bg-white border border-teal-100 p-6 rounded-2xl flex items-center justify-between shadow-sm shadow-teal-500/5">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Encaissé (Recettes)</span>
            <p className="text-2xl font-black text-slate-900 font-mono">{(totalRecettes || 0).toLocaleString()} DA</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl border border-emerald-100">
            +
          </div>
        </div>

        <div className="bg-white border border-teal-100 p-6 rounded-2xl flex items-center justify-between shadow-sm shadow-teal-500/5">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Déboursé (Dépenses)</span>
            <p className="text-2xl font-black text-slate-900 font-mono">{(totalDepenses || 0).toLocaleString()} DA</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xl border border-rose-100">
            -
          </div>
        </div>

        <div className="bg-white border border-teal-100 p-6 rounded-2xl flex items-center justify-between shadow-sm shadow-teal-500/5">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Solde Net Caisse</span>
            <p className="text-2xl font-black text-teal-600 font-mono">{(caisseBalance || 0).toLocaleString()} DA</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <CoinsIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TABS VIEW GENERATION */}
      {activeSubTab === 'caisse' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4" id="caisse-tab-contents">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide font-mono">
                💱 Flux d'Encaissement de la Trésorerie
              </h3>
              <p className="text-[10px] text-slate-400">Suivi des entrées et retraits guichet au jour-le-jour.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTxFilter}
                onChange={(e) => setSelectedTxFilter(e.target.value)}
                className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-xs"
              >
                <option value="all">Tout voir</option>
                <option value="recette">Recettes</option>
                <option value="depense">Dépenses</option>
              </select>

              <button
                onClick={() => setShowAddTxModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Saisir un flux
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Libellé Transaction</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Méthode</th>
                  <th className="py-3 px-4">Auteur</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map((tx) => {
                  const typeLabel = tx.type === 'recette' ? 'RECETTE (Entrée)' : 'DEPENSE (Retrait)';
                  return (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/20">
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          tx.type === 'recette' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-850">{tx.label}</td>
                      <td className="py-3.5 px-4 font-mono">{tx.date}</td>
                      <td className="py-3.5 px-4 capitalize font-semibold">{tx.payment_method === 'especes' ? '💵 Espèces' : tx.payment_method === 'carte' ? '💳 Carte' : '📝 Chèque'}</td>
                      <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-slate-500">{tx.user_role.toUpperCase()}</td>
                      <td className={`py-3.5 px-4 font-mono font-bold text-right text-xs ${
                        tx.type === 'recette' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {tx.type === 'recette' ? '+' : '-'} {(tx.amount || 0).toLocaleString()} DA
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeSubTab === 'facture' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4" id="billing-tab-contents">
          
          <div className="pb-3 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide font-mono">
                🧾 Gestion de la Facturation Globale
              </h3>
              <p className="text-[10px] text-slate-400">Édition des reçus et factures d'abonnements.</p>
            </div>
            
            <span className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded">
              {invoices.length} Factures Générées
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Désignation</th>
                  <th className="py-3 px-4">Émission</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/25">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{inv.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{inv.patient_name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-semibold">{inv.description}</td>
                    <td className="py-3.5 px-4 font-mono">{inv.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded-full">
                        Acquittée
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInvoiceTicket(inv)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded cursor-pointer transition-all flex items-center justify-center gap-1 ml-auto"
                      >
                        <PrintIcon className="w-3 h-3" />
                        Aperçu Reçu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeSubTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="stats-tab-contents">
          
          {/* Revenue Chart Widget using recharts area graph */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase font-mono">
              📊 Flux de Recettes Cliniques vs Dépenses (DZD)
            </h4>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashflowChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Recettes" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="Depenses" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorDep)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Breakdown per Services Cliniques */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <h4 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase font-mono">
              🍰 Part de Chiffre d'Affaire par Département
            </h4>

            <div className="h-[200px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-black">Santé</span>
                <span className="text-sm font-black text-slate-800">100% ERP</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {serviceShareData.map(dep => (
                <div key={dep.name} className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dep.color }} />
                    <span>{dep.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-500">{(dep.value || 0).toLocaleString()} DA</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* NEW TRANSACTION MODAL DIALOG */}
      {showAddTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full shadow-lg p-6 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="font-extrabold text-slate-900 tracking-tight text-sm uppercase font-mono flex items-center gap-2">
                💰 Enregistrer une transaction manuelle
              </h3>
              <button 
                onClick={() => setShowAddTxModal(false)}
                className="text-slate-400 hover:text-slate-655 p-1 rounded"
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'recette' })}
                  className={`p-2.5 rounded-lg border text-center font-bold text-xs cursor-pointer transition-all ${
                    txForm.type === 'recette' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold' 
                      : 'border-slate-150 bg-white text-slate-500'
                  }`}
                >
                  Entrée (Recette)
                </button>
                
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'depense' })}
                  className={`p-2.5 rounded-lg border text-center font-bold text-xs cursor-pointer transition-all ${
                    txForm.type === 'depense' 
                      ? 'border-rose-450 bg-rose-50 text-rose-800 font-extrabold' 
                      : 'border-slate-150 bg-white text-slate-500'
                  }`}
                >
                  Retrait (Dépense)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Libellé descriptif</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex. Achat de compresses stériles"
                  value={txForm.label}
                  onChange={(e) => setTxForm({ ...txForm, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Montant (DA)</label>
                  <input 
                    type="number"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mode de règlement</label>
                  <select
                    value={txForm.payment_method}
                    onChange={(e) => setTxForm({ ...txForm, payment_method: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs"
                  >
                    <option value="especes">💵 Espèces</option>
                    <option value="carte">💳 Carte Bancaire</option>
                    <option value="cheque">📝 Chèque</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase py-3 rounded-xl transition-all shadow-xs"
              >
                Inscrire au registre de caisse
              </button>

            </form>
          </div>
        </div>
      )}

      {/* FULL INVOICE MODAL aperçu PRINT COMPONENT */}
      {invoiceTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-900 rounded-lg max-w-md w-full p-6 shadow-2xl relative font-sans text-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">FACTURÉ ET PAYÉ</span>
                <h4 className="font-extrabold text-sm uppercase font-mono text-slate-900 tracking-tight">FACTURE DE PRESTATAIRE KACEL</h4>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-700">{invoiceTicket.id}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block">Émetteur</span>
                  <p className="font-bold text-slate-850">KACEL Sante SARL</p>
                  <p className="text-[10px] text-slate-500">Service Rééducation Intégrale</p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block">Destinataire (Patient)</span>
                  <p className="font-bold text-slate-850">{invoiceTicket.patient_name}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block">Désignation du soin</span>
                <p className="font-semibold text-slate-850">{invoiceTicket.description}</p>
                <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500">
                  <span>Date d'enregistrement :</span>
                  <span className="font-mono">{invoiceTicket.date}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-350 py-3 flex justify-between font-extrabold text-sm text-slate-900 font-mono bg-slate-50/50 px-3">
                <span>TOTAL ACQUITTÉ :</span>
                <span className="text-emerald-700">{(invoiceTicket.amount || 0).toLocaleString()} DZD</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-1/2 bg-slate-150 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <PrintIcon className="w-3.5 h-3.5" />
                Imprimer
              </button>
              <button
                onClick={() => setInvoiceTicket(null)}
                className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-2 rounded-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
