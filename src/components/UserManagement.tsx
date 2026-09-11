import React, { useState } from 'react';
import { Users, UserPlus, Edit2, Trash2, Check, X, ShieldAlert, Building, Search, Lock } from 'lucide-react';
import { DatabaseState, Utilisateur } from '../dbStore';

interface UserManagementProps {
  dbState: DatabaseState;
  currentUser: Utilisateur;
  onSave: (fresh: DatabaseState) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const PRESET_ROLES = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Assistante', label: 'Assistante' },
  { value: 'SupperRec', label: 'Super Réceptionniste' },
  { value: 'Receptionniste RDC', label: 'Réceptionniste RDC' },
  { value: 'Receptionniste Réeducation', label: 'Réceptionniste Rééducation' },
  { value: 'Receptionniste Balnéothérapie', label: 'Réceptionniste Balnéothérapie' },
  { value: 'Receptionniste Intensif 2e', label: 'Réceptionniste Intensif 2e' },
  { value: 'Receptionniste Intensif 3e', label: 'Réceptionniste Intensif 3e' },
  { value: 'Receptionniste Intensif 4e', label: 'Réceptionniste Intensif 4e' },
  { value: 'Médecin MPR', label: 'Médecin MPR' },
  { value: 'Marketing', label: 'Marketing' }
];

