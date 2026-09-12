import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ApiAuthConfig, ApiAuthType } from '../types';

interface ApiAuthConfigEditorProps {
  value: ApiAuthConfig;
  onChange: (next: ApiAuthConfig) => void;
}

const AUTH_OPTIONS: { type: ApiAuthType; label: string; hint: string }[] = [
  { type: 'authblue', label: 'AuthBlue', hint: 'app2app token via Basic Auth service ID/password' },
  { type: 'idaas', label: 'IDaaS (One Identity)', hint: 'HMAC-signed app token exchange' },
  { type: 'oauth', label: 'Generic OAuth / Bearer', hint: 'Custom token endpoint with client id/secret' },
];

const fieldClass =
  'w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500';
const labelClass = 'block font-semibold text-slate-700 mb-1 text-[11px]';

export const ApiAuthConfigEditor: React.FC<ApiAuthConfigEditorProps> = ({ value, onChange }) => {
  const setType = (type: ApiAuthType) => onChange({ ...value, type });

  return (
    <div className="space-y-4">
      {/* Radio group - only one auth mechanism can be active */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {AUTH_OPTIONS.map((opt) => (
          <label
            key={opt.type}
            className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              value.type === opt.type
                ? 'border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="api-auth-type"
              checked={value.type === opt.type}
              onChange={() => setType(opt.type)}
              className="mt-0.5 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
            />
            <span>
              <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>

      {/* AuthBlue fields */}
      {value.type === 'authblue' && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Token URL</label>
            <input
              type="text"
              value={value.authBlue.tokenUrl}
              onChange={(e) => onChange({ ...value, authBlue: { ...value.authBlue, tokenUrl: e.target.value } })}
              className={`${fieldClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Service ID (Basic Auth username)</label>
            <input
              type="text"
              value={value.authBlue.serviceId}
              onChange={(e) => onChange({ ...value, authBlue: { ...value.authBlue, serviceId: e.target.value } })}
              className={fieldClass}
              placeholder="svc.my-app"
            />
          </div>
          <div>
            <label className={labelClass}>Service Password</label>
            <input
              type="password"
              value={value.authBlue.servicePassword}
              onChange={(e) => onChange({ ...value, authBlue: { ...value.authBlue, servicePassword: e.target.value } })}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Scope Groups (comma-separated)</label>
            <input
              type="text"
              value={value.authBlue.scopeGroups.join(', ')}
              onChange={(e) =>
                onChange({
                  ...value,
                  authBlue: { ...value.authBlue, scopeGroups: e.target.value.split(',').map((s) => s.trim()) },
                })
              }
              className={`${fieldClass} font-mono`}
              placeholder="GROUP_NAME_1, GROUP_NAME_2"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Sent as body.scope.groups[] when requesting the token from the AuthBlue endpoint.
            </p>
          </div>
        </div>
      )}

      {/* IDaaS fields */}
      {value.type === 'idaas' && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Token URL</label>
            <input
              type="text"
              value={value.idaas.tokenUrl}
              onChange={(e) => onChange({ ...value, idaas: { ...value.idaas, tokenUrl: e.target.value } })}
              className={`${fieldClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>App ID</label>
            <input
              type="text"
              value={value.idaas.appId}
              onChange={(e) => onChange({ ...value, idaas: { ...value.idaas, appId: e.target.value } })}
              className={`${fieldClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Version</label>
            <input
              type="text"
              value={value.idaas.version}
              onChange={(e) => onChange({ ...value, idaas: { ...value.idaas, version: e.target.value } })}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Auth Secret (base64)</label>
            <input
              type="password"
              value={value.idaas.secret}
              onChange={(e) => onChange({ ...value, idaas: { ...value.idaas, secret: e.target.value } })}
              className={`${fieldClass} font-mono`}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Used to HMAC-SHA256 sign "{'{'}AppID{'}'}-{'{'}Version{'}'}-{'{'}timestamp_ms{'}'}" into X-Auth-Signature.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Scope (comma-separated, e.g. /path/::post)</label>
            <input
              type="text"
              value={value.idaas.scope.join(', ')}
              onChange={(e) =>
                onChange({ ...value, idaas: { ...value.idaas, scope: e.target.value.split(',').map((s) => s.trim()) } })
              }
              className={`${fieldClass} font-mono`}
              placeholder="/idp/v1/translation/::post"
            />
          </div>
        </div>
      )}

      {/* Generic OAuth fields */}
      {value.type === 'oauth' && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Token URL</label>
            <input
              type="text"
              value={value.oauth.tokenUrl}
              onChange={(e) => onChange({ ...value, oauth: { ...value.oauth, tokenUrl: e.target.value } })}
              className={`${fieldClass} font-mono`}
              placeholder="https://your-idp.example.com/oauth2/token"
            />
          </div>
          <div>
            <label className={labelClass}>Client ID / Username</label>
            <input
              type="text"
              value={value.oauth.clientId}
              onChange={(e) => onChange({ ...value, oauth: { ...value.oauth, clientId: e.target.value } })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Client Secret / Password</label>
            <input
              type="password"
              value={value.oauth.clientSecret}
              onChange={(e) => onChange({ ...value, oauth: { ...value.oauth, clientSecret: e.target.value } })}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>How are credentials sent to the token URL?</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <label
                className={`flex-1 flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  value.oauth.credentialStyle === 'basic_auth'
                    ? 'border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="oauth-credential-style"
                  checked={value.oauth.credentialStyle === 'basic_auth'}
                  onChange={() => onChange({ ...value, oauth: { ...value.oauth, credentialStyle: 'basic_auth' } })}
                  className="mt-0.5 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-bold text-slate-900">HTTP Basic Auth header</span>
                  <span className="block text-[11px] text-slate-500">clientId/clientSecret sent as the Authorization: Basic header</span>
                </span>
              </label>
              <label
                className={`flex-1 flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  value.oauth.credentialStyle === 'json_body'
                    ? 'border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="oauth-credential-style"
                  checked={value.oauth.credentialStyle === 'json_body'}
                  onChange={() => onChange({ ...value, oauth: { ...value.oauth, credentialStyle: 'json_body' } })}
                  className="mt-0.5 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                />
                <span>
                  <span className="block text-xs font-bold text-slate-900">JSON POST body</span>
                  <span className="block text-[11px] text-slate-500">Send a custom JSON payload — for teams whose token endpoint expects it in the body</span>
                </span>
              </label>
            </div>
          </div>

          {value.oauth.credentialStyle === 'json_body' && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Token Request Body (JSON)</label>
              <textarea
                rows={6}
                value={value.oauth.requestBodyTemplate}
                onChange={(e) => onChange({ ...value, oauth: { ...value.oauth, requestBodyTemplate: e.target.value } })}
                className={`${fieldClass} font-mono leading-relaxed`}
                spellCheck={false}
              />
              {(() => {
                try {
                  JSON.parse(
                    value.oauth.requestBodyTemplate.replace(/\{\{clientId\}\}/g, '""').replace(/\{\{clientSecret\}\}/g, '""')
                  );
                  return <p className="text-[10px] text-emerald-600 mt-1">Valid JSON.</p>;
                } catch {
                  return <p className="text-[10px] text-red-600 mt-1">This is not valid JSON — check for missing quotes/commas.</p>;
                }
              })()}
              <p className="text-[10px] text-slate-500 mt-1">
                Write the exact JSON body your token endpoint expects. Use the placeholders <span className="font-mono">{'{{clientId}}'}</span> and{' '}
                <span className="font-mono">{'{{clientSecret}}'}</span> — they're substituted with the values above before the request is sent.
              </p>
            </div>
          )}

          <p className="sm:col-span-2 text-[10px] text-slate-500">
            Use this when the API's own team issues credentials directly and posts them to a token endpoint to get a bearer token back — for anything that isn't AuthBlue or IDaaS.
          </p>
        </div>
      )}
    </div>
  );
};

interface SwaggerUrlListEditorProps {
  urls: string[];
  onChange: (next: string[]) => void;
}

export const SwaggerUrlListEditor: React.FC<SwaggerUrlListEditorProps> = ({ urls, onChange }) => {
  const updateAt = (idx: number, value: string) => onChange(urls.map((u, i) => (i === idx ? value : u)));
  const removeAt = (idx: number) => onChange(urls.filter((_, i) => i !== idx));
  const addRow = () => onChange([...urls, '']);

  return (
    <div className="space-y-2">
      {urls.map((url, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => updateAt(idx, e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            placeholder="https://api.internal.aexp.com/v2/openapi.json"
          />
          <button
            type="button"
            onClick={() => removeAt(idx)}
            disabled={urls.length <= 1}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Remove URL"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-1 py-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add another Swagger / OpenAPI URL</span>
      </button>
      <p className="text-[11px] text-slate-500">
        Add every spec that makes up this application (e.g. split by service or version). Discovered APIs from all URLs are merged and de-duplicated into one tool list.
      </p>
    </div>
  );
};
