import type {AppUser} from "@/domains/events/types/event.types.ts";

const USER_SESSION_KEY = 'events.current-user.v1'

export function createAppUser(name: string): AppUser {
  const normalizedName = name.trim().replace(/\s+/g, ' ')
  const initials = normalizedName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return {id: null, name: normalizedName, initials}
}

export function removeSessionUser() {
  try {
    window.sessionStorage.removeItem(USER_SESSION_KEY)
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function getSessionUser(): AppUser | null {
  try {
    const value = window.sessionStorage.getItem(USER_SESSION_KEY)
    if (!value) return null

    const storedUser: unknown = JSON.parse(value)
    if (
      !storedUser ||
      typeof storedUser !== 'object' ||
      !('name' in storedUser) ||
      typeof storedUser.name !== 'string' ||
      !storedUser.name.trim()
    ) {
      removeSessionUser()
      return null
    }

    return createAppUser(storedUser.name)
  } catch {
    removeSessionUser()
    return null
  }
}

export function storeSessionUser(name: string) {
  try {
    window.sessionStorage.setItem(
      USER_SESSION_KEY,
      JSON.stringify({name}),
    )
  } catch {
    // The in-memory user remains usable when storage is unavailable.
  }
}