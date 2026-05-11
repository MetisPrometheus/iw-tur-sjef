// Browser-only: stable per-device client ID stored in localStorage.
// Used as the participant identity for vote dedup.

const KEY = "tur-sjef:client-id";

export function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

const NAME_KEY = "tur-sjef:display-name";

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}

export function setDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}
