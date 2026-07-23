"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiReferenceToolDefinition = exports.LLMS_INDEX_URL = void 0;
exports.parseIndex = parseIndex;
exports.getIndex = getIndex;
exports.rankPages = rankPages;
exports.getApiReference = getApiReference;
const cache_js_1 = require("../utils/cache.js");
/** Where the full documentation sitemap lives. */
exports.LLMS_INDEX_URL = 'https://edseries-plugins.gitbook.io/p/llms.txt';
/** Live docs are cached for 30 minutes to avoid hammering GitBook. */
const docsCache = new cache_js_1.Cache(30 * 60 * 1000);
/**
 * Fetch a URL as text, cached.
 */
async function fetchText(url) {
    return docsCache.getOrSet(url, async () => {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'minecraft-plugin-docs-mcp' },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} fetching ${url}`);
        }
        return response.text();
    });
}
/**
 * Parse the llms.txt index into a flat list of pages.
 * Lines look like:  - [Title](https://.../page.md): optional description
 */
function parseIndex(raw) {
    const pages = [];
    const lineRe = /^\s*-\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)(?::\s*(.*))?\s*$/gm;
    let match;
    while ((match = lineRe.exec(raw)) !== null) {
        pages.push({
            title: match[1].trim(),
            url: match[2].trim(),
            description: match[3]?.trim() || undefined,
        });
    }
    return pages;
}
/**
 * Get the parsed documentation index (cached via fetchText).
 */
async function getIndex() {
    const raw = await fetchText(exports.LLMS_INDEX_URL);
    return parseIndex(raw);
}
/**
 * Tokenize a query into lowercase alphanumeric words.
 */
function tokenize(query) {
    return query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
}
/**
 * Score a page against the query tokens. Higher = better match.
 */
function scorePage(page, tokens) {
    const title = page.title.toLowerCase();
    const url = page.url.toLowerCase();
    const desc = (page.description || '').toLowerCase();
    let score = 0;
    for (const token of tokens) {
        if (title.includes(token))
            score += 3;
        if (url.includes(token))
            score += 2;
        if (desc.includes(token))
            score += 1;
    }
    return score;
}
/**
 * Rank pages against a query (best first), dropping zero-score pages.
 */
function rankPages(pages, query) {
    const tokens = tokenize(query);
    if (tokens.length === 0)
        return [];
    return pages
        .map((page) => ({ page, score: scorePage(page, tokens) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.page);
}
/**
 * Strip GitBook boilerplate (leading index blockquote, trailing
 * "Agent Instructions" section) to keep the returned markdown clean.
 */
function cleanMarkdown(md) {
    let out = md;
    // Leading "> For the complete documentation index..." blockquote.
    out = out.replace(/^>\s*For the complete documentation index[\s\S]*?(?:\n\n|\r\n\r\n)/, '');
    // Trailing "# Agent Instructions" section (and any --- separator before it).
    const idx = out.indexOf('# Agent Instructions');
    if (idx > -1) {
        out = out.slice(0, idx).replace(/\n+-{3,}\s*$/, '');
    }
    return out.trim();
}
/**
 * Render the page index as a markdown list.
 */
function renderList(pages) {
    return pages
        .map((p) => `- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}`)
        .join('\n');
}
const MAX_BODY_CHARS = 20000;
/**
 * Main entry: resolve a query to live documentation.
 */
async function getApiReference(query, opts = {}) {
    if (!query || query.trim() === '') {
        return 'Please provide a query (e.g. "edtools events", "edtools boosters api").';
    }
    let pages;
    try {
        pages = await getIndex();
    }
    catch (error) {
        return `Could not load the documentation index from ${exports.LLMS_INDEX_URL}: ${error}`;
    }
    const ranked = rankPages(pages, query);
    // Explicit listing mode, or nothing matched: return the relevant page index.
    if (opts.list || ranked.length === 0) {
        const shown = ranked.length > 0 ? ranked : pages;
        const heading = ranked.length === 0
            ? `No page strongly matched "${query}". Available documentation pages:`
            : `Documentation pages matching "${query}":`;
        return `${heading}\n\n${renderList(shown.slice(0, 60))}`;
    }
    const best = ranked[0];
    const related = ranked.slice(1, 6);
    // Natural-language Q&A mode via GitBook's ?ask= endpoint.
    if (opts.ask && opts.ask.trim() !== '') {
        const params = new URLSearchParams({ ask: opts.ask });
        if (opts.goal && opts.goal.trim() !== '')
            params.set('goal', opts.goal);
        const askUrl = `${best.url}?${params.toString()}`;
        try {
            const answer = await fetchText(askUrl);
            return `# Q&A on: ${best.title}\nSource: ${best.url}\n\n${cleanMarkdown(answer)}`;
        }
        catch (error) {
            return `Could not query "${best.title}" (${askUrl}): ${error}`;
        }
    }
    // Default: return the full raw markdown of the best-matching page.
    try {
        let body = cleanMarkdown(await fetchText(best.url));
        if (body.length > MAX_BODY_CHARS) {
            body = `${body.slice(0, MAX_BODY_CHARS)}\n\n... [truncated; open ${best.url} for the rest]`;
        }
        let out = `# ${best.title}\nSource: ${best.url}\n\n${body}`;
        if (related.length > 0) {
            out += `\n\n---\n\n## Related pages\n${renderList(related)}`;
        }
        return out;
    }
    catch (error) {
        return `Could not fetch "${best.title}" (${best.url}): ${error}`;
    }
}
/**
 * MCP tool definition.
 */
exports.getApiReferenceToolDefinition = {
    name: 'get_api_reference',
    description: "Fetch LIVE, up-to-date developer API documentation for EdSeries Minecraft plugins (EdTools, EdPrison, EdDungeons, PinnaPrison, EdPerks) straight from the GitBook wiki. Returns the full raw markdown of the best-matching page - including every event class, method signature with all parameters and return types, and code examples. Use this for ANY question about a plugin API: events, a specific sub-API (boosters, zones, currency, enchants, sell, leveling, guis, lucky blocks, omnitool, backpacks), a class, or a method. Prefer this over get_dependency_docs when you need actual API details rather than Maven coordinates.",
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'What you want docs for, e.g. "edtools events", "edtools boosters api", "edtools currency api", "apienchant class". Include the plugin name for best matching.',
            },
            ask: {
                type: 'string',
                description: "Optional natural-language question. If set, the best-matching page is queried via GitBook's dynamic Q&A (?ask=) and a direct answer with sources is returned instead of the raw page body.",
            },
            goal: {
                type: 'string',
                description: 'Optional broader goal that tailors the ?ask= answer. Only used together with "ask".',
            },
            list: {
                type: 'boolean',
                description: 'If true, return the index of documentation pages matching the query instead of a single page body. Default false.',
            },
        },
        required: ['query'],
    },
};
//# sourceMappingURL=getApiReference.js.map