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
  views: {},
  relationships: [],
  triggers: [],
  functions: [],
  redundancies: [],
  recommendations: []
};

async function analyzeDatabase() {
  console.log('Starting comprehensive database analysis...\n');

  // Query the database schema information using MCP
  await getTables();
  await getViews();
  await getColumns();
  await getRelationships();
  await getTriggers();
  await getFunctions();
  await getTableStats();
  
  // Analyze for potential redundancies and make recommendations
  analyzeRedundancies();
  
  // Save the report to a file
  fs.writeFileSync('db-architecture-report.json', JSON.stringify(report, null, 2));
  
  // Print summary of findings
  printSummary();
}

async function getTables() {
  console.log('Analyzing tables...');
  
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT 
        table_name, 
        table_schema 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema') 
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_schema, table_name;
    `
  });
  
  if (error) {
    console.error('Error getting tables:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(table => {
      report.tables[table.table_name] = {
        schema: table.table_schema,
        columns: [],
        row_count: 0,
        referenced_by: [],
        references: [],
        has_primary_key: false,
        triggers: []
      };
    });
    
    console.log(`Found ${data.length} tables.`);
  } else {
    console.log('No tables found.');
  }
}

async function getViews() {
  console.log('Analyzing views...');
  
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT 
        table_name, 
        table_schema,
        view_definition 
      FROM 
        information_schema.views 
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 
        table_schema, table_name;
    `
  });
  
  if (error) {
    console.error('Error getting views:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(view => {
      report.views[view.table_name] = {
        schema: view.table_schema,
        definition: view.view_definition,
        columns: []
      };
    });
    
    console.log(`Found ${data.length} views.`);
  } else {
    console.log('No views found.');
  }
}

async function getColumns() {
  console.log('Analyzing columns...');
  
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM 
        information_schema.columns 
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 
        table_name, ordinal_position;
    `
  });
  
  if (error) {
    console.error('Error getting columns:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(column => {
      if (report.tables[column.table_name]) {
        report.tables[column.table_name].columns.push({
          name: column.column_name,
          type: column.data_type,
          nullable: column.is_nullable === 'YES',
          default: column.column_default,
          max_length: column.character_maximum_length
        });
      } else if (report.views[column.table_name]) {
        report.views[column.table_name].columns.push({
          name: column.column_name,
          type: column.data_type,
          nullable: column.is_nullable === 'YES',
          default: column.column_default,
          max_length: column.character_maximum_length
        });
      }
    });
    
    console.log(`Analyzed columns for all tables and views.`);
  } else {
    console.log('No columns found.');
  }
  
  // Get primary keys
  await getPrimaryKeys();
}

async function getPrimaryKeys() {
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT 
        tc.table_name, 
        kc.column_name 
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kc ON tc.constraint_name = kc.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema NOT IN ('pg_catalog', 'information_schema');
    `
  });
  
  if (error) {
    console.error('Error getting primary keys:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(pk => {
      if (report.tables[pk.table_name]) {
        report.tables[pk.table_name].has_primary_key = true;
        
        // Mark the column as primary key
        const pkColumn = report.tables[pk.table_name].columns.find(col => col.name === pk.column_name);
        if (pkColumn) {
          pkColumn.is_primary_key = true;
        }
      }
    });
  }
}

async function getRelationships() {
  console.log('Analyzing foreign key relationships...');
  
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confrelid::regclass AS foreign_table_name,
        af.attname AS foreign_column_name
      FROM
        pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE
        c.contype = 'f'
      ORDER BY
        conrelid::regclass::text, conname;
    `
  });
  
  if (error) {
    console.error('Error getting relationships:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(relationship => {
      const rel = {
        constraint_name: relationship.constraint_name,
        source_table: relationship.table_name,
        source_column: relationship.column_name,
        target_table: relationship.foreign_table_name,
        target_column: relationship.foreign_column_name
      };
      
      report.relationships.push(rel);
      
      // Update the table references
      if (report.tables[relationship.table_name]) {
        report.tables[relationship.table_name].references.push({
          table: relationship.foreign_table_name,
          column: relationship.foreign_column_name,
          via: relationship.column_name
        });
      }
      
      // Update the referenced_by field
      if (report.tables[relationship.foreign_table_name]) {
        report.tables[relationship.foreign_table_name].referenced_by.push({
          table: relationship.table_name,
          column: relationship.column_name,
          via: relationship.foreign_column_name
        });
      }
    });
    
    console.log(`Found ${data.length} foreign key relationships.`);
  } else {
    console.log('No foreign key relationships found.');
  }
}

async function getTriggers() {
  console.log('Analyzing triggers...');
  
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT
        tgname AS trigger_name,
        relname AS table_name,
        nspname AS schema_name,
        pg_get_triggerdef(t.oid) AS definition
      FROM
        pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE
        t.tgisinternal = false
        AND n.nspname NOT IN ('pg_catalog', 'information_schema');
    `
  });
  
  if (error) {
    console.error('Error getting triggers:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(trigger => {
      report.triggers.push({
        name: trigger.trigger_name,
        table: trigger.table_name,
        schema: trigger.schema_name,
        definition: trigger.definition
      });
      
      // Add trigger to the related table
      if (report.tables[trigger.table_name]) {
        report.tables[trigger.table_name].triggers.push(trigger.trigger_name);
      }
    });
    
    console.log(`Found ${data.length} triggers.`);
  } else {
    console.log('No triggers found.');
  }
}

