import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { BoardPage } from "../pages/board/BoardPage";
import { LeadsPage } from "../pages/leads/LeadsPage";
import { MembersPage } from "../pages/members/MembersPage";
import { CreateWorkspacePage } from "../pages/workspace/Create.page";
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
import { WorkspaceDetailPage } from "../pages/workspace/detail/Detail.page";
import { GetByIdLoader } from "../features/workspace/loader/getById";
import { ListWorkspacePage } from "../pages/workspace/List.page";
import { ListByUserLoader } from "../features/workspace/loader/listByUser";
import { ListMemberPage } from "../pages/workspace/ListMember.page";
import { ListMemberLoader } from "../features/workspace/loader/listMember";
import { InviteAction } from "../features/workspace/action/invite";
import { InvitePage } from "../pages/workspace/Invite.page";
import { InviteCandidatesLoader } from "../features/workspace/loader/inviteCandidates";
import { AcceptInvitePage } from "../pages/workspace/Accept.page";
import { AcceptInviteAction } from "../features/workspace/action/accept";
import { UpdateWorkspaceAction } from "../features/workspace/action/update";
import { CreateProjectPage } from "../pages/workspace/project/Create.page";
import { CreateProjectAction } from "../features/project/action/create.action";
import { ProjectsByWorkspaceLoader } from "../features/project/loader/listByWorkspace.loader";
import { ProjectsPage } from "../pages/workspace/project/Project.page";
import { ListProjectsPage } from "../pages/workspace/project/List.page";
import { ProjectPage } from "../pages/workspace/project/detail/Detail.page";
import { ProjectByIdLoader } from "../features/project/loader/getById.loader";
import { UpdateProjectAction } from "../features/project/action/update.action";
import { ProjectOverviewPage } from "../pages/workspace/project/detail/OverView.page";
import { ListColumnPage } from "../pages/workspace/project/Column/List.page";
import { ListByProjectLoader } from "../features/column/loader/listByProject.loader";
import { ReOrderColumnAction } from "../features/column/action/reOrder.action";
import { UpdateColumnAction } from "../features/column/action/update.action";
import { CreateColumnPage } from "../pages/workspace/project/Column/Create.page";
import { CreateColumnAction } from "../features/column/action/create.action";
import { ColumnPage } from "../pages/workspace/project/Column/Column.page";
import { ListTaskPage } from "../pages/workspace/project/Column/task/List.page";
import { ListByColumnLoader } from "../features/task/loader/listByColumn.loader";
import { CreateTaskAction } from "../features/task/action/create.action";
import { CreateTaskPage } from "../pages/workspace/project/Column/task/Create.page";
import { DetailColumnPage } from "../pages/workspace/project/Column/Detail.page";
import { GetColumnByIdLoader } from "../features/column/loader/getById.loader";
import { ReorderTaskAction } from "../features/task/action/reorder.action";
import { AssignTaskAction } from "../features/task/action/assign.action";
import { TaskPage } from "../pages/workspace/project/Column/task/Task.page";
import { GetTaskByIdLoader } from "../features/task/loader/getById.loader";
import { UpdateTaskAction } from "../features/task/action/update.action";
import { TaskDetailPage } from "../pages/workspace/project/Column/task/Detail.page";
import { CommentPage } from "../pages/workspace/project/Column/task/comment/Comment.page";
import { ListCommentPage } from "../pages/workspace/project/Column/task/comment/List.page";
import { ListByTaskLoader } from "../features/comment/loader/listByTask.loader";
import { CreateCommentAction } from "../features/comment/action/create.action";
import { GetCommentByIdLoader } from "../features/comment/loader/getById.loader";
import { ReplyCommentAction } from "../features/comment/action/reply.action";
import { UpdateCommentAction } from "../features/comment/action/update.action";
import { ListLeadByWorkspaceLoader } from "../features/lead/loader/listByWorkspace.loader";
import { ListLeadByUserWorkspacesLoader } from "../features/lead/loader/listByUserWorkspaces.loader";
import { CreateLeadAction } from "../features/lead/action/create.action";
import { GetLeadByIdLoader } from "../features/lead/loader/getById.loader";
import { UpdateLeadAction } from "../features/lead/action/update.action";
import { UpdateLeadStageAction } from "../features/lead/action/updateStage.action";
import { LinkTaskAction } from "../features/lead/action/linkTask.action";
import { UnLinkTaskAction } from "../features/lead/action/unLinkTask.action";
import { CreateFollowUpTaskAction } from "../features/lead/action/createFollowUpTask.action";
import { ListLeadPage } from "../pages/leads/List.page";
import { CreateLeadPage } from "../pages/leads/Create.page";
import { DetailLeadPage } from "../pages/leads/Detail.page";
import { UpdateLeadSection } from "../pages/leads/section/Update.section";
import { UpdateLeadStageSection } from "../pages/leads/section/UpdateLeadStage.section";
import { LinkTaskPage } from "../pages/leads/LinkTask.page";
import { UnlinkTaskSection } from "../pages/leads/section/UnLinkTask.section";
import { CreateFollowUpTaskPage } from "../pages/leads/CreateFollowUpTask.page";

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
          { index: true, element: <Navigate to="/board/workspaces" replace /> },
          { path: "workspaces/create", element: <CreateWorkspacePage />, action: CreateWorkspaceAction },
          {
            id: "workspace-detail",
            path: "workspaces/:workspaceId", element: <WorkspaceDetailPage />,
            action: UpdateWorkspaceAction,
            loader: GetByIdLoader,
            children: [
              //{ index: true, element: <Navigate to="/board" replace /> },
              {
                path: "leads", element: <LeadsPage />,
                children: [
                  {
                    index: true, element: <ListLeadPage />,
                    loader: ListLeadByWorkspaceLoader
                  },
                  {
                    path: "create", element: <CreateLeadPage />,
                    action: CreateLeadAction
                  }, {
                    path: ":leadId", element: <DetailLeadPage />,
                    loader: GetLeadByIdLoader,
                    children: [
                      {
                        path: "update", element: <UpdateLeadSection />,
                        action: UpdateLeadAction
                      },
                      {
                        path: "updateStage", element: <UpdateLeadStageSection />,
                        action: UpdateLeadStageAction
                      },
                      {
                        path: "linkTask", element: <LinkTaskPage />
                      },
                      {
                        path: ":taskId/linkTask",
                        action: LinkTaskAction
                      },
                      {
                        path: ":taskId/unlinkTask", element: <UnlinkTaskSection />,
                        action: UnLinkTaskAction
                      }, 
                      {
                        path: "follow-up/:projectId/:columnId", element: <CreateFollowUpTaskPage />,
                        action: CreateFollowUpTaskAction
                      }
                    ]
                  }
                ]
              },
              {
                path: "members", element: <ListMemberPage />,
                loader: ListMemberLoader
              },
              {
                path: "invite", element: <InvitePage />,
                loader: InviteCandidatesLoader,
                action: InviteAction
              },
              {
                path: "projects", element: <ProjectsPage />,
                children: [
                  {
                    index: true, element: <ListProjectsPage />,
                    loader: ProjectsByWorkspaceLoader
                  },
                  {
                    path: "new", element: <CreateProjectPage />,
                    action: CreateProjectAction
                  },
                  {
                    id: "project-detail",
                    path: ":projectId", element: <ProjectPage />,
                    loader: ProjectByIdLoader,
                    action: UpdateProjectAction,
                    children: [
                      {
                        index: true, element: <ProjectOverviewPage />,
                      },
                      {
                        path: "columns", element: <ColumnPage />,
                        children: [
                          {
                            index: true, element: <ListColumnPage />,
                            loader: ListByProjectLoader,
                            action: ReOrderColumnAction,
                          },
                          {
                            path: ":columnId",
                            element: <DetailColumnPage />,
                            loader: GetColumnByIdLoader,
                            children: [
                              {
                                path: "rename",
                                action: UpdateColumnAction
                              },
                              {
                                path: "tasks",
                                element: <TaskPage />,
                                children: [
                                  {
                                    index: true, element: <ListTaskPage />,
                                    loader: ListByColumnLoader,
                                    action: ReorderTaskAction,
                                  },
                                  {
                                    path: "create",
                                    element: <CreateTaskPage />,
                                    action: CreateTaskAction
                                  },
                                  {
                                    path: ":taskId",
                                    element: <TaskDetailPage />,
                                    loader: GetTaskByIdLoader,
                                    action: UpdateTaskAction,
                                    children: [
                                      {
                                        path: "assign",
                                        action: AssignTaskAction
                                      },
                                      {
                                        path: "comment",
                                        element: <CommentPage />,
                                        children: [
                                          {
                                            index: true,
                                            element: <ListCommentPage />,
                                            loader: ListByTaskLoader
                                          },
                                          {
                                            path: "create",
                                            action: CreateCommentAction
                                          },
                                          {
                                            path: ":commentId",
                                            loader: GetCommentByIdLoader,
                                            children: [
                                              {
                                                path: "reply",
                                                action: ReplyCommentAction
                                              },
                                              {
                                                path: "update",
                                                action: UpdateCommentAction
                                              }
                                            ]
                                          },
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            path: "create", element: <CreateColumnPage />,
                            action: CreateColumnAction
                          }
                        ]
                      },
                    ]
                  }
                ]
              },
            ]
          },
          {
            path: "workspaces", element: <ListWorkspacePage />,
            loader: ListByUserLoader
          },
        ]
      },
      {
        path: "accept-invite", element: <AcceptInvitePage />,
        action: AcceptInviteAction
      },
      {
        path: "leads", element: <LeadsPage />,
        children: [
          {
            index: true, element: <ListLeadPage />,
            loader: ListLeadByUserWorkspacesLoader
          }
        ]
      },
      { path: "members", element: <MembersPage /> },
      { path: "workspace/create", element: <Navigate to="/board" replace /> },
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
