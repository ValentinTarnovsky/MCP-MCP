/**
 * Tool: check_latest_versions
 * Checks for latest versions of dependencies and provides upgrade recommendations
 */

import {
  DEPENDENCY_REGISTRY,
  getAllDependencies,
  findDependency,
  DependencyInfo,
} from '../registry/dependencies.js';
import {
  fetchLatestVersion,
  fetchMultipleVersions,
  isOutdated,
  compareVersions,
  VersionInfo,
} from '../utils/versionFetcher.js';
import { scanProjectDependencies, ProjectDependency } from './scanProjectDependencies.js';

export interface VersionCheckResult {
  dependency: string;
  groupId: string;
  artifactId: string;
  currentVersion?: string;
  latestVersion?: string;
  isOutdated: boolean;
  updateAvailable: boolean;
  source: string;
  documentation?: {
    wiki?: string;
    javadocs?: string;
    github: string;
  };
  error?: string;
}

export interface VersionCheckReport {
  timestamp: string;
  totalChecked: number;
  outdatedCount: number;
  upToDateCount: number;
  errorCount: number;
  results: VersionCheckResult[];
  recommendations: string[];
}

/**
 * Check latest versions for all known Minecraft plugin dependencies
 */
export async function checkAllLatestVersions(): Promise<VersionCheckReport> {
  const results: VersionCheckResult[] = [];
  const dependencies = getAllDependencies();

  const promises = dependencies.map(async (info): Promise<VersionCheckResult> => {
    try {
      const versionInfo = await fetchLatestVersion(
        info.maven.groupId,
        info.maven.artifactId,
        info.maven.repository,
        info.maven.repositoryUrl
      );

      return {
        dependency: info.name,
        groupId: info.maven.groupId,
        artifactId: info.maven.artifactId,
        latestVersion: versionInfo?.latest,
        isOutdated: false,
        updateAvailable: false,
        source: versionInfo?.source || info.maven.repository,
        documentation: info.documentation,
      };
    } catch (error) {
      return {
        dependency: info.name,
        groupId: info.maven.groupId,
        artifactId: info.maven.artifactId,
        isOutdated: false,
        updateAvailable: false,
        source: info.maven.repository,
        error: `Failed to fetch: ${error}`,
      };
    }
  });

  const allResults = await Promise.allSettled(promises);

  for (const result of allResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    }
  }

  return generateReport(results);
}

/**
 * Check versions for specific dependencies with current versions
 */
export async function checkVersionsForDependencies(
  dependencies: Array<{
    name?: string;
    groupId: string;
    artifactId: string;
    currentVersion: string;
  }>
): Promise<VersionCheckReport> {
  const results: VersionCheckResult[] = [];

  for (const dep of dependencies) {
    // Try to find in registry
    const info = findDependency(`${dep.groupId}:${dep.artifactId}`) ||
                 findDependency(dep.name || '');

    try {
      let versionInfo: VersionInfo | null = null;

      if (info) {
        versionInfo = await fetchLatestVersion(
          info.maven.groupId,
          info.maven.artifactId,
          info.maven.repository,
          info.maven.repositoryUrl
        );
      } else {
        // Try Maven Central for unknown dependencies
        versionInfo = await fetchLatestVersion(
          dep.groupId,
          dep.artifactId,
          'maven-central'
        );
      }

      const outdated = versionInfo?.latest
        ? isOutdated(dep.currentVersion, versionInfo.latest)
        : false;

      results.push({
        dependency: info?.name || `${dep.groupId}:${dep.artifactId}`,
        groupId: dep.groupId,
        artifactId: dep.artifactId,
        currentVersion: dep.currentVersion,
        latestVersion: versionInfo?.latest,
        isOutdated: outdated,
        updateAvailable: outdated,
        source: versionInfo?.source || 'unknown',
        documentation: info?.documentation,
      });
    } catch (error) {
      results.push({
        dependency: info?.name || `${dep.groupId}:${dep.artifactId}`,
        groupId: dep.groupId,
        artifactId: dep.artifactId,
        currentVersion: dep.currentVersion,
        isOutdated: false,
        updateAvailable: false,
        source: 'error',
        error: `${error}`,
      });
    }
  }

  return generateReport(results);
}

