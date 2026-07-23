/**
 * Tool: get_api_reference
 *
 * Fetches LIVE developer API documentation for the EdSeries Minecraft plugins
 * (EdTools, EdPrison, EdDungeons, PinnaPrison, EdPerks) straight from the GitBook
 * wiki, instead of relying on a hand-maintained static snapshot.
 *
 * GitBook exposes everything machine-readable:
 *   - A global index at  https://edseries-plugins.gitbook.io/p/llms.txt
 *   - A clean raw markdown version of every page by appending `.md` to its URL
 *   - Per-page natural-language Q&A via the `?ask=<question>&goal=<goal>` params
 *
 * This means the MCP always returns up-to-date data: every event class, every
 * method signature with all its parameters and return types, and code examples,
 * with zero manual maintenance.
 */
/** Where the full documentation sitemap lives. */
export declare const LLMS_INDEX_URL = "https://edseries-plugins.gitbook.io/p/llms.txt";
export interface DocPage {
    title: string;
    url: string;
    description?: string;
}
export interface ApiReferenceOptions {
    /** Natural-language question; routes through GitBook's `?ask=` Q&A. */
    ask?: string;
    /** Optional broader goal that tailors the `?ask=` answer. */
    goal?: string;
    /** Return the matching page index instead of a single page body. */
    list?: boolean;
}
/**
 * Parse the llms.txt index into a flat list of pages.
 * Lines look like:  - [Title](https://.../page.md): optional description
 */
export declare function parseIndex(raw: string): DocPage[];
/**
 * Get the parsed documentation index (cached via fetchText).
 */
export declare function getIndex(): Promise<DocPage[]>;
/**
 * Rank pages against a query (best first), dropping zero-score pages.
 */
export declare function rankPages(pages: DocPage[], query: string): DocPage[];
/**
 * Main entry: resolve a query to live documentation.
 */
export declare function getApiReference(query: string, opts?: ApiReferenceOptions): Promise<string>;
/**
 * MCP tool definition.
 */
export declare const getApiReferenceToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            ask: {
                type: string;
                description: string;
            };
            goal: {
                type: string;
                description: string;
            };
            list: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=getApiReference.d.ts.map