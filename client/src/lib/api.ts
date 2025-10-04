import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
}

// Movie API
export const movieAPI = {
  getAll: () => fetchWithAuth("/api/movies"),
  
  getById: (id: string) => fetchWithAuth(`/api/movies/${id}`),
  
  create: (movie: any) => 
    fetchWithAuth("/api/movies", {
      method: "POST",
      body: JSON.stringify(movie),
    }),
  
  update: (id: string, movie: any) =>
    fetchWithAuth(`/api/movies/${id}`, {
      method: "PUT",
      body: JSON.stringify(movie),
    }),
  
  delete: (id: string) =>
    fetchWithAuth(`/api/movies/${id}`, {
      method: "DELETE",
    }),
};

// Upload API
export const uploadAPI = {
  uploadVideo: async (file: File, onProgress?: (progress: number) => void) => {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded * 100) / e.total);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));

      xhr.open("POST", `${API_BASE}/api/upload`);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },
};

// Session API
export const sessionAPI = {
  createOrGet: (roomId: string, movieId: string) =>
    fetchWithAuth("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ roomId, movieId }),
    }),
  
  get: (roomId: string) => fetchWithAuth(`/api/sessions/${roomId}`),
};
