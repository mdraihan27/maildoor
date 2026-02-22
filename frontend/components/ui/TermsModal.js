/**
 * TermsModal — Shows terms agreement before Google OAuth.
 * User must accept terms before being redirected to Google sign-in.
 */
"use client";

import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function TermsModal({ open, onClose, onAccept }) {
  return (
    <Modal open={open} onClose={onClose} title="Terms & Privacy">
      <div className="space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          By continuing, you agree to the MailDoor{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-[#70012b] hover:text-[#e0a0b8] underline underline-offset-2"
          >
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-[#70012b] hover:text-[#e0a0b8] underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-sm text-muted leading-relaxed">
          You acknowledge that you are solely responsible for all content sent
          through the Service, including the recipients, subject matter, and body
          of every email. MailDoor and its creators bear no responsibility for
          how the Service is used.
        </p>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onAccept} className="flex-1">
            I Agree
          </Button>
        </div>
      </div>
    </Modal>
  );
}
