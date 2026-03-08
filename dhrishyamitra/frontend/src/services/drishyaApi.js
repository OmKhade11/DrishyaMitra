import API_URL from "../config/api";
import { apiFetch } from "./apiClient";

function normalizePhoto(photo) {
  return {
    ...photo,
    url: photo.url?.startsWith("http") ? photo.url : `${API_URL}${photo.url || ""}`,
    date: photo.date || photo.uploaded_at,
    faces: Array.isArray(photo.faces) ? photo.faces : [],
    tags: Array.isArray(photo.tags) ? photo.tags : [],
    title: photo.title || photo.filename || `Photo ${photo.id}`,
    location: photo.location || "Unknown",
  };
}

export async function fetchPhotos(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.person) query.set("person", params.person);
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);

  const path = query.toString() ? `/api/search/photos?${query}` : "/api/photos";
  const data = await apiFetch(path);
  return (data.photos || []).map(normalizePhoto);
}

export async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);
  const data = await apiFetch("/api/upload", { method: "POST", body: formData });
  return normalizePhoto(data.photo);
}

export async function deletePhoto(photoId) {
  return apiFetch(`/api/photos/${photoId}`, { method: "DELETE" });
}

export async function recognizePhoto(photoId) {
  return apiFetch("/api/recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo_id: photoId, detector_backend: "multi" }),
  });
}

export async function fetchPeople() {
  const data = await apiFetch("/api/people");
  return data.people || [];
}

export async function fetchPeopleSummary() {
  return apiFetch("/api/people/summary");
}

export async function fetchPhotoFaces(photoId) {
  const data = await apiFetch(`/api/photos/${photoId}/faces`);
  return data.faces || [];
}

export async function autoMatchPerson(personId) {
  return apiFetch(`/api/people/${personId}/auto-match`, {
    method: "POST",
  });
}

export async function trainAndMatchPerson(personId, photoIds = null, threshold = 0.55, forceRedetect = true, forceAssign = false) {
  return apiFetch(`/api/people/${personId}/train-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo_ids: photoIds, threshold, force_redetect: forceRedetect, force_assign: forceAssign }),
  });
}

export async function scanTrainMatchPerson(personId, threshold = 0.60, forceAssignRemaining = true, limit = 2000) {
  return apiFetch(`/api/people/${personId}/scan-train-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threshold, force_assign_remaining: forceAssignRemaining, limit }),
  });
}

export async function createPerson(name) {
  const data = await apiFetch("/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return data.person;
}

export async function renamePerson(personId, name) {
  const data = await apiFetch(`/api/people/${personId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return data.person;
}

export async function deletePerson(personId) {
  return apiFetch(`/api/people/${personId}`, {
    method: "DELETE",
  });
}

export async function labelFace(faceId, personName) {
  const data = await apiFetch(`/api/faces/${faceId}/label`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ person_name: personName }),
  });
  return data;
}

export async function scanUnprocessedPhotos(limit = 20, forceRedetect = true) {
  return apiFetch("/api/delivery/batch-process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, force_redetect: forceRedetect }),
  });
}

export async function chatWithAssistant(message) {
  return apiFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function deliverPhotoEmail(photoId, recipientEmail, subject, body) {
  return apiFetch("/api/delivery/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo_id: photoId, recipient_email: recipientEmail, subject, body }),
  });
}

export async function deliverPhotoWhatsapp(photoId, recipientPhone, caption) {
  return apiFetch("/api/delivery/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photo_id: photoId, recipient_phone: recipientPhone, caption }),
  });
}

export async function fetchDeliveryHistory(photoId) {
  const query = photoId ? `?photo_id=${photoId}` : "";
  const data = await apiFetch(`/api/delivery/history${query}`);
  return data.history || [];
}
