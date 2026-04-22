// app/blog/page.tsx — Blog listing page (Server Component)
// Fetches published articles from API and renders a responsive card grid
import type { Metadata } from 'next';
import { ArticleCard } from '@/components/blog/article-card';

export const metadata: Metadata = {
  title: 'Blog K-Beauty | K-Beauty Spa',
  description: 'Khám phá các bài viết về chăm sóc da, xu hướng K-Beauty và mẹo làm đẹp từ chuyên gia.',
};

interface ArticleSummary {
  id: string;
  slug: string;
  title: { vi: string; ko: string };
  excerpt: { vi: string; ko: string };
  coverUrl: string | null;
  tags: string[];
  publishedAt: string | null;
  featured: boolean;
  author: { name: string };
}

interface ArticlesResponse {
  items: ArticleSummary[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchArticles(page = 1, tag?: string): Promise<ArticlesResponse> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
  const params = new URLSearchParams({ page: String(page) });
  if (tag) params.set('tag', tag);

  const res = await fetch(`${apiUrl}/articles?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) return { items: [], total: 0, page: 1, pageSize: 10 };
  return res.json() as Promise<ArticlesResponse>;
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageStr, tag } = await searchParams;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const { items, total, pageSize } = await fetchArticles(page, tag);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[#3d2c2c] mb-3">Blog K-Beauty</h1>
        <p className="text-[#6b4c41] text-base max-w-xl mx-auto">
          Bí quyết làm đẹp, xu hướng K-Beauty và kiến thức chăm sóc da từ chuyên gia.
        </p>
      </div>

      {/* Active tag filter badge */}
      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-[#6b4c41]">Lọc theo:</span>
          <span className="text-sm px-3 py-1 rounded-full bg-[#B76E79] text-white font-medium">
            {tag}
          </span>
          <a
            href="/blog"
            className="text-xs text-[#a08070] hover:text-[#B76E79] transition-colors ml-1"
          >
            Xóa bộ lọc ×
          </a>
        </div>
      )}

      {/* Article grid */}
      {items.length === 0 ? (
        <p className="text-center text-[#a08070] py-20">Chưa có bài viết nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((article) => (
            <ArticleCard
              key={article.id}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              coverUrl={article.coverUrl}
              tags={article.tags}
              publishedAt={article.publishedAt}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            params.set('page', String(p));
            if (tag) params.set('tag', tag);
            return (
              <a
                key={p}
                href={`/blog?${params.toString()}`}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-[#B76E79] text-white'
                    : 'border border-[#e8ddd4] text-[#6b4c41] hover:border-[#B76E79] hover:text-[#B76E79]'
                }`}
              >
                {p}
              </a>
            );
          })}
        </nav>
      )}
    </main>
  );
}
