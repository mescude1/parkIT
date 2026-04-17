import { apiClient } from "./apiClient";
import { IServiceHistoryResponse } from "../constants/types/api";

export const historyService = {
  fetchHistory: (page: number, pageSize: number = 10) =>
    apiClient.get<IServiceHistoryResponse>(
      `/display/services?page=${page}&page_size=${pageSize}`
    ),
};
