import axios from 'axios';

//const API_BASE_URL = "http://localhost:5071/api";
const API_BASE_URL = "http://resturentsystem.runasp.net/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
