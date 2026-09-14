"use client";

import Link from "next/link";
import { ui } from "@/app/components/ui";

export default function StudentApplicationSuccessPage() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <Link href="/" className={ui.returnButton}>
          &larr; Return to homepage
        </Link>

        <div className="mt-16 text-center">
          <p className={ui.eyebrow}>Application received</p>
          <h1 className={ui.title}>Application submitted successfully</h1>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Thank you for applying to the Yale Helix student fellowship. We have received your
            application and will be in touch soon.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-xl border border-hairline bg-surface p-7 text-left">
            <h2 className={ui.sectionTitle}>Questions?</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              For any questions about the student fellow program, reach out to us at{" "}
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
