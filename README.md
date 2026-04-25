# Minecraft Plugin Documentation MCP Server

An MCP (Model Context Protocol) server that helps Minecraft Java plugin developers check the latest documentation and versions of common dependencies.

## Features

- **Dependency Documentation Lookup** - Get wiki, javadocs, and GitHub links for popular Minecraft plugin dependencies
- **Project Scanning** - Scan Gradle and Maven projects to extract all dependencies
- **Version Checking** - Check for latest versions from Maven Central, JitPack, Paper repo, and more
- **Full Project Analysis** - Comprehensive analysis of plugin workspaces with recommendations
- **API Reference** - Detailed sub-API documentation for complex plugins (EdTools, SkinsRestorer, etc.)

## Supported Dependencies

| Dependency | Repository | Description |
|------------|------------|-------------|
| Paper API | Paper | Paper Minecraft server API |
| Spigot API | Spigot | Spigot Minecraft server API |
| Bukkit | Spigot | Bukkit API |
| LuckPerms | Maven Central | Permissions plugin API |
| Vault | JitPack | Economy/Permissions/Chat API |
| HikariCP | Maven Central | JDBC connection pool |
| Item-NBT-API | CodeMC | NBT manipulation without NMS |
| PacketEvents | Maven Central | Packet manipulation library |
| DecentHolograms | JitPack | Hologram plugin API |
| CoreProtect | Maven Central | Block logging API |
| mc-MenuAPI | JitPack | GUI/Menu API |
| PlaceholderAPI | Custom | Placeholder system |
| WorldEdit | Custom | World editing API |
| WorldGuard | Custom | Region protection API |
| SkinsRestorer | CodeMC | Skin management API |
| EdTools API | Manual (JAR) | Custom enchantments, zones, currencies, and more |

## Quick Start - Using in Your Projects

### Option 1: Global Installation (Recommended)

Install the MCP globally once, then use it in any project:

```bash
# Clone and setup (one time only)
git clone https://github.com/ValentinTarnovsky/MCP-MCP.git
cd MCP-MCP
npm install
npm run build
npm link
```

Then in **any project**, add this to your MCP config:

**Claude Code** (`.claude/mcp.json`):
```json
{
  "mcpServers": {
    "minecraft-plugin-docs": {
      "command": "npx",
      "args": ["minecraft-plugin-docs-mcp"]
    }
  }
}
```

**Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "minecraft-plugin-docs": {
      "command": "npx",
      "args": ["minecraft-plugin-docs-mcp"]
    }
  }
}
```

### Option 2: Direct Path

If you prefer not to use npm link:

```json
{
  "mcpServers": {
    "minecraft-plugin-docs": {
      "command": "node",
      "args": ["C:\\path\\to\\MCP-MCP\\dist\\index.js"]
    }
  }
}
```

## Usage Examples

Once configured, you can ask Claude things like:

### Get Dependency Documentation
```
"Get documentation for paper-api"
"Look up luckperms docs"
"What's the Maven coordinate for hikaricp?"
"Show me EdTools API reference"
"How do I use SkinsRestorer API?"
```

### Scan Your Project
```
"Scan dependencies in my project"
"What dependencies does this plugin use?"
```

### Check for Updates
```
"Check for updates in this project"
"What's the latest version of paper-api?"
"Are my dependencies up to date?"
```

### Full Analysis
```
"Analyze my plugin workspace"
"Full dependency report"
```

## Tools Reference

### `get_dependency_docs`
Get documentation for a specific dependency.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `dependency` | Yes | Name of the dependency (e.g., "paper-api", "edtools") |
| `fetch_version` | No | Whether to fetch latest version (default: true) |

**Returns:** Wiki URL, Javadocs, GitHub, Maven coordinates, quick-start snippets, and API reference if available.

### `scan_project_dependencies`
Scan a project directory for all dependencies.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `project_path` | Yes | Path to the project directory |

### `check_latest_versions`
Check for latest versions of dependencies.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `project_path` | No | Path to scan for current versions |
| `dependencies` | No | List of specific dependencies to check |
| `check_all` | No | Check all known dependencies |

### `analyze_plugin_project`
Comprehensive project analysis with recommendations.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `project_path` | No | Path to analyze |
| `check_versions` | No | Whether to check for updates (default: true) |

## Adding Custom Dependencies

Edit `src/registry/dependencies.ts`:

### Standard Maven Dependency
```typescript
'my-plugin-api': {
  name: 'My Plugin API',
  description: 'Description here',
  documentation: {
    wiki: 'https://...',
    javadocs: 'https://...',
    github: 'https://github.com/...',
  },
  maven: {
    groupId: 'com.example',
    artifactId: 'my-plugin-api',
    repository: 'maven-central', // or 'jitpack', 'paper', 'codemc', 'custom'
    repositoryUrl: 'https://...', // required for 'custom' repos
  },
  aliases: ['myplugin', 'my-plugin'],
},
```

### Manual JAR Dependency (no Maven repo)
```typescript
'local-plugin-api': {
  name: 'Local Plugin API',
  description: 'A plugin that distributes JAR manually',
  documentation: {
    wiki: 'https://...',
    github: 'https://...',
    downloadUrl: 'https://download-link...', // Where to get the JAR
  },
  maven: {
    groupId: 'com.example',
    artifactId: 'LocalPlugin-API',
    repository: 'manual', // Special type for local JARs
  },
  aliases: ['localplugin'],
  // Optional: Document sub-APIs
  apiReference: {
    mainClass: 'LocalPluginAPI',
    importPackage: 'com.example.api',
    subApis: [
      {
        name: 'FeatureAPI',
        getter: 'getFeatureAPI()',
        description: 'Manage features',
        methods: ['doSomething()', 'getSomething() -> String'],
      },
    ],
  },
},
```

After adding, rebuild: `npm run build`

## Development

### Project Structure
```
MCP-MCP/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── registry/
│   │   └── dependencies.ts   # Dependency information registry
│   ├── parsers/
│   │   ├── gradle.ts         # Gradle build file parser
│   │   └── maven.ts          # Maven POM parser
│   ├── tools/
│   │   ├── getDependencyDocs.ts
│   │   ├── scanProjectDependencies.ts
│   │   ├── checkLatestVersions.ts
│   │   └── analyzePluginProject.ts
│   └── utils/
│       ├── cache.ts          # Caching utilities
│       └── versionFetcher.ts # Version fetching from repos
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Commands
```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript
npm run dev      # Watch mode for development
npm run clean    # Remove dist/
npm link         # Make available globally via npx
```

### Testing
```bash
# Run the server manually
node dist/index.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

### Server Not Starting
1. Ensure Node.js 18+ is installed: `node --version`
2. Check the build completed: `npm run build`
3. Verify `dist/index.js` exists

### Dependencies Not Found
1. Check spelling of dependency name
2. Try using aliases (e.g., "paper" instead of "paper-api")
3. Use Maven coordinates (e.g., "io.papermc.paper:paper-api")

### npx Command Not Found
1. Run `npm link` in the MCP-MCP directory
2. Verify with `npm list -g minecraft-plugin-docs-mcp`

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Submit a pull request

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - The MCP specification
- [PaperMC](https://papermc.io/) - Paper Minecraft server
- [SpigotMC](https://www.spigotmc.org/) - Spigot Minecraft server
