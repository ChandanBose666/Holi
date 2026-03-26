'use client';
import { useEffect, useState } from 'react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`site-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="inner">
          <a href="/" className="nav-logo">
            <span className="nav-logo-dot" />
            holi
          </a>
          <div className="nav-links">
            <a href="/playground" className="nav-link">Playground</a>
            <a href="/showcase" className="nav-link">Showcase</a>
            <a
              href="https://docs.holi.dev"
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
            <a
              href="https://github.com/ChandanBose666/Holi"
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@holi.dev/cli"
              className="nav-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm install
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
