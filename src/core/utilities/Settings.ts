import { getStore } from "@core/infra/Store";
import { emit } from "@tauri-apps/api/event";

export type CustomProviderConfig = {
    id: string; // uuid
    name: string; // display name
    baseUrl: string; // user-provided base URL (recommended: no trailing slash)
    apiKey: string; // user-provided API key
    createdAt?: string;
    updatedAt?: string;
};

export interface Settings {
    defaultEditor: string;
    sansFont: string;
    monoFont: string;
    autoConvertLongText: boolean;
    autoScrapeUrls: boolean;
    apiKeys?: Record<string, string>;
    customProviders?: CustomProviderConfig[];
    quickChat?: {
        enabled?: boolean;
        modelConfigId?: string;
        shortcut?: string;
    };
    lmStudioBaseUrl?: string;
    cautiousEnter?: boolean;
}

export class SettingsManager {
    private static instance: SettingsManager;
    private storeName = "settings";

    private constructor() {}

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    public async get(): Promise<Settings> {
        try {
            const store = await getStore(this.storeName);
            const settings = await store.get("settings");
            const defaultSettings = {
                defaultEditor: "default",
                sansFont: "Geist",
                monoFont: "Geist Mono",
                autoConvertLongText: true,
                autoScrapeUrls: true,
                apiKeys: {},
                customProviders: [],
                quickChat: {
                    enabled: true,
                    modelConfigId: "anthropic::claude-3-5-sonnet-latest",
                    shortcut: "Alt+Space",
                },
            };

            // If no settings exist yet, save the defaults
            if (!settings) {
                await this.set(defaultSettings);
                return defaultSettings;
            }

            return (settings as Settings) || defaultSettings;
        } catch (error) {
            console.error("Failed to get settings:", error);
            return {
                defaultEditor: "default",
                sansFont: "Geist",
                monoFont: "Fira Code",
                autoConvertLongText: true,
                autoScrapeUrls: true,
                apiKeys: {},
                customProviders: [],
                quickChat: {
                    enabled: true,
                    modelConfigId: "anthropic::claude-3-5-sonnet-latest",
                    shortcut: "Alt+Space",
                },
            };
        }
    }

    public async set(settings: Settings): Promise<void> {
        try {
            const store = await getStore(this.storeName);
            await store.set("settings", settings);
            await store.save();
            await emit("settings-changed", settings);
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    }

    public async getChorusToken(): Promise<string | null> {
        try {
            const store = await getStore("auth.dat");
            const token = await store.get("api_token");
            return (token as string) || null;
        } catch (error) {
            console.error("Failed to get Chorus token:", error);
            return null;
        }
    }

    public async getCustomProviders(): Promise<CustomProviderConfig[]> {
        const settings = await this.get();
        return settings.customProviders ?? [];
    }

    public async upsertCustomProvider(
        provider: CustomProviderConfig,
    ): Promise<void> {
        const settings = await this.get();
        const existing = settings.customProviders ?? [];
        const next = existing.some((p) => p.id === provider.id)
            ? existing.map((p) => (p.id === provider.id ? provider : p))
            : [...existing, provider];
        await this.set({
            ...settings,
            customProviders: next,
        });
    }

    public async deleteCustomProvider(providerId: string): Promise<void> {
        const settings = await this.get();
        const existing = settings.customProviders ?? [];
        await this.set({
            ...settings,
            customProviders: existing.filter((p) => p.id !== providerId),
        });
    }
}
