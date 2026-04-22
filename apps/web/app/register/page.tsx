'use client';

// register/page.tsx — Register page with name, email, password, phone (optional) fields

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { registerSchema } from '@spa/shared';
import type { RegisterInput } from '@spa/shared';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fields, setFields] = useState<RegisterInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
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

    // Strip empty phone so it becomes undefined for optional validation
    const payload = { ...fields, phone: fields.phone || undefined };

    const result = registerSchema.safeParse(payload);
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
      await register(result.data);
      router.push('/');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (hasError?: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-[#3d2b25] placeholder-[#c4a99f] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 transition ${
      hasError
        ? 'border-red-300'
        : 'border-[#ddd0ca] focus:border-[#B76E79]'
    }`;

  return (
    <main className="min-h-screen bg-[#FFFFF0] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#3d2b25] tracking-wide">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#8a6a62]">
            Join K-Beauty Spa and book your first treatment
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
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-[#6b4c41] mb-1.5 uppercase tracking-wider"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={fields.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={inputClass(fieldErrors.name)}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#6b4c41] mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass(fieldErrors.email)}
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
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={fields.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className={inputClass(fieldErrors.password)}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-[#6b4c41] mb-1.5 uppercase tracking-wider"
              >
                Phone{' '}
                <span className="normal-case text-[#a08070] font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={fields.phone ?? ''}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                className={inputClass(fieldErrors.phone)}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#B76E79] py-2.5 text-sm font-medium text-white hover:bg-[#a35d68] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-[#8a6a62]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#B76E79] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
