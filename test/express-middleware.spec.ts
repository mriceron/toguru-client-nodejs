import { Request, NextFunction, Response } from 'express'
import expressMiddleware from '../src/express-middleware'
import mockedTogglestate from './togglestate.fixture.json'
import { fromCookie, defaultForcedTogglesExtractor } from '../src/expressMiddleware/extractors'
import { Toggle } from '../src/types/Toggle'
import { Toggles } from '../src/types/Toggles'

let clientRefreshRes: (_: void) => void
jest.mock('axios', () => {
    return jest.fn().mockImplementation(() => {
        clientRefreshRes()
        return Promise.resolve({ data: mockedTogglestate })
    })
})

const sendRequest = async ({
    uuid,
    culture,
    query,
}: {
    uuid: string
    culture: string
    query: Record<string, string>
}) => {
    const fakeRequest: Request = {
        headers: {
            cookie: `uid=${uuid};culture=${culture}`,
        },
        query: query || {},
    } as Request

    const fakeNext = jest.fn<NextFunction, []>()

    const clientReady = new Promise((res) => {
        clientRefreshRes = res
    })

    const middleWare = expressMiddleware({
        client: { endpoint: 'endpoint', refreshIntervalMs: 100000 },
        uuidExtractor: fromCookie('uid'),
        attributeExtractors: [{ attribute: 'culture', extractor: fromCookie('culture') }],
        forceTogglesExtractor: defaultForcedTogglesExtractor,
    })

    await clientReady

    await middleWare(fakeRequest, {} as Response, fakeNext)

    return fakeRequest
}

const toggles: Record<string, Toggle> = {
    rolledOutToEveryone: { id: 'rolled-out-to-everyone', default: false },
    rolledOutToHalfInDeOnly: { id: 'rolled-out-to-half-in-de-only', default: false },
    rolledOutToNone: { id: 'rolled-out-to-noone', default: false },
}

const userInBucket22CultureDE = {
    culture: 'de-DE',
    uuid: '88248687-6dce-4759-a5c0-3945eedc2b48',
    query: {},
} // bucket: 22
const userInBucketb76CultureDE = {
    culture: 'de-DE',
    uuid: '721f87e2-cec9-4753-b3bb-d2ebe20dd317',
    query: {},
} // bucket: 76
const userInBucket22CultureIT = {
    culture: 'it-IT',
    uuid: '88248687-6dce-4759-a5c0-3945eedc2b48',
    query: {},
} // bucket: 22

describe('Express middleware', () => {
    it('userInBucket22CultureDE', async () => {
        const req = await sendRequest(userInBucket22CultureDE)
        expect(req.toguru).toBeDefined()
        if (req.toguru) {
            expect(req.toguru.isToggleEnabled(toggles.rolledOutToEveryone)).toBe(true)
            expect(req.toguru.isToggleEnabled(toggles.rolledOutToHalfInDeOnly)).toBe(true)
        }
    })

    it('userInBucketb76CultureDE', async () => {
        const req = await sendRequest(userInBucketb76CultureDE)
        expect(req.toguru).toBeDefined()
        if (req.toguru) {
            expect(req.toguru.isToggleEnabled(toggles.rolledOutToNone)).toBe(false)
            expect(req.toguru.isToggleEnabled(toggles.rolledOutToHalfInDeOnly)).toBe(false)
        }
    })

    it('togglesForService 1', async () => {
        const req = await sendRequest(userInBucket22CultureDE)
        expect(req.toguru).toBeDefined()
        if (req.toguru) {
            expect(req.toguru.togglesForService('service2')).toEqual(
                new Toggles([
                    {
                        id: 'rolled-out-to-half-in-de-only',
                        enabled: true,
                    },
                    {
                        id: 'rolled-out-to-noone',
                        enabled: false,
                    },
                ]),
            )
        }
    })

    it('togglesForService 2', async () => {
        const req = await sendRequest(userInBucket22CultureIT)
        expect(req.toguru).toBeDefined()
        if (req.toguru) {
            expect(req.toguru.togglesForService('service2')).toEqual(
                new Toggles([
                    {
                        id: 'rolled-out-to-half-in-de-only',
                        enabled: false,
                    },
                    {
                        id: 'rolled-out-to-noone',
                        enabled: false,
                    },
                ]),
            )
        }
    })

    it('toggleStringForService', async () => {
        const req = await sendRequest(userInBucket22CultureIT)
        expect(req.toguru).toBeDefined()
        if (req.toguru) {
            expect(req.toguru.togglesForService('service2').queryString()).toEqual(
                'toguru=rolled-out-to-half-in-de-only%3Dfalse%7Crolled-out-to-noone%3Dfalse',
            )
        }
    })

    it('Forced toggles', async () => {
        const req = await sendRequest({
            ...userInBucketb76CultureDE,
            query: {
                toguru: 'rolled-out-to-noone=true|rolled-out-to-half-in-de-only=true',
            },
        })
        expect(req.toguru).toBeDefined()
        if (req.toguru) {
            expect(req.toguru.isToggleEnabled(toggles.rolledOutToNone)).toBe(true)
            expect(req.toguru.isToggleEnabled(toggles.rolledOutToHalfInDeOnly)).toBe(true)
        }
    })
})
