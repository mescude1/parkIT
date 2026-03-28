import { apiClient } from "./apiClient";
import {
  IVerifyEmailRequest,
  IResendCodeRequest,
} from "../constants/types/api";

export const verificationService = {
  verifyEmail: (body: IVerifyEmailRequest) =>
    apiClient.post<{ status: string; message: string }>(
      "/verification/verify-email",
      body
    ),

  resendCode: (body: IResendCodeRequest) =>
    apiClient.post<{ status: string; message: string }>(
      "/verification/resend-code",
      body
    ),
};
