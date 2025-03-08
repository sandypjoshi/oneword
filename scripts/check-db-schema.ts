/**
 * Script to check the database schema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkTableSchema(tableName: string) {
  console.log(`\nCHECKING SCHEMA FOR "${tableName}" TABLE`);
  console.log('='.repeat(50));
  
  try {
    // Fetch sample data to infer schema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`No data found in ${tableName} table`);
      
      // Try to get column info using system tables
      const { data: columnData, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: tableName });
        
      if (columnError) {
        console.error('Error fetching columns:', columnError);
      } else if (columnData) {
        console.log(`Column information for ${tableName}:`);
        console.log(columnData);
      }
      
      return;
    }
    
    // Show the schema based on the first record
    const sample = data[0];
    console.log(`Schema for ${tableName} (based on sample data):`);
    
    const columns = Object.keys(sample);
    console.log('| Column | Type | Sample Value |');
    console.log('|--------|------|--------------|');
    
    for (const column of columns) {
      const value = sample[column];
      const type = typeof value;
      
      // Display sample value appropriately based on type
      let displayValue = value;
      if (value === null) {
        displayValue = 'NULL';
      } else if (type === 'object') {
        displayValue = JSON.stringify(value).substring(0, 30) + '...';
      } else if (type === 'string' && String(value).length > 30) {
        displayValue = String(value).substring(0, 30) + '...';
      }
      
      console.log(`| ${column.padEnd(20)} | ${type.padEnd(10)} | ${String(displayValue).padEnd(20)} |`);
    }
    
    // Count total rows
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error counting rows:', countError);
    } else {
      console.log(`\nTotal rows in ${tableName}: ${count}`);
    }
    
  } catch (error) {
    console.error(`Error checking schema for ${tableName}:`, error);
  }
}

async function main() {
  console.log('DATABASE SCHEMA CHECK');
  console.log('='.repeat(50));
  
  // Check word-related tables
  await checkTableSchema('words');
  await checkTableSchema('daily_words');
  await checkTableSchema('synsets');
  await checkTableSchema('word_synsets');
  
  // Check if custom function exists
  try {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'words' });
    if (error) {
      console.log('\nCustom function get_table_columns is not available.');
      
      // Alternative approach - create an informative query
      console.log('\nFetching schema information directly:');
      const { data: schemaData, error: schemaError } = await supabase
        .from('daily_words')
        .select('*')
        .limit(5);
        
      if (schemaError) {
        console.error('Error fetching daily_words data:', schemaError);
      } else {
        console.log('Sample daily_words data:');
        console.log(schemaData);
      }
    }
  } catch (error) {
    console.error('Error checking custom function:', error);
  }
}

main().catch(error => {
  console.error('Error running schema check:', error);
  process.exit(1);
}); 