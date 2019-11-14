import calculateBucket from './calculateBuckets'
import { ToguruData, UserInfo } from '../types/toguru'
import { Toggle } from '../types/Toggle'

export default (toggleState: ToguruData, toggle: Toggle, { uuid, culture, forcedToggles }: UserInfo): boolean => {
    if (forcedToggles && toggle.id in forcedToggles) {
        return forcedToggles[toggle.id]
    }
    // immediately return if uuid is not defined and the toggle not forced
    if (!uuid) return toggle.default
    const toggles = toggleState.toggles
    const toggleData = toggles.find((t) => t.id === toggle.id)
    // return default if the toggle is not set
    if (!toggleData) return toggle.default
    const bucket = calculateBucket(uuid, toggle.default ? 100 : 0)

    const rolloutCultures = toggleData?.activations[0]?.attributes?.culture || []

    if (rolloutCultures.length > 0) {
        if (!culture || !rolloutCultures.includes(culture)) return false
    }

    const rolloutPercentage = toggleData?.activations[0]?.rollout?.percentage || 0
    if (rolloutPercentage >= bucket) {
        return true
    }

    return false
}
