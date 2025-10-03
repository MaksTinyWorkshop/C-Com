import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-base-100)',
        surface: 'var(--color-base-200)',
        text: 'var(--color-base-content)',
        muted: 'var(--color-neutral-content)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        neutral: 'var(--color-neutral)',
        info: 'var(--color-info)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    base: false,
    themes: [
      {
        mindleaf: {
          primary: 'var(--color-primary)',
          'primary-focus': 'var(--color-primary)',
          'primary-content': 'var(--color-primary-content)',
          secondary: 'var(--color-secondary)',
          'secondary-content': 'var(--color-secondary-content)',
          accent: 'var(--color-accent)',
          'accent-content': 'var(--color-accent-content)',
          neutral: 'var(--color-neutral)',
          'neutral-content': 'var(--color-neutral-content)',
          'base-100': 'var(--color-base-100)',
          'base-200': 'var(--color-base-200)',
          'base-300': 'var(--color-base-300)',
          'base-content': 'var(--color-base-content)',
          info: 'var(--color-info)',
          'info-content': 'var(--color-info-content)',
          success: 'var(--color-success)',
          'success-content': 'var(--color-success-content)',
          warning: 'var(--color-warning)',
          'warning-content': 'var(--color-warning-content)',
          error: 'var(--color-error)',
          'error-content': 'var(--color-error-content)',
        },
      },
    ],
  },
}
