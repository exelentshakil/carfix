import "./globals.css";

export const metadata = {
  title: "AI Car Damage Assessment",
  description: "AI-powered vehicle damage assessment tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
