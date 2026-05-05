import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Border Checker | 다국가 국외 이전 컴플라이언스 검토",
  description:
    "국경 간 데이터 이전과 데이터 주권 관점의 다국가 규칙 평가를 지원하는 정책 기반 의사결정 지원 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
