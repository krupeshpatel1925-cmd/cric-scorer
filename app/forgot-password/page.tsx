"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="cricket-card p-8 border-slate-800 shadow-cardGlow space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div>
          <h1 className="text-2xl font-black text-white">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your email address and we&apos;ll send instructions to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="text-sm font-semibold">Password reset link sent!</p>
            <p className="text-xs text-slate-400">
              If an account with {email} exists, check your inbox for the reset link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-neon text-sm transition-all"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
