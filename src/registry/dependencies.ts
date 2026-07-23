/**
 * Registry of known Minecraft plugin dependencies with their documentation sources,
 * Maven coordinates, and repository information.
 */

export interface DependencyInfo {
  name: string;
  description: string;
  documentation: {
    wiki?: string;
    javadocs?: string;
    github: string;
    downloadUrl?: string; // For manual JARs
  };
  maven: {
    groupId: string;
    artifactId: string;
    repository: RepositoryType;
    repositoryUrl?: string;
    /** Pinned/known version for deps not resolvable from a public repo (local/manual). */
    version?: string;
  };
  aliases: string[];
  /**
   * If set, the tool output appends this note recommending SnLib as the preferred
   * way to cover what this dependency does (SnLib bundles the equivalent module).
   */
  recommendation?: string;
  /** API reference for plugins with multiple sub-APIs */
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
}

export type RepositoryType = 'maven-central' | 'jitpack' | 'paper' | 'spigot' | 'codemc' | 'custom' | 'manual' | 'local';

export const REPOSITORY_URLS: Record<RepositoryType, string> = {
  'maven-central': 'https://repo1.maven.org/maven2',
  'jitpack': 'https://jitpack.io',
  'paper': 'https://repo.papermc.io/repository/maven-public',
  'spigot': 'https://hub.spigotmc.org/nexus/content/repositories/snapshots',
  'codemc': 'https://repo.codemc.io/repository/maven-public',
  'custom': '',
  'manual': '', // Manually downloaded JAR, use systemPath in Maven
  'local': '', // Local .m2 repo (mvn install), not resolvable from a public repo
};

