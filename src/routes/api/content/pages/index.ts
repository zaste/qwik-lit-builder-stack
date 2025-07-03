import type { RequestHandler } from '@builder.io/qwik-city';
import { pagesService, generateSlug, validatePageTitle, validateSlug, CMSError } from '../../../../lib/cms';
import { logger } from '../../../../lib/logger';

/**
 * GET /api/content/pages
 * Fetch paginated list of pages
 */
export const onGet: RequestHandler = async ({ json, query, cookie }) => {
  try {
    // Get query parameters
    const page = parseInt(query.get('page') || '1');
    const limit = Math.min(parseInt(query.get('limit') || '20'), 50); // Max 50 items
    const search = query.get('search') || undefined;
    const published = query.get('published') ? query.get('published') === 'true' : undefined;
    const author_only = query.get('author_only') === 'true';

    // Get user from authenticated session
    let author_id: string | undefined;
    if (author_only) {
      const sessionCookie = cookie.get('sb-access-token');
      if (!sessionCookie) {
        json(401, { error: 'Authentication required for author-only requests' });
        return;
      }
      
      // Extract author ID from validated Supabase session
      try {
        const { data: { user }, error } = await supabase.auth.getUser(sessionCookie.value);
        if (error || !user) {
          logger.warn('Invalid session token for author filter', { error: error?.message });
          json(401, { error: 'Invalid session token' });
          return;
        }
        author_id = user.id;
      } catch (error) {
        logger.warn('Failed to validate session token for author filter', { error: error instanceof Error ? error.message : String(error) });
        json(401, { error: 'Invalid session token' });
        return;
      }
    }

    const result = await pagesService.getPages({
      page,
      limit,
      search,
      published,
      author_id
    });

    logger.info('Pages fetched successfully', {
      page,
      limit,
      total: result.pagination.total,
      search: search || 'none'
    });

    json(200, {
      pages: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Error fetching pages', {}, error as Error);
    
    if (error instanceof CMSError) {
      json(error.statusCode || 500, {
        error: error.message,
        code: error.code
      });
    } else {
      json(500, {
        error: 'Failed to fetch pages',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

/**
 * POST /api/content/pages
 * Create new page
 */
export const onPost: RequestHandler = async ({ json, parseBody, cookie }) => {
  try {
    // Parse request body
    const body = await parseBody();
    
    if (!body || typeof body !== 'object') {
      json(400, { error: 'Invalid request body' });
      return;
    }

    const { title, slug, description, template, published } = body as any;

    // Validation
    if (!title || typeof title !== 'string') {
      json(400, { error: 'Title is required and must be a string' });
      return;
    }

    if (!validatePageTitle(title)) {
      json(400, { error: 'Title must be between 1 and 200 characters' });
      return;
    }

    // Generate or validate slug
    let pageSlug = slug;
    if (!pageSlug) {
      pageSlug = generateSlug(title);
    } else if (!validateSlug(pageSlug)) {
      json(400, { error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      return;
    }

    // Get author from authenticated session
    const sessionCookie = cookie.get('sb-access-token');
    if (!sessionCookie) {
      json(401, { error: 'Authentication required' });
      return;
    }

    // Extract author ID from validated Supabase session
    let authorId = null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser(sessionCookie.value);
      if (error || !user) {
        logger.warn('Invalid session token', { error: error?.message });
        json(401, { error: 'Invalid session token' });
        return;
      }
      authorId = user.id;
    } catch (error) {
      logger.warn('Failed to validate session token', { error: error instanceof Error ? error.message : String(error) });
      json(401, { error: 'Invalid session token' });
      return;
    }

    // Prepare page data
    const pageData = {
      title: title.trim(),
      slug: pageSlug,
      description: description ? description.trim() : undefined,
      template: template || 'default',
      published: published === true
    };

    // Create page
    const newPage = await pagesService.createPage(pageData, authorId);

    logger.info('Page created successfully', {
      pageId: newPage.id,
      title: newPage.title,
      slug: newPage.slug,
      published: newPage.published
    });

    json(201, {
      success: true,
      page: {
        id: newPage.id,
        title: newPage.title,
        slug: newPage.slug,
        description: newPage.description,
        template: newPage.template,
        published: newPage.published,
        created_at: newPage.created_at,
        url: `/${newPage.slug}`
      }
    });

  } catch (error) {
    logger.error('Error creating page', {}, error as Error);
    
    if (error instanceof CMSError) {
      json(error.statusCode || 500, {
        error: error.message,
        code: error.code
      });
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific Supabase/database errors
      if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
        json(409, {
          error: 'A page with this slug already exists',
          code: 'DUPLICATE_SLUG'
        });
      } else if (errorMessage.includes('violates check constraint')) {
        json(400, {
          error: 'Invalid page data',
          code: 'VALIDATION_ERROR'
        });
      } else {
        json(500, {
          error: 'Failed to create page',
          details: errorMessage
        });
      }
    }
  }
};