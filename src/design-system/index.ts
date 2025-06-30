// Design System Entry Point
import './components/ds-button.js';
import './components/ds-file-upload.js';
import './components/ds-input.js';
import './components/ds-card.js';

// Register all components
export function registerDesignSystem() {
  // Components are auto-registered via custom elements
  // console.log('Design System registered: ds-button, ds-file-upload, ds-input, ds-card');
}

// Export for Builder.io integration
export { registerBuilderComponents } from './builder-registration';