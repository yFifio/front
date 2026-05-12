export const STORE_THEME_STORAGE_KEY = 'store-coloring-theme';

export type StoreThemeKey =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'border'
  | 'input'
  | 'ring'
  | 'ebook'
  | 'ebook-foreground'
  | 'coloring'
  | 'coloring-foreground';

export type StoreTheme = Record<StoreThemeKey, string>;

export type StoreThemeField = {
  key: StoreThemeKey;
  label: string;
  hint: string;
};

export const storeThemeSections: Array<{
  title: string;
  description: string;
  fields: StoreThemeField[];
}> = [
  {
    title: 'Base da loja',
    description: 'Ajuste o fundo e os tons gerais da vitrine.',
    fields: [
      { key: 'background', label: 'Fundo principal', hint: 'Cor dominante do site' },
      { key: 'foreground', label: 'Texto principal', hint: 'Cor das letras principais' },
      { key: 'card', label: 'Cartões', hint: 'Blocos e áreas de produto' },
      { key: 'card-foreground', label: 'Texto dos cartões', hint: 'Leitura dentro dos cards' },
      { key: 'popover', label: 'Janelas', hint: 'Menus, painéis e camadas' },
      { key: 'popover-foreground', label: 'Texto das janelas', hint: 'Leitura em menus e popups' },
    ],
  },
  {
    title: 'Botões e destaques',
    description: 'Controle os tons usados nas ações principais.',
    fields: [
      { key: 'primary', label: 'Primária', hint: 'Botões principais e foco' },
      { key: 'primary-foreground', label: 'Texto da primária', hint: 'Contraste do botão principal' },
      { key: 'secondary', label: 'Secundária', hint: 'Botões alternativos' },
      { key: 'secondary-foreground', label: 'Texto da secundária', hint: 'Contraste da secundária' },
      { key: 'accent', label: 'Destaque', hint: 'Detalhes que chamam atenção' },
      { key: 'accent-foreground', label: 'Texto do destaque', hint: 'Contraste dos destaques' },
    ],
  },
  {
    title: 'Loja divertida',
    description: 'Cores ligadas à identidade da loja e dos produtos.',
    fields: [
      { key: 'ebook', label: 'Tom dos digitais', hint: 'Produtos e elementos digitais' },
      { key: 'ebook-foreground', label: 'Texto dos digitais', hint: 'Leitura sobre o tom digital' },
      { key: 'coloring', label: 'Tom da brincadeira', hint: 'Elementos lúdicos e decorativos' },
      { key: 'coloring-foreground', label: 'Texto da brincadeira', hint: 'Contraste do tom lúdico' },
    ],
  },
  {
    title: 'Ajustes finos',
    description: 'Acertos extras para contornos, alertas e formulários.',
    fields: [
      { key: 'muted', label: 'Neutro', hint: 'Áreas suaves e apoio visual' },
      { key: 'muted-foreground', label: 'Texto neutro', hint: 'Leitura dos elementos suaves' },
      { key: 'border', label: 'Bordas', hint: 'Contornos da interface' },
      { key: 'input', label: 'Campos', hint: 'Fundo de inputs e selects' },
      { key: 'ring', label: 'Realce de foco', hint: 'Anel de foco e destaque' },
      { key: 'destructive', label: 'Avisos', hint: 'Ações e alertas fortes' },
      { key: 'destructive-foreground', label: 'Texto dos avisos', hint: 'Contraste dos avisos' },
    ],
  },
];

