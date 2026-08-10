/**
 * GameVault design tokens — synced from the sibling web artifact's CSS.
 * Palette: dark violet (#0C0A18) + warm amber (#F59E0B) + electric violet (#7C3AED)
 * Source: artifacts/gamevault/src/index.css
 */
const colors = {
  light: {
    // Legacy aliases
    text: '#FCF6E4',
    tint: '#F59E0B',

    // Core surfaces
    background: '#0C0A18',   // 259 44% 7%   — near-black violet
    foreground: '#FCF6E4',   // 44 76% 94%   — warm cream

    // Cards / elevated surfaces
    card: '#1C122B',         // 263 40% 12%  — deep violet
    cardForeground: '#FCF6E4',

    // Primary action — warm amber
    primary: '#F59E0B',      // 38 92% 50%
    primaryForeground: '#0C0A18',

    // Secondary — deep violet
    secondary: '#4B1D95',    // 263 67% 35%
    secondaryForeground: '#FCF6E4',

    // Muted / subdued
    muted: '#2F2442',        // 263 30% 20%
    mutedForeground: '#C9BD9C', // 44 30% 70%

    // Accent — electric violet
    accent: '#7C3AED',       // 262 83% 58%
    accentForeground: '#FCF6E4',

    // Destructive
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and inputs
    border: '#2F2442',
    input: '#2F2442',
  },

  // 1rem = 16px from --radius: 1rem
  radius: 16,
};

export default colors;
