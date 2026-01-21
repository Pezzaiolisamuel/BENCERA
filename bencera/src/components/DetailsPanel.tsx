"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

export default function DetailsPanel({ item, onClose }: any) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Title
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  // Cheeseboard
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Image in cheeseboard
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Center image wrapper (keeps same structure as your old carousel)
  const carouselWrapRef = useRef<HTMLDivElement | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);

  // Master sequence timeline (board -> plate -> title)
  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  // (kept for compatibility; not used now)
  // const detailedImages: string[] = useMemo(() => {
  //   if (!item) return [];
  //   const maybe = item?.images?.detailed ?? [];
  //   return Array.isArray(maybe) ? maybe.filter(Boolean) : [];
  // }, [item]);

  type BoardBg =
    | { type: "color"; value: string }
    | { type: "image"; value: string };

  const BOARD_BACKGROUNDS: BoardBg[] = [
    // images from /public/images/
    { type: "image", value: "/uploads/images/blackandwhitewood.avif" },
    { type: "image", value: "/uploads/images/darkwood.avif" },
    { type: "image", value: "/uploads/images/cristal.avif" },
    { type: "image", value: "/uploads/images/lightwood.avif" },

    // solid colors
    { type: "color", value: "#ffffff" },
    { type: "color", value: "#dedede" },
    { type: "color", value: "#000000" },
    { type: "color", value: "bisque" },
    { type: "color", value: "brown" },
    { type: "color", value: "goldenrod" },


  ];

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [bgCommitted, setBgCommitted] = useState(BOARD_BACKGROUNDS[0]);
  const [bgOverlay, setBgOverlay] = useState<BoardBg | null>(null);


  const [bgIndex, setBgIndex] = useState(0);

  const cycleBackground = () => {
    setBgIndex((i) => (i + 1) % BOARD_BACKGROUNDS.length);
  };



  // ✅ This is what you want displayed in the middle (the "above" image)
  const heroImage: string | null = useMemo(() => {
    const src = item?.images?.above?.[0];
    return typeof src === "string" && src.length ? src : null;
  }, [item]);

  const [active, setActive] = useState(0);

  // Reset on new item (kept for compatibility)
  useEffect(() => {
    setActive(0);
  }, [item?.id]);

  /**
   * Master intro:
   * 1) Cheese-board enters from right (slow + premium)
   * 2) Plate/hero image enters from bottom
   * 3) Title letters fall from top and stop at board bottom-left
   */
  useEffect(() => {
    if (!item) return;

    const board = boardRef.current;
    const wrap = carouselWrapRef.current;
    const slideEl = slideRef.current;
    const titleEl = titleRef.current;

    if (!board || !wrap || !slideEl || !titleEl) return;

    masterTlRef.current?.kill();
    masterTlRef.current = null;

    // ---------- Build title spans ----------
    const text = String(item?.name ?? "").toUpperCase();
    titleEl.innerHTML = Array.from(text)
      .map((ch) => `<span class="dp-letter">${ch === " " ? "&nbsp;" : ch}</span>`)
      .join("");

    const letters = titleEl.querySelectorAll<HTMLElement>(".dp-letter");

    // ---------- Place title at cheese-board bottom-left ----------
    const placeTitle = () => {
      const r = board.getBoundingClientRect();
      const PAD_X = 28;
      const PAD_Y = 22;
      const LIFT = 28;

      titleEl.style.left = `${r.left + PAD_X}px`;
      titleEl.style.top = `${r.bottom - PAD_Y - LIFT}px`;
      titleEl.style.transform = "translateY(-100%)";
    };

    placeTitle();
    const onResize = () => placeTitle();
    window.addEventListener("resize", onResize);

    // ---------- Initial states ----------
    gsap.killTweensOf([board, wrap, slideEl, letters]);

    gsap.set(board, { xPercent: 120, opacity: 1 });
    gsap.set(wrap, { opacity: 1 });
    gsap.set(slideEl, { y: window.innerHeight * 0.9, opacity: 1 });

    gsap.set(letters, {
      y: -window.innerHeight * 1.1,
      x: (i: number) => (i % 2 === 0 ? -14 : 14),
      opacity: 1,
    });

    gsap.set(board, { filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))" });

    // ---------- Timeline (tighter overlaps) ----------
    const tl = gsap.timeline();

    // 1) Board enters
    tl.to(board, {
      xPercent: -2,
      duration: 0.9,
      ease: "power4.out",
    }).to(
      board,
      {
        xPercent: 0,
        duration: 1.5,
        ease: "power2.out",
      },
      ">-0.25"
    );

    // shadow ramp (shorter, matches faster feel)
    tl.to(
      board,
      {
        filter: "drop-shadow(30px 30px 18px rgba(0,0,0,0.25))",
        duration: 2.0,
        ease: "power2.out",
      },
      0
    );

    // 2) Hero image starts sooner (while board still moving)
    //    (was after board; now starts at 0.35s)
    tl.to(
      slideEl,
      {
        y: -15,
        duration: 1.4,
        ease: "power3.out",
      },
      0.35
    );

    // 3) Title starts almost with image
    tl.to(
      letters,
      {
        y: 14,
        x: 0,
        duration: 1,
        ease: "power4.in",
        stagger: { amount: 0.28, from: "start" }, // slightly tighter stagger
      },
      0.42
    ).to(
      letters,
      {
        y: 0,
        duration: .65,
        ease: "back.out(1.3)",
        stagger: { amount: 0.12, from: "start" },
      },
      ">-0.2"
    );

    masterTlRef.current = tl;

    return () => {
      window.removeEventListener("resize", onResize);
      masterTlRef.current?.kill();
      masterTlRef.current = null;
      if (titleRef.current) titleRef.current.innerHTML = "";
    };
  }, [item?.id]);


  // Slow premium rotation (independent, starts once image exists)
  useEffect(() => {
    if (!item) return;

    const img = imageRef.current;
    if (!img) return;

    gsap.killTweensOf(img);
    gsap.set(img, { rotate: 0, transformOrigin: "50% 50%" });

    const tween = gsap.to(img, {
      rotate: 360,
      duration: 80,
      ease: "none",
      repeat: -1,
    });

    return () => {
      tween.kill();
    };
  }, [item?.id, heroImage]);

  useEffect(() => {
    const next = BOARD_BACKGROUNDS[bgIndex];
    const overlay = overlayRef.current;

    // first time / no overlay: just commit
    if (!overlay) {
      setBgCommitted(next);
      setBgOverlay(null);
      return;
    }

    // put next bg on overlay
    setBgOverlay(next);

    requestAnimationFrame(() => {
      const el = overlayRef.current;
      if (!el) return;

      gsap.killTweensOf(el);

      // start slightly zoomed (for image backgrounds)
      gsap.set(el, { opacity: 0, scale: 1.015, transformOrigin: "50% 50%" });

      gsap.to(el, {
        opacity: 1,
        scale: 1,
        duration: 0.65,       // ✅ smoother
        ease: "power2.out",
        onComplete: () => {
          // commit and clear overlay
          setBgCommitted(next);
          setBgOverlay(null);
        },
      });
    });
  }, [bgIndex]);

  const bgStyle = (bg: BoardBg): React.CSSProperties =>
  bg.type === "color"
    ? { backgroundColor: bg.value, backgroundImage: "none" }
    : { backgroundImage: `url(${bg.value})`, backgroundColor: "transparent" };


  if (!item) return null;

  return (
    <div
      ref={panelRef}
      style={{
        width: item ? "100vw" : "0",
        height: "100%",
        transition: "width 0.35s cubic-bezier(.2,.8,.2,1)",
        background: "transparent",
        overflow: "hidden",
        position: "relative",
        padding: "0",
        zIndex: 10,
      }}
    >
      <div className="dp">
        <button className="dp-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* Single title (position is set dynamically relative to cheeseboard) */}
        <h1
          ref={titleRef}
          className="dp-title dp-title--single"
          style={{
            position: "fixed",
            zIndex: 5000,
            background: "transparent",
            margin: 0,
            padding: 0,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        />

        {/* Center stage shows ABOVE image (hero) */}
        <div ref={carouselWrapRef} className="dp-vCarouselWrap">
          <div className="dp-vStage">
            <div ref={slideRef} className="dp-vSingleSlide">
              {heroImage ? (
                <div className="dp-imageSizer">
                  <img
                    ref={imageRef}
                    className="dp-vImg"
                    src={heroImage}
                    alt={`${item.name} hero`}
                  />
                </div>
              ) : (
                <div className="dp-empty">No “above” image found.</div>
              )}
            </div>
          </div>
        </div>

      <div ref={boardRef} className="cheese-board" style={bgStyle(bgCommitted)}>
  <div
    ref={overlayRef}
    className="cheese-board__bgOverlay"
    style={bgOverlay ? bgStyle(bgOverlay) : { opacity: 0 }}
    aria-hidden="true"
  />

  <button
    className="board-bg-btn board-bg-btn--refined"
    onClick={cycleBackground}
    aria-label="Change board background"
  >
    <span className="board-bg-btn__icon">⟳</span>
    <span className="board-bg-btn__label">Change background</span>
  </button>
</div>


        <p className="dp-desc">{item.shortDescription}</p>
      </div>
    </div>
  );
}
