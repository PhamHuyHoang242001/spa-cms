// LoginDto — validated by Zod in AuthService, type mirrors loginSchema
export interface LoginDto {
  email: string;
  password: string;
}
