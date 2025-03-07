/**
 * WordNet Import Validation Script
 * 
 * This script checks the current state of the WordNet data in Supabase
 * and provides a report on what's missing or incomplete.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Expected counts from WordNet 3.1
const EXPECTED = {
  synsets: 117791,
  noun_synsets: 82192,
  verb_synsets: 13789,
  adj_synsets: 3807, 
  adv_synsets: 3625,
  relationships: 225204,
  words: 147478,
  domains: 45
};

async function countRecords(table, column = null, value = null) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  
  if (column && value) {
    query = query.eq(column, value);
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }
  
  return count;
}

async function validateImport() {
  console.log('Validating WordNet data in Supabase...\n');
  
  // Check domains
  const domainCount = await countRecords('domains');
  console.log(`Domains: ${domainCount} / ${EXPECTED.domains} (${Math.round(domainCount / EXPECTED.domains * 100)}%)`);
  
  // Check synsets
  const synsetCount = await countRecords('synsets');
  console.log(`Synsets: ${synsetCount} / ${EXPECTED.synsets} (${Math.round(synsetCount / EXPECTED.synsets * 100)}%)`);
  
  // Check synsets by POS
  const nounSynsetCount = await countRecords('synsets', 'pos', 'n');
  console.log(`  Noun synsets: ${nounSynsetCount} / ${EXPECTED.noun_synsets} (${Math.round(nounSynsetCount / EXPECTED.noun_synsets * 100)}%)`);
  
  const verbSynsetCount = await countRecords('synsets', 'pos', 'v');
  console.log(`  Verb synsets: ${verbSynsetCount} / ${EXPECTED.verb_synsets} (${Math.round(verbSynsetCount / EXPECTED.verb_synsets * 100)}%)`);
  
  const adjSynsetCount = await countRecords('synsets', 'pos', 'a');
  console.log(`  Adjective synsets: ${adjSynsetCount} / ${EXPECTED.adj_synsets} (${Math.round(adjSynsetCount / EXPECTED.adj_synsets * 100)}%)`);
  
  const advSynsetCount = await countRecords('synsets', 'pos', 'r');
  console.log(`  Adverb synsets: ${advSynsetCount} / ${EXPECTED.adv_synsets} (${Math.round(advSynsetCount / EXPECTED.adv_synsets * 100)}%)`);
  
  // Check words
  const wordCount = await countRecords('words');
  console.log(`Words: ${wordCount} / ${EXPECTED.words} (${Math.round(wordCount / EXPECTED.words * 100)}%)`);
  
  // Check word_synsets
  const wordSynsetCount = await countRecords('word_synsets');
  console.log(`Word-Synset mappings: ${wordSynsetCount}`);
  
  // Check relationships
  const relationshipCount = await countRecords('relationships');
  console.log(`Relationships: ${relationshipCount} / ${EXPECTED.relationships} (${Math.round(relationshipCount / EXPECTED.relationships * 100)}%)`);
  
  console.log('\nSummary of missing data:');
  if (synsetCount < EXPECTED.synsets) {
    console.log(`- Missing ${EXPECTED.synsets - synsetCount} synsets`);
  }
  
  if (wordCount < EXPECTED.words) {
    console.log(`- Missing ${EXPECTED.words - wordCount} words`);
  }
  
  if (relationshipCount < EXPECTED.relationships) {
    console.log(`- Missing ${EXPECTED.relationships - relationshipCount} relationships`);
  }
  
  console.log('\nRecommendation:');
  if (synsetCount < EXPECTED.synsets * 0.9) {
    console.log('- Synset import is significantly incomplete. Re-import synsets.');
  }
  
  if (wordCount < EXPECTED.words * 0.9) {
    console.log('- Word import is significantly incomplete. Re-import words.');
  }
  
  if (relationshipCount < EXPECTED.relationships * 0.1) {
    console.log('- Relationship import is severely incomplete. Re-import relationships.');
  }
}

// Run the validation
validateImport()
  .then(() => console.log('\nValidation complete.'))
  .catch(err => console.error('Error during validation:', err)); 