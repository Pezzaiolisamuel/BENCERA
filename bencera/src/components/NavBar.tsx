export default function NavBar() {
  return (
    <div className="nav">
      <div className="logo">BENCERA</div>
      <a
        className="navIcon"
        href="https://bencera.myshopify.com/"
        aria-label="Open Bencera shop"
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/2430/2430422.png"
          alt=""
          width={40}
          height={40}
        />
      </a>
    </div>
  );
}
