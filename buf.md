# Buf Protocol Buffers Setup

This project is now configured with [Buf](https://buf.build/) for managing Protocol Buffers.

## What's Installed

- **buf**: Latest version (1.55.1) - Protocol buffer toolchain
- **protoc**: System protobuf compiler (3.21.12)
- **Node.js protobuf tools**: For JavaScript/TypeScript generation

## File Structure

```
├── buf.yaml              # Buf configuration (linting, breaking change detection)
├── buf.gen.yaml          # Code generation configuration
├── proto/                # Protocol buffer definitions
│   └── example/v1/       # Example service definitions
├── shared/generated/     # Generated code output
└── scripts/proto.sh      # Helper script for buf operations
```

## Available Commands

### NPM Scripts
```bash
npm run buf:lint      # Lint protobuf files
npm run buf:format    # Format protobuf files
npm run buf:build     # Build protobuf files
npm run proto         # Run all buf operations + code generation
```

### Direct Buf Commands
```bash
buf lint              # Check protobuf files for style issues
buf format --write    # Format protobuf files in place
buf build             # Compile protobuf files
buf generate          # Generate code from protobuf files
```

## Getting Started

1. **Add your protobuf files** to the `proto/` directory following the package structure:
   ```
   proto/your_package/v1/your_service.proto
   ```

2. **Run the complete workflow**:
   ```bash
   npm run proto
   ```

3. **Generated files** will be available in `shared/generated/`

## Configuration

- **buf.yaml**: Controls linting rules and breaking change detection
- **buf.gen.yaml**: Configures code generation plugins and output
- **scripts/proto.sh**: Handles the complete protobuf workflow

## Example Service

The setup includes an example service (`proto/example/v1/example.proto`) demonstrating:
- gRPC service definitions
- Request/response message types
- Proper protobuf conventions

## Next Steps

1. Replace the example service with your actual service definitions
2. Update the generation scripts if you need different output formats
3. Integrate the generated code into your application

## Troubleshooting

If you encounter issues:
1. Ensure buf is in your PATH: `buf --version`
2. Check protobuf file syntax: `npm run buf:lint`
3. Verify directory structure matches package names
4. Run the helper script: `npm run proto`

For more information, visit the [Buf documentation](https://buf.build/docs).