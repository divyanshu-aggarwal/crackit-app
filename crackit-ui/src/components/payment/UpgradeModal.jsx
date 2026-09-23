import React, { useState } from 'react'
import { Crown, Check, Sparkles, X, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// Helper to dynamically load the Razorpay checkout script
function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

export default function UpgradeModal() {
    const { isUpgradeModalOpen, closeUpgradeModal, user, refreshProfile, isPro, isDevAdmin } = useAuth()
    const [selectedPlan, setSelectedPlan] = useState('MONTHLY') // 'MONTHLY' | 'ANNUAL'
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    if (!isUpgradeModalOpen) return null

    const planDetails = {
        MONTHLY: {
            name: 'Monthly Pro',
            price: '₹299',
            period: '/ month',
            savings: null,
            amountPaise: 29900
        },
        ANNUAL: {
            name: 'Annual Pro',
            price: '₹1,999',
            period: '/ year',
            savings: 'Save 45%',
            amountPaise: 199900
        }
    }

    const handleResetToFree = async () => {
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            await api.post('/api/payments/reset-tier')
            await refreshProfile()
            setSuccessMsg('Reset to Free tier with 0/3 AI credits.')
            setTimeout(() => setSuccessMsg(''), 1500)
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to reset tier')
        } finally {
            setLoading(false)
        }
    }

    const currentPlan = planDetails[selectedPlan]

    const handleCheckout = async () => {
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            // 1. Create order on backend
            const orderRes = await api.post('/api/payments/create-order', {
                plan: selectedPlan
            })

            const orderData = orderRes.data

            // 2. If backend is in mock mode or Razorpay script fails, handle simulated verification
            if (orderData.mockMode) {
                // Perform instant simulated verification
                const verifyRes = await api.post('/api/payments/verify', {
                    orderId: orderData.orderId,
                    paymentId: 'pay_demo_' + Date.now(),
                    signature: 'mock_signature',
                    plan: selectedPlan
                })

                await refreshProfile()
                setSuccessMsg('🎉 Upgrade Successful! Welcome to Crackit Pro.')
                setTimeout(() => {
                    closeUpgradeModal()
                    setSuccessMsg('')
                }, 1600)
                setLoading(false)
                return
            }

            // 3. Live Razorpay Flow
            const scriptLoaded = await loadRazorpayScript()
            if (!scriptLoaded) {
                throw new Error('Failed to load Razorpay payment gateway. Please check your connection.')
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'CrackIt Platform',
                description: `Upgrade to ${currentPlan.name}`,
                order_id: orderData.orderId,
                prefill: {
                    name: orderData.customerName || user?.fullName || '',
                    email: orderData.customerEmail || user?.email || '',
                    contact: orderData.customerPhone || user?.phone || ''
                },
                theme: {
                    color: '#7c3aed'
                },
                handler: async function (response) {
                    try {
                        setLoading(true)
                        await api.post('/api/payments/verify', {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            plan: selectedPlan
                        })

                        await refreshProfile()
                        setSuccessMsg('🎉 Payment verified! Welcome to Crackit Pro.')
                        setTimeout(() => {
                            closeUpgradeModal()
                            setSuccessMsg('')
                        }, 1600)
                    } catch (err) {
                        setErrorMsg(err.response?.data?.message || 'Payment verification failed. Please contact support.')
                    } finally {
                        setLoading(false)
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false)
                    }
                }
            }

            const razorpayInstance = new window.Razorpay(options)
            razorpayInstance.open()
        } catch (err) {
            console.error('Checkout error:', err)
            setErrorMsg(err.response?.data?.message || err.message || 'Payment initialization failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 10, 30, 0.65)',
                backdropFilter: 'blur(8px)',
                padding: 16
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) closeUpgradeModal()
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 480,
                    background: '#ffffff',
                    borderRadius: 24,
                    boxShadow: '0 24px 60px rgba(124, 58, 237, 0.28), 0 8px 24px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    overflow: 'hidden',
                    fontFamily: 'inherit'
                }}
            >
                {/* Header Gradient Banner */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #ec4899 100%)',
                        padding: '24px 24px 20px',
                        color: '#ffffff',
                        position: 'relative'
                    }}
                >
                    <button
                        onClick={closeUpgradeModal}
                        disabled={loading}
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        <X size={16} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 12,
                                background: 'rgba(255, 255, 255, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Crown size={22} color="#fbbf24" fill="#fbbf24" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                                Upgrade to Crackit Pro
                            </h2>
                            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                                Supercharge your job hunt with unlimited AI power
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: '20px 24px 24px' }}>
                    {/* Feedback Messages */}
                    {errorMsg && (
                        <div
                            style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#b91c1c',
                                padding: '10px 14px',
                                borderRadius: 12,
                                fontSize: 13,
                                marginBottom: 16
                            }}
                        >
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div
                            style={{
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#047857',
                                padding: '12px 14px',
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 600,
                                marginBottom: 16,
                                textAlign: 'center'
                            }}
                        >
                            {successMsg}
                        </div>
                    )}

                    {/* Plan Selection Switcher */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 10,
                            marginBottom: 20
                        }}
                    >
                        {/* Monthly */}
                        <div
                            onClick={() => setSelectedPlan('MONTHLY')}
                            style={{
                                border: selectedPlan === 'MONTHLY' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                background: selectedPlan === 'MONTHLY' ? 'rgba(124, 58, 237, 0.04)' : '#f8fafc',
                                borderRadius: 14,
                                padding: '12px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Monthly</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                                ₹299 <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>/ mo</span>
                            </div>
                        </div>

                        {/* Annual */}
                        <div
                            onClick={() => setSelectedPlan('ANNUAL')}
                            style={{
                                border: selectedPlan === 'ANNUAL' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                background: selectedPlan === 'ANNUAL' ? 'rgba(124, 58, 237, 0.04)' : '#f8fafc',
                                borderRadius: 14,
                                padding: '12px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                position: 'relative'
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    top: -9,
                                    right: 10,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: 9999,
                                    letterSpacing: '0.02em'
                                }}
                            >
                                SAVE 45%
                            </span>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Annual Plan</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                                ₹1,999 <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>/ yr</span>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div style={{ marginBottom: 22 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                            What's Included in Pro:
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { text: 'Unlimited AI JD Match & Gap Analyses', highlight: 'Unlimited' },
                                { text: 'Unlimited Targeted Resume Tailoring', highlight: 'Unlimited' },
                                { text: 'Kafka-driven AI Interview Prep & Mock Chat', highlight: 'Full Access' },
                                { text: 'Priority Discovery & Automated Matching', highlight: 'Priority' },
                                { text: 'Pro Member Golden Badge across App', highlight: 'Pro Badge' }
                            ].map((feat, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#334155' }}>
                                    <div
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Check size={12} color="#16a34a" strokeWidth={3} />
                                    </div>
                                    <span>{feat.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 16,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Opening Razorpay Checkout...</span>
                            </>
                        ) : isPro ? (
                            <>
                                <span>Extend Pro Membership • {currentPlan.price}</span>
                                <ArrowRight size={17} />
                            </>
                        ) : (
                            <>
                                <span>Upgrade to Pro • {currentPlan.price}</span>
                                <ArrowRight size={17} />
                            </>
                        )}
                    </button>

                    {/* Trust Footnote & Dev Reset */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            marginTop: 14,
                            fontSize: 12,
                            color: '#94a3b8'
                        }}
                    >
                        <ShieldCheck size={14} color="#10b981" />
                        <span>Secured by Razorpay • UPI & Cards accepted</span>
                    </div>

                    {isDevAdmin && (
                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                            <button
                                type="button"
                                onClick={handleResetToFree}
                                disabled={loading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#9333ea',
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Admin / Dev Mode: Reset to Free Tier (0/3 AI credits)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
