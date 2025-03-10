#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Word Definition Processing ===${NC}"

# Initialize batch counter
BATCH=1

# Process words in batches
while true; do
    # Show batch header
    echo -e "\n${YELLOW}======= BATCH ${BATCH} =======${NC}"
    
    # Run preparation script with batch size of 5000
    echo -e "\n${GREEN}Preparing next batch of words...${NC}"
    node prepare-for-definition.js --limit 5000

    # Check if words-for-definition.txt is empty or only contains the template
    if [ ! -f "words-for-definition.txt" ] || [ $(wc -l < "words-for-definition.txt") -lt 100 ]; then
        echo -e "${GREEN}No more words to process. All done!${NC}"
        break
    fi

    # Prompt user to continue
    echo -e "\n${BLUE}Please:${NC}"
    echo "1. Upload words-for-definition.txt to Claude"
    echo "2. Save Claude's output to definitions.json"
    echo -e "3. Press Enter to continue with update, or Ctrl+C to stop"
    read

    # Run update script
    echo -e "\n${GREEN}Updating definitions in database...${NC}"
    node update-definitions.js --input definitions.json

    echo -e "\n${YELLOW}====== BATCH ${BATCH} COMPLETE ======${NC}"
    echo -e "${BLUE}Press Enter to process next batch, or Ctrl+C to stop${NC}"
    read
    
    # Increment batch counter
    ((BATCH++))
done

echo -e "${GREEN}Processing complete!${NC}"
echo -e "${BLUE}Total batches processed: $((BATCH-1))${NC}" 