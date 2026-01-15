/**
 * Gradle build file parser for both Groovy DSL (.gradle) and Kotlin DSL (.gradle.kts)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedDependency {
  groupId: string;
  artifactId: string;
  version: string;
  scope: string;
  raw: string;
}

export interface GradleBuildInfo {
  filePath: string;
  projectName?: string;
  dependencies: ParsedDependency[];
  repositories: string[];
  plugins: string[];
}

/**
 * Parse a Gradle build file (both Groovy and Kotlin DSL)
 */
export async function parseGradleFile(filePath: string): Promise<GradleBuildInfo> {
  const content = await fs.readFile(filePath, 'utf-8');
  const isKotlinDsl = filePath.endsWith('.kts');

  const dependencies = parseGradleDependencies(content, isKotlinDsl);
  const repositories = parseGradleRepositories(content);
  const plugins = parseGradlePlugins(content, isKotlinDsl);

  return {
    filePath,
    dependencies,
    repositories,
    plugins,
  };
}

/**
 * Parse dependencies from Gradle content
 */
function parseGradleDependencies(content: string, isKotlinDsl: boolean): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];

  // Match dependencies block
  const depsBlockRegex = /dependencies\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  const depsBlockMatch = depsBlockRegex.exec(content);

  if (!depsBlockMatch) {
    return dependencies;
  }

  const depsContent = depsBlockMatch[1];

  // Regex patterns for different dependency formats
  const patterns = [
    // Kotlin DSL: implementation("group:artifact:version")
    /(\w+)\s*\(\s*["']([^:]+):([^:]+):([^"']+)["']\s*\)/g,
    // Groovy DSL: implementation 'group:artifact:version'
    /(\w+)\s+['"]([^:]+):([^:]+):([^'"]+)['"]/g,
    // Groovy DSL without quotes: implementation group: 'x', name: 'y', version: 'z'
    /(\w+)\s+group\s*:\s*['"]([^'"]+)['"]\s*,\s*name\s*:\s*['"]([^'"]+)['"]\s*,\s*version\s*:\s*['"]([^'"]+)['"]/g,
    // Kotlin DSL with version catalog: implementation(libs.something)
    // This would need catalog parsing, for now we skip these
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(depsContent)) !== null) {
      const [raw, scope, groupId, artifactId, version] = match;
      dependencies.push({
        groupId,
        artifactId,
        version,
        scope: normalizeScope(scope),
        raw,
      });
    }
    pattern.lastIndex = 0; // Reset regex state
  }

  // Also parse dependencies without version (BOM managed)
  const noVersionPatterns = [
    // implementation("group:artifact")
    /(\w+)\s*\(\s*["']([^:]+):([^:"']+)["']\s*\)/g,
    // implementation 'group:artifact'
    /(\w+)\s+['"]([^:]+):([^:'"]+)['"]/g,
  ];

  for (const pattern of noVersionPatterns) {
    let match;
    while ((match = pattern.exec(depsContent)) !== null) {
      const [raw, scope, groupId, artifactId] = match;
      // Only add if not already parsed with version
      const exists = dependencies.some(d => d.groupId === groupId && d.artifactId === artifactId);
      if (!exists) {
        dependencies.push({
          groupId,
          artifactId,
          version: 'BOM-managed',
          scope: normalizeScope(scope),
          raw,
        });
      }
    }
    pattern.lastIndex = 0;
  }

  return dependencies;
}

/**
 * Parse repositories from Gradle content
 */
function parseGradleRepositories(content: string): string[] {
  const repos: string[] = [];

  // Match common repository declarations
  const repoPatterns = [
    /mavenCentral\s*\(\)/g,
    /mavenLocal\s*\(\)/g,
    /google\s*\(\)/g,
    /gradlePluginPortal\s*\(\)/g,
    /jcenter\s*\(\)/g,
    /maven\s*\{\s*url\s*[=:]?\s*["']([^"']+)["']/g,
    /maven\s*\(\s*["']([^"']+)["']\s*\)/g,
    /maven\s*\{\s*setUrl\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of repoPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        repos.push(match[1]);
      } else {
        repos.push(match[0].replace(/\s*\(\s*\)/, ''));
      }
    }
    pattern.lastIndex = 0;
  }

  return [...new Set(repos)];
}

/**
 * Parse plugins from Gradle content
 */
function parseGradlePlugins(content: string, isKotlinDsl: boolean): string[] {
  const plugins: string[] = [];

  // Match plugins block
  const pluginsBlockRegex = /plugins\s*\{([^}]+)\}/s;
  const pluginsMatch = pluginsBlockRegex.exec(content);

  if (pluginsMatch) {
    const pluginsContent = pluginsMatch[1];

    // Kotlin DSL: id("plugin.id")
    const kotlinPattern = /id\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match;
    while ((match = kotlinPattern.exec(pluginsContent)) !== null) {
      plugins.push(match[1]);
    }

    // Groovy DSL: id 'plugin.id'
    const groovyPattern = /id\s+['"]([^'"]+)['"]/g;
    while ((match = groovyPattern.exec(pluginsContent)) !== null) {
      plugins.push(match[1]);
    }

    // kotlin("jvm"), java, etc
    const shorthandPattern = /\b(kotlin|java|application|library)\s*\(/g;
    while ((match = shorthandPattern.exec(pluginsContent)) !== null) {
      plugins.push(match[1]);
    }
  }

  return [...new Set(plugins)];
}

/**
 * Normalize dependency scope names
 */
function normalizeScope(scope: string): string {
  const scopeMap: Record<string, string> = {
    'implementation': 'compile',
    'api': 'compile',
    'compileOnly': 'provided',
    'compileOnlyApi': 'provided',
    'runtimeOnly': 'runtime',
    'testImplementation': 'test',
    'testCompileOnly': 'test',
    'testRuntimeOnly': 'test',
    'annotationProcessor': 'annotation',
    'kapt': 'annotation',
  };

  return scopeMap[scope] || scope;
}

/**
 * Find all Gradle build files in a directory
 */
export async function findGradleFiles(rootPath: string): Promise<string[]> {
  const gradleFiles: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip common non-project directories
          if (!['node_modules', '.git', '.gradle', 'build', 'out', '.idea'].includes(entry.name)) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          if (entry.name === 'build.gradle' || entry.name === 'build.gradle.kts') {
            gradleFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  await scanDir(rootPath);
  return gradleFiles;
}

/**
 * Parse settings.gradle to find subprojects
 */
export async function parseGradleSettings(settingsPath: string): Promise<string[]> {
  const subprojects: string[] = [];

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');

    // include("subproject") or include 'subproject'
    const includePattern = /include\s*\(?["':]+([^"'\)]+)["']?\)?/g;
    let match;
    while ((match = includePattern.exec(content)) !== null) {
      subprojects.push(match[1].replace(/^:/, ''));
    }
  } catch (error) {
    // Settings file may not exist
  }

  return subprojects;
}
