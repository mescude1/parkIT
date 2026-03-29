import { apiClient } from "./apiClient";
import {
  IRequestServiceRequest,
  IRequestServiceResponse,
  IValetRequest,
  IAcceptRequestResponse,
  ILocationPoint,
  IServiceActionRequest,
  IServiceActionResponse,
  ITrip,
} from "../constants/types/api";

const PAGE_SIZE_DEFAULT = 10;

export const valetService = {
  requestService: (body: IRequestServiceRequest) =>
    apiClient.post<IRequestServiceResponse>("/valet/request", body),

  getRequestStatus: (requestId: number) =>
    apiClient.get<IValetRequest>(`/valet/request/${requestId}`),

  cancelRequest: (requestId: number) =>
    apiClient.post<{ message: string; request_id: number }>(
      `/valet/request/${requestId}/cancel`,
      {}
    ),

  acceptRequest: (requestId: number, body: IRequestServiceRequest) =>
    apiClient.post<IAcceptRequestResponse>(
      `/valet/request/${requestId}/accept`,
      body
    ),

  updateLocation: (body: IRequestServiceRequest) =>
    apiClient.post<{ message: string }>("/valet/location/update", body),

  getLocation: (userId: number) =>
    apiClient.get<ILocationPoint>(`/valet/location/${userId}`),

  endService: (body: IServiceActionRequest) =>
    apiClient.post<IServiceActionResponse>("/valet/end-service", body),

  fetchServiceHistory: (
    page: number,
    pageSize: number = PAGE_SIZE_DEFAULT
  ): Promise<ITrip[]> => {
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
