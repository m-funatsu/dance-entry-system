#!/usr/bin/env node

/**
 * Supabase Active Keep-Alive Script
 * 
 * This script creates a test entry record and immediately deletes it
 * to prevent Supabase from becoming inactive due to 7-day inactivity.
 * 
 * Should be run daily via GitHub Actions.
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function keepSupabaseActive() {
  // Generate a proper UUID for the test record
  const crypto = require('crypto');
  const testRecordId = crypto.randomUUID();
  
  try {
    console.log('🔄 Starting Supabase keep-alive process...');
    
    // Step 1: Get an existing user or create a test user for the entry
    console.log('🔍 Finding existing user for test entry...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    let userId;
    if (userError || !users || users.length === 0) {
      console.log('👤 Creating temporary test user...');
      const testUserId = crypto.randomUUID();
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: 'keep-alive-test@example.com',
          name: 'Keep Alive Test User',
          role: 'participant'
        })
        .select()
        .single();

      if (createUserError) {
        throw new Error(`Failed to create test user: ${createUserError.message}`);
      }
      userId = newUser.id;
      console.log(`✅ Test user created with ID: ${userId}`);
    } else {
      userId = users[0].id;
      console.log(`✅ Using existing user ID: ${userId}`);
    }

    // Step 2: Create a test entry record
    console.log('📝 Creating test entry record...');
    const { data: entry, error: insertError } = await supabase
      .from('entries')
      .insert({
        id: testRecordId,
        user_id: userId,
        dance_style: 'keep-alive-test',
        team_name: 'Keep Alive Test',
        participant_names: 'Test Participant',
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create test record: ${insertError.message}`);
    }

    console.log(`✅ Test record created with ID: ${entry.id}`);

    // Step 3: Verify the record exists
    console.log('🔍 Verifying test record...');
    const { data: verifyEntry, error: selectError } = await supabase
      .from('entries')
      .select('id, dance_style, created_at')
      .eq('id', testRecordId)
      .single();

    if (selectError || !verifyEntry) {
      throw new Error(`Failed to verify test record: ${selectError?.message || 'Record not found'}`);
    }

    console.log(`✅ Test record verified: ${verifyEntry.dance_style} (created: ${verifyEntry.created_at})`);

    // Step 4: Delete the test record
    console.log('🗑️  Deleting test record...');
    const { error: deleteError } = await supabase
      .from('entries')
      .delete()
      .eq('id', testRecordId);

    if (deleteError) {
      throw new Error(`Failed to delete test record: ${deleteError.message}`);
    }

    console.log('✅ Test record deleted successfully');

    // Step 5: Verify deletion
    console.log('🔍 Verifying deletion...');
    const { data: deletedCheck, error: checkError } = await supabase
      .from('entries')
      .select('id')
      .eq('id', testRecordId);

    if (checkError) {
      throw new Error(`Failed to verify deletion: ${checkError.message}`);
    }

    if (deletedCheck && deletedCheck.length > 0) {
      throw new Error('Test record was not properly deleted');
    }

    console.log('✅ Deletion verified - test record no longer exists');

    // Step 6: Get current database stats for monitoring
    const { count, error: countError } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Current entries count: ${count}`);
    }

    console.log('🎉 Supabase keep-alive completed successfully!');
    console.log(`⏰ Execution time: ${new Date().toISOString()}`);
    
    return {
      success: true,
      message: 'Keep-alive completed successfully',
      timestamp: new Date().toISOString(),
      totalEntries: count || 'unknown'
    };

  } catch (error) {
    console.error('❌ Supabase keep-alive failed:', error.message);
    
    // Attempt cleanup in case of partial failure
    try {
      console.log('🧹 Attempting cleanup of test record...');
      await supabase
        .from('entries')
        .delete()
        .eq('id', testRecordId);
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  keepSupabaseActive();
}

module.exports = { keepSupabaseActive };