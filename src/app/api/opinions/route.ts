import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { repairUtf8Text } from "@/lib/text";

type OpinionRow = {
  id: number;
  full_name: string | null;
  age: number;
  location_type: string;
  location_name: string;
  topic_id: number | null;
  topic_other: string | null;
  content: string;
  evidence_image: string | null;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  topic_name: string | null;
};

type CountRow = { total: string };

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") || null;
  const location = searchParams.get("location") || null;
  const status = searchParams.get("status") || null;
  const dateFrom = searchParams.get("dateFrom") || null;
  const dateTo = searchParams.get("dateTo") || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20"))
  );
  const offset = (page - 1) * limit;

  try {
    const db = getSql();
    const topicFilter = topic ? `%${topic}%` : null;
    const locationFilter = location ? `%${location}%` : null;

    const opinions = (await db`
      SELECT
        o.*,
        t.name as topic_name
      FROM opinions o
      LEFT JOIN topics t ON o.topic_id = t.id
      WHERE
        (${topicFilter}::text IS NULL
          OR t.name ILIKE ${topicFilter}
          OR o.topic_other ILIKE ${topicFilter})
        AND (${locationFilter}::text IS NULL
          OR o.location_name ILIKE ${locationFilter})
        AND (${status}::text IS NULL OR o.status = ${status})
        AND (${dateFrom}::text IS NULL
          OR o.created_at >= (${dateFrom}::date))
        AND (${dateTo}::text IS NULL
          OR o.created_at < (${dateTo}::date + INTERVAL '1 day'))
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as OpinionRow[];

    const countResult = (await db`
      SELECT COUNT(*) as total
      FROM opinions o
      LEFT JOIN topics t ON o.topic_id = t.id
      WHERE
        (${topicFilter}::text IS NULL
          OR t.name ILIKE ${topicFilter}
          OR o.topic_other ILIKE ${topicFilter})
        AND (${locationFilter}::text IS NULL
          OR o.location_name ILIKE ${locationFilter})
        AND (${status}::text IS NULL OR o.status = ${status})
        AND (${dateFrom}::text IS NULL
          OR o.created_at >= (${dateFrom}::date))
        AND (${dateTo}::text IS NULL
          OR o.created_at < (${dateTo}::date + INTERVAL '1 day'))
    `) as CountRow[];

    const safeOpinions = opinions.map((opinion) => ({
      ...opinion,
      full_name: repairUtf8Text(opinion.full_name),
      location_name: repairUtf8Text(opinion.location_name) || "",
      topic_name: repairUtf8Text(opinion.topic_name),
      topic_other: repairUtf8Text(opinion.topic_other),
      content: repairUtf8Text(opinion.content) || "",
      evidence_image: opinion.evidence_image || null,
    }));

    return NextResponse.json({
      opinions: safeOpinions,
      total: Number(countResult[0].total),
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching opinions:", error);
    return NextResponse.json(
      { error: "Failed to fetch opinions" },
      { status: 500 }
    );
  }
}
