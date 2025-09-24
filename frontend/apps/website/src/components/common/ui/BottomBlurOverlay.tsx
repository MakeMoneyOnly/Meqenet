"use client";
import React from "react";

/**
 * BottomBlurOverlay (subtle, transparent, glassy, with smooth horizontal fade)
 * Fixed at the bottom of the viewport, creates a subtle blurred gradient effect
 * with faded left/right edges for a premium look.
 */
export default function BottomBlurOverlay() {
  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 w-full h-20 z-50"
      aria-hidden="true"
      style={{
        background:
          "linear-gradient(to top, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.08) 85%, rgba(255,255,255,0) 100%)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        transition: "background 0.3s, backdrop-filter 0.3s",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    />
  );
}
