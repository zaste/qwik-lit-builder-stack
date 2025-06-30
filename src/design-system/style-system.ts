/**
 * Design System Style Integration
 * 
 * Centralized theme and style system that integrates with Builder.io
 * and provides consistent styling across all components.
 */

// Design system theme interface
interface DesignSystemTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: {
      default: string;
      focus: string;
      error: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Default theme
export const defaultTheme: DesignSystemTheme = {
  name: 'Default',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af'
    },
    border: {
      default: '#d1d5db',
      focus: '#3b82f6',
      error: '#ef4444'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
};

// Dark theme variant
export const darkTheme: DesignSystemTheme = {
  ...defaultTheme,
  name: 'Dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#0f172a',
    surface: '#1e293b',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b'
    },
    border: {
      default: '#374151',
      focus: '#3b82f6',
      error: '#ef4444'
    }
  }
};

// Professional theme variant
export const professionalTheme: DesignSystemTheme = {
  ...defaultTheme,
  name: 'Professional',
  colors: {
    primary: '#1f2937',
    secondary: '#6b7280',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      disabled: '#9ca3af'
    },
    border: {
      default: '#e5e7eb',
      focus: '#1f2937',
      error: '#dc2626'
    }
  }
};

// Theme manager class
class DesignSystemThemeManager {
  private currentTheme: DesignSystemTheme = defaultTheme;
  private themes = new Map<string, DesignSystemTheme>();
  private listeners = new Set<(theme: DesignSystemTheme) => void>();

  constructor() {
    // Register default themes
    this.registerTheme(defaultTheme);
    this.registerTheme(darkTheme);
    this.registerTheme(professionalTheme);
  }

  // Register a new theme
  registerTheme(theme: DesignSystemTheme) {
    this.themes.set(theme.name, theme);
    import('../lib/logger').then(({ logger }) => {
      logger.info(`ThemeManager: Registered theme: ${theme.name}`, { 
        component: 'ThemeManager',
        action: 'register',
        themeName: theme.name 
      });
    });
  }

  // Get available themes
  getThemes(): DesignSystemTheme[] {
    return Array.from(this.themes.values());
  }

  // Get current theme
  getCurrentTheme(): DesignSystemTheme {
    return this.currentTheme;
  }

  // Set active theme
  setTheme(themeName: string) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      import('../lib/logger').then(({ logger }) => {
        logger.warn(`ThemeManager: Theme "${themeName}" not found`, {
          component: 'ThemeManager',
          action: 'setTheme',
          themeName
        });
      });
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.notifyListeners(theme);
    
    import('../lib/logger').then(({ logger }) => {
      logger.info(`ThemeManager: Applied theme: ${themeName}`, {
        component: 'ThemeManager',
        action: 'setTheme',
        themeName
      });
    });
  }

  // Apply theme to document root
  private applyTheme(theme: DesignSystemTheme) {
    const root = document.documentElement;

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--ds-color-${key}`, value);
      } else {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--ds-color-${key}-${subKey}`, subValue);
        });
      }
    });

    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--ds-space-${key}`, value);
    });

    // Apply typography variables
    root.style.setProperty('--ds-font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--ds-text-${key}`, value);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--ds-weight-${key}`, value);
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--ds-leading-${key}`, value);
    });

    // Apply radius variables
    Object.entries(theme.radius).forEach(([key, value]) => {
      root.style.setProperty(`--ds-radius-${key}`, value);
    });

    // Apply shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--ds-shadow-${key}`, value);
    });
  }

  // Listen for theme changes
  onThemeChange(listener: (theme: DesignSystemTheme) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(theme: DesignSystemTheme) {
    this.listeners.forEach(listener => listener(theme));
  }

  // Generate CSS custom properties for a specific theme
  generateThemeCSS(theme: DesignSystemTheme): string {
    const variables: string[] = [];

    // Color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables.push(`  --ds-color-${key}: ${value};`);
      } else {
        Object.entries(value).forEach(([subKey, subValue]) => {
          variables.push(`  --ds-color-${key}-${subKey}: ${subValue};`);
        });
      }
    });

    // Spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      variables.push(`  --ds-space-${key}: ${value};`);
    });

    // Typography variables
    variables.push(`  --ds-font-family: ${theme.typography.fontFamily};`);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      variables.push(`  --ds-text-${key}: ${value};`);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      variables.push(`  --ds-weight-${key}: ${value};`);
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      variables.push(`  --ds-leading-${key}: ${value};`);
    });

    // Radius variables
    Object.entries(theme.radius).forEach(([key, value]) => {
      variables.push(`  --ds-radius-${key}: ${value};`);
    });

    // Shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      variables.push(`  --ds-shadow-${key}: ${value};`);
    });

    return `:root {\n${variables.join('\n')}\n}`;
  }
}

