// Test script to manually start the MCP server
console.log('Starting Supabase MCP server...');
console.log('Press Ctrl+C to stop');

const { spawn } = require('child_process');
const server = spawn('node', ['mcp-supabase/build/start-server.js'], {
  stdio: 'inherit'
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
}); 