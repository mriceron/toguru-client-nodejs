import cookie from 'cookie'
import Client, { ToguruClientConfig } from './client'
import qs from 'qs'
import setCookieParser from 'set-cookie-parser'
import { get, mapValues } from 'lodash'
import { Response, Request, NextFunction } from 'express'
import { Toggle, ToggleState } from './Toggle'
import { User } from './types/toguru'

const getCookieValueFromResponseHeader = (res: Response | null, cookieName: string): string | null => {
    if (!res || !res.getHeader) {
        return null
    }

    const cookies = setCookieParser.parse(res.getHeader('set-cookie') as any)
    const cookie = cookies.find((c) => c.name === cookieName)

    return cookie ? cookie.value : null
}

type ToguruExpressMiddlewareConfig = {
    cookieName: string
    cultureCookieName: string
} & ToguruClientConfig

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            toguru?: {
                isOn: (toggle: Toggle) => boolean
                isOff: (toggle: Toggle) => boolean
                togglesForService: (service: string) => ToggleState[]
                toggleStringForService: (service: string) => string
            }
        }
    }
}

/**
 * @param endpoint - endpoint to the list of toggle states
 * @param refreshInterval - interval time to fetch and update toggle state list (in ms)
 * @param cookieName - name of the cookie containing the uuid for bucketing the user
 * @param cultureCookieName - name of the cookie containing the user culture value
 */

export default (config: ToguruExpressMiddlewareConfig) => {
    const cookieName = config.cookieName
    const cultureCookieName = config.cultureCookieName
    const client = Client(config)

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cookiesRaw = get(req, 'headers.cookie', '')
            const cookies = cookie.parse(cookiesRaw)

            const uuid = cookies[cookieName] || getCookieValueFromResponseHeader(res, cookieName) || undefined

            const culture =
                cookies[cultureCookieName] || getCookieValueFromResponseHeader(res, cultureCookieName) || undefined

            const forcedTogglesRaw = Object.assign(
                {},
                qs.parse(cookies.toguru),
                qs.parse((req.query && req.query.toguru) || '', { delimiter: '|' }),
            )

            const forcedToggles = mapValues(forcedTogglesRaw, (v) => v === 'true')

            const user: User = { uuid, culture, forcedToggles }

            req.toguru = {
                isOn: (toggle: Toggle) => client.isToggleEnabled(toggle, user),
                isOff: (toggle: Toggle) => !client.isToggleEnabled(toggle, user),
                togglesForService: (service: string) => client.togglesForService(service, user),
                toggleStringForService: (service: string) => client.toggleStringForService(service, user),
            }
        } catch (ex) {
            req.toguru = {
                isOn: () => false,
                isOff: () => true,
                togglesForService: () => [],
                toggleStringForService: () => '',
            }
            console.warn('Error in Toguru Client:', ex)
        } finally {
            next()
        }
    }
}
