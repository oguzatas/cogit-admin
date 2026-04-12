/** POST /api/Users/register */
export interface UserRegisterRequestDto {
  email: string;
  password: string;
}

/** Response when registration succeeds (align fields with backend if they differ). */
export interface UserRegisterResponseDto {
  accessToken?: string;
  refreshToken?: string;
}

/** POST /api/Users/login */
export interface UserLoginRequestDto {
  email: string;
  password: string;
}

export interface UserLoginResponseDto {
  accessToken: string;
  refreshToken: string;
}

/** POST /api/Users/refresh */
export interface UserRefreshRequestDto {
  refreshToken: string;
}

export interface UserRefreshResponseDto {
  accessToken: string;
  refreshToken?: string;
}

/** POST /api/Users/logout — JSON `{}` */
export type UserLogoutRequestDto = Record<string, never>;

export type UserLogoutResponseDto = Record<string, never>;
