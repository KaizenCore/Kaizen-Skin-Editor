import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Viewer specific colors
  viewer2dBackground: string;
  viewer2dBackgroundAlt: string;
  viewer3dBackground: string;
  viewer3dFloor: string;
}

export interface Theme {
  id: string;
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
}

// Kaizen Core - Sweet Honey - Default theme
const kaizenMielDoux: Theme = {
  id: 'kaizen-miel-doux',
  name: 'Kaizen Sweet Honey',
  light: {
    background: '40 57% 79%',
    foreground: '49 20% 16%',
    card: '40 50% 96%',
    cardForeground: '49 20% 16%',
    popover: '40 50% 96%',
    popoverForeground: '49 20% 16%',
    primary: '39 44% 64%',
    primaryForeground: '49 20% 16%',
    secondary: '40 46% 81%',
    secondaryForeground: '49 20% 16%',
    muted: '42 52% 90%',
    mutedForeground: '40 33% 32%',
    accent: '39 43% 67%',
    accentForeground: '49 20% 16%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '40 50% 96%',
    border: '40 46% 81%',
    input: '40 46% 81%',
    ring: '39 44% 64%',
    viewer2dBackground: '#312E21',
    viewer2dBackgroundAlt: '#2a2719',
    viewer3dBackground: '#504228',
    viewer3dFloor: '#312E21',
  },
  dark: {
    background: '49 20% 16%',
    foreground: '40 57% 79%',
    card: '39 33% 24%',
    cardForeground: '40 57% 79%',
    popover: '39 33% 24%',
    popoverForeground: '40 57% 79%',
    primary: '39 44% 64%',
    primaryForeground: '49 20% 16%',
    secondary: '40 33% 32%',
    secondaryForeground: '40 57% 79%',
    muted: '40 33% 32%',
    mutedForeground: '39 44% 72%',
    accent: '39 43% 67%',
    accentForeground: '49 20% 16%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '40 57% 79%',
    border: '40 33% 32%',
    input: '40 33% 32%',
    ring: '39 44% 64%',
    viewer2dBackground: '#312E21',
    viewer2dBackgroundAlt: '#2a2719',
    viewer3dBackground: '#504228',
    viewer3dFloor: '#312E21',
  },
};

// Classic Blue theme (shadcn default-like)
const classicBlue: Theme = {
  id: 'classic-blue',
  name: 'Classic Blue',
  light: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '221.2 83.2% 53.3%',
    viewer2dBackground: '#1a1a2e',
    viewer2dBackgroundAlt: '#16162a',
    viewer3dBackground: '#1e293b',
    viewer3dFloor: '#1a1a2e',
  },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '224.3 76.3% 48%',
    viewer2dBackground: '#1a1a2e',
    viewer2dBackgroundAlt: '#16162a',
    viewer3dBackground: '#0f172a',
    viewer3dFloor: '#1a1a2e',
  },
};

// Emerald theme
const emerald: Theme = {
  id: 'emerald',
  name: 'Emerald',
  light: {
    background: '0 0% 100%',
    foreground: '160 60% 8%',
    card: '0 0% 100%',
    cardForeground: '160 60% 8%',
    popover: '0 0% 100%',
    popoverForeground: '160 60% 8%',
    primary: '160 84% 39%',
    primaryForeground: '0 0% 100%',
    secondary: '160 30% 90%',
    secondaryForeground: '160 60% 15%',
    muted: '160 20% 94%',
    mutedForeground: '160 20% 40%',
    accent: '160 30% 90%',
    accentForeground: '160 60% 15%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '160 20% 85%',
    input: '160 20% 85%',
    ring: '160 84% 39%',
    viewer2dBackground: '#134e4a',
    viewer2dBackgroundAlt: '#0f3d3a',
    viewer3dBackground: '#1a4d4a',
    viewer3dFloor: '#134e4a',
  },
  dark: {
    background: '160 50% 6%',
    foreground: '160 20% 90%',
    card: '160 40% 10%',
    cardForeground: '160 20% 90%',
    popover: '160 40% 10%',
    popoverForeground: '160 20% 90%',
    primary: '160 84% 45%',
    primaryForeground: '160 50% 6%',
    secondary: '160 30% 18%',
    secondaryForeground: '160 20% 90%',
    muted: '160 30% 18%',
    mutedForeground: '160 20% 60%',
    accent: '160 30% 18%',
    accentForeground: '160 20% 90%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '160 20% 90%',
    border: '160 30% 18%',
    input: '160 30% 18%',
    ring: '160 84% 45%',
    viewer2dBackground: '#134e4a',
    viewer2dBackgroundAlt: '#0f3d3a',
    viewer3dBackground: '#0d3330',
    viewer3dFloor: '#134e4a',
  },
};