export default function UserManagement({ dbState, currentUser, onSave, triggerToast }: UserManagementProps) {
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Add state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState(PRESET_ROLES[2].value);
  const [newSce, setNewSce] = useState<number>(1);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSce, setEditSce] = useState<number>(1);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  if (currentUser.Role !== 'Admin') {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0" />
        <div>
          <h2 className="font-sans font-bold text-base">Accès Refusé</h2>
          <p className="text-sm text-rose-700/95 mt-0.5">Seul un administrateur système (rôle Admin) peut accéder à la gestion des utilisateurs de l'ERP.</p>
        </div>
      </div>
    );
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLogin.trim()) {
      triggerToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    const normalizedLogin = newLogin.trim().toLowerCase();
    
    const loginExists = dbState.utilisateurs.some(u => u.Login.toLowerCase() === normalizedLogin);
    if (loginExists) {
      triggerToast(`L'identifiant de session "${newLogin}" est déjà utilisé par un autre utilisateur.`, "error");
      return;
    }

    const nextId = Math.max(...dbState.utilisateurs.map(u => u.ID_Utilisateur || 0), 0) + 1;
    const finalPassword = newPassword.trim() || normalizedLogin;
    
    const newUser: any = {
       ID_Utilisateur: nextId,
       ID_User: nextId,
       ID_Sce: Number(newSce),
       Nom_Utilisateur: newName.trim(),
       Nom: newName.trim(),
       Role: newRole,
       Login: normalizedLogin,
       login: normalizedLogin,
       Username: normalizedLogin,
       MotDePasse: finalPassword,
       Password: finalPassword
    };

    const fresh: any = {
      ...dbState,
      utilisateurs: [...(dbState.utilisateurs || []), newUser],
      ...((dbState as any).users ? { users: [...((dbState as any).users || []), newUser] } : {})
    };

    onSave(fresh);
    triggerToast(`Utilisateur créé. Login: ${normalizedLogin} | Mot de passe: ${finalPassword}`, "success");
    
    setNewName('');
    setNewLogin('');
    setNewPassword('');
    setNewRole(PRESET_ROLES[2].value);
    setNewSce(1);
    setIsAdding(false);
  };

  const handleStartEdit = (user: Utilisateur) => {
    setEditingUserId(user.ID_Utilisateur);
    setEditName(user.Nom_Utilisateur || user.Nom || '');
    setEditLogin(user.Login || user.login || user.Username || '');
    setEditPassword(user.MotDePasse || user.Password || '');
    setEditRole(user.Role || 'Receptionniste RDC');
    setEditSce(user.ID_Sce || 1);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = (userId: number) => {
    if (!editName.trim() || !editLogin.trim()) {
      triggerToast("Le nom et l'identifiant ne peuvent pas être vides.", "error");
      return;
    }

    const normalizedLogin = editLogin.trim().toLowerCase();
    
    const loginExists = dbState.utilisateurs.some(
      u => u.ID_Utilisateur !== userId && u.Login.toLowerCase() === normalizedLogin
    );
    if (loginExists) {
      triggerToast(`L'identifiant "${editLogin}" est déjà attribué.`, "error");
      return;
    }

    const currentUserData = dbState.utilisateurs.find(u => u.ID_Utilisateur === userId);
    const newPassword = editPassword.trim() || currentUserData?.MotDePasse || currentUserData?.Password || normalizedLogin;

    const updatedUtilisateurs = dbState.utilisateurs.map(u => {
      if (u.ID_Utilisateur === userId) {
        return {
          ...u,
          ID_Utilisateur: userId,
          ID_User: userId,
          Nom_Utilisateur: editName.trim(),
          Nom: editName.trim(),
          Login: normalizedLogin,
          login: normalizedLogin,
          Username: normalizedLogin,
          MotDePasse: newPassword,
          Password: newPassword,
          Role: editRole,
          ID_Sce: Number(editSce)
        };
      }
      return u;
    });

    const fresh: any = {
      ...dbState,
      utilisateurs: updatedUtilisateurs,
      ...((dbState as any).users ? {
        users: (dbState as any).users.map((u: any) => 
          (u.ID_Utilisateur === userId || u.ID_User === userId)
            ? updatedUtilisateurs.find((x: any) => x.ID_Utilisateur === userId) 
            : u
        )
      } : {})
    };

    onSave(fresh);
    triggerToast("Informations utilisateur mises à jour et synchronisées.", "success");
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (userId === currentUser.ID_Utilisateur) {
      triggerToast("Sécurité de session : vous ne pouvez pas supprimer votre propre compte principal en cours d'utilisation.", "error");
      return;
    }

    const confirmMsg = `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${userName}" ? (Session : ${dbState.utilisateurs.find(u => u.ID_Utilisateur === userId)?.Login})\nCette action prendra effet immédiatement sur tous les écrans du réseau local.`;
    if (window.confirm(confirmMsg)) {
      const fresh: any = {
        ...dbState,
        utilisateurs: dbState.utilisateurs.filter(u => u.ID_Utilisateur !== userId),
        ...((dbState as any).users ? {
          users: (dbState as any).users.filter((u: any) => u.ID_Utilisateur !== userId && u.ID_User !== userId)
        } : {})
      };

      onSave(fresh);
      triggerToast(`L'utilisateur "${userName}" a été retiré et synchronisé.`, "success");
    }
  };

  const filteredUsers = dbState.utilisateurs.filter(u => {
    const term = searchQuery.toLowerCase();
    const name = (u.Nom_Utilisateur || u.Nom || '').toLowerCase();
    const login = (u.Login || u.login || u.Username || '').toLowerCase();
    const role = (u.Role || '').toLowerCase();
    return name.includes(term) || login.includes(term) || role.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              Back-Office : Gestion Globale des Utilisateurs
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Gérez les privilèges, modifiez les rôles ou affectez les réceptionnistes de l'établissement à d'autres services en temps réel sur le réseau local.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-rose-950/30 transition-all active:scale-95 self-start md:self-auto"
        >
          {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>{isAdding ? "Fermer le formulaire" : "Nouvel Utilisateur"}</span>
        </button>
      </div>

      {/* Add User Accordion */}
      {isAdding && (
        <form onSubmit={handleAddUser} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 space-y-4 animate-fadeIn">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-rose-500" />
            Créer un nouveau compte utilisateur ERP
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nom Complet *</label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="ex: Dr. Benali Mohamed"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Login (Identifiant) *</label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="ex: benali"
                value={newLogin}
                onChange={e => setNewLogin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mot de passe *</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 font-mono focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="Optionnel (par défaut = login)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rôle d'accès *</label>
              <select
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                {PRESET_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service Rattachement</label>
              <select
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                value={newSce}
                onChange={e => setNewSce(Number(e.target.value))}
              >
                {dbState.services.map(s => (
                  <option key={s.ID_Sce} value={s.ID_Sce}>{s.Libelle_Sce}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition-all"
            >
              Enregistrer le compte
            </button>
          </div>
        </form>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-2xl text-xs bg-white font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="Rechercher par nom, login ou rôle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Total : <span className="font-extrabold text-slate-800">{filteredUsers.length}</span> compte(s)
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="p-3 pl-6">ID</th>
                <th className="p-3">Nom complet</th>
                <th className="p-3">Identifiant (Login)</th>
                <th className="p-3">Mot de passe</th>
                <th className="p-3">Rôle attribué</th>
                <th className="p-3">Service</th>
                <th className="p-3 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredUsers.map(u => {
                const isEditing = editingUserId === u.ID_Utilisateur;
                const sceObj = dbState.services.find(s => s.ID_Sce === (isEditing ? editSce : u.ID_Sce));

                return (
                  <tr key={u.ID_Utilisateur} className={isEditing ? 'bg-amber-50/60' : 'hover:bg-slate-50/80 transition-colors'}>
                    <td className="p-3 pl-6 font-mono font-bold text-slate-400">
                      #{u.ID_Utilisateur}
                    </td>

                    {isEditing ? (
                      <>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full border border-amber-300 rounded-lg p-1.5 text-xs bg-white font-bold text-slate-900"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full border border-amber-300 rounded-lg p-1.5 text-xs bg-white font-mono font-bold text-indigo-700"
                            value={editLogin}
                            onChange={e => setEditLogin(e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full border border-amber-300 rounded-lg p-1.5 text-xs bg-white font-mono text-slate-800"
                            placeholder="Nouveau mdp"
                            value={editPassword}
                            onChange={e => setEditPassword(e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <select
                            className="w-full border border-amber-300 rounded-lg p-1.5 text-xs bg-white font-bold text-slate-800"
                            value={editRole}
                            onChange={e => setEditRole(e.target.value)}
                          >
                            {PRESET_ROLES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            className="w-full border border-amber-300 rounded-lg p-1.5 text-xs bg-white font-medium text-slate-800"
                            value={editSce}
                            onChange={e => setEditSce(Number(e.target.value))}
                          >
                            {dbState.services.map(s => (
                              <option key={s.ID_Sce} value={s.ID_Sce}>{s.Libelle_Sce}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(u.ID_Utilisateur)}
                              className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg shadow transition-all"
                              title="Valider la modification"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-slate-300 text-slate-700 hover:bg-slate-400 rounded-lg transition-all"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-bold text-slate-900">
                          {u.Nom_Utilisateur || u.Nom}
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-600">
                          {u.Login || u.login || u.Username}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <Lock className="w-3 h-3 text-slate-400" />
                            {u.MotDePasse || u.Password || '••••••••'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wide uppercase ${
                            u.Role === 'Admin' 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : u.Role.includes('Receptionniste')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {u.Role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sceObj ? sceObj.Libelle_Sce : `Service #${u.ID_Sce}`}</span>
                        </td>
                        <td className="p-3 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(u)}
                              className="p-1.5 hover:bg-slate-200/80 text-slate-600 rounded-lg transition-colors"
                              title="Modifier les privilèges"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.ID_Utilisateur, u.Nom_Utilisateur || u.Nom)}
                              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
