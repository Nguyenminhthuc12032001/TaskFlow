import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { BoardPage } from "../pages/board/BoardPage";
import { LeadsPage } from "../pages/leads/LeadsPage";
import { MembersPage } from "../pages/members/MembersPage";
import { CreateWorkspacePage } from "../pages/workspace/Create.page";
import { ProjectsPage } from "../pages/onboarding/ProjectsPage";
import { AppShell } from "../components/layout/AppShell";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";
import { authApi } from "../features/auth/auth.api";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { ChangePassword } from "../pages/auth/ChangePassword";
import { LoginAction } from "../features/auth/action/login";
import { RegisterAction } from "../features/auth/action/register";
import { LogoutAction } from "../features/auth/action/logout";
import { ChangePasswordAction } from "../features/workspace/action/changePassword";
import { ForgotPasswordAction } from "../features/auth/action/forgotPassword";
import { CreateWorkspaceAction } from "../features/workspace/action/create";
import { WorkspaceDetailPage } from "../pages/workspace/Detail.page";
import { GetByIdLoader } from "../features/workspace/loader/getById";
import { ListWorkspacePage } from "../pages/workspace/List.page,";
import { ListByUserLoader } from "../features/workspace/loader/listByUser";

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
            action: LogoutAction
          },
          {
            path: "change-password", element: <ChangePassword />,
            action: ChangePasswordAction
          }
        ]
      },
      {
        path: "board", element: <BoardPage />,
        children: [
          { index: true, element: <Navigate to="/board/workspaces/create" replace /> },
          { path: "workspaces/create", element: <CreateWorkspacePage />, action: CreateWorkspaceAction },
          {
            path: "workspaces/:workspaceId", element: <WorkspaceDetailPage />,
            loader: GetByIdLoader
          },
          {
            path: "workspaces", element: <ListWorkspacePage />,
            loader: ListByUserLoader
          }
        ]
      },
      { path: "leads", element: <LeadsPage /> },
      { path: "members", element: <MembersPage /> },
      { path: "workspace/create", element: <Navigate to="/board" replace /> },
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
        action: LoginAction
      },
      {
        path: "register", element: <RegisterPage />,
        action: RegisterAction,
      },
      {
        path: "forgot-password", element: <ForgotPassword />,
        action: ForgotPasswordAction
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
