import '../src/global.css';
import '../src/design-system';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    toc: true,
  },
};

export const decorators = [
  (Story) => {
    // Add any global decorators here
    return Story();
  },
];