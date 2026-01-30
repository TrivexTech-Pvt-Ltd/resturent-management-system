const API_BASE_URL = "http://resturentsystem.runasp.net/api";

export const api = {
    async get(url: string) {
        const res = await fetch(`${API_BASE_URL}${url}`);
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return { data };
    },

    async post(url: string, body: any) {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return { data };
    },

    async put(url: string, body: any) {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json().catch(() => null);
        return { data };
    },

    async patch(url: string, body: any) {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json().catch(() => null);
        return { data };
    },

    async delete(url: string) {
        const res = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json().catch(() => null);
        return { data };
    },
};
