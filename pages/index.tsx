"use client"

import Head from "next/head";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const features = [
  {
    title: "AI-Powered Ideas",
    description:
      "Generate fresh, market-ready business concepts built for the AI agent economy in seconds.",
    icon: "✨",
  },
  {
    title: "Structured Output",
    description:
      "Every idea arrives formatted with headings, sub-headings, and bullet points you can act on.",
    icon: "📋",
  },
  {
    title: "Real-Time Streaming",
    description:
      "Watch your idea appear token-by-token as the model thinks — no waiting for a full response.",
    icon: "⚡",
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>IdeaGen — AI Business Idea Generator</title>
        <meta
          name="description"
          content="Harness AI to discover innovative business opportunities tailored for the AI agent economy."
        />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          {/* Navigation */}
          <nav className="mb-12 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              IdeaGen
            </h1>
            <div>
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
              Generate Your Next
              <br />
              Big Business Idea
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
              Harness the power of AI to discover innovative business
              opportunities tailored for the AI agent economy
            </p>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700">
                  Get Started Free
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/product"
                className="inline-block transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
              >
                Generate Ideas Now
              </Link>
            </SignedIn>
          </div>

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
            © {new Date().getFullYear()} IdeaGen. Powered by AI.
          </footer>
        </div>
      </main>
    </>
  );
}
