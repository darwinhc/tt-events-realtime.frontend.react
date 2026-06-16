import {useState} from 'react'

import type {AppUser} from '@/domains/events/types/event.types'
import {createAppUser, getSessionUser, removeSessionUser, storeSessionUser,} from '@/domains/events/utils/session-user'

export function useSessionUser() {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(getSessionUser)

    function createUser(name: string) {
        const user = createAppUser(name)
        storeSessionUser(user.name)
        setCurrentUser(user)
    }

    function resetSessionUser() {
        removeSessionUser()
        setCurrentUser(null)
    }

    return {
        currentUser,
        createUser,
        resetSessionUser,
    }
}
