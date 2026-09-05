import type { Config } from 'tailwindcss';
import baseConfig from '@copilot/config/tailwind/base';

const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // App-specific extensions go here
    },
  },
  plugins: [...(baseConfig.plugins || [])],
};

export default config;