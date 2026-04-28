import { apiClient } from "./apiClient";
import { IConversation, IChatMessage } from "../constants/types/api";

export const chatService = {
  // Legacy support thread (cliente <-> agente)
  getOrCreateConversation: () =>
    apiClient.post<{ status: string; conversation: IConversation }>(
      "/chat/conversation",
      {}
    ),

  // Service thread (cliente <-> valet) tied to a ValetRequest
  getOrCreateForRequest: (requestId: number) =>
    apiClient.post<{ status: string; conversation: IConversation }>(
      `/chat/conversation/by-request/${requestId}`,
      {}
    ),

  getMessages: (conversationId: number, since?: string) => {
    let url = `/chat/conversation/${conversationId}/messages`;
    if (since) url += `?since=${encodeURIComponent(since)}`;
    return apiClient.get<{ status: string; messages: IChatMessage[] }>(url);
  },

  sendMessage: (
    conversationId: number,
    message: string,
    attachmentUrl?: string
  ) =>
    apiClient.post<{ status: string; message: IChatMessage }>(
      `/chat/conversation/${conversationId}/message`,
      { message, attachment_url: attachmentUrl ?? null }
    ),
};
