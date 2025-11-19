import { useAuthStore } from '../store/authStore';

export function TrialBanner() {
    const { user } = useAuthStore();

    if (!user || user.subscriptionStatus !== 'trial' || !user.trialEndsAt) {
        return null;
    }

    const trialEnd = new Date(user.trialEndsAt);
    const now = new Date();
    const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return null;

    return (
        <div className="bg-indigo-600 text-white px-4 py-2 text-sm font-medium text-center">
            <p>
                Your free trial ends in {diffDays} days.{' '}
                <button className="underline hover:text-indigo-100 ml-2">
                    Upgrade now
                </button>
            </p>
        </div>
    );
}
