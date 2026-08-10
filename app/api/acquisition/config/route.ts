import { acquisitionConfig } from "../../../../lib/buyer-acquisition";

export async function GET() {
  return Response.json(acquisitionConfig());
}
