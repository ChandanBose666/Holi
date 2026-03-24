import type { HoliConfig } from '@holi/shared';

export const DEFAULT_CONFIG: HoliConfig = {
  tokens: {
    color: {
      primary:      '#6366F1',
      'primary-dk': '#4F46E5',
      surface:      '#F8FAFC',
      text:         '#1E293B',
      muted:        '#64748B',
    },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px', xl: '64px' },
    typography: {
      sans:        '"Inter", sans-serif',
      'size-sm':   '0.875rem',
      'size-base': '1rem',
      'size-lg':   '1.25rem',
    },
    radius: { sm: '4px', md: '8px', lg: '16px' },
    shadow: { sm: '0 1px 3px rgba(0,0,0,0.1)' },
  },
  breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
  components: {
    btn: {
      base: {
        display:         'inline-flex',
        padding:         'spacing.sm spacing.md',
        'font-family':   'typography.sans',
        'border-radius': 'radius.md',
        cursor:          'pointer',
      },
      variants: {
        primary: { background: 'color.primary', color: '#fff' },
        ghost: {
          background: 'transparent',
          border:     '1px solid color.primary',
          color:      'color.primary',
        },
      },
    },
    card: {
      base: {
        background:      'color.surface',
        'border-radius': 'radius.lg',
        padding:         'spacing.lg',
        'box-shadow':    'shadow.sm',
      },
    },
  },
  animations: {
    'fade-in': {
      keyframes: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      duration: '300ms',
      easing:   'ease-out',
    },
  },
  output: { outputDir: 'holi-dist', utilities: true },
};
