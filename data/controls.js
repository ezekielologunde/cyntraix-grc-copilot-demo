// Eight controls from NIST SP 800-53 Rev. 5 (a US government publication, public domain
// under 17 U.S.C. SS 105). Only the control ID and title are drawn from the catalog;
// each `description` below is this project's own short paraphrase for matching purposes,
// not a verbatim quotation of catalog text -- do not treat it as the authoritative
// control definition. Framework: NIST SP 800-53 Rev. 5, catalog release 2020-09-23.

export const CONTROLS = {
  frameworkId: "nist-800-53-rev5",
  frameworkVersion: "Rev. 5 (2020-09-23), eight-control demo subset",
  controls: [
    { id: "IA-2", title: "Identification and Authentication (Organizational Users)",
      description: "Uniquely identify and authenticate each organizational user before granting system access." },
    { id: "AC-6", title: "Least Privilege",
      description: "Restrict user permissions to the minimum necessary to perform assigned tasks, reviewed periodically." },
    { id: "AC-7", title: "Unsuccessful Logon Attempts",
      description: "Limit consecutive invalid logon attempts and lock the account or delay further attempts after the limit is reached." },
    { id: "AC-17", title: "Remote Access",
      description: "Establish and enforce usage restrictions for remote access, including encryption and session controls." },
    { id: "AC-2", title: "Account Management",
      description: "Manage system accounts including establishment, activation, modification, and types such as privileged accounts." },
    { id: "PS-4", title: "Personnel Termination",
      description: "Disable system access and retrieve credentials within a defined period after personnel termination." },
    { id: "AU-2", title: "Event Logging",
      description: "Identify and log organization-defined events, including access control decisions, to support audit and review." },
    { id: "CM-11", title: "User-Installed Software",
      description: "Establish and enforce policy restricting software installation on organizational systems without authorization." },
  ],
};
