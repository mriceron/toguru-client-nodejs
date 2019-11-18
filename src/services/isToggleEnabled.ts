import calculateBucket from './calculateBuckets'
import { ToguruData, UserInfo } from '../types/toguru'
import { Toggle } from '../types/Toggle'

export default (toguruData: ToguruData, toggle: Toggle, { uuid, culture, forcedToggles }: UserInfo): boolean => {
    if (forcedToggles && toggle.id in forcedToggles) {
        return forcedToggles[toggle.id]
    }

    const toggles = toguruData.toggles
    const toggleData = toggles.find((t) => t.id === toggle.id)
    const rolloutPercentage = toggleData?.activations[0]?.rollout?.percentage || 0

    // return default if the toggle is not set
    if (!toggleData) return toggle.default
    // if the uuid is not defined then the toggle is really evaluated only if released to 100%
    const bucket = uuid ? calculateBucket(uuid, toggle.default ? 100 : 0) : 100
    const rolloutCultures = toggleData?.activations[0]?.attributes?.culture || []

    if (rolloutCultures.length > 0) {
        if (!culture || !rolloutCultures.includes(culture)) return false
    }

    if (rolloutPercentage >= bucket) {
        return true
    }

    return false
}
