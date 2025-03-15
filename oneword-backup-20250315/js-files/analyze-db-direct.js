require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize the database analysis report
const report = {
  tables: {},
  views: {}, // We might not be able to get views with REST API
  relationships: [],
  tableStats: {},
  redundancies: [],
  recommendations: []
};

// A list of tables we know exist based on previous scripts
const knownTables = [
  'words',
  'app_words'
];

async function analyzeDatabase() {
  console.log('Starting database analysis using Supabase REST API...\n');

  // Get all tables we can access
  await getTables();
  await getTableColumns();
  await getTableStats();
  
  // Analyze the relationships between words and app_words
  await analyzeWordTables();
  
  // Analyze for potential redundancies and make recommendations
  analyzeRedundancies();
  
  // Save the report to a file
  fs.writeFileSync('db-architecture-report.json', JSON.stringify(report, null, 2));
  
  // Print summary of findings
  printSummary();
}

async function getTables() {
  console.log('Trying to detect tables...');
  
  // Start with known tables
  for (const tableName of knownTables) {
    report.tables[tableName] = {
      columns: [],
      row_count: 0,
      relationships: [],
      has_primary_key: false
    };
  }
  
  // Try to detect other tables by attempting to query them
  const potentialTables = [
    'users', 'profiles', 'auth_users', 'auth_identities', 'auth_sessions',
    'word_lists', 'favorites', 'user_progress', 'settings', 'categories',
    'difficulty_levels', 'tags', 'word_tags'
  ];
  
  for (const tableName of potentialTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count(*)')
        .limit(1);
      
      if (!error) {
        report.tables[tableName] = {
          columns: [],
          row_count: 0,
          relationships: [],
          has_primary_key: false
        };
        console.log(`Detected table: ${tableName}`);
      }
    } catch (err) {
      // Table likely doesn't exist, ignore
    }
  }
  
  console.log(`Found ${Object.keys(report.tables).length} tables.`);
}

async function getTableColumns() {
  console.log('Analyzing table columns...');
  
  for (const tableName of Object.keys(report.tables)) {
    try {
      // Get column details by looking at a single record
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const record = data[0];
        const columns = Object.keys(record).map(colName => {
          const value = record[colName];
          return {
            name: colName,
            type: typeof value,
            nullable: value === null,
            is_primary_key: colName === 'id' // Assumption for now
          };
        });
        
        report.tables[tableName].columns = columns;
        report.tables[tableName].has_primary_key = columns.some(col => col.is_primary_key);
        
        console.log(`Analyzed columns for ${tableName}`);
      } else {
        console.log(`No data found in ${tableName} to analyze columns`);
      }
    } catch (err) {
      console.error(`Error analyzing columns for ${tableName}:`, err);
    }
  }
}

async function getTableStats() {
  console.log('Gathering table statistics...');
  
  for (const tableName of Object.keys(report.tables)) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        report.tables[tableName].row_count = count || 0;
        console.log(`${tableName}: ${count} rows`);
      }
    } catch (err) {
      console.error(`Error getting row count for ${tableName}:`, err);
    }
  }
}

async function analyzeWordTables() {
  if (report.tables.words && report.tables.app_words) {
    console.log('Analyzing relationship between words and app_words tables...');
    
    // Check if there is a source_word_id column in app_words
    const hasSourceId = report.tables.app_words.columns.some(col => col.name === 'source_word_id');
    
    if (hasSourceId) {
      report.relationships.push({
        source_table: 'app_words',
        source_column: 'source_word_id',
        target_table: 'words',
        target_column: 'id',
        type: 'foreign_key'
      });
      
      console.log('Detected relationship: app_words.source_word_id references words.id');
      
      // Test if scores are synchronized
      await testScoreSynchronization();
    }
  }
}

async function testScoreSynchronization() {
  try {
    console.log('Testing if difficulty scores are synchronized between words and app_words...');
    
    // Get a sample of matching records
    const { data: appWords, error: appWordsError } = await supabase
      .from('app_words')
      .select('id, word, difficulty_score, source_word_id')
      .not('difficulty_score', 'is', null)
      .limit(5);
    
    if (appWordsError || !appWords || appWords.length === 0) {
      console.error('Could not fetch app_words for sync testing');
      return;
    }
    
    let syncedCount = 0;
    
    for (const appWord of appWords) {
      const { data: mainWord, error: mainWordError } = await supabase
        .from('words')
        .select('id, word, difficulty_score')
        .eq('id', appWord.source_word_id)
        .single();
      
      if (!mainWordError && mainWord) {
        const scoresMatch = Math.abs(appWord.difficulty_score - mainWord.difficulty_score) < 0.0001;
        
        if (scoresMatch) {
          syncedCount++;
        }
        
        console.log(`Word "${appWord.word}": scores ${scoresMatch ? 'match' : 'differ'} (${appWord.difficulty_score} vs ${mainWord.difficulty_score})`);
      }
    }
    
    const areAllSynced = syncedCount === appWords.length;
    
    report.tableStats.wordsSynchronized = {
      sampleSize: appWords.length,
      matchingScores: syncedCount,
      allSynced: areAllSynced
    };
    
    if (areAllSynced) {
      console.log('All tested records have synchronized difficulty scores');
      report.recommendations.push({
        type: 'sync_mechanism',
        message: `The words and app_words tables appear to have synchronized difficulty scores. ` +
                `Consider documenting this synchronization mechanism.`
      });
    } else {
      console.log(`Only ${syncedCount}/${appWords.length} tested records have matching difficulty scores`);
      report.recommendations.push({
        type: 'sync_issue',
        message: `Some records in words and app_words tables have different difficulty scores. ` +
                `Consider implementing a synchronization mechanism.`
      });
    }
  } catch (err) {
    console.error('Error testing score synchronization:', err);
  }
}

