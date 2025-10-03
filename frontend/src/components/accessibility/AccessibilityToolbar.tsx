'use client';

import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';

const AccessibilityToolbar: React.FC = () => {
  const {
    isHighContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    isKeyboardNavigation,
    setKeyboardNavigation,
    colorBlindMode,
    setColorBlindMode,
    announceToScreenReader,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const handleFontSizeIncrease = () => {
    const newSize = Math.min(24, fontSize + 2);
    setFontSize(newSize);
    announceToScreenReader(`Font size increased to ${newSize}px`);
  };

  const handleFontSizeDecrease = () => {
    const newSize = Math.max(12, fontSize - 2);
    setFontSize(newSize);
    announceToScreenReader(`Font size decreased to ${newSize}px`);
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announceToScreenReader(isHighContrast ? 'High contrast disabled' : 'High contrast enabled');
  };

  const handleKeyboardNavigationToggle = () => {
    setKeyboardNavigation(!isKeyboardNavigation);
    announceToScreenReader(isKeyboardNavigation ? 'Keyboard navigation disabled' : 'Keyboard navigation enabled');
  };

  const handleColorBlindModeChange = (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    setColorBlindMode(mode);
    const modeNames = {
      none: 'Normal colors',
      protanopia: 'Protanopia (red-blind)',
      deuteranopia: 'Deuteranopia (green-blind)',
      tritanopia: 'Tritanopia (blue-blind)',
    };
    announceToScreenReader(`Color mode changed to ${modeNames[mode]}`);
  };

  return (
    <div className="accessibility-toolbar">
      <button
        className="accessibility-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open accessibility options"
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
      >
        <span aria-hidden="true">♿</span>
        <span className="sr-only">Accessibility Options</span>
      </button>

      {isOpen && (
        <div
          id="accessibility-panel"
          className="accessibility-panel"
          role="dialog"
          aria-labelledby="accessibility-title"
        >
          <h3 id="accessibility-title" className="sr-only">Accessibility Options</h3>
          
          <div className="accessibility-section">
            <h4>Font Size</h4>
            <div className="font-size-controls">
              <button
                onClick={handleFontSizeDecrease}
                aria-label="Decrease font size"
                disabled={fontSize <= 12}
              >
                A-
              </button>
              <span aria-live="polite">{fontSize}px</span>
              <button
                onClick={handleFontSizeIncrease}
                aria-label="Increase font size"
                disabled={fontSize >= 24}
              >
                A+
              </button>
            </div>
          </div>

          <div className="accessibility-section">
            <h4>Display Options</h4>
            <label className="accessibility-option">
              <input
                type="checkbox"
                checked={isHighContrast}
                onChange={handleHighContrastToggle}
                aria-describedby="high-contrast-description"
              />
              <span>High Contrast</span>
              <span id="high-contrast-description" className="sr-only">
                Increases contrast for better visibility
              </span>
            </label>

            <label className="accessibility-option">
              <input
                type="checkbox"
                checked={isKeyboardNavigation}
                onChange={handleKeyboardNavigationToggle}
                aria-describedby="keyboard-nav-description"
              />
              <span>Keyboard Navigation</span>
              <span id="keyboard-nav-description" className="sr-only">
                Enhanced keyboard navigation support
              </span>
            </label>
          </div>

          <div className="accessibility-section">
            <h4>Color Blind Support</h4>
            <div className="color-blind-options">
              <label className="accessibility-option">
                <input
                  type="radio"
                  name="colorBlindMode"
                  value="none"
                  checked={colorBlindMode === 'none'}
                  onChange={(e) => handleColorBlindModeChange(e.target.value as any)}
                />
                <span>Normal</span>
              </label>
              <label className="accessibility-option">
                <input
                  type="radio"
                  name="colorBlindMode"
                  value="protanopia"
                  checked={colorBlindMode === 'protanopia'}
                  onChange={(e) => handleColorBlindModeChange(e.target.value as any)}
                />
                <span>Protanopia</span>
              </label>
              <label className="accessibility-option">
                <input
                  type="radio"
                  name="colorBlindMode"
                  value="deuteranopia"
                  checked={colorBlindMode === 'deuteranopia'}
                  onChange={(e) => handleColorBlindModeChange(e.target.value as any)}
                />
                <span>Deuteranopia</span>
              </label>
              <label className="accessibility-option">
                <input
                  type="radio"
                  name="colorBlindMode"
                  value="tritanopia"
                  checked={colorBlindMode === 'tritanopia'}
                  onChange={(e) => handleColorBlindModeChange(e.target.value as any)}
                />
                <span>Tritanopia</span>
              </label>
            </div>
          </div>

          <div className="accessibility-section">
            <h4>Quick Actions</h4>
            <button
              onClick={() => {
                document.querySelector('main')?.focus();
                announceToScreenReader('Jumped to main content');
              }}
              className="skip-link"
            >
              Skip to Main Content
            </button>
            <button
              onClick={() => {
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement;
                if (searchInput) {
                  searchInput.focus();
                  announceToScreenReader('Jumped to search');
                }
              }}
              className="skip-link"
            >
              Skip to Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToolbar;
