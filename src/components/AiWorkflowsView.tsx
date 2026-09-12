import React, { useState } from 'react';
import {
  GitFork,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Server,
  Wrench,
  Bot,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AiWorkflow } from '../types';

interface AiWorkflowsViewProps {
  workflows: AiWorkflow[];
  onTriggerWorkflow: (workflowId: string) => void;
  onOpenAiChat: () => void;
}

export const AiWorkflowsView: React.FC<AiWorkflowsViewProps> = ({
  workflows,
  onTriggerWorkflow,
  onOpenAiChat,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const handleRun = (wfId: string) => {
    setRunningId(wfId);
    setCompletedId(null);

    setTimeout(() => {
      setRunningId(null);
      setCompletedId(wfId);
      onTriggerWorkflow(wfId);
    }, 1200);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="ai-workflows-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Workflows</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {workflows.length} Automated Pipelines
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Chained multi-MCP execution pipelines orchestrating complex enterprise tasks.
          </p>
        </div>

        <button
          onClick={onOpenAiChat}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Execute in AI Assistant</span>
        </button>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{wf.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {wf.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{wf.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">Avg Latency</span>
                  <span className="font-mono font-bold text-slate-800">{wf.avgExecutionTime}</span>
                </div>

                <button
                  onClick={() => handleRun(wf.id)}
                  disabled={runningId === wf.id}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{runningId === wf.id ? 'Running Steps...' : 'Run Pipeline'}</span>
                </button>
              </div>
            </div>

            {/* Pipeline Step Visualizer */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Execution Step Graph:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {wf.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1 relative"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>STEP 0{step.order}</span>
                      <span className="text-indigo-600 font-mono">{step.action}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">{step.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{step.targetServer}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Telemetry Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span>Trigger: <strong className="text-slate-700">{wf.triggerType}</strong></span>
                <span>•</span>
                <span>Total Invocations: <strong className="text-slate-700">{wf.invocationsCount}</strong></span>
              </div>

              {completedId === wf.id && (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pipeline completed successfully (100% SLA)</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
