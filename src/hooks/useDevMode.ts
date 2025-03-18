import { useState, useEffect } from 'react';

export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState(() => {
    const stored = localStorage.getItem('devMode');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('devMode', JSON.stringify(isDevMode));
  }, [isDevMode]);

  return [isDevMode, setIsDevMode] as const;
} 