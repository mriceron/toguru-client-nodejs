export type UserInfo = {
    culture?: string
    uuid?: string
    forcedToggles?: Record<string, boolean>
}

export type ToguruToggleData = {
    id: string
    tags: Record<string, string>
    activations: Array<{
        attributes?: {
            culture?: string[]
        }
        rollout?: {
            percentage: number
        }
    }>
}

export type ToguruData = {
    sequenceNo: number
    toggles: ToguruToggleData[]
}