export const DEPENDENCY_REGISTRY: Record<string, DependencyInfo> = {
  'snlib': {
    name: 'SnLib',
    description:
      'Common library of the Sn plugins, packaged as a STANDALONE PLUGIN. A single `SnLib.jar` ' +
      'in `plugins/` provides managed yml, menus, items, commands, database, PAPI, lang, ' +
      'scheduler (Folia-aware), holograms, bossbars, cron, leaderboards, economy, cooldowns, ' +
      'cuboid selections and utilities to every consumer, with a single development style and ' +
      'zero repeated dependencies. Hard-depend model: each plugin declares `depend: [SnLib]` and ' +
      'compiles against `com.sn:snlib` in `provided` scope (nothing is shaded in the consumer). ' +
      'Runtime floor 1.20.4, target 1.21.8, Java 21 required, zero NMS/packets (Paper + Adventure).',
    documentation: {
      wiki: 'https://github.com/ValentinTarnovsky/SnLib/blob/main/README.md',
      github: 'https://github.com/ValentinTarnovsky/SnLib',
    },
    maven: {
      groupId: 'com.sn',
      artifactId: 'snlib',
      repository: 'local',
      version: '1.3.0',
    },
    aliases: ['sn-lib', 'com.sn:snlib', 'sn'],
    apiReference: {
      mainClass: 'SnPlugin',
      importPackage: 'com.sn.lib',
      subApis: [
        {
          name: 'yml',
          getter: 'sn.yml()',
          description:
            'YmlManager/SnYml: YML reading with auto-corrected tabs (1 warn), typed getters with ' +
            'default + WARN (never a stacktrace), local placeholders + PAPI per getter and structural ' +
            'auto-merge of configs on every startup (no config-version, preserves values/comments).',
          methods: [
            'config() -> SnYml',
            'managed(String name) -> SnYml   // merge-always against the jar',
            'seedOnly(String name) -> SnYml   // copied only if missing',
            'data(String name) -> SnYml   // data: never merged',
            'managedPruning(String path)   // opt-in: removes keys absent from the resource',
            'SnYml.getInt/getString(key, default[, viewer]); onReload(cb); set(k,v); save()',
          ],
        },
        {
          name: 'guis',
          getter: 'sn.guis()',
          description:
            'GuiManager: one GUI per file in `guis/` (golden spec docs/menu-example.yml, any field ' +
            'of the spec ALREADY works without code). One GuiSession + Inventory PER VIEWER, real ' +
            'per-player pagination, ASCII layout, click matrix per button, 7-vector NBT anti-theft. ' +
            'Replaces mc-MenuAPI.',
          methods: [
            'get(String id) -> Gui',
            'registerAction(String tag, handler)   // [custom] action',
            'Gui.open(Player); Gui.session(Player) -> GuiSession',
            'GuiSession.bind(slot, template, Ph...); bindPaged(templateId, data, slots, binder)',
            'GuiSession.setTotalPages(int)',
          ],
        },
        {
          name: 'items',
          getter: 'sn.items()',
          description:
            'ItemRegistry/ItemDef/SnItem: physical items from YML (docs/item-example.yml) or 100% ' +
            'programmatic. NBT/PDC, `locked` anti-theft (7 vectors, restore on quit/shutdown), ' +
            '12 interact-action variants, custom durability, recipes, held-effects, skull-owner and ' +
            'attributes. Replaces Item-NBT-API (persistent tags via `TagIo`, no NMS).',
          methods: [
            'register(String id, ItemDef def)',
            'give(Player, String id, int amount)',
            'damage(Player, ItemStack, int amount)',
            'ItemDef.builder().item(SnItem).locked().noDrop().obtainVia(...).onRightClick(...).build()',
            'SnItem.builder(Material).name(...).glow().skullOwner(...).attribute(...).damage(int) (constructor is private, builder is the only entry)',
          ],
        },
        {
          name: 'db',
          getter: 'sn.db()',
          description:
            'SnDb: SQLite (pool=1 + WAL + busy_timeout) or MySQL (Hikari pool), drivers shaded ' +
            'without relocation (a single copy on the server). Async queries, `thenSync` with an ' +
            'isEnabled guard, `PlayerDataCache`. Replaces adding HikariCP separately.',
          methods: [
            'bootstrap(Schema...).orDisablePlugin()',
            'query(sql, prep, mapper).thenSync(result -> ...)',
            'update(sql, prep)   // never on the main thread',
            'playerCache(loader, saver) -> PlayerDataCache<T>',
          ],
        },
        {
          name: 'papi',
          getter: 'sn.papi()',
          description:
            'SnPapi: if PlaceholderAPI is absent it returns the text UNTOUCHED (isolated hook, no ' +
            'NoClassDefFoundError). Declarative expansions with persist. Replaces the manual hook to ' +
            'PlaceholderAPI (which is still the runtime plugin).',
          methods: [
            'apply(viewer, text) -> String',
            'applyOnMain(viewer, text) -> SnFuture<String>   // hop to main from async, fail-open',
            'expansion(String id).resolver((player, params) -> ...).register()',
          ],
        },
        {
          name: 'economy',
          getter: 'sn.economy()',
          description:
            'EconomyBridge: uses Vault when present; otherwise a configurable command-based ' +
            'backend. All async-safe. Replaces coupling to the Vault API directly.',
          methods: [
            'getBalance(player) ; give(player, amount) ; tryTake(player, amount)',
            'useCommandBackend(give, take, balancePlaceholder)',
          ],
        },
        {
          name: 'holograms',
          getter: 'sn.holograms()',
          description:
            'HologramUtil: holograms with real TextDisplay entities (zero NMS), per-player ' +
            'visibility, optional PAPI refresh, orphans purged on chunk-load/startup via PDC. ' +
            'Replaces DecentHolograms or another external hologram plugin.',
          methods: [
            'spawn(String id, Location loc, List<String> lines)',
            'setLines(String id, List<String> lines)',
            'per-player visibility + PAPI refresh',
          ],
        },
        {
          name: 'lang',
          getter: 'sn.lang()',
          description:
            'SnLang: `lang/messages_<code>.yml` with merge-always and per-key fallback to `en`. ' +
            'Sent through the SnText pipeline (MiniMessage + [small] + [rgb] + [center]). ' +
            'Persistent actionbar.',
          methods: [
            'send(player, key, Ph...); broadcast(key, Ph...)',
            'actionbar(player, key, Duration, Ph...); title(player, key, Ph...)',
            'get(key) / getList(key) -> Component',
          ],
        },
        {
          name: 'commands',
          getter: 'sn.commands()',
          description:
            'SnCommands: root/sub tree, fully tab-completable and GATED by permission (a sub ' +
            'without permission is invisible in tab and help). Reload-safe registration per ' +
            'Plugin owner.',
          methods: [
            'root(name).permission(p).sub(name).permission(p).arg(name, Args.x()).executes(ctx).and().register()',
            'Args.onlinePlayer() / Args.intRange(min, max)',
          ],
        },
        {
          name: 'actions',
          getter: 'sn.actions()',
          description:
            'ActionEngine + RequirementEngine: `[tag] arg` lines in YML ([player], [console], ' +
            '[message], [sound], [close], [open], [connect], [title], [particle], page nav...), ' +
            'click guards and requirements with `%placeholder% > 0 && ...` (recursive descent with parentheses).',
          methods: [
            'register(String tag, handler)   // custom tag',
            'requirements via YML: view/click/interact-requirements + deny-actions',
          ],
        },
        {
          name: 'cooldowns',
          getter: 'sn.cooldowns()',
          description: 'Cooldowns: no boxing; unexpired entries survive relogs by design; session categories.',
          methods: [
            'tryUse(UUID, String key, Duration) -> boolean',
            'registerSessionCategory(String)',
          ],
        },
        {
          name: 'scheduler',
          getter: 'sn.scheduler()',
          description: 'SnScheduler Folia-aware: sync/async, later, timers, supplyAsync/thenSync with an isEnabled guard.',
          methods: [
            'sync/async(Runnable); syncLater/asyncLater(Runnable, ticks)',
            'timer/timerAsync(Runnable, delay, period) -> TaskHandle',
            'supplyAsync(Supplier) -> CompletableFuture; thenSync(future, consumer) takes the future as argument (not fluent; only SnDb SnFuture chains .thenSync)',
          ],
        },
        {
          name: 'bossbars',
          getter: 'sn.bossbars()',
          description: 'BossBarUtil: pure Adventure (zero packets), auto-hide on quit/teardown.',
          methods: [
            'create(String id).text(...).progress(float).build()',
            'show/hide/setText/setProgress/timer',
          ],
        },
        {
          name: 'cron',
          getter: 'sn.cron()',
          description: 'SnCron: 5-field cron subset + shortcuts (daily 04:00 / hourly :30), DST-safe, persistable catchUp.',
          methods: [
            'schedule(String id, String expr, Runnable task)',
          ],
        },
        {
          name: 'leaderboards',
          getter: 'sn.leaderboards()',
          description: 'LeaderboardCache: immutable snapshot with atomic swap, lock-free reads, opt-in placeholders.',
          methods: [
            'register(String id, Duration refresh, query)',
            'getTop / positionOf / valueOf',
          ],
        },
        {
          name: 'discord',
          getter: 'sn.discord()',
          description: 'DiscordWebhook: async POST with the JDK HttpClient, FIFO queue honoring Retry-After, best-effort drain on teardown.',
          methods: [
            'message(url).content("...").embed(...).send()',
          ],
        },
        {
          name: 'updates',
          getter: 'sn.updates()',
          description:
            'UpdateChecker (notify-only): points at the CONSUMER GitHub repo and warns if there is ' +
            'a newer release. NEVER downloads or auto-swaps. Supports private repos via a token in config.',
          methods: [
            'checkNow("owner/repo")   // or SnSpec.builder().updates("owner/repo")',
          ],
        },
        {
          name: 'selections',
          getter: 'sn.selections()',
          description:
            'SelectionManager (region module): visual cuboid selections for any consumer (100% ' +
            'programmatic, no spec gate). Immutable thread-safe `Cuboid`. Emits ' +
            'SnSelectionCompleteEvent (cancelable).',
          methods: [
            'giveWand(Player, SelectionSpec)   // or createWand(spec)',
            'SelectionSpec.builder(id).permission(p).onSelect(cuboid -> ...).build()',
          ],
        },
        {
          name: 'debug',
          getter: 'sn.debug()',
          description:
            'SnDebug: runtime toggle (/command debug with debugCommand()), levels OFF<INFO<DEBUG<TRACE, ' +
            'lazy Supplier to avoid building expensive strings when debug is off.',
          methods: [
            'log(() -> "state=" + expensive())',
            'info(...) ; trace(...) ; tracing()',
          ],
        },
        {
          name: 'reload',
          getter: 'sn.reload()',
          description: 'ReloadManager of the owning plugin: rebuilds the declared modules in strict order and re-fires the reloadables.',
          methods: [
            'register(reloadable)',
          ],
        },
        {
          name: 'velocity base (Snv)',
          getter: 'Snv.create(plugin, proxy, logger, dataDir)   // com.sn.lib.velocity',
          description:
            'The SAME SnLib.jar is ALSO a Velocity plugin (`velocity-plugin.json`, entry ' +
            '`SnLibVelocity`). On Velocity it is a small homogeneity base - config, text, scheduler ' +
            'and commands - NOT a cross-server messaging framework (SnLib has no bridge). A consumer ' +
            'proxy plugin declares `{"id": "snlib"}` in its velocity-plugin.json and builds an `Snv` ' +
            'context (the small counterpart of `Sn`). `snv.color(...)` uses the SAME `SnText` pipeline ' +
            'as Paper, so `&` / `[rgb]` / MiniMessage render identically on both platforms.',
          methods: [
            'Snv.create(Object plugin, ProxyServer proxy, Logger logger, Path dataDir) -> Snv   // loads + merges config.yml',
            'snv.config() -> SnvConfig: getString/getInt/getLong/getDouble/getBoolean(path, def), getStringList(path), getSection(path), contains(path), keys()',
            'snv.reloadConfig()   // re-reads config.yml, re-merging the bundled defaults',
            'snv.color(String) -> net.kyori.adventure.text.Component   // shared SnText pipeline (&, [rgb], [small], [center], MiniMessage)',
            'snv.command(String name, com.velocitypowered.api.command.Command cmd, String... aliases)',
            'snv.scheduler() -> SnvScheduler: run(task), later(task, delay), repeat(task[, delay], interval) -> ScheduledTask',
            'snv.proxy() -> ProxyServer; snv.logger() -> org.slf4j.Logger; snv.dataDir() -> java.nio.file.Path',
          ],
        },
        {
          name: 'utils (static)',
          getter: 'com.sn.lib.util.* (no getter, static classes)',
          description:
            'Pure static helpers, used directly without going through the Sn context. Package ' +
            '`com.sn.lib.util` except where noted.',
          methods: [
            'SlotParser.parse("0-8,10") -> int[]   // mixed ranges',
            'TimeUtil.parse/format("1d 2h 30m 15s")',
            'NumberFormatter.format(n) -> "1.2K" (K/M/B/T/Qa/Qi) + inverse parse + formatComma',
            'MathUtil: fair rounding, convertToRoman(int)',
            'HeadUtil: base64/basehead/URL heads, LRU cache; fromPlayer / applyOwner(OfflinePlayer)',
            'TagIo: PDC (persistent NBT) per owner',
            'PlayerLookup.fetchUuid(name) -> async against Mojang, LRU with dedupe',
            'ArmourUtil.slotOf/isArmour/isWearingFullSet ; LocationUtil.inCuboid/distance2d/distanceToBoxSquared',
            'SoundUtil (lenient ids), InvUtil, Experience, LocationSerializer, WeightedRandomPool',
            'Cuboid (com.sn.lib.region): immutable thread-safe cuboid (contains/intersects/expand/forEach)',
            'Page<T> (com.sn.lib.command): pagination helper',
          ],
        },
        {
          name: 'custom events (Bukkit)',
          getter: 'com.sn.lib.event.* (@EventHandler)',
          description:
            'Own Bukkit events you can listen to with a normal listener. All cancelable ' +
            'where the source allows it.',
          methods: [
            'SnArmourEquipEvent: armour equip/unequip by any vector (8 methods)',
            'SnChunkMoveEvent: chunk crossing by movement (movement only, not teleports/joins); canceling it cancels the PlayerMoveEvent',
            'SnSelectionCompleteEvent: cuboid selection completed (selections module)',
          ],
        },
      ],
    },
  },

  'luckperms': {
    name: 'LuckPerms',
    description: 'A permissions plugin for Minecraft servers',
    documentation: {
      wiki: 'https://luckperms.net/wiki',
      javadocs: 'https://javadoc.io/doc/net.luckperms/api',
      github: 'https://github.com/LuckPerms/LuckPerms',
    },
    maven: {
      groupId: 'net.luckperms',
      artifactId: 'api',
      repository: 'maven-central',
    },
    aliases: ['luckperms-api', 'net.luckperms:api'],
  },

  'paper-api': {
    name: 'Paper API',
    description: 'The Paper Minecraft server API - high performance fork of Spigot',
    documentation: {
      wiki: 'https://docs.papermc.io/paper',
      javadocs: 'https://jd.papermc.io/paper/1.21.4/',
      github: 'https://github.com/PaperMC/Paper',
    },
    maven: {
      groupId: 'io.papermc.paper',
      artifactId: 'paper-api',
      repository: 'paper',
      repositoryUrl: 'https://repo.papermc.io/repository/maven-public/',
    },
    aliases: ['paper', 'io.papermc.paper:paper-api', 'papermc'],
  },

  'spigot-api': {
    name: 'Spigot API',
    description: 'The Spigot Minecraft server API',
    documentation: {
      javadocs: 'https://hub.spigotmc.org/javadocs/spigot/',
      github: 'https://hub.spigotmc.org/stash/projects/SPIGOT',
    },
    maven: {
      groupId: 'org.spigotmc',
      artifactId: 'spigot-api',
      repository: 'spigot',
      repositoryUrl: 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/',
    },
    aliases: ['spigot', 'org.spigotmc:spigot-api'],
  },

  'bukkit': {
    name: 'Bukkit API',
    description: 'The original Bukkit Minecraft server API',
    documentation: {
      javadocs: 'https://hub.spigotmc.org/javadocs/bukkit/',
      github: 'https://hub.spigotmc.org/stash/projects/SPIGOT/repos/bukkit',
    },
    maven: {
      groupId: 'org.bukkit',
      artifactId: 'bukkit',
      repository: 'spigot',
      repositoryUrl: 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/',
    },
    aliases: ['org.bukkit:bukkit', 'bukkit-api'],
  },

  'hikaricp': {
    name: 'HikariCP',
    description: 'Fast, simple, reliable JDBC connection pool',
    documentation: {
      wiki: 'https://github.com/brettwooldridge/HikariCP/wiki',
      javadocs: 'https://javadoc.io/doc/com.zaxxer/HikariCP',
      github: 'https://github.com/brettwooldridge/HikariCP',
    },
    maven: {
      groupId: 'com.zaxxer',
      artifactId: 'HikariCP',
      repository: 'maven-central',
    },
    aliases: ['hikari', 'com.zaxxer:HikariCP'],
    recommendation:
      'In Sn plugins prefer SnLib: `sn.db()` (SnDb) already ships SQLite/MySQL over Hikari (shaded, ' +
      'a single copy on the server), with async `query/update`, `thenSync` with an isEnabled guard ' +
      'and `PlayerDataCache`. Do not add HikariCP separately. See the `snlib` dependency.',
  },

  'item-nbt-api': {
    name: 'Item-NBT-API',
    description: 'Add NBT tags to items without NMS',
    documentation: {
      wiki: 'https://github.com/tr7zw/Item-NBT-API/wiki',
      javadocs: 'https://tr7zw.github.io/Item-NBT-API/v2-api/',
      github: 'https://github.com/tr7zw/Item-NBT-API',
    },
    maven: {
      groupId: 'de.tr7zw',
      artifactId: 'item-nbt-api',
      repository: 'codemc',
      repositoryUrl: 'https://repo.codemc.io/repository/maven-public/',
    },
    aliases: ['nbt-api', 'de.tr7zw:item-nbt-api', 'nbtapi'],
    recommendation:
      'In Sn plugins prefer SnLib: the items module (`sn.items()` + `SnItem` + PDC via `TagIo`) ' +
      'handles NBT, persistent tags and anti-theft with no NMS or an extra dependency. ' +
      'Use Item-NBT-API only if you need raw NBT outside the Sn ecosystem. See the `snlib` dependency.',
  },

  'packetevents': {
    name: 'PacketEvents',
    description: 'Modern, multi-platform Minecraft packet manipulation library (Spigot/Paper/BungeeCord/Velocity/Fabric/Sponge)',
    documentation: {
      wiki: 'https://docs.packetevents.com/',
      javadocs: 'https://javadocs.packetevents.com/',
      github: 'https://github.com/retrooper/packetevents',
    },
    maven: {
      groupId: 'com.github.retrooper',
      artifactId: 'packetevents-spigot',
      repository: 'maven-central',
    },
    aliases: ['packet-events', 'com.github.retrooper:packetevents-spigot', 'packetevents-spigot'],
  },

  'decentholograms': {
    name: 'DecentHolograms',
    description: 'A lightweight but powerful hologram plugin',
    documentation: {
      wiki: 'https://github.com/DecentSoftware-eu/DecentHolograms/wiki',
      github: 'https://github.com/DecentSoftware-eu/DecentHolograms',
    },
    maven: {
      groupId: 'com.github.decentsoftware-eu',
      artifactId: 'decentholograms',
      repository: 'jitpack',
    },
    aliases: ['decent-holograms', 'holograms'],
    recommendation:
      'In Sn plugins prefer SnLib: `sn.holograms()` (HologramUtil) creates holograms with real ' +
      'TextDisplay entities (zero NMS/packets), per-player visibility and optional PAPI refresh, ' +
      'without depending on an external hologram plugin. See the `snlib` dependency.',
  },

  'vault': {
    name: 'Vault API',
    description: 'Permissions, Chat, & Economy API for plugins',
    documentation: {
      wiki: 'https://github.com/MilkBowl/VaultAPI/wiki',
      javadocs: 'https://milkbowl.github.io/VaultAPI/',
      github: 'https://github.com/MilkBowl/VaultAPI',
    },
    maven: {
      groupId: 'com.github.MilkBowl',
      artifactId: 'VaultAPI',
      repository: 'jitpack',
    },
    aliases: ['vault-api', 'vaultapi', 'com.github.MilkBowl:VaultAPI'],
    recommendation:
      'In Sn plugins prefer SnLib: `sn.economy()` (EconomyBridge) uses Vault when present and ' +
      'otherwise falls back to a command-based backend, with async-safe `getBalance`/`give`/`tryTake`. ' +
      'This avoids coupling to the Vault API directly. See the `snlib` dependency.',
  },

  'coreprotect': {
    name: 'CoreProtect API',
    description: 'Block logging & rollback plugin API',
    documentation: {
      wiki: 'https://docs.coreprotect.net/',
      github: 'https://github.com/PlayPro/CoreProtect',
    },
    maven: {
      groupId: 'net.coreprotect',
      artifactId: 'coreprotect',
      repository: 'maven-central',
    },
    aliases: ['coreprotect-api', 'net.coreprotect:coreprotect'],
  },

  'placeholderapi': {
    name: 'PlaceholderAPI',
    description: 'A resource that allows the use of various placeholders',
    documentation: {
      wiki: 'https://wiki.placeholderapi.com/',
      javadocs: 'https://extendedclip.com/javadoc/placeholderapi/',
      github: 'https://github.com/PlaceholderAPI/PlaceholderAPI',
    },
    maven: {
      groupId: 'me.clip',
      artifactId: 'placeholderapi',
      repository: 'custom',
      repositoryUrl: 'https://repo.extendedclip.com/content/repositories/placeholderapi/',
    },
    aliases: ['papi', 'me.clip:placeholderapi'],
    recommendation:
      'In Sn plugins prefer SnLib on the dev side: `sn.papi()` (SnPapi) does `apply`/`applyOnMain` ' +
      'fail-open (if PlaceholderAPI is absent, it returns the text without a `NoClassDefFoundError`) ' +
      'and registers declarative expansions with `expansion(...).resolver(...).register()`. ' +
      'PlaceholderAPI is still the runtime plugin; SnLib saves you the manual hook. See the `snlib` dependency.',
  },

  'worldedit': {
    name: 'WorldEdit',
    description: 'In-game map editor for Minecraft',
    documentation: {
      wiki: 'https://worldedit.enginehub.org/en/latest/',
      javadocs: 'https://docs.enginehub.org/javadoc/worldedit/core/',
      github: 'https://github.com/EngineHub/WorldEdit',
    },
    maven: {
      groupId: 'com.sk89q.worldedit',
      artifactId: 'worldedit-bukkit',
      repository: 'custom',
      repositoryUrl: 'https://maven.enginehub.org/repo/',
    },
    aliases: ['we', 'com.sk89q.worldedit:worldedit-bukkit', 'worldedit-bukkit'],
  },

  'worldguard': {
    name: 'WorldGuard',
    description: 'Region protection and flag plugin',
    documentation: {
      wiki: 'https://worldguard.enginehub.org/en/latest/',
      javadocs: 'https://docs.enginehub.org/javadoc/worldguard/bukkit/',
      github: 'https://github.com/EngineHub/WorldGuard',
    },
    maven: {
      groupId: 'com.sk89q.worldguard',
      artifactId: 'worldguard-bukkit',
      repository: 'custom',
      repositoryUrl: 'https://maven.enginehub.org/repo/',
    },
    aliases: ['wg', 'com.sk89q.worldguard:worldguard-bukkit', 'worldguard-bukkit'],
  },

  'skinsrestorer': {
    name: 'SkinsRestorer API',
    description: 'Skin management API - set, get, and apply skins to players on Bukkit/BungeeCord/Velocity',
    documentation: {
      wiki: 'https://skinsrestorer.net/docs/development/api',
      javadocs: 'https://jd.skinsrestorer.net',
      github: 'https://github.com/SkinsRestorer/SkinsRestorer',
    },
    maven: {
      groupId: 'net.skinsrestorer',
      artifactId: 'skinsrestorer-api',
      repository: 'codemc',
      repositoryUrl: 'https://repo.codemc.org/repository/maven-public/',
    },
    aliases: ['skins-restorer', 'skinsrestorer-api', 'net.skinsrestorer:skinsrestorer-api', 'sr-api'],
    apiReference: {
      mainClass: 'SkinsRestorerAPI',
      importPackage: 'net.skinsrestorer.api',
      subApis: [
        {
          name: 'SkinsRestorerProvider',
          getter: 'SkinsRestorerProvider.get()',
          description: 'Entry point to retrieve the API instance',
          methods: [
            'get() -> SkinsRestorerAPI',
          ],
        },
        {
          name: 'SkinStorage',
          getter: 'getSkinStorage()',
          description: 'Manage skin data storage - find, create, and store skins',
          methods: [
            'findSkinData(String skinName) -> Optional<InputDataResult>',
            'findOrCreateSkinData(String skinName) -> InputDataResult',
            'setCustomSkinData(String skinName, SkinProperty property)',
            'getSkinForPlayer(UUID playerUuid, String playerName) -> Optional<SkinProperty>',
          ],
        },
        {
          name: 'PlayerStorage',
          getter: 'getPlayerStorage()',
          description: 'Manage player skin assignments',
          methods: [
            'setSkinIdOfPlayer(UUID playerUuid, SkinIdentifier skinId)',
            'getSkinIdOfPlayer(UUID playerUuid) -> Optional<SkinIdentifier>',
            'removeSkinIdOfPlayer(UUID playerUuid)',
          ],
        },
        {
          name: 'SkinApplier',
          getter: 'getSkinApplier(Class<P> playerClass)',
          description: 'Apply skins to players in real-time',
          methods: [
            'applySkin(P player)',
            'applySkin(P player, SkinProperty skin)',
          ],
        },
        {
          name: 'MineSkinAPI',
          getter: 'getMineSkinAPI()',
          description: 'Generate skins from image URLs via MineSkin service',
          methods: [
            'genSkin(String url, SkinVariant variant) -> MineSkinResponse',
          ],
        },
        {
          name: 'PropertyUtils',
          getter: 'PropertyUtils (static)',
          description: 'Utility methods for skin properties',
          methods: [
            'getSkinTextureUrl(SkinProperty property) -> String',
          ],
        },
      ],
    },
  },

  'edtools-api': {
    name: 'EdTools API',
    description: 'Developer API for EdTools Minecraft plugin - custom enchantments, lucky blocks, GUIs, zones, currencies, boosters, backpacks, OmniTools, sell and leveling. This entry only covers Maven/systemPath setup - for the live API surface (sub-APIs, every method with its parameters, and the Bukkit events) use the get_api_reference tool, which reads the wiki directly so it never goes stale.',
    documentation: {
      wiki: 'https://edseries-plugins.gitbook.io/p/edtools/api/edtools-api',
      github: 'https://edseries-plugins.gitbook.io/p/edtools',
      downloadUrl: 'https://edseries-plugins.gitbook.io/p/edtools/api/edtools-api',
    },
    maven: {
      groupId: 'es.edwardbelt.edgens',
      artifactId: 'EdTools-API',
      repository: 'manual',
    },
    aliases: ['edtools', 'edgens', 'es.edwardbelt.edgens:EdTools-API'],
    apiReference: {
      mainClass: 'EdToolsAPI',
      importPackage: 'es.edwardbelt.edgens.iapi',
      // Sub-API list, method signatures, parameters and the 4 Bukkit events are
      // intentionally NOT duplicated here - they are served live by the
      // get_api_reference tool (which reads the wiki), so this static entry stays
      // limited to Maven coordinates and the main API instance boilerplate.
    },
  },
};

