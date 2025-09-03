/**
 * Language Switcher Component
 * Allows users to switch between English and Amharic
 * 
 * Created by: Senior Mobile Developer, UX Designer
 * Context: Stage 2 - User Experience Guidelines & Localization
 */

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../../shared/src/i18n/useI18n';
import type { SupportedLanguageCode } from '../../../shared/src/i18n';

export interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'dropdown' | 'buttons' | 'menu';
  size?: 'small' | 'medium' | 'large';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showLabel = true,
  variant = 'dropdown',
  size = 'medium'
}) => {
  const { language, languages, changeLanguage, t, isLoading } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode as SupportedLanguageCode);
    setIsOpen(false);
    
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === language);

  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-2',
    large: 'text-lg px-4 py-3'
  };

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            inline-flex items-center justify-between w-full rounded-md border border-gray-300
            bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50
            ${sizeClasses[size]}
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t('accessibility.languageSelector')}
        >
          <span className="flex items-center">
            <span className="mr-2 text-lg" role="img" aria-label={currentLanguage?.name}>
              {language === 'am' ? '🇪🇹' : '🇬🇧'}
            </span>
            {showLabel && (
              <span className="font-medium">
                {currentLanguage?.name}
              </span>
            )}
          </span>
          <svg
            className={`ml-2 h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <ul
              className="py-1"
              role="listbox"
              aria-labelledby="language-selector"
            >
              {languages.map((lang) => (
                <li key={lang.code} role="option" aria-selected={lang.code === language}>
                  <button
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`
                      w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center
                      ${lang.code === language ? 'bg-gray-50 font-semibold' : ''}
                    `}
                    disabled={isLoading}
                  >
                    <span className="mr-2 text-lg" role="img" aria-label={lang.name}>
                      {lang.code === 'am' ? '🇪🇹' : '🇬🇧'}
                    </span>
                    <span>{lang.name}</span>
                    {lang.code === language && (
                      <svg
                        className="ml-auto h-4 w-4 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Buttons variant
  if (variant === 'buttons') {
    return (
      <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
        {languages.map((lang, index) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={`
              ${sizeClasses[size]}
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === languages.length - 1 ? 'rounded-r-md' : ''}
              ${lang.code === language 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
              border border-gray-300 font-medium focus:z-10 focus:outline-none
              focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              disabled:opacity-50 transition-colors
            `}
            aria-pressed={lang.code === language}
            aria-label={`Switch to ${lang.name}`}
          >
            <span className="flex items-center">
              <span className="mr-2" role="img" aria-label={lang.name}>
                {lang.code === 'am' ? '🇪🇹' : '🇬🇧'}
              </span>
              {showLabel && lang.name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Menu variant (for mobile)
  return (
    <div className={`${className}`}>
      <div className="space-y-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={`
              w-full text-left px-3 py-2 rounded-md text-base font-medium
              ${lang.code === language 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-700 hover:bg-gray-100'
              }
              disabled:opacity-50 transition-colors flex items-center
            `}
            aria-pressed={lang.code === language}
          >
            <span className="mr-3 text-lg" role="img" aria-label={lang.name}>
              {lang.code === 'am' ? '🇪🇹' : '🇬🇧'}
            </span>
            <span>{lang.name}</span>
            {lang.code === language && (
              <svg
                className="ml-auto h-5 w-5 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;