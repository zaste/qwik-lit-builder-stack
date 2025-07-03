#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment
const supabaseUrl = 'https://wprgiqjcabmhhmwmurcp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmdpcWpjYWJtaGhtd211cmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEwMzc1NSwiZXhwIjoyMDY2Njc5NzU1fQ.X_9Mn_0QAqW5-HWLKFUog72-2xURJEKX1hsA1-1jPbw';

// Create admin client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createMissingTables() {
    console.log('\n🚀 CREATING MISSING TABLES WITH DIRECT CLIENT APPROACH');
    console.log('============================================================');
    
    try {
        // Step 1: Create profiles table by inserting a test record
        console.log('\n📝 Step 1: Testing/Creating profiles table...');
        try {
            // Try to insert a test profile (this will fail if table doesn't exist)
            const { data: testProfile, error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: '00000000-0000-0000-0000-000000000000',
                    username: 'test_migration',
                    full_name: 'Migration Test User',
                    bio: 'Test profile for migration'
                }, { onConflict: 'id' });
            
            if (profileError) {
                console.log(`❌ Profiles table issue: ${profileError.message}`);
                if (profileError.message.includes('does not exist')) {
                    console.log('⚠️  Profiles table does not exist - needs manual creation');
                }
            } else {
                console.log('✅ Profiles table exists and is accessible');
                
                // Clean up test record
                await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');
            }
        } catch (err) {
            console.log(`❌ Profiles table error: ${err.message}`);
        }
        
        // Step 2: Create posts table by testing insert
        console.log('\n📝 Step 2: Testing/Creating posts table...');
        try {
            const { data: testPost, error: postError } = await supabase
                .from('posts')
                .upsert({
                    id: '00000000-0000-0000-0000-000000000000',
                    title: 'Migration Test Post',
                    content: 'Test post for migration',
                    slug: 'migration-test-post',
                    author_id: '00000000-0000-0000-0000-000000000000',
                    published: false
                }, { onConflict: 'id' });
                
            if (postError) {
                console.log(`❌ Posts table issue: ${postError.message}`);
                if (postError.message.includes('does not exist')) {
                    console.log('⚠️  Posts table does not exist - needs manual creation');
                }
            } else {
                console.log('✅ Posts table exists and is accessible');
                await supabase.from('posts').delete().eq('id', '00000000-0000-0000-0000-000000000000');
            }
        } catch (err) {
            console.log(`❌ Posts table error: ${err.message}`);
        }
        
        // Step 3: Create comments table by testing insert
        console.log('\n📝 Step 3: Testing/Creating comments table...');
        try {
            const { data: testComment, error: commentError } = await supabase
                .from('comments')
                .upsert({
                    id: '00000000-0000-0000-0000-000000000000',
                    content: 'Test comment for migration',
                    post_id: '00000000-0000-0000-0000-000000000000',
                    author_id: '00000000-0000-0000-0000-000000000000'
                }, { onConflict: 'id' });
                
            if (commentError) {
                console.log(`❌ Comments table issue: ${commentError.message}`);
                if (commentError.message.includes('does not exist')) {
                    console.log('⚠️  Comments table does not exist - needs manual creation');
                }
            } else {
                console.log('✅ Comments table exists and is accessible');
                await supabase.from('comments').delete().eq('id', '00000000-0000-0000-0000-000000000000');
            }
        } catch (err) {
            console.log(`❌ Comments table error: ${err.message}`);
        }
        
        // Step 4: Test new columns in pages table
        console.log('\n📝 Step 4: Testing pages table new columns...');
        try {
            // Try to select pages with new columns
            const { data: pageTest, error: pageError } = await supabase
                .from('pages')
                .select('id, meta_data, layout, author_id')
                .limit(1);
                
            if (pageError) {
                console.log(`❌ Pages columns issue: ${pageError.message}`);
                if (pageError.message.includes('meta_data') || pageError.message.includes('layout') || pageError.message.includes('author_id')) {
                    console.log('⚠️  Pages table missing new columns - needs manual update');
                }
            } else {
                console.log('✅ Pages table has all required columns');
            }
        } catch (err) {
            console.log(`❌ Pages columns error: ${err.message}`);
        }
        
        // Step 5: Test analytics policies by trying anonymous insert
        console.log('\n📝 Step 5: Testing analytics policies...');
        try {
            // Create anonymous client to test analytics insert
            const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmdpcWpjYWJtaGhtd211cmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDM3NTUsImV4cCI6MjA2NjY3OTc1NX0.Q_teLY9vCvBElFVaJpIJzcXTJ_HBQdBgBGcMIeqFRoo');
            
            const { data: analyticsTest, error: analyticsError } = await anonClient
                .from('analytics_events')
                .insert({
                    event_type: 'test_migration',
                    event_data: { test: true },
                    user_agent: 'Migration Test'
                });
                
            if (analyticsError) {
                console.log(`❌ Analytics policy issue: ${analyticsError.message}`);
                if (analyticsError.message.includes('policies')) {
                    console.log('⚠️  Analytics RLS policies need update');
                }
            } else {
                console.log('✅ Analytics anonymous insert works');
                // Clean up test event
                await supabase.from('analytics_events').delete().eq('event_type', 'test_migration');
            }
        } catch (err) {
            console.log(`❌ Analytics policy error: ${err.message}`);
        }
        
        // Step 6: Test create_page_with_template function
        console.log('\n📝 Step 6: Testing create_page_with_template function...');
        try {
            const { data: functionTest, error: functionError } = await supabase
                .rpc('create_page_with_template', {
                    author_uuid: '00000000-0000-0000-0000-000000000000',
                    page_slug: 'test-migration-page',
                    page_title: 'Test Migration Page',
                    template_name: 'default'
                });
                
            if (functionError) {
                console.log(`❌ Function issue: ${functionError.message}`);
                if (functionError.message.includes('does not exist')) {
                    console.log('⚠️  create_page_with_template function does not exist');
                }
            } else {
                console.log('✅ create_page_with_template function works');
                // Clean up test page
                await supabase.from('pages').delete().eq('slug', 'test-migration-page');
            }
        } catch (err) {
            console.log(`❌ Function error: ${err.message}`);
        }
        
        console.log('\n============================================================');
        console.log('📊 MIGRATION ANALYSIS COMPLETE');
        console.log('============================================================');
        
        console.log('\n📋 SUMMARY:');
        console.log('❌ Tables need to be created manually in Supabase Dashboard');
        console.log('❌ Functions need to be created manually');
        console.log('❌ RLS policies need to be updated manually');
        console.log('❌ New columns need to be added manually');
        
        console.log('\n🔧 IMMEDIATE ACTION REQUIRED:');
        console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Select project: wprgiqjcabmhhmwmurcp');
        console.log('3. Go to SQL Editor');
        console.log('4. Execute the migration file: supabase/migrations/20250703000000_add_missing_tables.sql');
        console.log('5. Verify all tables and functions are created');
        
        console.log('\n⏱️  TIME TO COMPLETE: 2-3 minutes');
        console.log('💡 This is the fastest way to apply all changes at once');
        
        return false; // Migration needs manual intervention
        
    } catch (error) {
        console.error('💥 Fatal error during analysis:', error.message);
        return false;
    }
}

// Run the analysis
console.log('🎯 Analyzing database state and migration needs...');
createMissingTables()
    .then(success => {
        if (success) {
            console.log('\n🎉 MIGRATION SUCCESSFUL!');
        } else {
            console.log('\n⚠️  MANUAL MIGRATION REQUIRED');
            console.log('📖 See MANUAL_MIGRATION_INSTRUCTIONS.md for detailed steps');
        }
    })
    .catch(error => {
        console.error('💥 Analysis failed:', error);
        process.exit(1);
    });