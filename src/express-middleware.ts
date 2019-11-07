import cookie from 'cookie';
import Client from './client';
import qs from 'qs';
import setCookieParser from 'set-cookie-parser';
import { get, mapValues } from 'lodash';
import { Response, Request, NextFunction } from 'express';

const getCookieValueFromResponseHeader = (res: Response | null, cookieName: string): string | null => {
    if (!res || !res.getHeader) {
        return null;
    }

    const cookies = setCookieParser.parse(res.getHeader('set-cookie') as any);
    const cookie = cookies.find((c) => c.name === cookieName);

    return cookie ? cookie.value : null;
};

type ToguruConfig = {
    endpoint: string;
    refreshInterval: number;
    cookieName: string;
    cultureCookieName: string;
};

declare global {
    namespace Express {
        interface Request {
            toguru?: {
                isToggleEnabled: (toggleName: string) => boolean;
                togglesForService: (service: string) => Record<string, boolean>;
                toggleNamesForService: (service: string) => string[];
                toggleStringForService: (service: string) => string;
            };
        }
    }
}

/**
 * @param endpoint - endpoint to the list of toggle states
 * @param refreshInterval - interval time to fetch and update toggle state list (in ms)
 * @param cookieName - name of the cookie containing the uuid for bucketing the user
 * @param cultureCookieName - name of the cookie containing the user culture value
 */

export default ({ endpoint, refreshInterval = 60000, cookieName, cultureCookieName }: ToguruConfig) => {
    const client = Client({
        endpoint,
        refreshInterval,
    });

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cookiesRaw = get(req, 'headers.cookie', '');
            const cookies = cookie.parse(cookiesRaw);

            const uuid = cookies[cookieName] || getCookieValueFromResponseHeader(res, cookieName) || undefined;

            const culture =
                cookies[cultureCookieName] || getCookieValueFromResponseHeader(res, cultureCookieName) || undefined;

            const forcedTogglesRaw = Object.assign(
                {},
                qs.parse(cookies.toguru),
                qs.parse((req.query && req.query.toguru) || '', { delimiter: '|' }),
            );

            const forcedToggles = mapValues(forcedTogglesRaw, (v) => v === 'true');

            req.toguru = {
                isToggleEnabled: (toggleName: string) =>
                    client.isToggleEnabled(toggleName, { uuid, culture, forcedToggles }),

                togglesForService: (service: string) =>
                    client.togglesForService(service, { uuid, culture, forcedToggles }),

                toggleNamesForService: (service: string) => client.toggleNamesForService(service),

                toggleStringForService: (service: string) => {
                    const toggles = client.togglesForService(service, {
                        uuid,
                        culture,
                        forcedToggles,
                    });
                    return `toguru=${encodeURIComponent(qs.stringify(toggles, { delimiter: '|' }))}`;
                },
            };
        } catch (ex) {
            req.toguru = {
                isToggleEnabled: () => true,
                togglesForService: () => ({}),
                toggleNamesForService: () => [],
                toggleStringForService: () => '',
            };
            console.warn('Error in Toguru Client:', ex);
        } finally {
            next();
        }
    };
};
