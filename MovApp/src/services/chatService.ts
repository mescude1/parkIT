import { apiClient } from "./apiClient";
import { IConversation, IChatMessage } from "../constants/types/api";

export const chatService = {
  getOrCreateConversation: () =>
    apiClient.post<{ status: string; conversation: IConversation }>(
      "/chat/conversation",
      {}
    ),

  getMessages: (conversationId: number, since?: string) => {
    let url = `/chat/conversation/${conversationId}/messages`;
    if (since) url += `?since=${encodeURIComponent(since)}`;
    return apiClient.get<{ status: string; messages: IChatMessage[] }>(url);
  },

  sendMessage: (conversationId: number, message: string) =>
    apiClient.post<{ status: string; message: IChatMessage }>(
      `/chat/conversation/${conversationId}/message`,
      { message }
    ),
};
