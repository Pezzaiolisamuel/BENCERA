import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "700"],
});

export default function NavBar() {
  return (
    <div className={`nav ${inter.className}`}>
      <div className="brand">
        <img className="brandIcon" src="/brand-icon.png" alt="" width={40} height={40} />
        <div className="logo">Bencera</div>
      </div>
      <a
        className="navIcon"
        href="https://bencera.myshopify.com/collections/all"
        aria-label="Open Bencera shop"
      >
        <span style={{ marginBottom: "-14px" }}>Shop All</span>
      </a>
    </div>
  );
}