/**
 * Find a dependency by name or alias
 */
export function findDependency(query: string): DependencyInfo | undefined {
  const normalizedQuery = query.toLowerCase().trim();

  // Direct match by key
  if (DEPENDENCY_REGISTRY[normalizedQuery]) {
    return DEPENDENCY_REGISTRY[normalizedQuery];
  }

  // Search through aliases
  for (const [key, info] of Object.entries(DEPENDENCY_REGISTRY)) {
    if (info.aliases.some(alias => alias.toLowerCase() === normalizedQuery)) {
      return info;
    }
    // Check if query matches the Maven artifact pattern
    const mavenCoord = `${info.maven.groupId}:${info.maven.artifactId}`.toLowerCase();
    if (mavenCoord === normalizedQuery) {
      return info;
    }
  }

  // Fuzzy match - check if query is contained in name or aliases
  for (const [key, info] of Object.entries(DEPENDENCY_REGISTRY)) {
    if (info.name.toLowerCase().includes(normalizedQuery) ||
        info.aliases.some(alias => alias.toLowerCase().includes(normalizedQuery))) {
      return info;
    }
  }

  return undefined;
}

/**
 * Get all registered dependencies
 */
export function getAllDependencies(): DependencyInfo[] {
  return Object.values(DEPENDENCY_REGISTRY);
}

/**
 * Get dependency keys
 */
export function getDependencyKeys(): string[] {
  return Object.keys(DEPENDENCY_REGISTRY);
}
