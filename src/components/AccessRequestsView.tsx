import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  Lock,
} from 'lucide-react';
import { AccessRequest } from '../types';

interface AccessRequestsViewProps {
  requests: AccessRequest[];
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
}

export const AccessRequestsView: React.FC<AccessRequestsViewProps> = ({
  requests,
  onApproveRequest,
  onRejectRequest,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = requests.filter((r) => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      r.requestingApp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.targetMcpServer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.targetToolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="access-requests-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MCP Access Requests & Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {requests.filter((r) => r.status === 'Pending').length} Pending Approvals
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Govern application-to-application and user entitlement access to sensitive MCP Tools.
          </p>
        </div>
      </div>

      {/* Governance Explanatory Card */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs text-amber-950">
            <strong className="font-bold">Zero-Trust Inter-Application Governance: </strong>
            Applications and AI Agents cannot invoke MCP tools without explicit entitlement clearance and audited administrator approval.
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request ID, apps, tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" id="access-requests-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Request ID & Timestamp</th>
                <th className="py-3.5 px-4">Requesting App / User</th>
                <th className="py-3.5 px-4">Target MCP & Tool</th>
                <th className="py-3.5 px-4">Justification</th>
                <th className="py-3.5 px-4">Entitlement</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* ID */}
                  <td className="py-4 px-6">
                    <span className="font-mono font-bold text-xs text-slate-900">{req.id}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">{req.timestamp}</div>
                  </td>

                  {/* Requester */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-xs text-slate-800">{req.requestingApp}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{req.requestingUser}</div>
                  </td>

                  {/* Target MCP */}
                  <td className="py-4 px-4">
                    <div className="text-xs font-semibold text-indigo-700">{req.targetMcpServer}</div>
                    <div className="text-[11px] font-mono text-purple-700 font-bold">➔ {req.targetToolName}</div>
                  </td>

                  {/* Reason */}
                  <td className="py-4 px-4 max-w-xs">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{req.reason}</p>
                  </td>

                  {/* Permission */}
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-800">
                      {req.requestedPermission}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onApproveRequest(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Approve access"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onRejectRequest(req.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          title="Reject access"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {req.approvedBy ? `Decided by ${req.approvedBy}` : 'Resolved'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
