"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

type BoardBg =
  | { type: "color"; value: string }
  | { type: "image"; value: string };

type ItemImageGroup = {
  above?: string[];
  detailed?: string[];
  background?: string[];
  howToUse?: string[];
};

type ItemType = {
  id?: string | number;
  name?: string;
  shortDescription?: string;
  images?: ItemImageGroup;
};

type DetailsPanelProps = {
  item: ItemType | null;
  onClose: () => void;
};

export default function DetailsPanel({
  item,
  onClose,
}: DetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Bottom-right "above" image
  const aboveImageRef = useRef<HTMLImageElement | null>(null);
  const carouselWrapRef = useRef<HTMLDivElement | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);

  // Centered "detailed" image
  const detailWrapRef = useRef<HTMLDivElement | null>(null);
  const detailImageRef = useRef<HTMLImageElement | null>(null);

  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  const BOARD_BACKGROUNDS: BoardBg[] = [
    { type: "color", value: "#ffffff" },
    { type: "color", value: "#dedede" },
  ];

  const [bgCommitted, setBgCommitted] = useState<BoardBg>(BOARD_BACKGROUNDS[0]);
  const [bgOverlay, setBgOverlay] = useState<BoardBg | null>(null);
  const [bgIndex, setBgIndex] = useState(0);

  const cycleBackground = () => {
    setBgIndex((i) => (i + 1) % BOARD_BACKGROUNDS.length);
  };

  const aboveImage: string | null = useMemo(() => {
    const src = item?.images?.above?.[0];
    return typeof src === "string" && src.length ? src : null;
  }, [item]);

  const detailedImages: string[] = useMemo(() => {
    const imgs = item?.images?.detailed;
    return Array.isArray(imgs) ? imgs.filter((src): src is string => !!src) : [];
  }, [item]);

  const [detailIndex, setDetailIndex] = useState(0);

  const detailImage: string | null = useMemo(() => {
    if (!detailedImages.length) return null;
    return detailedImages[detailIndex] ?? null;
  }, [detailedImages, detailIndex]);

  useEffect(() => {
    setDetailIndex(0);
  }, [item?.id]);

  const showPrevDetail = () => {
    if (!detailedImages.length) return;
    setDetailIndex((prev) =>
      prev === 0 ? detailedImages.length - 1 : prev - 1
    );
  };

  const showNextDetail = () => {
    if (!detailedImages.length) return;
    setDetailIndex((prev) =>
      prev === detailedImages.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    if (!item) return;

    const board = boardRef.current;
    const wrap = carouselWrapRef.current;
    const slideEl = slideRef.current;
    const titleEl = titleRef.current;
    const detailWrap = detailWrapRef.current;

    if (!board || !wrap || !slideEl || !titleEl || !detailWrap) return;

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

    gsap.killTweensOf([board, wrap, slideEl, letters, detailWrap]);

    gsap.set(board, { xPercent: 120, opacity: 1 });
    gsap.set(wrap, { opacity: 1 });
    gsap.set(slideEl, { y: window.innerHeight * 0.9, opacity: 1 });

    gsap.set(detailWrap, {
      opacity: 0,
      scale: 0.92,
      y: 30,
    });

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
      detailWrap,
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
      },
      0.55
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

    const img = aboveImageRef.current;
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
  }, [item?.id, aboveImage]);

  useEffect(() => {
    if (!item) return;

    const img = detailImageRef.current;
    if (!img) return;

    gsap.killTweensOf(img);

    gsap.fromTo(
      img,
      {
        opacity: 0,
        scale: 0.92,
        y: 20,
        rotate: -2,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        rotate: 0,
        duration: 0.45,
        ease: "power3.out",
      }
    );

    const floatTween = gsap.to(img, {
      y: -10,
      rotate: 2,
      duration: 8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    return () => {
      floatTween.kill();
    };
  }, [item?.id, detailImage]);

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
      : {
          backgroundImage: `url(${bg.value})`,
          backgroundColor: "transparent",
        };

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
        padding: 0,
        zIndex: 10,
      }}
    >
      <div className="dp">
       

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

        {/* Center detailed image + carousel controls */}
        <div
          ref={detailWrapRef}
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            zIndex: 7000,
          }}
        >
          {detailImage ? (
            <div
              style={{
                position: "relative",
                width: "42vw",
                maxWidth: 620,
                minWidth: 280,
                aspectRatio: "1 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                ref={detailImageRef}
                src={detailImage}
                alt={`${item.name ?? "Item"} detailed ${detailIndex + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  userSelect: "none",
                  pointerEvents: "none",
                  willChange: "transform",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.22))",
                }}
              />

              {detailedImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevDetail}
                    aria-label="Previous detail image"
                    style={{
                      position: "absolute",
                      left: -70,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 7600,
                      pointerEvents: "auto",
                      width: 52,
                      height: 52,
                      borderRadius: "999px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "rgba(255,255,255,0.92)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      cursor: "pointer",
                      fontSize: 24,
                      lineHeight: "1",
                    }}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNextDetail}
                    aria-label="Next detail image"
                    style={{
                      position: "absolute",
                      right: -70,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 7600,
                      pointerEvents: "auto",
                      width: 52,
                      height: 52,
                      borderRadius: "999px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "rgba(255,255,255,0.92)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      cursor: "pointer",
                      fontSize: 24,
                      lineHeight: "1",
                    }}
                  >
                    ›
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -34,
                      transform: "translateX(-50%)",
                      zIndex: 7600,
                      pointerEvents: "auto",
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.92)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {detailIndex + 1} / {detailedImages.length}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Bottom-right above image */}
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
              {aboveImage ? (
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
                    ref={aboveImageRef}
                    className="dp-vImg"
                    src={aboveImage}
                    alt={`${item.name ?? "Item"} above`}
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

        <div
          ref={boardRef}
          className="cheese-board"
          style={bgStyle(bgCommitted)}
        >
          <div
            ref={overlayRef}
            className="cheese-board__bgOverlay"
            style={bgOverlay ? bgStyle(bgOverlay) : { opacity: 0 }}
            aria-hidden="true"
          />
           <button
          onClick={onClose}
          aria-label="Close details"
          style={{
            position: "relative",
            top: 24,
            right: "-90%",
            zIndex: 9500,
            width: 52,
            height: 52,
            borderRadius: "999px",
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            cursor: "pointer",
            fontSize: 28,
            lineHeight: "1",
            display: "grid",
            placeItems: "center",
          }}
        >
          ×
        </button>

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
