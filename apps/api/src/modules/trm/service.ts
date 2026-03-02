// TRM (Tasa Representativa del Mercado) — Colombian USD/COP exchange rate

const TRM_CACHE_TTL = 3_600_000; // 1 hour in ms
const TRM_API_URL = 'https://www.datos.gov.co/resource/ceyp-9c7c.json';

let cachedTRM: { rate: number; date: string; fetchedAt: number } | null = null;

export class TRMUnavailableError extends Error {
  constructor() {
    super('TRM rate is currently unavailable');
    this.name = 'TRMUnavailableError';
  }
}

export async function getCurrentTRM(): Promise<{ rate: number; date: string }> {
  // Check cache first
  if (cachedTRM && Date.now() - cachedTRM.fetchedAt < TRM_CACHE_TTL) {
    return { rate: cachedTRM.rate, date: cachedTRM.date };
  }

  try {
    const response = await fetch(`${TRM_API_URL}?$order=vigenciadesde DESC&$limit=1`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`TRM API returned ${response.status}`);

    const data = (await response.json()) as Array<{
      valor: string;
      vigenciadesde: string;
    }>;
    if (!data[0]) throw new Error('Empty TRM response');

    const rate = Number.parseFloat(data[0].valor);
    const date = data[0].vigenciadesde.slice(0, 10);

    cachedTRM = { rate, date, fetchedAt: Date.now() };
    return { rate, date };
  } catch {
    // Return stale cache if available
    if (cachedTRM) {
      return { rate: cachedTRM.rate, date: cachedTRM.date };
    }
    throw new TRMUnavailableError();
  }
}
