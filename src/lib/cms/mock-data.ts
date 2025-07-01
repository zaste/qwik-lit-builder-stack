/**
 * Mock data for CMS development mode
 * Used when Supabase is not available or configured
 */

export interface MockPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  template: string;
  view_count: number;
  seo_title?: string;
  seo_description?: string;
  featured_image?: string;
  social_image?: string;
  content?: any;
}

export const mockPages: MockPage[] = [
  {
    id: '1',
    title: 'Welcome to Our Site',
    slug: 'welcome',
    description: 'A warm welcome to our new CMS-powered website',
    published: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    template: 'default',
    view_count: 127,
    seo_title: 'Welcome - Our Amazing Site',
    seo_description: 'Welcome to our site built with Qwik and Supabase CMS'
  },
  {
    id: '2', 
    title: 'About Us',
    slug: 'about',
    description: 'Learn more about our company and mission',
    published: true,
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
    template: 'default',
    view_count: 89,
    seo_title: 'About Us - Our Company Story',
    seo_description: 'Discover our journey, values and what drives us forward'
  },
  {
    id: '3',
    title: 'Getting Started Guide',
    slug: 'getting-started',
    description: 'A comprehensive guide to get you started',
    published: false,
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T10:00:00Z',  
    template: 'default',
    view_count: 45,
    seo_title: 'Getting Started - Complete Guide',
    seo_description: 'Everything you need to know to get started with our platform'
  },
  {
    id: '4',
    title: 'Feature Showcase',
    slug: 'features',
    description: 'Explore all the amazing features we offer',
    published: true,
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T10:00:00Z',
    template: 'default',
    view_count: 203,
    seo_title: 'Features - What We Offer',
    seo_description: 'Comprehensive list of features and capabilities'
  }
];

let nextId = 5;

export class MockPagesService {
  private pages: MockPage[] = [...mockPages];

  async getPages(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const { page = 1, limit = 10, search } = options;
    
    let filteredPages = [...this.pages];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPages = filteredPages.filter(page => 
        page.title.toLowerCase().includes(searchLower) ||
        page.description?.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by created_at descending
    filteredPages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPages = filteredPages.slice(startIndex, endIndex);
    
    return {
      data: paginatedPages,
      pagination: {
        page,
        limit,
        total: filteredPages.length,
        pages: Math.ceil(filteredPages.length / limit)
      }
    };
  }

  async getPageBySlug(slug: string): Promise<MockPage | null> {
    const page = this.pages.find(p => p.slug === slug);
    if (page) {
      // Increment view count
      page.view_count += 1;
    }
    return page || null;
  }

  async createPage(pageData: {
    title: string;
    slug: string;
    description?: string;
    template?: string;
    published?: boolean;
  }): Promise<MockPage> {
    // Check if slug already exists
    if (this.pages.find(p => p.slug === pageData.slug)) {
      throw new Error(`Page with slug "${pageData.slug}" already exists`);
    }

    const newPage: MockPage = {
      id: String(nextId++),
      title: pageData.title,
      slug: pageData.slug,
      description: pageData.description,
      published: pageData.published || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      template: pageData.template || 'default',
      view_count: 0,
      seo_title: pageData.title,
      seo_description: pageData.description
    };

    this.pages.push(newPage);
    return newPage;
  }

  async updatePage(id: string, updates: Partial<MockPage>): Promise<MockPage> {
    const pageIndex = this.pages.findIndex(p => p.id === id);
    if (pageIndex === -1) {
      throw new Error(`Page with id "${id}" not found`);
    }

    this.pages[pageIndex] = {
      ...this.pages[pageIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.pages[pageIndex];
  }

  async deletePage(id: string): Promise<void> {
    const pageIndex = this.pages.findIndex(p => p.id === id);
    if (pageIndex === -1) {
      throw new Error(`Page with id "${id}" not found`);
    }

    this.pages.splice(pageIndex, 1);
  }
}

export const mockPagesService = new MockPagesService();