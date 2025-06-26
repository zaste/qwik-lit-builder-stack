-- Seed data for development
-- This assumes you have created test users through Supabase Auth

-- Insert sample profiles (you'll need to update the IDs with actual user IDs)
INSERT INTO profiles (id, username, full_name, bio, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'alice', 'Alice Johnson', 'Full-stack developer passionate about web performance', 'https://avatars.githubusercontent.com/u/1'),
  ('00000000-0000-0000-0000-000000000002', 'bob', 'Bob Smith', 'UI/UX designer and front-end developer', 'https://avatars.githubusercontent.com/u/2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (title, content, published, author_id, slug)
VALUES
  (
    'Getting Started with Qwik and Supabase',
    'Learn how to build blazing fast applications with Qwik framework and Supabase backend...',
    true,
    '00000000-0000-0000-0000-000000000001',
    'getting-started-qwik-supabase'
  ),
  (
    'Building Real-time Features with Supabase',
    'Discover how to implement real-time collaboration features using Supabase realtime subscriptions...',
    true,
    '00000000-0000-0000-0000-000000000001',
    'realtime-features-supabase'
  ),
  (
    'Design Systems with LIT Web Components',
    'Create reusable component libraries that work everywhere using LIT...',
    true,
    '00000000-0000-0000-0000-000000000002',
    'design-systems-lit-components'
  ),
  (
    'Draft: Performance Optimization Tips',
    'This is a draft post about performance optimization...',
    false,
    '00000000-0000-0000-0000-000000000001',
    'draft-performance-tips'
  );

-- Insert sample comments
INSERT INTO comments (content, post_id, author_id)
SELECT 
  'Great article! Very helpful for getting started.',
  id,
  '00000000-0000-0000-0000-000000000002'
FROM posts 
WHERE slug = 'getting-started-qwik-supabase'
LIMIT 1;

INSERT INTO comments (content, post_id, author_id)
SELECT 
  'Thanks for sharing these insights!',
  id,
  '00000000-0000-0000-0000-000000000001'
FROM posts 
WHERE slug = 'design-systems-lit-components'
LIMIT 1;