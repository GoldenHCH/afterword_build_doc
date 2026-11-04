import { IInvalidRequest, IValidRequest } from './mcp.interfaces';

export type RequestValidation<TValue> = IValidRequest<TValue> | IInvalidRequest;
