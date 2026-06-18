import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { Package, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center p-4">
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 p-2 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 font-medium"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <SignIn />
      </div>
    </div>
  );
}
