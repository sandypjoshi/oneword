#!/bin/bash
echo "Starting Supabase MCP server..."
cd "$(dirname "$0")"
node mcp-supabase/build/start-server.js 