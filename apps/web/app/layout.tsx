// Root layout — minimal shell for html/body + AuthProvider
// Locale-specific rendering happens in app/[locale]/layout.tsx
// Admin pages render outside locale wrapper

import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { getLocale } from "next-intl/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#F5F0E8]">
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#D4A574] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
          >
            Skip to content
          </a>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
