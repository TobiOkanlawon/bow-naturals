import { useState } from 'react';
import { useBrand, type BrandSettings } from '../context/BrandContext';
import { Save, RotateCcw, Palette, Building2, Image, Eye, User } from 'lucide-react';

const colorPresets = [
  { name: 'Indigo', primary: '#4F46E5', dark: '#4338CA', light: '#818CF8', from: '#312E81', to: '#4F46E5' },
  { name: 'Emerald', primary: '#059669', dark: '#047857', light: '#34D399', from: '#064E3B', to: '#059669' },
  { name: 'Rose', primary: '#E11D48', dark: '#BE123C', light: '#FB7185', from: '#881337', to: '#E11D48' },
  { name: 'Amber', primary: '#D97706', dark: '#B45309', light: '#FCD34D', from: '#78350F', to: '#D97706' },
  { name: 'Violet', primary: '#7C3AED', dark: '#6D28D9', light: '#A78BFA', from: '#4C1D95', to: '#7C3AED' },
  { name: 'Cyan', primary: '#0891B2', dark: '#0E7490', light: '#22D3EE', from: '#164E63', to: '#0891B2' },
  { name: 'Slate', primary: '#475569', dark: '#334155', light: '#94A3B8', from: '#1E293B', to: '#475569' },
  { name: 'Pink', primary: '#DB2777', dark: '#BE185D', light: '#F472B6', from: '#831843', to: '#DB2777' },
];

const emojiOptions = ['🌿', '💼', '🏢', '🛒', '⚡', '🎯', '🔷', '💎', '🚀', '🌟', '🌸', '🍃', '🔥', '✨', '📊', '🏪'];

