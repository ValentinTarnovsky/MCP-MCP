# Minecraft Plugin Documentation MCP

This project is an MCP (Model Context Protocol) server that helps Minecraft Java plugin developers check the latest documentation and versions of common dependencies.

## Available MCP Tools

### 1. `get_dependency_docs`
Get documentation URLs, Maven coordinates, and latest version info for a Minecraft plugin dependency.

**Usage:**
```
Look up documentation for paper-api
Look up docs for luckperms
Get hikaricp documentation
```

**Supported Dependencies:**
- `paper-api` - Paper Minecraft server API
- `spigot-api` - Spigot Minecraft server API
- `bukkit` - Bukkit API
- `luckperms` - Permissions plugin API
- `vault` - Economy/Permissions/Chat API
- `hikaricp` - JDBC connection pool
- `item-nbt-api` - NBT manipulation without NMS
- `protocollib` - Packet manipulation
- `decentholograms` - Hologram plugin API
- `coreprotect` - Block logging API
- `mc-menuapi` - GUI/Menu API
- `placeholderapi` - Placeholder system
- `worldedit` - World editing API
- `worldguard` - Region protection API

### 2. `scan_project_dependencies`
Scan a project directory to extract all dependencies from build.gradle, build.gradle.kts, and pom.xml files.

**Usage:**
```
Scan dependencies in C:\path\to\project
What dependencies does this project use?
```

### 3. `check_latest_versions`
Check for the latest versions of Minecraft plugin dependencies and get upgrade recommendations.

**Usage:**
```
Check for dependency updates in this project
What's the latest version of paper-api?
Are my dependencies up to date?
```

### 4. `analyze_plugin_project`
Perform comprehensive analysis of a Minecraft plugin workspace, including all subprojects.

**Usage:**
```
Analyze my plugin project
Give me a full dependency report
Check C:\Users\tarno\Desktop\OkiMC-Plugins for updates
```

## Slash Commands

### `/init`
Initialize the MCP in a new Minecraft plugin project.

**What it does:**
1. Checks if the MCP server is properly configured
2. Scans the current project structure
3. Identifies the build system (Gradle/Maven)
4. Provides setup instructions for the project
5. Suggests adding the MCP to project documentation

**Example:**
```
/init
```

### `/check-deps`
Scan the current project for dependencies and check for available updates.

**What it does:**
1. Scans all build files in the current project
2. Extracts dependencies with current versions
3. Checks each dependency for available updates
4. Reports outdated dependencies with upgrade recommendations

**Example:**
```
/check-deps
/check-deps C:\path\to\specific\project
```

### `/docs <dependency>`
Get documentation links for a specific Minecraft plugin dependency.

**What it does:**
1. Looks up the dependency in the registry
2. Returns wiki, javadocs, and GitHub links
3. Shows Maven coordinates and latest version
4. Provides quick-start code snippets for Gradle and Maven

**Examples:**
```
/docs paper-api
/docs luckperms
/docs hikaricp
```

### `/analyze`
Full analysis of the plugin project or workspace.

**What it does:**
1. Scans all subprojects in the workspace
2. Collects all dependencies across projects
3. Identifies version inconsistencies
4. Checks for outdated dependencies
5. Provides recommendations for improvements

**Example:**
```
/analyze
/analyze C:\Users\tarno\Desktop\OkiMC-Plugins
```

## Common Workflows

### Starting a New Plugin
1. Create your project structure (Gradle or Maven)
2. Run `/init` to verify setup
3. Use `/docs paper-api` to get the latest Paper API info
4. Add dependencies with the provided Maven coordinates

### Checking for Updates
1. Run `/check-deps` in your project
2. Review the list of outdated dependencies
3. Use `/docs <dependency>` to check changelogs
4. Update versions in your build file

### Setting Up Database Connection
1. Run `/docs hikaricp` to get HikariCP setup
2. Add HikariCP dependency to your build file
3. Configure connection pool with recommended settings

### Adding Permissions Support
1. Run `/docs luckperms` for LuckPerms API
2. Run `/docs vault` for Vault API (cross-plugin compat)
3. Choose the appropriate API for your needs

### Multi-Project Workspace
1. Run `/analyze` to scan all projects
2. Review version inconsistencies
3. Standardize dependency versions
4. Consider using Gradle Version Catalogs

## Adding to Other Projects

Copy this template to your plugin project's `claude.md`:

```markdown
# [Your Plugin Name]

## Project Info
- Build System: Gradle/Maven
- Minecraft Version: 1.21.x
- API: Paper

## MCP Integration
This project uses the Minecraft Plugin Documentation MCP for dependency management.

### Quick Commands
- `/docs <dep>` - Get dependency documentation
- `/check-deps` - Check for updates
- `/analyze` - Full project analysis

## Dependencies
<!-- List your main dependencies here -->
```

## Tips for Claude

When working with Minecraft plugin projects:

1. **Always check versions first** - Use `/check-deps` before suggesting dependency changes
2. **Prefer Paper over Spigot** - Paper has better performance and more features
3. **Use compileOnly scope** - Most plugin APIs should be `compileOnly` or `provided`
4. **Check compatibility** - Verify dependencies work with the target Minecraft version
5. **Use the registry** - Check if a dependency is in the MCP registry before looking elsewhere
