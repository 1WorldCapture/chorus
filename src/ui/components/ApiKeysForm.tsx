import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ProviderName } from "@core/chorus/Models";
import { ProviderLogo } from "./ui/provider-logo";
import { Card } from "./ui/card";
import {
    CheckIcon,
    FlameIcon,
    PlusIcon,
    Trash2Icon,
    PencilIcon,
} from "lucide-react";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { v4 as uuidv4 } from "uuid";
import type { CustomProviderConfig } from "@core/utilities/Settings";

interface ApiKeysFormProps {
    apiKeys: Record<string, string>;
    onApiKeyChange: (provider: string, value: string) => void;
    customProviders: CustomProviderConfig[];
    onUpsertCustomProvider: (provider: CustomProviderConfig) => void;
    onDeleteCustomProvider: (providerId: string) => void;
}

export default function ApiKeysForm({
    apiKeys,
    onApiKeyChange,
    customProviders,
    onUpsertCustomProvider,
    onDeleteCustomProvider,
}: ApiKeysFormProps) {
    const [selectedProvider, setSelectedProvider] = useState<string | null>(
        null,
    );

    const [customProviderDialogOpen, setCustomProviderDialogOpen] =
        useState(false);
    const [editingCustomProviderId, setEditingCustomProviderId] = useState<
        string | null
    >(null);
    const editingCustomProvider =
        customProviders.find((p) => p.id === editingCustomProviderId) ?? null;

    const [customProviderName, setCustomProviderName] = useState("");
    const [customProviderBaseUrl, setCustomProviderBaseUrl] = useState("");
    const [customProviderApiKey, setCustomProviderApiKey] = useState("");
    const [customProviderErrors, setCustomProviderErrors] = useState<{
        name?: string;
        baseUrl?: string;
        apiKey?: string;
    }>({});

    const openCreateCustomProviderDialog = () => {
        setSelectedProvider(null);
        setEditingCustomProviderId(null);
        setCustomProviderName("");
        setCustomProviderBaseUrl("");
        setCustomProviderApiKey("");
        setCustomProviderErrors({});
        setCustomProviderDialogOpen(true);
    };

    const openEditCustomProviderDialog = (provider: CustomProviderConfig) => {
        setSelectedProvider(null);
        setEditingCustomProviderId(provider.id);
        setCustomProviderName(provider.name);
        setCustomProviderBaseUrl(provider.baseUrl);
        setCustomProviderApiKey(provider.apiKey);
        setCustomProviderErrors({});
        setCustomProviderDialogOpen(true);
    };

    const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

    const validateCustomProvider = () => {
        const errors: {
            name?: string;
            baseUrl?: string;
            apiKey?: string;
        } = {};

        if (!customProviderName.trim()) {
            errors.name = "Name is required";
        }

        const baseUrl = normalizeBaseUrl(customProviderBaseUrl);
        if (!baseUrl) {
            errors.baseUrl = "Base URL is required";
        } else {
            try {
                const url = new URL(baseUrl);
                if (url.protocol !== "http:" && url.protocol !== "https:") {
                    errors.baseUrl = "Base URL must start with http:// or https://";
                }
            } catch {
                errors.baseUrl = "Invalid URL";
            }
        }

        if (!customProviderApiKey.trim()) {
            errors.apiKey = "API key is required";
        }

        setCustomProviderErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveCustomProvider = () => {
        if (!validateCustomProvider()) return;

        const now = new Date().toISOString();
        const baseUrl = normalizeBaseUrl(customProviderBaseUrl);
        const provider: CustomProviderConfig = {
            id: editingCustomProvider?.id ?? uuidv4(),
            name: customProviderName.trim(),
            baseUrl,
            apiKey: customProviderApiKey,
            createdAt: editingCustomProvider?.createdAt ?? now,
            updatedAt: now,
        };

        onUpsertCustomProvider(provider);
        setCustomProviderDialogOpen(false);
    };

    const providers = [
        {
            id: "anthropic",
            name: "Anthropic",
            placeholder: "sk-ant-...",
            url: "https://console.anthropic.com/settings/keys",
        },
        {
            id: "openai",
            name: "OpenAI",
            placeholder: "sk-...",
            url: "https://platform.openai.com/api-keys",
        },
        {
            id: "google",
            name: "Google AI (Gemini)",
            placeholder: "AI...",
            url: "https://aistudio.google.com/apikey",
        },
        {
            id: "perplexity",
            name: "Perplexity",
            placeholder: "pplx-...",
            url: "https://www.perplexity.ai/account/api/keys",
        },
        {
            id: "openrouter",
            name: "OpenRouter",
            placeholder: "sk-or-...",
            url: "https://openrouter.ai/keys",
        },
        {
            id: "grok",
            name: "xAI",
            placeholder: "xai-...",
            url: "https://console.x.ai/settings/keys",
        },
        {
            id: "firecrawl",
            name: "Firecrawl",
            placeholder: "fc-...",
            url: "https://www.firecrawl.dev/app/api-keys",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                {providers.map((provider) => (
                    <Card
                        key={provider.id}
                        className={`relative p-6 cursor-pointer hover:bg-muted transition-colors ${
                            selectedProvider === provider.id
                                ? "ring-2 ring-primary"
                                : ""
                        }`}
                        onClick={() => setSelectedProvider(provider.id)}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            {provider.id === "firecrawl" ? (
                                <FlameIcon className="w-4 h-4" />
                            ) : (
                                <ProviderLogo
                                    provider={provider.id as ProviderName}
                                    size="lg"
                                />
                            )}
                            <span className="font-medium">{provider.name}</span>
                        </div>
                        {apiKeys[provider.id] && (
                            <div className="absolute top-2 right-2">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                            </div>
                        )}
                    </Card>
                ))}

                {customProviders.map((provider) => (
                    <Card
                        key={provider.id}
                        className="relative p-6 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => openEditCustomProviderDialog(provider)}
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            <ProviderLogo provider="custom" size="lg" />
                            <span className="font-medium truncate w-full">
                                {provider.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate w-full">
                                {provider.baseUrl}
                            </span>
                        </div>
                        {provider.apiKey && provider.baseUrl && (
                            <div className="absolute top-2 right-2">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 text-muted-foreground/60">
                            <PencilIcon className="w-4 h-4" />
                        </div>
                    </Card>
                ))}

                <Card
                    className="p-6 cursor-pointer hover:bg-muted transition-colors"
                    onClick={openCreateCustomProviderDialog}
                >
                    <div className="flex flex-col items-center gap-2 text-center">
                        <PlusIcon className="w-5 h-5" />
                        <span className="font-medium">Custom Provider</span>
                    </div>
                </Card>
            </div>

            {selectedProvider && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${selectedProvider}-key`}>
                            {
                                providers.find((p) => p.id === selectedProvider)
                                    ?.name
                            }{" "}
                            API Key
                        </Label>
                        <Input
                            id={`${selectedProvider}-key`}
                            type="password"
                            placeholder={
                                providers.find((p) => p.id === selectedProvider)
                                    ?.placeholder
                            }
                            value={apiKeys[selectedProvider] || ""}
                            onChange={(e) =>
                                onApiKeyChange(selectedProvider, e.target.value)
                            }
                        />
                        <p className="text-sm text-muted-foreground">
                            <a
                                href={
                                    providers.find(
                                        (p) => p.id === selectedProvider,
                                    )?.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Get{" "}
                                {
                                    providers.find(
                                        (p) => p.id === selectedProvider,
                                    )?.name
                                }{" "}
                                API key
                            </a>
                            .
                        </p>
                    </div>
                </div>
            )}

            <DialogPrimitive.Root
                open={customProviderDialogOpen}
                onOpenChange={(open) => {
                    setCustomProviderDialogOpen(open);
                    if (!open) setCustomProviderErrors({});
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomProvider
                                ? "Edit Custom Provider"
                                : "Add Custom Provider"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure an OpenAI-compatible provider. Chorus will fetch models via{" "}
                            <span className="font-mono">/models</span> or{" "}
                            <span className="font-mono">/v1/models</span>, and chat via{" "}
                            <span className="font-mono">/v1/chat/completions</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="custom-provider-name">Name</Label>
                            <Input
                                id="custom-provider-name"
                                value={customProviderName}
                                onChange={(e) =>
                                    setCustomProviderName(e.target.value)
                                }
                                placeholder="My Provider"
                            />
                            {customProviderErrors.name && (
                                <p className="text-sm text-destructive">
                                    {customProviderErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-provider-baseurl">
                                Base URL
                            </Label>
                            <Input
                                id="custom-provider-baseurl"
                                value={customProviderBaseUrl}
                                onChange={(e) =>
                                    setCustomProviderBaseUrl(e.target.value)
                                }
                                placeholder="http://localhost:1234/v1"
                            />
                            {customProviderErrors.baseUrl && (
                                <p className="text-sm text-destructive">
                                    {customProviderErrors.baseUrl}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-provider-apikey">
                                API Key
                            </Label>
                            <Input
                                id="custom-provider-apikey"
                                type="password"
                                value={customProviderApiKey}
                                onChange={(e) =>
                                    setCustomProviderApiKey(e.target.value)
                                }
                                placeholder="sk-..."
                            />
                            {customProviderErrors.apiKey && (
                                <p className="text-sm text-destructive">
                                    {customProviderErrors.apiKey}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2">
                        {editingCustomProvider ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    onDeleteCustomProvider(
                                        editingCustomProvider.id,
                                    );
                                    setCustomProviderDialogOpen(false);
                                }}
                            >
                                <Trash2Icon className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setCustomProviderDialogOpen(false)
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveCustomProvider}
                            >
                                Save
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </DialogPrimitive.Root>
        </div>
    );
}
