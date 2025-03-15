require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exploreSchema() {
  console.log('Exploring database schema...');
  
  // Find all tables
  console.log('\nLooking for WordNet-related tables:');
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .ilike('table_name', '%word%');
  
  if (tableError) {
    console.error('Error fetching tables:', tableError);
    return;
  }
  
  console.log('Tables that might contain word data:');
  tables.forEach(table => {
    console.log(`- ${table.table_name}`);
  });
  
  // Filter for likely WordNet tables
  const wordnetTables = tables.filter(t => 
    t.table_name.includes('wordnet') || 
    t.table_name.includes('synset') ||
    t.table_name.includes('lemma')
  );
  
  console.log('\nLikely WordNet tables:');
  wordnetTables.forEach(table => {
    console.log(`- ${table.table_name}`);
  });
  
  // Explore schema of the most promising tables
  if (wordnetTables.length > 0) {
    for (const table of wordnetTables) {
      console.log(`\nExploring schema of ${table.table_name}:`);
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', table.table_name)
        .eq('table_schema', 'public');
      
      if (columnError) {
        console.error(`Error fetching columns for ${table.table_name}:`, columnError);
        continue;
      }
      
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Sample data
      console.log(`\nSample data from ${table.table_name}:`);
      const { data: sampleData, error: sampleError } = await supabase
        .from(table.table_name)
        .select('*')
        .limit(5);
      
      if (sampleError) {
        console.error(`Error fetching sample data for ${table.table_name}:`, sampleError);
        continue;
      }
      
      console.log(JSON.stringify(sampleData, null, 2));
    }
  }
  
  // Look for word forms specifically
  console.log('\nLooking for tables that might contain word form mappings:');
  for (const table of tables) {
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', table.table_name)
      .eq('table_schema', 'public');
    
    if (columnError) continue;
    
    // Check if this table has columns related to word forms or lemmas
    const hasFormColumns = columns.some(col => 
      col.column_name.includes('form') || 
      col.column_name.includes('lemma') ||
      col.column_name.includes('word') ||
      col.column_name.includes('base')
    );
    
    if (hasFormColumns) {
      console.log(`- ${table.table_name} has columns related to word forms`);
      console.log(`  Columns: ${columns.map(c => c.column_name).join(', ')}`);
    }
  }
}

exploreSchema()
  .then(() => console.log('\nSchema exploration complete.'))
  .catch(err => console.error('Error exploring schema:', err));
