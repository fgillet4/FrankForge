#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up FrankForge project...${NC}"

# Build Rust WASM component
echo -e "${YELLOW}Building Rust WASM components...${NC}"
cd rust
# Update Cargo.toml to include serde-serialize feature
sed -i.bak 's/wasm-bindgen = "0.2.87"/wasm-bindgen = { version = "0.2.87", features = ["serde-serialize"] }/g' Cargo.toml
wasm-pack build --target web
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build WASM components. See error above.${NC}"
    exit 1
fi
cd ..

# Set up frontend
echo -e "${YELLOW}Setting up frontend components...${NC}"
cd frontend

# Install dependencies and start dev server
npm install
echo -e "${GREEN}Setup complete! Starting development server...${NC}"
npm run dev