// Rose/Pink theme
const rose: Theme = {
  id: 'rose',
  name: 'Rose',
  light: {
    background: '0 0% 100%',
    foreground: '350 40% 10%',
    card: '0 0% 100%',
    cardForeground: '350 40% 10%',
    popover: '0 0% 100%',
    popoverForeground: '350 40% 10%',
    primary: '350 89% 60%',
    primaryForeground: '0 0% 100%',
    secondary: '350 30% 92%',
    secondaryForeground: '350 40% 15%',
    muted: '350 20% 95%',
    mutedForeground: '350 20% 40%',
    accent: '350 30% 92%',
    accentForeground: '350 40% 15%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '350 20% 88%',
    input: '350 20% 88%',
    ring: '350 89% 60%',
    viewer2dBackground: '#4c1d3d',
    viewer2dBackgroundAlt: '#3d1730',
    viewer3dBackground: '#5c2347',
    viewer3dFloor: '#4c1d3d',
  },
  dark: {
    background: '350 40% 6%',
    foreground: '350 20% 92%',
    card: '350 35% 10%',
    cardForeground: '350 20% 92%',
    popover: '350 35% 10%',
    popoverForeground: '350 20% 92%',
    primary: '350 89% 60%',
    primaryForeground: '350 40% 6%',
    secondary: '350 30% 18%',
    secondaryForeground: '350 20% 92%',
    muted: '350 30% 18%',
    mutedForeground: '350 20% 60%',
    accent: '350 30% 18%',
    accentForeground: '350 20% 92%',
    destructive: '0 62.8% 40%',
    destructiveForeground: '350 20% 92%',
    border: '350 30% 18%',
    input: '350 30% 18%',
    ring: '350 89% 60%',
    viewer2dBackground: '#4c1d3d',
    viewer2dBackgroundAlt: '#3d1730',
    viewer3dBackground: '#2d1125',
    viewer3dFloor: '#4c1d3d',
  },
};

// Slate/Neutral theme
const slate: Theme = {
  id: 'slate',
  name: 'Slate',
  light: {
    background: '0 0% 100%',
    foreground: '224 71% 4%',
    card: '0 0% 100%',
    cardForeground: '224 71% 4%',
    popover: '0 0% 100%',
    popoverForeground: '224 71% 4%',
    primary: '220 14% 40%',
    primaryForeground: '0 0% 100%',
    secondary: '220 13% 91%',
    secondaryForeground: '220 14% 20%',
    muted: '220 13% 91%',
    mutedForeground: '220 9% 46%',
    accent: '220 13% 91%',
    accentForeground: '220 14% 20%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '220 13% 87%',
    input: '220 13% 87%',
    ring: '220 14% 40%',
    viewer2dBackground: '#334155',
    viewer2dBackgroundAlt: '#2d3a4a',
    viewer3dBackground: '#475569',
    viewer3dFloor: '#334155',
  },
  dark: {
    background: '224 71% 4%',
    foreground: '210 20% 98%',
    card: '224 50% 8%',
    cardForeground: '210 20% 98%',
    popover: '224 50% 8%',
    popoverForeground: '210 20% 98%',
    primary: '220 14% 60%',
    primaryForeground: '224 71% 4%',
    secondary: '220 20% 18%',
    secondaryForeground: '210 20% 98%',
    muted: '220 20% 18%',
    mutedForeground: '220 14% 60%',
    accent: '220 20% 18%',
    accentForeground: '210 20% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 20% 98%',
    border: '220 20% 18%',
    input: '220 20% 18%',
    ring: '220 14% 60%',
    viewer2dBackground: '#1e293b',
    viewer2dBackgroundAlt: '#182030',
    viewer3dBackground: '#0f172a',
    viewer3dFloor: '#1e293b',
  },
};

