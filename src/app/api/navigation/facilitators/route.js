import { allPublicItems } from "@/lib/public-api";

import {
  facilitatorProfileLink,
} from "@/lib/navigation-menu";

export async function GET() {
  try {
    const result = await allPublicItems(
      "facilitators"
    );

    if (result?.error) {
      console.error(
        "[Facilitator Navigation]",
        result.error
      );

      return Response.json(
        {
          success: false,
          links: [],
          message:
            "Facilitators are temporarily unavailable.",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const people = Array.isArray(result?.data)
      ? result.data
      : [];

    const seen = new Set();

    const links = people
      .map(facilitatorProfileLink)
      .filter((link) => {
        if (!link?.href) return false;

        if (seen.has(link.href)) {
          return false;
        }

        seen.add(link.href);
        return true;
      });

    return Response.json(
      {
        success: true,
        links,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch (error) {
    console.error(
      "[Facilitator Navigation Error]",
      error
    );

    return Response.json(
      {
        success: false,
        links: [],
        message:
          "Unable to load facilitator navigation.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}