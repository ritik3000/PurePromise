import { ContactForm } from "./ContactForm";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Contact Us - PurePromise",
  description: "Send feedback or get in touch with PurePromise support.",
};

const SUPPORT_EMAIL = "customersupport@pure-promise.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-10">
          <Mail className="h-12 w-12 mx-auto text-rose-500 dark:text-rose-400 mb-4" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Contact Us
          </h1>
          <p className="mt-2 text-muted-foreground">
            Share your feedback or questions. We&apos;ll get back to you as soon
            as we can.
          </p>
        </div>

        <ContactForm />

        <div className="mt-10 rounded-xl border border-rose-950/20 dark:border-rose-950/40 bg-muted/30 dark:bg-muted/10 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Prefer to write directly?
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
