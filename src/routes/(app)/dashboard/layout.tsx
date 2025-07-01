import { component$, Slot } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const location = useLocation();
  const currentPath = location.url.pathname;

  const navItems = [
    { 
      path: '/dashboard', 
      label: '🏠 Dashboard', 
      description: 'System overview and real-time stats',
      status: 'live'
    },
    { 
      path: '/dashboard/analytics', 
      label: '📈 Analytics', 
      description: 'Real database metrics and performance',
      status: 'live'
    },
    { 
      path: '/dashboard/media', 
      label: '📁 Media', 
      description: 'Cloudflare R2 file storage',
      status: 'live'
    },
    { 
      path: '/dashboard/components', 
      label: '🧩 Components', 
      description: 'LIT Web Components with Spectrum tokens',
      status: 'live'
    },
    { 
      path: '/dashboard/posts', 
      label: '📝 Posts', 
      description: 'Content management with Supabase',
      status: 'live'
    },
    { 
      path: '/dashboard/pages', 
      label: '📄 Pages', 
      description: 'Content pages (basic implementation)',
      status: 'basic'
    }
  ];

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Production Navigation */}
      <nav class="bg-white shadow-sm border-b">
        <div class="container">
          <div class="flex items-center justify-between py-4">
            <div class="flex items-center space-x-4">
              <Link href="/" class="text-2xl font-bold text-blue-600 hover:text-blue-700">
                🚀 Production Platform
              </Link>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                ✅ LIVE
              </span>
            </div>
            
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">
                Real-time system status
              </span>
              <a href="/api/health" target="_blank" class="text-green-600 hover:text-green-700 text-sm font-medium">
                Health Check →
              </a>
            </div>
          </div>
          
          <div class="flex space-x-1 pb-4">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                class={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath === item.path 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={item.description}
              >
                <span>{item.label}</span>
                {item.status === 'live' && (
                  <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
                {item.status === 'basic' && (
                  <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                )}
              </Link>
            ))}
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