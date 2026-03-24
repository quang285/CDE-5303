import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  FileText, 
  Clock, 
  AlertCircle, 
  Plus, 
  Send, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle,
  Loader2,
  Gavel,
  ShieldCheck,
  Stethoscope,
  Briefcase,
  UserCheck,
  ArrowRight,
  FileCheck,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeLawsuit } from './services/gemini';
import { FactPackage, AnalysisState, WorkflowStatus, UrgencyLevel } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const WORKFLOW_STEPS = [
  { id: 'TRIAGE', label: 'Triage', icon: Stethoscope },
  { id: 'READINESS', label: 'Readiness', icon: FileCheck },
  { id: 'MATCHING', label: 'Matching', icon: UserCheck },
  { id: 'COMPLETED', label: 'Consult', icon: Calendar },
];

export default function App() {
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    factPackage: null,
    error: null,
  });
  const [activeTab, setActiveTab] = useState<'next-steps' | 'readiness' | 'chronology' | 'assessment'>('next-steps');
  const [actionResponses, setActionResponses] = useState<Record<string, { text: string, files: string[] }>>({});
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  const handleQuestionAnswer = (id: string, text: string) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [id]: text
    }));
  };

  const handleSubmitAllAnswers = async () => {
    const answers = Object.entries(questionAnswers)
      .filter(([_, text]) => text.trim())
      .map(([id, text]) => {
        const question = state.factPackage?.actionList.find(a => a.id === id);
        return `Regarding ${question?.label}: ${text}`;
      })
      .join('\n\n');

    if (!answers) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const result = await analyzeLawsuit(answers, state.factPackage || undefined);
      setState({
        isAnalyzing: false,
        factPackage: result,
        error: null,
      });
      setQuestionAnswers({});
      if (result.legalAssessment) {
        setActiveTab('assessment');
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      }));
    }
  };

  const handleActionResponse = (id: string, text: string) => {
    setActionResponses(prev => ({
      ...prev,
      [id]: { ...prev[id], text }
    }));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const result = await analyzeLawsuit(inputText, state.factPackage || undefined);
      setState({
        isAnalyzing: false,
        factPackage: result,
        error: null,
      });
      setInputText('');
    } catch (err) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      }));
    }
  };

  const currentStepIndex = state.factPackage 
    ? WORKFLOW_STEPS.findIndex(s => s.id === state.factPackage?.workflowStatus)
    : -1;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDFDFD]">
      {/* Header */}
      <header className="h-16 border-b border-zinc-100 bg-white flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-none">SG LegalTriage</h1>
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Singapore Jurisdiction</span>
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="mx-auto flex items-center gap-1">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            return (
              <React.Fragment key={step.id}>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                  isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : 
                  isCompleted ? "text-emerald-600" : "text-zinc-300"
                )}>
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider hidden md:block">{step.label}</span>
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className={cn(
                    "w-4 h-[1px]",
                    idx < currentStepIndex ? "bg-emerald-200" : "bg-zinc-100"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-mono text-zinc-500">v2.1_SG_CORE</div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Triage Input */}
        <div className="w-[420px] border-r border-zinc-100 bg-zinc-50/50 flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Triage Input</h2>
                {state.factPackage && (
                  <button 
                    onClick={() => setState({ isAnalyzing: false, factPackage: null, error: null })}
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 uppercase"
                  >
                    Reset Case
                  </button>
                )}
              </div>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="relative group">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Describe your legal issue in Singapore (e.g., employment dispute, family matter, tenancy issue)..."
                    className="w-full h-64 p-5 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all resize-none shadow-sm placeholder:text-zinc-300"
                  />
                  <div className="absolute bottom-4 right-4">
                    <button
                      type="submit"
                      disabled={state.isAnalyzing || !inputText.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      {state.isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-bold uppercase">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Analyze SG Law</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white border border-zinc-100 rounded-xl">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Singapore Context Tips</h4>
                  <ul className="space-y-1.5">
                    <li className="text-[11px] text-zinc-500 flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      Mention if you've received a Letter of Demand.
                    </li>
                    <li className="text-[11px] text-zinc-500 flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      Specify if it involves MOM, HDB, or CPF.
                    </li>
                  </ul>
                </div>
              </form>
            </div>

            {state.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-medium">{state.error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Triage Dashboard */}
        <div className="flex-1 bg-white overflow-y-auto legal-grid">
          <AnimatePresence mode="wait">
            {state.factPackage ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-10 max-w-5xl mx-auto"
              >
                {/* Urgency & Category Badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                    state.factPackage.urgency === UrgencyLevel.CRITICAL ? "bg-red-100 text-red-700 border border-red-200" :
                    state.factPackage.urgency === UrgencyLevel.HIGH ? "bg-orange-100 text-orange-700 border border-orange-200" :
                    "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  )}>
                    <AlertCircle className="w-3 h-3" />
                    {state.factPackage.urgency} Priority
                  </div>
                  <div className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-zinc-200">
                    {state.factPackage.category}
                  </div>
                </div>

                <h2 className="text-4xl font-bold text-zinc-900 tracking-tight mb-4 leading-tight">
                  {state.factPackage.caseTitle}
                </h2>
                
                <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl mb-10">
                  <p className="text-zinc-600 text-sm leading-relaxed italic">
                    <span className="font-bold text-zinc-900 not-italic mr-2">Urgency Assessment:</span>
                    {state.factPackage.urgencyReason}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 mb-10">
                  <button
                    onClick={() => setActiveTab('next-steps')}
                    className={cn(
                      "px-8 py-4 text-sm font-bold transition-all relative flex items-center gap-2",
                      activeTab === 'next-steps' ? "text-emerald-700" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    <ArrowRight className="w-4 h-4" />
                    Next Steps
                    {activeTab === 'next-steps' && (
                      <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('assessment')}
                    className={cn(
                      "px-8 py-4 text-sm font-bold transition-all relative flex items-center gap-2",
                      activeTab === 'assessment' ? "text-emerald-700" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    <Scale className="w-4 h-4" />
                    Legal Assessment
                    {state.factPackage.legalAssessment && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {activeTab === 'assessment' && (
                      <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('readiness')}
                    className={cn(
                      "px-8 py-4 text-sm font-bold transition-all relative flex items-center gap-2",
                      activeTab === 'readiness' ? "text-emerald-700" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    <Briefcase className="w-4 h-4" />
                    Consultation Packet
                    {activeTab === 'readiness' && (
                      <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('chronology')}
                    className={cn(
                      "px-8 py-4 text-sm font-bold transition-all relative flex items-center gap-2",
                      activeTab === 'chronology' ? "text-emerald-700" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    Case Chronology
                    {activeTab === 'chronology' && (
                      <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                  {activeTab === 'next-steps' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-8">
                        {/* AI Assistant Question Section */}
                        {state.factPackage.actionList.some(a => a.type === 'question') && (
                          <div className="p-6 bg-emerald-900 rounded-3xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <HelpCircle className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">AI Legal Assistant</h3>
                              </div>
                              <h4 className="text-xl font-bold mb-4">I need a few more details to complete your Singapore legal assessment:</h4>
                              <div className="space-y-4">
                                {state.factPackage.actionList.filter(a => a.type === 'question').map((q, i) => (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={q.id}
                                    className="w-full p-5 bg-white/10 border border-white/10 rounded-2xl transition-all"
                                  >
                                    <div className="mb-3">
                                      <p className="text-sm font-bold text-white mb-1">{q.label}</p>
                                      <div className="flex items-start gap-2">
                                        <div className="mt-1 px-1.5 py-0.5 bg-emerald-500/30 rounded text-[8px] font-black uppercase tracking-tighter text-emerald-300 border border-emerald-500/50 shrink-0">
                                          Legal Basis
                                        </div>
                                        <p className="text-xs text-emerald-200/70 leading-relaxed">
                                          {q.description}
                                        </p>
                                      </div>
                                    </div>
                                    <textarea
                                      value={questionAnswers[q.id] || ''}
                                      onChange={(e) => handleQuestionAnswer(q.id, e.target.value)}
                                      placeholder="Type your answer here..."
                                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all min-h-[80px] resize-none"
                                    />
                                  </motion.div>
                                ))}
                                
                                <button
                                  onClick={handleSubmitAllAnswers}
                                  disabled={state.isAnalyzing || !Object.values(questionAnswers).some(v => v.trim())}
                                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                                >
                                  {state.isAnalyzing ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Updating Assessment...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      Submit All Answers
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                          <h3 className="text-lg font-bold text-emerald-900 mb-2">Recommended Strategy</h3>
                          <p className="text-emerald-800 text-sm leading-relaxed">
                            {state.factPackage.recommendedNextStep}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Required Documents & Actions</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {state.factPackage.actionList.filter(a => a.type !== 'question').map((action, i) => (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={action.id}
                                className={cn(
                                  "border rounded-2xl transition-all overflow-hidden",
                                  expandedActionId === action.id ? "border-emerald-200 bg-white shadow-md" : "border-zinc-100 bg-white hover:border-emerald-200"
                                )}
                              >
                                <button 
                                  onClick={() => setExpandedActionId(expandedActionId === action.id ? null : action.id)}
                                  className="w-full flex items-center gap-4 p-5 text-left group"
                                >
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                    action.type === 'document' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                  )}>
                                    {action.type === 'document' ? <FileText className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-bold text-zinc-900">{action.label}</h5>
                                    <p className="text-xs text-zinc-500">{action.description}</p>
                                  </div>
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    expandedActionId === action.id ? "bg-emerald-100 text-emerald-600 rotate-180" : "bg-zinc-50 text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                  )}>
                                    <Plus className="w-4 h-4" />
                                  </div>
                                </button>
                                
                                <AnimatePresence>
                                  {expandedActionId === action.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="px-5 pb-5 border-t border-zinc-50 pt-5 space-y-4"
                                    >
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Provide Details or Upload</label>
                                        <textarea 
                                          value={actionResponses[action.id]?.text || ''}
                                          onChange={(e) => handleActionResponse(action.id, e.target.value)}
                                          placeholder={action.type === 'document' ? "Describe the document or paste relevant text here..." : "Provide more details about this action..."}
                                          className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-xs focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all min-h-[100px] resize-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                          <CheckCircle2 className="w-4 h-4" />
                                          Save Details
                                        </button>
                                        <button className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2">
                                          <Plus className="w-4 h-4" />
                                          Attach File
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Sidebar: Context Preview */}
                      <div className="space-y-8">
                        <section className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            What I Know So Far
                          </h4>
                          <div className="space-y-6">
                            <div>
                              <h5 className="text-[10px] font-bold text-zinc-900 uppercase mb-2">Case Summary</h5>
                              <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">
                                {state.factPackage.summary}
                              </p>
                            </div>
                            <div className="pt-4 border-t border-zinc-50">
                              <h5 className="text-[10px] font-bold text-zinc-900 uppercase mb-3">Extracted Facts</h5>
                              <div className="space-y-2">
                                {state.factPackage.facts.slice(0, 3).map((f, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                    <div>
                                      {f.timestamp && (
                                        <span className="text-[8px] font-bold text-zinc-400 font-mono uppercase block mb-0.5">{f.timestamp}</span>
                                      )}
                                      <p className="text-[11px] text-zinc-600 leading-tight">{f.statement}</p>
                                    </div>
                                  </div>
                                ))}
                                {state.factPackage.facts.length > 3 && (
                                  <button onClick={() => setActiveTab('readiness')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">
                                    + {state.factPackage.facts.length - 3} more facts
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="pt-4 border-t border-zinc-50">
                              <h5 className="text-[10px] font-bold text-zinc-900 uppercase mb-3">Timeline Preview</h5>
                              <div className="space-y-3">
                                {state.factPackage.timeline.slice(0, 2).map((e, i) => (
                                  <div key={i} className="relative pl-4 border-l border-zinc-100">
                                    <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-bold text-zinc-400 font-mono block mb-0.5">{e.date}</span>
                                    <p className="text-[11px] text-zinc-600 leading-tight">{e.description}</p>
                                  </div>
                                ))}
                                {state.factPackage.timeline.length > 2 && (
                                  <button onClick={() => setActiveTab('chronology')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">
                                    View full chronology
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </section>

                        {state.factPackage.workflowStatus === WorkflowStatus.MATCHING && (
                          <div className="p-6 bg-zinc-900 rounded-3xl text-white">
                            <h3 className="text-lg font-bold mb-2">Ready for Lawyer Matching</h3>
                            <p className="text-zinc-400 text-xs mb-6">
                              Your case is fully prepared for a Singapore legal consult.
                            </p>
                            <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 text-sm">
                              Match Me Now
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'assessment' && (
                    <div className="py-8 max-w-4xl mx-auto space-y-10">
                      {!state.factPackage.legalAssessment ? (
                        <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                          <HelpCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-zinc-900 mb-2">Assessment Pending</h3>
                          <p className="text-zinc-500 text-sm max-w-md mx-auto">
                            Please provide more details in the "Next Steps" tab. Once I have enough information, I will generate a preliminary legal assessment for you.
                          </p>
                          <button 
                            onClick={() => setActiveTab('next-steps')}
                            className="mt-6 px-6 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
                          >
                            Go to Next Steps
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Assessment Header */}
                          <div className="p-8 bg-emerald-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                              <Gavel className="w-48 h-48" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="px-2 py-0.5 bg-emerald-500 rounded text-[10px] font-black uppercase tracking-widest">Confidential</div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Preliminary Legal Assessment</h3>
                              </div>
                              <h2 className="text-3xl font-bold mb-4 leading-tight">Your Case Analysis under Singapore Law</h2>
                              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-2xl">
                                Based on the facts provided, here is a preliminary assessment of your legal position. This is intended to prepare you for a professional consultation.
                              </p>
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm">
                              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Key Strengths
                              </h4>
                              <ul className="space-y-3">
                                {state.factPackage.legalAssessment.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <p className="text-sm text-zinc-700 leading-relaxed">{s}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm">
                              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Potential Risks
                              </h4>
                              <ul className="space-y-3">
                                {state.factPackage.legalAssessment.weaknesses.map((w, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                    <p className="text-sm text-zinc-700 leading-relaxed">{w}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Timeline & Remedies */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl">
                              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Estimated Timeline
                              </h4>
                              <p className="text-sm text-zinc-900 font-bold mb-2">{state.factPackage.legalAssessment.estimatedTimeline}</p>
                              <p className="text-xs text-zinc-500 leading-relaxed">
                                This estimate is based on typical processing times in Singapore courts and tribunals for {state.factPackage.category} cases.
                              </p>
                            </div>
                            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl">
                              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Scale className="w-4 h-4" />
                                Potential Remedies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {state.factPackage.legalAssessment.potentialRemedies.map((r, i) => (
                                  <span key={i} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Consultation Guide */}
                          <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              Lawyer Consultation Guide
                            </h4>
                            <p className="text-lg font-medium mb-8 leading-relaxed text-zinc-200">
                              "{state.factPackage.legalAssessment.lawyerConsultationGuide}"
                            </p>
                            
                            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div>
                                <h5 className="text-sm font-bold mb-1">Ready to take the next step?</h5>
                                <p className="text-xs text-zinc-400">Consult with a verified Singapore lawyer to finalize your strategy.</p>
                              </div>
                              <button className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group">
                                <Briefcase className="w-5 h-5" />
                                Consult with a Lawyer
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'readiness' && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-zinc-900">Consultation-Ready Packet</h3>
                          <p className="text-zinc-500 text-sm">This summary will be delivered to your matched lawyer.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all">
                          <ExternalLink className="w-4 h-4" />
                          Export PDF
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            Case Summary
                          </h4>
                          <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm text-zinc-700 leading-relaxed">
                            {state.factPackage.summary}
                          </div>
                        </section>

                        <section className="space-y-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            Key Questions for Lawyer
                          </h4>
                          <div className="space-y-3">
                            {state.factPackage.keyQuestionsForLawyer.map((q, i) => (
                              <div key={i} className="p-4 bg-white border border-zinc-100 rounded-xl text-sm text-zinc-800 font-medium flex gap-3">
                                <span className="text-emerald-600 font-bold">Q{i+1}.</span>
                                {q}
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <section className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Case Chronology
                        </h4>
                        <div className="space-y-4 relative pl-4 border-l border-zinc-100 ml-2">
                          {state.factPackage.timeline.map((event, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[20.5px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-600" />
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase">{event.date}</span>
                              </div>
                              <p className="text-sm font-bold text-zinc-900 mb-1">{event.description}</p>
                              <p className="text-xs text-zinc-500 leading-relaxed">{event.significance}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Key Extracted Facts
                        </h4>
                        <div className="space-y-3">
                          {state.factPackage.facts.map((fact, i) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={i} 
                              className="p-5 border border-zinc-100 rounded-2xl bg-white flex items-start gap-4 hover:border-emerald-100 transition-all"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                fact.status === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {fact.status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    fact.status === 'verified' ? "text-emerald-600" : "text-amber-600"
                                  )}>
                                    {fact.status}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest">Source: {fact.source}</span>
                                    {fact.timestamp && (
                                      <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest border-l border-zinc-200 pl-3">Time: {fact.timestamp}</span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-800 font-medium leading-relaxed">{fact.statement}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'chronology' && (
                    <div className="py-8 max-w-3xl mx-auto">
                      <div className="relative">
                        {/* The Vertical Line */}
                        <div className="absolute left-[47px] top-0 bottom-0 w-0.5 bg-zinc-100" />
                        
                        <div className="space-y-16">
                          {state.factPackage.timeline.map((event, i) => (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={i}
                              className="relative flex gap-12 group"
                            >
                              {/* Timestamp Column */}
                              <div className="w-24 shrink-0 pt-1 text-right">
                                <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-tighter block leading-none mb-1">
                                  {event.date.split(' ').length > 1 ? event.date.split(' ')[0] : 'DATE'}
                                </span>
                                <span className="text-sm font-black text-zinc-900 font-mono leading-none">
                                  {event.date.split(' ').length > 1 ? event.date.split(' ').slice(1).join(' ') : event.date}
                                </span>
                              </div>

                              {/* Node on the line */}
                              <div className="absolute left-[47px] top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-emerald-600 z-10 group-hover:scale-125 transition-transform shadow-sm" />

                              {/* Content Column */}
                              <div className="flex-1 pb-4">
                                <div className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
                                  <h4 className="text-lg font-bold text-zinc-900 mb-3 leading-tight">
                                    {event.description}
                                  </h4>
                                  
                                  <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100/50">
                                    <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                                      <Scale className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <p className="text-xs text-zinc-600 leading-relaxed">
                                      <span className="font-bold text-zinc-900 uppercase text-[9px] tracking-wider mr-2">Legal Significance:</span>
                                      {event.significance}
                                    </p>
                                  </div>

                                  {/* Associated Facts (if any match the date or context) */}
                                  {state.factPackage.facts.filter(f => f.statement.toLowerCase().includes(event.date.toLowerCase())).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2">
                                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Corroborating Facts</span>
                                      {state.factPackage.facts.filter(f => f.statement.toLowerCase().includes(event.date.toLowerCase())).map((f, fi) => (
                                        <div key={fi} className="flex items-center gap-2 text-[11px] text-zinc-500">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                          {f.statement}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {state.factPackage.timeline.length === 0 && (
                        <div className="text-center py-20">
                          <Clock className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                          <p className="text-zinc-400 text-sm">No timeline events extracted yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12">
                <div className="max-w-md text-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-inner">
                    <Scale className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">Singapore Legal Triage</h2>
                  <p className="text-zinc-500 leading-relaxed mb-10">
                    Get consultation-ready in minutes. Our AI analyzes your case under Singapore law, assesses urgency, and prepares a professional packet for your lawyer.
                  </p>
                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="flex items-start gap-4 p-4 bg-white border border-zinc-100 rounded-2xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">1. Smart Triage</h4>
                        <p className="text-xs text-zinc-500">Classification and urgency assessment under SG jurisdiction.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white border border-zinc-100 rounded-2xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">2. Consultation Readiness</h4>
                        <p className="text-xs text-zinc-500">Auto-generated case summary, timeline, and lawyer questions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="h-10 border-t border-zinc-100 bg-white px-6 flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SG_JURISDICTION_ENGINE_ACTIVE
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            SINGAPORE_REGION
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-zinc-600 cursor-pointer transition-colors">PRIVACY_POLICY</span>
          <span className="hover:text-zinc-600 cursor-pointer transition-colors">TERMS_OF_SERVICE</span>
          <span>© 2026 SG LEGAL TRIAGE AI</span>
        </div>
      </footer>
    </div>
  );
}
