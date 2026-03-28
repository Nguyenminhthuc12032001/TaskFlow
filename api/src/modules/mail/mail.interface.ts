export interface IEmailService {
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
  sendInviteEmail(email: string, workspaceName: string, inviteLink: string): Promise<void>;
}
