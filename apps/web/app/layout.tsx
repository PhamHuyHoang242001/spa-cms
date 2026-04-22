import type { Metadata } from "next";
import { Geist, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "K-Beauty Spa — Trải Nghiệm Làn Da Chuẩn Hàn",
    template: "%s | K-Beauty Spa",
  },
  description:
    "K-Beauty Spa — Dịch vụ chăm sóc da và làm đẹp chuẩn Hàn Quốc tại TP. Hồ Chí Minh. Đặt lịch online dễ dàng.",
  openGraph: {
    siteName: "K-Beauty Spa",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${notoSerifKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F0E8]">
        <AuthProvider>
          {/* Skip-to-content: visible on focus for keyboard/screen-reader users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#D4A574] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
          >
            Chuyển đến nội dung chính
          </a>
          <SiteHeader />
          <main id="main-content" className="flex flex-col flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
