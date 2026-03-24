import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/app/source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{
        title: (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#6366f1]" />
            <span className="text-sm font-bold">holi</span>
          </div>
        ),
      }}
      githubUrl="https://github.com/ChandanBose666/Holi"
      sidebar={{ defaultOpenLevel: 1 }}
    >
      {children}
    </DocsLayout>
  );
}