// Global theme manager instance
export const themeManager = new DesignSystemThemeManager();

// Builder.io theme integration
export function createBuilderThemeControls() {
  const themes = themeManager.getThemes();
  
  return {
    // Theme selector input for Builder.io components
    themeInput: {
      name: 'theme',
      type: 'select',
      options: themes.map(theme => ({
        label: theme.name,
        value: theme.name
      })),
      defaultValue: 'Default',
      helperText: 'Choose a design system theme',
      onChange: (themeName: string) => {
        themeManager.setTheme(themeName);
      }
    },

    // Color scheme input
    colorSchemeInput: {
      name: 'colorScheme',
      type: 'select',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' }
      ],
      defaultValue: 'auto',
      helperText: 'Override system color scheme'
    },

    // Custom color inputs for theme overrides
    customColorInputs: [
      {
        name: 'customPrimaryColor',
        type: 'color',
        defaultValue: '',
        helperText: 'Override primary color (optional)',
        showIf: (options: any) => options.get('allowCustomColors') === true
      },
      {
        name: 'customSecondaryColor',
        type: 'color',
        defaultValue: '',
        helperText: 'Override secondary color (optional)',
        showIf: (options: any) => options.get('allowCustomColors') === true
      }
    ]
  };
}

// Enhanced component registration with theme integration
export function enhanceComponentWithTheme(componentOptions: any) {
  const themeControls = createBuilderThemeControls();
  
  return {
    ...componentOptions,
    inputs: [
      ...componentOptions.inputs,
      // Add theme controls to component
      themeControls.themeInput,
      {
        name: 'allowCustomColors',
        type: 'boolean',
        defaultValue: false,
        helperText: 'Allow custom color overrides for this component'
      },
      ...themeControls.customColorInputs
    ]
  };
}

// Initialize design system styles
export function initializeDesignSystemStyles() {
  // Apply default theme on initialization
  themeManager.setTheme('Default');
  
  // Add base design system styles
  const styleElement = document.createElement('style');
  styleElement.id = 'design-system-base';
  styleElement.textContent = `
    /* Design System Base Styles */
    .ds-component {
      font-family: var(--ds-font-family);
      color: var(--ds-color-text-primary);
      box-sizing: border-box;
    }
    
    .ds-component * {
      box-sizing: border-box;
    }
    
    /* Responsive design utilities */
    @media (prefers-reduced-motion: reduce) {
      .ds-component * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    @media (prefers-color-scheme: dark) {
      .ds-component[data-auto-theme="true"] {
        --ds-color-background: var(--ds-color-surface);
        --ds-color-text-primary: var(--ds-color-text-primary);
      }
    }
    
    /* Focus management for accessibility */
    .ds-component:focus-visible {
      outline: 2px solid var(--ds-color-border-focus);
      outline-offset: 2px;
    }
  `;
  
  document.head.appendChild(styleElement);
  
  import('../lib/logger').then(({ logger }) => {
    logger.info('DesignSystem: Design System styles initialized', {
      component: 'DesignSystem',
      action: 'initialize',
      availableThemes: themeManager.getThemes().map(t => t.name)
    });
  });
}

// Export utilities
export type { DesignSystemTheme };
export { DesignSystemThemeManager };

// Auto-initialize when imported in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDesignSystemStyles);
  } else {
    initializeDesignSystemStyles();
  }
}