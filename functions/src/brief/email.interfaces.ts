export interface IRenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface IEmailRecipient {
  email: string;
  displayName: string;
}

export interface ISendOutcome {
  sent: boolean;
  messageId?: string;
  warning?: string;
}

export interface IResendSuccessResponse {
  id: string;
}

export interface IResendErrorResponse {
  name?: string;
  message?: string;
  statusCode?: number;
}
