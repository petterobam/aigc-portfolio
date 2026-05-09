import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "欧阳洁 | AIGC技术咨询专家 - 帮助企业快速落地 AI 应用",
  description: "AIGC 技术咨询专家欧阳洁，帮助企业用 AI 提升效率。提供技术咨询、定制开发、培训课程、技术评估服务。",
  keywords: "AIGC, 人工智能, AI 咨询, LangChain, RAG, 提示词工程, AI 应用开发, 欧阳洁",
  authors: [{ name: "欧阳洁", url: "https://github.com/petterobam" }],
  openGraph: {
    title: "欧阳洁 | AIGC技术咨询专家",
    description: "帮助企业用 AI 提升效率。技术咨询、定制开发、培训课程。",
    url: "https://aigc-portfolio-rho.vercel.app",
    siteName: "欧阳洁",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "欧阳洁 | AIGC技术咨询专家",
    description: "帮助企业用 AI 提升效率。技术咨询、定制开发、培训课程。",
  },
  metadataBase: new URL("https://aigc-portfolio-rho.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