function analyzeRedundancies() {
  console.log('Analyzing for redundancies and making recommendations...');
  
  // Check for tables without primary keys
  for (const [tableName, table] of Object.entries(report.tables)) {
    if (!table.has_primary_key) {
      report.recommendations.push({
        type: 'missing_primary_key',
        message: `Table "${tableName}" might not have a primary key. Consider adding one for better data integrity.`
      });
    }
    
    // Check for empty tables
    if (table.row_count === 0) {
      report.redundancies.push({
        type: 'empty_table',
        message: `Table "${tableName}" has no rows. Consider if this table is needed.`
      });
    }
    
    // Check for tables with identical columns (potential duplicates)
    for (const [otherName, otherTable] of Object.entries(report.tables)) {
      if (tableName !== otherName && areColumnsVerySimiLar(table.columns, otherTable.columns)) {
        report.redundancies.push({
          type: 'similar_tables',
          message: `Tables "${tableName}" and "${otherName}" have very similar column structures. Consider if both are needed.`
        });
      }
    }
  }
  
  // Check for potential foreign keys based on naming conventions
  for (const [tableName, table] of Object.entries(report.tables)) {
    const fkCandidates = table.columns.filter(col => 
      col.name.endsWith('_id') && 
      col.name !== 'id'
    );
    
    for (const col of fkCandidates) {
      // Skip if it's already identified as a foreign key
      if (report.relationships.some(rel => 
        rel.source_table === tableName && rel.source_column === col.name
      )) {
        continue;
      }
      
      // Check if there could be a table that this field might reference
      const potentialTableName = col.name.replace('_id', '');
      if (report.tables[potentialTableName] || 
          (potentialTableName === 'user' && report.tables.users)) {
        const targetTable = potentialTableName === 'user' ? 'users' : potentialTableName;
        
        report.recommendations.push({
          type: 'potential_missing_fk',
          message: `Column "${tableName}.${col.name}" might be a foreign key to table "${targetTable}" but was not detected as a relationship.`
        });
      }
    }
  }
  
  // Special check for words and app_words relationship
  if (report.tables.words && report.tables.app_words) {
    // The test was done in analyzeWordTables
  }
  
  console.log(`Generated ${report.redundancies.length} redundancy observations and ${report.recommendations.length} recommendations.`);
}

function printSummary() {
  console.log('\n=== DATABASE ARCHITECTURE SUMMARY ===');
  console.log(`Tables: ${Object.keys(report.tables).length}`);
  console.log(`Relationships: ${report.relationships.length}`);
  console.log(`Potential Redundancies: ${report.redundancies.length}`);
  console.log(`Recommendations: ${report.recommendations.length}`);
  console.log('\nFull report saved to db-architecture-report.json');
  
  // List all tables
  console.log('\n=== TABLES ===');
  for (const [tableName, table] of Object.entries(report.tables)) {
    console.log(`• ${tableName} (${table.row_count} rows, ${table.columns.length} columns)`);
  }
  
  // Print redundancies
  if (report.redundancies.length > 0) {
    console.log('\n=== POTENTIAL REDUNDANCIES ===');
    report.redundancies.forEach((item, index) => {
      console.log(`${index + 1}. ${item.message}`);
    });
  }
  
  // Print recommendations
  if (report.recommendations.length > 0) {
    console.log('\n=== RECOMMENDATIONS ===');
    report.recommendations.forEach((item, index) => {
      console.log(`${index + 1}. ${item.message}`);
    });
  }
  
  // Print details of important tables
  printTableDetails('words');
  printTableDetails('app_words');
}

function printTableDetails(tableName) {
  const table = report.tables[tableName];
  if (!table) return;
  
  console.log(`\n=== TABLE: ${tableName} ===`);
  console.log(`Row count: ${table.row_count}`);
  console.log(`Columns (${table.columns.length}):`);
  
  table.columns.forEach(col => {
    console.log(`  • ${col.name} (${col.type})${col.is_primary_key ? ' [PRIMARY KEY]' : ''}${col.nullable ? ' [NULLABLE]' : ''}`);
  });
  
  const relationships = report.relationships.filter(rel => 
    rel.source_table === tableName || rel.target_table === tableName
  );
  
  if (relationships.length > 0) {
    console.log(`Relationships:`);
    relationships.forEach(rel => {
      if (rel.source_table === tableName) {
        console.log(`  • ${tableName}.${rel.source_column} -> ${rel.target_table}.${rel.target_column}`);
      } else {
        console.log(`  • ${rel.source_table}.${rel.source_column} -> ${tableName}.${rel.target_column}`);
      }
    });
  }
}

// Helper functions
function areColumnsVerySimiLar(columns1, columns2) {
  if (Math.abs(columns1.length - columns2.length) > 2) return false;
  
  const colNames1 = columns1.map(c => c.name).sort();
  const colNames2 = columns2.map(c => c.name).sort();
  
  let matches = 0;
  for (const name of colNames1) {
    if (colNames2.includes(name)) matches++;
  }
  
  // If more than 80% of columns match, consider them similar
  return matches / Math.max(colNames1.length, colNames2.length) > 0.8;
}

// Run the database analysis
analyzeDatabase()
  .then(() => console.log('\nDatabase analysis completed.'))
  .catch(err => console.error('Error during database analysis:', err)); 