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
  message: string;
  drivers?: number[];
}

export interface IStartServiceRequest {
  target_user_id: number;
}

export interface IStartServiceResponse {
  message: string;
  service_id: number;
  user_location: { latitude: number; longitude: number };
  target_location: { latitude: number; longitude: number };
  eta_minutes: number;
  fixed_price: number;
}

export interface IServiceActionRequest {
  service_id: number;
}

export interface IServiceActionResponse {
  status: string;
  message: string;
  details?: Record<string, unknown>;
}

// Trip — used for history lists
export interface ITrip {
  id: string | number;
  date: string;
  driver: string;
  price: string;
}
