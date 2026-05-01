"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  onPositionChange?: (id: string, x: number, y: number) => void;
  onPaperFallSound?: () => void;
  canvasBounds?: { width: number; height: number };
}

export default function StickyNote({
  id,
  initialText = "",
  color,
  rotation,
  x: initialX,
  y: initialY,
  isDeleteMode,
  onDelete,
  onTextChange,
  onPositionChange,
  onPaperFallSound,
  canvasBounds,
}: StickyNoteProps) {
  const [text, setText] = useState(initialText);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [zIndex, setZIndex] = useState(50);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const positionOnDragStartRef = useRef<{ x: number; y: number }>({ x: initialX, y: initialY });
  const noteRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const NOTE_WIDTH = 160;
  const NOTE_HEIGHT = 160;
  const HANDLE_SIZE = 20;

  // Update position when initialX/Y changes externally (e.g., from parent)
  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  // Boundary check to keep note within canvas bounds (memoized to prevent dependency issues)
  const constrainPosition = useMemo(() => {
    return (x: number, y: number) => {
      const padding = 20;
      
      if (canvasBounds) {
        // Use provided canvas bounds
        return {
          x: Math.max(padding, Math.min(x, canvasBounds.width - NOTE_WIDTH - padding)),
          y: Math.max(padding, Math.min(y, canvasBounds.height - NOTE_HEIGHT - padding)),
        };
      }
      
      // Fallback: just ensure minimum padding, no upper bounds
      return {
        x: Math.max(padding, x),
        y: Math.max(padding, y),
      };
    };
  }, [canvasBounds]);

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    if (isDeleteMode || isFocused) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    
    setIsDragging(true);
    setZIndex(9999); // Highest z-index while dragging
    
    // Store scroll-adjusted coordinates to handle scrolled viewports
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    dragStartRef.current = {
      x: e.clientX + scrollX,
      y: e.clientY + scrollY,
    };
    
    positionOnDragStartRef.current = { ...position };
    
    setDragOffset({ dx: 0, dy: 0 });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      // Get current scroll position
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Calculate delta using scroll-adjusted coordinates
      const deltaX = (e.clientX + scrollX) - dragStartRef.current.x;
      const deltaY = (e.clientY + scrollY) - dragStartRef.current.y;

      // Only update dragOffset for real-time visual feedback
      // Don't update position state during drag (causes effect re-runs)
      setDragOffset({ dx: deltaX, dy: deltaY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      // Get current scroll position
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      // Calculate final position from CURRENT scroll-adjusted mouse coordinates and stored reference
      // This avoids closure issue with stale dragOffset state
      const currentDeltaX = (e.clientX + scrollX) - dragStartRef.current.x;
      const currentDeltaY = (e.clientY + scrollY) - dragStartRef.current.y;
      
      const finalX = positionOnDragStartRef.current.x + currentDeltaX;
      const finalY = positionOnDragStartRef.current.y + currentDeltaY;

      // Constrain final position to viewport bounds
      const constrainedPos = constrainPosition(finalX, finalY);
      setPosition(constrainedPos);
      
      // Persist new position
      onPositionChange?.(id, constrainedPos.x, constrainedPos.y);
      
      // Reset drag state
      setIsDragging(false);
      setZIndex(50);
      dragStartRef.current = null;
      setDragOffset({ dx: 0, dy: 0 });
      document.body.style.userSelect = '';
    };

    // Use document for tracking to handle fast cursor movements
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    
    // Handle mouse leaving window
    document.addEventListener('mouseleave', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, id, onPositionChange, constrainPosition]);

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
    
    // Ignore clicks if already dragging
    if (isDragging) return;
    
    if (isDeleteMode && !isDeleting) {
      setIsDeleting(true);
      // Play paper fall sound at the start of deletion animation
      onPaperFallSound?.();
      setTimeout(() => onDelete(id), 600);
    }
  };

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          ref={noteRef}
          drag={false}
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: isDeleteMode 
              ? [rotation - 0.5, rotation + 0.5, rotation - 0.5]
              : rotation,
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
            left: `${position.x + dragOffset.dx}px`,
            top: `${position.y + dragOffset.dy}px`,
            zIndex: zIndex,
            cursor: isDragging ? 'grabbing' : (isDeleteMode ? 'pointer' : (isFocused ? 'text' : 'default')),
            pointerEvents: isDeleting ? 'none' : 'auto',
            userSelect: isDragging ? 'none' : 'auto',
          }}
          onClick={handleClick}
        >
          {/* Sticky note */}
          <motion.div
            className="relative w-40 h-40 shadow-lg overflow-hidden"
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
              spellCheck="false"
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

            {/* Drag Handle - Bottom Right Corner */}
            <div
              ref={dragHandleRef}
              onMouseDown={handleDragHandleMouseDown}
              className="absolute bottom-1 right-1 transition-opacity"
              style={{
                width: `${HANDLE_SIZE}px`,
                height: `${HANDLE_SIZE}px`,
                cursor: isDragging ? 'grabbing' : (isDeleteMode ? 'pointer' : 'grab'),
                opacity: isDragging ? 1 : 0.5,
                display: isDeleteMode ? 'none' : 'block',
                zIndex: 3,
              }}
              title="Drag handle - click and drag to move this note"
            >
              {/* Small arrow pointing to bottom-right */}
              <svg
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
                }}
              >
                {/* Arrow head pointing down-right */}
                <path
                  d="M10 16 L16 16 L16 10 Z"
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="rgba(0, 0, 0, 0.3)"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


