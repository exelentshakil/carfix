import "./globals.css";

export const metadata = {
  title: "CarFix US — Enterprise AI Collision Appraisal & VIN Forensics",
  description: "Automated vehicle damage photogrammetry, US NHTSA VIN cross-audit, and OEM collision repair estimating.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-[#06080e] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
