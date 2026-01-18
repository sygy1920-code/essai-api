/**
 * 应用类型定义
 */

import { HttpRequest } from '@azure/functions/types/http';
import { DecodedToken } from '../middleware/auth';

export interface ApiRequest {
    user?: DecodedToken;
    method?: string;
    url?: string;
    headers: any;
    text(): Promise<string>;
    json?(): Promise<any>;
}

export interface ApiResponse {
    status?: number;
    body?: string | Record<string, any>;
    headers?: Record<string, string>;
}

export interface RouteHandler {
    (req: ApiRequest): Promise<ApiResponse>;
}

export interface Route {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: RouteHandler;
    requireAuth?: boolean;
}

export interface HttpContext {
    req: HttpRequest;
    status: number;
    state: {
        requireAuth?: boolean;
    };
    user?: DecodedToken;
    body?: any;
}
