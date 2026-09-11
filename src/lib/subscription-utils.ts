/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GestionAbonnement, Pack, Versement, Patient, SubscriptionDetails } from '../types';

export function computeSubscriptionDetails(
  abo: GestionAbonnement,
  packs: Pack[],
  versements: Versement[]
): SubscriptionDetails {
  const pack = packs.find(p => p.id === abo.pack_id);
  const total_sans_remise = pack ? pack.amount : 0;
  const total_avec_remise = Number((total_sans_remise * (1.0 - (abo.remise_globale || 0) / 100)).toFixed(2));
  const number_of_sessions = pack ? pack.nombre_seance : 0;
  const remaining_sessions = Math.max(0, number_of_sessions - (abo.used_sessions || 0));
  
  // Find all payments registered for this subscription record
  const relatedVersements = versements.filter(v => v.gestion_abonnement_id === abo.id);
  const total_versement = Number(relatedVersements.reduce((sum, v) => sum + v.amount, 0).toFixed(2));
  const amount_remaining = Number(Math.max(0, total_avec_remise - total_versement).toFixed(2));
  
  let state: 'with_debt' | 'without_debt' | 'abonnement_end' = 'without_debt';
  if (remaining_sessions <= 0) {
    state = 'abonnement_end';
  } else if (amount_remaining > 0.1) {
    state = 'with_debt';
  } else {
    state = 'without_debt';
  }

  return {
    pack,
    number_of_sessions,
    total_sans_remise,
    total_avec_remise,
    remaining_sessions,
    total_versement,
    amount_remaining,
    state
  };
}

// Generate code for a subscription based on first name of the patient + date of subscription
export function computeSubscriptionCode(patientName: string, dateStr: string | Date): string {
  if (!patientName) return 'ABN/Nouveau';
  const firstName = patientName.split(' ')[0] || '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `ABN/${firstName}/${day}/${month}/${year}`;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', { 
    style: 'currency', 
    currency: 'DZD', 
    maximumFractionDigits: 0 
  }).format(amount);
}
