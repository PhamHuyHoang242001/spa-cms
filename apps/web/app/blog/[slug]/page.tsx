// app/blog/[slug]/page.tsx — Blog article detail page (Server Component)
// Fetches article by slug, converts Tiptap JSON → HTML server-side, renders with prose styles
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

interface TiptapDoc {
  type: 'doc';
  content: Record<string, unknown>[];
}

interface Article {
  id: string;
  slug: string;
  title: { vi: string; ko: string };
  excerpt: { vi: string; ko: string };
  content: { vi: TiptapDoc; ko: TiptapDoc };
  coverUrl: string | null;
  tags: string[];
  publishedAt: string | null;
  featured: boolean;
  author: { name: string };
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function fetchArticle(slug: string): Promise<Article | null> {
  const res = await fetch(`${API_URL}/articles/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<Article>;
}

// ── generateMetadata ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: 'Bài viết không tồn tại' };

  return {
    title: `${article.title.vi} | K-Beauty Spa`,
    description: article.excerpt.vi,
    openGraph: {
      title: article.title.vi,
      description: article.excerpt.vi,
      ...(article.coverUrl && { images: [article.coverUrl] }),
    },
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  // Convert Tiptap JSON → HTML on the server using vi content
  const htmlContent = generateHTML(article.content.vi, [StarterKit, Image, Link]);

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Back link */}
      <a
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#a08070] hover:text-[#B76E79] transition-colors mb-8"
      >
        ← Quay lại Blog
      </a>

      {/* Cover image */}
      {article.coverUrl && (
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverUrl}
            alt={article.title.vi}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.map((tag) => (
            <a
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2.5 py-0.5 rounded-full bg-[#f9e8e8] text-[#B76E79] font-medium hover:bg-[#B76E79] hover:text-white transition-colors"
            >
              {tag}
            </a>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#3d2c2c] leading-tight mb-3">
        {article.title.vi}
      </h1>

      {/* Meta: author + date */}
      <div className="flex items-center gap-3 text-sm text-[#a08070] mb-8 pb-8 border-b border-[#e8ddd4]">
        <span>Bởi {article.author.name}</span>
        {formattedDate && (
          <>
            <span>·</span>
            <time>{formattedDate}</time>
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
