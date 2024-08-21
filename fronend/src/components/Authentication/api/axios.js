import { faMarsDouble } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

export default axios.create({
    baseURL: process.env.REACT_APP_AXIOS_BASE_URL
});
