import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { repairUtf8Text } from "@/lib/text";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name,
      age,
      location_type,
      location_name,
      topic_id,
      topic_other,
      content,
      is_anonymous,
    } = body;

    // Validation
    if (!age || !location_type || !location_name || !content) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 30) {
      return NextResponse.json(
        { error: "Tuổi không hợp lệ (từ 1 đến 30)" },
        { status: 400 }
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: "Nội dung quá ngắn (tối thiểu 10 ký tự)" },
        { status: 400 }
      );
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "Nội dung quá dài (tối đa 2000 ký tự)" },
        { status: 400 }
      );
    }

    const db = getSql();
    const displayName = is_anonymous ? null : repairUtf8Text(full_name) || null;
    const safeLocation = repairUtf8Text(location_name);
    const safeTopicOther = repairUtf8Text(topic_other);
    const safeContent = repairUtf8Text(content);

    await db`
      INSERT INTO opinions (
        full_name, age, location_type, location_name,
        topic_id, topic_other, content, is_anonymous
      ) VALUES (
        ${displayName},
        ${ageNum},
        ${location_type},
        ${safeLocation},
        ${topic_id || null},
        ${safeTopicOther || null},
        ${safeContent},
        ${is_anonymous || false}
      )
    `;

    return NextResponse.json(
      { message: "Ý kiến đã được gửi thành công!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Gửi thất bại, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
