'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { api, type AdminRow } from '@/lib/api';

const PROFESSION_FR: Record<string, string> = {
  actress: 'Actrice',
  actor: 'Acteur',
  model: 'Mannequin',
  influencer: 'Influenceur·euse',
  content_creator: 'Créateur·rice de contenu',
  other: 'Autre',
};

const STATUS_FR: Record<string, string> = {
  draft: 'Brouillon',
  generating: 'En cours',
  ready: 'Prêt',
  published: 'Publié',
};

interface Preview {
  fullName?: string;
  profession?: string;
  location?: string;
  headline?: string;
  biography?: string;
  skills?: string[];
  brandSummary?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function createUser() {
    setCreating(true);
    try {
      const { id } = await api.createUser();
      router.push(`/generate/${id}`);
    } catch (e) {
      toast.error(`Création impossible : ${(e as Error).message}`);
      setCreating(false);
    }
  }

  function load() {
    setLoading(true);
    api
      .listPortfolios()
      .then(setRows)
      .catch((e) => toast.error(`Erreur de chargement : ${e.message}`))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function openPreview(id: string) {
    setPreviewLoading(true);
    setPreview({});
    try {
      const p = (await api.getPortfolio(id)) as Preview & { skills?: unknown };
      setPreview({
        fullName: p.fullName,
        profession: p.profession,
        location: p.location,
        headline: p.headline,
        biography: p.biography,
        skills: Array.isArray(p.skills) ? (p.skills as string[]) : [],
        brandSummary: p.brandSummary,
      });
    } catch (e) {
      toast.error(`Aperçu indisponible : ${(e as Error).message}`);
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Toaster />
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Générez et consultez les portfolios des talents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Actualiser
          </Button>
          <Button size="sm" onClick={createUser} disabled={creating}>
            {creating ? 'Création…' : '+ Nouvel utilisateur'}
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nom complet</th>
              <th className="px-4 py-3 font-medium">Profession</th>
              <th className="px-4 py-3 font-medium">Localisation</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  Aucun utilisateur pour le moment.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{r.fullName || '—'}</td>
                <td className="px-4 py-3 text-neutral-700">
                  {PROFESSION_FR[r.profession] ?? r.profession}
                </td>
                <td className="px-4 py-3 text-neutral-700">{r.location || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      r.hasGenerated
                        ? 'bg-black text-white'
                        : 'border border-neutral-300 text-neutral-600'
                    }`}
                  >
                    {r.hasGenerated ? 'Généré' : (STATUS_FR[r.status] ?? r.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {r.hasGenerated ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openPreview(r.id)}>
                          Aperçu
                        </Button>
                        <Link
                          href={`/portfolio/${r.id}`}
                          className="inline-flex h-8 items-center rounded-md bg-black px-3 text-xs font-medium text-white hover:bg-neutral-800"
                        >
                          Ouvrir
                        </Link>
                        <Link
                          href={`/generate/${r.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-neutral-300 px-3 text-xs font-medium hover:bg-neutral-100"
                        >
                          Modifier
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/generate/${r.id}`}
                        className="inline-flex h-8 items-center rounded-md bg-black px-3 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        Générer le portfolio
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aperçu modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {previewLoading ? (
              <p className="text-neutral-500">Chargement de l’aperçu…</p>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold">{preview.fullName}</h2>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      {(PROFESSION_FR[preview.profession ?? ''] ?? preview.profession)} ·{' '}
                      {preview.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setPreview(null)}
                    className="text-neutral-400 hover:text-black"
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>
                {preview.headline && (
                  <p className="mb-4 text-lg italic text-neutral-700">{preview.headline}</p>
                )}
                {preview.biography && (
                  <section className="mb-4">
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Biographie
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-800">
                      {preview.biography}
                    </p>
                  </section>
                )}
                {!!preview.skills?.length && (
                  <section className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Compétences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {preview.skills.map((s) => (
                        <span key={s} className="border border-neutral-300 px-2 py-0.5 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {preview.brandSummary && (
                  <section>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Marque personnelle
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-800">{preview.brandSummary}</p>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
