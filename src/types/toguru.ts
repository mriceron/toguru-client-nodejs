// Not sure what this is in terms of a data structure, if something from toguru or a mix
export type User = {
    culture?: string;
    uuid?: string;
    forcedToggles?: Record<string, boolean>;
};

export type Toggle = {
    id: string;
    tags: Record<string, string>;
    activations: Array<{
        attributes?: {
            culture?: string[];
        };
        rollout?: {
            percentage: number;
        };
    }>;
};

export type ToguruData = {
    sequenceNo: number;
    toggles: Toggle[];
};