// Orange theme
const orange: Theme = {
  id: 'orange',
  name: 'Orange',
  light: {
    background: '0 0% 100%',
    foreground: '20 50% 10%',
    card: '0 0% 100%',
    cardForeground: '20 50% 10%',
    popover: '0 0% 100%',
    popoverForeground: '20 50% 10%',
    primary: '25 95% 53%',
    primaryForeground: '0 0% 100%',
    secondary: '25 30% 92%',
    secondaryForeground: '25 50% 15%',
    muted: '25 20% 95%',
    mutedForeground: '25 20% 40%',
    accent: '25 30% 92%',
    accentForeground: '25 50% 15%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '25 20% 88%',
    input: '25 20% 88%',
    ring: '25 95% 53%',
    viewer2dBackground: '#7c2d12',
    viewer2dBackgroundAlt: '#6b2710',
    viewer3dBackground: '#9a3412',
    viewer3dFloor: '#7c2d12',
  },
  dark: {
    background: '20 50% 6%',
    foreground: '25 20% 92%',
    card: '20 40% 10%',
    cardForeground: '25 20% 92%',
    popover: '20 40% 10%',
    popoverForeground: '25 20% 92%',
    primary: '25 95% 53%',
    primaryForeground: '20 50% 6%',
    secondary: '25 30% 18%',
    secondaryForeground: '25 20% 92%',
    muted: '25 30% 18%',
    mutedForeground: '25 20% 60%',
    accent: '25 30% 18%',
    accentForeground: '25 20% 92%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '25 20% 92%',
    border: '25 30% 18%',
    input: '25 30% 18%',
    ring: '25 95% 53%',
    viewer2dBackground: '#7c2d12',
    viewer2dBackgroundAlt: '#6b2710',
    viewer3dBackground: '#431407',
    viewer3dFloor: '#7c2d12',
  },
};

// Catppuccin Latte (light variant)
const catppuccinLatte: Theme = {
  id: 'catppuccin-latte',
  name: 'Catppuccin Latte',
  light: {
    background: '220 23% 95%',
    foreground: '234 16% 35%',
    card: '220 22% 92%',
    cardForeground: '234 16% 35%',
    popover: '220 22% 92%',
    popoverForeground: '234 16% 35%',
    primary: '220 91% 54%',
    primaryForeground: '220 23% 95%',
    secondary: '223 16% 83%',
    secondaryForeground: '234 16% 35%',
    muted: '223 16% 83%',
    mutedForeground: '233 10% 47%',
    accent: '266 85% 58%',
    accentForeground: '220 23% 95%',
    destructive: '347 87% 44%',
    destructiveForeground: '220 23% 95%',
    border: '225 14% 77%',
    input: '225 14% 77%',
    ring: '220 91% 54%',
    viewer2dBackground: '#dce0e8',
    viewer2dBackgroundAlt: '#ccd0da',
    viewer3dBackground: '#e6e9ef',
    viewer3dFloor: '#dce0e8',
  },
  dark: {
    background: '240 21% 15%',
    foreground: '226 64% 88%',
    card: '240 21% 12%',
    cardForeground: '226 64% 88%',
    popover: '240 21% 12%',
    popoverForeground: '226 64% 88%',
    primary: '217 92% 76%',
    primaryForeground: '240 21% 15%',
    secondary: '231 16% 23%',
    secondaryForeground: '226 64% 88%',
    muted: '231 16% 23%',
    mutedForeground: '228 24% 72%',
    accent: '267 84% 81%',
    accentForeground: '240 21% 15%',
    destructive: '343 81% 75%',
    destructiveForeground: '240 21% 15%',
    border: '231 16% 23%',
    input: '231 16% 23%',
    ring: '217 92% 76%',
    viewer2dBackground: '#1e1e2e',
    viewer2dBackgroundAlt: '#181825',
    viewer3dBackground: '#11111b',
    viewer3dFloor: '#1e1e2e',
  },
};

