/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";
import { Patient } from "../dbStore";

interface PatientSearchComboboxProps {
  patients: Patient[];
  onSelect: (patient: Patient) => void;
  placeholder?: string;
}

export const PatientSearchCombobox: React.FC<PatientSearchComboboxProps> = ({
  patients = [],
  onSelect,
  placeholder = "Rechercher un patient par nom, code ou tél...",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filtered, setFiltered] = useState<Patient[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter patients based on query with high-performance slicing (max 15 results)
  useEffect(() => {
    if (!query.trim()) {
      // If empty and opened, show a small sample of the first few patients or empty
      setFiltered([]);
      setHighlightedIndex(-1);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const matched: Patient[] = [];

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      const nameMatch = p.Nom_Patient?.toLowerCase().includes(lowerQuery);
      const codeMatch = String(p.ID_Patient).includes(lowerQuery) || 
                        (p.code_patient_origine && p.code_patient_origine.toLowerCase().includes(lowerQuery));
      const phoneMatch = p.phone && p.phone.replace(/[\s.-]/g, "").includes(lowerQuery.replace(/[\s.-]/g, ""));
      const arabicMatch = (p.Nom_Pat_Arb && p.Nom_Pat_Arb.includes(lowerQuery)) || 
                          (p.Pren_Pat_Arb && p.Pren_Pat_Arb.includes(lowerQuery));

      if (nameMatch || codeMatch || phoneMatch || arabicMatch) {
        matched.push(p);
        if (matched.length >= 15) {
          break; // Performance safety: stop once we have 15 results
        }
      }
    }

    setFiltered(matched);
    setHighlightedIndex((prev) => (matched.length > 0 ? 0 : -1));
  }, [query, patients]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ensure highlighted element is scrolled into view in dropdown list
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        const listContainer = listRef.current;
        const elemTop = highlightedElement.offsetTop;
        const elemBottom = elemTop + highlightedElement.offsetHeight;
        const containerTop = listContainer.scrollTop;
        const containerBottom = containerTop + listContainer.offsetHeight;

        if (elemTop < containerTop) {
          listContainer.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          listContainer.scrollTop = elemBottom - listContainer.offsetHeight;
        }
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : -1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && filtered[highlightedIndex]) {
        const selected = filtered[highlightedIndex];
        onSelect(selected);
        setQuery("");
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    onSelect(patient);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full" id="patient-search-combobox-container">
      {/* Search Input field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4.5 h-4.5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans font-medium text-slate-800 placeholder-slate-400"
          id="patient-search-combobox-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && query.trim() && (
        <div className="absolute z-55 w-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xl overflow-hidden transition-all duration-150">
          {filtered.length > 0 ? (
            <ul
              ref={listRef}
              className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200"
              role="listbox"
              id="patient-search-combobox-list"
            >
              {filtered.map((patient, index) => {
                const isHighlighted = index === highlightedIndex;
                const dossierCode = patient.code_patient_origine || `PAT_${patient.ID_Patient}`;
                
                return (
                  <li
                    key={patient.ID_Patient}
                    onClick={() => handleSelectPatient(patient)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2.5 flex flex-col gap-1 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                      isHighlighted ? "bg-indigo-50/70" : "hover:bg-slate-50/50"
                    }`}
                    role="option"
                    aria-selected={isHighlighted}
                    id={`patient-option-${patient.ID_Patient}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 text-xs sm:text-sm font-sans tracking-tight">
                        {patient.Nom_Patient}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold font-mono rounded border border-slate-200 shrink-0">
                        Code: {dossierCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium font-sans">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>
                          {patient.type_patient} • {patient.phone || "Pas de téléphone"}
                        </span>
                      </span>
                      {patient.Nom_Pat_Arb && (
                        <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold" dir="rtl">
                          {patient.Pren_Pat_Arb} {patient.Nom_Pat_Arb}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3.5 text-center text-xs sm:text-sm text-slate-500 font-sans font-medium">
              Aucun patient trouvé pour "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
