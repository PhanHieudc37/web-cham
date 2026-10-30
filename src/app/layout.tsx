import { Be_Vietnam_Pro } from "next/font/google";
import { getPageMetadata } from "@/server/services/seo.service";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata() { return getPageMetadata({ path: "/" }); }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
