import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const location = useLocation();
  const currentPath = location.url.pathname;

  const navItems = [
    { 
      path: '/dashboard', 
      label: '📊 Overview', 
      description: 'Statistics and analytics'
    },
    { 
      path: '/dashboard/pages', 
      label: '📄 Pages', 
      description: 'Visual page editor (Builder.io)'
    },
    { 
      path: '/dashboard/posts', 
      label: '📝 Posts', 
      description: 'Blog posts and articles'
    },
    { 
      path: '/dashboard/components', 
      label: '🧩 Components', 
      description: 'Design system components'
    },
    { 
      path: '/dashboard/media', 
      label: '📁 Media', 
      description: 'Files and assets'
    },
    { 
      path: '/dashboard/templates', 
      label: '📋 Templates', 
      description: 'Page templates and layouts'
    },
    { 
      path: '/dashboard/workflows', 
      label: '🔄 Workflows', 
      description: 'Automated processes'
    },
    { 
      path: '/dashboard/analytics', 
      label: '📈 Analytics', 
      description: 'Performance and usage'
    },
    { 
      path: '/dashboard/settings', 
      label: '⚙️ Settings', 
      description: 'Configuration and preferences'
    }
  ];

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Unified Navigation */}
      <nav class="bg-white shadow-sm border-b">
        <div class="container">
          <div class="flex space-x-8 py-4">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">Content Management</h1>
            </div>
            <div class="flex space-x-6">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  class={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPath === item.path 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main class="container py-8">
        <Slot />
      </main>
    </div>
  );
});