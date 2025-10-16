import { z } from "zod";

/**
 * Schema for login form validation
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema for register form validation
 */
export const registerSchema = z
  .object({
    email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
    password: z
      .string()
      .min(8, "Hasło musi mieć przynajmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać przynajmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema for forgot password form validation
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema for reset password form validation
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć przynajmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać przynajmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for creating a new user (admin only)
 */
export const createUserSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(6, "Hasło musi mieć przynajmniej 6 znaków"),
  role: z.enum(["ADMIN", "WRITE", "READ"], {
    required_error: "Rola jest wymagana",
  }),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

/**
 * Schema for updating user role (admin only)
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "WRITE", "READ"], {
    required_error: "Rola jest wymagana",
  }),
});

export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;
