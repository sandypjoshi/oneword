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
  relationships: [],
  tableStats: {},
  redundancies: [],
  recommendations: [],
  insights: {}
};

// A list of tables we know exist based on previous scripts
const knownTables = [
  'words',
  'app_words'
];

// A broader list of potential tables to check
const potentialTables = [
  // Users and authentication
  'users', 'profiles', 'auth_users', 'auth_identities', 'auth_sessions', 'auth_logs',
  
  // Core app functionality
  'word_lists', 'user_word_lists', 'favorites', 'user_progress', 'settings', 
  'categories', 'difficulty_levels', 'tags', 'word_tags', 'word_status',
  
  // Game and learning related
  'games', 'game_scores', 'quizzes', 'quiz_questions', 'quiz_attempts', 
  'user_achievements', 'badges', 'user_badges',
  
  // Content related
  'definitions', 'word_definitions', 'examples', 'word_examples', 'synonyms', 'antonyms',
  'phonetics', 'pronunciations', 'images', 'word_images', 'word_origins',
  
  // System tables
  'migrations', 'config', 'logs', 'analytics', 'feedback', 'reports'
];

async function analyzeDatabase() {
  console.log('Starting comprehensive database analysis...\n');

  // Get all tables we can access
  await discoverTables();
  await getTableColumns();
  await detectTableRelationships();
  await getTableStats();
  await examineWordTables();
  
  // Run special analyses
  await findRedundantData();
  await generateInsights();
  await findCorruptData();
  
  // Save the report to a file
  fs.writeFileSync('comprehensive-db-report.json', JSON.stringify(report, null, 2));
  
  // Print summary of findings
  printSummary();
}

async function discoverTables() {
  console.log('Discovering tables...');
  
  // Start with known tables
  for (const tableName of knownTables) {
    report.tables[tableName] = {
      columns: [],
      row_count: 0,
      relationships: [],
      has_primary_key: false,
      sample_data: null
    };
  }
  
  // Try to detect other tables
  for (const tableName of potentialTables) {
    if (report.tables[tableName]) continue; // Skip if already known
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1)
        .maybeSingle();
      
      if (!error) {
        report.tables[tableName] = {
          columns: [],
          row_count: 0,
          relationships: [],
          has_primary_key: false,
          sample_data: null
        };
        console.log(`Discovered table: ${tableName}`);
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
            is_primary_key: colName === 'id', // Assumption for now
            sample_value: value
          };
        });
        
        report.tables[tableName].columns = columns;
        report.tables[tableName].has_primary_key = columns.some(col => col.is_primary_key);
        report.tables[tableName].sample_data = record;
        
        console.log(`Analyzed columns for ${tableName} (${columns.length} columns)`);
      } else {
        console.log(`No data found in ${tableName} to analyze columns`);
      }
    } catch (err) {
      console.error(`Error analyzing columns for ${tableName}:`, err);
    }
  }
}

async function detectTableRelationships() {
  console.log('Detecting relationships between tables...');
  
  // Check for potential foreign keys based on column names
  for (const [tableName, table] of Object.entries(report.tables)) {
    const fkCandidates = table.columns.filter(col => 
      (col.name.endsWith('_id') || col.name === 'source_id' || col.name === 'target_id') && 
      col.name !== 'id'
    );
    
    for (const col of fkCandidates) {
      // Determine potential target table
      let targetTableName = col.name.replace('_id', '');
      
      // Handle special cases
      if (targetTableName === 'user' && report.tables.users) {
        targetTableName = 'users';
      } else if (targetTableName === 'source' && tableName === 'app_words') {
        targetTableName = 'words'; // Based on our knowledge
      }
      
      // Skip if target table doesn't exist in our report
      if (!report.tables[targetTableName]) continue;
      
      // Create a relationship
      const relationship = {
        source_table: tableName,
        source_column: col.name,
        target_table: targetTableName,
        target_column: 'id', // Assumption
        confidence: 'medium' // Just an estimate
      };
      
      // Increase confidence for known relationships
      if (tableName === 'app_words' && col.name === 'source_word_id' && targetTableName === 'words') {
        relationship.confidence = 'high';
      }
      
      report.relationships.push(relationship);
      console.log(`Detected potential relationship: ${tableName}.${col.name} -> ${targetTableName}.id`);
    }
  }
  
  console.log(`Detected ${report.relationships.length} potential relationships.`);
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
        
        // Analyze data distribution if there's enough data
        if (count > 0) {
          await analyzeDataDistribution(tableName);
        }
      }
    } catch (err) {
      console.error(`Error getting row count for ${tableName}:`, err);
    }
  }
}

