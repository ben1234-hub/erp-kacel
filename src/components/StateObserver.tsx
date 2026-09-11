import React, { useEffect, useRef, useState } from 'react';

interface StateObserverProps {
  data: any;
  label: string;
  onStateChange?: (hasChanged: boolean) => void;
}

export interface DebugLog {
  id: string;
  timestamp: string;
  label: string;
  oldRef: any;
  newRef: any;
  isEqual: boolean;
  stack?: string;
}

// Global registry for debug logs
if (typeof window !== 'undefined') {
  (window as any).__debug_logs = (window as any).__debug_logs || [];
}

export const addDebugLog = (log: Omit<DebugLog, 'id' | 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  const logs: DebugLog[] = (window as any).__debug_logs;
  const newLog: DebugLog = {
    ...log,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
  };
  logs.unshift(newLog); // Plus récent en premier
  
  // Limiter à 100 logs pour la mémoire
  if (logs.length > 100) {
    logs.pop();
  }
  
  // Émettre un événement personnalisé pour informer les composants abonnés
  window.dispatchEvent(new CustomEvent('debug-log-added', { detail: newLog }));
};

/**
 * Composant StateObserver
 * Utilitaire d'investigation pour détecter les changements de référence
 * et remonter à la source d'un ré-rendu inopiné.
 */
export const StateObserver = ({ data, label, onStateChange }: StateObserverProps) => {
  const prevDataJsonRef = useRef<string>('');
  const onStateChangeRef = useRef(onStateChange);

  // Garder le callback à jour sans déclencher l'effet
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  });

  useEffect(() => {
    const cleanForCompare = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (Array.isArray(obj)) return obj.map(cleanForCompare);
      if (typeof obj === 'object') {
        const res: any = {};
        for (const k of Object.keys(obj).sort()) {
          if (k === 'lastUpdated') continue;
          res[k] = cleanForCompare(obj[k]);
        }
        return res;
      }
      return obj;
    };

    const currentJson = JSON.stringify(cleanForCompare(data));
    const prevJson = prevDataJsonRef.current;

    if (prevJson && currentJson !== prevJson) {
      console.log(`[StateObserver] ${label} a changé (contenu différent)`);
      const stackTrace = new Error().stack;
      
      console.group(`🔍 [DEBUG] Changement de valeur détecté : ${label}`);
      console.log("Ancienne valeur :", prevJson ? JSON.parse(prevJson) : null);
      console.log("Nouvelle valeur :", data);
      console.trace("Empilement d'appels (Stack Trace) :");
      console.groupEnd();

      addDebugLog({
        label,
        oldRef: prevJson ? JSON.parse(prevJson) : null,
        newRef: data,
        isEqual: false,
        stack: stackTrace,
      });

      // On appelle le callback via la ref pour éviter les dépendances instables
      onStateChangeRef.current?.(true);
    } else if (!prevJson) {
      // Initialisation
      console.log(`[StateObserver] Initialisation de ${label}`);
    } else {
      // Référence différente mais contenu identique — on ne déclenche RIEN
      console.log(`[StateObserver] Référence différente mais contenu identique pour ${label} — ignoré`);
    }

    prevDataJsonRef.current = currentJson;
  }, [data, label]); // On garde data et label ici mais on ne déclenche plus de setState via callback

  return null;
};

/**
 * Composant de panneau de débogage visuel
 * Permet à l'utilisateur de copier et visualiser facilement les logs d'espionnage.
 */
export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogs([...((window as any).__debug_logs || [])]);

      const handleLogAdded = () => {
        setLogs([...((window as any).__debug_logs || [])]);
      };

      window.addEventListener('debug-log-added', handleLogAdded);
      return () => {
        window.removeEventListener('debug-log-added', handleLogAdded);
      };
    }
  }, []);

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      (window as any).__debug_logs = [];
      setLogs([]);
    }
  };

  const handleCopy = () => {
    if (logs.length === 0) {
      alert("Aucun log disponible pour la copie.");
      return;
    }

    const textToCopy = logs.map(log => {
      return `[${log.timestamp}] CHANGER : ${log.label}\n` +
             `- Égalité de référence : ${log.isEqual}\n` +
             `- Ancienne référence : ${JSON.stringify(log.oldRef, null, 2)?.substring(0, 300)}...\n` +
             `- Nouvelle référence : ${JSON.stringify(log.newRef, null, 2)?.substring(0, 300)}...\n` +
             `- Stack Trace :\n${log.stack || 'Aucune'}\n` +
             `--------------------------------------------------\n`;
    }).join('\n');

    navigator.clipboard.writeText(textToCopy)
      .then(() => alert("📋 Logs d'espionnage copiés dans le presse-papiers avec succès !"))
      .catch(err => {
        console.error("Échec de la copie :", err);
        alert("Erreur lors de la copie. Vous pouvez copier manuellement depuis la console.");
      });
  };

  return null;
};

