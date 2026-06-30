'use client';

import { useMemo, useState } from 'react';

type Lang = 'en' | 'pt';
type FlatMap = Record<string, string>;

interface Props {
  defaults: Record<Lang, FlatMap>;
  overrides: Record<Lang, FlatMap>;
}

// Friendly titles for the top-level translation sections.
const SECTION_LABELS: Record<string, string> = {
  nav: 'Navigation Bar',
  footer: 'Footer',
  home: 'Home Page',
  property: 'Property Cards',
  propertyDetails: 'Property Details Page',
  propertiesList: 'Properties Listing Page',
  auth: 'Sign In / Register',
  pricing: 'Pricing Page',
  postProperty: 'Post a Property',
  dashboard: 'Dashboard Labels',
  about: 'About Page',
  contact: 'Contact Page',
  news: 'Blog / News Page',
  privacy: 'Privacy Policy Page',
  terms: 'Terms & Conditions Page',
  agents: 'Agents Page',
};

function sectionLabel(section: string) {
  return SECTION_LABELS[section] || section.charAt(0).toUpperCase() + section.slice(1);
}

function fieldLabel(key: string) {
  // Drop the section prefix and humanize the remaining dot-path.
  const rest = key.split('.').slice(1).join(' › ');
  return rest
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function AdminContentClient({ defaults, overrides }: Props) {
  // Baseline effective value = override if present else default.
  const allKeys = useMemo(() => Object.keys(defaults.en), [defaults]);

  const sections = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const key of allKeys) {
      const section = key.split('.')[0];
      if (!map.has(section)) map.set(section, []);
      map.get(section)!.push(key);
    }
    return Array.from(map.entries());
  }, [allKeys]);

  const baseline = useMemo(() => {
    const make = (lang: Lang): FlatMap => {
      const out: FlatMap = {};
      for (const key of allKeys) out[key] = overrides[lang][key] ?? defaults[lang][key] ?? '';
      return out;
    };
    return { en: make('en'), pt: make('pt') };
  }, [allKeys, defaults, overrides]);

  const [values, setValues] = useState<Record<Lang, FlatMap>>(() => ({
    en: { ...baseline.en },
    pt: { ...baseline.pt },
  }));
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.[0] ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const dirtyKeys = useMemo(() => {
    const dirty: { key: string; lang: Lang }[] = [];
    for (const key of allKeys) {
      (['en', 'pt'] as Lang[]).forEach((lang) => {
        if (values[lang][key] !== baseline[lang][key]) dirty.push({ key, lang });
      });
    }
    return dirty;
  }, [values, baseline, allKeys]);

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections
      .map(([section, keys]) => {
        const matchSection = sectionLabel(section).toLowerCase().includes(term);
        const matchedKeys = matchSection
          ? keys
          : keys.filter(
              (k) =>
                k.toLowerCase().includes(term) ||
                (defaults.en[k] || '').toLowerCase().includes(term) ||
                (defaults.pt[k] || '').toLowerCase().includes(term)
            );
        return [section, matchedKeys] as [string, string[]];
      })
      .filter(([, keys]) => keys.length > 0);
  }, [sections, search, defaults]);

  function setValue(lang: Lang, key: string, value: string) {
    setValues((prev) => ({ ...prev, [lang]: { ...prev[lang], [key]: value } }));
  }

  function resetField(key: string) {
    setValues((prev) => ({
      en: { ...prev.en, [key]: defaults.en[key] ?? '' },
      pt: { ...prev.pt, [key]: defaults.pt[key] ?? '' },
    }));
  }

  async function save() {
    if (dirtyKeys.length === 0) return;
    setIsSaving(true);
    setToast(null);
    try {
      const updates = dirtyKeys.map(({ key, lang }) => ({ key, lang, value: values[lang][key] }));
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || 'Save failed.');
      setToast({ type: 'ok', msg: `Saved ${payload.count} change${payload.count === 1 ? '' : 's'}. Live now.` });
      // Refresh the page so the new baseline reflects the saved state.
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setToast({ type: 'err', msg: error instanceof Error ? error.message : 'Save failed.' });
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#002045]">Edit Pages Content</h2>
          <p className="mt-1 text-sm font-medium text-[#74777f]">
            Change any text shown on the public website — in English and Portuguese. Saved changes go live immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-[#f2f4f6] bg-white px-4 py-2.5">
            <span className="material-symbols-outlined text-[#74777f]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text or section…"
              className="w-56 border-none bg-transparent text-sm font-bold outline-none placeholder-[#c4c6cf]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSections.map(([section, keys]) => {
          const isOpen = openSection === section || search.trim().length > 0;
          const sectionDirty = keys.some(
            (k) => values.en[k] !== baseline.en[k] || values.pt[k] !== baseline.pt[k]
          );
          return (
            <div key={section} className="overflow-hidden rounded-[1.5rem] border border-[#f2f4f6] bg-white shadow-sm">
              <button
                onClick={() => setOpenSection(isOpen && !search ? null : section)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#845326]">description</span>
                  <span className="text-base font-black text-[#002045]">{sectionLabel(section)}</span>
                  <span className="rounded-full bg-[#f7f9fb] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#74777f]">
                    {keys.length} fields
                  </span>
                  {sectionDirty && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">
                      Unsaved
                    </span>
                  )}
                </div>
                <span className={`material-symbols-outlined text-[#74777f] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isOpen && (
                <div className="space-y-6 border-t border-[#f2f4f6] px-6 py-6">
                  {keys.map((key) => {
                    const isLong = (defaults.en[key]?.length ?? 0) > 70 || (values.en[key]?.length ?? 0) > 70;
                    const changed = values.en[key] !== baseline.en[key] || values.pt[key] !== baseline.pt[key];
                    return (
                      <div key={key} className="rounded-2xl border border-[#f2f4f6] bg-[#fafbfc] p-5">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-wide text-[#002045]">{fieldLabel(key)}</p>
                          <div className="flex items-center gap-2">
                            <code className="hidden text-[10px] text-[#c4c6cf] sm:inline">{key}</code>
                            {changed && (
                              <button
                                onClick={() => resetField(key)}
                                className="text-[9px] font-black uppercase tracking-widest text-[#74777f] hover:text-red-500"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {(['en', 'pt'] as Lang[]).map((lang) => (
                            <div key={lang}>
                              <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">
                                {lang === 'en' ? 'English' : 'Português'}
                              </label>
                              {isLong ? (
                                <textarea
                                  rows={3}
                                  value={values[lang][key] ?? ''}
                                  onChange={(e) => setValue(lang, key, e.target.value)}
                                  className="w-full rounded-xl border border-[#f2f4f6] bg-white px-4 py-3 text-sm leading-relaxed text-[#43474e] outline-none focus:ring-2 focus:ring-[#002045]/10"
                                />
                              ) : (
                                <input
                                  value={values[lang][key] ?? ''}
                                  onChange={(e) => setValue(lang, key, e.target.value)}
                                  className="w-full rounded-xl border border-[#f2f4f6] bg-white px-4 py-3 text-sm font-medium text-[#43474e] outline-none focus:ring-2 focus:ring-[#002045]/10"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredSections.length === 0 && (
          <div className="rounded-[1.5rem] border border-[#f2f4f6] bg-white py-16 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#c4c6cf]">No fields match “{search}”.</p>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:left-80">
        <div className="m-4 flex items-center justify-between gap-4 rounded-2xl border border-[#f2f4f6] bg-white/90 px-6 py-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {toast ? (
              <span
                className={`text-xs font-black ${toast.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {toast.msg}
              </span>
            ) : (
              <span className="text-xs font-bold text-[#74777f]">
                {dirtyKeys.length > 0
                  ? `${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? '' : 's'}`
                  : 'All changes saved'}
              </span>
            )}
          </div>
          <button
            onClick={save}
            disabled={isSaving || dirtyKeys.length === 0}
            className="rounded-xl bg-[#002045] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#003366] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? 'Saving…' : 'Publish Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
