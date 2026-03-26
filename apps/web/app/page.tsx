import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { ShowcaseStrip } from '@/components/landing/ShowcaseStrip';
import { CodeSplit } from '@/components/landing/CodeSplit';
import { Integrations } from '@/components/landing/Integrations';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <ShowcaseStrip />
      <CodeSplit />
      <Integrations />
      <Footer />
    </main>
  );
}
