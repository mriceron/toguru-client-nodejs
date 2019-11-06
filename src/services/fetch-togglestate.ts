import axios from 'axios';
import { ToguruData } from '../types/toguru';

export default (endpoint: string) =>
    axios(endpoint, {
        headers: {
            Accept: 'application/vnd.toguru.v3+json',
        },
    }).then(({ data }) => data as ToguruData);
