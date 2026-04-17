import { apiClient } from "./apiClient";
import { IVehicle, ICreateVehicleRequest } from "../constants/types/api";

export const vehicleService = {
  getAll: () =>
    apiClient.get<{ status: string; vehicles: IVehicle[] }>("/vehicles/vehicles"),

  getOne: (id: number) =>
    apiClient.get<{ status: string; vehicle: IVehicle }>(`/vehicles/vehicle/${id}`),

  create: (body: ICreateVehicleRequest) =>
    apiClient.post<{ status: string; vehicle_id: number }>("/vehicles/new-vehicle", body),

  update: (id: number, body: Partial<IVehicle>) =>
    apiClient.post<{ status: string; message: string }>(`/vehicles/edit-vehicle/${id}`, body),
};
