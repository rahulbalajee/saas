"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useAuth, UserButton, Protect, PricingTable } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";
const labelClasses =
    "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

function ConsultationSummary() {
    const { getToken } = useAuth();
    const [patientName, setPatientName] = useState("");
    const [visitDate, setVisitDate] = useState("");
    const [notes, setNotes] = useState("");
    const [summary, setSummary] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError("");
        setSummary("");
        let buffer = "";

        try {
            const jwt = await getToken();
            if (!jwt) {
                setError("Authentication error");
                return;
            }

            await fetchEventSource("/api", {
                signal: controller.signal,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    patient_name: patientName,
                    date_of_visit: visitDate,
                    notes,
                }),
                openWhenHidden: true,
                onopen: async (res) => {
                    if (!res.ok) {
                        throw new Error(
                            `Request failed with status ${res.status}`
                        );
                    }
                },
                onmessage: (event) => {
                    if (event.event === "error") {
                        throw new Error(event.data || "Streaming failed");
                    }
                    if (event.event === "done" || !event.data) {
                        return;
                    }
                    buffer += JSON.parse(event.data) as string;
                    setSummary(buffer);
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
            if (abortRef.current === controller) {
                abortRef.current = null;
            }
            setLoading(false);
        }
    };

    const canSubmit =
        !loading && patientName.trim() && visitDate && notes.trim();

    return (
        <>
            {/* Header */}
            <header className="text-center mb-12">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    Consultation Summary Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Turn visit notes into a summary, next steps, and a
                    patient-friendly email.
                </p>
            </header>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Consultation form */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-2xl bg-white/95 dark:bg-gray-800/95 p-8 shadow-xl backdrop-blur-lg"
                >
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="patientName" className={labelClasses}>
                                Patient name
                            </label>
                            <input
                                id="patientName"
                                type="text"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="Jane Doe"
                                required
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label htmlFor="visitDate" className={labelClasses}>
                                Date of visit
                            </label>
                            <input
                                id="visitDate"
                                type="date"
                                value={visitDate}
                                onChange={(e) => setVisitDate(e.target.value)}
                                required
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className={labelClasses}>
                            Visit notes
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter the doctor's notes from the patient's visit..."
                            required
                            rows={8}
                            className={`${inputClasses} resize-y`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-lg font-bold text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading && (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        )}
                        {loading ? "Generating…" : "Generate Summary"}
                    </button>
                </form>

                {/* Result */}
                {(error || loading || summary) && (
                    <div className="rounded-2xl bg-white/95 dark:bg-gray-800/95 p-8 shadow-xl backdrop-blur-lg">
                        {error ? (
                            <div className="text-red-500">{error}</div>
                        ) : loading && !summary ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-pulse text-gray-400">
                                    Generating your consultation summary...
                                </div>
                            </div>
                        ) : (
                            <article className="prose prose-neutral dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                >
                                    {summary}
                                </ReactMarkdown>
                            </article>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export default function Product() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12">
                {/* Navigation (shown for both subscribed and unsubscribed users) */}
                <nav className="mb-12 flex items-center justify-between">
                    <Link
                        href="/"
                        className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                    >
                        MediSummary
                    </Link>
                    <UserButton />
                </nav>

                {/* Subscription protection */}
                <Protect
                    plan="premium_subscription"
                    fallback={
                        <>
                            <header className="text-center mb-12">
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                    Choose Your Plan
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                                    Unlock unlimited AI-powered consultation
                                    summaries
                                </p>
                            </header>
                            <div className="max-w-md mx-auto">
                                <PricingTable />
                            </div>
                        </>
                    }
                >
                    <ConsultationSummary />
                </Protect>
            </div>
        </main>
    );
}
