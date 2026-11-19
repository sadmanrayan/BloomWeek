import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Theme } from '../utils/theme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onFocusLmpInput: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onFocusLmpInput,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBFA]/95 dark:bg-[#171215]/95 backdrop-blur-sm border-b border-[#EADFE2] dark:border-[#34282E] transition-colors duration-150">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
        <a
          href="#overview"
          className="font-serif text-lg sm:text-2xl font-semibold tracking-tight text-[#2E2428] dark:text-[#F5ECEF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] rounded"
        >
          BloomWeeks
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#6B5B61] dark:text-[#C3B3B9]"
        >
          <a
            href="#overview"
            className="hover:text-[#2E2428] dark:hover:text-[#F5ECEF] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#A84A67] dark:hover:border-[#E58AA6]"
          >
            Overview
          </a>
          <a
            href="#calendar"
            className="hover:text-[#2E2428] dark:hover:text-[#F5ECEF] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#A84A67] dark:hover:border-[#E58AA6]"
          >
            Calendar
          </a>
          <a
            href="#weight"
            className="hover:text-[#2E2428] dark:hover:text-[#F5ECEF] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#A84A67] dark:hover:border-[#E58AA6]"
          >
            Weight
          </a>
          <a
            href="#nutrition"
            className="hover:text-[#2E2428] dark:hover:text-[#F5ECEF] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#A84A67] dark:hover:border-[#E58AA6]"
          >
            Care Guide
          </a>
          <a
            href="#milestones"
            className="hover:text-[#2E2428] dark:hover:text-[#F5ECEF] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#A84A67] dark:hover:border-[#E58AA6]"
          >
            Milestones
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="theme-toggle-button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-[#D9BDC7] dark:border-[#4F3C46] bg-[#F5E9ED] hover:bg-[#ECD9E0] dark:bg-[#2C2228] dark:hover:bg-[#3A2D35] text-xs sm:text-sm font-semibold text-[#3B2A30] dark:text-[#F7EBF0] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 shrink-0 text-[#F4C87A]" aria-hidden="true" />
                <span className="hidden sm:inline">Light Mode</span>
                <span className="sm:hidden">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 shrink-0 text-[#A84A67]" aria-hidden="true" />
                <span className="hidden sm:inline">Dark Mode</span>
                <span className="sm:hidden">Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onFocusLmpInput}
            className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white bg-[#A84A67] hover:bg-[#8F3B55] dark:bg-[#B34F6F] dark:hover:bg-[#C45D7E] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
          >
            Set LMP Date
          </button>
        </div>
      </div>
    </header>
  );
};
