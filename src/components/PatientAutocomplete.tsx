/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import { Patient } from '../dbStore';

interface PatientAutocompleteProps {
  patients: Patient[];
  onSelect: (patient: Patient) => void;
  placeholder?: string;
  className?: string;
  genderRule?: 'H' | 'F' | 'E' | null;
}

export const PatientAutocomplete: React.FC<PatientAutocompleteProps> = ({
  patients,
  onSelect,
  placeholder = "Commencer à taper le nom du patient...",
  className = "",
  genderRule = null
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length > 0) {
      // LOGIQUE BACKEND SIMULÉE : Clause WHERE Nom_Patient LIKE 'val%'
      // On filtre les patients dont le nom COMMENCE par la saisie
      const filtered = patients.filter(p => {
        const matchesName = p.Nom_Patient.toLowerCase().includes(value.toLowerCase());
        
        // Filtre de genre si applicable (Plateau/Balneo rules)
        if (genderRule && p.type_patient === 'Adulte') {
          const patGender = p.Genre_Patient === 'Homme' ? 'H' : p.Genre_Patient === 'Femme' ? 'F' : 'E';
          if (patGender !== genderRule) return false;
        }

        return matchesName;
      }).slice(0, 10); // Performance : on limite aux 10 premiers résultats

      setSuggestions(filtered);
      setIsOpen(true);
      setHighlightedIndex(filtered.length > 0 ? 0 : -1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (suggestions.length > 0 ? (prev + 1) % suggestions.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        suggestions.length > 0 ? (prev - 1 + suggestions.length) % suggestions.length : -1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative max-w-sm mx-auto w-full ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-3xs"
        />
        {inputValue && (
          <button 
            onClick={() => { setInputValue(''); setSuggestions([]); setHighlightedIndex(-1); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {suggestions.map((p, index) => (
              <button
                key={p.ID_Patient}
                onClick={() => handleSelect(p)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left group ${
                  index === highlightedIndex ? "bg-indigo-50/70 text-indigo-750" : "hover:bg-indigo-50/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                    {p.Nom_Patient.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 group-hover:text-indigo-700">{p.Nom_Patient}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                      <span>{p.type_patient}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{p.Age_Patient || 30} ans</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 group-hover:bg-indigo-100 px-2 py-1 rounded text-[9px] font-black text-slate-400 group-hover:text-indigo-600 transition tracking-tighter">
                  SÉLECTIONNER
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && inputValue.length > 0 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400">Aucun patient trouvé commençant par "{inputValue}"</p>
        </div>
      )}
    </div>
  );
};
