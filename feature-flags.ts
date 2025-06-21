import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Interface for feature flags configuration
 */
export interface FeatureFlags {
  /**
   * List of tool names to enable (only these tools will be available)
   */
  enabled?: string[];

  /**
   * List of tool names to disable (all tools except these will be available)
   */
  disabled?: string[];
}

/**
 * Global variable to store the configuration path
 */
export let configPath: string | null = null;

/**
 * Global variable to store the parsed feature flags
 */
export let featureFlags: FeatureFlags | null = null;

/**
 * Sets the global featureFlags variable.
 * @param flags - The FeatureFlags object to set.
 */
export function setFeatureFlags(flags: FeatureFlags): void {
  featureFlags = flags;
}

/**
 * Read and parse feature flags configuration
 * @param configFilePath - Path to the YAML configuration file
 * @returns Parsed configuration or null if file doesn't exist/is invalid
 */
// ... existing code ...

/**
 * Parse command-line arguments for config file path
 * @returns The resolved config file path or null if not specified
 */
export function parseConfigPath(): string | null {
  const args = process.argv.slice(2);
  let configFilePath: string | null = null;

  // Look for -c or --config flag
  for (let i = 0; i < args.length - 1; i++) {
    if (args[i] === '-c' || args[i] === '--config') {
      configFilePath = args[i + 1];
      break;
    }
  }

  // If no config path is specified, return null
  if (!configFilePath) {
    return null;
  }

  // If config path is relative, make it absolute based on current working directory
  if (!path.isAbsolute(configFilePath)) {
    configFilePath = path.resolve(process.cwd(), configFilePath);
  }

  return configFilePath;
}

/**
 * Check if legacy environment flags are defined
 * @param USE_GITLAB_WIKI - Wiki feature flag
 * @param USE_MILESTONE - Milestone feature flag
 * @param USE_PIPELINE - Pipeline feature flag
 * @param GITLAB_READ_ONLY_MODE - Read-only mode flag
 * @returns Whether any legacy flags are defined
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
 * Initialize feature flags from command line arguments
 * @returns Parsed feature flags or null
 */
export function initFeatureFlags(): FeatureFlags | null {
  // Parse command line arguments
  configPath = parseConfigPath();

  // If config path is specified, read and parse feature flags
  if (configPath) {
    return readFeatureFlags(configPath);
  }

  return null;
}

/**
 * Read and parse feature flags configuration
 * @param configFilePath - Path to the YAML configuration file
 * @returns Parsed configuration or null if file doesn't exist/is invalid
 */
export function readFeatureFlags(configFilePath: string): FeatureFlags | null {
  // Check if file exists
  if (!fs.existsSync(configFilePath)) {
    console.warn(`Warning: Config file "${configFilePath}" not found. Enabling all features and applying legacy environment flags.`);
    return null;
  }

  try {
    // Read and parse YAML file
    const config = yaml.load(fs.readFileSync(configFilePath, 'utf8')) as FeatureFlags;

    // Check if both sections are defined
    const hasEnabled = config.enabled && Array.isArray(config.enabled) && config.enabled.length > 0;
    const hasDisabled = config.disabled && Array.isArray(config.disabled) && config.disabled.length > 0;

    if (hasEnabled && hasDisabled) {
      console.warn('Warning: Both "enabled" and "disabled" sections are defined in the config file. "disabled" section will be ignored.');
    }

    // Check if no sections are defined
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