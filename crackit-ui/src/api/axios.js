import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5981'

const api = axios.create({
    baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

let lastNetworkToastTime = 0

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const now = Date.now()

        // Debounce so multiple simultaneous requests don't spam toasts
        if (now - lastNetworkToastTime > 4000) {
            if (!error.response || error.code === 'ERR_NETWORK') {
                lastNetworkToastTime = now
                window.dispatchEvent(
                    new CustomEvent('crackit:toast', {
                        detail: {
                            type: 'error',
                            message: 'CrackIt backend is temporarily unreachable. Retrying...',
                        },
                    })
                )
            } else if (error.response?.status === 503) {
                lastNetworkToastTime = now
                window.dispatchEvent(
                    new CustomEvent('crackit:toast', {
                        detail: {
                            type: 'error',
                            message: 'Server is temporarily warming up. Please try again shortly.',
                        },
                    })
                )
            }
        }

        return Promise.reject(error)
    }
)

export default api