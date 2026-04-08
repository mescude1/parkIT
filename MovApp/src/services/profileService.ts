import { apiClient } from "./apiClient";
import { IApiUser, IEditProfileRequest } from "../constants/types/api";

export const profileService = {
  getProfile: () =>
    apiClient.get<{ status: string; message: string; user: IApiUser }>(
      "/profile/user-profile"
    ),

  editProfile: (body: IEditProfileRequest) =>
    apiClient.post<{ status: string; message: string }>(
      "/profile/edit-profile",
      body
    ),
};
