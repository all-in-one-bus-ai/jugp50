import { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { FeeRule, Hall, Batch } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

interface SettingsMap {
  [key: string]: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('fees');
  const tabs = [
    { id: 'fees', label: 'Fee Settings' },
    { id: 'registration', label: 'Registration Settings' },
    { id: 'payment', label: 'Payment Settings' },
    { id: 'paystation', label: 'PayStation Gateway' },
    { id: 'halls', label: 'Hall Management' },
    { id: 'batches', label: 'Batch Management' },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-jubilee-700 border border-gray-200 border-b-white -mb-[5px]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'fees' && <FeeSettings />}
      {activeTab === 'registration' && <RegistrationSettings />}
      {activeTab === 'payment' && <PaymentSettings />}
      {activeTab === 'paystation' && <PayStationSettings />}
      {activeTab === 'halls' && <HallManagement />}
      {activeTab === 'batches' && <BatchManagement />}
    </div>
  );
}

function FeeSettings() {
  const { addToast } = useToast();
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [guestFee, setGuestFee] = useState('500');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('fee_rules').select('*').order('batch_from').then(({ data }) => {
      if (data) setFeeRules(data);
    });
    supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'guest_fee')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setGuestFee(data.value);
      });
  }, []);

  function updateRule(id: string, field: keyof FeeRule, value: string) {
    setFeeRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: Number(value) } : r))
    );
  }

  async function save() {
    setSaving(true);
    for (const rule of feeRules) {
      await supabase
        .from('fee_rules')
        .update({
          batch_from: rule.batch_from,
          batch_to: rule.batch_to,
          fee_amount: rule.fee_amount,
        })
        .eq('id', rule.id);
    }
    await supabase.from('settings').update({ value: guestFee }).eq('key', 'guest_fee');
    setSaving(false);
    addToast('success', 'Fee settings saved successfully');
  }

  return (
    <div className="card p-6">
      <h2 className="font-serif text-lg font-semibold text-gray-900 mb-6">Fee Configuration</h2>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 px-1">
          <span>Batch From</span>
          <span>Batch To</span>
          <span>Fee (BDT)</span>
          <span></span>
        </div>
        {feeRules.map((rule) => (
          <div key={rule.id} className="grid grid-cols-4 gap-4 items-center">
            <input
              type="number"
              className="input-field"
              value={rule.batch_from}
              onChange={(e) => updateRule(rule.id, 'batch_from', e.target.value)}
            />
            <input
              type="number"
              className="input-field"
              value={rule.batch_to}
              onChange={(e) => updateRule(rule.id, 'batch_to', e.target.value)}
            />
            <input
              type="number"
              className="input-field"
              value={rule.fee_amount}
              onChange={(e) => updateRule(rule.id, 'fee_amount', e.target.value)}
            />
            <div />
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Guest Fee (BDT per person)
        </label>
        <input
          type="number"
          className="input-field w-48"
          value={guestFee}
          onChange={(e) => setGuestFee(e.target.value)}
        />
      </div>

      <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}

function RegistrationSettings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (data) {
        setSettings(Object.fromEntries(data.map((s) => [s.key, s.value])));
      }
    });
  }, []);

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').update({ value }).eq('key', key);
    }
    setSaving(false);
    addToast('success', 'Registration settings saved');
  }

  return (
    <div className="card p-6">
      <h2 className="font-serif text-lg font-semibold text-gray-900 mb-6">Registration Settings</h2>

      <div className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Registration Open
          </label>
          <select
            className="select-field w-48"
            value={settings.registration_open || 'true'}
            onChange={(e) => updateSetting('registration_open', e.target.value)}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Maximum Guests per Registration
          </label>
          <input
            type="number"
            className="input-field w-48"
            value={settings.max_guests || '5'}
            onChange={(e) => updateSetting('max_guests', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
          <input
            type="email"
            className="input-field"
            value={settings.contact_email || ''}
            onChange={(e) => updateSetting('contact_email', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
          <input
            type="tel"
            className="input-field"
            value={settings.contact_phone || ''}
            onChange={(e) => updateSetting('contact_phone', e.target.value)}
          />
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-6 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}

function PaymentSettings() {
  const { addToast } = useToast();
  const [gatewayEnabled, setGatewayEnabled] = useState('true');
  const [gatewayPct, setGatewayPct] = useState('2.5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['gateway_charge_enabled', 'gateway_charge_percentage'])
      .then(({ data }) => {
        if (data) {
          const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
          if (map.gateway_charge_enabled) setGatewayEnabled(map.gateway_charge_enabled);
          if (map.gateway_charge_percentage) setGatewayPct(map.gateway_charge_percentage);
        }
      });
  }, []);

  async function save() {
    setSaving(true);
    await supabase.from('settings').update({ value: gatewayEnabled }).eq('key', 'gateway_charge_enabled');
    await supabase.from('settings').update({ value: gatewayPct }).eq('key', 'gateway_charge_percentage');
    setSaving(false);
    addToast('success', 'Payment settings saved');
  }

  return (
    <div className="card p-6">
      <h2 className="font-serif text-lg font-semibold text-gray-900 mb-6">Payment Settings</h2>

      <div className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Enable Gateway Charge
          </label>
          <select
            className="select-field w-48"
            value={gatewayEnabled}
            onChange={(e) => setGatewayEnabled(e.target.value)}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Gateway Charge Percentage (%)
          </label>
          <input
            type="number"
            step="0.1"
            className="input-field w-48"
            value={gatewayPct}
            onChange={(e) => setGatewayPct(e.target.value)}
          />
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-6 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}

function PayStationSettings() {
  const { addToast } = useToast();
  const [env, setEnv] = useState('sandbox');
  const [merchantId, setMerchantId] = useState('');
  const [password, setPassword] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [ipnUrl, setIpnUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'paystation_env',
        'paystation_merchant_id',
        'paystation_password',
        'paystation_callback_url',
        'paystation_ipn_url',
      ])
      .then(({ data }) => {
        if (data) {
          const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
          setEnv(map.paystation_env || 'sandbox');
          setMerchantId(map.paystation_merchant_id || '');
          setPassword(map.paystation_password || '');
          setCallbackUrl(map.paystation_callback_url || '');
          setIpnUrl(map.paystation_ipn_url || '');
        }
        setLoaded(true);
      });
  }, []);

  async function save() {
    setSaving(true);
    const updates: [string, string][] = [
      ['paystation_env', env],
      ['paystation_merchant_id', merchantId],
      ['paystation_password', password],
      ['paystation_callback_url', callbackUrl],
      ['paystation_ipn_url', ipnUrl],
    ];
    for (const [key, value] of updates) {
      await supabase.from('settings').update({ value }).eq('key', key);
    }
    setSaving(false);
    addToast('success', 'PayStation settings saved successfully');
  }

  if (!loaded) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="font-serif text-lg font-semibold text-gray-900 mb-2">
        PayStation Payment Gateway
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Configure your PayStation credentials below. Switch between Sandbox and Live mode. Sandbox
        uses test credentials for development; Live mode processes real payments.
      </p>

      <div className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Environment</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEnv('sandbox')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                env === 'sandbox'
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    env === 'sandbox' ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                />
                Sandbox
              </div>
              <p className="text-xs mt-1 opacity-70">Test payments</p>
            </button>
            <button
              type="button"
              onClick={() => setEnv('live')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                env === 'live'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    env === 'live' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
                Live
              </div>
              <p className="text-xs mt-1 opacity-70">Real payments</p>
            </button>
          </div>
        </div>

        {env === 'sandbox' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-1">Sandbox Mode Active</p>
            <p className="text-xs text-amber-700">
              No real money will be charged. Use PayStation's test credentials for development.
            </p>
          </div>
        )}

        {env === 'live' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-800 font-medium mb-1">Live Mode Active</p>
            <p className="text-xs text-emerald-700">
              Real payments will be processed. Make sure your live credentials are correct.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Merchant ID</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 104-1653730183"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Your PayStation Merchant ID</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Merchant Password
          </label>
          <input
            type="password"
            className="input-field"
            placeholder="Enter merchant password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Your PayStation API password</p>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Advanced (Optional)</h3>
          <p className="text-xs text-gray-500 mb-4">
            Leave these empty to use auto-detected URLs. Only fill in if you need to override the
            defaults.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Callback URL (Browser Return)
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="Auto-detected from your domain"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                IPN URL (Server Notification)
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="Auto-detected from Supabase"
                value={ipnUrl}
                onChange={(e) => setIpnUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary mt-6 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save PayStation Settings
      </button>
    </div>
  );
}

function HallManagement() {
  const [halls, setHalls] = useState<Hall[]>([]);

  useEffect(() => {
    supabase.from('halls').select('*').order('sort_order').then(({ data }) => {
      if (data) setHalls(data);
    });
  }, []);

  return (
    <div className="card p-6">
      <h2 className="font-serif text-lg font-semibold text-gray-900 mb-6">Hall Management</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Hall Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Former Name</th>
            </tr>
          </thead>
          <tbody>
            {halls.map((hall, i) => (
              <tr key={hall.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{hall.name}</td>
                <td className="py-3 px-4 text-gray-500 italic">
                  {hall.former_name || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    supabase.from('batches').select('*').order('batch_number').then(({ data }) => {
      if (data) setBatches(data);
    });
  }, []);

  return (
    <div className="card p-6">
      <h2 className="font-serif text-lg font-semibold text-gray-900 mb-6">Batch Management</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Batch Number</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Display Name</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{batch.batch_number}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{batch.batch_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
