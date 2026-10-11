import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { LEGACY_TOPIC_ALIASES, normalizeTopicName, TOPIC_OPTIONS } from "@/lib/topicOptions";

type TopicRow = { id: number; name: string; is_active: boolean; created_at: string };

export async function GET(request: NextRequest) {
  try {
    const db = getSql();
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "1";

    // Nếu showAll=1 (admin), lấy tất cả kể cả chủ đề bị ẩn
    const topics = showAll
      ? (await db`SELECT * FROM topics ORDER BY name ASC`) as TopicRow[]
      : (await db`SELECT * FROM topics WHERE is_active = true ORDER BY name ASC`) as TopicRow[];

    // Chuẩn hóa tên (xử lý alias cũ)
    const normalized = topics.map((topic) => ({
      ...topic,
      name: normalizeTopicName(topic.name),
    }));

    // Cập nhật DB nếu tên đã được chuẩn hóa
    for (const topic of normalized) {
      const canonical = LEGACY_TOPIC_ALIASES[topic.name] ?? topic.name;
      if (canonical !== topic.name) {
        await db`UPDATE topics SET name = ${canonical} WHERE id = ${topic.id}`;
        topic.name = canonical;
      }
    }

    // Loại bỏ trùng tên
    const topicMap = new Map<string, TopicRow>();
    for (const topic of normalized) {
      if (topic.name?.trim()) {
        topicMap.set(topic.name.trim(), topic);
      }
    }

    // Với request thông thường (form người dùng): bổ sung TOPIC_OPTIONS mặc định nếu thiếu
    if (!showAll) {
      for (const topicName of TOPIC_OPTIONS) {
        if (!topicMap.has(topicName)) {
          topicMap.set(topicName, {
            id: 0,
            name: topicName,
            is_active: true,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json(
      Array.from(topicMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    );
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSql();
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Tên chủ đề không được để trống" },
        { status: 400 }
      );
    }

    const normalizedName = normalizeTopicName(name.trim());
    const result = (await db`INSERT INTO topics (name) VALUES (${normalizedName}) ON CONFLICT (name) DO NOTHING RETURNING *`) as TopicRow[];

    if (result.length === 0) {
      const existing = (await db`SELECT * FROM topics WHERE name = ${normalizedName} LIMIT 1`) as TopicRow[];
      if (existing[0]) {
        return NextResponse.json(existing[0], { status: 200 });
      }
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "Chủ đề này đã tồn tại" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Thêm chủ đề thất bại" },
      { status: 500 }
    );
  }
}
