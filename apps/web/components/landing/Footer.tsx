export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <span className="footer-logo">holi ✦</span>

          <div className="footer-npm">
            <span>$</span> npm install <span>@holi.dev/cli</span>
          </div>

          <nav className="footer-links">
            <a
              href="https://www.npmjs.com/package/@holi.dev/cli"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
            <a
              href="https://github.com/ChandanBose666/Holi"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a href="https://docs.holi.dev" className="footer-link" target="_blank" rel="noopener noreferrer">
              Docs
            </a>
            <a href="/playground" className="footer-link">
              Playground
            </a>
            <a href="/showcase" className="footer-link">
              Showcase
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
