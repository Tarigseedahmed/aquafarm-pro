'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  // Screen reader support
  announceToScreenReader: (message: string) => void;
  
  // High contrast mode
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  
  // Font size scaling
  fontSize: number;
  setFontSize: (size: number) => void;
  
  // Focus management
  focusElement: (selector: string) => void;
  
  // Keyboard navigation
  isKeyboardNavigation: boolean;
  setKeyboardNavigation: (enabled: boolean) => void;
  
  // Reduced motion
  prefersReducedMotion: boolean;
  
  // Color blind support
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');

  // Screen reader announcements
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Focus management
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  // Toggle high contrast
  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
  };

  // Set font size
  const handleSetFontSize = (size: number) => {
    setFontSize(Math.max(12, Math.min(24, size)));
  };

  // Set color blind mode
  const handleSetColorBlindMode = (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    setColorBlindMode(mode);
  };

  // Set keyboard navigation
  const handleSetKeyboardNavigation = (enabled: boolean) => {
    setIsKeyboardNavigation(enabled);
  };

  // Detect system preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    root.style.fontSize = `${fontSize}px`;
    
    // Apply high contrast
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply color blind mode
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (colorBlindMode !== 'none') {
      root.classList.add(colorBlindMode);
    }
    
    // Apply reduced motion
    if (prefersReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Apply keyboard navigation
    if (isKeyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }, [fontSize, isHighContrast, colorBlindMode, prefersReducedMotion, isKeyboardNavigation]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardNavigation) return;
      
      // Skip links for keyboard navigation
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isKeyboardNavigation]);

  const value: AccessibilityContextType = {
    announceToScreenReader,
    isHighContrast,
    toggleHighContrast,
    fontSize,
    setFontSize: handleSetFontSize,
    focusElement,
    isKeyboardNavigation,
    setKeyboardNavigation: handleSetKeyboardNavigation,
    prefersReducedMotion,
    colorBlindMode,
    setColorBlindMode: handleSetColorBlindMode,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
