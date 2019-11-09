import { Request, Response, NextFunction } from 'express'
import { Toggle, ToggleState } from './src/Toggle'

// Type definitions for toguru-client
// Project: Scout24/toguru-client-nodejs
// Definitions by: Scout24 https://github.com/Scout24

declare global {
    namespace Express {
        interface Request {
            toguru?: ToguruMiddleware.RequestToguruClient;
        }
    }
}

declare function ToguruMiddleware(
    toguruClientParams: ToguruMiddleware.ToguruMiddlewareParams,
): ToguruMiddleware.ToguruMiddlewareInstance;

declare namespace ToguruMiddleware {
    export interface ToguruMiddlewareParams {
        endpoint: string;
        refreshInterval: number;
        cookieName: string;
        cultureCookieName: string;
    }
    export type ToguruMiddlewareInstance = (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => Promise<RequestToguruClient>;

    export interface RequestToguruClient {
        isOn: (toggle: Toggle) => boolean;
        isOff: (toggle: Toggle) => boolean;
        togglesForService: (service: string) => ToggleState[];
        toggleStringForService: (service: string) => string;
    }
}

export = ToguruMiddleware;
