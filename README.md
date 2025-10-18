# Filament Twist Documentation

This directory contains the complete documentation for Filament Twist, built with VitePress.

## What is Filament Twist?

Filament Twist is a powerful Laravel package that extends Filament with:

- **🧩 Modular Addon Architecture**: Build reusable, self-contained addons
- **🏢 Multi-Tenancy Support**: Database isolation for SaaS applications  
- **⚡ Deep Filament Integration**: Seamless panel management and customization
- **🛠️ Developer Tools**: Powerful Artisan commands for project management

## Documentation Structure

### Guide
- [Getting Started](./guide/getting-started.md) - Installation and basic setup
- [Creating Addons](./guide/creating-addons.md) - Build your first addon
- [Multi-Tenancy](./guide/multi-tenancy.md) - Database isolation and tenant management
- [Console Commands](./guide/console-commands.md) - Complete command reference
- [Panel Configuration](./guide/panel-configuration.md) - Advanced panel setup
- [Configuration Reference](./guide/configuration.md) - Complete configuration guide

### Examples
- [Complete Examples](./examples/index.md) - Real-world implementation examples

### API Reference
- [TwistClass](./api/twist-class.md) - Core configuration class
- [Addon Interfaces](./api/addon-interfaces.md) - Interface implementations

## Development

### Running the Documentation Locally

```bash
# Install dependencies
npm install

# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

### Contributing to Documentation

1. All documentation files are in Markdown format
2. Follow the existing structure and style
3. Include code examples where appropriate
4. Test all code examples before submitting

### File Organization

```
docs/
├── .vitepress/           # VitePress configuration
│   ├── config.mts        # Main configuration
│   └── cache/           # Build cache
├── guide/               # User guides
├── examples/            # Example implementations  
├── api/                 # API reference
├── index.md            # Homepage
└── README.md           # This file
```

## Links

- [Filament Twist Repository](https://github.com/filamenttwist/twist)
- [VitePress Documentation](https://vitepress.dev/)
- [Filament Documentation](https://filamentphp.com/)

## License

This documentation is released under the MIT License.