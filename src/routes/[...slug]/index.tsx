/**
 * Dynamic Page Renderer
 * Renders pages created through the CMS system
 */

import { component$, Resource } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, type StaticGenerateHandler } from '@builder.io/qwik-city';
import { pagesService } from '../../lib/cms';
import { logger } from '../../lib/logger';
import { sanitizeRichHTML } from '../../lib/security/html-sanitizer';

// Route loader to fetch page data
export const usePageData = routeLoader$(async ({ params, status }) => {
  const slug = params.slug;
  
  if (!slug) {
    status(404);
    return null;
  }

  try {
    // Fetch page with content blocks
    const page = await pagesService.getPage(slug, true);
    
    if (!page) {
      status(404);
      return null;
    }

    // Only show published pages to public
    if (!page.published) {
      status(404);
      return null;
    }

    // Increment view count (fire and forget)
    pagesService.incrementViewCount(page.id).catch(() => {
      // Silently handle view count errors
    });

    return page;
  } catch (error) {
    logger.error('Error loading page', { slug }, error as Error);
    status(500);
    return null;
  }
});

// Static generation for published pages
export const onStaticGenerate: StaticGenerateHandler = async () => {
  try {
    const result = await pagesService.getPublishedPages({ limit: 100 });
    return {
      params: result.data.map(page => ({ slug: page.slug }))
    };
  } catch (error) {
    logger.error('Error generating static pages', {}, error as Error);
    return { params: [] };
  }
};

// Content Block Renderer Component
const ContentBlockRenderer = component$<{ block: any }>(({ block }) => {
  const blockProps = block.properties || {};

  // Render different component types
  switch (block.component_name || block.block_type) {
    case 'ds-button':
      return (
        <ds-button
          variant={blockProps.variant || 'primary'}
          size={blockProps.size || 'md'}
          disabled={blockProps.disabled || false}
        >
          {blockProps.label || 'Button'}
        </ds-button>
      );

    case 'ds-card':
      return (
        <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {blockProps.title && (
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{blockProps.title}</h3>
          )}
          {blockProps.subtitle && (
            <p class="text-gray-600 mb-4">{blockProps.subtitle}</p>
          )}
          {blockProps.content && (
            <div dangerouslySetInnerHTML={sanitizeRichHTML(blockProps.content)} />
          )}
          {block.children && block.children.length > 0 && (
            <div>
              {block.children.map((child: any, index: number) => (
                <ContentBlockRenderer key={`${block.id}-child-${index}`} block={child} />
              ))}
            </div>
          )}
        </div>
      );

    case 'ds-input':
      return (
        <ds-input
          type={blockProps.type || 'text'}
          label={blockProps.label || 'Input'}
          placeholder={blockProps.placeholder || ''}
          required={blockProps.required || false}
          disabled={blockProps.disabled || false}
        />
      );

    case 'ds-file-upload':
      return (
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p class="text-gray-600">{blockProps.label || 'Upload File'}</p>
          <p class="text-sm text-gray-500 mt-2">
            {blockProps.accept || '*/*'} • Max {((blockProps.maxSize || 10485760) / 1024 / 1024).toFixed(1)}MB
          </p>
        </div>
      );

    case 'heading':
      const level = blockProps.level || 2;
      const className = `font-bold text-gray-900 ${
        level === 1 ? 'text-4xl' :
        level === 2 ? 'text-3xl' :
        level === 3 ? 'text-2xl' :
        level === 4 ? 'text-xl' :
        level === 5 ? 'text-lg' : 'text-base'
      }`;
      
      if (level === 1) return <h1 class={className}>{blockProps.text || 'Heading'}</h1>;
      if (level === 2) return <h2 class={className}>{blockProps.text || 'Heading'}</h2>;
      if (level === 3) return <h3 class={className}>{blockProps.text || 'Heading'}</h3>;
      if (level === 4) return <h4 class={className}>{blockProps.text || 'Heading'}</h4>;
      if (level === 5) return <h5 class={className}>{blockProps.text || 'Heading'}</h5>;
      return <h6 class={className}>{blockProps.text || 'Heading'}</h6>;

    case 'paragraph':
      return (
        <p class="text-gray-700 leading-relaxed">
          {blockProps.text || 'Paragraph text'}
        </p>
      );

    case 'image':
      return (
        <div class="my-6">
          <img
            src={blockProps.src || '/placeholder.jpg'}
            alt={blockProps.alt || ''}
            class={`max-w-full h-auto ${blockProps.className || ''}`}
            loading="lazy"
            width={blockProps.width || "800"}
            height={blockProps.height || "600"}
          />
          {blockProps.caption && (
            <p class="text-sm text-gray-500 mt-2 text-center">{blockProps.caption}</p>
          )}
        </div>
      );

    case 'spacer':
      return (
        <div 
          class="w-full" 
          style={{ height: `${blockProps.height || 32}px` }}
        />
      );

    case 'html':
      return (
        <div 
          class={blockProps.className || ''}
          dangerouslySetInnerHTML={sanitizeRichHTML(blockProps.html || '')}
        />
      );

    default:
      // Fallback for unknown components
      return (
        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-800 text-sm">
            Unknown component: {block.component_name || block.block_type}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre class="text-xs text-yellow-600 mt-2 overflow-auto">
              {JSON.stringify(blockProps, null, 2)}
            </pre>
          )}
        </div>
      );
  }
});

