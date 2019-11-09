import fetchTogglestate from './services/fetchToguruData'
import findToggleListForService from './services/toggleListForService'
import isToggleEnabledForUser from './services/isToggleEnabled'
import { User, ToguruData } from './types/toguru'
import { Toggle, ToggleState } from './Toggle'
import { stringify } from 'qs'
import qs from 'qs'

export type ToguruClientConfig = {
    endpoint: string
    refreshIntervalMs?: number
}

export type ToguruClient = {
    isToggleEnabled: (toggle: Toggle, user: User) => boolean
    togglesForService: (service: string, user: User) => ToggleState[]
    toggleStringForService: (service: string, user: User) => string
}

export default (config: ToguruClientConfig): ToguruClient => {
    const { endpoint, refreshIntervalMs = 60000 } = config
    let toguruData: ToguruData = { sequenceNo: 0, toggles: [] }

    fetchTogglestate(endpoint).then((ts) => (toguruData = ts))

    setInterval(() => {
        fetchTogglestate(endpoint).then((ts) => (toguruData = ts))
    }, refreshIntervalMs)

    return {
        isToggleEnabled: (toggle: Toggle, { uuid, culture, forcedToggles }: User): boolean => {
            return isToggleEnabledForUser(toguruData, toggle, {
                uuid,
                culture,
                forcedToggles,
            })
        },
        togglesForService: (service: string, user: User): ToggleState[] => {
            const toggleIds = findToggleListForService(toguruData, service)
            return toggleIds.reduce((toggles, id) => {
                toggles.push({ id, enabled: isToggleEnabledForUser(toguruData, { id, default: false }, user) })
                return toggles
            }, [] as ToggleState[])
        },
        toggleStringForService: (service: string, user: User) => {
            const toggleIds = findToggleListForService(toguruData, service)
            const togglesForService: Record<string, boolean> = toggleIds.reduce((toggles, id) => {
                toggles[id] = isToggleEnabledForUser(toguruData, { id, default: false }, user)
                return toggles
            }, {} as Record<string, boolean>)
            return `toguru=${encodeURIComponent(qs.stringify(togglesForService, { delimiter: '|' }))}`
        },
    }
}
