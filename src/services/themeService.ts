export type ThemeMode = 'dark' | 'light';

class ThemeService {
  private currentTheme: ThemeMode = 'dark';
  private listeners: Set<(theme: ThemeMode) => void> = new Set();

  constructor() {
    this.init();
  }

  public init(): void {
    const saved = localStorage.getItem('vertex_theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      this.currentTheme = saved;
    } else {
      this.currentTheme = 'dark';
    }
    this.applyTheme(this.currentTheme);
  }

  public getTheme(): ThemeMode {
    return this.currentTheme;
  }

  public setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    localStorage.setItem('vertex_theme', theme);
    this.applyTheme(theme);
    this.notify();
  }

  public toggleTheme(): ThemeMode {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  public subscribe(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentTheme);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  private applyTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  }
}

export const themeService = new ThemeService();
