/**
 * Plugin Marketplace Types
 * 
 * Defines types for the plugin marketplace system.
 */

import type { PluginHooks, PluginPermissions } from "../plugins-v2/types";

/**
 * Plugin listing in the marketplace
 */
export interface MarketplacePlugin {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Package name (npm) */
  packageName: string;
  /** Version */
  version: string;
  /** Short description */
  description: string;
  /** Author information */
  author: PluginAuthor;
  /** License */
  license: string;
  /** Homepage URL */
  homepage?: string;
  /** Repository URL */
  repository?: string;
  /** Number of downloads */
  downloads: number;
  /** Star count */
  stars: number;
  /** Last updated timestamp */
  updatedAt: number;
  /** Plugin hooks this plugin provides */
  hooks: string[];
  /** Categories/tags */
  tags: string[];
  /** Compatibility (engine versions) */
  compatibility: string[];
  /** Is verified/trusted */
  verified: boolean;
  /** Premium/paid plugin */
  premium: boolean;
  /** Price in USD (if premium) */
  price?: number;
}

/**
 * Plugin author
 */
export interface PluginAuthor {
  /** Author name */
  name: string;
  /** Author email */
  email?: string;
  /** Author website */
  website?: string;
  /** Author type (individual/organization) */
  type: "individual" | "organization";
}

/**
 * Plugin submission
 */
export interface PluginSubmission {
  /** Plugin package (tarball or GitHub URL) */
  package: string | File;
  /** README content */
  readme: string;
  /** License text */
  license?: string;
  /** Changelog */
  changelog?: string;
  /** Screenshots/demos */
  screenshots?: string[];
  /** Custom configuration */
  config?: Record<string, unknown>;
}

/**
 * Plugin review
 */
export interface PluginReview {
  /** Review ID */
  id: string;
  /** Plugin ID */
  pluginId: string;
  /** Reviewer user ID */
  reviewerId: string;
  /** Rating (1-5) */
  rating: number;
  /** Review title */
  title: string;
  /** Review content */
  content: string;
  /** Created timestamp */
  createdAt: number;
  /** Is verified purchase */
  verified: boolean;
  /** Helpful votes */
  helpful: number;
}

/**
 * Plugin search filters
 */
export interface PluginSearchFilters {
  /** Search query */
  query?: string;
  /** Filter by category/tag */
  tags?: string[];
  /** Filter by author */
  author?: string;
  /** Minimum rating */
  minRating?: number;
  /** Maximum price (0 = free only) */
  maxPrice?: number;
  /** Only verified plugins */
  verifiedOnly?: boolean;
  /** Compatibility version */
  compatibility?: string;
  /** Sort by */
  sortBy?: "downloads" | "rating" | "updated" | "name";
  /** Sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Marketplace configuration
 */
export interface MarketplaceConfig {
  /** Marketplace API base URL */
  apiBaseUrl: string;
  /** NPM registry URL */
  npmRegistryUrl: string;
  /** Authentication token */
  authToken?: string;
  /** Cache TTL in seconds */
  cacheTtl?: number;
  /** Enable auto-update */
  autoUpdate?: boolean;
}

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
  /** Whether installation was successful */
  success: boolean;
  /** Installed plugin */
  plugin?: MarketplacePlugin;
  /** Error message if failed */
  error?: string;
  /** Installation warnings */
  warnings?: string[];
}

/**
 * Plugin update info
 */
export interface PluginUpdateInfo {
  /** Plugin ID */
  pluginId: string;
  /** Current version */
  currentVersion: string;
  /** New version available */
  newVersion: string;
  /** Whether update is breaking */
  breaking: boolean;
  /** Changelog for update */
  changelog?: string;
}
