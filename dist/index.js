#!/usr/bin/env node
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const getApiReference_js_1 = require("./tools/getApiReference.js");
const server = new index_js_1.Server({
    name: 'minecraft-plugin-docs',
    version: '2.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [getApiReference_js_1.getApiReferenceToolDefinition],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === 'get_api_reference') {
            const typedArgs = args;
            const text = await (0, getApiReference_js_1.getApiReference)(typedArgs.query, {
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
                    text: `Unknown tool: ${name}. This server exposes only 'get_api_reference' ` +
                        `since v2.0.0. For Maven coordinates and SnLib API details, read the ` +
                        `real sources: SnLib/pom.xml, SnLib/docs/SNLIB-DOCS.md and the ` +
                        `sn-core skill references.`,
                },
            ],
            isError: true,
        };
    }
    catch (error) {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Minecraft Plugin Documentation MCP Server v2.0.0 running on stdio');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map