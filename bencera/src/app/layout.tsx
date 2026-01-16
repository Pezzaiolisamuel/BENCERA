import "./globals.css";

export const metadata = {
  title: "BENCERA Gallery",
  description: "Gallery app",
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
          width: "device-width",
          initialScale: 1,
          maximumScale: 1,
          userScalable: false,
        }}
      >
        {children}
      </body>
    </html>
  );
}
