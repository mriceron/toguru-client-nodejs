import calculateBucket from './calculateBuckets'
import { ToguruData, User } from '../types/toguru'
import { Toggle } from '../Toggle'

export default (toggleState: ToguruData, toggle: Toggle, { uuid, culture, forcedToggles }: User): boolean => {
    if (forcedToggles && toggle.id in forcedToggles) {
        return forcedToggles[toggle.id]
    }

    const toggles = toggleState.toggles
    const toggleData = toggles.find((t) => t.id === toggle.id)
    
    if(!uuid) return toggle.default
    const bucket = calculateBucket(uuid, toggle.default ? 100 : 0)

    const rolloutCultures = toggleData?.activations[0]?.attributes?.culture || []

    if (rolloutCultures.length > 0) {
        if(!culture || !rolloutCultures.includes(culture)) return false
    }

    const rolloutPercentage = toggleData?.activations[0]?.rollout?.percentage || 0
    if (rolloutPercentage >= bucket) {
        return true
    }

    return false
}
