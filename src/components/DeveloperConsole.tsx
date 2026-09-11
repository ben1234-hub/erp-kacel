import React, { useState, useEffect } from 'react';
import { Terminal, Play, Pause, RotateCcw, Activity } from 'lucide-react';

interface DeveloperConsoleProps {
  accentColor: 'indigo' | 'emerald' | 'amber';
  setAccentColor: (color: 'indigo' | 'emerald' | 'amber') => void;
}

export default function DeveloperConsole({ accentColor, setAccentColor }: DeveloperConsoleProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  const [logs, setLogs] = useState<string[]>([
    'System sandbox initializing...',
    'Port 3000 mapping active.',
    'Click presets or toggles above to record activities.'
  ]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
        if (Math.random() < 0.2) {
          const events = [
            'Interactive framework online.',
            'State metrics synced successfully.',
            'Responsive container grid loaded.',
            'Prism visual parameters validated.'
          ];
          const randomEvent = events[Math.floor(Math.random() * events.length)];
          const now = new Date().toLocaleTimeString();
          setLogs((prev) => [`[${now}] ${randomEvent}`, ...prev.slice(0, 4)]);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const resetTimer = () => {
    setSeconds(0);
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] Timer counters cleared.`, ...prev.slice(0, 4)]);
  };

  const getAccentButtonClass = (color: string) => {
    const isSelected = accentColor === color;
    if (color === 'emerald') {
      return isSelected 
        ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30 font-medium' 
        : 'border-zinc-800 hover:border-emerald-900 hover:text-emerald-500 text-zinc-400 bg-zinc-950/20';
    }
    if (color === 'amber') {
      return isSelected 
        ? 'border-amber-500 text-amber-400 bg-amber-950/30 font-medium' 
        : 'border-zinc-800 hover:border-amber-900 hover:text-amber-500 text-zinc-400 bg-zinc-950/20';
    }
    return isSelected 
      ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30 font-medium' 
      : 'border-zinc-800 hover:border-indigo-900 hover:text-indigo-400 text-zinc-400 bg-zinc-950/20';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-full min-h-[430px]">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-100 tracking-tight">Interactive sandbox</h2>
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SYNCED
          </span>
        </div>

        {/* Dynamic Theme Color Presets */}
        <div className="mb-6">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
            Aesthetic Presets
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'indigo', name: 'Royal Indigo' },
              { id: 'emerald', name: 'Fresh Emerald' },
              { id: 'amber', name: 'Sunlit Amber' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setAccentColor(p.id as any);
                  setLogs((prev) => [`[${new Date().toLocaleTimeString()}] Theme adjusted to ${p.id}.`, ...prev.slice(0, 4)]);
                }}
                className={`py-2 px-1 rounded-lg border text-center text-[10px] transition-all cursor-pointer ${getAccentButtonClass(p.id)}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Session Counter */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 mb-5 select-none">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Interactive Timer Sync
            </span>
            <span className="text-xs font-mono text-zinc-400 font-medium">
              {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden mb-3.5">
            <div 
              className={`h-full transition-all duration-1000 ${
                accentColor === 'emerald' ? 'bg-emerald-500' : accentColor === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(seconds % 60) * 1.66}%` }}
            />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                accentColor === 'emerald' 
                  ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' 
                  : accentColor === 'amber' 
                    ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' 
                    : 'bg-indigo-500 text-indigo-950 hover:bg-indigo-400'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Resume
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Terminal Mock/Telemetry Monitor */}
      <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-3.5 font-mono text-[10px] text-zinc-500 min-h-[110px]">
        <div className="flex items-center gap-1.5 text-zinc-400 mb-2 font-sans select-none border-b border-zinc-900 pb-1.5">
          <Activity className="w-3 h-3" />
          <span>Interactive Sync-Stream</span>
        </div>
        <div className="space-y-1 h-[53px] overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="truncate select-text">
              <span className="text-zinc-700">&gt;</span> <span className={i === 0 ? 'text-zinc-300' : 'text-zinc-500'}>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
