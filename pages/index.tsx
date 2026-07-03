"use client"

import Head from "next/head";
import Link from "next/link";
import {
  PricingTable,
  Protect,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const features = [
  {
    title: "Instant Summaries",
    description:
      "Turn raw visit notes into a clear summary for your records in seconds.",
    icon: "📝",
  },
  {
    title: "Next Steps & Patient Email",
    description:
      "Get suggested next steps plus a draft email in patient-friendly language, ready to send.",
    icon: "✉️",
  },
  {
    title: "Real-Time Streaming",
    description:
      "Watch the summary appear token-by-token as the model works — no waiting for a full response.",
    icon: "⚡",
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>MediSummary — AI Consultation Summaries</title>
        <meta
          name="description"
          content="Turn doctor's visit notes into a summary, next steps, and a patient-friendly email with AI."
        />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          {/* Navigation */}
          <nav className="mb-12 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              MediSummary
            </h1>
            <div className="flex items-center gap-6">
              <a
                href="#pricing"
                className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:block dark:text-gray-400 dark:hover:text-gray-100"
              >
                Pricing
              </a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-4">
                  <Link
                    href="/product"
                    className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Go to App
                  </Link>
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="py-24 text-center">
            <h2 className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-6xl font-bold text-transparent">
              Turn Visit Notes Into
              <br />
              Polished Summaries
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
              Let AI turn your consultation notes into a clean summary, clear
              next steps, and a patient-friendly email — in seconds.
            </p>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/product"
                className="inline-block transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
              >
                Generate a Summary
              </Link>
            </SignedIn>
          </div>

          {/* Pricing Section */}
          <section id="pricing" className="scroll-mt-24 py-16">
            <div className="mb-10 text-center">
              <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Go Premium to unlock unlimited AI-powered consultation
                summaries.
              </p>
            </div>
            <Protect
              plan="premium_subscription"
              fallback={
                <div className="mx-auto max-w-md">
                  <PricingTable />
                </div>
              }
            >
              <div className="mx-auto max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-lg backdrop-blur-lg dark:bg-gray-800/70">
                <div className="mb-4 text-4xl">🎉</div>
                <h3 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  You&apos;re on Premium
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Your subscription is active — enjoy unlimited AI-powered
                  consultation summaries.
                </p>
                <Link
                  href="/product"
                  className="inline-block transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
                >
                  Access Premium Features
                </Link>
              </div>
            </Protect>
          </section>

          {/* Features Section */}
          <section className="grid gap-8 py-12 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white/70 p-8 shadow-lg backdrop-blur-lg dark:bg-gray-800/70"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </section>

          {/* Footer */}
          <footer className="mt-12 border-t border-gray-200/60 py-8 text-center text-sm text-gray-500 dark:border-gray-700/60 dark:text-gray-400">
            © {new Date().getFullYear()} MediSummary. Powered by AI.
          </footer>
        </div>
      </main>
    </>
  );
}
