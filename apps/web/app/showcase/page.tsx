import { Suspense } from 'react';
import { DEFAULT_CONFIG } from '@holi.dev/core';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { ShowcaseSidebar } from '@/components/showcase/ShowcaseSidebar';
import { TokenSection, type TokenSectionKey } from '@/components/showcase/TokenSection';
import { ComponentDetailCard } from '@/components/showcase/ComponentDetailCard';

export const metadata = {
  title: 'Showcase — Holi',
  description: 'Browse Holi design tokens and live component previews.',
};

const TOKEN_KEYS: TokenSectionKey[] = ['colors', 'spacing', 'radius', 'typography'];

interface ShowcasePageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function ShowcasePage({ searchParams }: ShowcasePageProps) {
  const { section = 'colors' } = await searchParams;
  const componentNames = Object.keys(DEFAULT_CONFIG.components ?? {});
  const isToken = (TOKEN_KEYS as string[]).includes(section);
  const isComponent = componentNames.includes(section);

  return (
    <>
      <Nav />
      <div className="showcase-layout">
        <Suspense>
          <ShowcaseSidebar />
        </Suspense>
        <main className="showcase-content">
          {isToken ? (
            <TokenSection section={section as TokenSectionKey} />
          ) : isComponent ? (
            <ComponentDetailCard name={section} />
          ) : (
            <TokenSection section="colors" />
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
