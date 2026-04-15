/** GET `/api/Tests` — list contract. */
export interface TestListItemResponseDto {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  created: string;
}

/** GET `/api/Tests/{id}` — detail contract (same shape as list today). */
export interface TestResponseDto {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  created: string;
}

/** POST `/api/Tests` — create. */
export interface TestCreateRequestDto {
  name: string;
  description: string | null;
}

/** PUT `/api/Tests/{id}` — update. Backend also expects `id` in body. */
export interface TestUpdateRequestDto {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
}
