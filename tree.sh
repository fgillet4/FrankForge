#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}FrankForge Project Structure (AI Context)${NC}\n"

# Create a temporary file for the tree output
temp_file=$(mktemp)

# Run tree command with specific patterns to include
tree -I "node_modules|dist|target|.git|*.wasm|*.log|*.lock" --dirsfirst -a > $temp_file

# Process the tree output to highlight important files
cat $temp_file | sed -E \
    -e "s/(.*package.json|.*tsconfig.*|.*vite.config.ts)/\\${GREEN}&\\${NC}/" \
    -e "s/(.*lib\/.*\.ts)/\\${BLUE}&\\${NC}/" \
    -e "s/(.*Cargo\.toml|.*\/lib\.rs|.*\/mod\.rs)/\\${YELLOW}&\\${NC}/" \
    -e "s/(.*App\.svelte|.*Game\.svelte|.*Canvas\.svelte|.*\.svelte)/\\${BLUE}&\\${NC}/" 

# Remove the temporary file
rm $temp_file

echo -e "\n${YELLOW}Key Files for AI Understanding:${NC}"
echo -e "${GREEN}└── frontend/package.json${NC} - Dependencies and project setup"
echo -e "${GREEN}└── frontend/vite.config.ts${NC} - Build configuration"
echo -e "${BLUE}└── frontend/src/lib/gameLoop.ts${NC} - Core game state and simulation loop"
echo -e "${BLUE}└── frontend/src/lib/wasm.ts${NC} - Interface to Rust WASM simulation"
echo -e "${YELLOW}└── rust/Cargo.toml${NC} - Rust dependencies and configuration"
echo -e "${YELLOW}└── rust/src/lib.rs${NC} - Entry point for Rust code"
echo -e "${BLUE}└── frontend/src/App.svelte${NC} - Main application component"
echo -e "${BLUE}└── frontend/src/routes/Game.svelte${NC} - Game interface"