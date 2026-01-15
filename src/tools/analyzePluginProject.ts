/**
 * Tool: analyze_plugin_project
 * Full project analyzer that scans projects and provides comprehensive dependency reports
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { scanProjectDependencies, ScanResult, ProjectDependency } from './scanProjectDependencies.js';
import { checkVersionsForDependencies, VersionCheckResult, VersionCheckReport } from './checkLatestVersions.js';
import { findDependency, DEPENDENCY_REGISTRY } from '../registry/dependencies.js';
import { findGradleFiles } from '../parsers/gradle.js';
import { findMavenFiles } from '../parsers/maven.js';

export interface SubprojectInfo {
  name: string;
  path: string;
  buildFile: string;
  buildSystem: 'gradle' | 'maven';
  dependencies: ProjectDependency[];
}

export interface ProjectAnalysis {
  rootPath: string;
  analysisTimestamp: string;
  summary: {
    totalSubprojects: number;
    totalDependencies: number;
    uniqueDependencies: number;
    knownMinecraftDependencies: number;
    outdatedDependencies: number;
    buildSystems: string[];
  };
  subprojects: SubprojectInfo[];
  allDependencies: ProjectDependency[];
  uniqueDependencies: Array<{
    groupId: string;
    artifactId: string;
    versions: string[];
    usedIn: string[];
    isKnown: boolean;
    knownName?: string;
  }>;
  versionReport?: VersionCheckReport;
  recommendations: string[];
  warnings: string[];
}

/**
 * Default path for OkiMC-Plugins folder
 */
const DEFAULT_PLUGINS_PATH = 'C:\\Users\\tarno\\Desktop\\OkiMC-Plugins';

/**
 * Analyze a Minecraft plugin project or workspace
 */
