export interface IXUser {
  id: string;
  username: string;
}

export interface IXUsersResponse {
  data?: IXUser[];
}

export interface IXPost {
  id: string;
  text: string;
  created_at: string;
}

export interface IXPostsResponse {
  data?: IXPost[];
}

export interface IXErrorResponse {
  title?: string;
  detail?: string;
}