async function analyzeDataDistribution(tableName) {
  try {
    const table = report.tables[tableName];
    
    // Skip if the table is very large to avoid performance issues
    if (table.row_count > 1000000) return;
    
    // Check for categorical columns
    for (const col of table.columns.filter(c => c.type === 'string' && !c.nullable)) {
      // Skip some columns that are unlikely to be useful for distribution analysis
      if (['id', 'created_at', 'updated_at'].includes(col.name)) continue;
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`${col.name}, count`)
        .limit(10);
      
      if (!error && data && data.length > 0) {
        if (!report.insights[tableName]) {
          report.insights[tableName] = { distributions: {} };
        }
        
        report.insights[tableName].distributions[col.name] = data;
      }
    }
    
    // For numerical columns, look at min/max/avg if appropriate
    if (tableName === 'words' || tableName === 'app_words') {
      const { data, error } = await supabase
        .from(tableName)
        .select('difficulty_score')
        .order('difficulty_score', { ascending: true })
        .limit(1);
      
      const { data: maxData, error: maxError } = await supabase
        .from(tableName)
        .select('difficulty_score')
        .order('difficulty_score', { ascending: false })
        .limit(1);
      
      if (!error && !maxError && data && maxData && data.length > 0 && maxData.length > 0) {
        if (!report.insights[tableName]) {
          report.insights[tableName] = { numerical: {} };
        } else if (!report.insights[tableName].numerical) {
          report.insights[tableName].numerical = {};
        }
        
        report.insights[tableName].numerical.difficulty_score = {
          min: data[0].difficulty_score,
          max: maxData[0].difficulty_score
        };
      }
    }
  } catch (err) {
    console.error(`Error analyzing data distribution for ${tableName}:`, err);
  }
}

async function examineWordTables() {
  if (report.tables.words && report.tables.app_words) {
    console.log('Examining words and app_words tables in detail...');
    
    // Sample records from both tables for comparison
    const { data: wordsSample, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .limit(5);
    
    const { data: appWordsSample, error: appWordsError } = await supabase
      .from('app_words')
      .select('*')
      .limit(5);
    
    if (!wordsError && !appWordsError && wordsSample && appWordsSample) {
      report.insights.wordTables = {
        wordsSample,
        appWordsSample,
        comparison: {
          words_total: report.tables.words.row_count,
          app_words_total: report.tables.app_words.row_count,
          ratio: report.tables.app_words.row_count / report.tables.words.row_count
        }
      };
      
      // Check for synchronized difficulty scores
      await checkScoreSynchronization();
    }
  }
}

async function checkScoreSynchronization() {
  try {
    console.log('Verifying difficulty score synchronization...');
    
    // Get a sample of matching records using a join
    const { data: sampleWords, error: sampleError } = await supabase
      .from('app_words')
      .select('id, word, difficulty_score, source_word_id')
      .not('difficulty_score', 'is', null)
      .limit(10);
    
    if (sampleError || !sampleWords || sampleWords.length === 0) {
      console.error('Could not fetch sample words for sync testing');
      return;
    }
    
    const syncResults = [];
    let syncedCount = 0;
    
    for (const appWord of sampleWords) {
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
        
        syncResults.push({
          word: appWord.word,
          app_score: appWord.difficulty_score,
          main_score: mainWord.difficulty_score,
          match: scoresMatch
        });
      }
    }
    
    report.insights.difficultyScoreSync = {
      sampleSize: sampleWords.length,
      syncedCount,
      syncPercentage: (syncedCount / sampleWords.length) * 100,
      syncResults
    };
    
    console.log(`Score sync check: ${syncedCount}/${sampleWords.length} scores match (${(syncedCount / sampleWords.length) * 100}%)`);
  } catch (err) {
    console.error('Error checking score synchronization:', err);
  }
}