export async function analyzePluginProject(
  projectPath?: string,
  checkVersions: boolean = true
): Promise<ProjectAnalysis> {
  const rootPath = projectPath || DEFAULT_PLUGINS_PATH;

  const analysis: ProjectAnalysis = {
    rootPath,
    analysisTimestamp: new Date().toISOString(),
    summary: {
      totalSubprojects: 0,
      totalDependencies: 0,
      uniqueDependencies: 0,
      knownMinecraftDependencies: 0,
      outdatedDependencies: 0,
      buildSystems: [],
    },
    subprojects: [],
    allDependencies: [],
    uniqueDependencies: [],
    recommendations: [],
    warnings: [],
  };

  // Check if path exists
  try {
    const stat = await fs.stat(rootPath);
    if (!stat.isDirectory()) {
      analysis.warnings.push(`Path is not a directory: ${rootPath}`);
      return analysis;
    }
  } catch (error) {
    analysis.warnings.push(`Path does not exist: ${rootPath}`);
    return analysis;
  }

  // Find all build files
  const [gradleFiles, mavenFiles] = await Promise.all([
    findGradleFiles(rootPath),
    findMavenFiles(rootPath),
  ]);

  const buildSystems = new Set<string>();
  if (gradleFiles.length > 0) buildSystems.add('gradle');
  if (mavenFiles.length > 0) buildSystems.add('maven');
  analysis.summary.buildSystems = [...buildSystems];

  // Group by project directory
  const projectDirs = new Map<string, { gradle?: string; maven?: string }>();

  for (const file of gradleFiles) {
    const dir = path.dirname(file);
    const existing = projectDirs.get(dir) || {};
    existing.gradle = file;
    projectDirs.set(dir, existing);
  }

  for (const file of mavenFiles) {
    const dir = path.dirname(file);
    const existing = projectDirs.get(dir) || {};
    existing.maven = file;
    projectDirs.set(dir, existing);
  }

  // Scan each project
  for (const [dir, files] of projectDirs) {
    try {
      const scanResult = await scanProjectDependencies(dir);
      const projectName = path.basename(dir);

      const subproject: SubprojectInfo = {
        name: projectName,
        path: dir,
        buildFile: files.gradle || files.maven || '',
        buildSystem: files.gradle ? 'gradle' : 'maven',
        dependencies: scanResult.dependencies,
      };

      analysis.subprojects.push(subproject);
      analysis.allDependencies.push(...scanResult.dependencies);

      if (scanResult.errors.length > 0) {
        analysis.warnings.push(...scanResult.errors.map(e => `[${projectName}] ${e}`));
      }
    } catch (error) {
      analysis.warnings.push(`Failed to scan ${dir}: ${error}`);
    }
  }

  // Calculate unique dependencies
  const depMap = new Map<string, {
    groupId: string;
    artifactId: string;
    versions: Set<string>;
    usedIn: Set<string>;
    isKnown: boolean;
    knownName?: string;
  }>();

  for (const dep of analysis.allDependencies) {
    const key = `${dep.groupId}:${dep.artifactId}`;
    const existing = depMap.get(key);

    if (existing) {
      existing.versions.add(dep.version);
      existing.usedIn.add(path.basename(dep.filePath));
    } else {
      const known = findDependency(key);
      depMap.set(key, {
        groupId: dep.groupId,
        artifactId: dep.artifactId,
        versions: new Set([dep.version]),
        usedIn: new Set([path.basename(dep.filePath)]),
        isKnown: !!known,
        knownName: known?.name,
      });
    }
  }

  analysis.uniqueDependencies = Array.from(depMap.values()).map(d => ({
    groupId: d.groupId,
    artifactId: d.artifactId,
    versions: [...d.versions],
    usedIn: [...d.usedIn],
    isKnown: d.isKnown,
    knownName: d.knownName,
  }));

  // Update summary
  analysis.summary.totalSubprojects = analysis.subprojects.length;
  analysis.summary.totalDependencies = analysis.allDependencies.length;
  analysis.summary.uniqueDependencies = analysis.uniqueDependencies.length;
  analysis.summary.knownMinecraftDependencies = analysis.uniqueDependencies.filter(d => d.isKnown).length;

  // Check for version inconsistencies
  for (const dep of analysis.uniqueDependencies) {
    if (dep.versions.length > 1) {
      analysis.warnings.push(
        `Version inconsistency: ${dep.knownName || dep.groupId + ':' + dep.artifactId} ` +
        `has different versions (${dep.versions.join(', ')}) across projects`
      );
    }
  }

  // Check versions if requested
  if (checkVersions) {
    const depsToCheck = analysis.uniqueDependencies.map(d => ({
      name: d.knownName,
      groupId: d.groupId,
      artifactId: d.artifactId,
      currentVersion: d.versions[0], // Use first version
    }));

    try {
      analysis.versionReport = await checkVersionsForDependencies(depsToCheck);
      analysis.summary.outdatedDependencies = analysis.versionReport.outdatedCount;
    } catch (error) {
      analysis.warnings.push(`Failed to check versions: ${error}`);
    }
  }

  // Generate recommendations
  generateRecommendations(analysis);

  return analysis;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(analysis: ProjectAnalysis): void {
  // Check for common missing dependencies
  const hasPaper = analysis.uniqueDependencies.some(d =>
    d.groupId.includes('papermc') || d.artifactId.includes('paper')
  );
  const hasSpigot = analysis.uniqueDependencies.some(d =>
    d.groupId.includes('spigotmc') || d.artifactId.includes('spigot')
  );

  if (!hasPaper && hasSpigot) {
    analysis.recommendations.push(
      'Consider migrating from Spigot to Paper API for better performance and more features.'
    );
  }

  // Check for version consistency
  const versionInconsistencies = analysis.uniqueDependencies.filter(d => d.versions.length > 1);
  if (versionInconsistencies.length > 0) {
    analysis.recommendations.push(
      `Standardize dependency versions across projects. Found ${versionInconsistencies.length} dependencies with inconsistent versions.`
    );
  }

  // Check for outdated dependencies
  if (analysis.versionReport && analysis.versionReport.outdatedCount > 0) {
    analysis.recommendations.push(
      `Update ${analysis.versionReport.outdatedCount} outdated dependencies for latest features and security fixes.`
    );
  }

  // Suggest version catalogs for Gradle projects
  if (analysis.summary.buildSystems.includes('gradle') && analysis.summary.totalSubprojects > 2) {
    analysis.recommendations.push(
      'Consider using Gradle Version Catalogs (libs.versions.toml) to centralize dependency versions.'
    );
  }
}

/**
 * Format project analysis as text
 */
export function formatProjectAnalysis(analysis: ProjectAnalysis): string {
  const lines: string[] = [];

  lines.push('# Minecraft Plugin Project Analysis');
  lines.push(`**Root Path:** ${analysis.rootPath}`);
  lines.push(`**Analyzed:** ${analysis.analysisTimestamp}`);
  lines.push('');

  lines.push('## Summary');
  lines.push(`- **Subprojects:** ${analysis.summary.totalSubprojects}`);
  lines.push(`- **Build Systems:** ${analysis.summary.buildSystems.join(', ') || 'None detected'}`);
  lines.push(`- **Total Dependencies:** ${analysis.summary.totalDependencies}`);
  lines.push(`- **Unique Dependencies:** ${analysis.summary.uniqueDependencies}`);
  lines.push(`- **Known Minecraft Dependencies:** ${analysis.summary.knownMinecraftDependencies}`);
  if (analysis.summary.outdatedDependencies > 0) {
    lines.push(`- **Outdated Dependencies:** ${analysis.summary.outdatedDependencies}`);
  }
  lines.push('');

  if (analysis.subprojects.length > 0) {
    lines.push('## Subprojects');
    for (const sub of analysis.subprojects) {
      lines.push(`### ${sub.name}`);
      lines.push(`- Build: ${sub.buildSystem}`);
      lines.push(`- Dependencies: ${sub.dependencies.length}`);
    }
    lines.push('');
  }

  if (analysis.uniqueDependencies.length > 0) {
    const known = analysis.uniqueDependencies.filter(d => d.isKnown);
    const unknown = analysis.uniqueDependencies.filter(d => !d.isKnown);

    if (known.length > 0) {
      lines.push('## Known Minecraft Dependencies');
      for (const dep of known) {
        lines.push(`- **${dep.knownName}** (${dep.versions.join(', ')}) - used in ${dep.usedIn.length} projects`);
      }
      lines.push('');
    }

    if (unknown.length > 0) {
      lines.push('## Other Dependencies');
      for (const dep of unknown.slice(0, 20)) {
        lines.push(`- ${dep.groupId}:${dep.artifactId} (${dep.versions.join(', ')})`);
      }
      if (unknown.length > 20) {
        lines.push(`... and ${unknown.length - 20} more`);
      }
      lines.push('');
    }
  }

  if (analysis.warnings.length > 0) {
    lines.push('## Warnings');
    for (const warning of analysis.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
    lines.push('');
  }

  if (analysis.recommendations.length > 0) {
    lines.push('## Recommendations');
    for (const rec of analysis.recommendations) {
      lines.push(`- 💡 ${rec}`);
    }
  }

  return lines.join('\n');
}

/**
 * MCP tool definition
 */
export const analyzePluginProjectToolDefinition = {
  name: 'analyze_plugin_project',
  description: 'Perform a comprehensive analysis of a Minecraft plugin project or workspace. Scans all subprojects, extracts dependencies, checks for updates, and provides recommendations.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_path: {
        type: 'string',
        description: 'Path to the project or workspace directory. Defaults to "C:\\Users\\tarno\\Desktop\\OkiMC-Plugins" if not provided.',
      },
      check_versions: {
        type: 'boolean',
        description: 'Whether to check for latest versions of dependencies (default: true)',
        default: true,
      },
    },
  },
};
