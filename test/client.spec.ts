import Client from '../src/client'

const userInBucket22CultureDE = {
    culture: 'de-DE',
    uuid: '88248687-6dce-4759-a5c0-3945eedc2b48',
} // bucket: 22
const userInBucketb76CultureDE = {
    culture: 'de-DE',
    uuid: '721f87e2-cec9-4753-b3bb-d2ebe20dd317',
} // bucket: 76
const userInBucket22CultureIT = {
    culture: 'it-IT',
    uuid: '88248687-6dce-4759-a5c0-3945eedc2b48',
} // bucket: 22

import mockedTogglestate from './togglestate.fixture.json'
import { Toggles } from '../src/types/Toggles'

jest.mock('axios', () => {
    return jest.fn().mockImplementation(() => Promise.resolve({ data: mockedTogglestate }))
})

describe('Toguru Client Usage', () => {
    test('Basic usage', async () => {
        const client = Client({
            endpoint: 'https://example.com/togglestate',
            refreshIntervalMs: 60 * 1000,
        })

        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(client.isToggleEnabled({ id: 'not-defined', default: false }, userInBucket22CultureDE)).toBe(false)
        expect(
            client.isToggleEnabled(
                { id: 'rolled-out-to-noone', default: false },
                {
                    ...userInBucket22CultureDE,
                    forcedToggles: { 'rolled-out-to-noone': true },
                },
            ),
        ).toBe(true)
        expect(client.isToggleEnabled({ id: 'rolled-out-to-everyone', default: false }, userInBucketb76CultureDE)).toBe(
            true,
        )
        expect(client.isToggleEnabled({ id: 'rolled-out-only-in-de', default: false }, userInBucket22CultureIT)).toBe(
            false,
        )
        expect(
            client.isToggleEnabled({ id: 'rolled-out-to-half-in-de-only', default: false }, userInBucket22CultureDE),
        ).toBe(true)
        expect(
            client.isToggleEnabled({ id: 'rolled-out-to-half-in-de-only', default: false }, userInBucket22CultureIT),
        ).toBe(false)
    })

    it('Advanced features', async () => {
        const client = Client({
            endpoint: 'https://example.com/togglestate',
            refreshIntervalMs: 60 * 1000,
        })

        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(client.togglesForService('service2', userInBucket22CultureDE)).toEqual(
            new Toggles([
                { id: 'rolled-out-to-half-in-de-only', enabled: true },
                { id: 'rolled-out-to-noone', enabled: false },
            ]),
        )
    })
})
