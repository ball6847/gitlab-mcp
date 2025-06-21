// Import required modules
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Interface for feature flags configuration
export interface GitLabConfig {
  api?: {
    url?: string;
    token?: string;
  };
  enabled?: string[];
  disabled?: string[];
}

// Global variables for configuration tracking
export let configPath: string | null = null;
export let gitLabConfig: GitLabConfig | null = null;

/**
 * Sets the feature flags configuration
 * @param flags - The feature flags configuration object
 */
export function setGitLabConfig(config: GitLabConfig): void {
  gitLabConfig = config;
}

/**
 * Parses command-line arguments to find the config file path
 * @returns The resolved config file path or null if not found
 */
export function parseConfigPath(): string | null {
  const args = process.argv.slice(2);
  let configFilePath: string | null = null;

  for (let i = 0; i < args.length - 1; i++) {
    if (args[i] === '-c' || args[i] === '--config') {
      configFilePath = args[i + 1];
      break;
    }
  }

  if (!configFilePath) {
    return null;
  }

  if (!path.isAbsolute(configFilePath)) {
    configFilePath = path.resolve(process.cwd(), configFilePath);
  }

  return configFilePath;
}

/**
 * Checks if any legacy environment flags are defined
 * @param USE_GITLAB_WIKI - Legacy GitLab wiki flag
 * @param USE_MILESTONE - Legacy milestone flag
 * @param USE_PIPELINE - Legacy pipeline flag
 * @param GITLAB_READ_ONLY_MODE - Legacy read-only mode flag
 * @returns True if any legacy flags are defined, false otherwise
 */
export function hasLegacyFlags(
  USE_GITLAB_WIKI?: boolean,
  USE_MILESTONE?: boolean,
  USE_PIPELINE?: boolean,
  GITLAB_READ_ONLY_MODE?: boolean
): boolean {
  return (
    USE_GITLAB_WIKI !== undefined ||
    USE_MILESTONE !== undefined ||
    USE_PIPELINE !== undefined ||
    GITLAB_READ_ONLY_MODE !== undefined
  );
}

/**
 * Initializes feature flags from command line arguments
 * @returns Feature flags configuration object or null if not found
 */
export function initGitLabConfig(): GitLabConfig | null {
  configPath = parseConfigPath();

  if (configPath) {
    return readConfig(configPath);
  }

  return null;
}

export function readConfig(configFilePath: string): GitLabConfig | null {
    if (!fs.existsSync(configFilePath)) {
      console.warn(`Warning: Config file "${configFilePath}" not found. Enabling all features and applying legacy environment flags.`);
      return null;
    }

    try {
      const config = yaml.load(fs.readFileSync(configFilePath, 'utf8')) as GitLabConfig;

      const hasEnabled = config.enabled && Array.isArray(config.enabled) && config.enabled.length > 0;
      const hasDisabled = config.disabled && Array.isArray(config.disabled) && config.disabled.length > 0;

      if (hasEnabled && hasDisabled) {
        console.warn('Warning: Both "enabled" and "disabled" sections are defined in the config file. "disabled" section will be ignored.');
      }

      if (!hasEnabled && !hasDisabled) {
        console.warn('Warning: Neither "enabled" nor "disabled" sections are properly defined in the config file. No filtering will be applied.');
        return null;
      }

      return config;
    } catch (error) {
      console.warn(`Warning: Error parsing config file "${configFilePath}". Enabling all features and applying legacy environment flags.`, error);
      return null;
    }
  }

/**
 * Retrieves the GitLab API URL with precedence: environment variable > config file.
 * @returns The GitLab API URL or undefined if not found.
 */
export function getApiUrl(): string | undefined {
  if (process.env.GITLAB_API_URL) {
    return process.env.GITLAB_API_URL;
  }
  if (gitLabConfig?.api?.url) {
    return gitLabConfig.api.url;
  }
  return undefined;
}

/**
 * Retrieves the GitLab API token with precedence: environment variable > config file.
 * @returns The GitLab API token or undefined if not found.
 */
export function getApiToken(): string | undefined {
  if (process.env.GITLAB_PERSONAL_ACCESS_TOKEN) {
    return process.env.GITLAB_ACCESS_TOKEN;
  }
  if (gitLabConfig?.api?.token) {
    return gitLabConfig.api.token;
  }
  return undefined;
}