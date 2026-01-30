import axios from 'axios';

// const API_BASE_URL = "http://resturentsystem.runasp.net/api";
const API_BASE_URL = "http://192.168.1.9:5071/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
