import { Builder } from '@builder.io/sdk';

// Initialize Builder SDK
let builderInitialized = false;

export function initializeBuilder(apiKey: string) {
  if (!builderInitialized && typeof window !== 'undefined') {
    (Builder as any).apiKey = apiKey;
    builderInitialized = true;

    // Register custom components
    registerBuilderComponents();
  }
}

// Register custom components
export async function registerBuilderComponents() {
  const { DSButton } = await import('../../design-system/components/qwik-wrappers');

  Builder.registerComponent(DSButton, {
    name: 'DS Button',
    inputs: [
      {
        name: 'variant',
        type: 'select',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' }
        ],
        defaultValue: 'primary'
      },
      {
        name: 'size',
        type: 'select',
        options: [
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' }
        ],
        defaultValue: 'medium'
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: false
      },
      {
        name: 'children',
        type: 'string',
        defaultValue: 'Button Text'
      }
    ],
    image: '/icons/button.svg'
  });
}

// Content fetching with caching
const contentCache = new Map<string, { content: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getBuilderContent = async (model: string, url: string, apiKey: string) => {
  const cacheKey = `${model}:${url}`;
  const cached = contentCache.get(cacheKey);

  // Return cached content if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.content;
  }

  try {
    const response = await fetch(
      `https://cdn.builder.io/api/v3/content/${model}?url=${encodeURIComponent(url)}&apiKey=${apiKey}&cachebust=true`,
      {
        signal: AbortSignal.timeout(3000),
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      // Try fallback content
      const fallback = await getFallbackContent(model, url);
      if (fallback) return fallback;

      throw new Error(`Builder.io API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.results?.[0] || null;

    // Cache the result
    if (content) {
      contentCache.set(cacheKey, { content, timestamp: Date.now() });
    }

    return content;
  } catch (error) {
    console.error('Builder.io fetch failed:', error);

    // Return fallback content
    return getFallbackContent(model, url);
  }
};

// Fallback content loader
async function getFallbackContent(model: string, url: string) {
  try {
    // Try to load static fallback content
    const module = await import(`./content/${model}/${url.replace(/\//g, '_')}.json`);
    return module.default;
  } catch {
    return null;
  }
}
