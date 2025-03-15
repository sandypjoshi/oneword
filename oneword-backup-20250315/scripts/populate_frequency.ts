import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import AdmZip from 'adm-zip';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FrequencyData {
  word: string;
  frequency: number;
  zipf_value: number;
}

async function downloadSubtlexData(): Promise<void> {
  const url = 'https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus/subtlexus2.zip/at_download/file';
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync('subtlex.zip', Buffer.from(buffer));
  
  // Extract the ZIP file
  const zip = new AdmZip('subtlex.zip');
  zip.extractAllTo('.', true);
  
  // Clean up ZIP file
  fs.unlinkSync('subtlex.zip');
}

async function processFrequencyData(filePath: string): Promise<FrequencyData[]> {
  const frequencies: FrequencyData[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('data', (row: any) => {
        // SUBTLEX uses Zipf values (log10 frequency per billion words + 3)
        // Convert to normalized frequency (0-1 scale)
        const zipf = parseFloat(row.Zipf);
        const normalizedFreq = Math.min(Math.max((zipf - 1) / 6, 0), 1);
        
        frequencies.push({
          word: row.Word.toLowerCase(),
          frequency: normalizedFreq,
          zipf_value: zipf
        });
      })
      .on('end', () => resolve(frequencies))
      .on('error', reject);
  });
}

async function updateWordFrequencies(frequencies: FrequencyData[]): Promise<void> {
  const batchSize = 100;
  
  for (let i = 0; i < frequencies.length; i += batchSize) {
    const batch = frequencies.slice(i, i + batchSize);
    const updates = batch.map(freq => ({
      word: freq.word,
      frequency: freq.frequency,
      metadata: { zipf_value: freq.zipf_value }
    }));
    
    const { error } = await supabase
      .from('words')
      .upsert(updates, {
        onConflict: 'word',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`Error updating batch ${i}-${i + batchSize}:`, error);
    } else {
      console.log(`Updated frequencies for words ${i}-${i + batchSize}`);
    }
  }
}

async function main() {
  try {
    // Download SUBTLEX data if needed
    if (!fs.existsSync('SUBTLEX_US_frequency.txt')) {
      console.log('Downloading SUBTLEX data...');
      await downloadSubtlexData();
    }
    
    // Process frequency data
    console.log('Processing frequency data...');
    const frequencies = await processFrequencyData('SUBTLEX_US_frequency.txt');
    
    // Update word frequencies in database
    console.log('Updating word frequencies in database...');
    await updateWordFrequencies(frequencies);
    
    console.log('Frequency data update complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 