/**
 * Utility for fetching latest versions from various Maven repositories
 */

import { XMLParser } from 'fast-xml-parser';
import { versionCache } from './cache.js';
import { REPOSITORY_URLS, RepositoryType } from '../registry/dependencies.js';

export interface VersionInfo {
  latest: string;
  release?: string;
  versions: string[];
  lastUpdated?: string;
  source: string;
}

/**
 * Fetch latest version for a dependency from its repository
 */
export async function fetchLatestVersion(
  groupId: string,
  artifactId: string,
  repository: RepositoryType,
  customRepoUrl?: string
): Promise<VersionInfo | null> {
  const cacheKey = `${groupId}:${artifactId}:${repository}`;

  // Check cache first
  const cached = versionCache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as VersionInfo;
  }

  try {
    let result: VersionInfo | null = null;

    switch (repository) {
      case 'maven-central':
        result = await fetchFromMavenCentral(groupId, artifactId);
        break;
      case 'jitpack':
        result = await fetchFromJitPack(groupId, artifactId);
        break;
      case 'paper':
        result = await fetchFromPaper(groupId, artifactId);
        break;
      case 'custom':
        if (customRepoUrl) {
          result = await fetchFromCustomRepo(groupId, artifactId, customRepoUrl);
        }
        break;
      default:
        result = await fetchFromMavenMetadata(groupId, artifactId, REPOSITORY_URLS[repository]);
    }

    if (result) {
      versionCache.set(cacheKey, JSON.stringify(result));
    }

    return result;
  } catch (error) {
    console.error(`Failed to fetch version for ${groupId}:${artifactId}:`, error);
    return null;
  }
}

/**
 * Fetch from Maven Central using the search API
 */
async function fetchFromMavenCentral(groupId: string, artifactId: string): Promise<VersionInfo | null> {
  // First try the metadata XML
  const metadataResult = await fetchFromMavenMetadata(
    groupId,
    artifactId,
    REPOSITORY_URLS['maven-central']
  );

  if (metadataResult) {
    return metadataResult;
  }

  // Fallback to search API
  const searchUrl = `https://search.maven.org/solrsearch/select?q=g:${encodeURIComponent(groupId)}+AND+a:${encodeURIComponent(artifactId)}&rows=20&wt=json&core=gav`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) return null;

    const data = await response.json() as {
      response: {
        docs: Array<{ v: string; timestamp: number }>;
      };
    };

    const docs = data.response?.docs || [];
    if (docs.length === 0) return null;

    const versions = docs.map(d => d.v).sort(compareVersions).reverse();

    return {
      latest: versions[0],
      release: versions[0],
      versions: versions.slice(0, 10),
      source: 'maven-central',
    };
  } catch {
    return null;
  }
}

/**
 * Fetch from JitPack API
 */
