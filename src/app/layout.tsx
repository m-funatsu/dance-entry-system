import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import FaviconLoader from "@/components/FaviconLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2025 バルカーカップ ダンスエントリーシステム",
  description: "ダンス大会のエントリー管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // グローバルエラーハンドラー：無害なDOM操作エラーを抑制
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('removeChild') && e.filename && e.filename.includes('4bd1b696')) {
                  e.preventDefault();
                  return false;
                }
              });
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <FaviconLoader />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
