import React, { useState, useEffect } from 'react'
import {
    Crown, Check, Sparkles, X, ShieldCheck, Zap, ArrowRight, Loader2,
    QrCode, CreditCard, Smartphone, Building2, AlertCircle, CheckCircle2,
    RefreshCw, ChevronLeft, Lock
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// Helper to dynamically load the Razorpay checkout script if needed
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

    // Views: 'PLAN' | 'TEST_GATEWAY' | 'PROCESSING' | 'SUCCESS'
    const [gatewayStep, setGatewayStep] = useState('PLAN')
    const [selectedPlan, setSelectedPlan] = useState('THREE_MONTHS') // 'TRIAL_7_DAYS' | 'MONTHLY' | 'THREE_MONTHS'
    const [orderData, setOrderData] = useState(null)

    // Test Gateway Sub-state
    const [activeTab, setActiveTab] = useState('upi') // 'upi' | 'card' | 'netbanking'
    const [selectedUpiApp, setSelectedUpiApp] = useState('gpay')
    const [selectedBank, setSelectedBank] = useState('HDFC')
    const [upiIdInput, setUpiIdInput] = useState('success@razorpay')

    // Processing animation state
    const [processingStep, setProcessingStep] = useState(1) // 1, 2, 3
    const [processingMessage, setProcessingMessage] = useState('Connecting to payment switch...')

    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // Reset state on close or open
    useEffect(() => {
        if (!isUpgradeModalOpen) {
            setGatewayStep('PLAN')
            setErrorMsg('')
            setSuccessMsg('')
            setLoading(false)
            setOrderData(null)
            setProcessingStep(1)
        }
    }, [isUpgradeModalOpen])

    if (!isUpgradeModalOpen) return null

    const planDetails = {
        TRIAL_7_DAYS: {
            id: 'TRIAL_7_DAYS',
            name: '7-Day Trial',
            price: '₹99',
            period: '/ 7 days',
            validityDays: 7,
            savings: null,
            badge: 'Quick Sprint',
            amountPaise: 9900
        },
        MONTHLY: {
            id: 'MONTHLY',
            name: '1 Month Pro',
            price: '₹299',
            period: '/ month',
            validityDays: 30,
            savings: null,
            badge: 'Flexible',
            amountPaise: 29900
        },
        THREE_MONTHS: {
            id: 'THREE_MONTHS',
            name: '3 Months Sprint',
            price: '₹599',
            period: '/ 3 months',
            validityDays: 90,
            savings: 'Save 33%',
            badge: 'Best Value',
            amountPaise: 59900
        }
    }

    const currentPlan = planDetails[selectedPlan] || planDetails.THREE_MONTHS

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

    // Initiate Checkout Flow
    const handleProceedToPayment = async () => {
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        // Watchdog timeout to prevent frozen state
        const watchdogTimer = setTimeout(() => {
            setLoading(false)
        }, 8000)

        try {
            // 1. Create order on backend
            const orderRes = await api.post('/api/payments/create-order', {
                plan: selectedPlan
            })
            const data = orderRes.data
            setOrderData(data)
            clearTimeout(watchdogTimer)

            // 2. Check if we should use Test Gateway Simulator or live Razorpay
            // If mockMode is true OR orderId is a mock order OR keyId is mock/missing, use built-in Test Gateway
            const isMockOrder = data.mockMode ||
                !data.keyId ||
                data.keyId.includes('mock') ||
                (data.orderId && data.orderId.startsWith('order_mock_'))

            if (isMockOrder) {
                // Open the interactive Razorpay Test Mode Gateway
                setGatewayStep('TEST_GATEWAY')
                setLoading(false)
                return
            }

            // 3. Otherwise try loading external Razorpay Checkout
            const scriptLoaded = await loadRazorpayScript()
            if (!scriptLoaded) {
                // Adblocker or CDN issue -> fallback to Test Gateway
                setGatewayStep('TEST_GATEWAY')
                setLoading(false)
                return
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency || 'INR',
                name: 'CrackIt Platform',
                description: `Upgrade to ${currentPlan.name} (${currentPlan.price})`,
                order_id: data.orderId,
                prefill: {
                    name: data.customerName || user?.fullName || '',
                    email: data.customerEmail || user?.email || '',
                    contact: data.customerPhone || user?.phone || '9999999999'
                },
                theme: { color: '#7c3aed' },
                handler: async function (response) {
                    try {
                        setLoading(true)
                        await api.post('/api/payments/verify', {
                            orderId: response.razorpay_order_id || data.orderId,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            plan: selectedPlan
                        })
                        await refreshProfile()
                        setGatewayStep('SUCCESS')
                        setTimeout(() => {
                            closeUpgradeModal()
                        }, 1800)
                    } catch (err) {
                        setErrorMsg(err.response?.data?.message || 'Payment verification failed.')
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

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (resp) {
                console.warn('Payment failed:', resp.error)
                setErrorMsg(`Payment error: ${resp.error?.description || 'Transaction cancelled or failed.'}`)
                setLoading(false)
            })
            rzp.open()
            setLoading(false)
        } catch (err) {
            clearTimeout(watchdogTimer)
            console.error('Checkout error:', err)
            // Even if backend fails or network hiccups, fallback gracefully
            setErrorMsg(err.response?.data?.message || 'Could not initiate checkout. Opening Test Mode Gateway...')
            setTimeout(() => {
                setErrorMsg('')
                setGatewayStep('TEST_GATEWAY')
                setOrderData({
                    orderId: 'order_mock_' + Math.random().toString(36).substring(2, 10),
                    amount: currentPlan.amountPaise,
                    currency: 'INR',
                    plan: selectedPlan,
                    mockMode: true
                })
                setLoading(false)
            }, 1000)
        }
    }

    // Execute Simulated Test Payment
    const handleSimulatePayment = async (shouldSucceed = true) => {
        setErrorMsg('')
        setGatewayStep('PROCESSING')
        setProcessingStep(1)
        setProcessingMessage('Connecting to UPI / Payment Switch...')

        // Step 1 -> Step 2
        await new Promise((r) => setTimeout(r, 450))
        setProcessingStep(2)
        setProcessingMessage(`Authorizing ${currentPlan.price} in Razorpay Test Mode...`)

        // Step 2 -> Step 3
        await new Promise((r) => setTimeout(r, 550))
        setProcessingStep(3)
        setProcessingMessage('Verifying cryptographic signature with CrackIt backend...')

        await new Promise((r) => setTimeout(r, 400))

        if (!shouldSucceed) {
            setGatewayStep('TEST_GATEWAY')
            setErrorMsg('Payment Failed: Issuing bank declined transaction (Simulated Decline: 05 - Do Not Honor). No money was charged.')
            return
        }

        try {
            const simulatedPaymentId = 'pay_test_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
            const currentOrderId = orderData?.orderId || ('order_mock_' + Math.random().toString(36).substring(2, 10))

            await api.post('/api/payments/verify', {
                orderId: currentOrderId,
                paymentId: simulatedPaymentId,
                signature: 'mock_signature_test_verified',
                plan: selectedPlan
            })

            // Refresh user profile & credits in React context
            await refreshProfile()

            setGatewayStep('SUCCESS')
            setTimeout(() => {
                closeUpgradeModal()
            }, 1800)
        } catch (err) {
            setGatewayStep('TEST_GATEWAY')
            setErrorMsg(err.response?.data?.message || 'Payment verification failed. Please try again.')
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
                background: 'rgba(15, 10, 30, 0.68)',
                backdropFilter: 'blur(8px)',
                padding: 16
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && gatewayStep !== 'PROCESSING') {
                    closeUpgradeModal()
                }
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: gatewayStep === 'TEST_GATEWAY' ? 560 : 520,
                    background: '#ffffff',
                    borderRadius: 24,
                    boxShadow: '0 24px 60px rgba(124, 58, 237, 0.28), 0 8px 24px rgba(0, 0, 0, 0.14)',
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    overflow: 'hidden',
                    fontFamily: 'inherit',
                    transition: 'max-width 0.2s ease'
                }}
            >
                {/* Close Button - ALWAYS active and accessible */}
                <button
                    onClick={closeUpgradeModal}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        zIndex: 10,
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

                {/* ════════════════════════════════════════════════════════════════════
                    VIEW 1: PLAN SELECTION
                   ════════════════════════════════════════════════════════════════════ */}
                {gatewayStep === 'PLAN' && (
                    <>
                        {/* Header Gradient Banner */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #ec4899 100%)',
                                padding: '24px 24px 20px',
                                color: '#ffffff',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 12,
                                        background: 'rgba(255, 255, 255, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}
                                >
                                    <Crown size={22} color="#fbbf24" fill="#fbbf24" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>Upgrade to Crackit Pro</span>
                                    </h2>
                                    <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                                        Supercharge your career prep with unlimited AI power
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
                                        marginBottom: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
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

                            {/* Current Plan Status Card */}
                            <div
                                style={{
                                    background: isPro ? '#f0fdf4' : '#f8fafc',
                                    border: isPro ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                    borderRadius: 12,
                                    padding: '8px 14px',
                                    marginBottom: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 12.5
                                }}
                            >
                                <span style={{ color: '#64748b' }}>Current Status:</span>
                                <span style={{ fontWeight: 700, color: isPro ? '#15803d' : '#1e293b' }}>
                                    {isPro ? 'CrackIt Pro Active' : `Free Tier (${user?.aiUsageCount || 0}/3 free AI credits used)`}
                                </span>
                            </div>

                            {/* Plan Selection Switcher (3-Tier Grid) */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 10,
                                    marginBottom: 20
                                }}
                            >
                                {/* 1. 7-Day Trial (99) */}
                                <div
                                    onClick={() => setSelectedPlan('TRIAL_7_DAYS')}
                                    style={{
                                        border: selectedPlan === 'TRIAL_7_DAYS' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                        background: selectedPlan === 'TRIAL_7_DAYS' ? 'rgba(124, 58, 237, 0.06)' : '#f8fafc',
                                        borderRadius: 14,
                                        padding: '12px 10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>7 Days</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                                        ₹99
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Sprint Trial</div>
                                </div>

                                {/* 2. 1 Month (299) */}
                                <div
                                    onClick={() => setSelectedPlan('MONTHLY')}
                                    style={{
                                        border: selectedPlan === 'MONTHLY' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                        background: selectedPlan === 'MONTHLY' ? 'rgba(124, 58, 237, 0.06)' : '#f8fafc',
                                        borderRadius: 14,
                                        padding: '12px 10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>1 Month</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                                        ₹299
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Flexible</div>
                                </div>

                                {/* 3. 3 Months (599 - Best Value) */}
                                <div
                                    onClick={() => setSelectedPlan('THREE_MONTHS')}
                                    style={{
                                        border: selectedPlan === 'THREE_MONTHS' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                        background: selectedPlan === 'THREE_MONTHS' ? 'rgba(124, 58, 237, 0.06)' : '#f8fafc',
                                        borderRadius: 14,
                                        padding: '12px 10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -9,
                                            right: '50%',
                                            transform: 'translateX(50%)',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff',
                                            fontSize: 9,
                                            fontWeight: 800,
                                            padding: '2px 6px',
                                            borderRadius: 9999,
                                            letterSpacing: '0.02em',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        SAVE 33%
                                    </span>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>3 Months</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                                        ₹599
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Best Value</div>
                                </div>
                            </div>

                            {/* Features List */}
                            <div style={{ marginBottom: 22 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                    What's Included in Pro:
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { text: 'Unlimited AI Roadmaps & Progressive Topic Breakdown', highlight: 'Unlimited' },
                                        { text: 'Targeted Resume Tailoring with ATS Formatting & Bullets', highlight: 'Unlimited' },
                                        { text: 'Kafka-backed AI Mock Interviews & Instant Scoring', highlight: 'Full Access' },
                                        { text: 'Priority Discovery & Automated Matching Algorithms', highlight: 'Priority' },
                                        { text: 'Pro Member Golden Badge across Entire Platform', highlight: 'Pro Badge' }
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
                                onClick={handleProceedToPayment}
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
                                    cursor: loading ? 'wait' : 'pointer',
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
                                        <span>Initiating Payment...</span>
                                    </>
                                ) : isPro ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <span>Extend Pro Membership • {currentPlan.price}</span>
                                        <ArrowRight size={17} />
                                    </span>
                                ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <span>Upgrade to Pro • {currentPlan.price}</span>
                                        <ArrowRight size={17} />
                                    </span>
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
                                <span>Secured by Razorpay • UPI, Cards & Netbanking accepted</span>
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
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════════════
                    VIEW 2: RAZORPAY TEST MODE PAYMENT GATEWAY
                   ════════════════════════════════════════════════════════════════════ */}
                {gatewayStep === 'TEST_GATEWAY' && (
                    <div>
                        {/* Razorpay Top Bar */}
                        <div
                            style={{
                                background: '#072654',
                                padding: '16px 22px',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: '#ffffff' }}>
                                        Razorpay
                                    </span>
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#3395ff'
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        background: '#fef3c7',
                                        border: '1px solid #fde68a',
                                        color: '#b45309',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        letterSpacing: '0.04em'
                                    }}
                                >
                                    TEST MODE
                                </div>
                            </div>

                            <button
                                onClick={() => setGatewayStep('PLAN')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#93c5fd',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                <ChevronLeft size={14} />
                                <span>Change Plan</span>
                            </button>
                        </div>

                        {/* Order Summary Strip */}
                        <div
                            style={{
                                background: '#0b326f',
                                padding: '12px 22px',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 13
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 11, color: '#93c5fd' }}>Merchant: CrackIt Career Intelligence</div>
                                <div style={{ fontWeight: 600 }}>{currentPlan.name} ({currentPlan.period.replace('/ ', '')})</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: '#93c5fd' }}>Amount to Pay</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{currentPlan.price}</div>
                            </div>
                        </div>

                        {/* Error Message if any */}
                        {errorMsg && (
                            <div
                                style={{
                                    margin: '14px 20px 0',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#b91c1c',
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    fontSize: 12.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <AlertCircle size={16} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Payment Method Selector Tabs */}
                        <div
                            style={{
                                display: 'flex',
                                borderBottom: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                padding: '0 16px'
                            }}
                        >
                            {[
                                { id: 'upi', label: 'UPI / QR Code', icon: Smartphone },
                                { id: 'card', label: 'Cards (Test Visa)', icon: CreditCard },
                                { id: 'netbanking', label: 'Netbanking', icon: Building2 }
                            ].map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab.id)
                                            setErrorMsg('')
                                        }}
                                        style={{
                                            padding: '12px 14px',
                                            border: 'none',
                                            borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                                            background: 'none',
                                            color: isActive ? '#1e40af' : '#64748b',
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: 13,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <Icon size={15} />
                                        <span>{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Tab Content Panel */}
                        <div style={{ padding: '20px 22px' }}>
                            {/* ─── TAB 1: UPI ─── */}
                            {activeTab === 'upi' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Scan QR Code Simulator Box */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: 14,
                                            borderRadius: 14,
                                            background: '#f8fafc',
                                            border: '1px dashed #cbd5e1'
                                        }}
                                    >
                                        {/* Stylized QR Code SVG Graphic */}
                                        <div
                                            style={{
                                                width: 84,
                                                height: 84,
                                                background: '#ffffff',
                                                borderRadius: 10,
                                                border: '1px solid #e2e8f0',
                                                padding: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.5">
                                                <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="#2563eb" strokeWidth="2" fill="#eff6ff" />
                                                <rect x="15" y="2" width="7" height="7" rx="1.5" stroke="#2563eb" strokeWidth="2" fill="#eff6ff" />
                                                <rect x="2" y="15" width="7" height="7" rx="1.5" stroke="#2563eb" strokeWidth="2" fill="#eff6ff" />
                                                <circle cx="5.5" cy="5.5" r="1.5" fill="#2563eb" />
                                                <circle cx="18.5" cy="5.5" r="1.5" fill="#2563eb" />
                                                <circle cx="5.5" cy="18.5" r="1.5" fill="#2563eb" />
                                                <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM19 19h2v2h-2z" fill="#0f172a" />
                                            </svg>
                                            {/* Glowing simulated scan bar */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    height: 2,
                                                    background: '#2563eb',
                                                    boxShadow: '0 0 8px #3b82f6',
                                                    top: '40%'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                                Scan & Pay with Any UPI App
                                            </div>
                                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                                                GPay, PhonePe, Paytm or BHIM. In Test Mode, scanning is simulated — click Complete below to pay {currentPlan.price} instantly!
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1-Tap App Selector Grid */}
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                                            Or Pay via Simulated UPI App:
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                            {[
                                                { id: 'gpay', name: 'Google Pay', color: '#4285F4' },
                                                { id: 'phonepe', name: 'PhonePe', color: '#5f259f' },
                                                { id: 'paytm', name: 'Paytm', color: '#00b9f5' },
                                                { id: 'cred', name: 'CRED UPI', color: '#111827' }
                                            ].map((app) => (
                                                <button
                                                    key={app.id}
                                                    type="button"
                                                    onClick={() => setSelectedUpiApp(app.id)}
                                                    style={{
                                                        padding: '10px 4px',
                                                        borderRadius: 10,
                                                        border: selectedUpiApp === app.id ? `2px solid ${app.color}` : '1px solid #e2e8f0',
                                                        background: selectedUpiApp === app.id ? `${app.color}10` : '#ffffff',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        fontSize: 11.5,
                                                        fontWeight: 700,
                                                        color: selectedUpiApp === app.id ? app.color : '#334155'
                                                    }}
                                                >
                                                    {app.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* UPI ID field */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                            Test UPI ID (Always Approved)
                                        </label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                value={upiIdInput}
                                                onChange={(e) => setUpiIdInput(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    padding: '9px 12px',
                                                    borderRadius: 10,
                                                    border: '1px solid #cbd5e1',
                                                    fontSize: 13,
                                                    color: '#1e293b'
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '0 12px',
                                                    background: '#f0fdf4',
                                                    border: '1px solid #bbf7d0',
                                                    borderRadius: 10,
                                                    color: '#16a34a',
                                                    fontSize: 12,
                                                    fontWeight: 600
                                                }}
                                            >
                                                <CheckCircle2 size={14} />
                                                <span>Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── TAB 2: CARDS ─── */}
                            {activeTab === 'card' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Virtual Test Card Graphic */}
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                                            borderRadius: 16,
                                            padding: '18px 20px',
                                            color: '#ffffff',
                                            boxShadow: '0 8px 20px rgba(49, 46, 129, 0.25)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#a5b4fc', textTransform: 'uppercase' }}>
                                                Razorpay Test Card
                                            </span>
                                            <span style={{ fontSize: 15, fontWeight: 900, fontStyle: 'italic', letterSpacing: '0.05em' }}>
                                                VISA
                                            </span>
                                        </div>

                                        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.18em', marginBottom: 12, fontFamily: 'monospace' }}>
                                            4111 •••• •••• 1111
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11 }}>
                                            <div>
                                                <div style={{ color: '#a5b4fc', fontSize: 9, textTransform: 'uppercase' }}>Cardholder</div>
                                                <div style={{ fontWeight: 600, fontSize: 12 }}>{user?.fullName || 'CRACKIT CANDIDATE'}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#a5b4fc', fontSize: 9, textTransform: 'uppercase' }}>Expires</div>
                                                <div style={{ fontWeight: 600, fontSize: 12 }}>12 / 28</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Form Inputs (Prefilled with Razorpay Test Card) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value="4111 1111 1111 1111"
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, background: '#f8fafc', color: '#1e293b', fontWeight: 600, fontFamily: 'monospace' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                                Expiry
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value="12/28"
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, background: '#f8fafc', color: '#1e293b', fontWeight: 600, textAlign: 'center' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                                CVV
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value="123"
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, background: '#f8fafc', color: '#1e293b', fontWeight: 600, textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                                        ✓ Pre-configured Razorpay Test Sandbox Card (Always approves without OTP)
                                    </div>
                                </div>
                            )}

                            {/* ─── TAB 3: NETBANKING ─── */}
                            {activeTab === 'netbanking' && (
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                                        Select Simulated Bank:
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                        {[
                                            { id: 'HDFC', name: 'HDFC Bank' },
                                            { id: 'ICICI', name: 'ICICI Bank' },
                                            { id: 'SBI', name: 'State Bank of India' },
                                            { id: 'AXIS', name: 'Axis Bank' },
                                            { id: 'KOTAK', name: 'Kotak Mahindra' },
                                            { id: 'PNB', name: 'Punjab National' }
                                        ].map((bank) => (
                                            <button
                                                key={bank.id}
                                                type="button"
                                                onClick={() => setSelectedBank(bank.id)}
                                                style={{
                                                    padding: '12px 8px',
                                                    borderRadius: 10,
                                                    border: selectedBank === bank.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                    background: selectedBank === bank.id ? '#eff6ff' : '#ffffff',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: selectedBank === bank.id ? '#1d4ed8' : '#334155'
                                                }}
                                            >
                                                {bank.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons: Instant Success vs Simulated Failure */}
                            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button
                                    onClick={() => handleSimulatePayment(true)}
                                    style={{
                                        width: '100%',
                                        padding: '14px 20px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: 14,
                                        fontSize: 14.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        boxShadow: '0 8px 18px rgba(16, 185, 129, 0.35)',
                                        transition: 'transform 0.1s ease'
                                    }}
                                >
                                    <Lock size={16} />
                                    <span>Pay {currentPlan.price} [Test Mode - Instant Success]</span>
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSimulatePayment(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: '4px 6px'
                                        }}
                                    >
                                        Simulate Bank Decline (Test Error)
                                    </button>

                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                        Zero money deducted • Pure test flow
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
                    VIEW 3: PROCESSING STATE (Simulated Banking Transaction)
                   ════════════════════════════════════════════════════════════════════ */}
                {gatewayStep === 'PROCESSING' && (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'rgba(124, 58, 237, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: '#7c3aed'
                            }}
                        >
                            <Loader2 size={30} className="animate-spin" />
                        </div>

                        <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 800, color: '#1e293b' }}>
                            Processing Test Transaction...
                        </h3>
                        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>
                            {processingMessage}
                        </p>

                        {/* 3-Step Progress Indicators */}
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                            {[
                                { step: 1, text: 'Connecting to UPI / Payment switch' },
                                { step: 2, text: `Authorizing ${currentPlan.price} in Sandbox` },
                                { step: 3, text: 'Verifying signature with CrackIt backend' }
                            ].map((item) => (
                                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                    <div
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            background: processingStep >= item.step ? '#10b981' : '#e2e8f0',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            flexShrink: 0
                                        }}
                                    >
                                        {processingStep > item.step ? <Check size={12} strokeWidth={3} /> : item.step}
                                    </div>
                                    <span style={{ color: processingStep >= item.step ? '#1e293b' : '#94a3b8', fontWeight: processingStep === item.step ? 700 : 500 }}>
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════
                    VIEW 4: SUCCESS CELEBRATION
                   ════════════════════════════════════════════════════════════════════ */}
                {gatewayStep === 'SUCCESS' && (
                    <div style={{ padding: '40px 24px 32px', textAlign: 'center' }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: '#dcfce7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: '#16a34a'
                            }}
                        >
                            <CheckCircle2 size={38} strokeWidth={2.5} />
                        </div>

                        <h3 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: '#15803d' }}>
                            Payment Successful!
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#475569' }}>
                            Welcome to <strong>Crackit Pro</strong>! Your account has been upgraded with unlimited AI credits.
                        </p>

                        <div
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                padding: '12px 16px',
                                maxWidth: 360,
                                margin: '0 auto 16px',
                                fontSize: 12.5,
                                color: '#334155',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                            }}
                        >
                            <div><strong>Plan:</strong> {currentPlan.name} ({currentPlan.validityDays} Days)</div>
                            <div><strong>Amount Paid:</strong> {currentPlan.price} (Test Mode)</div>
                            <div><strong>Status:</strong> Active Pro Member</div>
                        </div>

                        <div style={{ fontSize: 12, color: '#64748b' }}>
                            Redirecting to your enhanced Pro dashboard...
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
