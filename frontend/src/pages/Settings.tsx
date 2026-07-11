import React, { useState } from 'react';
import { useSettingsStore } from '../store/SettingsStore';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Key, User, Landmark, ShieldCheck, Plus, Trash2, Copy, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    profile,
    organization,
    apiKeys,
    retryPolicies,
    updateProfile,
    updateOrg,
    addApiKey,
    deleteApiKey,
    updateRetryPolicy
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'keys' | 'worker'>('profile');
  const { toast } = useToast();

  // Profile Form
  const [profName, setProfName] = useState(profile.name);
  const [profEmail, setProfEmail] = useState(profile.email);

  // Org Form
  const [orgName, setOrgName] = useState(organization.name);

  // API Key Form
  const [keyName, setKeyName] = useState('');

  // Policy Form
  const [polAttempts, setPolAttempts] = useState(retryPolicies.defaultAttempts);
  const [polBackoff, setPolBackoff] = useState(retryPolicies.backoffFactor);
  const [polMaxDelay, setPolMaxDelay] = useState(retryPolicies.maxDelayMs);

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profName, profEmail);
    toast('Profile updated successfully.', 'success');
  };

  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg(orgName);
    toast('Organization updated successfully.', 'success');
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast('Key name is required.', 'error');
      return;
    }
    addApiKey(keyName);
    toast(`API key "${keyName}" generated.`, 'success');
    setKeyName('');
  };

  const handleDeleteKey = (id: string, name: string) => {
    deleteApiKey(id);
    toast(`API Key "${name}" revoked.`, 'success');
  };

  const handleCopyKey = (id: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyId(id);
    toast('API key copied to clipboard.', 'success');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handlePolicySave = (e: React.FormEvent) => {
    e.preventDefault();
    updateRetryPolicy({
      defaultAttempts: polAttempts,
      backoffFactor: polBackoff,
      maxDelayMs: polMaxDelay
    });
    toast('Retry policies updated.', 'success');
  };

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: <User className="w-4 h-4" /> },
    { id: 'org', label: 'Organization', icon: <Landmark className="w-4 h-4" /> },
    { id: 'keys', label: 'API Credentials', icon: <Key className="w-4 h-4" /> },
    { id: 'worker', label: 'Retry Policies', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Console Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust project profiles, security keys, scaling limits, and failure thresholds.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left tabs menu */}
        <div className="lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 border-b lg:border-b-0 border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right tab panel */}
        <div className="flex-grow bg-card border border-border rounded-xl p-8 shadow-sm max-w-2xl">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">User Profile Settings</h3>
                <p className="text-xs text-muted-foreground mt-1">Manage your developer credentials and email alerts.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          )}

          {activeTab === 'org' && (
            <form onSubmit={handleOrgSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Organization Profile</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure company-wide workspace parameters.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workspace Tier</label>
                  <input
                    type="text"
                    disabled
                    value={`${organization.plan} Plan`}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-secondary text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">API Credentials</h3>
                <p className="text-xs text-muted-foreground mt-1">Generate key tags for programmatic workers to connect to DJS control plane.</p>
              </div>

              {/* List Keys */}
              <div className="divide-y divide-border border border-border rounded-xl bg-muted/10 overflow-hidden">
                {apiKeys.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">No active API keys created.</p>
                ) : (
                  apiKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between p-4 bg-card">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground">{k.name}</span>
                        <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{k.key}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(k.id, k.key)}
                          className="!p-1.5 h-auto text-muted-foreground hover:text-foreground"
                        >
                          {copiedKeyId === k.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKey(k.id, k.name)}
                          className="!p-1.5 h-auto text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Generate Key */}
              <form onSubmit={handleCreateKey} className="flex gap-3 mt-6 border-t border-border pt-6">
                <input
                  type="text"
                  required
                  placeholder="Key Description (e.g. staging-k8s-workers)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="flex-grow h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                />
                <Button type="submit" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Generate Key
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'worker' && (
            <form onSubmit={handlePolicySave} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Global Retry & Backoff Configuration</h3>
                <p className="text-xs text-muted-foreground mt-1">Specify default rules when workflows trigger exceptions.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Default Attempts</label>
                    <input
                      type="number"
                      min={1}
                      value={polAttempts}
                      onChange={(e) => setPolAttempts(Number(e.target.value))}
                      className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exponential Backoff Factor</label>
                    <input
                      type="number"
                      min={1}
                      value={polBackoff}
                      onChange={(e) => setPolBackoff(Number(e.target.value))}
                      className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Retry Delay limit (ms)</label>
                  <input
                    type="number"
                    min={1000}
                    value={polMaxDelay}
                    onChange={(e) => setPolMaxDelay(Number(e.target.value))}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <Button type="submit">Save Settings</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default Settings;
