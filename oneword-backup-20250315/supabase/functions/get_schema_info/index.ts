// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase_oauth

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from get_schema_info function!")

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
        auth: {
          persistSession: false,
        },
      }
    )

    // Get the request body
    const { query_type } = await req.json()

    // Initialize the response data
    let data = null

    // Execute the appropriate query based on query_type
    if (query_type === 'tables') {
      // Query to get all tables in the public schema
      const { data: tables, error } = await supabaseClient.from('pg_tables').select('*').eq('schemaname', 'public')
      
      if (error) throw error
      data = tables
    } 
    else if (query_type === 'foreign_keys') {
      // Query to get all foreign key relationships
      const { data: fks, error } = await supabaseClient.rpc('get_foreign_keys')
      
      if (error) throw error
      data = fks
    }
    else if (query_type === 'circular_foreign_keys') {
      // Query to detect circular foreign key relationships
      const { data: circular, error } = await supabaseClient.rpc('get_circular_foreign_keys')
      
      if (error) throw error
      data = circular
    }
    else if (query_type === 'schema_info') {
      // Direct SQL query to get schema information
      const { data: schemaInfo, error } = await supabaseClient.rpc('get_tables')
      
      if (error) throw error
      data = schemaInfo
    }
    else {
      throw new Error('Invalid query_type specified')
    }

    return new Response(
      JSON.stringify({ data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in get_schema_info function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get_schema_info' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"query_type":"tables"}'

*/
