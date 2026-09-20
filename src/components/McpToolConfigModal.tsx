import React, { useState } from 'react';
import {
  X,
  Wrench,
  Server,
  AppWindow,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Code2,
  Play,
  HelpCircle,
  Shield,
  Layers,
  FileJson,
  Edit3,
} from 'lucide-react';
import { McpTool, SampleExample } from '../types';

interface McpToolConfigModalProps {
  tool: McpTool | null;
  onClose: () => void;
  // May reject; the popup then stays open and shows the message.
  onSaveTool: (updatedTool: McpTool) => void | Promise<void>;
  onLaunchTester: (tool: McpTool) => void;
}

export const McpToolConfigModal: React.FC<McpToolConfigModalProps> = ({
  tool,
  onClose,
  onSaveTool,
  onLaunchTester,
}) => {
  if (!tool) return null;

  const [activeTab, setActiveTab] = useState<'details' | 'inputs' | 'sample-inputs' | 'sample-outputs' | 'guidance'>('sample-inputs');

  const [description, setDescription] = useState(tool.description);
  const [whenToUse, setWhenToUse] = useState(tool.whenToUse);
  const [whenNotToUse, setWhenNotToUse] = useState(tool.whenNotToUse);
  const [callSequence, setCallSequence] = useState(tool.callSequence || '');
  const [sampleInputs, setSampleInputs] = useState<SampleExample[]>(tool.sampleInputs);
  const [sampleOutputs, setSampleOutputs] = useState<SampleExample[]>(tool.sampleOutputs);
  const [requiredPermission, setRequiredPermission] = useState(tool.requiredPermission);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New sample input draft state
  const [showAddInputModal, setShowAddInputModal] = useState(false);
  const [newInputName, setNewInputName] = useState('Sample Input ' + (sampleInputs.length + 1));
  const [newInputDesc, setNewInputDesc] = useState('');
  const [newInputJson, setNewInputJson] = useState('{\n  "customerId": "C12345",\n  "startDate": "2026-08-01",\n  "endDate": "2026-08-14"\n}');

  // New sample output draft state
  const [showAddOutputModal, setShowAddOutputModal] = useState(false);
  const [newOutputName, setNewOutputName] = useState('Sample Output ' + (sampleOutputs.length + 1));
  const [newOutputDesc, setNewOutputDesc] = useState('');
  const [newOutputType, setNewOutputType] = useState<'success' | 'empty' | 'validation_error' | 'auth_error'>('success');
  const [newOutputJson, setNewOutputJson] = useState('{\n  "customerId": "C12345",\n  "transactions": [\n    {\n      "transactionId": "TX1001",\n      "amount": 125.50,\n      "status": "COMPLETED"\n    }\n  ]\n}');

  const handleAddSampleInput = () => {
    try {
      const parsed = JSON.parse(newInputJson);
      const newSample: SampleExample = {
        id: `sample-in-${Date.now()}`,
        name: newInputName,
        description: newInputDesc || 'Administrator defined sample query',
        payload: parsed,
        type: 'success',
      };
      setSampleInputs([...sampleInputs, newSample]);
      setShowAddInputModal(false);
      setNewInputDesc('');
    } catch (e) {
      alert('Invalid JSON in Sample Input');
    }
  };

  const handleDeleteSampleInput = (id: string) => {
    setSampleInputs(sampleInputs.filter((s) => s.id !== id));
  };

  const handleAddSampleOutput = () => {
    try {
      const parsed = JSON.parse(newOutputJson);
      const newSample: SampleExample = {
        id: `sample-out-${Date.now()}`,
        name: newOutputName,
        description: newOutputDesc || 'Administrator defined sample output response',
        payload: parsed,
        type: newOutputType,
      };
      setSampleOutputs([...sampleOutputs, newSample]);
      setShowAddOutputModal(false);
      setNewOutputDesc('');
    } catch (e) {
      alert('Invalid JSON in Sample Output');
    }
  };

  const handleDeleteSampleOutput = (id: string) => {
    setSampleOutputs(sampleOutputs.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    const updated: McpTool = {
      ...tool,
      description,
      whenToUse,
      whenNotToUse,
      callSequence,
      sampleInputs,
      sampleOutputs,
      requiredPermission,
      aiReadinessScore: Math.min(100, 75 + sampleInputs.length * 5 + sampleOutputs.length * 3),
    };
    try {
      // The parent closes the popup once the save has gone through.
      await onSaveTool(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Saving the tool configuration failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      id="mcp-tool-config-modal"
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-100 flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 font-mono">{tool.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                  Status: {tool.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI Ready: Yes</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                <span>Server: <strong className="text-indigo-600 font-sans">{tool.serverName}</strong></span>
                <span>•</span>
                <span>Original API: <strong className="text-blue-700">{tool.sourceEndpoint}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchTester(tool)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Test Tool Live</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Readiness Score Bar */}
        <div className="px-6 py-2.5 bg-indigo-900 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="font-semibold">AI Tool Knowledge & Execution Context:</span>
            <span className="text-slate-300">
              {sampleInputs.length} Sample Inputs • {sampleOutputs.length} Sample Outputs • Permission Guarded
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300">AI Readiness:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-bold text-[11px]">
              {tool.aiReadinessScore}%
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('sample-inputs')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sample-inputs'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Multiple Sample Inputs ({sampleInputs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sample-outputs')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sample-outputs'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Multiple Sample Outputs ({sampleOutputs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guidance')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'guidance'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Usage Guidance</span>
          </button>

          <button
            onClick={() => setActiveTab('inputs')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'inputs'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Input Schema ({tool.inputs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Description & Security</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB: MULTIPLE SAMPLE INPUTS */}
          {activeTab === 'sample-inputs' && (
            <div className="space-y-4" id="sample-inputs-tab">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrator-Defined Sample Inputs</h3>
                  <p className="text-xs text-slate-500">
                    Provide multiple sample payloads to help AI understand parameter combinations and edge queries.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddInputModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Sample Input</span>
                </button>
              </div>

              {/* Sample Inputs List */}
              <div className="space-y-4">
                {sampleInputs.map((sample, idx) => (
                  <div key={sample.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{sample.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSampleInput(sample.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete sample"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 italic">{sample.description}</p>

                    {/* Formatted JSON Viewer */}
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(sample.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MULTIPLE SAMPLE OUTPUTS */}
          {activeTab === 'sample-outputs' && (
            <div className="space-y-4" id="sample-outputs-tab">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrator-Defined Sample Outputs</h3>
                  <p className="text-xs text-slate-500">
                    Include examples for successful responses, empty results, validation errors, and authorization errors.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddOutputModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Sample Output</span>
                </button>
              </div>

              {/* Sample Outputs List */}
              <div className="space-y-4">
                {sampleOutputs.map((sample, idx) => (
                  <div key={sample.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{sample.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            sample.type === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sample.type === 'auth_error'
                              ? 'bg-amber-100 text-amber-800'
                              : sample.type === 'empty'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {sample.type || 'Response'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSampleOutput(sample.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete sample"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 italic">{sample.description}</p>

                    {/* Formatted JSON Viewer */}
                    <pre className="p-3 bg-slate-900 text-indigo-300 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(sample.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AI USAGE GUIDANCE */}
          {activeTab === 'guidance' && (
            <div className="space-y-6" id="ai-guidance-tab">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-indigo-950">
                  <span className="font-bold">AI Execution Guardrails: </span>
                  Explicitly instructing the AI model on when to select or not select this tool prevents hallucinations, incorrect parameter routing, and accidental invocations.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  When should AI use this tool? *
                </label>
                <textarea
                  rows={3}
                  value={whenToUse}
                  onChange={(e) => setWhenToUse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Use this tool when the user asks for recent or historical transactions for an identified customer."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  When should AI NOT use this tool? *
                </label>
                <textarea
                  rows={3}
                  value={whenNotToUse}
                  onChange={(e) => setWhenNotToUse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Do not use this tool for customer profile information or access-management questions."
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Call Sequence & Data Flow (Prerequisites)
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  If this tool depends on another tool's output, spell out the exact order and which response field feeds which input parameter here — this is the field the AI leans on most heavily for multi-step tool chains.
                </p>
                <textarea
                  rows={4}
                  value={callSequence}
                  onChange={(e) => setCallSequence(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono focus:ring-2 focus:ring-indigo-500"
                  placeholder={'e.g. Call getUserDetails first. Take userId and accountId from its response and pass them as the userId and accountId inputs here. Never call this tool with a raw name or phone number.'}
                />
              </div>
            </div>
          )}

          {/* TAB: INPUT SCHEMA */}
          {activeTab === 'inputs' && (
            <div className="space-y-4" id="inputs-schema-tab">
              <h3 className="text-sm font-bold text-slate-900">Configured Tool Input Parameters</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-4">Parameter Name</th>
                      <th className="py-3 px-4">Data Type</th>
                      <th className="py-3 px-4">Requirement</th>
                      <th className="py-3 px-4">Example Value</th>
                      <th className="py-3 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {tool.inputs.map((param) => (
                      <tr key={param.name} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{param.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{param.type}</td>
                        <td className="py-3 px-4">
                          {param.required ? (
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold text-[10px]">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{param.exampleValue || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DETAILS & SECURITY */}
          {activeTab === 'details' && (
            <div className="space-y-4" id="details-security-tab">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">MCP Tool Description *</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Required Enterprise Entitlement Group / Permission
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={requiredPermission}
                    onChange={(e) => setRequiredPermission(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-semibold text-slate-800"
                    placeholder="e.g. GROUP_TRANSACTION_VIEW"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Access check enforced by IAM MCP prior to execution.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tool ID: <span className="font-mono font-semibold text-slate-700">{tool.id}</span>
          </div>

          <div className="flex items-center gap-3">
            {saveError && (
              <span className="text-xs text-red-600 max-w-sm truncate" title={saveError}>
                {saveError}
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Add Sample Input */}
      {showAddInputModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-slate-900">+ Add New Sample Input</h4>
              <button onClick={() => setShowAddInputModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sample Title</label>
                <input
                  type="text"
                  value={newInputName}
                  onChange={(e) => setNewInputName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Intent</label>
                <input
                  type="text"
                  value={newInputDesc}
                  onChange={(e) => setNewInputDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md"
                  placeholder="e.g. Query transactions for first two weeks of August"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">JSON Payload</label>
                <textarea
                  rows={5}
                  value={newInputJson}
                  onChange={(e) => setNewInputJson(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs bg-slate-900 text-emerald-400 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddInputModal(false)}
                className="px-3 py-1.5 border rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSampleInput}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold"
              >
                Add Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Add Sample Output */}
      {showAddOutputModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-slate-900">+ Add New Sample Output</h4>
              <button onClick={() => setShowAddOutputModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sample Title</label>
                <input
                  type="text"
                  value={newOutputName}
                  onChange={(e) => setNewOutputName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Response Type</label>
                <select
                  value={newOutputType}
                  onChange={(e) => setNewOutputType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded-md"
                >
                  <option value="success">Success (200 OK)</option>
                  <option value="empty">Empty Results</option>
                  <option value="auth_error">Authorization Error (403)</option>
                  <option value="validation_error">Validation Error (400)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newOutputDesc}
                  onChange={(e) => setNewOutputDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md"
                  placeholder="e.g. Empty response when no records match filter"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">JSON Payload</label>
                <textarea
                  rows={5}
                  value={newOutputJson}
                  onChange={(e) => setNewOutputJson(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs bg-slate-900 text-indigo-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddOutputModal(false)}
                className="px-3 py-1.5 border rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSampleOutput}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold"
              >
                Add Sample
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