export default function Settings() {
  const { brand, updateBrand, resetBrand } = useBrand();
  const [form, setForm] = useState<BrandSettings>({ ...brand });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'ceo' | 'colors' | 'preview'>('brand');

  const handleSave = () => {
    updateBrand(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetBrand();
    setForm({
      name: 'Bow Naturals',
      tagline: 'Sales & Inventory Management',
      logoUrl: '',
      logoEmoji: '🌿',
      primaryColor: '#4F46E5',
      primaryDark: '#4338CA',
      primaryLight: '#818CF8',
      sidebarGradientFrom: '#312E81',
      sidebarGradientTo: '#4F46E5',
      accentColor: '#10B981',
      ceoName: 'Sarah Johnson',
      ceoEmail: 'ceo@company.com',
      ceoPassword: 'admin123',
    });
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setForm({
      ...form,
      primaryColor: preset.primary,
      primaryDark: preset.dark,
      primaryLight: preset.light,
      sidebarGradientFrom: preset.from,
      sidebarGradientTo: preset.to,
    });
  };

  const tabs = [
    { key: 'brand' as const, label: 'Brand', icon: <Building2 size={16} /> },
    { key: 'ceo' as const, label: 'CEO Profile', icon: <User size={16} /> },
    { key: 'colors' as const, label: 'Colors', icon: <Palette size={16} /> },
    { key: 'preview' as const, label: 'Preview', icon: <Eye size={16} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Customize your dashboard branding and appearance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2" style={{ backgroundColor: form.primaryColor }}>
            <Save size={14} /> {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Brand Identity Tab */}
      {activeTab === 'brand' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={18} /> Brand Identity
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  className="input-field max-w-md"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your brand name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  className="input-field max-w-md"
                  value={form.tagline}
                  onChange={e => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Your tagline or description"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image size={18} /> Logo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                <input
                  className="input-field max-w-md"
                  value={form.logoUrl}
                  onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-400 mt-1">Enter a URL to your logo image. Leave empty to use emoji.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Emoji (if no URL)</label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setForm({ ...form, logoEmoji: emoji })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        form.logoEmoji === emoji
                          ? 'scale-110 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      style={form.logoEmoji === emoji ? { outline: `2px solid ${form.primaryColor}`, backgroundColor: `${form.primaryColor}15` } : {}}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO Profile Tab */}
      {activeTab === 'ceo' && (
        <div className="card p-6 space-y-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={18} /> CEO Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEO Name</label>
              <input
                className="input-field max-w-md"
                value={form.ceoName}
                onChange={e => setForm({ ...form, ceoName: e.target.value })}
                placeholder="CEO name"
              />
              <p className="text-xs text-gray-400 mt-1">This name will appear as the CEO in the system.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEO Email</label>
              <input
                className="input-field max-w-md"
                type="email"
                value={form.ceoEmail}
                onChange={e => setForm({ ...form, ceoEmail: e.target.value })}
                placeholder="ceo@company.com"
              />
              <p className="text-xs text-gray-400 mt-1">Login email for the CEO account.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEO Password</label>
              <input
                className="input-field max-w-md"
                type="text"
                value={form.ceoPassword}
                onChange={e => setForm({ ...form, ceoPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-400 mt-1">Change the CEO login password.</p>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
            <strong>Note:</strong> After changing credentials, log out and use the new email/password to log in. Staff emails and passwords can be managed in the Staff page.
          </div>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette size={18} /> Quick Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                    form.primaryColor === preset.primary ? 'border-gray-900 shadow-md' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <span className="text-sm font-medium text-gray-700">{preset.name}</span>
                  </div>
                  <div
                    className="h-8 rounded-lg"
                    style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.primary})` }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Custom Colors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    className="input-field flex-1"
                    value={form.primaryColor}
                    onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Dark</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryDark}
                    onChange={e => setForm({ ...form, primaryDark: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    className="input-field flex-1"
                    value={form.primaryDark}
                    onChange={e => setForm({ ...form, primaryDark: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar Gradient Start</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.sidebarGradientFrom}
                    onChange={e => setForm({ ...form, sidebarGradientFrom: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    className="input-field flex-1"
                    value={form.sidebarGradientFrom}
                    onChange={e => setForm({ ...form, sidebarGradientFrom: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sidebar Gradient End</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.sidebarGradientTo}
                    onChange={e => setForm({ ...form, sidebarGradientTo: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    className="input-field flex-1"
                    value={form.sidebarGradientTo}
                    onChange={e => setForm({ ...form, sidebarGradientTo: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Sidebar Preview */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Sidebar Preview</h3>
            <div className="max-w-[260px] mx-auto rounded-xl overflow-hidden shadow-lg">
              <div
                className="p-4"
                style={{ background: `linear-gradient(180deg, ${form.sidebarGradientFrom}, ${form.sidebarGradientTo})` }}
              >
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: form.primaryColor }}>
                      {form.logoEmoji}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-sm">{form.name || 'Brand Name'}</p>
                    <p className="text-white/50 text-[10px]">{form.tagline || 'Your tagline'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/15 text-white text-sm">
                    <div className="w-4 h-4 rounded bg-white/30" />
                    Dashboard
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 text-sm">
                    <div className="w-4 h-4 rounded bg-white/10" />
                    Orders
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 text-sm">
                    <div className="w-4 h-4 rounded bg-white/10" />
                    Logistics
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UI Elements Preview */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">UI Elements Preview</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Buttons</p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary" style={{ backgroundColor: form.primaryColor }}>Primary Button</button>
                  <button className="btn-primary" style={{ backgroundColor: form.primaryDark }}>Dark Button</button>
                  <button className="btn-secondary">Secondary Button</button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Badges</p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge text-white" style={{ backgroundColor: form.primaryColor }}>Primary</span>
                  <span className="badge text-white" style={{ backgroundColor: form.accentColor }}>Accent</span>
                  <span className="badge bg-green-50 text-green-700">Success</span>
                  <span className="badge bg-amber-50 text-amber-700">Warning</span>
                  <span className="badge bg-red-50 text-red-700">Danger</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
