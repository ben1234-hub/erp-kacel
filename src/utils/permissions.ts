export type UserRole = 'Admin' | 'Médecin' | 'SupperRec' | 'Réceptionniste' | 'Kiné' | 'Psychomotricien' | 'Orthophoniste';

export interface PermissionGuard {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Permissions par module et par rôle
export const PERMISSIONS: Record<string, Record<UserRole, PermissionGuard>> = {
  // FILE D'ATTENTE MPR
  queue_mpr: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: true, canCreate: false, canEdit: true, canDelete: false },
    SupperRec:    { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Réceptionniste: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Kiné:         { canView: true, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },

  // PLANNING RÉÉDUCATION & BALNÉO
  planning_reeduc_balneo: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: true, canCreate: true, canEdit: true, canDelete: true },
    SupperRec:    { canView: true, canCreate: true, canEdit: true, canDelete: false }, // ⭐ LECTURE + ÉCRITURE, PAS SUPPRESSION
    Réceptionniste: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    Kiné:         { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Psychomotricien: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },

  // PLANNING PSYCHOMOTRICITÉ
  planning_psych: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: true, canCreate: true, canEdit: true, canDelete: true },
    SupperRec:    { canView: true, canCreate: true, canEdit: true, canDelete: false }, // ⭐ LECTURE + ÉCRITURE, PAS SUPPRESSION
    Réceptionniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Kiné:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Orthophoniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },

  // PLANNING ORTHOPHONIE
  planning_ortho: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: true, canCreate: true, canEdit: true, canDelete: true },
    SupperRec:    { canView: true, canCreate: true, canEdit: true, canDelete: false }, // ⭐ LECTURE + ÉCRITURE, PAS SUPPRESSION
    Réceptionniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Kiné:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: true, canCreate: true, canEdit: true, canDelete: false },
  },

  // MESSAGERIE
  messagerie: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: true, canCreate: true, canEdit: true, canDelete: true },
    SupperRec:    { canView: true, canCreate: true, canEdit: true, canDelete: false }, // ⭐ SON PROPRE COMPTE
    Réceptionniste: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Kiné:         { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Psychomotricien: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Orthophoniste: { canView: true, canCreate: true, canEdit: true, canDelete: false },
  },

  // FACTURATION (admin uniquement)
  facturation: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: false, canCreate: false, canEdit: false, canDelete: false },
    SupperRec:    { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Réceptionniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Kiné:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },

  // CAISSE
  caisse: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: false, canCreate: false, canEdit: false, canDelete: false },
    SupperRec:    { canView: false, canCreate: false, canEdit: false, canDelete: false }, // INTERDIT POUR SUPPERREC
    Réceptionniste: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Kiné:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },

  // FICHE PATIENT
  fiche_patient: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: true, canCreate: true, canEdit: true, canDelete: false },
    SupperRec:    { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Réceptionniste: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    Kiné:         { canView: true, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  },

  // PARAMÈTRES (admin uniquement)
  parametres: {
    Admin:        { canView: true, canCreate: true, canEdit: true, canDelete: true },
    Médecin:      { canView: false, canCreate: false, canEdit: false, canDelete: false },
    SupperRec:    { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Réceptionniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Kiné:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Psychomotricien: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    Orthophoniste: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
};

export const normalizeRole = (role?: string): UserRole => {
  if (!role) return 'Réceptionniste';
  const r = role.trim();
  if (r === 'SupperRec' || r === 'Super Receptionniste' || r === 'Super Réceptionniste') return 'SupperRec';
  if (r === 'Admin' || r === 'Assistante') return 'Admin';
  if (r.includes('Médecin')) return 'Médecin';
  if (r.includes('Kiné')) return 'Kiné';
  if (r.includes('Psych')) return 'Psychomotricien';
  if (r.includes('Ortho')) return 'Orthophoniste';
  if (r.startsWith('Receptionniste') || r.includes('Réceptionniste') || r === 'Marketing') return 'Réceptionniste';
  return (r as UserRole) || 'Réceptionniste';
};

// Helper pour vérifier une permission
export const hasPermission = (
  role: UserRole | string | undefined,
  module: string,
  action: keyof PermissionGuard
): boolean => {
  const normRole = normalizeRole(role);
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const rolePerms = modulePerms[normRole];
  if (!rolePerms) return false;
  return rolePerms[action];
};

// Helper pour récupérer toutes les permissions d'un module
export const getPermissions = (
  role: UserRole | string | undefined,
  module: string
): PermissionGuard => {
  const normRole = normalizeRole(role);
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return { canView: false, canCreate: false, canEdit: false, canDelete: false };
  return modulePerms[normRole] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
};
