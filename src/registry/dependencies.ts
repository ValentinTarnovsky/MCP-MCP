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
  };
  maven: {
    groupId: string;
    artifactId: string;
    repository: RepositoryType;
    repositoryUrl?: string;
  };
  aliases: string[];
}

export type RepositoryType = 'maven-central' | 'jitpack' | 'paper' | 'spigot' | 'codemc' | 'custom';

export const REPOSITORY_URLS: Record<RepositoryType, string> = {
  'maven-central': 'https://repo1.maven.org/maven2',
  'jitpack': 'https://jitpack.io',
  'paper': 'https://repo.papermc.io/repository/maven-public',
  'spigot': 'https://hub.spigotmc.org/nexus/content/repositories/snapshots',
  'codemc': 'https://repo.codemc.io/repository/maven-public',
  'custom': '',
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
