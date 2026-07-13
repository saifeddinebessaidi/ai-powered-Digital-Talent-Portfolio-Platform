'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  type PricingInput,
  type ProjectInput,
  type GenOutput,
} from '@/lib/api';

const PROFESSIONS: [string, string][] = [
  ['actress', 'Actrice'],
  ['actor', 'Acteur'],
  ['model', 'Mannequin'],
  ['influencer', 'Influenceur·euse'],
  ['content_creator', 'Créateur·rice de contenu'],
  ['other', 'Autre'],
];
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;
const CATEGORY_FR: Record<string, string> = {
  reels: 'Reels',
  stories: 'Stories',
  live: 'Live',
  events: 'Événements',
  other: 'Autre',
};

const selectCls =
  'h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 [color-scheme:light]';
const field = 'flex flex-col gap-1.5';

type Photo = { id: string; url: string; isCover: boolean };

export default function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GenOutput | null>(null);

  // identity
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('influencer');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  // socials + admin stats
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramFollowers, setIgF] = useState('');
  const [facebookFollowers, setFbF] = useState('');
  const [tiktokFollowers, setTtF] = useState('');
  const [youtubeSubscribers, setYtF] = useState('');
  const [reach, setReach] = useState('');
  const [engagement, setEngagement] = useState('');
  // AI-generated content — editable/deletable
  const [headline, setHeadline] = useState('');
  const [biography, setBiography] = useState('');
  const [skills, setSkills] = useState(''); // comma-separated in the UI
  const [brandSummary, setBrandSummary] = useState('');
  // lists
  const [experiences, setExperiences] = useState<ExperienceInput[]>([]);
  const [pricing, setPricing] = useState<PricingInput[]>([]);
  const [projects, setProjects] = useState<ProjectInput[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  useEffect(() => {
    api
      .getPortfolio(id)
      .then((p: Record<string, unknown>) => {
        setFullName(str(p.fullName));
        setGender(str(p.gender));
        setProfession(str(p.profession) || 'influencer');
        setLocation(str(p.location));
        setEmail(str(p.email));
        setPhone(str(p.phone));
        setDescription(str(p.description));
        setTagline(str(p.tagline));
        setInstagramUrl(str(p.instagramUrl));
        setFacebookUrl(str(p.facebookUrl));
        setTiktokUrl(str(p.tiktokUrl));
        setYoutubeUrl(str(p.youtubeUrl));
        setIgF(p.instagramFollowers != null ? String(p.instagramFollowers) : '');
        setFbF(p.facebookFollowers != null ? String(p.facebookFollowers) : '');
        setTtF(p.tiktokFollowers != null ? String(p.tiktokFollowers) : '');
        setYtF(p.youtubeSubscribers != null ? String(p.youtubeSubscribers) : '');
        setReach(p.reach != null ? String(p.reach) : '');
        setEngagement(p.engagement != null ? String(p.engagement) : '');
        setHeadline(str(p.headline));
        setBiography(str(p.biography));
        setSkills(Array.isArray(p.skills) ? (p.skills as string[]).join(', ') : '');
        setBrandSummary(str(p.brandSummary));
        setExperiences(
          ((p.experiences as ExperienceInput[]) ?? []).map((e) => ({
            type: e.type, title: e.title, role: e.role ?? '', year: e.year ?? '',
          })),
        );
        setPricing(((p.pricing as PricingInput[]) ?? []) as PricingInput[]);
        setProjects(((p.projects as ProjectInput[]) ?? []) as ProjectInput[]);
        setPhotos(
          ((p.photos as { id: string; url: string; isCover: boolean }[]) ?? []).map((ph) => ({
            id: ph.id, url: ph.url, isCover: ph.isCover,
          })),
        );
      })
      .catch((e) => toast.error(`Chargement impossible : ${(e as Error).message}`))
      .finally(() => setLoading(false));
  }, [id]);

  // ---- list helpers ----
  const addExp = () => setExperiences((x) => [...x, { type: 'acting_credit', title: '', role: '', year: '' }]);
  const upExp = (i: number, patch: Partial<ExperienceInput>) =>
    setExperiences((x) => x.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const rmExp = (i: number) => setExperiences((x) => x.filter((_, j) => j !== i));

  const addPrice = () => setPricing((x) => [...x, { category: 'reels', label: '', currency: 'TND' }]);
  const upPrice = (i: number, patch: Partial<PricingInput>) =>
    setPricing((x) => x.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const rmPrice = (i: number) => setPricing((x) => x.filter((_, j) => j !== i));

  const addProj = () => setProjects((x) => [...x, { title: '', category: '', description: '', featured: false }]);
  const upProj = (i: number, patch: Partial<ProjectInput>) =>
    setProjects((x) => x.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const rmProj = (i: number) => setProjects((x) => x.filter((_, j) => j !== i));

  async function uploadProjectImage(i: number, file: File | null) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) { toast.error('Format non supporté'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error('Image trop volumineuse'); return; }
    try {
      const meta = await uploadToCloudinaryWithProgress(file, () => {});
      upProj(i, { imageUrl: meta.url });
      toast.success('Image du projet ajoutée');
    } catch (e) {
      toast.error(`Échec de l’envoi : ${(e as Error).message}`);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!ACCEPTED.includes(file.type)) { toast.error(`${file.name} : format non supporté`); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`${file.name} : trop volumineux`); continue; }
        const meta = await uploadToCloudinaryWithProgress(file, () => {});
        const created = await api.registerPhoto(id, { ...meta, isCover: photos.length === 0 });
        setPhotos((p) => [...p, { id: created.id, url: meta.url, isCover: created.isCover }]);
      }
    } catch (e) {
      toast.error(`Échec de l’envoi : ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  }
  async function removePhoto(photoId: string) {
    const prev = photos;
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    try { await api.deletePhoto(id, photoId); } catch (e) { setPhotos(prev); toast.error((e as Error).message); }
  }

  async function saveAll() {
    await api.updatePortfolio(id, {
      fullName, gender: gender || undefined, profession, location, email,
      phone: phone || undefined, description: description || undefined, tagline: tagline || undefined,
      instagramUrl: instagramUrl || undefined, facebookUrl: facebookUrl || undefined,
      tiktokUrl: tiktokUrl || undefined, youtubeUrl: youtubeUrl || undefined,
      instagramFollowers: num(instagramFollowers), facebookFollowers: num(facebookFollowers),
      tiktokFollowers: num(tiktokFollowers), youtubeSubscribers: num(youtubeSubscribers),
      reach: num(reach), engagement: num(engagement),
      // AI content — send literal values so edits/deletions persist (empty clears).
      headline, biography, brandSummary,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
    });
    await api.setExperiences(
      id,
      experiences
        .filter((e) => e.title.trim())
        .map((e) => ({ type: e.type, title: e.title, role: e.role || undefined, year: e.year || undefined })),
    );
    await api.setPricing(
      id,
      pricing
        // Keep a row if it has a label OR a price — don't silently drop a
        // category (e.g. "Live") just because the label was left blank.
        .filter((p) => p.label.trim() || p.priceMin != null || p.priceMax != null)
        .map((p) => ({
          category: p.category,
          label: p.label.trim() || CATEGORY_FR[p.category] || p.category,
          priceMin: p.priceMin ? Number(p.priceMin) : undefined,
          priceMax: p.priceMax ? Number(p.priceMax) : undefined,
          currency: p.currency || 'TND',
        })),
    );
    await api.setProjects(
      id,
      projects
        .filter((p) => p.title.trim())
        .map((p) => ({
          title: p.title,
          category: p.category || undefined,
          description: p.description || undefined,
          imageUrl: p.imageUrl || undefined,
          featured: !!p.featured,
        })),
    );
  }

  async function onSave() {
    if (!fullName.trim() || !location.trim() || !email.trim()) {
      toast.error('Nom, localisation et email sont obligatoires.');
      return;
    }
    setBusy(true);
    try { await saveAll(); toast.success('Enregistré.'); }
    catch (e) { toast.error(`Enregistrement échoué : ${(e as Error).message}`); }
    finally { setBusy(false); }
  }

  async function onGenerate() {
    if (!fullName.trim() || !location.trim() || !email.trim()) {
      toast.error('Nom, localisation et email sont obligatoires.');
      return;
    }
    setBusy(true);
    try {
      await saveAll();
      const res = await api.generate(id, 'all');
      setResult(res.output);
      toast.success('Portfolio généré ✨ Redirection…');
      router.push(`/portfolio/${id}`);
    } catch (e) {
      toast.error(`Génération échouée : ${(e as Error).message}`);
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-500">Chargement…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Toaster />
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-black">← Tableau de bord</Link>
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Générer le portfolio</h1>
      <p className="mt-1 mb-8 text-sm text-neutral-500">
        Données pré-remplies depuis le profil. Complétez les statistiques et tarifs, puis générez.
      </p>

      <div className="grid gap-8">
        {/* Identité */}
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Identité</h2>
          <div className={field}>
            <Label>Nom complet *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={field}>
              <Label>Profession *</Label>
              <select className={selectCls} value={profession} onChange={(e) => setProfession(e.target.value)}>
                {PROFESSIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className={field}>
              <Label>Genre</Label>
              <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">—</option>
                <option value="female">Femme</option>
                <option value="male">Homme</option>
                <option value="non-binary">Non-binaire</option>
                <option value="prefer_not">Ne se prononce pas</option>
              </select>
            </div>
          </div>
          <div className={field}>
            <Label>Localisation *</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Tunis, Tunisie" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={field}><Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className={field}><Label>Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className={field}>
            <Label>Accroche (tagline)</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Optionnel — sous-titre du portfolio" />
          </div>
          <div className={field}>
            <Label>Description (sert à l’IA)</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </section>

        {/* Réseaux + stats admin */}
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Réseaux & audience</h2>
          <p className="text-xs text-neutral-400">Les chiffres d’abonnés sont saisis par l’admin (depuis les statistiques Instagram/TikTok/YouTube).</p>
          {[
            ['Instagram', instagramUrl, setInstagramUrl, instagramFollowers, setIgF],
            ['Facebook', facebookUrl, setFacebookUrl, facebookFollowers, setFbF],
            ['TikTok', tiktokUrl, setTiktokUrl, tiktokFollowers, setTtF],
            ['YouTube', youtubeUrl, setYoutubeUrl, youtubeSubscribers, setYtF],
          ].map(([label, url, setUrl, cnt, setCnt]) => (
            <div key={label as string} className="grid grid-cols-[1fr_140px] gap-2">
              <Input placeholder={`${label} — URL`} value={url as string}
                onChange={(e) => (setUrl as (v: string) => void)(e.target.value)} />
              <Input type="number" placeholder="abonnés" value={cnt as string}
                onChange={(e) => (setCnt as (v: string) => void)(e.target.value)} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className={field}>
              <Label>Reach</Label>
              <Input type="number" placeholder="ex : 250000" value={reach}
                onChange={(e) => setReach(e.target.value)} />
            </div>
            <div className={field}>
              <Label>Engagement (%)</Label>
              <Input type="number" placeholder="ex : 12" value={engagement}
                onChange={(e) => setEngagement(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Contenu généré par l'IA — modifiable */}
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Contenu du portfolio (modifiable)</h2>
          <p className="text-xs text-neutral-400">
            Texte généré par l’IA. Modifiez ou supprimez librement, puis cliquez « Enregistrer »
            (sans regénérer, sinon l’IA écrase vos changements).
          </p>
          <div className={field}>
            <Label>Accroche (headline)</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className={field}>
            <Label>Biographie — section « À propos »</Label>
            <Textarea rows={6} value={biography} onChange={(e) => setBiography(e.target.value)} />
          </div>
          <div className={field}>
            <Label>Compétences (séparées par des virgules)</Label>
            <Textarea rows={2} value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="Photographie, Direction artistique, Storytelling" />
          </div>
          <div className={field}>
            <Label>Marque personnelle (brand summary)</Label>
            <Textarea rows={4} value={brandSummary} onChange={(e) => setBrandSummary(e.target.value)} />
          </div>
        </section>

        {/* Expérience */}
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Expérience</h2>
          {experiences.map((exp, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr_110px_80px_auto] items-center gap-2">
              <select className={selectCls} value={exp.type} onChange={(e) => upExp(i, { type: e.target.value as ExperienceInput['type'] })}>
                <option value="acting_credit">Crédit</option>
                <option value="brand_collab">Marque</option>
                <option value="other">Autre</option>
              </select>
              <Input placeholder="Titre / marque" value={exp.title} onChange={(e) => upExp(i, { title: e.target.value })} />
              <Input placeholder="Rôle" value={exp.role ?? ''} onChange={(e) => upExp(i, { role: e.target.value })} />
              <Input placeholder="Année" value={exp.year ?? ''} onChange={(e) => upExp(i, { year: e.target.value })} />
              <button type="button" onClick={() => rmExp(i)} className="text-neutral-400 hover:text-black">×</button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addExp}>+ Ajouter une expérience</Button>
        </section>

        {/* Tarifs */}
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Tarifs</h2>
          {pricing.map((p, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr_90px_90px_70px_auto] items-center gap-2">
              <select className={selectCls} value={p.category} onChange={(e) => upPrice(i, { category: e.target.value })}>
                <option value="reels">Reels</option>
                <option value="stories">Stories</option>
                <option value="live">Live</option>
                <option value="events">Événements</option>
                <option value="other">Autre</option>
              </select>
              <Input placeholder="Libellé (ex: Reel Instagram)" value={p.label} onChange={(e) => upPrice(i, { label: e.target.value })} />
              <Input type="number" placeholder="min" value={p.priceMin ?? ''} onChange={(e) => upPrice(i, { priceMin: e.target.value ? Number(e.target.value) : undefined })} />
              <Input type="number" placeholder="max" value={p.priceMax ?? ''} onChange={(e) => upPrice(i, { priceMax: e.target.value ? Number(e.target.value) : undefined })} />
              <Input placeholder="TND" value={p.currency ?? 'TND'} onChange={(e) => upPrice(i, { currency: e.target.value })} />
              <button type="button" onClick={() => rmPrice(i)} className="text-neutral-400 hover:text-black">×</button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addPrice}>+ Ajouter un tarif</Button>
        </section>

        {/* Projets */}
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Projets</h2>
          {projects.map((p, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-neutral-200 p-3">
              <div className="grid grid-cols-[1fr_160px_auto] items-center gap-2">
                <Input placeholder="Titre du projet" value={p.title} onChange={(e) => upProj(i, { title: e.target.value })} />
                <Input placeholder="Catégorie" value={p.category ?? ''} onChange={(e) => upProj(i, { category: e.target.value })} />
                <label className="flex items-center gap-1 text-xs text-neutral-600">
                  <input type="checkbox" checked={!!p.featured} onChange={(e) => upProj(i, { featured: e.target.checked })} /> En vedette
                </label>
              </div>
              <Textarea rows={2} placeholder="Description courte" value={p.description ?? ''} onChange={(e) => upProj(i, { description: e.target.value })} />
              <div className="flex items-center gap-3">
                {p.imageUrl && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
                    <button type="button" onClick={() => upProj(i, { imageUrl: undefined })} aria-label="Retirer l’image"
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs text-neutral-700 hover:bg-black hover:text-white">×</button>
                  </div>
                )}
                <label className="cursor-pointer text-xs font-medium text-neutral-600 underline-offset-2 hover:underline">
                  {p.imageUrl ? 'Changer l’image' : '+ Image du projet'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { uploadProjectImage(i, e.target.files?.[0] ?? null); e.target.value = ''; }} />
                </label>
              </div>
              <button type="button" onClick={() => rmProj(i)} className="w-fit text-xs text-neutral-400 hover:text-black">Supprimer</button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addProj}>+ Ajouter un projet</Button>
        </section>

        {/* Photos */}
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Photos</h2>
          <label className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-6 text-center hover:bg-neutral-50 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <span className="text-2xl text-neutral-400">＋</span>
            <span className="text-sm font-medium">{photos.length ? 'Ajouter d’autres photos' : 'Cliquez pour ajouter des photos'}</span>
            <span className="text-xs text-neutral-500">JPG, PNG ou WebP · {MAX_MB}Mo max{photos.length ? ` · ${photos.length} ajoutée(s)` : ''}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
          </label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative h-24 w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-24 w-24 rounded object-cover" />
                  <button type="button" onClick={() => removePhoto(p.id)} aria-label="Supprimer"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-black hover:text-white">×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-3 border-t border-neutral-200 pt-6">
          <Button variant="outline" onClick={onSave} disabled={busy}>Enregistrer</Button>
          <Button onClick={onGenerate} disabled={busy}>
            {busy ? 'Génération…' : 'Enregistrer & Générer ✨'}
          </Button>
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <article className="mt-10 border border-neutral-200 bg-white p-6">
          <h2 className="font-serif text-3xl font-semibold">{fullName}</h2>
          <p className="mt-1 text-sm uppercase tracking-wide text-neutral-500">
            {PROFESSIONS.find(([v]) => v === profession)?.[1]} · {location}
          </p>
          <p className="mt-4 text-lg italic text-neutral-700">{result.headline}</p>
          <section className="mt-6">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Biographie</h3>
            <p className="whitespace-pre-line leading-relaxed text-neutral-800">{result.biography}</p>
          </section>
          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Compétences</h3>
            <div className="flex flex-wrap gap-2">
              {result.skills.map((s) => (
                <span key={s} className="border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide">{s}</span>
              ))}
            </div>
          </section>
          <section className="mt-6">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Marque personnelle</h3>
            <p className="leading-relaxed text-neutral-800">{result.brandSummary}</p>
          </section>
          <div className="mt-8 flex gap-3">
            <Link href={`/portfolio/${id}`} className="inline-flex h-9 items-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-neutral-800">Ouvrir le portfolio</Link>
            <Button variant="outline" onClick={onGenerate} disabled={busy}>Regénérer</Button>
            <Link href="/dashboard" className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-100">Terminer</Link>
          </div>
        </article>
      )}
    </main>
  );
}