export const defaultStoreTheme: StoreTheme = {
  background: '200 40% 12%',
  foreground: '180 100% 96%',
  card: '200 30% 18%',
  'card-foreground': '180 100% 96%',
  popover: '200 30% 15%',
  'popover-foreground': '180 100% 96%',
  primary: '280 100% 70%',
  'primary-foreground': '0 0% 8%',
  secondary: '160 100% 65%',
  'secondary-foreground': '0 0% 8%',
  muted: '200 20% 35%',
  'muted-foreground': '180 100% 80%',
  accent: '15 100% 60%',
  'accent-foreground': '0 0% 100%',
  destructive: '0 100% 50%',
  'destructive-foreground': '0 0% 100%',
  border: '200 40% 30%',
  input: '200 30% 22%',
  ring: '160 100% 65%',
  ebook: '200 80% 55%',
  'ebook-foreground': '0 0% 100%',
  coloring: '45 90% 55%',
  'coloring-foreground': '180 100% 96%',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseHsl = (hslTriplet: string) => {
  const [h = '0', s = '0%', l = '0%'] = hslTriplet.trim().split(/\s+/);
  return {
    h: Number.parseFloat(h),
    s: Number.parseFloat(s.replace('%', '')),
    l: Number.parseFloat(l.replace('%', '')),
  };
};

const formatHsl = (h: number, s: number, l: number) => `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;

const hslToHex = (hslTriplet: string) => {
  const { h, s, l } = parseHsl(hslTriplet);
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hslTripletToHex = hslToHex;

export const hexToHslTriplet = (hex: string) => {
  const normalized = hex.replace('#', '');
  const fullHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6);

  const r = Number.parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(fullHex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    switch (max) {
      case r:
        hue = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        hue = 60 * ((b - r) / delta + 2);
        break;
      default:
        hue = 60 * ((r - g) / delta + 4);
        break;
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  return formatHsl(hue, saturation * 100, lightness * 100);
};

const blendLightness = (hslTriplet: string, delta: number) => {
  const { h, s, l } = parseHsl(hslTriplet);
  return formatHsl(h, s, clamp(l + delta, 0, 100));
};

const pickForeground = (hslTriplet: string) => {
  const { l } = parseHsl(hslTriplet);
  return l > 62 ? '0 0% 8%' : '0 0% 100%';
};

export const getStoredStoreTheme = (): StoreTheme => {
  if (typeof window === 'undefined') {
    return defaultStoreTheme;
  }

  const rawTheme = window.localStorage.getItem(STORE_THEME_STORAGE_KEY);
  if (!rawTheme) {
    return defaultStoreTheme;
  }

  try {
    const parsed = JSON.parse(rawTheme) as Partial<StoreTheme>;
    return { ...defaultStoreTheme, ...parsed };
  } catch {
    return defaultStoreTheme;
  }
};

export const saveStoreTheme = (theme: StoreTheme) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORE_THEME_STORAGE_KEY, JSON.stringify(theme));
};

export const clearStoredStoreTheme = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORE_THEME_STORAGE_KEY);
};

export const applyStoreTheme = (theme: StoreTheme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.style.setProperty('--gradient-hero', `linear-gradient(135deg, hsl(${theme.primary}) 0%, hsl(${theme.secondary}) 50%, hsl(${theme.accent}) 100%)`);
  root.style.setProperty('--gradient-card', `linear-gradient(135deg, hsl(${theme.card}) 0%, hsl(${blendLightness(theme.background, 10)}) 100%)`);
  root.style.setProperty('--shadow-playful', `0 0 30px hsl(${theme.primary} / 0.6), 0 0 60px hsl(${theme.secondary} / 0.4)`);
  root.style.setProperty('--shadow-card', `0 0 20px hsl(${theme.primary} / 0.4), 0 0 40px hsl(${theme.accent} / 0.25)`);
  root.style.setProperty('--sidebar-background', theme.background);
  root.style.setProperty('--sidebar-foreground', theme.foreground);
  root.style.setProperty('--sidebar-primary', theme.primary);
  root.style.setProperty('--sidebar-primary-foreground', theme['primary-foreground']);
  root.style.setProperty('--sidebar-accent', theme.secondary);
  root.style.setProperty('--sidebar-accent-foreground', theme['secondary-foreground']);
  root.style.setProperty('--sidebar-border', theme.border);
  root.style.setProperty('--sidebar-ring', theme.ring);
};

export const createRandomStoreTheme = (): StoreTheme => {
  const baseHue = Math.floor(Math.random() * 360);
  const secondaryHue = (baseHue + 120) % 360;
  const accentHue = (baseHue + 45) % 360;
  const ebookHue = (baseHue + 200) % 360;
  const coloringHue = (baseHue + 80) % 360;

  const background = formatHsl(baseHue, 34, 12);
  const card = formatHsl(baseHue, 28, 18);
  const popover = formatHsl(baseHue, 30, 16);
  const primary = formatHsl(baseHue, 96, 68);
  const secondary = formatHsl(secondaryHue, 92, 62);
  const accent = formatHsl(accentHue, 94, 60);
  const ebook = formatHsl(ebookHue, 86, 58);
  const coloring = formatHsl(coloringHue, 92, 60);
  const muted = formatHsl(baseHue, 16, 34);
  const border = formatHsl(baseHue, 30, 30);
  const input = formatHsl(baseHue, 28, 22);
  const destructive = formatHsl((baseHue + 330) % 360, 100, 56);

  return {
    background,
    foreground: pickForeground(background),
    card,
    'card-foreground': pickForeground(card),
    popover,
    'popover-foreground': pickForeground(popover),
    primary,
    'primary-foreground': pickForeground(primary),
    secondary,
    'secondary-foreground': pickForeground(secondary),
    muted,
    'muted-foreground': blendLightness(muted, 45),
    accent,
    'accent-foreground': pickForeground(accent),
    destructive,
    'destructive-foreground': pickForeground(destructive),
    border,
    input,
    ring: secondary,
    ebook,
    'ebook-foreground': pickForeground(ebook),
    coloring,
    'coloring-foreground': pickForeground(coloring),
  };
};

export const createThemeWithAutoForegrounds = (theme: StoreTheme): StoreTheme => ({
  ...theme,
  ring: theme.ring,
});