// Page Layout Component
const PageLayout = component$<{ page: any; template: string }>(({ page, template }) => {
  const blocks = page.blocks || [];
  
  // Group blocks by region
  const blocksByRegion = blocks.reduce((acc: any, block: any) => {
    const region = block.region || 'main';
    if (!acc[region]) acc[region] = [];
    acc[region].push(block);
    return acc;
  }, {});

  // Sort blocks within each region by order_index
  Object.keys(blocksByRegion).forEach(region => {
    blocksByRegion[region].sort((a: any, b: any) => a.order_index - b.order_index);
  });

  // Render based on template
  switch (template) {
    case 'landing':
      return (
        <div class="min-h-screen">
          {/* Header */}
          {blocksByRegion.header && (
            <header class="bg-white shadow-sm">
              <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {blocksByRegion.header.map((block: any) => (
                  <ContentBlockRenderer key={block.id} block={block} />
                ))}
              </div>
            </header>
          )}

          {/* Main Content */}
          <main class="flex-1">
            {blocksByRegion.main && (
              <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="space-y-12">
                  {blocksByRegion.main.map((block: any) => (
                    <ContentBlockRenderer key={block.id} block={block} />
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          {blocksByRegion.footer && (
            <footer class="bg-gray-50 border-t">
              <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {blocksByRegion.footer.map((block: any) => (
                  <ContentBlockRenderer key={block.id} block={block} />
                ))}
              </div>
            </footer>
          )}
        </div>
      );

    case 'blog':
      return (
        <article class="min-h-screen bg-white">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Article Header */}
            <header class="mb-12">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
              {page.description && (
                <p class="text-xl text-gray-600 mb-6">{page.description}</p>
              )}
              <div class="flex items-center text-sm text-gray-500">
                <time dateTime={page.created_at}>
                  {new Date(page.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <span class="mx-2">•</span>
                <span>{page.view_count} views</span>
              </div>
            </header>

            {/* Article Content */}
            <div class="prose prose-lg max-w-none">
              {blocksByRegion.main && blocksByRegion.main.map((block: any) => (
                <ContentBlockRenderer key={block.id} block={block} />
              ))}
            </div>
          </div>
        </article>
      );

    default:
      // Default template
      return (
        <div class="min-h-screen bg-gray-50">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <header class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900">{page.title}</h1>
              {page.description && (
                <p class="text-gray-600 mt-2">{page.description}</p>
              )}
            </header>

            {/* Main Content Grid */}
            <div class={`grid gap-8 ${blocksByRegion.sidebar ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {/* Main Content */}
              <main class={blocksByRegion.sidebar ? 'lg:col-span-2' : 'col-span-1'}>
                {blocksByRegion.main && (
                  <div class="space-y-6">
                    {blocksByRegion.main.map((block: any) => (
                      <ContentBlockRenderer key={block.id} block={block} />
                    ))}
                  </div>
                )}
              </main>

              {/* Sidebar */}
              {blocksByRegion.sidebar && (
                <aside class="lg:col-span-1">
                  <div class="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {blocksByRegion.sidebar.map((block: any) => (
                      <ContentBlockRenderer key={block.id} block={block} />
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      );
  }
});

// Main Page Component
export default component$(() => {
  const pageData = usePageData();

  return (
    <Resource
      value={pageData}
      onPending={() => (
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 mt-2">Loading page...</p>
          </div>
        </div>
      )}
      onRejected={(_error) => (
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p class="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
            <a
              href="/"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go Home
            </a>
          </div>
        </div>
      )}
      onResolved={(page) => {
        if (!page) {
          return (
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
              <div class="text-center">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p class="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                <a
                  href="/"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go Home
                </a>
              </div>
            </div>
          );
        }

        return <PageLayout page={page} template={page.template} />;
      }}
    />
  );
});

// Dynamic document head based on page data
export const head: DocumentHead = ({ resolveValue }) => {
  const page = resolveValue(usePageData);
  
  if (!page) {
    return {
      title: 'Page Not Found',
      meta: [
        { name: 'description', content: 'The requested page could not be found.' }
      ]
    };
  }

  const metaTags = [
    {
      name: 'description',
      content: page.seo_description || page.description || `${page.title} - Learn more about this page.`
    },
    { name: 'robots', content: page.published ? 'index, follow' : 'noindex, nofollow' },
    { property: 'og:title', content: page.seo_title || page.title },
    { property: 'og:description', content: page.seo_description || page.description || '' },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `${import.meta.env.VITE_SITE_URL || ''}/${page.slug}` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: page.seo_title || page.title },
    { name: 'twitter:description', content: page.seo_description || page.description || '' }
  ];

  if (page.featured_image) {
    metaTags.push({ property: 'og:image', content: page.featured_image });
  }
  if (page.social_image) {
    metaTags.push({ property: 'og:image', content: page.social_image });
    metaTags.push({ name: 'twitter:image', content: page.social_image });
  } else if (page.featured_image) {
    metaTags.push({ name: 'twitter:image', content: page.featured_image });
  }

  return {
    title: page.seo_title || page.title,
    meta: metaTags
  };
};