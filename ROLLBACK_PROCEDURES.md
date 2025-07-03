# ROLLBACK PROCEDURES

## Emergency Rollback

If the migration fails and the system becomes unstable:

### Immediate Actions

1. **Stop all traffic to the application**
2. **Run emergency rollback script**:
   ```bash
   node scripts/rollback-emergency.js
   ```

### Manual Rollback Steps

If the automatic rollback fails:

1. **Connect to Supabase Dashboard**
2. **Go to SQL Editor**
3. **Drop new tables manually**:
   ```sql
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
   ```

4. **Verify original tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

5. **Check data integrity**:
   ```sql
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM posts;
   SELECT COUNT(*) FROM comments;
   ```

## Partial Rollback

If only specific tables are problematic:

1. **Identify problematic tables**
2. **Drop only those tables**:
   ```sql
   DROP TABLE IF EXISTS public.[problematic_table] CASCADE;
   ```

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

- Pre-migration backup: `backups/pre-migration-[timestamp]/`
- Original schema: `supabase/migrations/001_initial_schema.sql`

## Prevention for Next Time

1. **Test in staging environment first**
2. **Create smaller, incremental migrations**
3. **Have dedicated rollback testing**
4. **Monitor system closely during migration**

---

Generated: 2025-07-02T20:03:55.412Z
