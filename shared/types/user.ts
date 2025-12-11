export interface User {
  id: string | number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

