"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Item } from "@/types/item";
import styles from "./DetailsPanel.module.css";

type BoardBg =
  | { type: "color"; value: string }
  | { type: "image"; value: string };

type DetailsPanelProps = {
  item: Item | null;
  onClose: () => void;
};

export default function DetailsPanel({ item, onClose }: DetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const aboveImageRef = useRef<HTMLImageElement | null>(null);
  const carouselWrapRef = useRef<HTMLDivElement | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);
  const detailWrapRef = useRef<HTMLDivElement | null>(null);
  const detailImageRef = useRef<HTMLImageElement | null>(null);
  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  const boardBackgrounds: BoardBg[] = [
    { type: "color", value: "#ffffff" },
    { type: "color", value: "#dedede" },
  ];

  const [bgCommitted, setBgCommitted] = useState<BoardBg>(boardBackgrounds[0]);
  const [bgOverlay, setBgOverlay] = useState<BoardBg | null>(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [detailIndex, setDetailIndex] = useState(0);

  const cycleBackground = () => {
    const nextIndex = (bgIndex + 1) % boardBackgrounds.length;
    const nextBackground = boardBackgrounds[nextIndex];
    const overlay = overlayRef.current;

    setBgIndex(nextIndex);

    if (!overlay) {
      setBgCommitted(nextBackground);
      setBgOverlay(null);
      return;
    }

    setBgOverlay(nextBackground);

    requestAnimationFrame(() => {
      const overlayElement = overlayRef.current;
      if (!overlayElement) return;

      gsap.killTweensOf(overlayElement);
      gsap.set(overlayElement, {
        opacity: 0,
        scale: 1.015,
        transformOrigin: "50% 50%",
      });

      gsap.to(overlayElement, {
        opacity: 1,
        scale: 1,
        duration: 0.65,
        ease: "power2.out",
        onComplete: () => {
          setBgCommitted(nextBackground);
          setBgOverlay(null);
        },
      });
    });
  };

  const aboveImage = useMemo(() => {
    const src = item?.images?.above?.[0];
    return typeof src === "string" && src.length ? src : null;
  }, [item]);

  const detailedImages = useMemo(() => {
    const images = item?.images?.detailed;
    return Array.isArray(images) ? images.filter((src): src is string => !!src) : [];
  }, [item]);

  const detailImage = useMemo(() => {
    if (!detailedImages.length) return null;
    return detailedImages[detailIndex] ?? null;
  }, [detailedImages, detailIndex]);

  const showPrevDetail = () => {
    if (!detailedImages.length) return;
    setDetailIndex((prev) => (prev === 0 ? detailedImages.length - 1 : prev - 1));
  };

  const showNextDetail = () => {
    if (!detailedImages.length) return;
    setDetailIndex((prev) => (prev === detailedImages.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!item) return;

    const board = boardRef.current;
    const wrap = carouselWrapRef.current;
    const slideElement = slideRef.current;
    const titleElement = titleRef.current;
    const detailWrap = detailWrapRef.current;

    if (!board || !wrap || !slideElement || !titleElement || !detailWrap) return;

    masterTlRef.current?.kill();
    masterTlRef.current = null;

    const text = String(item.name ?? "").toUpperCase();
    titleElement.innerHTML = Array.from(text)
      .map(
        (character) =>
          `<span class="${styles.dpLetter}">${character === " " ? "&nbsp;" : character}</span>`
      )
      .join("");

    const letters = titleElement.querySelectorAll<HTMLElement>(`.${styles.dpLetter}`);

    const placeTitle = () => {
      const rect = board.getBoundingClientRect();
      const padX = 28;
      const padY = 22;
      const lift = 28;

      titleElement.style.left = `${rect.left + padX}px`;
      titleElement.style.top = `${rect.bottom - padY - lift}px`;
      titleElement.style.transform = "translateY(-100%)";
    };

    placeTitle();
    const onResize = () => placeTitle();
    window.addEventListener("resize", onResize);

    gsap.killTweensOf([board, wrap, slideElement, letters, detailWrap]);

    gsap.set(board, { xPercent: 120, opacity: 1 });
    gsap.set(wrap, { opacity: 1 });
    gsap.set(slideElement, { y: window.innerHeight * 0.9, opacity: 1 });
    gsap.set(detailWrap, {
      opacity: 0,
      scale: 0.92,
      y: 30,
    });
    gsap.set(letters, {
      y: -window.innerHeight * 1.1,
      x: (index: number) => (index % 2 === 0 ? -14 : 14),
      opacity: 1,
    });
    gsap.set(board, { filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))" });

    const timeline = gsap.timeline();

    timeline
      .to(board, {
        xPercent: -2,
        duration: 0.9,
        ease: "power4.out",
      })
      .to(
        board,
        {
          xPercent: 0,
          duration: 1.5,
          ease: "power2.out",
        },
        ">-0.25"
      )
      .to(
        board,
        {
          filter: "drop-shadow(30px 30px 18px rgba(0,0,0,0.25))",
          duration: 2,
          ease: "power2.out",
        },
        0
      )
      .to(
        slideElement,
        {
          y: "50%",
          duration: 1.4,
          ease: "power3.out",
        },
        0.35
      )
      .to(
        detailWrap,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.1,
          ease: "power3.out",
        },
        0.55
      )
      .to(
        letters,
        {
          y: 14,
          x: 0,
          duration: 1,
          ease: "power4.in",
          stagger: { amount: 0.28, from: "start" },
        },
        0.42
      )
      .to(
        letters,
        {
          y: 0,
          duration: 0.65,
          ease: "back.out(1.3)",
          stagger: { amount: 0.12, from: "start" },
        },
        ">-0.2"
      );

    masterTlRef.current = timeline;

    return () => {
      window.removeEventListener("resize", onResize);
      masterTlRef.current?.kill();
      masterTlRef.current = null;
      titleElement.innerHTML = "";
    };
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;

    const image = aboveImageRef.current;
    if (!image) return;

    gsap.killTweensOf(image);
    gsap.set(image, {
      rotate: -18,
      transformOrigin: "58% 56%",
    });

    const tween = gsap.to(image, {
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

    const image = detailImageRef.current;
    if (!image) return;

    gsap.killTweensOf(image);
    gsap.fromTo(
      image,
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

    return () => {
      gsap.killTweensOf(image);
    };
  }, [item?.id, detailImage]);

  const bgStyle = (background: BoardBg): React.CSSProperties =>
    background.type === "color"
      ? { backgroundColor: background.value, backgroundImage: "none" }
      : {
          backgroundImage: `url(${background.value})`,
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
      <div>
        <h1
          ref={titleRef}
          className={styles.dpTitleSingle}
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

              {detailedImages.length > 1 ? (
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
              ) : null}
            </div>
          ) : null}
        </div>

        <div ref={carouselWrapRef} className={styles.dpVCarouselWrap}>
          <div className={styles.dpVStage}>
            <div
              ref={slideRef}
              className={styles.dpVSingleSlide}
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
                  style={{
                    width: "58vw",
                    height: "58vw",
                    maxWidth: "820px",
                    maxHeight: "820px",
                    minWidth: "440px",
                    minHeight: "440px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <img
                    ref={aboveImageRef}
                    className={styles.dpVImg}
                    src={aboveImage}
                    alt={`${item.name ?? "Item"} above`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      userSelect: "none",
                      pointerEvents: "none",
                      willChange: "transform",
                      transform: "translate(5%, 3%) scale(1.06)",
                    }}
                  />
                </div>
              ) : (
                <div>No above image found.</div>
              )}
            </div>
          </div>
        </div>

        <div ref={boardRef} className={styles.cheeseBoard} style={bgStyle(bgCommitted)}>
          <div
            ref={overlayRef}
            className={styles.cheeseBoardBgOverlay}
            style={bgOverlay ? bgStyle(bgOverlay) : { opacity: 0 }}
            aria-hidden="true"
          />

          <button type="button" onClick={onClose} aria-label="Close details" className={styles.dpClose}>
            x
          </button>

          <button
            className={`${styles.boardBgBtn} ${styles.boardBgBtnRefined}`}
            onClick={cycleBackground}
            aria-label="Change board background"
          >
            <span className={styles.boardBgBtnIcon}>⟳</span>
            <span className={styles.boardBgBtnLabel}>Change background</span>
          </button>
        </div>
      </div>
    </div>
  );
}
