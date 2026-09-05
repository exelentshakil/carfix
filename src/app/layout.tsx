import "./globals.css";

export const metadata = {
  title: "CarFix US — AI Auto Collision Estimator & VIN Recognition",
  description: "US auto collision damage assessment, VIN vehicle decoding, and OEM parts estimating.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
