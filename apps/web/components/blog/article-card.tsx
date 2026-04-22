// article-card.tsx — Blog article preview card with title, excerpt, date, tags
import Link from 'next/link';

interface ArticleCardProps {
  slug: string;
  title: { vi: string; ko: string };
  excerpt: { vi: string; ko: string };
  publishedAt: string | null;
  tags: string[];
  coverUrl?: string | null;
}

export function ArticleCard({
  slug,
  title,
  excerpt,
  publishedAt,
  tags,
  coverUrl,
}: ArticleCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-[#e8ddd4] hover:border-[#B76E79] hover:shadow-md transition-all duration-200">
        {/* Cover image or placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-[#f9e8e8] to-[#ffe4cc] flex items-center justify-center overflow-hidden">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title.vi}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">🌸</span>
          )}
        </div>

        <div className="p-5">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#f9e8e8] text-[#B76E79] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-[#3d2c2c] font-semibold text-lg leading-snug mb-2 group-hover:text-[#B76E79] transition-colors line-clamp-2">
            {title.vi}
          </h2>

          {/* Excerpt */}
          <p className="text-[#6b4c41] text-sm leading-relaxed line-clamp-3 mb-4">
            {excerpt.vi}
          </p>

          {/* Date */}
          {formattedDate && (
            <time className="text-xs text-[#a08070]">{formattedDate}</time>
          )}
        </div>
      </article>
    </Link>
  );
}
