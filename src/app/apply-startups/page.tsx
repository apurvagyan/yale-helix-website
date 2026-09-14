"use client";

import Link from "next/link";
import { ui } from "../components/ui";

export default function StartupApplicationClosedPage() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <Link href="/" className={ui.returnButton}>
          &larr; Return to homepage
        </Link>

        <div className="mt-16 text-center">
          <p className={ui.eyebrow}>Startup application</p>
          <h1 className={ui.title}>Applications are closed</h1>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Thank you for your interest in the Yale Helix Incubator. Startup applications for the
            2026&ndash;2027 cycle are closed and we are no longer accepting submissions. If your team
            already applied, we have your application and will be in touch.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Please check back for future application cycles.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-xl border border-hairline bg-surface p-7 text-left">
            <h2 className={ui.sectionTitle}>Questions?</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              For any questions about the incubator or partnering with Helix, reach out to us at{" "}
              <a href="mailto:admin@yalehelix.org" className={ui.link}>
                admin@yalehelix.org
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
