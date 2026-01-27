import axios from 'axios';

const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer
    ? "http://resturentsystem.runasp.net/api"
    : "/remote-api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
