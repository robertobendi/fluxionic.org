import { Type, Static } from "@sinclair/typebox";

export const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
  rememberMe: Type.Optional(Type.Boolean()),
});

export type LoginInput = Static<typeof LoginSchema>;

export const CreateUserSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  role: Type.Union([Type.Literal("admin"), Type.Literal("editor")]),
});

export type CreateUserInput = Static<typeof CreateUserSchema>;

export const UserResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  role: Type.String(),
  createdAt: Type.String(),
});

export type UserResponse = Static<typeof UserResponseSchema>;

export const UserListResponseSchema = Type.Array(UserResponseSchema);
