import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PortfolioGenOutput } from '@portfolio/shared';
import {
  LlmProvider,
  PortfolioGenInput,
  Section,
} from './llm-provider.interface';

const PROFESSION_FR: Record<string, string> = {
  actress: 'actrice',
  actor: 'acteur',
  model: 'mannequin',
  influencer: 'influenceur/influenceuse',
  content_creator: 'créateur/créatrice de contenu',
  other: 'professionnel(le)',
};

const SYSTEM = `Tu es un rédacteur professionnel de portfolios pour talents (acteurs, mannequins, influenceurs, créateurs).
Tu écris UNIQUEMENT en FRANÇAIS, dans un style soigné, moderne et professionnel.

RÈGLES STRICTES (très important) :
- Rédige EXCLUSIVEMENT à partir des informations de CETTE personne, fournies ci-dessous. Ne mélange JAMAIS avec une autre personne.
- N'invente JAMAIS : pas de ville, pas de pays, pas de profession, pas de marque, pas de crédit, pas de chiffre qui ne soit pas explicitement donné.
- Utilise EXACTEMENT la profession et la localisation indiquées. Si la profession est « influenceur », n'écris jamais « acteur ». Si la ville est « Tunis », n'écris jamais « Paris ».
- Ne mentionne des chiffres d'audience (followers/abonnés) QUE s'ils sont fournis ci-dessous.
- Si une information manque, contourne-la naturellement — ne fabrique rien.
- "skills" : un tableau de 3 à 10 compétences courtes, en français.
- Réponds UNIQUEMENT par du JSON valide : { "headline": string, "biography": string, "skills": string[], "brandSummary": string }.`;

function buildUserPrompt(i: PortfolioGenInput): string {
  const professionFr = PROFESSION_FR[i.profession] ?? i.profession;
  const exp =
    i.experiences
      .map(
        (e) =>
          `- ${e.type}: ${e.title}${e.role ? `, ${e.role}` : ''}${
            e.year ? `, ${e.year}` : ''
          }${e.note ? `; ${e.note}` : ''}`,
      )
      .join('\n') || '- (aucune fournie)';

  const ig = i.followers?.instagram
    ? ` (${i.followers.instagram} abonnés)`
    : '';
  const fb = i.followers?.facebook
    ? ` (${i.followers.facebook} abonnés)`
    : '';
  const tt = i.followers?.tiktok ? ` (${i.followers.tiktok} abonnés)` : '';
  const yt = i.followers?.youtube
    ? ` (${i.followers.youtube} abonnés)`
    : '';

  return `Rédige le portfolio de CETTE personne uniquement.

CONTRAINTES ABSOLUES :
- Profession (à utiliser telle quelle) : ${professionFr}
- Localisation (à utiliser telle quelle) : ${i.location}

PROFIL
- Nom : ${i.fullName}
- Profession : ${professionFr}
- Genre : ${i.gender ?? '—'}
- Localisation : ${i.location}
- Description par la personne : ${i.description ?? '—'}

EXPÉRIENCE
${exp}

RÉSEAUX SOCIAUX (liens + audience auto-déclarée ; ne cite les chiffres que s'ils sont présents)
- Instagram : ${i.socials.instagram ?? '—'}${ig}
- Facebook : ${i.socials.facebook ?? '—'}${fb}
- TikTok : ${i.socials.tiktok ?? '—'}${tt}
- YouTube : ${i.socials.youtube ?? '—'}${yt}

Rédige en FRANÇAIS : headline (accroche courte), biography (2 à 4 courts paragraphes), skills (5 à 10), brandSummary (2 à 3 phrases). JSON uniquement.`;
}

@Injectable()
export class GroqProvider implements LlmProvider {
  // Groq is OpenAI-compatible — same SDK, just a different baseURL/model.
  private client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  });

  async generate(
    input: PortfolioGenInput,
    _section: Section = 'all',
  ): Promise<{ output: PortfolioGenOutput; tokensUsed?: number }> {
    const res = await this.client.chat.completions.create({
      model: process.env.AI_MODEL ?? 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.4, // lower = more faithful to the provided facts
      max_tokens: 1200,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? '{}';
    const output = PortfolioGenOutput.parse(JSON.parse(raw));
    return { output, tokensUsed: res.usage?.total_tokens };
  }
}
