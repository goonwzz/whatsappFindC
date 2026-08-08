import { getEmailConfigStatus } from "../../../lib/email-config";

export async function GET() {
  const email = getEmailConfigStatus();
  return Response.json({
    ok: true,
    service: "kangjie-lead-api",
    version: "0.2.0",
    email: { provider: email.provider, configured: email.configured },
  });
}
