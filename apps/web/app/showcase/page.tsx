import { DEFAULT_CONFIG } from '@holi.dev/core';
import { TokenGrid } from '@/components/gallery/TokenGrid';
import { ComponentCard } from '@/components/gallery/ComponentCard';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';

export const metadata = {
  title: 'Showcase — Holi',
  description: 'Browse Holi design tokens and live component previews.',
};

export default function ShowcasePage() {
  const componentNames = Object.keys(DEFAULT_CONFIG.components ?? {});

  return (
    <>
      <Nav />
      <div className="showcase-page">
        <div className="container">
          <div className="showcase-page-header">
            <div className="section-label" style={{ justifyContent: 'center' }}>Showcase</div>
            <h1 className="section-title" style={{ textAlign: 'center' }}>
              Your design system, live
            </h1>
            <p className="section-sub" style={{ textAlign: 'center', margin: '12px auto 0' }}>
              Tokens, components, and animations — compiled from the default Holi config.
            </p>
          </div>

          {/* Token grid */}
          <section style={{ marginBottom: 80 }}>
            <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: 32 }}>
              Design Tokens
            </h2>
            <TokenGrid />
          </section>

          {/* Components */}
          <section>
            <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: 32 }}>
              Components
            </h2>
            <div className="component-cards">
              {componentNames.map((name) => (
                <ComponentCard key={name} name={name} />
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