async function fetchFromJitPack(groupId: string, artifactId: string): Promise<VersionInfo | null> {
  // JitPack uses github format: com.github.User:Repo
  // Convert to API format
  const repoPath = groupId.replace('com.github.', '').replace(/\./g, '/');
  const url = `https://jitpack.io/api/builds/${repoPath}/${artifactId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try alternative endpoint
      return await fetchJitPackReleases(groupId, artifactId);
    }

    const data = await response.json() as Record<string, { status: string }>;

    // JitPack returns build info, we need to extract successful versions
    const versions = Object.entries(data)
      .filter(([, info]) => info.status === 'ok')
      .map(([version]) => version)
      .sort(compareVersions)
      .reverse();

    if (versions.length === 0) return null;

    return {
      latest: versions[0],
      versions: versions.slice(0, 10),
      source: 'jitpack',
    };
  } catch {
    return await fetchJitPackReleases(groupId, artifactId);
  }
}

/**
 * Fetch JitPack releases from GitHub API
 */
async function fetchJitPackReleases(groupId: string, artifactId: string): Promise<VersionInfo | null> {
  // Extract github owner/repo from group/artifact
  const owner = groupId.replace('com.github.', '');
  const repo = artifactId;

  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'minecraft-plugin-docs-mcp',
      },
    });

    if (!response.ok) return null;

    const releases = await response.json() as Array<{ tag_name: string }>;
    const versions = releases
      .map(r => r.tag_name.replace(/^v/, ''))
      .sort(compareVersions)
      .reverse();

    if (versions.length === 0) return null;

    return {
      latest: versions[0],
      versions: versions.slice(0, 10),
      source: 'jitpack-github',
    };
  } catch {
    return null;
  }
}

/**
 * Fetch from Paper's Maven repository
 */
async function fetchFromPaper(groupId: string, artifactId: string): Promise<VersionInfo | null> {
  return fetchFromMavenMetadata(groupId, artifactId, REPOSITORY_URLS['paper']);
}

/**
 * Fetch from custom repository
 */
async function fetchFromCustomRepo(
  groupId: string,
  artifactId: string,
  repoUrl: string
): Promise<VersionInfo | null> {
  return fetchFromMavenMetadata(groupId, artifactId, repoUrl);
}

/**
 * Generic Maven metadata.xml fetch
 */
async function fetchFromMavenMetadata(
  groupId: string,
  artifactId: string,
  baseUrl: string
): Promise<VersionInfo | null> {
  const groupPath = groupId.replace(/\./g, '/');
  const metadataUrl = `${baseUrl}/${groupPath}/${artifactId}/maven-metadata.xml`;

  try {
    const response = await fetch(metadataUrl);
    if (!response.ok) return null;

    const xml = await response.text();
    const parser = new XMLParser();
    const parsed = parser.parse(xml);

    const metadata = parsed.metadata;
    if (!metadata) return null;

    const versioning = metadata.versioning || {};
    let versions: string[] = [];

    if (versioning.versions?.version) {
      versions = Array.isArray(versioning.versions.version)
        ? versioning.versions.version
        : [versioning.versions.version];
    }

    versions = versions.sort(compareVersions).reverse();

    return {
      latest: versioning.latest || versions[0] || '',
      release: versioning.release,
      versions: versions.slice(0, 10),
      lastUpdated: versioning.lastUpdated,
      source: baseUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Compare semantic versions
 */
export function compareVersions(a: string, b: string): number {
  // Extract version numbers, handling various formats
  const normalize = (v: string) => {
    // Remove common prefixes
    v = v.replace(/^[vV]/, '');
    // Handle SNAPSHOT, RC, etc.
    const parts = v.split(/[-_]/);
    const mainVersion = parts[0];
    const suffix = parts.slice(1).join('-');

    return { mainVersion, suffix };
  };

  const aNorm = normalize(a);
  const bNorm = normalize(b);

  const aParts = aNorm.mainVersion.split('.').map(p => parseInt(p, 10) || 0);
  const bParts = bNorm.mainVersion.split('.').map(p => parseInt(p, 10) || 0);

  // Compare main version numbers
  const maxLen = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxLen; i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }

  // If main versions equal, compare suffixes
  // SNAPSHOT < RC < (no suffix)
  const suffixOrder = (s: string) => {
    if (!s) return 100;
    if (s.includes('SNAPSHOT')) return 0;
    if (s.includes('alpha')) return 10;
    if (s.includes('beta')) return 20;
    if (s.includes('RC') || s.includes('rc')) return 30;
    if (s.includes('M') && /M\d/.test(s)) return 25; // Milestone
    return 50;
  };

  return suffixOrder(aNorm.suffix) - suffixOrder(bNorm.suffix);
}

/**
 * Check if a version is outdated compared to latest
 */
export function isOutdated(current: string, latest: string): boolean {
  return compareVersions(current, latest) < 0;
}

/**
 * Fetch versions for multiple dependencies in parallel
 */
export async function fetchMultipleVersions(
  dependencies: Array<{
    groupId: string;
    artifactId: string;
    repository: RepositoryType;
    repositoryUrl?: string;
    currentVersion?: string;
  }>
): Promise<Map<string, VersionInfo & { currentVersion?: string; outdated?: boolean }>> {
  const results = new Map<string, VersionInfo & { currentVersion?: string; outdated?: boolean }>();

  const promises = dependencies.map(async (dep) => {
    const key = `${dep.groupId}:${dep.artifactId}`;
    const info = await fetchLatestVersion(dep.groupId, dep.artifactId, dep.repository, dep.repositoryUrl);

    if (info) {
      const result = {
        ...info,
        currentVersion: dep.currentVersion,
        outdated: dep.currentVersion ? isOutdated(dep.currentVersion, info.latest) : undefined,
      };
      results.set(key, result);
    }
  });

  await Promise.allSettled(promises);
  return results;
}
