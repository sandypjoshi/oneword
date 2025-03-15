/**
 * Script to update difficulty weights
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipljgsggnbdwaomjfuok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbGpnc2dnbmJkd2FvbWpmdW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA4MDEwNiwiZXhwIjoyMDU2NjU2MTA2fQ.qkwn-imaZVnK6IGFgG75eFcFEQySgzIN_gvUJbbDFWE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Target frequency weight
const TARGET_FREQUENCY_WEIGHT = 0.55;

async function updateWeights() {
  try {
    // Get current weights
    const { data: currentWeights, error: fetchError } = await supabase
      .from('difficulty_configuration')
      .select('id,parameter_name,weight')
      .eq('enabled', true);
      
    if (fetchError) {
      throw new Error(`Error fetching current weights: ${fetchError.message}`);
    }
    
    console.log('Current weights:');
    currentWeights.forEach(param => {
      console.log(`- ${param.parameter_name}: ${param.weight}`);
    });
    
    // Calculate current frequency weight and total of other weights
    const frequencyParam = currentWeights.find(param => param.parameter_name === 'frequency');
    const currentFrequencyWeight = frequencyParam ? frequencyParam.weight : 0.35;
    
    const otherParams = currentWeights.filter(param => param.parameter_name !== 'frequency');
    const totalOtherWeights = otherParams.reduce((sum, param) => sum + param.weight, 0);
    
    // Calculate how much to increase frequency by
    const increaseAmount = TARGET_FREQUENCY_WEIGHT - currentFrequencyWeight;
    
    // Calculate scaling factor for other parameters to maintain sum of 1.0
    const scalingFactor = (totalOtherWeights - increaseAmount) / totalOtherWeights;
    
    // Update frequency weight
    const { data: freqUpdateData, error: freqUpdateError } = await supabase
      .from('difficulty_configuration')
      .update({ weight: TARGET_FREQUENCY_WEIGHT })
      .eq('parameter_name', 'frequency');
      
    if (freqUpdateError) {
      throw new Error(`Error updating frequency weight: ${freqUpdateError.message}`);
    }
    
    console.log(`\nUpdated frequency weight to ${TARGET_FREQUENCY_WEIGHT}`);
    
    // Update other weights proportionally
    let updatedWeights = [];
    for (const param of otherParams) {
      const newWeight = Math.round((param.weight * scalingFactor) * 100) / 100; // Round to 2 decimal places
      
      const { data, error } = await supabase
        .from('difficulty_configuration')
        .update({ weight: newWeight })
        .eq('id', param.id);
        
      if (error) {
        console.error(`Error updating ${param.parameter_name}: ${error.message}`);
      } else {
        updatedWeights.push({ name: param.parameter_name, weight: newWeight });
        console.log(`Updated ${param.parameter_name} to ${newWeight}`);
      }
    }
    
    console.log('\nNew weight configuration:');
    console.log(`- frequency: ${TARGET_FREQUENCY_WEIGHT}`);
    updatedWeights.forEach(param => {
      console.log(`- ${param.name}: ${param.weight}`);
    });
    
    // Verify total is 1.0
    const newTotal = TARGET_FREQUENCY_WEIGHT + updatedWeights.reduce((sum, param) => sum + param.weight, 0);
    console.log(`\nTotal weight sum: ${newTotal.toFixed(2)}`);
    
    if (Math.abs(newTotal - 1.0) > 0.01) {
      console.warn(`Warning: Total weights do not sum to exactly 1.0! (${newTotal.toFixed(2)})`);
      console.warn('This may be due to rounding to 2 decimal places.');
    } else {
      console.log('Weights successfully updated and verified.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the update
updateWeights(); 