/**
 * Check versions for dependencies in a project
 */
export async function checkProjectVersions(projectPath: string): Promise<VersionCheckReport> {
  const scanResult = await scanProjectDependencies(projectPath);

  const depsToCheck = scanResult.dependencies.map(dep => ({
    name: dep.knownDependency?.name,
    groupId: dep.groupId,
    artifactId: dep.artifactId,
    currentVersion: dep.version,
  }));

  return checkVersionsForDependencies(depsToCheck);
}

/**
 * Generate version check report
 */
function generateReport(results: VersionCheckResult[]): VersionCheckReport {
  const outdated = results.filter(r => r.isOutdated && !r.error);
  const upToDate = results.filter(r => !r.isOutdated && !r.error);
  const errors = results.filter(r => r.error);

  const recommendations: string[] = [];

  if (outdated.length > 0) {
    recommendations.push(`${outdated.length} dependencies have updates available.`);

    // Add specific recommendations for critical updates
    for (const dep of outdated) {
      if (dep.dependency.toLowerCase().includes('paper') ||
          dep.dependency.toLowerCase().includes('spigot')) {
        recommendations.push(
          `⚠️ Consider updating ${dep.dependency} from ${dep.currentVersion} to ${dep.latestVersion} ` +
          `for latest Minecraft version support.`
        );
      }
    }
  }

  if (outdated.length === 0 && errors.length === 0) {
    recommendations.push('All dependencies are up to date!');
  }

  return {
    timestamp: new Date().toISOString(),
    totalChecked: results.length,
    outdatedCount: outdated.length,
    upToDateCount: upToDate.length,
    errorCount: errors.length,
    results,
    recommendations,
  };
}

/**
 * Format version check report as text
 */
export function formatVersionReport(report: VersionCheckReport): string {
  const lines: string[] = [];

  lines.push('# Dependency Version Check Report');
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push(`**Total Checked:** ${report.totalChecked}`);
  lines.push(`**Up to Date:** ${report.upToDateCount}`);
  lines.push(`**Updates Available:** ${report.outdatedCount}`);
  if (report.errorCount > 0) {
    lines.push(`**Errors:** ${report.errorCount}`);
  }
  lines.push('');

  if (report.outdatedCount > 0) {
    lines.push('## Updates Available');
    for (const result of report.results.filter(r => r.isOutdated)) {
      lines.push(`- **${result.dependency}**: ${result.currentVersion} → ${result.latestVersion}`);
      if (result.documentation?.github) {
        lines.push(`  Changelog: ${result.documentation.github}/releases`);
      }
    }
    lines.push('');
  }

  if (report.upToDateCount > 0) {
    lines.push('## Up to Date');
    for (const result of report.results.filter(r => !r.isOutdated && !r.error)) {
      lines.push(`- ${result.dependency}: ${result.currentVersion || result.latestVersion || 'unknown'}`);
    }
    lines.push('');
  }

  if (report.errorCount > 0) {
    lines.push('## Errors');
    for (const result of report.results.filter(r => r.error)) {
      lines.push(`- ${result.dependency}: ${result.error}`);
    }
    lines.push('');
  }

  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join('\n');
}

/**
 * MCP tool definition
 */
export const checkLatestVersionsToolDefinition = {
  name: 'check_latest_versions',
  description: 'Check for the latest versions of Minecraft plugin dependencies. Can check all known dependencies or compare against project\'s current versions.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_path: {
        type: 'string',
        description: 'Optional path to a project directory. If provided, will scan the project and check versions against current dependencies.',
      },
      dependencies: {
        type: 'array',
        description: 'Optional list of specific dependencies to check with their current versions.',
        items: {
          type: 'object',
          properties: {
            groupId: { type: 'string' },
            artifactId: { type: 'string' },
            currentVersion: { type: 'string' },
          },
          required: ['groupId', 'artifactId', 'currentVersion'],
        },
      },
      check_all: {
        type: 'boolean',
        description: 'If true, checks latest versions for all known Minecraft plugin dependencies (default: false)',
        default: false,
      },
    },
  },
};
