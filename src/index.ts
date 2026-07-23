#!/usr/bin/env node
/**
 * Minecraft Plugin Documentation MCP Server
 *
 * Serves LIVE developer API documentation for EdSeries Minecraft plugins,
 * fetched from the GitBook wiki on demand.
 *
 * v2.0.0: the hand-maintained dependency registry was removed. It drifted from
 * the real sources (it pinned SnLib 10 releases behind and documented APIs that
 * had already been deleted), and every fact in it is available first-hand from
 * SnLib/pom.xml, SnLib/docs/SNLIB-DOCS.md and the sn-core skill references.
 * Only the live GitBook lookup survives, because EdTools is published in no
 * Maven repository and has no local javadoc: the wiki is its only source.
 *
 * The server name stays 'minecraft-plugin-docs' so existing
 * mcp__minecraft-plugin-docs__* references keep resolving.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  getApiReference,
  getApiReferenceToolDefinition,
} from './tools/getApiReference.js';

const server = new Server(
  {
    name: 'minecraft-plugin-docs',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [getApiReferenceToolDefinition],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_api_reference') {
      const typedArgs = args as {
        query: string;
        ask?: string;
        goal?: string;
        list?: boolean;
      };

      const text = await getApiReference(typedArgs.query, {
        ask: typedArgs.ask,
        goal: typedArgs.goal,
        list: typedArgs.list,
      });

      return {
        content: [{ type: 'text', text }],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text:
            `Unknown tool: ${name}. This server exposes only 'get_api_reference' ` +
            `since v2.0.0. For Maven coordinates and SnLib API details, read the ` +
            `real sources: SnLib/pom.xml, SnLib/docs/SNLIB-DOCS.md and the ` +
            `sn-core skill references.`,
        },
      ],
      isError: true,
    };
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Minecraft Plugin Documentation MCP Server v2.0.0 running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
