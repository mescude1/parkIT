import { apiClient } from "./apiClient";
import {
  ILoginRequest,
  ILoginResponse,
  IRegisterClienteRequest,
  IRegisterValetRequest,
  IRegisterResponse,
} from "../constants/types/api";

export const authService = {
  login: (body: ILoginRequest) =>
    apiClient.post<ILoginResponse>("/autho/login", body),

  logout: () =>
    apiClient.post<{ status: string; message: string }>("/autho/logout", {}),

  registerCliente: (body: IRegisterClienteRequest) =>
    apiClient.post<IRegisterResponse>("/register/cliente", body),

  registerValet: (body: IRegisterValetRequest) =>
    apiClient.post<IRegisterResponse>("/register/valet", body),
};
