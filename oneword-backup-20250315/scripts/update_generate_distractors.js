// Code snippet to modify in generate-distractors/index.ts
// This modification handles the case where the definitions column is null

// Inside the handler code, add this after retrieving wordData
// (around line 740 in the file)

// Add this after retrieving wordData (when word_id or word is found)
// ...

// Check if definitions are missing and fetch from synsets if needed
if (!wordData.definitions || wordData.definitions.length === 0) {
  logger.info(`No definitions found in words table for "${wordData.word}", attempting to fetch from synsets`);
  
  const { data: definitionData, error: definitionError } = await supabaseClient
    .from('word_synsets')
    .select('synset_id, sense_number')
    .eq('word_id', wordData.id)
    .order('sense_number');
    
  if (definitionError || !definitionData || definitionData.length === 0) {
    logger.error(`No synsets found for word "${wordData.word}"`, definitionError);
    return new Response(
      JSON.stringify({ error: `No definition found for word "${wordData.word}"` }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  
  // Get the first synset definition
  const { data: synsetData, error: synsetError } = await supabaseClient
    .from('synsets')
    .select('definition')
    .eq('id', definitionData[0].synset_id)
    .single();
    
  if (synsetError || !synsetData) {
    logger.error(`Failed to retrieve definition for synset`, synsetError);
    return new Response(
      JSON.stringify({ error: `No definition found for word "${wordData.word}"` }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  
  // Use the definition from synset
  wordData.definitions = [synsetData.definition];
  
  // Optionally, update the words table for future use
  const { error: updateError } = await supabaseClient
    .from('words')
    .update({ definitions: [synsetData.definition] })
    .eq('id', wordData.id);
    
  if (updateError) {
    logger.warn(`Failed to update definitions for word "${wordData.word}"`, updateError);
    // Continue anyway since we have the definition
  }
}

// Get the correct definition for this word (this is the original code)
const correctDefinition = wordData.definitions && wordData.definitions.length > 0 
  ? wordData.definitions[0] 
  : null;
// ...

// To apply this change, modify the generate-distractors function and redeploy it 