import { ApiKeys, getProviderName, parseCustomProviderModelId } from "@core/chorus/Models";
import type { CustomProviderConfig } from "@core/utilities/Settings";

export interface CanProceedResult {
    canProceed: boolean;
    reason?: string;
}

/**
 * Maps provider names to their corresponding API key field names
 */
const PROVIDER_TO_API_KEY: Record<string, keyof ApiKeys> = {
    anthropic: "anthropic",
    openai: "openai",
    google: "google",
    perplexity: "perplexity",
    openrouter: "openrouter",
    grok: "grok",
};

/**
 * Maps provider names to human-readable names for error messages
 */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google AI",
    perplexity: "Perplexity",
    openrouter: "OpenRouter",
    grok: "xAI",
};

/**
 * Checks if we have the required API key to use a provider
 * @param providerKey The provider name (e.g. 'anthropic', 'openai')
 * @param apiKeys The API keys object
 * @returns true if we have an API key for this provider
 */
export function hasApiKey(
    providerKey: keyof ApiKeys,
    apiKeys: ApiKeys,
): boolean {
    return Boolean(apiKeys[providerKey]);
}

/**
 * Checks if we can proceed with a provider request.
 * Requires the user to have configured an API key for the provider.
 * @param providerKey The provider name (e.g. 'anthropic', 'openai')
 * @param apiKeys The API keys object
 * @returns Object containing whether we can proceed and an optional reason if we cannot
 */
export function canProceedWithProvider(
    providerKey: string,
    apiKeys: ApiKeys,
): CanProceedResult {
    const apiKeyField = PROVIDER_TO_API_KEY[providerKey];

    // Local models (ollama, lmstudio) don't require API keys
    if (providerKey === "ollama" || providerKey === "lmstudio") {
        return { canProceed: true };
    }

    // For providers that need API keys, check if one is configured
    if (!apiKeyField) {
        return {
            canProceed: false,
            reason: `Unknown provider: ${providerKey}`,
        };
    }

    if (!hasApiKey(apiKeyField, apiKeys)) {
        const displayName = PROVIDER_DISPLAY_NAMES[providerKey] || providerKey;
        return {
            canProceed: false,
            reason: `Please add your ${displayName} API key in Settings to use this model.`,
        };
    }

    return { canProceed: true };
}

export function canProceedWithModelId(params: {
    modelId: string;
    apiKeys: ApiKeys;
    customProviders?: CustomProviderConfig[];
}): CanProceedResult {
    let providerName: string;
    try {
        providerName = getProviderName(params.modelId);
    } catch (error) {
        console.error(error);
        return { canProceed: false, reason: "Invalid model ID." };
    }

    if (providerName === "custom") {
        try {
            const { providerId } = parseCustomProviderModelId(params.modelId);
            const provider = params.customProviders?.find(
                (p) => p.id === providerId,
            );
            if (!provider) {
                return {
                    canProceed: false,
                    reason: "Custom provider not found. Configure it in Settings → API Keys.",
                };
            }
            if (!provider.baseUrl?.trim()) {
                return {
                    canProceed: false,
                    reason: `Custom provider "${provider.name}" is missing a Base URL. Configure it in Settings → API Keys.`,
                };
            }
            if (!provider.apiKey?.trim()) {
                return {
                    canProceed: false,
                    reason: `Custom provider "${provider.name}" is missing an API key. Configure it in Settings → API Keys.`,
                };
            }
            return { canProceed: true };
        } catch (error) {
            console.error(error);
            return {
                canProceed: false,
                reason: "Invalid custom provider model ID.",
            };
        }
    }

    return canProceedWithProvider(providerName, params.apiKeys);
}
