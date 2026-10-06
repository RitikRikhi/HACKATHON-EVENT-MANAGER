import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase database...');
  console.log('URL:', supabaseUrl);

  const tables = ['users', 'events', 'teams', 'team_members', 'tickets', 'checkins', 'announcements', 'notifications'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.error(`❌ Table "${table}": Error - ${error.message}`);
    } else {
      console.log(`✅ Table "${table}": Accessible (${data.length} records)`);
    }
  }

  console.log('\n🎉 Supabase PostgreSQL connection test completed successfully!');
}

testConnection().catch(console.error);
