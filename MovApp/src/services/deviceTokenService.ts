import { apiClient } from "./apiClient";
import { IDeviceTokenRequest } from "../constants/types/api";

export const deviceTokenService = {
  register: (body: IDeviceTokenRequest) =>
    apiClient.post<{ message: string }>("/device-token/register", body),

  unregister: (body: IDeviceTokenRequest) =>
    apiClient.delete<{ message: string }>("/device-token/unregister", body),
};
