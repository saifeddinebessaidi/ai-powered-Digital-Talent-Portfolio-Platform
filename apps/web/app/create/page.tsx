'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  api,
  uploadToCloudinaryWithProgress,
  type ExperienceInput,
  type GenOutput,
} from '@/lib/api';

const PROFESSION_LABELS: Record<string, string> = {
  actress: 'Actress',
  actor: 'Actor',
  model: 'Model',
  influencer: 'Influencer',
  content_creator: 'Content Creator',
  athlete: 'Athlete',
  other: 'Other',
};

const PROFESSIONS = [
  'actress',
  'actor',
  'model',
  'influencer',
  'content_creator',
  'athlete',
  'other',
] as const;

const STEPS = ['Basics', 'Reach & work', 'Photos'] as const;

// Accepted image formats and size limit for portfolio photos.
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_LABEL = 'JPG, PNG or WebP';
const MAX_MB = 10;
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp';

type Photo = { id: string; url: string; cloudinaryPublicId: string; isCover: boolean };
type PendingUpload = { tempId: string; name: string; progress: number; error?: string };

export default function CreateWizard() {
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [result, setResult] = useState<GenOutput | null>(null);

  // form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('actress');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramFollowers, setInstagramFollowers] = useState('');
  const [facebookFollowers, setFacebookFollowers] = useState('');
  const [tiktokFollowers, setTiktokFollowers] = useState('');
  const [youtubeSubscribers, setYoutubeSubscribers] = useState('');
  const [experiences, setExperiences] = useState<ExperienceInput[]>([
    { type: 'acting_credit', title: '', role: '', year: '' },
  ]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    api
      .ensurePortfolio()
      .then((p) => setPortfolioId(p.id))
      .catch((e) => toast.error(`Could not start: ${e.message}`));
  }, []);

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

  function addExperience() {
    setExperiences((x) => [...x, { type: 'acting_credit', title: '', role: '', year: '' }]);
  }
  function updateExperience(i: number, patch: Partial<ExperienceInput>) {
    setExperiences((x) => x.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function removeExperience(i: number) {
    setExperiences((x) => x.filter((_, j) => j !== i));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !portfolioId) return;
    // first photo in this batch becomes the cover only if none exist yet
    let coverTaken = photos.length > 0;
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported format — use ${ACCEPTED_LABEL}`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name}: too large (max ${MAX_MB}MB)`);
        continue;
      }
      const tempId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${file.name}-${file.size}-${Date.now()}`;
      const makeCover = !coverTaken;
      coverTaken = true;
      setPending((p) => [...p, { tempId, name: file.name, progress: 0 }]);
      try {
        const meta = await uploadToCloudinaryWithProgress(file, (pct) =>
          setPending((p) =>
            p.map((u) => (u.tempId === tempId ? { ...u, progress: pct } : u)),
          ),
        );
        const created = await api.registerPhoto(portfolioId, {
          ...meta,
          isCover: makeCover,
        });
        setPhotos((ph) => [
          ...ph,
          {
            id: created.id,
            url: meta.url,
            cloudinaryPublicId: meta.cloudinaryPublicId,
            isCover: created.isCover,
          },
        ]);
        setPending((p) => p.filter((u) => u.tempId !== tempId));
      } catch (e) {
        const msg = (e as Error).message;
        // keep the failed item visible with its error so the user knows WHY
        setPending((p) =>
          p.map((u) => (u.tempId === tempId ? { ...u, error: msg } : u)),
        );
        toast.error(`${file.name}: ${msg}`);
      }
    }
  }

  function dismissPending(tempId: string) {
    setPending((p) => p.filter((u) => u.tempId !== tempId));
  }

  /** Pick which photo is the cover (only one cover at a time). */
  async function chooseCover(photoId: string) {
    if (!portfolioId) return;
    const prev = photos;
    setPhotos((p) => p.map((x) => ({ ...x, isCover: x.id === photoId })));
    try {
      await api.setCover(portfolioId, photoId);
    } catch (e) {
      setPhotos(prev);
      toast.error(`Could not set cover: ${(e as Error).message}`);
    }
  }

  async function removePhoto(photoId: string) {
    if (!portfolioId) return;
    const prev = photos;
    const removed = prev.find((x) => x.id === photoId);
    const remaining = prev.filter((x) => x.id !== photoId);
    setPhotos(remaining);
    try {
      await api.deletePhoto(portfolioId, photoId);
      // If we deleted the cover, promote the first remaining photo to cover.
      if (removed?.isCover && remaining.length > 0) {
        await api.setCover(portfolioId, remaining[0].id);
        setPhotos(remaining.map((x, idx) => ({ ...x, isCover: idx === 0 })));
      }
      toast.success('Photo removed');
    } catch (e) {
      setPhotos(prev); // restore on failure
      toast.error(`Could not delete: ${(e as Error).message}`);
    }
  }

  function canGenerate() {
    return fullName.trim() && location.trim() && email.trim();
  }

  async function handleGenerate() {
    if (!portfolioId) return;
    if (!canGenerate()) {
      toast.error('Please fill name, location and email first');
      return;
    }
    setBusy(true);
    try {
      await api.updatePortfolio(portfolioId, {
        fullName,
        gender: gender || undefined,
        profession,
        location,
        email,
        phone: phone || undefined,
        description: description || undefined,
        instagramUrl: instagramUrl || undefined,
        facebookUrl: facebookUrl || undefined,
        tiktokUrl: tiktokUrl || undefined,
        youtubeUrl: youtubeUrl || undefined,
        instagramFollowers: num(instagramFollowers),
        facebookFollowers: num(facebookFollowers),
        tiktokFollowers: num(tiktokFollowers),
        youtubeSubscribers: num(youtubeSubscribers),
      });
      await api.setExperiences(
        portfolioId,
        experiences.filter((e) => e.title.trim()),
      );
      const res = await api.generate(portfolioId, 'all');
      setResult(res.output);
      setStep(3);
      toast.success('Portfolio generated ✨');
    } catch (e) {
      toast.error(`Generation failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const field = 'flex flex-col gap-1.5';
  const selectCls =
    'h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 [color-scheme:light]';

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Toaster />
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          AI Portfolio Generator
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Fill a short form and generate a professional portfolio in seconds.
        </p>
      </header>

      {step < 3 && (
        <>
          {/* progress */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs uppercase tracking-wide text-neutral-500">
              <span>
                Step {step + 1} of {STEPS.length} · {STEPS[step]}
              </span>
              <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-neutral-200">
              <div
                className="h-1 bg-black transition-all"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1 — Basics */}
          {step === 0 && (
            <div className="grid gap-4">
              <div className={field}>
                <Label>Full name *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={field}>
                  <Label>Profession *</Label>
                  <select className={selectCls} value={profession} onChange={(e) => setProfession(e.target.value)}>
                    {PROFESSIONS.map((p) => (
                      <option key={p} value={p}>
                        {PROFESSION_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={field}>
                  <Label>Gender</Label>
                  <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">—</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer_not">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className={field}>
                <Label>Location *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Paris, France" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={field}>
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
                </div>
                <div className={field}>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 …" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Reach & work */}
          {step === 1 && (
            <div className="grid gap-5">
              <div className="grid gap-3">
                <p className="text-sm font-medium">Social links & reach (optional)</p>
                {[
                  ['Instagram', instagramUrl, setInstagramUrl, instagramFollowers, setInstagramFollowers, 'followers'],
                  ['Facebook', facebookUrl, setFacebookUrl, facebookFollowers, setFacebookFollowers, 'followers'],
                  ['TikTok', tiktokUrl, setTiktokUrl, tiktokFollowers, setTiktokFollowers, 'followers'],
                  ['YouTube', youtubeUrl, setYoutubeUrl, youtubeSubscribers, setYoutubeSubscribers, 'subscribers'],
                ].map(([label, url, setUrl, cnt, setCnt, unit]) => (
                  <div key={label as string} className="grid grid-cols-[1fr_140px] gap-2">
                    <Input
                      placeholder={`${label} URL or @handle`}
                      value={url as string}
                      onChange={(e) => (setUrl as (v: string) => void)(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder={unit as string}
                      value={cnt as string}
                      onChange={(e) => (setCnt as (v: string) => void)(e.target.value)}
                    />
                  </div>
                ))}
                <p className="text-xs text-neutral-400">Follower counts are self-reported and shown as such.</p>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-medium">Experience</p>
                {experiences.map((exp, i) => (
                  <div key={i} className="grid grid-cols-[120px_1fr_110px_80px_auto] items-center gap-2">
                    <select
                      className={selectCls}
                      value={exp.type}
                      onChange={(e) => updateExperience(i, { type: e.target.value as ExperienceInput['type'] })}
                    >
                      <option value="acting_credit">Acting</option>
                      <option value="brand_collab">Brand</option>
                      <option value="other">Other</option>
                    </select>
                    <Input placeholder="Title / brand" value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} />
                    <Input placeholder="Role" value={exp.role ?? ''} onChange={(e) => updateExperience(i, { role: e.target.value })} />
                    <Input placeholder="Year" value={exp.year ?? ''} onChange={(e) => updateExperience(i, { year: e.target.value })} />
                    <button type="button" onClick={() => removeExperience(i)} className="text-neutral-400 hover:text-black">×</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addExperience}>
                  + Add experience
                </Button>
              </div>

              <div className={field}>
                <Label>Short description (optional — seeds the AI)</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anything you'd like the AI to know — style, focus, ambitions…"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Photos */}
          {step === 2 && (
            <div className="grid gap-4">
              <Label>Photos (optional)</Label>
              <label
                className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-8 text-center transition hover:border-neutral-500 hover:bg-neutral-50 ${
                  pending.some((u) => !u.error) ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <span className="text-3xl leading-none text-neutral-400">＋</span>
                <span className="text-sm font-medium">
                  {photos.length > 0 ? 'Add more photos' : 'Click to upload photos'}
                </span>
                <span className="text-xs text-neutral-500">
                  {ACCEPTED_LABEL} · up to {MAX_MB}MB each
                  {photos.length > 0 ? ` · ${photos.length} added` : ''}
                </span>
                <input
                  type="file"
                  accept={ACCEPT_ATTR}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = ''; // reset so you can add more (even the same file) again
                  }}
                />
              </label>

              {/* In-progress / failed uploads */}
              {pending.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {pending.map((u) => (
                    <div
                      key={u.tempId}
                      title={u.error ?? u.name}
                      className={`relative flex h-24 w-24 flex-col items-center justify-center rounded border p-1.5 text-center text-[10px] ${
                        u.error ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-neutral-50'
                      }`}
                    >
                      {u.error ? (
                        <>
                          <span className="font-medium text-red-600">Upload failed</span>
                          <span className="mt-0.5 line-clamp-3 text-red-500">{u.error}</span>
                          <button
                            type="button"
                            onClick={() => dismissPending(u.tempId)}
                            className="mt-1 underline"
                          >
                            dismiss
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="mb-1 w-full truncate text-neutral-500">{u.name}</span>
                          <div className="h-1 w-full bg-neutral-200">
                            <div
                              className="h-1 bg-black transition-all"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                          <span className="mt-1 text-neutral-500">{u.progress}%</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {photos.length > 0 && (
                <>
                  <p className="text-xs text-neutral-500">
                    Click a photo to set it as the <strong>cover</strong> (used as the hero image).
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {photos.map((p) => (
                      <div key={p.id} className="group relative h-24 w-24">
                        <button
                          type="button"
                          onClick={() => chooseCover(p.id)}
                          title={p.isCover ? 'Current cover' : 'Set as cover'}
                          className={`block h-24 w-24 overflow-hidden rounded ${
                            p.isCover ? 'ring-2 ring-black ring-offset-2' : 'ring-1 ring-neutral-200'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt="" className="h-full w-full object-cover" />
                        </button>
                        {p.isCover ? (
                          <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1 text-[10px] uppercase tracking-wide text-white">
                            Cover
                          </span>
                        ) : (
                          <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded bg-white/85 px-1 text-center text-[10px] text-black opacity-0 transition group-hover:opacity-100">
                            Set cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          aria-label="Delete photo"
                          title="Delete photo"
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-black hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* nav */}
          <div className="mt-8 flex justify-between">
            <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
            ) : (
              <Button onClick={handleGenerate} disabled={busy || !portfolioId}>
                {busy ? 'Crafting your portfolio…' : 'Generate ✨'}
              </Button>
            )}
          </div>
        </>
      )}

      {/* Preview */}
      {step === 3 && result && (
        <article className="border border-neutral-200 bg-white">
          {(() => {
            const cover = photos.find((p) => p.isCover) ?? photos[0];
            return cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.url} alt={fullName} className="h-72 w-full object-cover" />
            ) : null;
          })()}
          <div className="p-6">
            <h2 className="font-serif text-4xl font-semibold">{fullName}</h2>
            <p className="mt-1 text-sm uppercase tracking-wide text-neutral-500">
              {PROFESSION_LABELS[profession]} · {location}
            </p>
            <p className="mt-4 text-lg italic text-neutral-700">{result.headline}</p>

            <section className="mt-6">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Biography</h3>
              <p className="whitespace-pre-line leading-relaxed text-neutral-800">{result.biography}</p>
            </section>

            <section className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((s) => (
                  <span key={s} className="border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Brand summary</h3>
              <p className="leading-relaxed text-neutral-800">{result.brandSummary}</p>
            </section>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)}>Edit</Button>
              <Button onClick={handleGenerate} disabled={busy}>
                {busy ? 'Regenerating…' : 'Regenerate'}
              </Button>
            </div>
          </div>
        </article>
      )}
    </main>
  );
}
