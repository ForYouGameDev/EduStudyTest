import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EduTest AI — Learn. Practice. Test. Improve.", template: "%s | EduTest AI" },
  description: "A thoughtful exam-preparation platform for focused practice, mock tests and measurable progress."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="min-h-screen font-sans antialiased">{children}</body></html>;
}
