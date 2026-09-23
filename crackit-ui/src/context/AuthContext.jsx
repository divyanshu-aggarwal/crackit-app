import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null')
        } catch {
            return null
        }
    })
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    const login = (token, user) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setToken(token)
        setUser(user)
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    const refreshProfile = async () => {
        if (!token) return null
        try {
            const res = await api.get('/api/users/profile')
            if (res.data) {
                setUser(prev => {
                    const updated = { ...(prev || {}), ...res.data }
                    localStorage.setItem('user', JSON.stringify(updated))
                    return updated
                })
                return res.data
            }
        } catch (err) {
            console.error('Failed to sync user profile:', err)
        }
        return null
    }

    // Refresh profile on mount if token exists
    useEffect(() => {
        if (token) {
            refreshProfile()
        }
    }, [token])

    const isDevAdmin = user?.role === 'ROLE_ADMIN' || user?.email === 'divyanshu5981.iimt@gmail.com'
    const isAdmin = () => isDevAdmin
    const isPro = Boolean(user?.isPro || user?.subscriptionTier === 'PRO')
    const subscriptionTier = user?.subscriptionTier || 'FREE'
    const aiUsageCount = user?.aiUsageCount || 0
    const aiUsageLimit = isPro ? -1 : (user?.aiUsageLimit ?? 3)

    const openUpgradeModal = () => setIsUpgradeModalOpen(true)
    const closeUpgradeModal = () => setIsUpgradeModalOpen(false)

    return (
        <AuthContext.Provider value={{
            token,
            user,
            login,
            logout,
            isAdmin,
            isDevAdmin,
            isPro,
            subscriptionTier,
            aiUsageCount,
            aiUsageLimit,
            refreshProfile,
            isUpgradeModalOpen,
            openUpgradeModal,
            closeUpgradeModal
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)