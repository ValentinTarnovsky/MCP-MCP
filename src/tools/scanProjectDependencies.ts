/**
 * Tool: scan_project_dependencies
 * Scans a project's build files and extracts dependencies
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseGradleFile, findGradleFiles, ParsedDependency } from '../parsers/gradle.js';
import { parseMavenFile, findMavenFiles, MavenDependency } from '../parsers/maven.js';
import { findDependency, DependencyInfo } from '../registry/dependencies.js';

export interface ProjectDependency {
  groupId: string;
  artifactId: string;
  version: string;
  scope: string;
  source: 'gradle' | 'maven';
  filePath: string;
  knownDependency?: DependencyInfo;
}

export interface ScanResult {
  projectPath: string;
  buildSystem: 'gradle' | 'maven' | 'mixed' | 'unknown';
  totalFiles: number;
  dependencies: ProjectDependency[];
  knownDependencies: ProjectDependency[];
  unknownDependencies: ProjectDependency[];
  repositories: string[];
  errors: string[];
}

/**
 * Scan a project directory for dependencies
 */
export async function scanProjectDependencies(projectPath: string): Promise<ScanResult> {
  const result: ScanResult = {
    projectPath,
    buildSystem: 'unknown',
    totalFiles: 0,
    dependencies: [],
    knownDependencies: [],
    unknownDependencies: [],
    repositories: [],
    errors: [],
  };

  // Check if path exists
  try {
    const stat = await fs.stat(projectPath);
    if (!stat.isDirectory()) {
      result.errors.push(`Path is not a directory: ${projectPath}`);
      return result;
    }
  } catch (error) {
    result.errors.push(`Path does not exist: ${projectPath}`);
    return result;
  }

  // Find build files
  const [gradleFiles, mavenFiles] = await Promise.all([
    findGradleFiles(projectPath),
    findMavenFiles(projectPath),
  ]);

  result.totalFiles = gradleFiles.length + mavenFiles.length;

  // Determine build system
  if (gradleFiles.length > 0 && mavenFiles.length > 0) {
    result.buildSystem = 'mixed';
  } else if (gradleFiles.length > 0) {
    result.buildSystem = 'gradle';
  } else if (mavenFiles.length > 0) {
    result.buildSystem = 'maven';
  }

  // Parse Gradle files
  for (const filePath of gradleFiles) {
    try {
      const buildInfo = await parseGradleFile(filePath);

      for (const dep of buildInfo.dependencies) {
        const projectDep = convertGradleDependency(dep, filePath);
        result.dependencies.push(projectDep);

        if (projectDep.knownDependency) {
          result.knownDependencies.push(projectDep);
        } else {
          result.unknownDependencies.push(projectDep);
        }
      }

      result.repositories.push(...buildInfo.repositories);
    } catch (error) {
      result.errors.push(`Failed to parse ${filePath}: ${error}`);
    }
  }

  // Parse Maven files
  for (const filePath of mavenFiles) {
    try {
      const buildInfo = await parseMavenFile(filePath);

      for (const dep of buildInfo.dependencies) {
        const projectDep = convertMavenDependency(dep, filePath);
        result.dependencies.push(projectDep);

        if (projectDep.knownDependency) {
          result.knownDependencies.push(projectDep);
        } else {
          result.unknownDependencies.push(projectDep);
        }
      }

      result.repositories.push(...buildInfo.repositories);
    } catch (error) {
      result.errors.push(`Failed to parse ${filePath}: ${error}`);
    }
  }

  // Deduplicate repositories
  result.repositories = [...new Set(result.repositories)];

  // Deduplicate dependencies by groupId:artifactId (keep first occurrence)
  const seen = new Set<string>();
  result.dependencies = result.dependencies.filter(dep => {
    const key = `${dep.groupId}:${dep.artifactId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Re-filter known and unknown after deduplication
  result.knownDependencies = result.dependencies.filter(d => d.knownDependency);
  result.unknownDependencies = result.dependencies.filter(d => !d.knownDependency);

  return result;
}

/**
 * Convert Gradle dependency to ProjectDependency
 */
function convertGradleDependency(dep: ParsedDependency, filePath: string): ProjectDependency {
  const knownDep = findDependency(`${dep.groupId}:${dep.artifactId}`);

  return {
    groupId: dep.groupId,
    artifactId: dep.artifactId,
    version: dep.version,
    scope: dep.scope,
    source: 'gradle',
    filePath,
    knownDependency: knownDep,
  };
}

/**
 * Convert Maven dependency to ProjectDependency
 */
function convertMavenDependency(dep: MavenDependency, filePath: string): ProjectDependency {
  const knownDep = findDependency(`${dep.groupId}:${dep.artifactId}`);

  return {
    groupId: dep.groupId,
    artifactId: dep.artifactId,
    version: dep.version,
    scope: dep.scope,
    source: 'maven',
    filePath,
    knownDependency: knownDep,
  };
}

/**
 * Format scan result as text for display
 */
export function formatScanResult(result: ScanResult): string {
  const lines: string[] = [];

  lines.push(`# Project Dependency Scan`);
  lines.push(`**Path:** ${result.projectPath}`);
  lines.push(`**Build System:** ${result.buildSystem}`);
  lines.push(`**Build Files Found:** ${result.totalFiles}`);
  lines.push('');

  if (result.dependencies.length > 0) {
    lines.push(`## Dependencies (${result.dependencies.length} total)`);
    lines.push('');

    if (result.knownDependencies.length > 0) {
      lines.push(`### Known Minecraft Dependencies (${result.knownDependencies.length})`);
      for (const dep of result.knownDependencies) {
        const info = dep.knownDependency!;
        lines.push(`- **${info.name}** (${dep.groupId}:${dep.artifactId}:${dep.version})`);
      }
      lines.push('');
    }

    if (result.unknownDependencies.length > 0) {
      lines.push(`### Other Dependencies (${result.unknownDependencies.length})`);
      for (const dep of result.unknownDependencies) {
        lines.push(`- ${dep.groupId}:${dep.artifactId}:${dep.version} [${dep.scope}]`);
      }
      lines.push('');
    }
  } else {
    lines.push('No dependencies found.');
    lines.push('');
  }

  if (result.repositories.length > 0) {
    lines.push(`## Repositories (${result.repositories.length})`);
    for (const repo of result.repositories) {
      lines.push(`- ${repo}`);
    }
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push(`## Errors`);
    for (const error of result.errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join('\n');
}

/**
 * MCP tool definition
 */
export const scanProjectDependenciesToolDefinition = {
  name: 'scan_project_dependencies',
  description: 'Scan a Minecraft plugin project directory and extract all dependencies from build.gradle, build.gradle.kts, and pom.xml files. Returns a structured list of dependencies with version info.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_path: {
        type: 'string',
        description: 'Path to the project directory to scan',
      },
    },
    required: ['project_path'],
  },
};
