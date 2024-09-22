import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username or Email is required" })
    .refine(
      (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
        /^[a-zA-Z0-9]+$/.test(value),
      { message: "Invalid username or email format" }
    ),
  password: z.string().min(1, { message: "Password is required" }),
});

export const organizationDetailsSchema = z.object({
  name: z.string().min(1, "Company Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{10}$/, "Invalid phone number"),
  website: z.string().optional(),
  logo: z.any().optional(),
  description: z.string().min(1, "Description is required"),
});

// Zod schema for step 2 (Address details)
export const addressDetailsSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  pincode: z.string().min(1, "Pincode is required"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

export const superAdminSchema = z
  .object({
    firstname: z.string().min(1, { message: "Firstname is required" }),
    lastname: z.string().min(1, { message: "Lastname is required" }),
    username: z.string().min(1, { message: "Username is required" }),
    email: z
      .string()
      .email({ message: "Invalid email address" })
      .min(1, { message: "Email is required" }),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmpassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters long"),
    employee_id: z.string().min(1, { message: "Employee ID is required" }),
    phone_number: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .optional(),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: "Passwords don't match",
    path: ["confirmpassword"],
  });

export const superAdminSchemaWithOTP = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 characters long" }),
  ...superAdminSchema.shape,
});