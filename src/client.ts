import fetchTogglestate from './services/fetchToguruData'
import findToggleListForService from './services/toggleListForService'
import isToggleEnabledForUser from './services/isToggleEnabled'
import { UserInfo, ToguruData } from './types/toguru'
import { Toggle } from './types/Toggle'
import { Toggles } from './types/Toggles'
import { ToggleState } from './types/ToggleState'

export type ToguruClientConfig = {
    endpoint: string
    refreshIntervalMs?: number
}

export type ToguruClient = {
    isToggleEnabled: (toggle: Toggle, user: UserInfo) => boolean
    togglesForService: (service: string, user: UserInfo) => Toggles
}

export default (config: ToguruClientConfig): ToguruClient => {
    const { endpoint, refreshIntervalMs = 60000 } = config
    let toguruData: ToguruData = { sequenceNo: 0, toggles: [] }

    fetchTogglestate(endpoint).then((ts) => (toguruData = ts))

    setInterval(() => {
        fetchTogglestate(endpoint).then((ts) => (toguruData = ts))
    }, refreshIntervalMs)

    return {
        isToggleEnabled: (toggle: Toggle, { uuid, culture, forcedToggles }: UserInfo): boolean => {
            return isToggleEnabledForUser(toguruData, toggle, {
                uuid,
                culture,
                forcedToggles,
            })
        },
        togglesForService: (service: string, user: UserInfo): Toggles => {
            const toggleIds = findToggleListForService(toguruData, service)
            const togglesState = toggleIds.reduce((toggles, id) => {
                toggles.push({ id, enabled: isToggleEnabledForUser(toguruData, { id, default: false }, user) })
                return toggles
            }, [] as ToggleState[])
            return new Toggles(togglesState)
        },
    }
}
