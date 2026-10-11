import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ĐIỀU EM MUỐN NÓI – Ý kiến trẻ em xã Trà Liên",
  description:
    "Nơi lắng nghe tâm tư, nguyện vọng và ý kiến của trẻ em, thanh thiếu nhi xã Trà Liên",
  keywords: "Trà Liên, Đoàn Thanh niên, ý kiến, trẻ em, thanh thiếu nhi",
  openGraph: {
    title: "ĐIỀU EM MUỐN NÓI",
    description:
      "Nơi lắng nghe tâm tư, nguyện vọng và ý kiến của trẻ em, thanh thiếu nhi xã Trà Liên",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
