import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        via: '#84251c',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        cardForeground: 'var(--card-foreground)',
        popover: 'var(--popover)',
        popoverForeground: 'var(--popover-foreground)',
        primary: 'var(--primary)',
        primaryForeground: 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        secondaryForeground: 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        mutedForeground: 'var(--muted-foreground)',
        accent: 'var(--accent)',
        accentForeground: 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        destructiveForeground: 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          primaryForeground: 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          accentForeground: 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), // Add the animate plugin
  ],
};

export default config;
