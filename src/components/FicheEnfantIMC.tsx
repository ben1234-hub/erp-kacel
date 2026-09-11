import React from 'react';

interface FicheEnfantIMCProps {
  patient: {
    Nom?: string;
    Prenom?: string;
    Nom_Patient?: string;
    Prenom_Patient?: string;
    name?: string;
    numRegistre?: string;
    dossier_num?: string;
    [key: string]: any;
  };
}

export const FicheEnfantIMC: React.FC<FicheEnfantIMCProps> = ({ patient }) => {
  if (!patient) return <div className="p-4 text-slate-500">Chargement...</div>;
  const nom = patient.Nom || patient.Nom_Patient || patient.name || '';
  const prenom = patient.Prenom || patient.Prenom_Patient || '';
  const numRegistre = patient.numRegistre || patient.dossier_num || 'Non attribué';
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
          Fiche Enfant IMC — {nom} {prenom}
        </h2>
        <p className="text-sm text-slate-600 font-mono">
          <strong>N° Registre :</strong> {numRegistre}
        </p>
      </div>
    </div>
  );
};
