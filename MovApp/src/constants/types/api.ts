// Backend-aligned types — matches the Flask API response shapes exactly.
// Kept separate from the UI-oriented IUser in index.ts.

export interface IApiUser {
  id: number;
  username: string;
  name: string;
  last_name: string;
  email: string;
  cellphone: string;
  type: "valet" | "cliente";
  profile_img: string;
  id_img: string;
  driver_license_img: string | null;
  contract: string | null;
  vehicle_type: string | null;
  created_at: string;
  is_deleted: boolean;
  is_verified: boolean;
  valet_code: string | null;
  institutional_email: string | null;
  institutional_email_verified: boolean | null;
}

// Auth
export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  data: {
    user: IApiUser;
    access_token: string;
  };
}

// Registration
export interface IRegisterClienteRequest {
  name: string;
  last_name: string;
  username: string;
  password: string;
  email: string;
  institutional_email: string;
  cellphone: string;
  profile_img: string;
  id_img: string;
}

export interface IRegisterValetRequest {
  name: string;
  last_name: string;
  username: string;
  password: string;
  email: string;
  cellphone: string;
  vehicle_type: string;
  profile_img: string;
  id_img: string;
  driver_license_img: string;
}

export interface IRegisterResponse {
  status: string;
  message: string;
  data: IApiUser;
}

// Email verification
export interface IVerifyEmailRequest {
  user_id: number;
  code: string;
}

export interface IResendCodeRequest {
  user_id: number;
}

// Valet service
export interface IRequestServiceRequest {
  latitude: number;
  longitude: number;
}

export interface IRequestServiceResponse {
  request_id: number;
  status: string;
  nearby_valets_notified: number;
}

export interface ILocationPoint {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  type: string;
}

export interface IValetRequest {
  id: number;
  client_id: number;
  latitude: number;
  longitude: number;
  status: "pending" | "accepted" | "cancelled" | "expired";
  accepted_by: number | null;
  service_id: number | null;
  created_at: string;
  valet_location?: ILocationPoint;
}

export interface IAcceptRequestResponse {
  service_id: number;
  request_id: number;
  message: string;
  client_location: ILocationPoint;
}

export interface IServiceActionRequest {
  service_id: number;
}

export interface IServiceActionResponse {
  status: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface IDeviceTokenRequest {
  token: string;
}

// Profile editing
export interface IEditProfileRequest {
  name?: string;
  last_name?: string;
  email?: string;
  cellphone?: string;
  profile_img?: string;
  vehicle_type?: string;
}

// Service history
export interface IServiceHistoryItem {
  id: number;
  date: string;
  counterpart_name: string;
  is_finished: boolean;
  price: string;
}

export interface IServiceHistoryResponse {
  status: string;
  services: IServiceHistoryItem[];
  page: number;
  total_pages: number;
  has_next: boolean;
}

// Vehicle
export interface IVehicle {
  id: number;
  model: string;
  brand: string;
  license_plate: string;
  year: number;
  type: string;
  color?: string | null;
  vehicle_img?: string | null;
  proof_insurance_img?: string | null;
  property_card?: string | null;
  policy_number?: string | null;
  insurance_expiration?: string | null;
}

export interface ICreateVehicleRequest {
  model: string;
  brand: string;
  license_plate: string;
  year: number;
  type: string;
  color?: string | null;
  vehicle_img?: string | null;
  proof_insurance_img?: string | null;
  property_card?: string | null;
  policy_number?: string | null;
  insurance_expiration?: string | null;
}

// Chat
export interface IConversation {
  id: number;
  user_id: number;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface IChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_role: "user" | "agent";
  message: string;
  created_at: string;
}

// Trip — used for history lists
export interface ITrip {
  id: string | number;
  date: string;
  driver: string;
  price: string;
}
