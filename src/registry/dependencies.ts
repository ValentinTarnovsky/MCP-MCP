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
  };
  aliases: string[];
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

export type RepositoryType = 'maven-central' | 'jitpack' | 'paper' | 'spigot' | 'codemc' | 'custom' | 'manual';

export const REPOSITORY_URLS: Record<RepositoryType, string> = {
  'maven-central': 'https://repo1.maven.org/maven2',
  'jitpack': 'https://jitpack.io',
  'paper': 'https://repo.papermc.io/repository/maven-public',
  'spigot': 'https://hub.spigotmc.org/nexus/content/repositories/snapshots',
  'codemc': 'https://repo.codemc.io/repository/maven-public',
  'custom': '',
  'manual': '', // JAR descargado manualmente, usar systemPath en Maven
};

export const DEPENDENCY_REGISTRY: Record<string, DependencyInfo> = {
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
  },

  'protocollib': {
    name: 'ProtocolLib',
    description: 'Library for reading and modifying Minecraft packets',
    documentation: {
      wiki: 'https://github.com/dmulloy2/ProtocolLib/wiki',
      javadocs: 'https://ci.dmulloy2.net/job/ProtocolLib/javadoc/',
      github: 'https://github.com/dmulloy2/ProtocolLib',
    },
    maven: {
      groupId: 'com.comphenix.protocol',
      artifactId: 'ProtocolLib',
      repository: 'custom',
      repositoryUrl: 'https://repo.dmulloy2.net/repository/public/',
    },
    aliases: ['protocol-lib', 'com.comphenix.protocol:ProtocolLib'],
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

  'mc-menuapi': {
    name: 'mc-MenuAPI',
    description: 'A powerful menu/GUI API for Minecraft plugins',
    documentation: {
      wiki: 'https://github.com/MonGen-s-Cave/mc-MenuAPI/wiki',
      github: 'https://github.com/MonGen-s-Cave/mc-MenuAPI',
    },
    maven: {
      groupId: 'com.github.MonGen-s-Cave',
      artifactId: 'mc-MenuAPI',
      repository: 'jitpack',
    },
    aliases: ['menuapi', 'menu-api', 'mongen-menuapi'],
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
    description: 'Developer API for EdTools Minecraft plugin - custom enchantments, lucky blocks, GUIs, zones, currencies, boosters, backpacks, and OmniTools',
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
      subApis: [
        {
          name: 'EnchantAPI',
          getter: 'getEnchantAPI()',
          description: 'Custom enchantment system - register, trigger, and manage enchant levels',
          methods: [
            'registerEnchant(String enchantId, APIEnchant enchant)',
            'getEnchantLevel(UUID uuid, String enchant) -> double',
            'addEnchantLevel(UUID uuid, String enchant, double level)',
            'removeEnchantLevel(UUID uuid, String enchant, double level)',
            'triggerCustomEnchant(Player player, String enchant, Material material, Vector position)',
            'tryTriggerCustomEnchant(Player player, String enchant, Material material, Vector position) -> boolean',
            'getEnchantChance(UUID uuid, String enchant) -> double',
            'getEnchantMaxLevel(String enchant) -> double',
            'getEnchantStartingLevel(String enchant) -> double',
            'getEnchantMaxChance(String enchant) -> double',
          ],
        },
        {
          name: 'LuckyBlocksAPI',
          getter: 'getLuckyBlocksAPI()',
          description: 'Lucky blocks management - create, validate, and unlock lucky blocks',
          methods: [
            'getLuckyBlockItem(String id, Player owner) -> ItemStack',
            'isLuckyBlock(ItemStack item) -> boolean',
            'isLuckyBlockUnlocked(ItemStack item) -> boolean',
            'updateLuckyBlock(Player player, ItemStack item)',
          ],
        },
        {
          name: 'GuisAPI',
          getter: 'getGuisAPI()',
          description: 'Custom GUI management - open, close, and load GUIs dynamically',
          methods: [
            'openGui(Player player, String gui)',
            'openGui(Player player, String gui, Map<String, String> placeholders)',
            'closeGui(Player player)',
            'loadGui(String guiId, File guiFile)',
          ],
        },
        {
          name: 'ZonesAPI',
          getter: 'getZonesAPI()',
          description: 'Instanced zones/mines management - sessions, block types, and mining',
          methods: [
            'joinGlobalSession(Player player, String zoneId)',
            'joinAloneSession(Player player, String zoneId)',
            'leaveSession(Player player)',
            'isPlayerInSession(Player player) -> boolean',
            'getPlayerZoneId(Player player) -> String',
            'getPlayerZoneSessionType(Player player) -> String',
            'setPlayerBlocksTypeZone(Player player, String zoneId, String blocksType)',
            'getPlayerBlocksTypeZone(Player player, String zoneId) -> String',
            'getPlayerLoadedBlocks(Player player) -> Map<Vector, Material>',
            'mineBlockAsPlayer(Player player, Vector position, String toolId, boolean affectEnchants, boolean affectSell, boolean affectBlockCurrencies, boolean affectLuckyBlocks) -> APIPair<Material, String>',
          ],
        },
        {
          name: 'OmniToolAPI',
          getter: 'getOmniToolAPI()',
          description: 'OmniTool items management - special multi-function tools',
          methods: [
            'getOmniToolItem(Player owner, String toolId) -> ItemStack',
            'getOmniToolFromPlayer(Player owner) -> ItemStack',
            'isItemOmniTool(ItemStack item) -> boolean',
            'getOmniToolId(ItemStack item) -> String',
            'loadTool(String toolId, ConfigurationSection toolSec)',
          ],
        },
        {
          name: 'CurrencyAPI',
          getter: 'getCurrencyAPI()',
          description: 'Custom currencies management - get, set, add, remove balances',
          methods: [
            'getCurrency(UUID uuid, String currency) -> double',
            'setCurrency(UUID uuid, String currency, double amount)',
            'addCurrency(UUID uuid, String currency, double amount)',
            'removeCurrency(UUID uuid, String currency, double amount)',
            'isCurrency(String currency) -> boolean',
            'getMaxCurrencyValue(String currency) -> double',
            'getStartingCurrencyValue(String currency) -> double',
            'getCurrencyName(String currency) -> String',
          ],
        },
        {
          name: 'BoostersAPI',
          getter: 'getBoostersAPI()',
          description: 'Booster system - multipliers for currencies and enchantments',
          methods: [
            'getBoosterValueByEconomy(UUID uuid, String economy) -> double',
            'getBoosterValueGlobalEnchants(UUID uuid) -> double',
            'getActiveBoosters(UUID uuid) -> List<String>',
            'existsBooster(UUID uuid, String boosterId) -> boolean',
            'getBoosterCurrency(UUID uuid, String boosterId) -> String',
            'isBoosterEnchantType(UUID uuid, String boosterId) -> boolean',
            'getBoosterName(UUID uuid, String boosterId) -> String',
            'getBoosterMultiplier(UUID uuid, String boosterId) -> double',
            'getBoosterDuration(UUID uuid, String boosterId) -> long',
            'getBoosterRemainingTime(UUID uuid, String boosterId) -> long',
            'removeBooster(UUID uuid, String boosterId)',
            'addBooster(UUID uuid, String boosterId, String boosterName, String economy, double multiplier, long duration, boolean enchantBooster, boolean saveDB)',
          ],
        },
        {
          name: 'BackpackAPI',
          getter: 'getBackpackAPI()',
          description: 'Backpack inventory management',
          methods: [],
        },
      ],
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
