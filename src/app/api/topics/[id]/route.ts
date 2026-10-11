import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

type TopicRow = { id: number; name: string; is_active: boolean };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getSql();
  const body = await request.json();
  const { name, is_active } = body;

  try {
    if (name !== undefined) {
      const result = (await db`UPDATE topics SET name = ${name} WHERE id = ${id} RETURNING *`) as TopicRow[];
      return NextResponse.json(result[0]);
    }
    if (is_active !== undefined) {
      const result = (await db`UPDATE topics SET is_active = ${is_active} WHERE id = ${id} RETURNING *`) as TopicRow[];
      return NextResponse.json(result[0]);
    }
    return NextResponse.json(
      { error: "Không có gì để cập nhật" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Cập nhật thất bại" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getSql();

  try {
    // Lấy tên chủ đề trước khi xóa
    const rows = await db`SELECT name FROM topics WHERE id = ${id}` as { name: string }[];
    if (rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy chủ đề" }, { status: 404 });
    }
    const topicName = rows[0].name;

    // Chuyển tất cả ý kiến dùng chủ đề này sang "Khác"
    await db`
      UPDATE opinions
      SET topic_id = NULL,
          topic_other = 'Khác'
      WHERE topic_id = ${id}
    `;

    // Xóa vĩnh viễn chủ đề
    await db`DELETE FROM topics WHERE id = ${id}`;

    return NextResponse.json({ message: `Đã xóa chủ đề "${topicName}". Các ý kiến liên quan đã chuyển sang "Khác".` });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 });
  }
}
