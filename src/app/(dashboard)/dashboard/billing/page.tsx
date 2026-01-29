'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@/types'

const TRIAL_DAYS = 14

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2400,
    priceDisplay: '₹2,400',
    description: 'For small businesses',
    features: ['Up to 3 clients', 'Basic booking', 'Email notifications'],
    trialDays: TRIAL_DAYS,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 6500,
    priceDisplay: '₹6,500',
    description: 'For growing agencies',
    features: ['Up to 10 clients', 'Calendar sync', 'Custom branding', 'Priority support'],
    popular: true,
    trialDays: TRIAL_DAYS,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 16500,
    priceDisplay: '₹16,500',
    description: 'For large agencies',
    features: ['Unlimited clients', 'Full white-label', 'API access', 'Dedicated support'],
    trialDays: TRIAL_DAYS,
  },
]

export default function BillingPage() {
  const { tenant } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!tenant?.id) return

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single()

      if (data) {
        setSubscription(data as Subscription)
      }
      setIsLoading(false)
    }

    fetchSubscription()
  }, [tenant?.id, supabase])

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await response.json()

      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Error creating checkout:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManageBilling = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.data?.url) {
        window.location.href = data.data.url
      }
    } catch (err) {
      console.error('Error creating portal session:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold capitalize">{subscription.plan} Plan</p>
                <p className="text-sm text-gray-500">
                  Status:{' '}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : subscription.status === 'trialing'
                        ? 'bg-blue-100 text-blue-800'
                        : subscription.status === 'past_due'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </p>
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-500 mt-1">
                    {subscription.status === 'trialing' ? 'Trial ends' : 'Renews'} on{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscription.razorpay_subscription_id && !subscription.razorpay_subscription_id.startsWith('trial_') && (
                <Button variant="outline" onClick={handleManageBilling} isLoading={isProcessing}>
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {subscription?.status === 'active' ? 'Change Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'border-primary-500 border-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                {plan.trialDays > 0 && !subscription && (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    {plan.trialDays}-day free trial
                  </p>
                )}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={subscription?.plan === plan.id ? 'outline' : 'primary'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscription?.plan === plan.id && subscription?.status === 'active'}
                  isLoading={isProcessing}
                >
                  {subscription?.plan === plan.id && subscription?.status === 'active'
                    ? 'Current Plan'
                    : subscription?.status === 'trialing'
                    ? 'Upgrade Now'
                    : plan.trialDays > 0
                    ? 'Start Free Trial'
                    : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
