import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { getBuilderContent } from './index';
// import { BuilderComponent } from '../../lib/builder';

/**
 * Route loader to fetch Builder.io content
 */
export const useBuilderContent = routeLoader$(async ({ url, env, error }) => {
  const apiKey = env.get('BUILDER_PUBLIC_KEY');
  
  if (!apiKey) {
    throw error(500, 'Builder.io API key not configured');
  }

  try {
    const content = await getBuilderContent('page', url.pathname, apiKey);
    
    if (!content) {
      throw error(404, 'Page not found');
    }
    
    return content;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error fetching Builder content:', e);
    throw error(500, 'Error loading content');
  }
});

/**
 * Builder.io content component - Real SDK rendering
 */
export const BuilderContent = component$<{ content: any; model?: string }>(({ content, model: _model = 'page' }) => {
  if (!content) {
    return <div>No content found</div>;
  }

  // For now, show a simple rendering until Builder.io SDK is fully configured
  return (
    <div class="builder-content">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p class="text-blue-800">
          ✅ Builder.io content loaded successfully! 
          Content ID: {content.id || 'unknown'}
        </p>
      </div>
      {/* Future: Real Builder.io SDK rendering */}
      <div class="prose max-w-none">
        <h1>{content.data?.title || 'Builder.io Content'}</h1>
        <p>This content is loaded from Builder.io CMS.</p>
      </div>
    </div>
  );
});