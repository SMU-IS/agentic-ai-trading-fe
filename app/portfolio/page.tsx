'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet, LineChart } from 'lucide-react';
import PortfolioTab from '@/components/portfolio/PortfolioTab';
import PredictionsTab from '@/components/portfolio/ predictions/PredictionsTab';

export default function PortfolioPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'predictions'>(
    'portfolio'
  );

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-foreground text-xl font-semibold">
              Agent M
            </span>
            <div className="flex items-center gap-1 ml-4">
              <NavButton
                active={activeTab === 'portfolio'}
                onClick={() => setActiveTab('portfolio')}
                icon={<Wallet className="w-4 h-4 mr-1.5" />}
                label="Portfolio"
              />
              <NavButton
                active={activeTab === 'predictions'}
                onClick={() => setActiveTab('predictions')}
                icon={<LineChart className="w-4 h-4 mr-1.5" />}
                label="Predictions"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm hidden sm:block">
              Welcome, <span className="text-foreground">{user.username}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                router.push('/');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'portfolio' ? <PortfolioTab /> : <PredictionsTab />}
      </main>
    </div>
  );
}

// Helper component for nav buttons
function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
        active
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}
