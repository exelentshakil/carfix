import "./globals.css";

export const metadata = {
  title: "CarFix US — Enterprise AI Collision Appraisal & VIN Forensics",
  description: "Automated vehicle damage photogrammetry, US NHTSA VIN cross-audit, and OEM collision repair estimating.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#06080e] text-slate-100 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
