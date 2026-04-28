import { apiClient } from "./apiClient";

export interface IBelonging {
  id: number;
  valet_request_id: number;
  service_id: number | null;
  owner_id: number;
  description: string;
  quantity: number;
  photos: string[];
  reported_missing: boolean;
  missing_reported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ICreateBelongingRequest {
  valet_request_id: number;
  description: string;
  quantity: number;
  photos: string[];
}

export interface IUpdateBelongingRequest {
  description?: string;
  quantity?: number;
  photos?: string[];
  reported_missing?: boolean;
}

export const belongingsService = {
  listForRequest: (requestId: number) =>
    apiClient.get<{ status: string; belongings: IBelonging[] }>(
      `/belongings/by-request/${requestId}`
    ),

  create: (body: ICreateBelongingRequest) =>
    apiClient.post<{ status: string; belonging: IBelonging }>(
      "/belongings",
      body
    ),

  update: (id: number, body: IUpdateBelongingRequest) =>
    apiClient.patch<{ status: string; belonging: IBelonging }>(
      `/belongings/${id}`,
      body
    ),

  remove: (id: number) =>
    apiClient.delete<{ status: string }>(`/belongings/${id}`),
};
