"use client"

import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const loadIdea = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setIdea("");

    try {
      const res = await fetch("/api", { signal: controller.signal });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const flushEvents = () => {
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const data = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).replace(/^ /, ""))
            .join("\n");
          if (data) {
            setIdea((prev) => prev + data);
          }
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        flushEvents();
      }
      buffer += decoder.decode();
      flushEvents();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(loadIdea, 0);
    return () => {
      clearTimeout(id);
      abortRef.current?.abort();
    };
  }, [loadIdea]);

  return (
    <>
      <Head>
        <title>Business Idea Generator</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto flex flex-col items-center gap-8 px-4 py-16">
          <header className="flex flex-col items-center gap-3 text-center">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
              Business Idea Generator
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              AI-powered innovation at your fingertips
            </p>
          </header>

          <button
            onClick={loadIdea}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? "Generating…" : idea ? "Generate another" : "Generate idea"}
          </button>

          <section className="w-full max-w-3xl">
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-red-500 shadow-xl">
                {error}
              </div>
            ) : idea ? (
              <article className="prose prose-neutral dark:prose-invert max-w-none rounded-2xl bg-white/95 p-8 shadow-xl backdrop-blur-lg dark:bg-gray-800/95">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {idea}
                </ReactMarkdown>
              </article>
            ) : (
              !loading && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800/50">
                  No idea yet — hit generate.
                </div>
              )
            )}
          </section>
        </div>
      </main>
    </>
  );
}
