import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

type OpinionRow = {
  id: number;
  status: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!["pending", "resolved"].includes(status)) {
    return NextResponse.json(
      { error: "Trạng thái không hợp lệ" },
      { status: 400 }
    );
  }

  try {
    const db = getSql();
    const result = (await db`UPDATE opinions SET status = ${status} WHERE id = ${id} RETURNING *`) as OpinionRow[];
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy ý kiến" },
        { status: 404 }
      );
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating opinion status:", error);
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

  try {
    const db = getSql();
    await db`DELETE FROM opinions WHERE id = ${id}`;
    return NextResponse.json({ message: "Đã xóa ý kiến" });
  } catch (error) {
    console.error("Error deleting opinion:", error);
    return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 });
  }
}
