import type { Metadata } from "next";
import PrivacyPolicyContent from "./PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy — Mesa",
  description: "How Mesa collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
