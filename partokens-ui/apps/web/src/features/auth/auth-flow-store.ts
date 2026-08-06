import { create } from 'zustand'

import { clearRegistrationContext, readRegistrationContext } from './auth-utils'

export type RegistrationDraft = {
  username: string
  email: string
  verificationCode: string
  password: string
  confirm: string
  consent: boolean
}

type AuthFlowState = {
  registration: RegistrationDraft
  updateRegistration: (fields: Partial<RegistrationDraft>) => void
  clearRegistration: () => void
}

function emptyRegistration(): RegistrationDraft {
  return {
    username: '',
    email: readRegistrationContext().email,
    verificationCode: '',
    password: '',
    confirm: '',
    consent: true,
  }
}

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  registration: emptyRegistration(),
  updateRegistration: (fields) => set((state) => ({
    registration: { ...state.registration, ...fields },
  })),
  clearRegistration: () => {
    clearRegistrationContext()
    set({ registration: emptyRegistration() })
  },
}))
