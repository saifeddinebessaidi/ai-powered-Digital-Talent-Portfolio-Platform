// Typed client for the NestJS API.
// Auth is currently disabled on the backend (DISABLE_AUTH=true) for local testing,
// so no Authorization header is sent. When auth is re-enabled, add the host token here.

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export interface ExperienceInput {
  type: 'acting_credit' | 'brand_collab' | 'other';
  title: string;
  role?: string;
  year?: string;
  note?: string;
}

export interface GenOutput {
  headline: string;
  biography: string;
  skills: string[];
  brandSummary: string;
}

export interface UploadSig {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
}

export interface AdminRow {
  id: string;
  fullName: string;
  profession: string;
  location: string;
  status: string;
  slug: string | null;
  hasGenerated: boolean;
}

export interface PricingInput {
  category: string;
  label: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
}

export interface ProjectInput {
  title: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
}

export const api = {
  // Admin dashboard
  listPortfolios: () => request<AdminRow[]>('/admin/portfolios'),
  // Create a brand-new blank talent (fresh user) and return its id.
  createUser: () => request<{ id: string }>('/admin/portfolios', { method: 'POST' }),

  ensurePortfolio: () => request<{ id: string }>('/portfolios', { method: 'POST' }),
  getPortfolio: (id: string) => request<Record<string, unknown>>(`/portfolios/${id}`),
  updatePortfolio: (id: string, body: Record<string, unknown>) =>
    request(`/portfolios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  setExperiences: (id: string, experiences: ExperienceInput[]) =>
    request(`/portfolios/${id}/experiences`, {
      method: 'PUT',
      body: JSON.stringify({ experiences }),
    }),
  setPricing: (id: string, pricing: PricingInput[]) =>
    request(`/portfolios/${id}/pricing`, {
      method: 'PUT',
      body: JSON.stringify({ pricing }),
    }),
  setProjects: (id: string, projects: ProjectInput[]) =>
    request(`/portfolios/${id}/projects`, {
      method: 'PUT',
      body: JSON.stringify({ projects }),
    }),
  uploadSignature: () => request<UploadSig>('/uploads/signature'),
  registerPhoto: (id: string, body: Record<string, unknown>) =>
    request<{ id: string; url: string; isCover: boolean }>(
      `/portfolios/${id}/photos`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  deletePhoto: (id: string, photoId: string) =>
    request(`/portfolios/${id}/photos/${photoId}`, { method: 'DELETE' }),
  setCover: (id: string, photoId: string) =>
    request(`/portfolios/${id}/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCover: true }),
    }),
  generate: (id: string, section = 'all') =>
    request<{ jobId: string; status: string; output: GenOutput }>(
      `/portfolios/${id}/generate`,
      { method: 'POST', body: JSON.stringify({ section }) },
    ),
};

/** Direct browser → Cloudinary signed upload (keeps the API secret server-side). */
export async function uploadToCloudinary(file: File) {
  const sig = await api.uploadSignature();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) detail = body.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const d = (await res.json()) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
  return {
    cloudinaryPublicId: d.public_id,
    url: d.secure_url,
    width: d.width,
    height: d.height,
  };
}

export interface UploadedPhoto {
  cloudinaryPublicId: string;
  url: string;
  width: number;
  height: number;
}

/**
 * Same signed upload, but via XMLHttpRequest so we get real upload progress
 * (fetch() can't report upload progress). `onProgress` receives 0–100.
 */
export async function uploadToCloudinaryWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadedPhoto> {
  const sig = await api.uploadSignature();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  return new Promise<UploadedPhoto>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const d = JSON.parse(xhr.responseText) as {
          public_id: string;
          secure_url: string;
          width: number;
          height: number;
        };
        resolve({
          cloudinaryPublicId: d.public_id,
          url: d.secure_url,
          width: d.width,
          height: d.height,
        });
      } else {
        let detail = xhr.statusText;
        try {
          detail =
            (JSON.parse(xhr.responseText) as { error?: { message?: string } })?.error
              ?.message ?? detail;
        } catch {
          /* ignore */
        }
        reject(new Error(detail));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}
