import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';

const INK_COLORS_LOWER = ['amber', 'amethyst', 'emerald', 'ruby', 'sapphire', 'steel'] as const;

function extractColorsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return INK_COLORS_LOWER.filter(c => lower.includes(c));
}

function parseDreamborn(html: string): string[] {
  // Look for SVG references like /images/ruby.svg, /images/sapphire.svg
  const svgMatches = html.match(/\/images\/(amber|amethyst|emerald|ruby|sapphire|steel)\.svg/gi);
  if (svgMatches) {
    const found = svgMatches.map(m => m.match(/(amber|amethyst|emerald|ruby|sapphire|steel)/i)![0].toLowerCase());
    return [...new Set(found)];
  }
  return extractColorsFromText(html);
}

function parseLorcanito(html: string): string[] {
  // Try meta description: "Disney Lorcana deck with amethyst, emerald"
  const metaMatch = html.match(/content="[^"]*(?:deck with|Colors:)\s*([^"]+)"/i);
  if (metaMatch) {
    const colors = extractColorsFromText(metaMatch[1]);
    if (colors.length > 0) return colors;
  }
  return extractColorsFromText(html);
}

async function parseDuelsInk(url: string): Promise<string[]> {
  // duels.ink has a JSON API: /api/decks/{id}
  // URL format: https://duels.ink/decks/{id}/view -> API: https://duels.ink/api/decks/{id}
  const match = url.match(/duels\.ink\/decks\/([^/]+)/);
  if (!match) return [];

  const apiUrl = `https://duels.ink/api/decks/${match[1]}`;
  const response = await fetch(apiUrl, {
    headers: { 'User-Agent': 'LorcanaTracker/1.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const colors: string[] = data.deck?.colors || data.colors || [];
  return colors.filter(c => INK_COLORS_LOWER.includes(c.toLowerCase() as any)).map(c => c.toLowerCase());
}

function parseInkdecks(html: string): string[] {
  return extractColorsFromText(html);
}

export async function extractDeckColors(req: AuthRequest, res: Response) {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL requise' });
    return;
  }

  const allowed = ['dreamborn.ink', 'db.lorcanito.com', 'lorcanito.com', 'duels.ink', 'inkdecks.com'];
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    res.status(400).json({ error: 'URL invalide' });
    return;
  }

  if (!allowed.some(d => hostname === d || hostname.endsWith('.' + d))) {
    res.status(400).json({ error: 'Site non supporté. Sites acceptés : dreamborn.ink, lorcanito.com, duels.ink, inkdecks.com' });
    return;
  }

  try {
    let colors: string[];

    if (hostname.includes('duels.ink')) {
      // duels.ink: use their JSON API directly
      colors = await parseDuelsInk(url);
    } else {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'LorcanaTracker/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        res.status(400).json({ error: `Impossible de charger la page (${response.status})` });
        return;
      }

      const html = await response.text();

      if (hostname.includes('dreamborn.ink')) {
        colors = parseDreamborn(html);
      } else if (hostname.includes('lorcanito.com')) {
        colors = parseLorcanito(html);
      } else {
        colors = parseInkdecks(html);
      }
    }

    if (colors.length === 0) {
      res.status(404).json({ error: 'Impossible de détecter les couleurs du deck' });
      return;
    }

    const inkColors = colors.map(c => c.toUpperCase());
    res.json({ colors: inkColors });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      res.status(408).json({ error: 'Timeout lors du chargement de la page' });
      return;
    }
    res.status(500).json({ error: 'Erreur lors de la récupération du deck' });
  }
}
