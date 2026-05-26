"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

interface Props {
  featureKey: string;
  /** Short label shown in the upgrade prompt, e.g. "Custom SMTP" */
  featureName: string;
  /** Plan name required, e.g. "Pro" */
  requiredPlan?: string;
  children: React.ReactNode;
}

/**
 * Wraps children behind a feature gate.
 * If the restaurant's plan doesn't include the feature, renders a locked upgrade prompt instead.
 */
export default function UpgradeGate({ featureKey, featureName, requiredPlan = "Pro", children }: Props) {
  const { hasFeature, user } = useAuthStore();

  // Admins and users without a restaurant (edge case) always see children
  if (!user || user.role === "ADMIN" || hasFeature(featureKey)) {
    return <>{children}</>;
  }

  return (
    <div style={{
      border: "1.5px dashed rgba(196,65,12,0.25)",
      borderRadius: "10px",
      padding: "1.25rem 1.5rem",
      background: "rgba(196,65,12,0.03)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      flexWrap: "wrap",
    }}>
      <div>
        <p style={{ fontWeight: 600, color: "#18160f", marginBottom: "0.2rem", fontSize: "0.9375rem" }}>
          🔒 {featureName}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "#9a9088", margin: 0 }}>
          Available on the <strong>{requiredPlan}</strong> plan and above.
        </p>
      </div>
      <Link href="/billing" style={{ textDecoration: "none" }}>
        <button style={{
          background: "#c4410c", color: "#fff", border: "none",
          borderRadius: "7px", padding: "0.45rem 1rem",
          fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
          whiteSpace: "nowrap",
        }}>
          Upgrade plan
        </button>
      </Link>
    </div>
  );
}
