import React, { useState } from 'react';
import { Sparkles, Copy, Check, Blocks, Database, Layout, ShieldAlert } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  promptSnippet: string;
}

const FEATURE_TEMPLATES: Feature[] = [
  {
    id: 'db',
    name: 'Durable Database Storage',
    description: 'Track users, logs, and robust state persistency in a schema-backed DB.',
    icon: Database,
    promptSnippet: 'using a DB to persist historic logs and data entries across user sessions'
  },
  {
    id: 'ai',
    name: 'Gemini AI Autocompletion',
    description: 'Call server-side Gemini models to analyze content, summarize data, or offer suggestions.',
    icon: Sparkles,
    promptSnippet: 'with server-side Gemini intelligence that generates live, context-aware analyses or suggestions'
  },
  {
    id: 'auth',
    name: 'Secure Account Authentication',
    description: 'Add real individual logins, user profiles, and private dashboard partitions.',
    icon: ShieldAlert,
    promptSnippet: 'secured by full user authentication with active session persistence'
  },
  {
    id: 'viz',
    name: 'Responsive Visual Graphs',
    description: 'Present interactive progress metrics with highly stylized charts.',
    icon: Blocks,
    promptSnippet: 'featuring high-fidelity interactive data graphs, layout transitions, and trend lines'
  }
];

const PRESETS = [
  {
    name: 'Mindful Breathing Workspace',
    category: 'Zen & Focus',
    prompt: 'Construct a highly immersive Mindful Breathing app centered around an interactive sine-wave audio respiratory guide. Include customized session logging, streak targets, and tranquil ambient themes.'
  },
  {
    name: 'Interactive Dev Log & Tracker',
    category: 'Developer Utilities',
    prompt: 'Build a developers log tracker that records code milestones, monitors build errors, handles dynamic tags, and generates automatic developer status reports.'
  },
  {
    name: 'Sleek Task Flow Board',
    category: 'Workflow Management',
    prompt: 'Build a sleek, fluid task management kanban board with custom transition physics. Allow tag filtering, project prioritization, and interactive state timelines.'
  }
];

export default function PromptBuilder() {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getGeneratedPrompt = () => {
    const baseTopic = customTopic.trim() || 'productive workspace container';
    const featuresList = FEATURE_TEMPLATES.filter(f => selectedFeatures.includes(f.id));
    
    if (featuresList.length === 0) {
      return `Build an elegant, interactive ${baseTopic} with a beautiful minimalist dark layout, pristine Space Grotesk display headings, and smooth page transitions. Use premium interactive state hooks for optimal speed.`;
    }

    const featurePhrases = featuresList.map(f => f.promptSnippet).join(', and ');
    return `Build an elegant, interactive ${baseTopic} with a beautiful minimalist dark layout, pristine Space Grotesk display headings, and smooth page transitions, ${featurePhrases}. Ensure strict architectural modularity and exquisite typography.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getGeneratedPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Layout className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-medium text-zinc-100 tracking-tight">AI Studio prompt generator</h2>
      </div>

      <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
        Toggle various capabilities below to dynamically sculpt a comprehensive prompt sequence. Use this prompt in the chat box to request a complete system build.
      </p>

      {/* Preset Blueprints */}
      <div className="mb-6">
        <span className="block text-10px font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
          1. Popular System Templates
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setCustomTopic(p.name);
                if (p.name.includes('AI') || p.name.includes('Dev Log')) {
                  setSelectedFeatures(['ai', 'viz']);
                } else if (p.name.includes('Breathing')) {
                  setSelectedFeatures(['viz']);
                } else {
                  setSelectedFeatures(['db']);
                }
              }}
              className="text-left p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80 hover:border-zinc-700 transition-all cursor-pointer group"
            >
              <span className="inline-block text-[10px] font-semibold text-indigo-400/90 mb-1">{p.category}</span>
              <div className="text-xs text-zinc-200 font-medium group-hover:text-white transition-colors line-clamp-2 leading-snug">
                {p.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Concept Input */}
      <div className="mb-6">
        <span className="block text-10px font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          2. Customize App Topic
        </span>
        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="e.g., Personal Calorie Ledger, Interactive Music Synth, Developer Timeline Key..."
          className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors text-xs"
        />
      </div>

      {/* Superpowers */}
      <div className="mb-6">
        <span className="block text-10px font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          3. Optional Superpowers
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURE_TEMPLATES.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFeatures.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleFeature(f.id)}
                className={`flex gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500/40 bg-indigo-950/15 text-zinc-200'
                    : 'border-zinc-800/80 bg-zinc-950/20 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-950/40'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-90 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-medium leading-snug ${isSelected ? 'text-indigo-300' : 'text-zinc-300'}`}>
                    {f.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft Result */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4.5">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Formulated Prompt Sequence
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/30 hover:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-900/40 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied To Clipboard
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy Prompt
              </>
            )}
          </button>
        </div>
        <p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/30 select-all min-h-12 flex items-center">
          {getGeneratedPrompt()}
        </p>
      </div>
    </div>
  );
}
