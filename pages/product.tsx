"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useAuth, UserButton } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";

export default function Product() {
    const { getToken } = useAuth();
    const [idea, setIdea] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        let buffer = "";

        (async () => {
            const jwt = await getToken();
            if (!jwt) {
                setError("Authentication error");
                setLoading(false);
                return;
            }

            try {
                await fetchEventSource("/api", {
                    signal: controller.signal,
                    headers: { Authorization: `Bearer ${jwt}` },
                    openWhenHidden: true,
                    onopen: async (res) => {
                        if (!res.ok) {
                            throw new Error(
                                `Request failed with status ${res.status}`
                            );
                        }
                    },
                    onmessage: (event) => {
                        buffer += event.data;
                        setIdea(buffer);
                        setLoading(false);
                    },
                    onclose: () => {
                        throw new Error("__done__");
                    },
                    onerror: (err) => {
                        throw err;
                    },
                });
            } catch (err) {
                if (
                    !controller.signal.aborted &&
                    (err as Error).message !== "__done__"
                ) {
                    setError((err as Error).message || "Something went wrong");
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [getToken]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12">
                {/* Navigation */}
                <nav className="mb-12 flex items-center justify-between">
                    <Link
                        href="/"
                        className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                    >
                        IdeaGen
                    </Link>
                    <UserButton />
                </nav>

                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                        Business Idea Generator
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        AI-powered innovation at your fingertips
                    </p>
                </header>

                {/* Content Card */}
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-xl p-8 backdrop-blur-lg">
                        {error ? (
                            <div className="text-red-500">{error}</div>
                        ) : loading && !idea ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-pulse text-gray-400">
                                    Generating your business idea...
                                </div>
                            </div>
                        ) : (
                            <article className="prose prose-neutral dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                >
                                    {idea}
                                </ReactMarkdown>
                            </article>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
