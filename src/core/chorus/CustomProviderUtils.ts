export function isCustomProviderModelId(modelId: string): boolean {
    return modelId.startsWith("custom::");
}

export function parseCustomProviderModelId(modelId: string): {
    providerId: string;
    remoteModelId: string;
} {
    if (!isCustomProviderModelId(modelId)) {
        throw new Error(`Not a custom provider modelId: ${modelId}`);
    }
    const rest = modelId.split("::")[1] ?? "";
    const firstSlash = rest.indexOf("/");
    if (firstSlash < 1 || firstSlash === rest.length - 1) {
        throw new Error(`Invalid custom provider modelId: ${modelId}`);
    }
    return {
        providerId: rest.slice(0, firstSlash),
        remoteModelId: rest.slice(firstSlash + 1),
    };
}

function normalizeUrlNoTrailingSlash(url: string): string {
    return url.trim().replace(/\/+$/, "");
}

export function normalizeBaseUrlForChat(baseUrl: string): string {
    const normalized = normalizeUrlNoTrailingSlash(baseUrl);
    // If the base URL already ends with an explicit version (e.g. /v1, /v4),
    // don't override it by appending /v1.
    if (/\/v\d+$/i.test(normalized)) {
        return normalized;
    }
    return normalized + "/v1";
}
