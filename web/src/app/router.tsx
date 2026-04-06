import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { BoardPage } from "../pages/board/BoardPage";
import { LeadsPage } from "../pages/leads/LeadsPage";
import { MembersPage } from "../pages/members/MembersPage";
import { CreateWorkspacePage } from "../pages/onboarding/CreateWorkspacePage";
import { ProjectsPage } from "../pages/onboarding/ProjectsPage";
import { AppShell } from "../components/layout/AppShell";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";
import { authApi } from "../features/auth/auth.api";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { ChangePassword } from "../pages/auth/ChangePassword";

export const router = createBrowserRouter([
  {
    path: "/",
    element:
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/board" replace /> },
      {
        path: "auth", element: <AuthLayout />,
        children: [
          { index: true, element: <Navigate to="/" replace /> },
          {
            path: "logout",
            action: async () => {
              await authApi.logout();
              return redirect("/auth/login")
            }
          },
          {
            path: "change-password", element: <ChangePassword />,
            action: async ({ request }) => {
              const formData = await request.formData();

              const data: unknown = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
              }

              await authApi.changePassword(data);
            }
          }
        ]
      },
      { path: "board", element: <BoardPage /> },
      { path: "leads", element: <LeadsPage /> },
      { path: "members", element: <MembersPage /> },
      { path: "workspace/create", element: <CreateWorkspacePage /> },
      { path: "projects", element: <ProjectsPage /> },
    ],
  },
  {
    path: "/auth",
    element:
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      {
        path: "login", element: <LoginPage />,
        action: async ({ request }) => {
          const formData = await request.formData();

          const data: unknown = {
            email: formData.get('email'),
            password: formData.get('password'),
          }

          await authApi.login(data);

          return redirect("/")
        }
      },
      {
        path: "register", element: <RegisterPage />,
        action: async ({ request }) => {
          const formData = await request.formData();

          if (formData.get('password') !== formData.get('confirmPassword')) {
            throw new Error('passwords do not match');
            // Need to handle this error properly in the UI
          }

          const data: unknown = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
          }

          await authApi.register(data);

          return redirect("/")
        },
      },
      {
        path: "forgot-password", element: <ForgotPassword />,
        action: async ({ request }) => {
          const formData = await request.formData();

          const data: unknown = {
            email: formData.get('email'),
          }

          await authApi.forgotPassword(data);

          return redirect("/auth/login")
        }
      },
      {
        path: "reset-password", element: <ResetPassword />,
        action: async ({ request }) => {
          const formData = await request.formData();

          const data: unknown = {
            resetToken: formData.get('resetToken'),
            newPassword: formData.get('newPassword'),
          }

          await authApi.resetPassword(data);

          return redirect("/auth/login")
        }
      },
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
