import { apiClient } from "./apiClient";
import {
  IRequestServiceRequest,
  IRequestServiceResponse,
  IStartServiceRequest,
  IStartServiceResponse,
  IServiceActionRequest,
  IServiceActionResponse,
  ITrip,
} from "../constants/types/api";

const PAGE_SIZE_DEFAULT = 10;

export const valetService = {
  requestService: (body: IRequestServiceRequest) =>
    apiClient.post<IRequestServiceResponse>("/valet/request-service", body),

  startService: (body: IStartServiceRequest) =>
    apiClient.post<IStartServiceResponse>("/valet/start-service", body),

  endService: (body: IServiceActionRequest) =>
    apiClient.post<IServiceActionResponse>("/valet/end-service", body),

  cancelService: (body: IServiceActionRequest) =>
    apiClient.post<IServiceActionResponse>("/valet/cancel-service", body),

  preServicePhoto: (body: { photo_url: string; service_id: number }) =>
    apiClient.post<IServiceActionResponse>("/valet/pre-service-photo", body),

  postServicePhoto: (body: { photo_url: string; service_id: number }) =>
    apiClient.post<IServiceActionResponse>("/valet/post-service-photo", body),

  keyPhoto: (body: { photo_url: string; service_id: number }) =>
    apiClient.post<IServiceActionResponse>("/valet/key-photo", body),

  // Stub — replace the commented line with the real endpoint when available
  fetchServiceHistory: (
    page: number,
    pageSize: number = PAGE_SIZE_DEFAULT
  ): Promise<ITrip[]> => {
    // return apiClient.get<ITrip[]>(`/valet/history?page=${page}&size=${pageSize}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const trips = Array.from({ length: pageSize }, (_, index) => ({
          id: `${page * pageSize + index + 1}`,
          date: `2024-04-${((index % 30) + 1).toString().padStart(2, "0")}`,
          driver: `Driver ${page * pageSize + index + 1}`,
          price: `$${(Math.random() * 200 + 50).toFixed(2)}`,
        }));
        resolve(trips);
      }, 1000);
    });
  },
};
