#!/bin/bash

# Protocol Buffer generation script for buf

set -e

echo "Running buf operations..."

# Check if buf is installed
if ! command -v buf &> /dev/null; then
    echo "Error: buf is not installed. Please install buf first."
    exit 1
fi

# Lint protobuf files
echo "Linting protobuf files..."
buf lint

# Format protobuf files
echo "Formatting protobuf files..."
buf format --write

# Build the project
echo "Building protobuf files..."
buf build

# Generate TypeScript/JavaScript code using protoc directly
echo "Generating TypeScript/JavaScript code..."
mkdir -p shared/generated/js
mkdir -p shared/generated/ts

# Generate JavaScript files
protoc \
    --proto_path=proto \
    --js_out=import_style=commonjs,binary:shared/generated/js \
    proto/example/v1/example.proto 2>/dev/null || echo "JS generation skipped (protoc-gen-js not available)"

# Generate TypeScript definitions using ts-protoc-gen if available
if command -v protoc-gen-ts &> /dev/null; then
    protoc \
        --proto_path=proto \
        --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
        --ts_out=shared/generated/ts \
        proto/example/v1/example.proto
else
    echo "TypeScript generation skipped (protoc-gen-ts not available)"
fi

echo "Done! Protobuf files processed successfully."
echo "Generated files are in shared/generated/"