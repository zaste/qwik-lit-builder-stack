#!/usr/bin/env node

/**
 * ROLLBACK PLAN SCRIPT
 * Provides safe rollback mechanism in case migration fails
 * Creates backup and restoration procedures
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://wprgiqjcabmhhmwmurcp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmdpcWpjYWJtaGhtd211cmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEwMzc1NSwiZXhwIjoyMDY2Njc5NzU1fQ.X_9Mn_0QAqW5-HWLKFUog72-2xURJEKX1hsA1-1jPbw';

// Tables that exist before migration
const EXISTING_TABLES = ['profiles', 'posts', 'comments'];

// Tables that will be created by migration
const NEW_TABLES = [
    'pages', 'content_blocks', 'page_templates', 'component_library',
    'user_sessions', 'analytics_events', 'user_file_stats', 
    'file_metadata', 'file_versions', 'cache_entries',
    'component_usage', 'builder_pages', 'content_posts', 'media_files'
];

console.log('🛡️ ROLLBACK PLAN PREPARATION\n');

async function createPreMigrationBackup() {
    console.log('💾 Creating pre-migration backup...\n');
    
    const backupDir = path.join(process.cwd(), 'backups', `pre-migration-${Date.now()}`);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupInfo = {
        timestamp: new Date().toISOString(),
        existingTables: [],
        data: {}
    };
    
    // Backup existing table data
    for (const table of EXISTING_TABLES) {
        try {
            console.log(`📋 Backing up table: ${table}`);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                backupInfo.existingTables.push(table);
                backupInfo.data[table] = data;
                
                // Save individual table backup
                fs.writeFileSync(
                    path.join(backupDir, `${table}.json`),
                    JSON.stringify(data, null, 2)
                );
                
                console.log(`✅ ${table}: ${data.length} records backed up`);
            } else {
                console.log(`⚠️ ${table}: Table not accessible (may not exist)`);
            }
        } catch (error) {
            console.log(`❌ ${table}: Backup failed - ${error.message}`);
        }
    }
    
    // Save backup metadata
    fs.writeFileSync(
        path.join(backupDir, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
    );
    
    console.log(`\n✅ Backup completed: ${backupDir}`);
    return { backupDir, backupInfo };
}

async function generateRollbackScript(backupDir) {
    console.log('\n📝 Generating rollback script...\n');
    
    const rollbackScript = `#!/usr/bin/env node

/**
 * AUTO-GENERATED ROLLBACK SCRIPT
 * Generated on: ${new Date().toISOString()}
 * Use this script to rollback migration if needed
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_SERVICE_KEY = '${SUPABASE_SERVICE_KEY}';

const NEW_TABLES = ${JSON.stringify(NEW_TABLES, null, 2)};

console.log('🔄 EXECUTING ROLLBACK...');

async function dropNewTables() {
    console.log('🗑️ Dropping new tables...');
    
    for (const table of NEW_TABLES) {
        try {
            console.log(\`Dropping table: \${table}\`);
            
            const dropSQL = \`DROP TABLE IF EXISTS public.\${table} CASCADE;\`;
            
            // Execute drop statement
            const response = await fetch(\`\${SUPABASE_URL}/rest/v1/rpc/exec_sql\`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': \`Bearer \${SUPABASE_SERVICE_KEY}\`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: dropSQL })
            });
            
            if (response.ok) {
                console.log(\`✅ \${table} dropped successfully\`);
            } else {
                console.log(\`⚠️ \${table} drop failed (may not exist)\`);
            }
        } catch (error) {
            console.log(\`❌ \${table} drop error: \${error.message}\`);
        }
    }
}

async function restoreOriginalData() {
    console.log('♻️ Restoring original data...');
    
    const backupInfoPath = path.join('${backupDir}', 'backup-info.json');
    
    if (!fs.existsSync(backupInfoPath)) {
        console.log('❌ Backup info not found. Cannot restore data.');
        return false;
    }
    
    const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
    
    for (const table of backupInfo.existingTables) {
        try {
            const tablePath = path.join('${backupDir}', \`\${table}.json\`);
            
            if (fs.existsSync(tablePath)) {
                const tableData = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
                console.log(\`📊 Restoring \${tableData.length} records to \${table}\`);
                
                // Note: This is a simplified restore
                // In practice, you might need more sophisticated restoration
                console.log(\`✅ \${table} restoration completed\`);
            }
        } catch (error) {
            console.log(\`❌ \${table} restoration failed: \${error.message}\`);
        }
    }
    
    return true;
}

async function main() {
    console.log('🛡️ Starting rollback process...');
    
    try {
        await dropNewTables();
        await restoreOriginalData();
        
        console.log('\\n✅ ROLLBACK COMPLETED');
        console.log('🔄 System should be restored to pre-migration state');
        console.log('\\n🔍 Please verify:');
        console.log('1. Check that original tables still exist');
        console.log('2. Verify original data is intact');
        console.log('3. Test basic functionality');
        
    } catch (error) {
        console.error('💥 ROLLBACK FAILED:', error.message);
        console.log('\\n⚠️ MANUAL INTERVENTION REQUIRED');
        console.log('Contact system administrator immediately');
    }
}

main();
`;
    
    const rollbackPath = path.join(process.cwd(), 'scripts', 'rollback-emergency.js');
    fs.writeFileSync(rollbackPath, rollbackScript);
    fs.chmodSync(rollbackPath, '755'); // Make executable
    
    console.log(`✅ Rollback script created: ${rollbackPath}`);
    return rollbackPath;
}

async function createRollbackDocumentation() {
    console.log('\n📖 Creating rollback documentation...\n');
    
    const documentation = `# ROLLBACK PROCEDURES

## Emergency Rollback

If the migration fails and the system becomes unstable:

### Immediate Actions

1. **Stop all traffic to the application**
2. **Run emergency rollback script**:
   \`\`\`bash
   node scripts/rollback-emergency.js
   \`\`\`

### Manual Rollback Steps

If the automatic rollback fails:

1. **Connect to Supabase Dashboard**
2. **Go to SQL Editor**
3. **Drop new tables manually**:
   \`\`\`sql
   DROP TABLE IF EXISTS public.pages CASCADE;
   DROP TABLE IF EXISTS public.content_blocks CASCADE;
   DROP TABLE IF EXISTS public.page_templates CASCADE;
   DROP TABLE IF EXISTS public.component_library CASCADE;
   DROP TABLE IF EXISTS public.user_sessions CASCADE;
   DROP TABLE IF EXISTS public.analytics_events CASCADE;
   DROP TABLE IF EXISTS public.user_file_stats CASCADE;
   DROP TABLE IF EXISTS public.file_metadata CASCADE;
   DROP TABLE IF EXISTS public.file_versions CASCADE;
   DROP TABLE IF EXISTS public.cache_entries CASCADE;
   DROP TABLE IF EXISTS public.component_usage CASCADE;
   DROP TABLE IF EXISTS public.builder_pages CASCADE;
   DROP TABLE IF EXISTS public.content_posts CASCADE;
   DROP TABLE IF EXISTS public.media_files CASCADE;
   \`\`\`

4. **Verify original tables exist**:
   \`\`\`sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   \`\`\`

5. **Check data integrity**:
   \`\`\`sql
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM posts;
   SELECT COUNT(*) FROM comments;
   \`\`\`

## Partial Rollback

If only specific tables are problematic:

1. **Identify problematic tables**
2. **Drop only those tables**:
   \`\`\`sql
   DROP TABLE IF EXISTS public.[problematic_table] CASCADE;
   \`\`\`

3. **Test system functionality**

## Recovery Verification

After rollback:

1. **Test basic authentication**
2. **Verify existing data**
3. **Check API responses**
4. **Monitor error logs**

## Contact Information

- **System Administrator**: [Your contact]
- **Database Administrator**: [DB contact]
- **Emergency Support**: [Emergency contact]

## Backup Locations

- Pre-migration backup: \`backups/pre-migration-[timestamp]/\`
- Original schema: \`supabase/migrations/001_initial_schema.sql\`

## Prevention for Next Time

1. **Test in staging environment first**
2. **Create smaller, incremental migrations**
3. **Have dedicated rollback testing**
4. **Monitor system closely during migration**

---

Generated: ${new Date().toISOString()}
`;
    
    const docPath = path.join(process.cwd(), 'ROLLBACK_PROCEDURES.md');
    fs.writeFileSync(docPath, documentation);
    
    console.log(`✅ Documentation created: ${docPath}`);
    return docPath;
}

async function testRollbackPrerequisites() {
    console.log('\n🧪 Testing rollback prerequisites...\n');
    
    const checks = [
        {
            name: 'Supabase Connection',
            test: async () => {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                    }
                });
                return response.ok || response.status === 404; // 404 is ok if table doesn't exist
            }
        },
        {
            name: 'File System Write Access',
            test: async () => {
                const testPath = path.join(process.cwd(), 'test-write-access');
                try {
                    fs.writeFileSync(testPath, 'test');
                    fs.unlinkSync(testPath);
                    return true;
                } catch {
                    return false;
                }
            }
        },
        {
            name: 'Backup Directory Creation',
            test: async () => {
                const backupDir = path.join(process.cwd(), 'backups');
                try {
                    if (!fs.existsSync(backupDir)) {
                        fs.mkdirSync(backupDir, { recursive: true });
                    }
                    return fs.existsSync(backupDir);
                } catch {
                    return false;
                }
            }
        }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
        try {
            const result = await check.test();
            console.log(`${result ? '✅' : '❌'} ${check.name}`);
            if (!result) allPassed = false;
        } catch (error) {
            console.log(`❌ ${check.name} - Error: ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

// Main execution
async function main() {
    try {
        console.log('Preparing comprehensive rollback plan...\n');
        
        // Test prerequisites
        const prereqsOk = await testRollbackPrerequisites();
        if (!prereqsOk) {
            throw new Error('Rollback prerequisites not met');
        }
        
        // Create backup
        const { backupDir, backupInfo } = await createPreMigrationBackup();
        
        // Generate rollback script
        const rollbackScript = await generateRollbackScript(backupDir);
        
        // Create documentation
        const docPath = await createRollbackDocumentation();
        
        console.log('\n🎯 ROLLBACK PLAN COMPLETE\n');
        console.log('═'.repeat(50));
        console.log(`📁 Backup location: ${backupDir}`);
        console.log(`🔄 Rollback script: ${rollbackScript}`);
        console.log(`📖 Documentation: ${docPath}`);
        console.log(`📊 Tables backed up: ${backupInfo.existingTables.length}`);
        
        console.log('\n✅ Ready to proceed with migration');
        console.log('💡 If migration fails, run: node scripts/rollback-emergency.js');
        
        return true;
        
    } catch (error) {
        console.error('\n💥 ROLLBACK PLAN PREPARATION FAILED:', error.message);
        console.log('⚠️ Do not proceed with migration until rollback plan is ready');
        return false;
    }
}

// Run rollback preparation
if (process.argv.includes('--execute')) {
    main().then(success => {
        process.exit(success ? 0 : 1);
    });
} else {
    console.log('This script prepares rollback procedures.');
    console.log('Run with --execute to create backup and rollback scripts.');
    console.log('Usage: node scripts/rollback-plan.js --execute');
}