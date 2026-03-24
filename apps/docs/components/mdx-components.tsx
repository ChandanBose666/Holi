import defaultComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ColorSwatch, ColorSwatchGrid } from './ui/ColorSwatch';
import { SpacingRuler, SpacingRulerGrid } from './ui/SpacingRuler';
import { LiveDemo }       from './ui/LiveDemo';
import { CompiledCSS }    from './ui/CompiledCSS';
import { AnimationDemo }  from './ui/AnimationDemo';
import { UtilityTable }   from './ui/UtilityTable';
import { ConfigExample }  from './ui/ConfigExample';
import { BeforeAfter }    from './ui/BeforeAfter';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ColorSwatch,
    ColorSwatchGrid,
    SpacingRuler,
    SpacingRulerGrid,
    LiveDemo,
    CompiledCSS,
    AnimationDemo,
    UtilityTable,
    ConfigExample,
    BeforeAfter,
    ...components,
  };
}
