import { getEmailConfigStatus } from "../../../../lib/email-config";

export async function GET() {
  return Response.json(getEmailConfigStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
