import { get } from 'lodash';
import calculateBucket from './calculate-bucket';
import { ToguruData, User } from '../types/toguru';

export default (togglestate: ToguruData, togglename: string, { uuid, culture, forcedToggles }: User) => {
    if (forcedToggles && togglename in forcedToggles) {
        return forcedToggles[togglename];
    }

    const toggles = get(togglestate, 'toggles', []) as ToguruData['toggles'];
    const toggle = toggles.find((t) => t.id === togglename);
    const bucket = calculateBucket(uuid || '');

    const rolloutCultures = get(toggle, 'activations.0.attributes.culture', []);

    if (rolloutCultures.length > 0 && !rolloutCultures.includes(culture)) {
        return false;
    }

    const rolloutPercentage = get(toggle, 'activations.0.rollout.percentage', 0);
    if (rolloutPercentage >= bucket) {
        return true;
    }

    return false;
};