// Catppuccin Frappe
const catppuccinFrappe: Theme = {
  id: 'catppuccin-frappe',
  name: 'Catppuccin Frappe',
  light: {
    background: '220 23% 95%',
    foreground: '234 16% 35%',
    card: '220 22% 92%',
    cardForeground: '234 16% 35%',
    popover: '220 22% 92%',
    popoverForeground: '234 16% 35%',
    primary: '222 74% 56%',
    primaryForeground: '220 23% 95%',
    secondary: '223 16% 83%',
    secondaryForeground: '234 16% 35%',
    muted: '223 16% 83%',
    mutedForeground: '233 10% 47%',
    accent: '277 59% 76%',
    accentForeground: '220 23% 95%',
    destructive: '359 68% 71%',
    destructiveForeground: '220 23% 95%',
    border: '225 14% 77%',
    input: '225 14% 77%',
    ring: '222 74% 56%',
    viewer2dBackground: '#dce0e8',
    viewer2dBackgroundAlt: '#ccd0da',
    viewer3dBackground: '#e6e9ef',
    viewer3dFloor: '#dce0e8',
  },
  dark: {
    background: '229 19% 23%',
    foreground: '227 70% 87%',
    card: '231 19% 20%',
    cardForeground: '227 70% 87%',
    popover: '231 19% 20%',
    popoverForeground: '227 70% 87%',
    primary: '222 74% 74%',
    primaryForeground: '229 19% 23%',
    secondary: '230 16% 30%',
    secondaryForeground: '227 70% 87%',
    muted: '230 16% 30%',
    mutedForeground: '227 44% 80%',
    accent: '277 59% 76%',
    accentForeground: '229 19% 23%',
    destructive: '359 68% 71%',
    destructiveForeground: '229 19% 23%',
    border: '230 16% 30%',
    input: '230 16% 30%',
    ring: '222 74% 74%',
    viewer2dBackground: '#303446',
    viewer2dBackgroundAlt: '#292c3c',
    viewer3dBackground: '#232634',
    viewer3dFloor: '#303446',
  },
};

// Catppuccin Macchiato
const catppuccinMacchiato: Theme = {
  id: 'catppuccin-macchiato',
  name: 'Catppuccin Macchiato',
  light: {
    background: '220 23% 95%',
    foreground: '234 16% 35%',
    card: '220 22% 92%',
    cardForeground: '234 16% 35%',
    popover: '220 22% 92%',
    popoverForeground: '234 16% 35%',
    primary: '220 83% 53%',
    primaryForeground: '220 23% 95%',
    secondary: '223 16% 83%',
    secondaryForeground: '234 16% 35%',
    muted: '223 16% 83%',
    mutedForeground: '233 10% 47%',
    accent: '267 83% 80%',
    accentForeground: '220 23% 95%',
    destructive: '351 74% 73%',
    destructiveForeground: '220 23% 95%',
    border: '225 14% 77%',
    input: '225 14% 77%',
    ring: '220 83% 53%',
    viewer2dBackground: '#dce0e8',
    viewer2dBackgroundAlt: '#ccd0da',
    viewer3dBackground: '#e6e9ef',
    viewer3dFloor: '#dce0e8',
  },
  dark: {
    background: '232 23% 18%',
    foreground: '227 68% 88%',
    card: '233 23% 15%',
    cardForeground: '227 68% 88%',
    popover: '233 23% 15%',
    popoverForeground: '227 68% 88%',
    primary: '220 83% 75%',
    primaryForeground: '232 23% 18%',
    secondary: '230 19% 26%',
    secondaryForeground: '227 68% 88%',
    muted: '230 19% 26%',
    mutedForeground: '227 27% 72%',
    accent: '267 83% 80%',
    accentForeground: '232 23% 18%',
    destructive: '351 74% 73%',
    destructiveForeground: '232 23% 18%',
    border: '230 19% 26%',
    input: '230 19% 26%',
    ring: '220 83% 75%',
    viewer2dBackground: '#24273a',
    viewer2dBackgroundAlt: '#1e2030',
    viewer3dBackground: '#181926',
    viewer3dFloor: '#24273a',
  },
};

