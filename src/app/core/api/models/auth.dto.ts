/** POST /api/Users/register */
export interface UserRegisterRequestDto {
  email: string;
  password: string;
}

/** Response when registration succeeds (align fields with backend if they differ). */
export interface UserRegisterResponseDto {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/** POST /api/Users/login */
export interface UserLoginRequestDto {
  email: string;
  password: string;
}

/** Login: JWT access in body; refresh is HttpOnly cookie `refresh_token` on `/api/Users/*`. */
export interface UserLoginResponseDto {
  accessToken: string;
  expiresIn?: number;
}

/** POST `/api/Users/refresh` — refresh cookie sent automatically with `withCredentials`. */
export type UserRefreshRequestDto = Record<string, never>;

export interface UserRefreshResponseDto {
  accessToken: string;
  expiresIn?: number;
}

/** POST /api/Users/logout — JSON `{}` */
export type UserLogoutRequestDto = Record<string, never>;

export type UserLogoutResponseDto = Record<string, never>;
