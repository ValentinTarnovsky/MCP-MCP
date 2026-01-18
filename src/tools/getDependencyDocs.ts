/**
 * Tool: get_dependency_docs
 * Fetches documentation URLs and version info for Minecraft plugin dependencies
 */

import {
  DEPENDENCY_REGISTRY,
  findDependency,
  getAllDependencies,
  DependencyInfo,
} from '../registry/dependencies.js';
import { fetchLatestVersion } from '../utils/versionFetcher.js';

export interface DependencyDocsResult {
  found: boolean;
  dependency?: {
    name: string;
    description: string;
    documentation: {
      wiki?: string;
      javadocs?: string;
      github: string;
      downloadUrl?: string;
    };
    maven: {
      groupId: string;
      artifactId: string;
      repository: string;
      repositoryUrl?: string;
      latestVersion?: string;
    };
    quickStart?: string;
    apiReference?: {
      mainClass: string;
      importPackage: string;
      subApis?: Array<{
        name: string;
        getter: string;
        description: string;
        methods?: string[];
      }>;
    };
  };
  suggestions?: string[];
  error?: string;
}

/**
 * Get documentation for a specific dependency
 */
export async function getDependencyDocs(
  dependencyName: string,
  fetchVersion: boolean = true
): Promise<DependencyDocsResult> {
  if (!dependencyName || dependencyName.trim() === '') {
    return {
      found: false,
      error: 'Please provide a dependency name',
      suggestions: Object.keys(DEPENDENCY_REGISTRY),
    };
  }

  const info = findDependency(dependencyName);

  if (!info) {
    // Find similar dependencies for suggestions
    const suggestions = findSimilarDependencies(dependencyName);
    return {
      found: false,
      error: `Dependency "${dependencyName}" not found in registry`,
      suggestions,
    };
  }

  let latestVersion: string | undefined;

  if (fetchVersion) {
    try {
      const versionInfo = await fetchLatestVersion(
        info.maven.groupId,
        info.maven.artifactId,
        info.maven.repository,
        info.maven.repositoryUrl
      );
      latestVersion = versionInfo?.latest;
    } catch {
      // Continue without version info
    }
  }

  return {
    found: true,
    dependency: {
      name: info.name,
      description: info.description,
      documentation: info.documentation,
      maven: {
        groupId: info.maven.groupId,
        artifactId: info.maven.artifactId,
        repository: info.maven.repository,
        repositoryUrl: info.maven.repositoryUrl,
        latestVersion,
      },
      quickStart: generateQuickStart(info, latestVersion),
      apiReference: info.apiReference,
    },
  };
}

/**
 * Get all available dependencies
 */
export function listAllDependencies(): DependencyInfo[] {
  return getAllDependencies();
}

/**
 * Find similar dependencies for suggestions
 */
function findSimilarDependencies(query: string): string[] {
  const normalizedQuery = query.toLowerCase();
  const suggestions: Array<{ key: string; score: number }> = [];

  for (const [key, info] of Object.entries(DEPENDENCY_REGISTRY)) {
    let score = 0;

    // Check name similarity
    if (info.name.toLowerCase().includes(normalizedQuery)) {
      score += 10;
    }

    // Check key similarity
    if (key.includes(normalizedQuery)) {
      score += 8;
    }

    // Check aliases
    for (const alias of info.aliases) {
      if (alias.toLowerCase().includes(normalizedQuery)) {
        score += 5;
        break;
      }
    }

    // Check description
    if (info.description.toLowerCase().includes(normalizedQuery)) {
      score += 2;
    }

    if (score > 0) {
      suggestions.push({ key, score });
    }
  }

  // Sort by score and return top 5
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.key);
}

/**
 * Generate quick start code snippet
 */
function generateQuickStart(info: DependencyInfo, version?: string): string {
  const v = version || 'LATEST';

  // Para JARs manuales (sin repositorio Maven)
  if (info.maven.repository === 'manual') {
    const jarFileName = `${info.maven.artifactId}.jar`;

    const maven = `<!-- Maven (JAR local) -->
<!-- 1. Descarga el JAR desde: ${info.documentation.downloadUrl || info.documentation.wiki} -->
<!-- 2. Coloca ${jarFileName} en la raíz de tu proyecto -->
<dependency>
    <groupId>${info.maven.groupId}</groupId>
    <artifactId>${info.maven.artifactId}</artifactId>
    <version>${v}</version>
    <scope>system</scope>
    <systemPath>\${project.basedir}/${jarFileName}</systemPath>
</dependency>`;

    const gradle = `// Gradle (JAR local)
// 1. Descarga el JAR desde: ${info.documentation.downloadUrl || info.documentation.wiki}
// 2. Coloca ${jarFileName} en libs/ de tu proyecto
dependencies {
    compileOnly(files("libs/${jarFileName}"))
}`;

    const pluginYml = `# plugin.yml - Agregar dependencia
depend: [EdTools]`;

    let apiUsage = '';
    if (info.apiReference) {
      apiUsage = `\n\n// Uso de la API
import ${info.apiReference.importPackage}.${info.apiReference.mainClass};

${info.apiReference.mainClass} api = ${info.apiReference.mainClass}.getInstance();`;

      if (info.apiReference.subApis && info.apiReference.subApis.length > 0) {
        apiUsage += '\n\n// Sub-APIs disponibles:';
        for (const subApi of info.apiReference.subApis) {
          apiUsage += `\n// - api.${subApi.getter} -> ${subApi.description}`;
        }
      }
    }

    return `${maven}\n\n${gradle}\n\n${pluginYml}${apiUsage}`;
  }

  // Para dependencias normales con Maven
  const gradle = `// Gradle (Kotlin DSL)
dependencies {
    compileOnly("${info.maven.groupId}:${info.maven.artifactId}:${v}")
}`;

  const groovy = `// Gradle (Groovy)
dependencies {
    compileOnly '${info.maven.groupId}:${info.maven.artifactId}:${v}'
}`;

  const maven = `<!-- Maven -->
<dependency>
    <groupId>${info.maven.groupId}</groupId>
    <artifactId>${info.maven.artifactId}</artifactId>
    <version>${v}</version>
    <scope>provided</scope>
</dependency>`;

  let repoNote = '';
  if (info.maven.repositoryUrl) {
    repoNote = `\n\n// Repository: ${info.maven.repositoryUrl}`;
  } else if (info.maven.repository !== 'maven-central') {
    repoNote = `\n\n// Repository: ${info.maven.repository}`;
  }

  return `${gradle}\n\n${groovy}\n\n${maven}${repoNote}`;
}

/**
 * MCP tool definition
 */
export const getDependencyDocsToolDefinition = {
  name: 'get_dependency_docs',
  description: 'Get documentation URLs, Maven coordinates, and latest version for a Minecraft plugin dependency. Returns wiki, javadocs, GitHub links, and quick-start code snippets.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      dependency: {
        type: 'string',
        description: 'Name of the dependency (e.g., "paper-api", "luckperms", "vault", "hikaricp")',
      },
      fetch_version: {
        type: 'boolean',
        description: 'Whether to fetch the latest version (default: true)',
        default: true,
      },
    },
    required: ['dependency'],
  },
};
