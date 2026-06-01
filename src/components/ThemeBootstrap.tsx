/**
 * Server-rendered inline script that runs BEFORE React hydration.
 * Reads the persisted theme from localStorage (key "theme") and applies
 * "light" or "dark" class to <html> immediately, preventing FOUC.
 * This replaces the FOUC script that next-themes would inject inside its
 * provider (which triggers Next.js 16's "script tag inside React component"
 * warning).
 */
const BOOTSTRAP = `(function(){try{var t=localStorage.getItem('theme');if(!t||t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}})();`;

export function ThemeBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />;
}
