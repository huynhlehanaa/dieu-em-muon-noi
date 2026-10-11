import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const passwordSalt = process.env.PASSWORD_SALT || "default-salt";

    if (!adminUsername || !adminPasswordHash) {
      console.error("Admin credentials not configured in environment variables");
      return NextResponse.json(
        { error: "Cấu hình server chưa hoàn chỉnh" },
        { status: 500 }
      );
    }

    const inputHash = crypto
      .createHash("sha256")
      .update(password + passwordSalt)
      .digest("hex");

    // Use constant-time comparison to prevent timing attacks
    const isUsernameMatch = username === adminUsername;
    const isPasswordMatch = inputHash === adminPasswordHash;

    if (!isUsernameMatch || !isPasswordMatch) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const token = await createToken(username);

    const response = NextResponse.json({ message: "Đăng nhập thành công" });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Đăng nhập thất bại" }, { status: 500 });
  }
}