// Catppuccin Mocha (darkest)
const catppuccinMocha: Theme = {
  id: 'catppuccin-mocha',
  name: 'Catppuccin Mocha',
  light: {
    background: '220 23% 95%',
    foreground: '234 16% 35%',
    card: '220 22% 92%',
    cardForeground: '234 16% 35%',
    popover: '220 22% 92%',
    popoverForeground: '234 16% 35%',
    primary: '217 92% 54%',
    primaryForeground: '220 23% 95%',
    secondary: '223 16% 83%',
    secondaryForeground: '234 16% 35%',
    muted: '223 16% 83%',
    mutedForeground: '233 10% 47%',
    accent: '267 84% 81%',
    accentForeground: '220 23% 95%',
    destructive: '343 81% 55%',
    destructiveForeground: '220 23% 95%',
    border: '225 14% 77%',
    input: '225 14% 77%',
    ring: '217 92% 54%',
    viewer2dBackground: '#dce0e8',
    viewer2dBackgroundAlt: '#ccd0da',
    viewer3dBackground: '#e6e9ef',
    viewer3dFloor: '#dce0e8',
  },
  dark: {
    background: '240 21% 15%',
    foreground: '226 64% 88%',
    card: '240 21% 12%',
    cardForeground: '226 64% 88%',
    popover: '240 21% 12%',
    popoverForeground: '226 64% 88%',
    primary: '217 92% 76%',
    primaryForeground: '240 21% 15%',
    secondary: '231 16% 23%',
    secondaryForeground: '226 64% 88%',
    muted: '231 16% 23%',
    mutedForeground: '228 24% 72%',
    accent: '267 84% 81%',
    accentForeground: '240 21% 15%',
    destructive: '343 81% 75%',
    destructiveForeground: '240 21% 15%',
    border: '231 16% 23%',
    input: '231 16% 23%',
    ring: '217 92% 76%',
    viewer2dBackground: '#1e1e2e',
    viewer2dBackgroundAlt: '#181825',
    viewer3dBackground: '#11111b',
    viewer3dFloor: '#1e1e2e',
  },
};

export const themes: Theme[] = [
  kaizenMielDoux,
  classicBlue,
  emerald,
  rose,
  slate,
  orange,
  catppuccinLatte,
  catppuccinFrappe,
  catppuccinMacchiato,
  catppuccinMocha,
];

interface ThemeState {
  currentThemeId: string;
  isDarkMode: boolean;

  // Actions
  setTheme: (themeId: string) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;

  // Getters
  getCurrentTheme: () => Theme;
  getCurrentColors: () => ThemeColors;
}

// Apply theme to CSS variables
function applyTheme(theme: Theme, isDark: boolean) {
  const colors = isDark ? theme.dark : theme.light;
  const root = document.documentElement;

  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--popover', colors.popover);
  root.style.setProperty('--popover-foreground', colors.popoverForeground);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);

  // Viewer colors as CSS custom properties
  root.style.setProperty('--viewer-2d-bg', colors.viewer2dBackground);
  root.style.setProperty('--viewer-2d-bg-alt', colors.viewer2dBackgroundAlt);
  root.style.setProperty('--viewer-3d-bg', colors.viewer3dBackground);
  root.style.setProperty('--viewer-3d-floor', colors.viewer3dFloor);

  // Update dark class
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentThemeId: 'kaizen-miel-doux',
      isDarkMode: true,

      setTheme: (themeId: string) => {
        const theme = themes.find(t => t.id === themeId);
        if (theme) {
          set({ currentThemeId: themeId });
          applyTheme(theme, get().isDarkMode);
        }
      },

      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark });
        const theme = get().getCurrentTheme();
        applyTheme(theme, isDark);
      },

      toggleDarkMode: () => {
        const newDark = !get().isDarkMode;
        set({ isDarkMode: newDark });
        const theme = get().getCurrentTheme();
        applyTheme(theme, newDark);
      },

      getCurrentTheme: () => {
        return themes.find(t => t.id === get().currentThemeId) ?? themes[0]!;
      },

      getCurrentColors: () => {
        const theme = get().getCurrentTheme();
        return get().isDarkMode ? theme.dark : theme.light;
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on page load
        if (state) {
          const theme = themes.find(t => t.id === state.currentThemeId) ?? themes[0]!;
          applyTheme(theme, state.isDarkMode);
        }
      },
    }
  )
);

// Initialize theme on module load
const initializeTheme = () => {
  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      const theme = themes.find(t => t.id === state.currentThemeId) ?? themes[0]!;
      applyTheme(theme, state.isDarkMode);
    } catch {
      applyTheme(themes[0]!, true);
    }
  } else {
    applyTheme(themes[0]!, true);
  }
};

initializeTheme();
