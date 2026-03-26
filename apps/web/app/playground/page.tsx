import { Suspense } from 'react';
import { PlaygroundLayout } from '@/components/playground/PlaygroundLayout';

export const metadata = {
  title: 'Playground — Holi',
  description: 'Live Holi design token compiler in the browser.',
};

export default function PlaygroundPage() {
  return (
    <Suspense>
      <PlaygroundLayout />
    </Suspense>
  );
}
