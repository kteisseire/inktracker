import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'GlimmerLog';
const SITE_URL = 'https://glimmerlog.com';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_DESCRIPTION = "L'outil complet pour suivre et analyser vos performances en tournois Disney Lorcana. Statistiques, matchups, compteur de lore et plus.";

export interface SeoProps {
  /** Page title — the site name is appended automatically unless `noSuffix` is set. */
  title: string;
  /** Meta description, also used for og:description / twitter:description. */
  description?: string;
  /** Canonical path (e.g. "/help") or full URL. Defaults to the current path is not set. */
  path?: string;
  /** Open Graph image URL. Defaults to the GlimmerLog logo. */
  image?: string;
  /** og:type — defaults to "website". */
  type?: string;
  /** Skip appending " — GlimmerLog" to the title (used on the home page). */
  noSuffix?: boolean;
  /** Optional JSON-LD structured data object(s), serialized as <script type="application/ld+json">. */
  jsonLd?: object | object[];
}

/**
 * Centralized SEO tags: title, description, canonical link, Open Graph + Twitter Card meta.
 * Defaults mirror the static tags in index.html so non-JS crawlers still get sensible values,
 * while this component overrides them per-page once React has mounted.
 */
export function Seo({ title, description, path, image, type = 'website', noSuffix, jsonLd }: SeoProps) {
  const fullTitle = noSuffix ? title : `${title} — ${SITE_NAME}`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const url = path ? (path.startsWith('http') ? path : `${SITE_URL}${path}`) : undefined;
  const ogImage = image ?? DEFAULT_IMAGE;

  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {url && <link rel="canonical" href={url} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdList.map((data, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(data)}</script>
      ))}
    </Helmet>
  );
}
