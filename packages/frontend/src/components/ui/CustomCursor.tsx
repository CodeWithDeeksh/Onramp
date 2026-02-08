import React, { useEffect, useState } from 'react';

type CursorState = 'default' | 'hover' | 'active' | 'loading';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };

    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);

    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  useEffect(() => {
    // Don't show custom cursor on touch devices
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setCursorState('hover');
      }
    };

    const handleMouseLeave = () => {
      setCursorState('default');
    };

    const handleMouseDown = () => {
      setCursorState('active');
    };

    const handleMouseUp = () => {
      setCursorState('default');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible, isTouchDevice]);

  // Don't render on touch devices
  if (isTouchDevice || !isVisible) return null;

  const dotSize = cursorState === 'hover' ? 32 : cursorState === 'active' ? 24 : 8;
  const outlineSize = cursorState === 'hover' ? 48 : 40;

  return (
    <>
      {/* Cursor dot */}
      <div
        className="fixed pointer-events-none z-[9999] rounded-full bg-blue-600 transition-all duration-200 ease-out hidden md:block"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          transform: 'translate(-50%, -50%)',
          opacity: cursorState === 'hover' ? 0.8 : 1,
        }}
      />
      {/* Cursor outline */}
      <div
        className="fixed pointer-events-none z-[9998] rounded-full border-2 border-blue-600 transition-all duration-300 ease-out hidden md:block"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${outlineSize}px`,
          height: `${outlineSize}px`,
          transform: 'translate(-50%, -50%)',
          opacity: 0.3,
        }}
      />
    </>
  );
};

export default CustomCursor;
