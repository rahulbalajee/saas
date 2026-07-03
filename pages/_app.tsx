import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#4f46e5",
          borderRadius: "0.75rem",
          fontFamily: "inherit",
        },
        elements: {
          card: "shadow-xl",
          pricingTableCard: "shadow-lg",
        },
      }}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
