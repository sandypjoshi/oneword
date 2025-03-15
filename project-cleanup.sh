#!/bin/bash

# Project Cleanup Script
# This script will remove all non-essential files and directories from the OneWord project

echo "Starting project cleanup..."

# Create a backup directory
BACKUP_DIR="oneword-backup-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Move important test files to backup
echo "Backing up test files..."
cp -r tests "$BACKUP_DIR"/
cp -r supabase "$BACKUP_DIR"/

# Back up scripts directory
echo "Backing up scripts..."
cp -r scripts "$BACKUP_DIR"/

# Back up all JavaScript files in root (except package.json and essential config files)
echo "Backing up JavaScript files..."
mkdir -p "$BACKUP_DIR"/js-files
for file in *.js; do
  if [ -f "$file" ]; then
    # Skip essential files
    if [[ "$file" != "metro.config.js" && "$file" != "babel.config.js" && "$file" != "global.js" && "$file" != "index.js" ]]; then
      cp "$file" "$BACKUP_DIR"/js-files/
    fi
  fi
done

# Back up SQL files
echo "Backing up SQL files..."
mkdir -p "$BACKUP_DIR"/sql-files
for file in *.sql; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR"/sql-files/
  fi
done

# Back up any JSON data files
echo "Backing up JSON data files..."
mkdir -p "$BACKUP_DIR"/json-files
for file in *.json; do
  if [ -f "$file" ]; then
    # Skip essential files
    if [[ "$file" != "package.json" && "$file" != "package-lock.json" && "$file" != "app.json" && "$file" != "tsconfig.json" ]]; then
      cp "$file" "$BACKUP_DIR"/json-files/
    fi
  fi
done

# Back up log files
echo "Backing up log files..."
mkdir -p "$BACKUP_DIR"/logs
for file in *.log; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR"/logs/
  fi
done

# Back up HTML files
echo "Backing up HTML files..."
mkdir -p "$BACKUP_DIR"/html-files
for file in *.html; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR"/html-files/
  fi
done

# Back up CSV files
echo "Backing up CSV files..."
mkdir -p "$BACKUP_DIR"/csv-files
for file in *.csv; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR"/csv-files/
  fi
done

# Back up TXT files
echo "Backing up TXT files..."
mkdir -p "$BACKUP_DIR"/txt-files
for file in *.txt; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR"/txt-files/
  fi
done

# Back up Markdown files except README.md
echo "Backing up Markdown files..."
mkdir -p "$BACKUP_DIR"/md-files
for file in *.md; do
  if [ -f "$file" ]; then
    if [[ "$file" != "README.md" ]]; then
      cp "$file" "$BACKUP_DIR"/md-files/
    fi
  fi
done

# Create a .gitignore backup
if [ -f ".gitignore" ]; then
  cp .gitignore "$BACKUP_DIR"/
fi

# Back up word_datasets directory
if [ -d "word_datasets" ]; then
  cp -r word_datasets "$BACKUP_DIR"/
fi

# Back up wordnet-data directory
if [ -d "wordnet-data" ]; then
  cp -r wordnet-data "$BACKUP_DIR"/
fi

# Back up datasets directory
if [ -d "datasets" ]; then
  cp -r datasets "$BACKUP_DIR"/
fi

# Back up mcp-supabase directory
if [ -d "mcp-supabase" ]; then
  cp -r mcp-supabase "$BACKUP_DIR"/
fi

echo "Backup complete. You can find all backed up files in the $BACKUP_DIR directory."

# Cleanup: remove the files and directories after backup
echo "Now removing non-essential files and directories..."

# Remove test scripts and analysis scripts
rm -rf scripts/
rm -rf tests/
rm -rf logs/
rm -rf word_datasets/
rm -rf wordnet-data/
rm -rf datasets/
rm -rf mcp-supabase/

# Remove temp files and logs in root
rm -f *.log
rm -f *.csv
rm -f *.html
rm -f *.sql

# Remove all JavaScript files in root except essential ones
for file in *.js; do
  if [ -f "$file" ]; then
    # Keep only essential config files
    if [[ "$file" != "metro.config.js" && "$file" != "babel.config.js" && "$file" != "global.js" && "$file" != "index.js" ]]; then
      rm -f "$file"
    fi
  fi
done

# Remove large JSON data files (but keep package.json and config files)
for file in *.json; do
  if [ -f "$file" ]; then
    # Skip essential files
    if [[ "$file" != "package.json" && "$file" != "package-lock.json" && "$file" != "app.json" && "$file" != "tsconfig.json" ]]; then
      rm -f "$file"
    fi
  fi
done

# Remove text files
rm -f *.txt

# Remove markdown files except README.md
for file in *.md; do
  if [ -f "$file" ]; then
    if [[ "$file" != "README.md" ]]; then
      rm -f "$file"
    fi
  fi
done

# Special case: Keep API-related files in lib directory if they exist
# We're keeping the lib directory as is since it might contain important app code

# Delete this cleanup script (Optional - uncomment if you want it to self-delete)
# rm -f project-cleanup.sh

echo "Cleanup complete! All non-essential files have been backed up to $BACKUP_DIR and removed from the project."
echo "Your project now contains only the essential files needed for the application to run." 