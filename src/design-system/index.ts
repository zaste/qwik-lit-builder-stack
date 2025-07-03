// Register all components
export async function registerDesignSystem() {
  // Dynamic imports to avoid SSR issues with LIT decorators
  await import('./components/ds-button');
  await import('./components/ds-input');
  await import('./components/ds-card');
  await import('./components/ds-file-upload');
}

// Design system registration complete - no external integrations needed