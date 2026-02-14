const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;
export const api = {
  async get(url: string) {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`);
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json().catch(() => null);
      return { data };
    } catch (err) {
      console.error(`Fetch GET error for ${url}:`, err);
      throw err;
    }
  },

  async post(url: string, body: any) {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json().catch(() => null);
      return { data };
    } catch (err) {
      console.error(`Fetch POST error for ${url}:`, err);
      throw err;
    }
  },

  async put(url: string, body: any) {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json().catch(() => null);
      return { data };
    } catch (err) {
      console.error(`Fetch PUT error for ${url}:`, err);
      throw err;
    }
  },

  async patch(url: string, body: any) {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json().catch(() => null);
      return { data };
    } catch (err) {
      console.error(`Fetch PATCH error for ${url}:`, err);
      throw err;
    }
  },

  async delete(url: string) {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json().catch(() => null);
      return { data };
    } catch (err) {
      console.error(`Fetch DELETE error for ${url}:`, err);
      throw err;
    }
  },
};