async function getFunctions() {
  console.log('Analyzing functions...');
  
  const { data, error } = await supabase.rpc('mcp__query', {
    sql: `
      SELECT
        proname AS function_name,
        nspname AS schema_name,
        pg_get_functiondef(p.oid) AS definition
      FROM
        pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE
        n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY
        nspname, proname;
    `
  });
  
  if (error) {
    console.error('Error getting functions:', error);
    return;
  }
  
  if (data && data.length > 0) {
    data.forEach(func => {
      report.functions.push({
        name: func.function_name,
        schema: func.schema_name,
        definition: func.definition
      });
    });
    
    console.log(`Found ${data.length} functions.`);
  } else {
    console.log('No functions found.');
  }
}

async function getTableStats() {
  console.log('Gathering table statistics...');
  
  for (const tableName of Object.keys(report.tables)) {
    try {
      const { data, error } = await supabase.rpc('mcp__query', {
        sql: `SELECT COUNT(*) as row_count FROM "${tableName}";`
      });
      
      if (!error && data && data.length > 0) {
        report.tables[tableName].row_count = parseInt(data[0].row_count, 10);
      }
    } catch (err) {
      console.error(`Error getting stats for table ${tableName}:`, err);
    }
  }
  
  console.log('Table statistics gathered.');
}

function analyzeRedundancies() {
  console.log('Analyzing for redundancies and making recommendations...');
  
  // Check for tables without primary keys
  for (const [tableName, table] of Object.entries(report.tables)) {
    if (!table.has_primary_key) {
      report.recommendations.push({
        type: 'missing_primary_key',
        message: `Table "${tableName}" does not have a primary key. Consider adding one for better data integrity.`
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
    
    // Check for tables without any relationships
    if (table.references.length === 0 && table.referenced_by.length === 0) {
      report.recommendations.push({
        type: 'isolated_table',
        message: `Table "${tableName}" has no foreign key relationships with other tables. Verify if this is intentional.`
      });
    }
  }
  
  // Look for potentially redundant views
  for (const [viewName, view] of Object.entries(report.views)) {
    // Check if view definition directly selects from a single table without transformations
    if (view.definition && isSimplePassthroughView(view.definition)) {
      report.redundancies.push({
        type: 'simple_view',
        message: `View "${viewName}" appears to be a simple pass-through to a table. Consider if this view adds value.`
      });
    }
  }
  
  // Tables that might have missing foreign keys (based on naming conventions)
  for (const [tableName, table] of Object.entries(report.tables)) {
    const fkCandidates = table.columns.filter(col => 
      (col.name.endsWith('_id') || col.name === 'id') && 
      !table.references.some(ref => ref.via === col.name) &&
      !col.is_primary_key
    );
    
    for (const col of fkCandidates) {
      if (col.name === 'id') continue; // Skip if it's 'id' as it's likely a primary key
      
      // Check if there could be a table that this field might reference
      const potentialTableName = col.name.replace('_id', '');
      if (report.tables[potentialTableName]) {
        report.recommendations.push({
          type: 'potential_missing_fk',
          message: `Column "${tableName}.${col.name}" might be a foreign key to table "${potentialTableName}" but no constraint exists.`
        });
      }
    }
  }
  
  // Check for word tables relationship with app_words
  if (report.tables.words && report.tables.app_words) {
    const relation = report.relationships.find(
      rel => (rel.source_table === 'app_words' && rel.target_table === 'words') ||
            (rel.source_table === 'words' && rel.target_table === 'app_words')
    );
    
    if (relation) {
      // Check if there's a trigger that might handle synchronization
      const syncTrigger = report.triggers.find(trigger => 
        (trigger.table === 'words' && trigger.definition.includes('app_words')) ||
        (trigger.table === 'app_words' && trigger.definition.includes('words'))
      );
      
      if (syncTrigger) {
        console.log(`Found potential sync mechanism: ${syncTrigger.name}`);
      } else {
        // Our test showed the tables update simultaneously, suggest a trigger
        report.recommendations.push({
          type: 'sync_mechanism',
          message: `The words and app_words tables appear to be synchronized but no explicit trigger was found. ` +
                  `Consider adding a trigger or documenting the synchronization mechanism if it uses transactions or API-level logic.`
        });
      }
    }
  }
  
  console.log(`Generated ${report.redundancies.length} redundancy observations and ${report.recommendations.length} recommendations.`);
}

function printSummary() {
  console.log('\n=== DATABASE ARCHITECTURE SUMMARY ===');
  console.log(`Tables: ${Object.keys(report.tables).length}`);
  console.log(`Views: ${Object.keys(report.views).length}`);
  console.log(`Relationships: ${report.relationships.length}`);
  console.log(`Triggers: ${report.triggers.length}`);
  console.log(`Functions: ${report.functions.length}`);
  console.log(`Potential Redundancies: ${report.redundancies.length}`);
  console.log(`Recommendations: ${report.recommendations.length}`);
  console.log('\nFull report saved to db-architecture-report.json');
  
  // List all tables
  console.log('\n=== TABLES ===');
  for (const [tableName, table] of Object.entries(report.tables)) {
    console.log(`• ${tableName} (${table.row_count} rows, ${table.columns.length} columns)`);
  }
  
  // List all views
  if (Object.keys(report.views).length > 0) {
    console.log('\n=== VIEWS ===');
    for (const viewName of Object.keys(report.views)) {
      console.log(`• ${viewName}`);
    }
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

function isSimplePassthroughView(definition) {
  // Very basic check if a view is just "SELECT * FROM table" without joins, etc.
  if (!definition) return false;
  
  const simplifiedDef = definition.replace(/\s+/g, ' ').toLowerCase();
  return simplifiedDef.includes('select * from') && 
         !simplifiedDef.includes('join') &&
         !simplifiedDef.includes('where') &&
         !simplifiedDef.includes('group by');
}

// Run the database analysis
analyzeDatabase()
  .then(() => console.log('\nDatabase analysis completed.'))
  .catch(err => console.error('Error during database analysis:', err)); 