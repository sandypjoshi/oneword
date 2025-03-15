require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function examineAdditionalTables() {
  console.log('Examining additional tables in detail...\n');
  
  await examineTable('word_definitions');
  await examineTable('word_examples');
  await analyzeRelationships();
}

async function examineTable(tableName) {
  console.log(`=== TABLE: ${tableName} ===`);
  
  // Get count
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`Row count: ${count}`);
    } else {
      console.error(`Error getting row count: ${error.message}`);
    }
  } catch (err) {
    console.error(`Error counting rows: ${err.message}`);
  }
  
  // Get column info from a sample record
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const record = data[0];
      console.log(`\nColumns:`);
      
      Object.entries(record).forEach(([key, value]) => {
        console.log(`  • ${key} (${typeof value})${value === null ? ' [NULLABLE]' : ''}`);
      });
      
      console.log(`\nSample record:`);
      console.log(JSON.stringify(record, null, 2));
    } else {
      console.error(`Error or no data: ${error?.message || 'No records found'}`);
    }
  } catch (err) {
    console.error(`Error getting sample: ${err.message}`);
  }
  
  // Check for foreign key candidates
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const record = data[0];
      const potentialFKs = Object.keys(record).filter(k => 
        k.endsWith('_id') || 
        k === 'word_id' || 
        k === 'word'
      );
      
      if (potentialFKs.length > 0) {
        console.log(`\nPotential foreign key columns:`);
        potentialFKs.forEach(col => console.log(`  • ${col}`));
      }
    }
  } catch (err) {
    console.error(`Error checking for FKs: ${err.message}`);
  }
  
  // Get some distinct values for a key column (usually 'word')
  if (tableName.includes('word')) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('word')
        .limit(10);
      
      if (!error && data && data.length > 0) {
        console.log(`\nSample words:`);
        console.log(data.map(r => r.word).join(', '));
      }
    } catch (err) {
      console.error(`Error getting sample words: ${err.message}`);
    }
  }
  
  console.log('\n');
}

async function analyzeRelationships() {
  console.log('=== ANALYZING RELATIONSHIPS ===');
  
  // Check if word_definitions links to words
  try {
    // Sample a word that exists in both tables
    const { data: sampleWords, error } = await supabase
      .from('words')
      .select('id, word')
      .limit(5);
    
    if (!error && sampleWords && sampleWords.length > 0) {
      console.log('\nTesting relationship between words and word_definitions:');
      
      for (const wordRecord of sampleWords) {
        const { data, error: defError } = await supabase
          .from('word_definitions')
          .select('*')
          .eq('word', wordRecord.word)
          .limit(1);
        
        if (!defError && data && data.length > 0) {
          console.log(`✓ Word "${wordRecord.word}" (id: ${wordRecord.id}) is found in word_definitions`);
          console.log(`  Definition sample: ${data[0].definition?.substring(0, 50)}...`);
        } else {
          console.log(`✗ Word "${wordRecord.word}" (id: ${wordRecord.id}) not found in word_definitions`);
        }
      }
    }
    
    console.log('\nTesting relationship between words and word_examples:');
    
    if (sampleWords && sampleWords.length > 0) {
      for (const wordRecord of sampleWords) {
        const { data, error: exError } = await supabase
          .from('word_examples')
          .select('*')
          .eq('word', wordRecord.word)
          .limit(1);
        
        if (!exError && data && data.length > 0) {
          console.log(`✓ Word "${wordRecord.word}" (id: ${wordRecord.id}) is found in word_examples`);
          console.log(`  Example sample: ${data[0].example?.substring(0, 50)}...`);
        } else {
          console.log(`✗ Word "${wordRecord.word}" (id: ${wordRecord.id}) not found in word_examples`);
        }
      }
    }
  } catch (err) {
    console.error(`Error analyzing relationships: ${err.message}`);
  }
  
  console.log('\nChecking for potential linking field between tables:');
  
  const tablesToCheck = ['words', 'app_words', 'word_definitions', 'word_examples'];
  const linkFields = {};
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        linkFields[table] = Object.keys(data[0]);
      }
    } catch (err) {
      console.error(`Error getting fields for ${table}: ${err.message}`);
    }
  }
  
  // Find common fields across tables
  if (Object.keys(linkFields).length > 0) {
    const allFields = new Set();
    Object.values(linkFields).forEach(fields => fields.forEach(f => allFields.add(f)));
    
    const fieldsInAllTables = [...allFields].filter(field => 
      Object.values(linkFields).every(tableFields => tableFields.includes(field))
    );
    
    const fieldsInMultipleTables = [...allFields].filter(field => {
      const count = Object.values(linkFields).filter(tableFields => 
        tableFields.includes(field)
      ).length;
      return count > 1 && count < Object.keys(linkFields).length;
    });
    
    console.log(`\nFields present in all tables: ${fieldsInAllTables.join(', ') || 'None'}`);
    console.log(`Fields present in multiple tables: ${fieldsInMultipleTables.join(', ') || 'None'}`);
  }
  
  // Try a specific analysis on 'word' field which is likely the linking field
  console.log('\nAnalyzing "word" field as potential linking field:');
  
  try {
    // Get a few matching words
    const { data: commonWords, error } = await supabase
      .from('app_words')
      .select('word')
      .limit(5);
    
    if (!error && commonWords && commonWords.length > 0) {
      for (const record of commonWords) {
        const word = record.word;
        console.log(`\nChecking "${word}" across tables:`);
        
        for (const table of tablesToCheck) {
          try {
            const { count, error: countError } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
              .eq('word', word);
            
            if (!countError) {
              console.log(`  • ${table}: ${count} matching rows`);
            } else {
              console.log(`  • ${table}: Error: ${countError.message}`);
            }
          } catch (err) {
            console.error(`  • ${table}: Error: ${err.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error in word field analysis: ${err.message}`);
  }
}

examineAdditionalTables()
  .then(() => console.log('Examination completed.'))
  .catch(err => console.error('Error during examination:', err)); 