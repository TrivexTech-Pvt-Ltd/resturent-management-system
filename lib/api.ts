const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return res.statusText || `HTTP error! status: ${res.status}`;
  try {
    const json = JSON.parse(text);
    if (typeof json === "string") return json;
    if (json.message) return json.message;
    if (json.title) return json.title;
    if (json.errors) {
      const firstKey = Object.keys(json.errors)[0];
      if (
        firstKey &&
        Array.isArray(json.errors[firstKey]) &&
        json.errors[firstKey].length > 0
      ) {
        return json.errors[firstKey][0];
      }
    }
    return text;
  } catch {
    return text;
  }
}

export const api = {
  async get(url: string) {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`);
      if (!res.ok) {
        const errorMsg = await parseErrorMessage(res);
        throw new Error(errorMsg);
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
        const errorMsg = await parseErrorMessage(res);
        throw new Error(errorMsg);
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
        const errorMsg = await parseErrorMessage(res);
        throw new Error(errorMsg);
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
        const errorMsg = await parseErrorMessage(res);
        throw new Error(errorMsg);
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
        const errorMsg = await parseErrorMessage(res);
        throw new Error(errorMsg);
      }
      const data = await res.json().catch(() => null);
      return { data };
    } catch (err) {
      console.error(`Fetch DELETE error for ${url}:`, err);
      throw err;
    }
  },
};
