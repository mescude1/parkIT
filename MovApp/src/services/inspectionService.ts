import { apiClient } from "./apiClient";

export interface IVehicleInspection {
  id: number;
  service_id: number;
  captured_by: number;
  stage: "before" | "after";
  photos: string[];
  notes: string | null;
  created_at: string;
}

export interface ISpeedAlert {
  id: number;
  service_id: number;
  valet_id: number;
  speed_kmh: number;
  speed_limit_kmh: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface ICreateInspectionRequest {
  service_id: number;
  stage: "before" | "after";
  photos: string[];
  notes?: string;
}

export interface ISpeedAlertRequest {
  service_id: number;
  speed_kmh: number;
  latitude?: number;
  longitude?: number;
}

export const inspectionService = {
  create: (body: ICreateInspectionRequest) =>
    apiClient.post<{ status: string; inspection: IVehicleInspection }>(
      "/inspection",
      body
    ),

  listForService: (serviceId: number) =>
    apiClient.get<{
      status: string;
      inspections: IVehicleInspection[];
      speed_alerts: ISpeedAlert[];
    }>(`/inspection/by-service/${serviceId}`),

  reportSpeed: (body: ISpeedAlertRequest) =>
    apiClient.post<unknown>("/inspection/speed-alert", body),
};
