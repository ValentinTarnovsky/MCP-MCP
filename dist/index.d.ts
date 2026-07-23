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
export {};
//# sourceMappingURL=index.d.ts.map