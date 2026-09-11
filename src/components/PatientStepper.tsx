import React from 'react';
import { Clock, MessageSquare, CheckCircle2, Check } from 'lucide-react';

interface PatientStepperProps {
  status: 'attente' | 'consultation' | 'termine' | 'termine';
  compact?: boolean;
}

export default function PatientStepper({ status, compact }: PatientStepperProps) {
  const getProgressWidth = () => {
    if (status === 'attente') return '0%';
    if (status === 'consultation') return '50%';
    if (status === 'termine') return '100%';
    return '0%';
  };

  if (compact) {
    return (
      <div className="w-full max-w-[120px] relative h-2">
        <div className="absolute inset-0 bg-slate-100 rounded-full" />
        <div 
          className="absolute inset-y-0 left-0 bg-brand-yellow rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(254,240,0,0.4)]" 
          style={{ width: getProgressWidth() }}
        />
        <div className="flex justify-between absolute -top-1 w-full px-0.5">
          <div className={`w-3.5 h-3.5 rounded-full border-2 ${status === 'attente' ? 'bg-brand-yellow border-brand-yellow' : 'bg-emerald-500 border-emerald-500'}`} />
          <div className={`w-3.5 h-3.5 rounded-full border-2 ${status === 'consultation' ? 'bg-blue-500 border-blue-500' : status === 'termine' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`} />
          <div className={`w-3.5 h-3.5 rounded-full border-2 ${status === 'termine' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute top-[28px] left-0 h-1.5 w-full bg-slate-100 rounded-full z-0" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-[28px] left-0 h-1.5 bg-brand-yellow transition-all duration-700 ease-in-out rounded-full z-1 shadow-[0_0_10px_rgba(254,240,0,0.5)]" 
          style={{ width: getProgressWidth() }}
        />

        {/* Step 1: En Attente */}
        <div className="flex flex-col items-center relative z-10 group">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
            status === 'attente' 
              ? 'bg-amber-500/10 border-brand-yellow text-brand-yellow scale-110 shadow-xl' 
              : 'bg-emerald-500 border-emerald-500 text-white'
          }`}>
            {status !== 'attente' ? <Check className="w-6 h-6 font-black" /> : <Clock className="w-6 h-6" />}
          </div>
        </div>

        {/* Step 2: En Consultation */}
        <div className="flex flex-col items-center relative z-10 group">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
            status === 'consultation' 
              ? 'bg-blue-500/20 border-blue-500 text-blue-400 scale-110 shadow-xl' 
              : status === 'termine' 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-white/5 border-white/10 text-slate-700'
          }`}>
            {status === 'termine' ? <Check className="w-6 h-6 font-black" /> : <MessageSquare className="w-6 h-6" />}
          </div>
        </div>

        {/* Step 3: Terminé */}
        <div className="flex flex-col items-center relative z-10 group">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
            status === 'termine' 
              ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-xl' 
              : 'bg-white/5 border-white/10 text-slate-700'
          }`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
