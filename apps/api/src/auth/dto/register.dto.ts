// RegisterDto — validated by Zod in AuthService, type mirrors registerSchema
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
