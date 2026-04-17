"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/types/item";
import GalleryViewport from "./GalleryViewport";
import MobileHomeViewport from "./MobileHomeViewport";

type ResponsiveHomeViewportProps = {
  items: Item[];
};

const mobileMediaQuery = "(max-width: 699px)";

export default function ResponsiveHomeViewport({ items }: ResponsiveHomeViewportProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileMediaQuery);

    const syncViewport = () => {
      setIsMobile(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  if (isMobile === null) {
    return null;
  }

  return isMobile ? <MobileHomeViewport items={items} /> : <GalleryViewport items={items} />;
}
