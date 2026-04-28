import { apiClient } from "./apiClient";

export interface IKeyHandover {
  id: number;
  service_id: number;
  valet_id: number;
  location_label: string;
  latitude: number | null;
  longitude: number | null;
  evidence_photo: string;
  notes: string | null;
  status: "stored" | "returned";
  stored_at: string | null;
  returned_at: string | null;
}

export interface IDropoffRequest {
  service_id: number;
  location_label: string;
  evidence_photo: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export const keyHandoverService = {
  dropoff: (body: IDropoffRequest) =>
    apiClient.post<{ status: string; handover: IKeyHandover }>(
      "/keys/dropoff",
      body
    ),

  getByService: (serviceId: number) =>
    apiClient.get<{ status: string; handover: IKeyHandover | null }>(
      `/keys/by-service/${serviceId}`
    ),

  markReturned: (id: number) =>
    apiClient.post<{ status: string; handover: IKeyHandover }>(
      `/keys/${id}/return`,
      {}
    ),
};
