import React from 'react';
import Layout from '../components/Layout';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function SubscriptionPage() {
    const { user } = useAuthStore();

    const plans = [
        {
            name: 'Starter',
            price: '$0',
            period: '/month',
            description: 'Perfect for freelancers just starting out.',
            features: ['Unlimited Quotes', 'Basic Templates', 'PDF Export', 'Email Support'],
            current: user?.subscriptionStatus === 'free',
            color: 'blue'
        },
        {
            name: 'Pro',
            price: '$29',
            period: '/month',
            description: 'For growing businesses that need more power.',
            features: ['Everything in Starter', 'Custom Branding', 'Multi-currency', 'Priority Support', 'AI Insights'],
            current: user?.subscriptionStatus === 'trial' || user?.subscriptionStatus === 'active',
            popular: true,
            color: 'indigo'
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'For large teams with specific requirements.',
            features: ['Everything in Pro', 'SSO', 'Dedicated Account Manager', 'Custom Contracts', 'SLA'],
            current: false,
            color: 'slate'
        }
    ];

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12 pb-20">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose the plan that fits your business needs. No hidden fees. Cancel anytime.
                    </p>
                    {user?.subscriptionStatus === 'trial' && (
                        <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium">
                            You are currently on a Free Trial. Enjoy Pro features!
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-card text-card-foreground rounded-2xl border ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border shadow-sm'
                                } p-8 flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-3 rounded-xl font-medium transition ${plan.current
                                        ? 'bg-muted text-muted-foreground cursor-default'
                                        : plan.popular
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                                disabled={plan.current}
                            >
                                {plan.current ? 'Current Plan' : 'Upgrade Now'}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold">Secure Payments</h3>
                        <p className="text-sm text-muted-foreground">Your payment information is processed securely by Stripe.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30 dark:text-green-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold">Instant Access</h3>
                        <p className="text-sm text-muted-foreground">Get access to all features immediately after upgrading.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
                            <Star className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold">Cancel Anytime</h3>
                        <p className="text-sm text-muted-foreground">No long-term contracts. Cancel your subscription at any time.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
