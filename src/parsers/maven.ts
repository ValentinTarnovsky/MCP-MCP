/**
 * Maven pom.xml parser
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

export interface MavenDependency {
  groupId: string;
  artifactId: string;
  version: string;
  scope: string;
  raw: string;
}

export interface MavenBuildInfo {
  filePath: string;
  groupId?: string;
  artifactId?: string;
  version?: string;
  packaging?: string;
  dependencies: MavenDependency[];
  repositories: string[];
  properties: Record<string, string>;
  modules: string[];
}

/**
 * Parse a Maven pom.xml file
 */
export async function parseMavenFile(filePath: string): Promise<MavenBuildInfo> {
  const content = await fs.readFile(filePath, 'utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['dependency', 'repository', 'module'].includes(name),
  });

  const parsed = parser.parse(content);
  const project = parsed.project || {};

  // Extract properties for version interpolation
  const properties: Record<string, string> = {};
  if (project.properties) {
    for (const [key, value] of Object.entries(project.properties)) {
      if (typeof value === 'string') {
        properties[key] = value;
      }
    }
  }

  // Extract parent info for version inheritance
  if (project.parent) {
    properties['project.parent.version'] = project.parent.version || '';
    properties['parent.version'] = project.parent.version || '';
  }
  properties['project.version'] = project.version || '';

  // Parse dependencies
  const dependencies: MavenDependency[] = [];
  const deps = project.dependencies?.dependency || [];

  for (const dep of deps) {
    if (dep.groupId && dep.artifactId) {
      const version = resolveVersion(dep.version, properties);
      dependencies.push({
        groupId: dep.groupId,
        artifactId: dep.artifactId,
        version: version || 'inherited',
        scope: dep.scope || 'compile',
        raw: `${dep.groupId}:${dep.artifactId}:${version || 'inherited'}`,
      });
    }
  }

  // Also check dependencyManagement
  const managedDeps = project.dependencyManagement?.dependencies?.dependency || [];
  for (const dep of managedDeps) {
    if (dep.groupId && dep.artifactId) {
      const version = resolveVersion(dep.version, properties);
      const exists = dependencies.some(d => d.groupId === dep.groupId && d.artifactId === dep.artifactId);
      if (!exists) {
        dependencies.push({
          groupId: dep.groupId,
          artifactId: dep.artifactId,
          version: version || 'managed',
          scope: dep.scope || 'managed',
          raw: `${dep.groupId}:${dep.artifactId}:${version || 'managed'}`,
        });
      }
    }
  }

  // Parse repositories
  const repositories: string[] = [];
  const repos = project.repositories?.repository || [];
  for (const repo of repos) {
    if (repo.url) {
      repositories.push(repo.url);
    }
  }

  // Also check pluginRepositories
  const pluginRepos = project.pluginRepositories?.pluginRepository || [];
  for (const repo of pluginRepos) {
    if (repo.url && !repositories.includes(repo.url)) {
      repositories.push(repo.url);
    }
  }

  // Parse modules for multi-module projects
  const modules: string[] = project.modules?.module || [];

  return {
    filePath,
    groupId: project.groupId || project.parent?.groupId,
    artifactId: project.artifactId,
    version: project.version || project.parent?.version,
    packaging: project.packaging || 'jar',
    dependencies,
    repositories,
    properties,
    modules,
  };
}

/**
 * Resolve version by interpolating properties
 */
function resolveVersion(version: string | undefined, properties: Record<string, string>): string {
  if (!version) return '';

  // Handle ${property} syntax
  let resolved = version;
  const propPattern = /\$\{([^}]+)\}/g;
  let match;

  while ((match = propPattern.exec(version)) !== null) {
    const propName = match[1];
    if (properties[propName]) {
      resolved = resolved.replace(match[0], properties[propName]);
    }
  }

  return resolved;
}

/**
 * Find all Maven pom.xml files in a directory
 */
export async function findMavenFiles(rootPath: string): Promise<string[]> {
  const pomFiles: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip common non-project directories
          if (!['node_modules', '.git', 'target', '.idea', 'build'].includes(entry.name)) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          if (entry.name === 'pom.xml') {
            pomFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  await scanDir(rootPath);
  return pomFiles;
}

/**
 * Parse multiple POM files and merge dependency info
 */
export async function parseAllMavenFiles(rootPath: string): Promise<MavenBuildInfo[]> {
  const pomFiles = await findMavenFiles(rootPath);
  const results: MavenBuildInfo[] = [];

  for (const pomFile of pomFiles) {
    try {
      const info = await parseMavenFile(pomFile);
      results.push(info);
    } catch (error) {
      // Skip malformed POM files
      console.error(`Failed to parse ${pomFile}:`, error);
    }
  }

  return results;
}
