import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAdminPasswordHash, setAdminPasswordHash } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();
    const passwordSalt = process.env.PASSWORD_SALT || "default-salt";

    // Đọc hash hiện tại từ DB (fallback về env)
    const adminPasswordHash = await getAdminPasswordHash();

    if (!adminPasswordHash) {
      return NextResponse.json(
        { error: "Cấu hình server chưa hoàn chỉnh" },
        { status: 500 }
      );
    }

    // Xác minh mật khẩu hiện tại
    const currentHash = crypto
      .createHash("sha256")
      .update(currentPassword + passwordSalt)
      .digest("hex");

    if (currentHash !== adminPasswordHash) {
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không đúng" },
        { status: 401 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải có ít nhất 8 ký tự" },
        { status: 400 }
      );
    }

    const newHash = crypto
      .createHash("sha256")
      .update(newPassword + passwordSalt)
      .digest("hex");

    // Lưu hash mới vào DB → có hiệu lực ngay trên mọi thiết bị
    await setAdminPasswordHash(newHash);

    return NextResponse.json({
      message: "✅ Mật khẩu đã được đổi thành công. Có hiệu lực ngay lập tức.",
      updated: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Thao tác thất bại" }, { status: 500 });
  }
}
