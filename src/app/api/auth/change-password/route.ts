import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

async function persistAdminPasswordHash(newHash: string) {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    process.env.ADMIN_PASSWORD_HASH = newHash;
    return false;
  }

  const envFilePath = path.resolve(process.cwd(), ".env.local");
  let envContent = "";

  try {
    envContent = await fs.readFile(envFilePath, "utf8");
  } catch {
    envContent = "";
  }

  const lines = envContent.split(/\r?\n/);
  let updated = false;

  const nextLines = lines.map((line) => {
    if (line.startsWith("ADMIN_PASSWORD_HASH=")) {
      updated = true;
      return `ADMIN_PASSWORD_HASH="${newHash}"`;
    }
    return line;
  });

  if (!updated) {
    nextLines.push(`ADMIN_PASSWORD_HASH="${newHash}"`);
  }

  const finalContent = `${nextLines.join("\n")}\n`;
  await fs.writeFile(envFilePath, finalContent, "utf8");
  process.env.ADMIN_PASSWORD_HASH = newHash;
  return true;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const passwordSalt = process.env.PASSWORD_SALT || "default-salt";

    if (!adminPasswordHash) {
      return NextResponse.json(
        { error: "Cấu hình server chưa hoàn chỉnh" },
        { status: 500 }
      );
    }

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

    const savedLocally = await persistAdminPasswordHash(newHash);

    return NextResponse.json({
      message: savedLocally
        ? "✅ Mật khẩu đã được cập nhật thành công và hash mới đã được lưu vào máy chủ."
        : "✅ Hash mật khẩu mới đã được tạo. Trên Vercel, không thể ghi trực tiếp vào file .env.local vì hệ thống chỉ đọc được. Vui lòng cập nhật biến ADMIN_PASSWORD_HASH trong Vercel Dashboard → Settings → Environment Variables.",
      newHash,
      updated: savedLocally,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Thao tác thất bại" }, { status: 500 });
  }
}
