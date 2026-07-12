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
    downloadUrl?: string; // Para JARs manuales
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
  /** Referencia de APIs disponibles para plugins con múltiples sub-APIs */
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
  'manual': '', // JAR descargado manualmente, usar systemPath en Maven
  'local': '', // Repo local .m2 (mvn install), no resoluble desde un repo publico
};

export const DEPENDENCY_REGISTRY: Record<string, DependencyInfo> = {
  'snlib': {
    name: 'SnLib',
    description:
      'Librería común de los plugins Sn, empaquetada como PLUGIN STANDALONE. Un solo `SnLib.jar` ' +
      'en `plugins/` provee yml gestionado, menús, ítems, comandos, base de datos, PAPI, lang, ' +
      'scheduler (Folia-aware), hologramas, bossbars, cron, leaderboards, economía, cooldowns, ' +
      'selecciones de cuboides y utilidades a cada consumer, con un único estilo de desarrollo y ' +
      'cero dependencias repetidas. Modelo hard-depend: cada plugin declara `depend: [SnLib]` y ' +
      'compila contra `com.sn:snlib` en scope `provided` (nada se shadea en el consumer). ' +
      'Runtime floor 1.20.4, target 1.21.8, Java 21 obligatorio, cero NMS/paquetes (Paper + Adventure).',
    documentation: {
      wiki: 'https://github.com/ValentinTarnovsky/SnLib/blob/main/README.md',
      github: 'https://github.com/ValentinTarnovsky/SnLib',
    },
    maven: {
      groupId: 'com.sn',
      artifactId: 'snlib',
      repository: 'local',
      version: '1.2.0',
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
            'YmlManager/SnYml: lectura de YML con tabs autocorregidos (1 warn), getters tipados con ' +
            'default + WARN (nunca stacktrace), placeholders locales + PAPI por getter y auto-merge ' +
            'estructural de configs en cada arranque (sin config-version, preserva valores/comentarios).',
          methods: [
            'config() -> SnYml',
            'managed(String name) -> SnYml   // merge-always contra el jar',
            'seedOnly(String name) -> SnYml   // solo se copia si falta',
            'data(String name) -> SnYml   // data: nunca se mergea',
            'managedPruning(String path)   // opt-in: borra keys ausentes del recurso',
            'SnYml.getInt/getString(key, default[, viewer]); onReload(cb); set(k,v); save()',
          ],
        },
        {
          name: 'guis',
          getter: 'sn.guis()',
          description:
            'GuiManager: un GUI por archivo en `guis/` (golden spec docs/menu-example.yml, cualquier ' +
            'campo del spec YA funciona sin código). Una GuiSession + Inventory POR VIEWER, paginación ' +
            'real per-player, layout ASCII, matriz de clicks por botón, anti-robo NBT 7-vector. ' +
            'Reemplaza mc-MenuAPI.',
          methods: [
            'get(String id) -> Gui',
            'registerAction(String tag, handler)   // acción [custom]',
            'Gui.open(Player); Gui.session(Player) -> GuiSession',
            'GuiSession.bind(slot, template, Ph...); bindPaged(templateId, data, slots, binder)',
            'GuiSession.setTotalPages(int)',
          ],
        },
        {
          name: 'items',
          getter: 'sn.items()',
          description:
            'ItemRegistry/ItemDef/SnItem: ítems físicos por YML (docs/item-example.yml) o 100% ' +
            'programáticos. NBT/PDC, anti-robo `locked` (7 vectores, restore en quit/shutdown), ' +
            '12 variantes de interact-action, durabilidad custom, recetas, held-effects, skull-owner y ' +
            'attributes. Reemplaza Item-NBT-API (tags persistentes vía `TagIo`, sin NMS).',
          methods: [
            'register(String id, ItemDef def)',
            'give(Player, String id, int amount)',
            'damage(Player, ItemStack, int amount)',
            'ItemDef.builder().item(SnItem).locked().noDrop().obtainVia(...).onRightClick(...).build()',
            'new SnItem(Material).name(...).glow().skullOwner(...).attribute(...).damage(int)',
          ],
        },
        {
          name: 'db',
          getter: 'sn.db()',
          description:
            'SnDb: SQLite (pool=1 + WAL + busy_timeout) o MySQL (pool Hikari), drivers shadeados sin ' +
            'relocation (una sola copia en el server). Consultas async, `thenSync` con guard de ' +
            'isEnabled, `PlayerDataCache`. Reemplaza a agregar HikariCP por separado.',
          methods: [
            'bootstrap(Schema...).orDisablePlugin()',
            'query(sql, prep, mapper).thenSync(result -> ...)',
            'update(sql, prep)   // nunca en el main thread',
            'playerCache(loader, saver) -> PlayerDataCache<T>',
          ],
        },
        {
          name: 'papi',
          getter: 'sn.papi()',
          description:
            'SnPapi: si PlaceholderAPI está ausente devuelve el texto SIN tocar (hook aislado, sin ' +
            'NoClassDefFoundError). Expansiones declarativas con persist. Reemplaza el hook manual a ' +
            'PlaceholderAPI (que sigue siendo el plugin runtime).',
          methods: [
            'apply(viewer, text) -> String',
            'applyOnMain(viewer, text) -> SnFuture<String>   // hop a main desde async, fail-open',
            'expansion(String id).resolver((player, params) -> ...).register()',
          ],
        },
        {
          name: 'economy',
          getter: 'sn.economy()',
          description:
            'EconomyBridge: usa Vault cuando está presente; si no, un backend por comandos ' +
            'configurable. Todo async-safe. Reemplaza acoplarte a la API de Vault directo.',
          methods: [
            'getBalance(player) ; give(player, amount) ; tryTake(player, amount)',
            'useCommandBackend(give, take, balancePlaceholder)',
          ],
        },
        {
          name: 'holograms',
          getter: 'sn.holograms()',
          description:
            'HologramUtil: hologramas con TextDisplay reales (cero NMS), visibilidad por jugador, ' +
            'refresh PAPI opcional, huérfanos purgados en chunk-load/startup vía PDC. Reemplaza ' +
            'DecentHolograms u otro plugin de hologramas externo.',
          methods: [
            'spawn(String id, Location loc, List<String> lines)',
            'setLines(String id, List<String> lines)',
            'per-player visibility + refresh PAPI',
          ],
        },
        {
          name: 'lang',
          getter: 'sn.lang()',
          description:
            'SnLang: `lang/messages_<code>.yml` con merge-always y fallback per-key a `en`. Envío por ' +
            'el pipeline SnText (MiniMessage + [small] + [rgb] + [center]). Actionbar persistente.',
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
            'SnCommands: árbol root/sub, todo tab-completable y GATED por permiso (un sub sin permiso ' +
            'es invisible en tab y help). Registro reload-safe por Plugin owner.',
          methods: [
            'root(name).permission(p).sub(name).permission(p).arg(name, Args.x()).executes(ctx).and().register()',
            'Args.onlinePlayer() / Args.intRange(min, max)',
          ],
        },
        {
          name: 'actions',
          getter: 'sn.actions()',
          description:
            'ActionEngine + RequirementEngine: líneas `[tag] arg` en YML ([player], [console], ' +
            '[message], [sound], [close], [open], [connect], [title], [particle], nav de páginas...), ' +
            'click guards y requirements con `%placeholder% > 0 && ...` (descenso recursivo con paréntesis).',
          methods: [
            'register(String tag, handler)   // tag custom',
            'requirements por YML: view/click/interact-requirements + deny-actions',
          ],
        },
        {
          name: 'cooldowns',
          getter: 'sn.cooldowns()',
          description: 'Cooldowns: sin boxing; entradas no vencidas sobreviven relogs por diseño; categorías de sesión.',
          methods: [
            'tryUse(UUID, String key, Duration) -> boolean',
            'registerSessionCategory(String)',
          ],
        },
        {
          name: 'scheduler',
          getter: 'sn.scheduler()',
          description: 'SnScheduler Folia-aware: sync/async, later, timers, supplyAsync/thenSync con guard de isEnabled.',
          methods: [
            'sync/async(Runnable); syncLater/asyncLater(Runnable, ticks)',
            'timer/timerAsync(Runnable, delay, period) -> TaskHandle',
            'supplyAsync(supplier).thenSync(consumer)',
          ],
        },
        {
          name: 'bossbars',
          getter: 'sn.bossbars()',
          description: 'BossBarUtil: pura Adventure (cero paquetes), auto-hide en quit/teardown.',
          methods: [
            'create(String id).text(...).progress(float).build()',
            'show/hide/setText/setProgress/timer',
          ],
        },
        {
          name: 'cron',
          getter: 'sn.cron()',
          description: 'SnCron: subset cron de 5 campos + shortcuts (daily 04:00 / hourly :30), DST-safe, catchUp persistible.',
          methods: [
            'schedule(String id, String expr, Runnable task)',
          ],
        },
        {
          name: 'leaderboards',
          getter: 'sn.leaderboards()',
          description: 'LeaderboardCache: snapshot inmutable con swap atómico, lectura lock-free, placeholders opt-in.',
          methods: [
            'register(String id, Duration refresh, query)',
            'getTop / positionOf / valueOf',
          ],
        },
        {
          name: 'discord',
          getter: 'sn.discord()',
          description: 'DiscordWebhook: POST async con HttpClient JDK, cola FIFO honrando Retry-After, drain best-effort en teardown.',
          methods: [
            'message(url).content("...").embed(...).send()',
          ],
        },
        {
          name: 'updates',
          getter: 'sn.updates()',
          description:
            'UpdateChecker (notify-only): apunta al repo GitHub del CONSUMER y avisa si hay release ' +
            'más nuevo. NUNCA descarga ni auto-swapea. Soporta repos privados vía token en config.',
          methods: [
            'checkNow("owner/repo")   // o SnSpec.builder().updates("owner/repo")',
          ],
        },
        {
          name: 'selections',
          getter: 'sn.selections()',
          description:
            'SelectionManager (módulo region): selecciones visuales de cuboides para cualquier consumer ' +
            '(100% programático, sin gate de spec). `Cuboid` inmutable thread-safe. Emite ' +
            'SnSelectionCompleteEvent (cancelable).',
          methods: [
            'giveWand(Player, SelectionSpec)   // o createWand(spec)',
            'SelectionSpec.builder(id).permission(p).onSelect(cuboid -> ...).build()',
          ],
        },
        {
          name: 'debug',
          getter: 'sn.debug()',
          description:
            'SnDebug: toggle en runtime (/command debug con debugCommand()), niveles OFF<INFO<DEBUG<TRACE, ' +
            'Supplier lazy para no construir strings caros con debug off.',
          methods: [
            'log(() -> "state=" + expensive())',
            'info(...) ; trace(...) ; tracing()',
          ],
        },
        {
          name: 'reload',
          getter: 'sn.reload()',
          description: 'ReloadManager del plugin dueño: reconstruye los módulos declarados en orden estricto y re-dispara los reloadables.',
          methods: [
            'register(reloadable)',
          ],
        },
        {
          name: 'utils (estáticas)',
          getter: 'com.sn.lib.util.* (sin getter, clases estáticas)',
          description:
            'Helpers estáticos puros, se usan directo sin pasar por el contexto Sn. Paquete ' +
            '`com.sn.lib.util` salvo donde se indica.',
          methods: [
            'SlotParser.parse("0-8,10") -> int[]   // rangos mixtos',
            'TimeUtil.parse/format("1d 2h 30m 15s")',
            'NumberFormatter.format(n) -> "1.2K" (K/M/B/T/Qa/Qi) + parse inverso + formatComma',
            'MathUtil: redondeo justo, convertToRoman(int)',
            'HeadUtil: heads base64/basehead/URL, LRU cache; fromPlayer / applyOwner(OfflinePlayer)',
            'TagIo: PDC (NBT persistente) por owner',
            'PlayerLookup.fetchUuid(name) -> async contra Mojang, LRU con dedupe',
            'ArmourUtil.slotOf/isArmour/isWearingFullSet ; LocationUtil.inCuboid/distance2d/distanceToBoxSquared',
            'SoundUtil (ids lenientes), InvUtil, Experience, LocationSerializer, WeightedRandomPool',
            'Cuboid (com.sn.lib.region): cuboide inmutable thread-safe (contains/intersects/expand/forEach)',
            'Page<T> (com.sn.lib.command): helper de paginación',
          ],
        },
        {
          name: 'eventos custom (Bukkit)',
          getter: 'com.sn.lib.event.* (@EventHandler)',
          description:
            'Eventos Bukkit propios que podés escuchar con un listener normal. Todos cancelables ' +
            'donde el origen lo permite.',
          methods: [
            'SnArmourEquipEvent: equip/unequip de armadura por cualquier vector (8 métodos)',
            'SnChunkMoveEvent: cruce de chunk por movimiento (solo movimiento, no teleports/joins); cancelarlo cancela el PlayerMoveEvent',
            'SnSelectionCompleteEvent: selección de cuboide completada (módulo selections)',
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
      'En plugins Sn preferí SnLib: `sn.db()` (SnDb) ya trae SQLite/MySQL sobre Hikari (shadeado, ' +
      'una sola copia en el server), con `query/update` async, `thenSync` con guard de isEnabled y ' +
      '`PlayerDataCache`. No agregues HikariCP por separado. Ver la dependencia `snlib`.',
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
      'En plugins Sn preferí SnLib: el módulo items (`sn.items()` + `SnItem` + PDC vía `TagIo`) ' +
      'maneja NBT, tags persistentes y anti-robo sin NMS ni una dependencia extra. ' +
      'Usá Item-NBT-API solo si necesitás NBT crudo fuera del ecosistema Sn. Ver la dependencia `snlib`.',
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
      'En plugins Sn preferí SnLib: `sn.holograms()` (HologramUtil) crea hologramas con ' +
      'TextDisplay reales (cero NMS/paquetes), visibilidad por jugador y refresh PAPI opcional, ' +
      'sin depender de un plugin de hologramas externo. Ver la dependencia `snlib`.',
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
      'En plugins Sn preferí SnLib: `sn.economy()` (EconomyBridge) usa Vault si está presente y ' +
      'si no cae a un backend por comandos, con `getBalance`/`give`/`tryTake` async-safe. ' +
      'Así no te acoplás a la API de Vault directo. Ver la dependencia `snlib`.',
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
      'En plugins Sn preferí SnLib para el lado dev: `sn.papi()` (SnPapi) hace `apply`/`applyOnMain` ' +
      'fail-open (si PlaceholderAPI no está, devuelve el texto sin `NoClassDefFoundError`) y registra ' +
      'expansiones declarativas con `expansion(...).resolver(...).register()`. PlaceholderAPI sigue ' +
      'siendo el plugin runtime; SnLib te evita el hook manual. Ver la dependencia `snlib`.',
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
