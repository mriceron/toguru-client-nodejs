import { get } from 'lodash';
import { Toggle, ToguruData } from '../types/toguru';

const toggleBelongsToService = (toggle: Toggle, serviceName: string) => {
    const service = get(toggle, 'tags.service', '').split(',');
    const services = get(toggle, 'tags.services', '').split(',');
    return service.concat(services).includes(serviceName);
};

export default (toguruData: ToguruData, service: string): string[] => {
    const toggles = get(toguruData, 'toggles', []);
    const togglesForService = toggles.filter((t) => toggleBelongsToService(t, service));

    return togglesForService.map((t) => t.id);
};
