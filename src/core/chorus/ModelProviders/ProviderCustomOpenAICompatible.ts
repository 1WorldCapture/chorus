import OpenAI from "openai";
import { SettingsManager } from "@core/utilities/Settings";
import { StreamResponseParams } from "../Models";
import { IProvider, ModelDisabled } from "./IProvider";
import OpenAICompletionsAPIUtils from "@core/chorus/OpenAICompletionsAPIUtils";
import {
    normalizeBaseUrlForChat,
    parseCustomProviderModelId,
} from "@core/chorus/CustomProviderUtils";

export class ProviderCustomOpenAICompatible implements IProvider {
    async streamResponse({
        llmConversation,
        modelConfig,
        onChunk,
        onComplete,
        additionalHeaders,
        tools,
        customBaseUrl,
    }: StreamResponseParams): Promise<ModelDisabled | void> {
        const { providerId, remoteModelId } = parseCustomProviderModelId(
            modelConfig.modelId,
        );

        const settings = await SettingsManager.getInstance().get();
        const provider = (settings.customProviders ?? []).find(
            (p) => p.id === providerId,
        );
        if (!provider) {
            throw new Error(
                "Custom provider not found. Configure it in Settings → API Keys.",
            );
        }

        if (!provider.baseUrl?.trim()) {
            throw new Error(
                `Custom provider "${provider.name}" is missing a Base URL. Configure it in Settings → API Keys.`,
            );
        }
        if (!provider.apiKey?.trim()) {
            throw new Error(
                `Custom provider "${provider.name}" is missing an API key. Configure it in Settings → API Keys.`,
            );
        }

        const baseURL = customBaseUrl || normalizeBaseUrlForChat(provider.baseUrl);

        const client = new OpenAI({
            baseURL,
            apiKey: provider.apiKey,
            defaultHeaders: {
                ...(additionalHeaders ?? {}),
                "Content-Type": "application/json",
            },
            dangerouslyAllowBrowser: true,
        });

        let messages: OpenAI.ChatCompletionMessageParam[] =
            await OpenAICompletionsAPIUtils.convertConversation(
                llmConversation,
                {
                    imageSupport: modelConfig.supportedAttachmentTypes.includes(
                        "image",
                    ),
                    functionSupport: true,
                },
            );

        if (modelConfig.systemPrompt) {
            messages = [
                {
                    role: "system",
                    content: modelConfig.systemPrompt,
                },
                ...messages,
            ];
        }

        const streamParams: OpenAI.ChatCompletionCreateParamsStreaming = {
            model: remoteModelId,
            messages,
            stream: true,
        };

        if (tools && tools.length > 0) {
            streamParams.tools =
                OpenAICompletionsAPIUtils.convertToolDefinitions(tools);
            streamParams.tool_choice = "auto";
        }

        const chunks: OpenAI.ChatCompletionChunk[] = [];

        const stream = await client.chat.completions.create(streamParams);
        for await (const chunk of stream) {
            chunks.push(chunk);
            if (chunk.choices[0]?.delta?.content) {
                onChunk(chunk.choices[0].delta.content);
            }
        }

        const toolCalls = OpenAICompletionsAPIUtils.convertToolCalls(
            chunks,
            tools ?? [],
        );

        await onComplete(
            undefined,
            toolCalls.length > 0 ? toolCalls : undefined,
        );
    }
}
