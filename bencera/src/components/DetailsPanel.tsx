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

  // Center image wrapper
  const carouselWrapRef = useRef<HTMLDivElement | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);

  // Master sequence timeline
  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  type BoardBg =
    | { type: "color"; value: string }
    | { type: "image"; value: string };

  const BOARD_BACKGROUNDS: BoardBg[] = [
    { type: "color", value: "#ffffff" },
    { type: "color", value: "#dedede" },
  ];

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [bgCommitted, setBgCommitted] = useState(BOARD_BACKGROUNDS[0]);
  const [bgOverlay, setBgOverlay] = useState<BoardBg | null>(null);

  const [bgIndex, setBgIndex] = useState(0);

  const cycleBackground = () => {
    setBgIndex((i) => (i + 1) % BOARD_BACKGROUNDS.length);
  };

  const heroImage: string | null = useMemo(() => {
    const src = item?.images?.above?.[0];
    return typeof src === "string" && src.length ? src : null;
  }, [item]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;

    const board = boardRef.current;
    const wrap = carouselWrapRef.current;
    const slideEl = slideRef.current;
    const titleEl = titleRef.current;

    if (!board || !wrap || !slideEl || !titleEl) return;

    masterTlRef.current?.kill();
    masterTlRef.current = null;

    const text = String(item?.name ?? "").toUpperCase();
    titleEl.innerHTML = Array.from(text)
      .map((ch) => `<span class="dp-letter">${ch === " " ? "&nbsp;" : ch}</span>`)
      .join("");

    const letters = titleEl.querySelectorAll<HTMLElement>(".dp-letter");

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

    const tl = gsap.timeline();

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

    tl.to(
      board,
      {
        filter: "drop-shadow(30px 30px 18px rgba(0,0,0,0.25))",
        duration: 2.0,
        ease: "power2.out",
      },
      0
    );

    tl.to(
      slideEl,
      {
        y: "50%",
        duration: 1.4,
        ease: "power3.out",
      },
      0.35
    );

    tl.to(
      letters,
      {
        y: 14,
        x: 0,
        duration: 1,
        ease: "power4.in",
        stagger: { amount: 0.28, from: "start" },
      },
      0.42
    ).to(
      letters,
      {
        y: 0,
        duration: 0.65,
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

  useEffect(() => {
    if (!item) return;

    const img = imageRef.current;
    if (!img) return;

    gsap.killTweensOf(img);
    gsap.set(img, {
      rotate: -18,
      transformOrigin: "50% 50%",
    });

    const tween = gsap.to(img, {
      rotate: 18,
      duration: 18,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    return () => {
      tween.kill();
    };
  }, [item?.id, heroImage]);

  useEffect(() => {
    const next = BOARD_BACKGROUNDS[bgIndex];
    const overlay = overlayRef.current;

    if (!overlay) {
      setBgCommitted(next);
      setBgOverlay(null);
      return;
    }

    setBgOverlay(next);

    requestAnimationFrame(() => {
      const el = overlayRef.current;
      if (!el) return;

      gsap.killTweensOf(el);

      gsap.set(el, { opacity: 0, scale: 1.015, transformOrigin: "50% 50%" });

      gsap.to(el, {
        opacity: 1,
        scale: 1,
        duration: 0.65,
        ease: "power2.out",
        onComplete: () => {
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

        <div
          ref={carouselWrapRef}
          className="dp-vCarouselWrap"
          style={{
            position: "fixed",
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 200,
            overflow: "visible",
          }}
        >
          <div
            className="dp-vStage"
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
            }}
          >
        <div
  ref={slideRef}
  className="dp-vSingleSlide"
  style={{
    position: "absolute",
    right: 0,
    bottom: 0,
    willChange: "transform",
    zIndex: 201,
  }}
>
              {heroImage ? (
                <div
                  className="dp-imageSizer"
                  style={{
                    width: "72vw",
                    maxWidth: "1100px",
                    aspectRatio: "1 / 1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <img
                    ref={imageRef}
                    className="dp-vImg"
                    src={heroImage}
                    alt={`${item.name} hero`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      userSelect: "none",
                      pointerEvents: "none",
                      willChange: "transform",
                    }}
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