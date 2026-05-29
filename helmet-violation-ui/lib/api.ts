const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchViolations() {
  const res = await fetch(`${API_URL}/api/violations`);

  if (!res.ok) {
    throw new Error("Failed to fetch violations");
  }

  const data = await res.json();

  return Array.isArray(data)
    ? data
    : data.violations ?? [];
}

export async function fetchViolationById(id: string) {
  const res = await fetch(
    `${API_URL}/api/violations/${id}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch violation");
  }

  return res.json();
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${API_URL}/api/detect`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Detection failed");
  }

  return res.json();
}