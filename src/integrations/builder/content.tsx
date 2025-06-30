import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { getBuilderContent } from './index';

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
    console.error('Error fetching Builder content:', e);
    throw error(500, 'Error loading content');
  }
});

/**
 * Builder.io content component
 */
export const BuilderContent = component$<{ content: any }>(({ content }) => {
  if (!content) {
    return <div>No content found</div>;
  }

  // TODO: Implement proper Builder.io content rendering
  // This is a simplified version
  return (
    <div class="builder-content">
      {content.data?.blocks?.map((block: any, index: number) => (
        <div key={index} class="builder-block">
          {/* Render block based on type */}
          {block.component === 'Text' && <div dangerouslySetInnerHTML={block.options.text} />}
          {block.component === 'Image' && (
            <img src={block.options.image} alt={block.options.alt || ''} />
          )}
          {/* Add more block types as needed */}
        </div>
      ))}
    </div>
  );
});
