"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StickyNoteProps {
  id: string;
  initialText?: string;
  color: string;
  rotation: number;
  x: number;
  y: number;
  isDeleteMode: boolean;
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
}

export default function StickyNote({
  id,
  initialText = "",
  color,
  rotation,
  x,
  y,
  isDeleteMode,
  onDelete,
  onTextChange,
  onPositionChange,
}: StickyNoteProps) {
  const [text, setText] = useState(initialText);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Helper function to convert color to pastel gradient
  const getColorGradient = (colorHex: string) => {
    if (colorHex === '#FEF08A' || colorHex.toLowerCase() === 'yellow') {
      return 'linear-gradient(135deg, #fff5cc 0%, #ffecb3 50%, #ffe299 100%)';
    } else if (colorHex === '#BBF7D0' || colorHex.toLowerCase() === 'green') {
      return 'linear-gradient(135deg, #d5f4d5 0%, #c1ecc1 50%, #ade4ad 100%)';
    }
    return colorHex;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(id, newText);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleteMode && !isDeleting) {
      setIsDeleting(true);
      setTimeout(() => onDelete(id), 600);
    }
  };

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          drag={!isDeleteMode && !isFocused}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ left: 0, right: 5808, top: 0, bottom: window.innerHeight - 192 }}
          onDragEnd={(e, info) => {
            const newX = x + info.offset.x;
            const newY = y + info.offset.y;
            onPositionChange(id, newX, newY);
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: isDeleteMode 
              ? [rotation - 0.5, rotation + 0.5, rotation - 0.5]
              : rotation,
            x: 0,
            y: 0,
          }}
          exit={{ 
            y: 1000, 
            rotate: rotation + (Math.random() * 40 - 20),
            opacity: 0,
            transition: { duration: 0.6, ease: "easeIn" }
          }}
          transition={isDeleteMode ? {
            rotate: {
              duration: 0.15,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }
          } : {
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className="absolute"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            zIndex: 50,
            cursor: isDeleteMode ? 'pointer' : (isFocused ? 'text' : 'grab'),
            pointerEvents: isDeleting ? 'none' : 'auto',
          }}
          whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
          onClick={handleClick}
        >
          {/* Sticky note */}
          <motion.div
            className="relative w-48 h-48 shadow-lg overflow-hidden"
            style={{
              background: getColorGradient(color),
            }}
          >
            {/* Paper texture overlay */}
            {(color === '#FEF08A' || color.toLowerCase() === 'yellow') && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url("/assets/yellownote.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  mixBlendMode: 'multiply',
                  opacity: 0.3,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            )}
            {(color === '#BBF7D0' || color.toLowerCase() === 'green') && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url("/assets/greennote.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  mixBlendMode: 'multiply',
                  opacity: 0.3,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            )}
            
            {/* Text area */}
            <textarea
              value={text}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type here..."
              disabled={isDeleteMode}
              className={`relative w-full h-full p-4 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 ${
                isDeleteMode ? 'pointer-events-none' : ''
              }`}
              style={{
                fontFamily: "'Indie Flower', 'Comic Sans MS', cursive",
                fontSize: '14px',
                lineHeight: '1.4',
                zIndex: 2,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


