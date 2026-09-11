import React, { useState } from 'react';
import { 
  Phone, MapPin, CheckSquare, Search, Trash2, PlusCircle, 
  BarChart, PieChart as PieIcon, PhoneCall, TrendingUp, Users, Target, Shield, Filter, Calendar
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart as RechartsBarChart, 
  Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { CallCentreEntry, DatabaseState, Utilisateur } from '../dbStore';

interface CallCentreAnalysisProps {
  dbState: DatabaseState;
  onSaveState: (state: DatabaseState) => void;
  currentUser: Utilisateur;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const ALGERIAN_WILAYAS = [
  { code: '01', name: '01 - Adrar' },
  { code: '02', name: '02 - Chlef' },
  { code: '03', name: '03 - Laghouat' },
  { code: '04', name: '04 - Oum El Bouaghi' },
  { code: '05', name: '05 - Batna' },
  { code: '06', name: '06 - Béjaïa' },
  { code: '07', name: '07 - Biskra' },
  { code: '08', name: '08 - Béchar' },
  { code: '09', name: '09 - Blida' },
  { code: '10', name: '10 - Bouira' },
  { code: '11', name: '11 - Tamanrasset' },
  { code: '12', name: '12 - Tébessa' },
  { code: '13', name: '13 - Tlemcen' },
  { code: '14', name: '14 - Tiaret' },
  { code: '15', name: '15 - Tizi Ouzou' },
  { code: '16', name: '16 - Alger' },
  { code: '17', name: '17 - Djelfa' },
  { code: '18', name: '18 - Jijel' },
  { code: '19', name: '19 - Sétif' },
  { code: '20', name: '20 - Saïda' },
  { code: '21', name: '21 - Skikda' },
  { code: '22', name: '22 - Sidi Bel Abbès' },
  { code: '23', name: '23 - Annaba' },
  { code: '24', name: '24 - Guelma' },
  { code: '25', name: '25 - Constantine' },
  { code: '26', name: '26 - Médéa' },
  { code: '27', name: '27 - Mostaganem' },
  { code: '28', name: "28 - M'Sila" },
  { code: '29', name: '29 - Mascara' },
  { code: '30', name: '30 - Ouargla' },
  { code: '31', name: '31 - Oran' },
  { code: '32', name: '32 - El Bayadh' },
  { code: '33', name: '33 - Illizi' },
  { code: '34', name: '34 - Bordj Bou Arréridj' },
  { code: '35', name: '35 - Boumerdès' },
  { code: '36', name: '36 - El Tarf' },
  { code: '37', name: '37 - Tindouf' },
  { code: '38', name: '38 - Tissemsilt' },
  { code: '39', name: '39 - El Oued' },
  { code: '40', name: '40 - Khenchela' },
  { code: '41', name: '41 - Souk Ahras' },
  { code: '42', name: '42 - Tipaza' },
  { code: '43', name: '43 - Mila' },
  { code: '44', name: '44 - Aïn Defla' },
  { code: '45', name: '45 - Naâma' },
  { code: '46', name: '46 - Aïn Témouchent' },
  { code: '47', name: '47 - Ghardaïa' },
  { code: '48', name: '48 - Relizane' },
  { code: '49', name: "49 - El M'Ghair" },
  { code: '50', name: '50 - El Meniaa' },
  { code: '51', name: '51 - Ouled Djellal' },
  { code: '52', name: '52 - Bordj Baji Mokhtar' },
  { code: '53', name: '53 - Béni Abbès' },
  { code: '54', name: '54 - In Salah' },
  { code: '55', name: '55 - In Guezzam' },
  { code: '56', name: '56 - Touggourt' },
  { code: '57', name: '57 - Djanet' },
  { code: '58', name: "58 - El M'Gheier" }
];

const ACT_TYPES = [
  'Réeducation Adulte',
  'Balnéothérapie',
  'Intensif IMC'
];

const SOURCE_ORIENTATIONS = [
  'Bouche à Oreille',
  'Réseaux Sociaux',
  'Tik Tok',
  'Médecin',
  'CallCentre'
];

const COLORS = ['#3bb2b8', '#efa856', '#e06666', '#a64d79', '#4d7ea8'];

export function CallCentreAnalysis({ dbState, onSaveState, currentUser, triggerToast }: CallCentreAnalysisProps) {
  const entries = dbState.callCentreEntries || [];

  // Permissions
  const canDeleteCall = currentUser?.Role === 'Admin' || currentUser?.Role === 'Assistante';
  const canEditCall = ['Admin', 'Assistante', 'Receptionniste RDC', 'Receptionniste Réeducation', 'Receptionniste Rééducation', 'Receptionniste Intensif 2e', 'Receptionniste Intensif 3e', 'Receptionniste Intensif 4e', 'Receptionniste Balnéothérapie', 'Receptionniste Balneotherapie', 'Super Receptionniste', 'Super Réceptionniste'].includes(currentUser?.Role) || currentUser?.Role?.toLowerCase().includes('receptionniste') || currentUser?.Role?.toLowerCase().includes('réceptionniste');

  // Form states
  const [provenance, setProvenance] = useState('16 - Alger');
  const [phone, setPhone] = useState('');
  const [typeActe, setTypeActe] = useState('Réeducation Adulte');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [dateSaisie, setDateSaisie] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [statut, setStatut] = useState<'En cours' | 'Terminé' | 'À rappeler'>('En cours');

  // Filter states
  const [filterProvenance, setFilterProvenance] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSourceCheckboxChange = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      triggerToast('Veuillez saisir un numéro de téléphone.', 'error');
      return;
    }

    if (selectedSources.length === 0) {
      triggerToast('Veuillez cocher au moins une source d\'orientation.', 'error');
      return;
    }

    const nextId = `cc-${Date.now()}`;
    const newEntry: CallCentreEntry = {
      id: nextId,
      provenance: provenance.replace(/^\d+\s*-\s*/, ''), // remove prefix numbers for clean data
      phone: phone.trim(),
      typeActe,
      sources: selectedSources,
      dateSaisie,
      agentSaisie: currentUser.Nom_Utilisateur,
      statut: statut
    };

    const updatedEntries = [newEntry, ...entries];
    const newState = {
      ...dbState,
      callCentreEntries: updatedEntries
    };

    onSaveState(newState);
    triggerToast('Fiche d\'appel enregistrée avec succès.', 'success');

    // Reset fields (except date & provenance for fast subsequent entries)
    setPhone('');
    setSelectedSources([]);
    setStatut('En cours');
  };

  const handleUpdateStatus = (id: string, newStatus: 'En cours' | 'Terminé' | 'À rappeler') => {
    const updatedEntries = entries.map(e => {
      if (e.id === id) {
        return { ...e, statut: newStatus };
      }
      return e;
    });
    const newState = {
      ...dbState,
      callCentreEntries: updatedEntries
    };
    onSaveState(newState);
    triggerToast('Statut de l\'appel mis à jour.', 'success');
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette fiche d\'appel ?')) {
      const updatedEntries = entries.filter(e => e.id !== id);
      const newState = {
        ...dbState,
        callCentreEntries: updatedEntries
      };
      onSaveState(newState);
      triggerToast('Fiche d\'appel supprimée.', 'info');
    }
  };

  // Filtering Logic
  const filteredEntries = entries.filter(item => {
    const matchProvenance = filterProvenance === 'All' || item.provenance === filterProvenance;
    const matchType = filterType === 'All' || item.typeActe === filterType;
    const matchSource = filterSource === 'All' || item.sources.includes(filterSource);
    const matchSearch = searchTerm.trim() === '' || 
      item.phone.includes(searchTerm) || 
      item.provenance.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.agentSaisie || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchProvenance && matchType && matchSource && matchSearch;
  });

  // Calculate unique provs for filter dropdown (sorted)
  const uniqueProvenancesForFilter = Array.from(new Set(entries.map(e => e.provenance))).sort();

  // Statistics Calculations
  const statsTotal = filteredEntries.length;
  
  // Provenance counts
  const provCounts: { [key: string]: number } = {};
  filteredEntries.forEach(e => {
    provCounts[e.provenance] = (provCounts[e.provenance] || 0) + 1;
  });
  const topProv = Object.entries(provCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Néant';

  // Type Acte counts
  const typeCounts: { [key: string]: number } = {};
  filteredEntries.forEach(e => {
    typeCounts[e.typeActe] = (typeCounts[e.typeActe] || 0) + 1;
  });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Néant';

  // Source distribution
  const sourceTotals: { [key: string]: number } = {};
  SOURCE_ORIENTATIONS.forEach(s => {
    sourceTotals[s] = 0;
  });
  filteredEntries.forEach(e => {
    e.sources.forEach(s => {
      sourceTotals[s] = (sourceTotals[s] || 0) + 1;
    });
  });
  const topSource = Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Néant';

  // Charts data
  const chartTypeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value
  }));

  const chartProvData = Object.entries(provCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      Appels: value
    }));

  const chartSourceData = Object.entries(sourceTotals).map(([name, value]) => ({
    name,
    Occurrences: value
  }));

  return (
    <div className="space-y-6" id="panel-callcentre-analysis">
      {/* 1. Header & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div id="kpi-total-calls" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center gap-4 transition hover:shadow-xs">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Appels Filtrés</p>
            <p className="text-xl font-black text-slate-800">{statsTotal}</p>
          </div>
        </div>

        <div id="kpi-top-provenance" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center gap-4 transition hover:shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provenance Phare</p>
            <p className="text-sm font-extrabold text-slate-800 truncate max-w-[140px]">{topProv}</p>
          </div>
        </div>

        <div id="kpi-top-act-type" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center gap-4 transition hover:shadow-xs">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acte Dominant</p>
            <p className="text-sm font-extrabold text-slate-800 truncate max-w-[140px]">{topType}</p>
          </div>
        </div>

        <div id="kpi-top-source" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center gap-4 transition hover:shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orientation Majeure</p>
            <p className="text-sm font-extrabold text-slate-800 truncate max-w-[140px]">{topSource}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#fcfdfe] border border-slate-200 rounded-2xl p-5 shadow-3xs">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-cyan-600" />
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-800">
                Saisir un Nouvel Appel
              </h3>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              {/* Provenance */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Provenance (Wilaya d'Algerie)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={provenance}
                    onChange={(e) => setProvenance(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-705 focus:outline-none focus:border-cyan-500 transition cursor-pointer appearance-none"
                  >
                    {ALGERIAN_WILAYAS.map(w => (
                      <option key={w.code} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Numéro de Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 0555 XXXXXX ou 0661 XXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Type d'acte */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Type Acte
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={typeActe}
                    onChange={(e) => setTypeActe(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-850 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    {ACT_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source d'orientation */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Source d'Orientation (Cases à cocher)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {SOURCE_ORIENTATIONS.map(source => {
                    const isChecked = selectedSources.includes(source);
                    return (
                      <label 
                        key={source} 
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition select-none ${
                          isChecked 
                            ? 'bg-cyan-50 border border-cyan-200 text-cyan-800 font-extrabold' 
                            : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSourceCheckboxChange(source)}
                          className="w-3.5 h-3.5 text-cyan-600 rounded bg-white border-slate-300 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[10px]">{source}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Statut de l'appel */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Statut de l'Appel
                </label>
                <div className="relative">
                  <CheckSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-850 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="À rappeler">À rappeler</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Date d'Enregistrement
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={dateSaisie}
                    onChange={(e) => setDateSaisie(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-705 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                Enregistrer l'Appel
              </button>
            </form>
          </div>

          {/* Quick instructions / security */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-[10px] flex gap-3 text-slate-600">
            <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-700 uppercase mb-0.5">Accès Supervisé Call Centre</p>
              <p className="leading-relaxed">
                Ce module est confidentiel et réservé à l'analyse opérationnelle de la Clinique. Seuls l'administrateur, le RDC, la Balnéothérapie et le Marketing sont autorisés à enregistrer et exporter ces données critiques de provenance géographique.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: List & Stats charts (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Charts view if entries occupy */}
          {statsTotal > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pie: Act distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-cyan-600" /> Répartition par Acte Prescrit
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} appels`, 'Volume']} />
                      <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar: Source orientation counts */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <BarChart className="w-3.5 h-3.5 text-indigo-600" /> Taux de Source d'Origine
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={chartSourceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 'bold' }} />
                      <YAxis tick={{ fontSize: 8 }} allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value} fiches`, 'Matches']} />
                      <Bar dataKey="Occurrences" fill="#35495e" radius={[4, 4, 0, 0]}>
                        {chartSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Table list container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
            {/* Filter bar */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-black text-slate-700">Filtres Actifs :</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search string */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Chercher tel, wilaya..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-[10px] font-semibold w-40 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Filter Provenance */}
                <select
                  value={filterProvenance}
                  onChange={(e) => setFilterProvenance(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">Prov. (Toutes)</option>
                  {uniqueProvenancesForFilter.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* Filter Type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">Acte (Tous)</option>
                  {ACT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Filter Orientation */}
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">Source (Toutes)</option>
                  {SOURCE_ORIENTATIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid display / Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-400 text-[9px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Provenance</th>
                    <th className="py-2.5 px-4">Numéro de Télé</th>
                    <th className="py-2.5 px-4">Type Acte</th>
                    <th className="py-2.5 px-4">Sources d'Orientation</th>
                    <th className="py-2.5 px-4">Statut</th>
                    <th className="py-2.5 px-4">Agent</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs font-semibold text-slate-400">
                        Aucun appel ou fiche trouvé dans l'historique de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((item) => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                            {item.dateSaisie}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              {item.provenance}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#102e3b] tracking-wide">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {item.phone}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              item.typeActe === 'Réeducation Adulte' 
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
                                : item.typeActe === 'Balnéothérapie'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {item.typeActe}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {item.sources.map(src => (
                                <span key={src} className="inline-block bg-slate-100 text-slate-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">
                                  {src}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {canEditCall ? (
                              <select
                                value={item.statut || 'En cours'}
                                onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border focus:outline-none cursor-pointer ${
                                  (item.statut || 'En cours') === 'Terminé'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : (item.statut || 'En cours') === 'À rappeler'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                <option value="En cours">En cours</option>
                                <option value="Terminé">Terminé</option>
                                <option value="À rappeler">À rappeler</option>
                              </select>
                            ) : (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                (item.statut || 'En cours') === 'Terminé'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : (item.statut || 'En cours') === 'À rappeler'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              }`}>
                                {item.statut || 'En cours'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[10px] font-semibold text-slate-500 truncate max-w-[100px]">
                            {item.agentSaisie || 'Mise à niveau'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {canDeleteCall ? (
                              <button
                                onClick={() => handleDeleteEntry(item.id)}
                                className="p-1 px-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Supprimer la fiche"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[10px] italic">Non autorisé</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with entry count info */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-150 text-[10px] font-bold text-slate-500 flex justify-between">
              <span>Affichage de {filteredEntries.length} sur {entries.length} fiches enregistrées</span>
              <span>Propulsé par la Direction Médicale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
