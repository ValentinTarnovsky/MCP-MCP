#!/usr/bin/env node
/**
 * Minecraft Plugin Documentation MCP Server
 *
 * An MCP server that helps Minecraft Java plugin developers check the latest
 * documentation and versions of common dependencies.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import {
  getDependencyDocs,
  getDependencyDocsToolDefinition,
} from './tools/getDependencyDocs.js';
import {
  scanProjectDependencies,
  formatScanResult,
  scanProjectDependenciesToolDefinition,
} from './tools/scanProjectDependencies.js';
import {
  checkAllLatestVersions,
  checkProjectVersions,
  checkVersionsForDependencies,
  formatVersionReport,
  checkLatestVersionsToolDefinition,
} from './tools/checkLatestVersions.js';
import {
  analyzePluginProject,
  formatProjectAnalysis,
  analyzePluginProjectToolDefinition,
} from './tools/analyzePluginProject.js';
import { getDependencyKeys, DEPENDENCY_REGISTRY } from './registry/dependencies.js';

// Create server instance
const server = new Server(
  {
    name: 'minecraft-plugin-docs',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      getDependencyDocsToolDefinition,
      scanProjectDependenciesToolDefinition,
      checkLatestVersionsToolDefinition,
      analyzePluginProjectToolDefinition,
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_dependency_docs': {
        const dependency = (args as { dependency: string; fetch_version?: boolean }).dependency;
        const fetchVersion = (args as { dependency: string; fetch_version?: boolean }).fetch_version ?? true;
        const result = await getDependencyDocs(dependency, fetchVersion);

        if (!result.found) {
          return {
            content: [
              {
                type: 'text',
                text: `Dependency not found: ${dependency}\n\n` +
                      `Suggestions: ${result.suggestions?.join(', ') || 'none'}\n\n` +
                      `Available dependencies: ${getDependencyKeys().join(', ')}`,
              },
            ],
          };
        }

        const dep = result.dependency!;
        let text = `# ${dep.name}\n\n`;
        text += `${dep.description}\n\n`;
        text += `## Documentation\n`;
        if (dep.documentation.wiki) text += `- Wiki: ${dep.documentation.wiki}\n`;
        if (dep.documentation.javadocs) text += `- Javadocs: ${dep.documentation.javadocs}\n`;
        text += `- GitHub: ${dep.documentation.github}\n\n`;
        text += `## Maven Coordinates\n`;
        text += `- Group ID: ${dep.maven.groupId}\n`;
        text += `- Artifact ID: ${dep.maven.artifactId}\n`;
        text += `- Repository: ${dep.maven.repository}\n`;
        if (dep.maven.latestVersion) text += `- Latest Version: ${dep.maven.latestVersion}\n`;
        if (dep.maven.repositoryUrl) text += `- Repository URL: ${dep.maven.repositoryUrl}\n`;
        text += `\n## Quick Start\n\`\`\`\n${dep.quickStart}\n\`\`\``;

        return {
          content: [{ type: 'text', text }],
        };
      }

      case 'scan_project_dependencies': {
        const projectPath = (args as { project_path: string }).project_path;
        const result = await scanProjectDependencies(projectPath);
        const text = formatScanResult(result);

        return {
          content: [{ type: 'text', text }],
        };
      }

      case 'check_latest_versions': {
        const typedArgs = args as {
          project_path?: string;
          dependencies?: Array<{
            groupId: string;
            artifactId: string;
            currentVersion: string;
          }>;
          check_all?: boolean;
        };

        let report;

        if (typedArgs.project_path) {
          report = await checkProjectVersions(typedArgs.project_path);
        } else if (typedArgs.dependencies && typedArgs.dependencies.length > 0) {
          report = await checkVersionsForDependencies(typedArgs.dependencies);
        } else if (typedArgs.check_all) {
          report = await checkAllLatestVersions();
        } else {
          // Default to checking all known dependencies
          report = await checkAllLatestVersions();
        }

        const text = formatVersionReport(report);

        return {
          content: [{ type: 'text', text }],
        };
      }

      case 'analyze_plugin_project': {
        const typedArgs = args as {
          project_path?: string;
          check_versions?: boolean;
        };

        const analysis = await analyzePluginProject(
          typedArgs.project_path,
          typedArgs.check_versions ?? true
        );
        const text = formatProjectAnalysis(analysis);

        return {
          content: [{ type: 'text', text }],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource handlers for dependency documentation
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = Object.entries(DEPENDENCY_REGISTRY).map(([key, info]) => ({
    uri: `mc-deps://${key}`,
    name: info.name,
    description: info.description,
    mimeType: 'text/markdown',
  }));

  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^mc-deps:\/\/(.+)$/);

  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const depKey = match[1];
  const result = await getDependencyDocs(depKey);

  if (!result.found) {
    throw new Error(`Dependency not found: ${depKey}`);
  }

  const dep = result.dependency!;
  let text = `# ${dep.name}\n\n`;
  text += `${dep.description}\n\n`;
  text += `## Documentation\n`;
  if (dep.documentation.wiki) text += `- Wiki: ${dep.documentation.wiki}\n`;
  if (dep.documentation.javadocs) text += `- Javadocs: ${dep.documentation.javadocs}\n`;
  text += `- GitHub: ${dep.documentation.github}\n\n`;
  text += `## Maven Coordinates\n`;
  text += `\`\`\`\n${dep.quickStart}\n\`\`\``;

  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text,
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Minecraft Plugin Documentation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
