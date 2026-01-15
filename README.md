# Minecraft Plugin Documentation MCP Server

An MCP (Model Context Protocol) server that helps Minecraft Java plugin developers check the latest documentation and versions of common dependencies.

## Features

- **Dependency Documentation Lookup** - Get wiki, javadocs, and GitHub links for popular Minecraft plugin dependencies
- **Project Scanning** - Scan Gradle and Maven projects to extract all dependencies
- **Version Checking** - Check for latest versions from Maven Central, JitPack, Paper repo, and more
- **Full Project Analysis** - Comprehensive analysis of plugin workspaces with recommendations

## Supported Dependencies

| Dependency | Description |
|------------|-------------|
| Paper API | Paper Minecraft server API |
| Spigot API | Spigot Minecraft server API |
| Bukkit | Bukkit API |
| LuckPerms | Permissions plugin API |
| Vault | Economy/Permissions/Chat API |
| HikariCP | JDBC connection pool |
| Item-NBT-API | NBT manipulation without NMS |
| ProtocolLib | Packet manipulation library |
| DecentHolograms | Hologram plugin API |
| CoreProtect | Block logging API |
| mc-MenuAPI | GUI/Menu API |
| PlaceholderAPI | Placeholder system |
| WorldEdit | World editing API |
| WorldGuard | Region protection API |

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Build from Source

```bash
# Clone or navigate to the project directory
cd C:\Users\tarno\Desktop\MCP-MCP

# Install dependencies
npm install

# Build the project
npm run build
```

### Add to Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "minecraft-plugin-docs": {
      "command": "node",
      "args": ["C:\\Users\\tarno\\Desktop\\MCP-MCP\\dist\\index.js"]
    }
  }
}
```

### Add to Claude Code

Add the following to your Claude Code MCP settings (`.claude/mcp.json` or global settings):

```json
{
  "mcpServers": {
    "minecraft-plugin-docs": {
      "command": "node",
      "args": ["C:\\Users\\tarno\\Desktop\\MCP-MCP\\dist\\index.js"]
    }
  }
}
```

## Usage

### Tool: `get_dependency_docs`

Get documentation for a specific Minecraft plugin dependency.

```
# Examples
"Get documentation for paper-api"
"Look up luckperms docs"
"What's the Maven coordinate for hikaricp?"
```

**Parameters:**
- `dependency` (required): Name of the dependency
- `fetch_version` (optional): Whether to fetch latest version (default: true)

### Tool: `scan_project_dependencies`

Scan a project directory for all dependencies.

```
# Examples
"Scan dependencies in my project"
"What dependencies does C:\path\to\project use?"
```

**Parameters:**
- `project_path` (required): Path to the project directory

### Tool: `check_latest_versions`

Check for latest versions of dependencies.

```
# Examples
"Check for updates in this project"
"What's the latest version of paper-api?"
"Are my dependencies up to date?"
```

**Parameters:**
- `project_path` (optional): Path to scan for current versions
- `dependencies` (optional): List of specific dependencies to check
- `check_all` (optional): Check all known dependencies

### Tool: `analyze_plugin_project`

Comprehensive project analysis.

```
# Examples
"Analyze my plugin workspace"
"Full dependency report for OkiMC-Plugins"
```

**Parameters:**
- `project_path` (optional): Path to analyze (defaults to OkiMC-Plugins)
- `check_versions` (optional): Whether to check for updates (default: true)

## Integration with Plugin Projects

### Adding to Your Plugin Project

1. Copy the `claude.md` file to your plugin project's root
2. Customize it with your project-specific information
3. Claude will automatically use the MCP tools when relevant

### Example `claude.md` for Your Project

```markdown
# My Minecraft Plugin

## Project Info
- Build System: Gradle (Kotlin DSL)
- Minecraft Version: 1.21.4
- API: Paper API

## MCP Integration
This project uses the Minecraft Plugin Documentation MCP.

### Commands
- `/docs <dependency>` - Get dependency documentation
- `/check-deps` - Check for dependency updates
- `/analyze` - Full project analysis

## Dependencies
- Paper API 1.21.4
- LuckPerms API 5.4
- HikariCP 5.1.0
```

## Configuration

### Caching

The server caches version information to reduce API calls:
- Version data: 1 hour TTL
- Metadata: 30 minutes TTL

### Adding Custom Dependencies

Edit `src/registry/dependencies.ts` to add new dependencies:

```typescript
'my-custom-dep': {
  name: 'My Custom Dependency',
  description: 'Description here',
  documentation: {
    wiki: 'https://...',
    javadocs: 'https://...',
    github: 'https://github.com/...',
  },
  maven: {
    groupId: 'com.example',
    artifactId: 'my-dep',
    repository: 'maven-central', // or 'jitpack', 'paper', 'custom'
    repositoryUrl: 'https://...', // for custom repos
  },
  aliases: ['custom-dep', 'mydep'],
},
```

## Troubleshooting

### Server Not Starting

1. Ensure Node.js 18+ is installed: `node --version`
2. Check the build completed: `npm run build`
3. Verify the dist/index.js exists

### Dependencies Not Found

1. Check spelling of dependency name
2. Try using aliases (e.g., "paper" instead of "paper-api")
3. Use Maven coordinates (e.g., "io.papermc.paper:paper-api")

### Version Check Fails

1. Check internet connectivity
2. Some repositories may have rate limits
3. JitPack builds may need to be triggered first

### Build File Parsing Issues

1. Ensure build files are valid Gradle/Maven syntax
2. Complex Gradle configurations may not parse completely
3. Version catalogs (libs.versions.toml) are not yet fully supported

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
├── claude.md                 # Claude Code integration
└── README.md
```

### Building

```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode
npm run clean    # Remove dist/
```

### Testing

```bash
# Run the server manually
node dist/index.js

# Test with MCP Inspector (if available)
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - The MCP specification
- [PaperMC](https://papermc.io/) - Paper Minecraft server
- [SpigotMC](https://www.spigotmc.org/) - Spigot Minecraft server
