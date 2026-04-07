"use client";

import { motion } from "framer-motion";

export default function HeroHeader() {
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-20 flex h-screen w-screen items-start justify-center pt-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
        style={{ mixBlendMode: "difference" }}
      >
        <h1
          className="whitespace-nowrap font-black text-black"
          style={{
            fontSize: '68px',
            lineHeight: '0.88',
            letterSpacing: '-0.06em',
            fontWeight: 900,
          }}
        >
          <div className="flex flex-col">
            <span>a mosaic</span>
            <span>by anne</span>
            {/* <span style={{ fontSize: '51px' }}>(BO®S / 2025)</span> */}
          </div>
        </h1>
      </motion.div>
    </div>
  );
}
