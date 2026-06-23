import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: "BENCERA Gallery",
  description: "Gallery app",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          height: "100vh",
          overflow: "hidden",
          width: "device-width"
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
