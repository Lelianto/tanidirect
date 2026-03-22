'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store'

export function AuthHydrator() {
  useEffect(() => {
    async function validateSession() {
      const accessToken = localStorage.getItem('sb-access-token')

      // No token in localStorage — could be demo user or logged out
      // Either way, skip validation (Zustand persist handles demo sessions)
      if (!accessToken) return

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          useAuthStore.getState().setUser(data.user)
          if (data.sopAgreements?.length > 0) {
            useAuthStore.getState().agreeSOP()
          }
        }
        return
      }

      // Token invalid — try refresh
      if (res.status === 401) {
        const refreshToken = localStorage.getItem('sb-refresh-token')
        if (refreshToken) {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json()
            localStorage.setItem('sb-access-token', refreshData.access_token)
            localStorage.setItem('sb-refresh-token', refreshData.refresh_token)

            // Retry with new token
            const retryRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${refreshData.access_token}` },
            })

            if (retryRes.ok) {
              const retryData = await retryRes.json()
              if (retryData.user) {
                useAuthStore.getState().setUser(retryData.user)
                if (retryData.sopAgreements?.length > 0) {
                  useAuthStore.getState().agreeSOP()
                }
              }
              return
            }
          }
        }

        // Refresh also failed — logout
        useAuthStore.getState().logout()
      }
    }

    validateSession()
  }, [])

  return null
}
