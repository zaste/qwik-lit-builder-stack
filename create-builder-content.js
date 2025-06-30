#!/usr/bin/env node

// Script para crear contenido de ejemplo en Builder.io
const BUILDER_PRIVATE_KEY = 'bpk-42a789d3023147f6949e3a0e9e2c7414';

async function createHomepageContent() {
  const content = {
    data: {
      title: "Welcome to Qwik + LIT + Builder.io",
      subtitle: "Powered by Builder.io CMS",
      blocks: [
        {
          '@type': '@builder.io/sdk:Element',
          '@version': 2,
          component: {
            name: 'div',
            options: {
              className: 'hero-section'
            }
          },
          children: [
            {
              '@type': '@builder.io/sdk:Element',
              '@version': 2,
              component: {
                name: 'h1',
                options: {
                  text: 'Welcome to Builder.io CMS!'
                }
              }
            },
            {
              '@type': '@builder.io/sdk:Element',
              '@version': 2,
              component: {
                name: 'p',
                options: {
                  text: 'This content is dynamically loaded from Builder.io!'
                }
              }
            }
          ]
        }
      ]
    },
    name: 'Homepage Content',
    published: 'published',
    query: [
      {
        '@type': '@builder.io/core:Query',
        operator: 'is',
        property: 'urlPath',
        value: '/'
      }
    ]
  };

  try {
    const response = await fetch('https://builder.io/api/v1/write/page', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BUILDER_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating content:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Content created successfully!');
    console.log('📄 Content ID:', result.id);
    console.log('🌐 Content name:', result.name);
    console.log('📊 Status:', result.published);
    
    return result;
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Ejecutar script
createHomepageContent();