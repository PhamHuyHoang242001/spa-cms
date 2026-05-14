'use client';

// login/page.tsx — Login page with email/password form and Zod client-side validation

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { loginSchema } from '@spa/shared';
import type { LoginInput } from '@spa/shared';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();

  const [fields, setFields] = useState<LoginInput>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setServerError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    const result = loginSchema.safeParse(fields);
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(result.data);
      router.push('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFFF0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#3d2b25] tracking-wide">
            {t('loginTitle')}
          </h1>
          <p className="mt-2 text-sm text-[#8a6a62]">
            K-Beauty Spa
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#ede4de] p-8">
          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#6b4c41] mb-1.5 uppercase tracking-wider"
              >
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-[#3d2b25] placeholder-[#c4a99f] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 transition ${
                  fieldErrors.email
                    ? 'border-red-300'
                    : 'border-[#ddd0ca] focus:border-[#B76E79]'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#6b4c41] mb-1.5 uppercase tracking-wider"
              >
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={fields.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-[#3d2b25] placeholder-[#c4a99f] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 transition ${
                  fieldErrors.password
                    ? 'border-red-300'
                    : 'border-[#ddd0ca] focus:border-[#B76E79]'
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#B76E79] py-2.5 text-sm font-medium text-white hover:bg-[#a35d68] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? '…' : t('loginButton')}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-[#8a6a62]">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-[#B76E79] hover:underline font-medium">
            {t('registerLink')}
          </Link>
        </p>
      </div>
    </main>
  );
}
