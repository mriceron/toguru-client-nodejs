// Type definitions for toguru-client
// Project: Scout24/toguru-client-nodejs
// Definitions by: Scout24 https://github.com/Scout24


// export as namespace toguruClientNodejs;

declare function ToguruClient(toguruClientParams: ToguruClient.ToguruClientParams): ToguruClient.ToguruClientInstance;

declare namespace ToguruClient {
    export interface ToguruClientParams {
        endpoint: string;
        refreshInterval: number;
    }
    export interface ToguruUser {
        uuid: string;
        culture: string;
        forcedToggles?: Record<string, boolean>;
    }
    export interface ToguruClientInstance {
        isToggleEnabled: (toggleName: string, user: ToguruUser) => boolean;
        toggleNamesForService: (service: string) => string[];
        togglesForService: (service: string, user: ToguruUser) => Record<string, boolean>;
    }
}

export = ToguruClient;
