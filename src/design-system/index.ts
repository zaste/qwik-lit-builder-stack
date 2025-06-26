// Design System Entry Point
import './components/ds-button.js';

// Register all components
export function registerDesignSystem() {
  // Components are auto-registered via custom elements
  console.log('Design System registered');
}

// Export for Builder.io integration
export { registerBuilderComponents } from './builder-registration';