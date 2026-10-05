// app/[locale]/blog/[slug]/page.tsx — Blog article detail page (Server Component)
// Fetches article by slug, converts Tiptap JSON → HTML server-side, renders with prose styles

export const dynamic = 'force-dynamic';

import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl, rewriteMediaUrlsInHtml } from '@/lib/media-url';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';

interface TiptapDoc {
  type: 'doc';
  content: Record<string, unknown>[];
}

interface Article {
  id: string;
  slug: string;
  title: { vi: string; ko: string };
  excerpt: { vi: string; ko: string };
  content: { vi: TiptapDoc | string; ko: TiptapDoc | string } | string;
  coverUrl: string | null;
  tags: string[];
  publishedAt: string | null;
  featured: boolean;
  author: { name: string };
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3101';

async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_URL}/articles/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<Article>;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: 'Not found' };

  const title = localizedText(article.title, locale);
  const description = localizedText(article.excerpt, locale);

  return {
    title: `${title} | K-Beauty Spa`,
    description,
    openGraph: {
      title,
      description,
      ...(article.coverUrl && { images: [article.coverUrl] }),
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'blog' });
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const htmlContent = renderArticleContent(article.content, locale);

  const title = localizedText(article.title, locale);
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#a08070] hover:text-[#B76E79] transition-colors mb-8"
      >
        ← {t('pageTitle')}
      </Link>

      {/* Cover image */}
      {article.coverUrl && (
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(article.coverUrl)}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2.5 py-0.5 rounded-full bg-[#f9e8e8] text-[#B76E79] font-medium hover:bg-[#B76E79] hover:text-white transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#3d2c2c] leading-tight mb-3">
        {title}
      </h1>

      {/* Meta: author + date */}
      <div className="flex items-center gap-3 text-sm text-[#a08070] mb-8 pb-8 border-b border-[#e8ddd4]">
        <span>{article.author.name}</span>
        {formattedDate && (
          <>
            <span>·</span>
            <time>{t('publishedAt')} {formattedDate}</time>
          </>
        )}
      </div>

      {/* Article body — Tiptap HTML rendered with Tailwind prose */}
      <article
        className="prose prose-stone max-w-none prose-headings:text-[#3d2c2c] prose-a:text-[#B76E79] prose-strong:text-[#3d2c2c]"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </main>
  );
}

function renderArticleContent(content: Article['content'], locale: string) {
  if (typeof content === 'string') return rewriteMediaUrlsInHtml(ensureHtml(content));

  const localized = content[locale as 'vi' | 'ko'] ?? content.vi;
  if (typeof localized === 'string') return rewriteMediaUrlsInHtml(ensureHtml(localized));

  return rewriteMediaUrlsInHtml(generateHTML(localized, [StarterKit, Image, TiptapLink]));
}

function ensureHtml(value: string) {
  if (!value.trim()) return '';
  return value.trim().startsWith('<') ? value : `<p>${escapeHtml(value)}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