async function findRedundantData() {
  console.log('Checking for redundant data or structures...');
  
  // Check for potentially redundant tables
  for (const [tableName, table] of Object.entries(report.tables)) {
    if (table.row_count === 0) {
      report.redundancies.push({
        type: 'empty_table',
        item: tableName,
        message: `Table "${tableName}" has 0 rows. Consider dropping if not needed.`
      });
    }
    
    // Check for tables with identical columns (potential duplicates)
    for (const [otherName, otherTable] of Object.entries(report.tables)) {
      if (tableName === otherName) continue;
      
      if (areColumnsVerySimilar(table.columns, otherTable.columns)) {
        report.redundancies.push({
          type: 'similar_tables',
          items: [tableName, otherName],
          message: `Tables "${tableName}" and "${otherName}" have very similar column structures (>80% match). Consider if both are needed.`
        });
      }
    }
  }
  
  // Special check for words and app_words redundancy
  if (report.tables.words && report.tables.app_words) {
    // They serve different purposes based on our knowledge, but should have consistent data
    const totalWords = report.tables.words.row_count;
    const totalAppWords = report.tables.app_words.row_count;
    
    if (totalAppWords / totalWords < 0.1) {
      report.recommendations.push({
        type: 'incomplete_data',
        message: `The app_words table contains only ${totalAppWords} out of ${totalWords} words (${((totalAppWords/totalWords)*100).toFixed(1)}%). Consider if more words need to be included in app_words.`
      });
    }
  }
}

async function generateInsights() {
  console.log('Generating insights about the database...');
  
  // Analyze the words and app_words tables
  if (report.tables.words && report.tables.app_words) {
    try {
      // Check distribution of difficulty scores
      const { data: difficultyDistribution, error: diffError } = await supabase
        .from('words')
        .select('difficulty_level, count(*)')
        .group('difficulty_level');
      
      if (!diffError && difficultyDistribution) {
        report.insights.difficultyDistribution = difficultyDistribution;
      }
      
      // More specific checks could be done here...
      
    } catch (err) {
      console.error('Error generating insights:', err);
    }
  }
  
  // Generate general recommendations
  report.recommendations.push({
    type: 'best_practice',
    message: 'Consider adding explicit foreign key constraints for relationships between tables to ensure data integrity.'
  });
  
  if (report.insights.difficultyScoreSync && report.insights.difficultyScoreSync.syncPercentage === 100) {
    report.recommendations.push({
      type: 'documentation',
      message: 'Document the synchronization mechanism between words and app_words tables to ensure it continues to function correctly after updates.'
    });
  }
}

async function findCorruptData() {
  console.log('Checking for potentially corrupt or inconsistent data...');
  
  // Check for orphaned app_words (referencing non-existent words)
  if (report.tables.words && report.tables.app_words) {
    try {
      const { count, error } = await supabase
        .from('app_words')
        .select('id', { count: 'exact', head: true })
        .not('source_word_id', 'in', `(select id from words)`);
      
      if (!error) {
        if (count > 0) {
          report.recommendations.push({
            type: 'data_integrity',
            message: `Found ${count} app_words records that reference non-existent words. Consider cleaning up these orphaned records.`
          });
        } else {
          console.log('No orphaned app_words records found, good!');
        }
      }
    } catch (err) {
      console.error('Error checking for orphaned records:', err);
    }
  }
}

function printSummary() {
  console.log('\n=== DATABASE ARCHITECTURE SUMMARY ===');
  console.log(`Tables: ${Object.keys(report.tables).length}`);
  console.log(`Relationships: ${report.relationships.length}`);
  console.log(`Potential Redundancies: ${report.redundancies.length}`);
  console.log(`Recommendations: ${report.recommendations.length}`);
  console.log('\nFull report saved to comprehensive-db-report.json');
  
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
  
  // Print insights
  if (report.insights.difficultyScoreSync) {
    console.log('\n=== DIFFICULTY SCORE SYNCHRONIZATION ===');
    console.log(`Sample Size: ${report.insights.difficultyScoreSync.sampleSize} words`);
    console.log(`Synchronized Scores: ${report.insights.difficultyScoreSync.syncedCount} (${report.insights.difficultyScoreSync.syncPercentage.toFixed(2)}%)`);
  }
  
  if (report.insights.difficultyDistribution) {
    console.log('\n=== DIFFICULTY LEVEL DISTRIBUTION ===');
    report.insights.difficultyDistribution.forEach(level => {
      console.log(`• ${level.difficulty_level || 'NULL'}: ${level.count} words`);
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
        console.log(`  • ${tableName}.${rel.source_column} -> ${rel.target_table}.${rel.target_column} (${rel.confidence})`);
      } else {
        console.log(`  • ${rel.source_table}.${rel.source_column} -> ${tableName}.${rel.target_column} (${rel.confidence})`);
      }
    });
  }
}

// Helper functions
function areColumnsVerySimilar(columns1, columns2) {
  if (Math.abs(columns1.length - columns2.length) > 3) return false;
  
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
  .then(() => console.log('\nComprehensive database analysis completed.'))
  .catch(err => console.error('Error during database analysis:', err)); 