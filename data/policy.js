// Original synthetic policy document. Not a real customer's policy, not copied from any
// real organization. Written for this demo only, versioned so every citation claim is
// checkable against a document the visitor can also read on the page.

export const POLICY = {
  id: "acme-access-control-policy",
  title: "Acme Example Corp — Access Control Policy",
  version: "v1.0 (synthetic, 2026-10-09)",
  clauses: [
    {
      id: "P-1",
      text: "All user accounts must be uniquely identified and authenticated before being granted access to any production system.",
    },
    {
      id: "P-2",
      text: "Access to production systems must be restricted to the minimum set of permissions required for a user's job role, reviewed quarterly by the resource owner.",
    },
    {
      id: "P-3",
      text: "Failed login attempts must be limited to five consecutive tries, after which the account is locked for a minimum of fifteen minutes.",
    },
    {
      id: "P-4",
      text: "All remote access to internal systems must be established through an approved, encrypted connection, and sessions must time out after thirty minutes of inactivity.",
    },
    {
      id: "P-5",
      text: "Administrator and other privileged accounts must be separate from standard user accounts and used only when elevated access is required for a specific task.",
    },
    {
      id: "P-6",
      text: "Terminated employees must have all system access revoked within one business day of their departure date.",
    },
    {
      id: "P-7",
      text: "All access control decisions, including grants, denials, and revocations, must be logged with enough detail to support an after-the-fact audit.",
    },
    {
      id: "P-8",
      text: "New software or hardware must not be installed on company systems without prior review and approval from the IT department.",
    },
  ],
};
