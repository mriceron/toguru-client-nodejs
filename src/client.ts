import fetchTogglestate from './services/fetch-togglestate';
import isToggleEnabledForUser from './services/is-toggle-enabled';
import findToggleListForService from './services/find-toggle-list-for-service';
import { User, ToguruData } from './types/toguru';

export default ({ endpoint, refreshInterval = 60000 }: { endpoint: string; refreshInterval: number }) => {
    let toggleState: ToguruData = {} as ToguruData;

    fetchTogglestate(endpoint).then((ts) => (toggleState = ts));

    setInterval(() => {
        fetchTogglestate(endpoint).then((ts) => (toggleState = ts));
    }, refreshInterval);

    return {
        isToggleEnabled: (toggleName: string, { uuid, culture, forcedToggles }: User) => {
            return isToggleEnabledForUser(toggleState, toggleName, {
                uuid,
                culture,
                forcedToggles,
            });
        },

        toggleNamesForService: (service: string) => findToggleListForService(toggleState, service),

        togglesForService: (service: string, user: User) => {
            const result: Record<string, boolean> = {};
            const toggleIds = findToggleListForService(toggleState, service);
            toggleIds.forEach((t) => {
                result[t] = isToggleEnabledForUser(toggleState, t, user);
            });

            return result;
        },
    };
};
