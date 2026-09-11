import React from 'react';

export interface OrientationData {
  boucheAOreille: boolean;
  reseauxSociaux: boolean;
  tiktok: boolean;
  medecin: boolean;
  callCentre: boolean;
  medecinType?: 'liberal' | 'hopital';
  medecinName?: string;
  hospitalName?: string;
}

interface OrientationTabProps {
  data: OrientationData;
  onChange: (data: OrientationData) => void;
  translucentWhite?: boolean;
}

export const defaultOrientationData: OrientationData = {
  boucheAOreille: false,
  reseauxSociaux: false,
  tiktok: false,
  medecin: false,
  callCentre: false,
};

export function OrientationTab({ data, onChange, translucentWhite = false }: OrientationTabProps) {
  const handleCheckboxChange = (field: keyof OrientationData, checked: boolean) => {
    const newData = { ...data, [field]: checked };
    if (field === 'medecin' && !checked) {
      newData.medecinType = undefined;
      newData.medecinName = undefined;
      newData.hospitalName = undefined;
    }
    onChange(newData);
  };

  const inputClass = translucentWhite
    ? "text-sm text-slate-700 font-medium border-b border-slate-200 outline-none w-full bg-transparent py-1"
    : "text-sm text-white font-medium border-b border-white/20 outline-none w-full bg-transparent py-1";

  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono";

  const cardClass = translucentWhite
    ? "bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4"
    : "bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4";

  const checkboxLabelClass = translucentWhite
    ? "text-sm font-bold text-slate-700 cursor-pointer select-none"
    : "text-sm font-bold text-white cursor-pointer select-none";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h3 className={translucentWhite ? "text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono" : "text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono"}>
          Comment avez-vous connu notre centre ?
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={data.boucheAOreille} onChange={(e) => handleCheckboxChange('boucheAOreille', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          <span className={checkboxLabelClass}>Bouche à Oreille</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={data.reseauxSociaux} onChange={(e) => handleCheckboxChange('reseauxSociaux', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          <span className={checkboxLabelClass}>Réseaux Sociaux</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={data.tiktok} onChange={(e) => handleCheckboxChange('tiktok', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          <span className={checkboxLabelClass}>TikTok</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={data.medecin} onChange={(e) => handleCheckboxChange('medecin', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          <span className={checkboxLabelClass}>Médecin</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={data.callCentre} onChange={(e) => handleCheckboxChange('callCentre', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          <span className={checkboxLabelClass}>Call Centre</span>
        </label>
      </div>

      {data.medecin && (
        <div className={cardClass + " mt-6"}>
          <h4 className={labelClass + " mb-4"}>Détails du médecin prescripteur</h4>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className={translucentWhite ? "text-xs font-bold text-slate-600 uppercase tracking-wider" : "text-xs font-bold text-slate-400 uppercase tracking-wider"}>Type de médecin</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="medecinType" value="liberal" checked={data.medecinType === 'liberal'} onChange={(e) => onChange({ ...data, medecinType: e.target.value as 'liberal', hospitalName: undefined })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className={checkboxLabelClass}>Libéral</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="medecinType" value="hopital" checked={data.medecinType === 'hopital'} onChange={(e) => onChange({ ...data, medecinType: e.target.value as 'hopital' })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className={checkboxLabelClass}>Hôpital</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Nom du médecin</label>
              <input type="text" value={data.medecinName || ''} onChange={(e) => onChange({ ...data, medecinName: e.target.value })} placeholder="Dr. ..." className={inputClass} />
            </div>
            {data.medecinType === 'hopital' && (
              <div className="space-y-2">
                <label className={labelClass}>Nom de l'organisme hospitalier</label>
                <input type="text" value={data.hospitalName || ''} onChange={(e) => onChange({ ...data, hospitalName: e.target.value })} placeholder="Nom de l'hôpital / clinique" className={inputClass} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}