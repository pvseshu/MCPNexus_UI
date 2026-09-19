import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Save,
  ArrowRight,
  Server,
  Wrench,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';
import { McpTool, SampleExample } from '../types';
import { executeMcpTool } from '../api/mcpTools';
import { isDemoMode } from '../utils/demoMode';

interface ToolTesterModalProps {
  tool: McpTool | null;
  onClose: () => void;
  onSaveAsSampleInput?: (toolId: string, sample: SampleExample) => void;
  onSaveAsSampleOutput?: (toolId: string, sample: SampleExample) => void;
}

export const ToolTesterModal: React.FC<ToolTesterModalProps> = ({
  tool,
  onClose,
  onSaveAsSampleInput,
  onSaveAsSampleOutput,
}) => {
  if (!tool) return null;

  const sampleInputs = tool.sampleInputs || [];
  const sampleOutputs = tool.sampleOutputs || [];

  const [selectedSampleId, setSelectedSampleId] = useState<string>(
    sampleInputs[0]?.id || 'custom'
  );
  const [inputJson, setInputJson] = useState<string>(
    JSON.stringify(sampleInputs[0]?.payload || (isDemoMode() ? { customerId: 'C12345' } : {}), null, 2)
  );

  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [executionTime, setExecutionTime] = useState<string>('142ms');
  const [responseStatus, setResponseStatus] = useState<number | null>(200);
  const [executionSuccess, setExecutionSuccess] = useState(true);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [responseJson, setResponseJson] = useState<string>(
    JSON.stringify(sampleOutputs[0]?.payload || {}, null, 2)
  );

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const found = sampleInputs.find((s) => s.id === sampleId);
    if (found) {
      setInputJson(JSON.stringify(found.payload, null, 2));
    }
  };

  const runLiveTest = async () => {
    let input: Record<string, unknown>;
    try {
      const parsed = JSON.parse(inputJson);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      input = parsed;
    } catch {
      setHasExecuted(true);
      setExecutionSuccess(false);
      setResponseStatus(null);
      setExecutionError('Input must be a valid JSON object.');
      setResponseJson(JSON.stringify({ error: 'INVALID_JSON_INPUT', message: 'Could not parse input' }, null, 2));
      return;
    }

    setIsRunning(true);
    setHasExecuted(false);
    setSaveSuccessMsg(null);
    try {
      const result = await executeMcpTool(tool.id, input);
      setExecutionSuccess(result.success);
      setResponseStatus(result.httpStatus);
      setExecutionTime(`${result.durationMs}ms`);
      setExecutionError(result.error);
      setResponseJson(
        typeof result.response === 'string' ? result.response : JSON.stringify(result.response ?? {}, null, 2)
      );
    } catch (err) {
      setExecutionSuccess(false);
      setResponseStatus(null);
      setExecutionTime('—');
      const message = err instanceof Error ? err.message : 'Could not run the tool test.';
      setExecutionError(message);
      setResponseJson(JSON.stringify({ error: message }, null, 2));
    } finally {
      setIsRunning(false);
      setHasExecuted(true);
    }
  };

  const handleRunTest = () => {
    setExecutionSuccess(true);
    setExecutionError(null);

    if (!isDemoMode()) {
      void runLiveTest();
      return;
    }

    setIsRunning(true);
    setHasExecuted(false);
    setSaveSuccessMsg(null);

    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
      setExecutionTime(`${Math.floor(Math.random() * 80) + 110}ms`);
      setResponseStatus(200);

      // Pick corresponding or appropriate output based on input
      try {
        const parsed = JSON.parse(inputJson);
        if (tool.name === 'getCustomerTransactions') {
          setResponseJson(
            JSON.stringify(
              {
                customerId: parsed.customerId || 'C12345',
                totalCount: 3,
                currency: 'USD',
                transactions: [
                  { transactionId: 'TX1001', date: '2026-08-14', merchant: 'Whole Foods Market', amount: 125.50, status: 'COMPLETED' },
                  { transactionId: 'TX1002', date: '2026-08-12', merchant: 'Chevron Gas Station', amount: 82.30, status: 'COMPLETED' },
                  { transactionId: 'TX1003', date: '2026-08-10', merchant: 'Delta Airlines Flights', amount: 240.00, status: 'COMPLETED' },
                ],
              },
              null,
              2
            )
          );
        } else if (tool.name === 'getCustomer') {
          setResponseJson(
            JSON.stringify(
              {
                customerId: parsed.customerId || 'C12345',
                fullName: 'John Smith',
                email: 'john.smith@example.com',
                tier: 'Standard',
                status: 'Active',
              },
              null,
              2
            )
          );
        } else {
          setResponseJson(JSON.stringify(sampleOutputs[0]?.payload || { status: 'success' }, null, 2));
        }
      } catch (e) {
        setResponseJson(JSON.stringify({ error: 'INVALID_JSON_INPUT', message: 'Could not parse input' }, null, 2));
      }
    }, 600);
  };

  const handleSaveInputAsSample = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const newSample: SampleExample = {
        id: `sample-in-${Date.now()}`,
        name: `Tester Input (${new Date().toLocaleTimeString()})`,
        description: 'Saved directly from interactive tool test execution',
        payload: parsed,
        type: 'success',
      };
      if (onSaveAsSampleInput) onSaveAsSampleInput(tool.id, newSample);
      setSaveSuccessMsg('✓ Saved input as sample configuration!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      alert('Invalid JSON input');
    }
  };

  const handleSaveOutputAsSample = () => {
    try {
      const parsed = JSON.parse(responseJson);
      const newSample: SampleExample = {
        id: `sample-out-${Date.now()}`,
        name: `Tester Output (${new Date().toLocaleTimeString()})`,
        description: 'Saved directly from live tool execution test',
        payload: parsed,
        type: 'success',
      };
      if (onSaveAsSampleOutput) onSaveAsSampleOutput(tool.id, newSample);
      setSaveSuccessMsg('✓ Saved output as sample response!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      alert('Invalid JSON output');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      id="tool-tester-modal"
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs font-bold">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Interactive MCP Tool Execution Sandbox</h2>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tool.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: {tool.serverName} ➔ {tool.sourceEndpoint}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Execution Flow Pipeline Bar */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-indigo-400 font-bold">AI Agent / Sandbox</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-purple-300 font-bold">{tool.serverName}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-300 font-bold">{tool.name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-blue-300 font-bold">{tool.sourceEndpoint}</span>
          </div>

          <div className="flex items-center gap-3">
            {hasExecuted && (
              <span
                className={`font-semibold flex items-center gap-1 ${executionSuccess ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {executionSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>
                  {executionSuccess
                    ? `Status ${responseStatus ?? 200} OK`
                    : responseStatus !== null
                    ? `Failed • Status ${responseStatus}`
                    : 'Failed'}{' '}
                  • {executionTime}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Success toast if saved */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-6 py-2 text-xs font-semibold animate-fadeIn">
            {saveSuccessMsg}
          </div>
        )}

        {hasExecuted && !executionSuccess && executionError && (
          <div className="bg-red-50 text-red-800 border-b border-red-200 px-6 py-2 text-xs font-semibold animate-fadeIn">
            {executionError}
          </div>
        )}

        {!isDemoMode() && tool.httpMethod !== 'GET' && (
          <div className="bg-amber-50 text-amber-800 border-b border-amber-200 px-6 py-2 text-xs font-semibold">
            This runs a real {tool.httpMethod} call against the application&apos;s API and may change data.
          </div>
        )}

        {/* 2-Column Body: Input & Output */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Input Payload */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>Tool Request Input (JSON)</span>
              </label>

              {/* Sample Selector */}
              {tool.sampleInputs.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">Load:</span>
                  <select
                    value={selectedSampleId}
                    onChange={(e) => handleSelectSample(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-medium"
                  >
                    {tool.sampleInputs.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <textarea
              rows={12}
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="w-full flex-1 p-3.5 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed border border-slate-800 resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSaveInputAsSample}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Sample Input</span>
              </button>

              <button
                onClick={handleRunTest}
                disabled={isRunning}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Executing Tool...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Response Output */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Tool Execution Output (JSON)</span>
              </label>

              {hasExecuted && (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    executionSuccess
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {executionSuccess ? `HTTP ${responseStatus ?? 200} • JSON Valid` : `Failed${responseStatus !== null ? ` • HTTP ${responseStatus}` : ''}`}
                </span>
              )}
            </div>

            <textarea
              rows={12}
              readOnly
              value={responseJson}
              className="w-full flex-1 p-3.5 font-mono text-xs bg-slate-900 text-indigo-300 rounded-xl leading-relaxed border border-slate-800 resize-none focus:outline-hidden"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSaveOutputAsSample}
                disabled={!hasExecuted}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Sample Output</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(responseJson);
                  setSaveSuccessMsg('✓ Copied response JSON to clipboard!');
                  setTimeout(() => setSaveSuccessMsg(null), 2500);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Authorization: <span className="font-mono font-semibold text-slate-700">{tool.requiredPermission}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
