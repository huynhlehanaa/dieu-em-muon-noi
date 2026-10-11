"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className={`${nunito.className} flex min-h-screen flex-col text-slate-800 antialiased`}
      style={{
        backgroundColor: "#F8FAFC",
        backgroundImage:
          "radial-gradient(at 15% 15%, rgba(0, 82, 156, 0.05) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(218, 37, 29, 0.03) 0px, transparent 50%)",
      }}
    >
      {/* Thanh điều hướng cố định đồng bộ với Trang chủ */}
      <nav className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white p-0.5 shadow-sm">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                <circle cx="100" cy="100" r="96" fill="#ffffff" stroke="#006837" strokeWidth="4" />
                <circle cx="100" cy="100" r="68" fill="#006837" />
                <g stroke="#ffffff" strokeWidth="4.5" opacity="0.9">
                  <line x1="45" y1="75" x2="125" y2="155" />
                  <line x1="35" y1="95" x2="105" y2="165" />
                  <line x1="60" y1="60" x2="140" y2="140" />
                  <line x1="80" y1="50" x2="155" y2="125" />
                </g>
                <path
                  d="M100,15 A85,85 0 1,0 185,100 A85,85 0 1,0 100,15 Z M100,32 A68,68 0 1,1 32,100 A68,68 0 1,1 100,32 Z"
                  fill="#ffffff"
                />
                <circle cx="100" cy="100" r="68" fill="none" stroke="#006837" strokeWidth="2.5" />
                <defs>
                  <path id="textArcLogin" d="M 22,100 A 78,78 0 1,0 178,100" />
                </defs>
                <text fill="#DA251D" fontSize="12.5" fontWeight="900" letterSpacing="0.8">
                  <textPath href="#textArcLogin" startOffset="50%" textAnchor="middle">
                    ĐOÀN THANH NIÊN CỘNG SẢN HỒ CHÍ MINH
                  </textPath>
                </text>
                <path
                  d="M148,118 C135,112 115,112 102,115 C92,108 78,110 76,120 C74,130 85,138 100,136 C118,136 136,138 145,135 Z"
                  fill="#ffffff"
                  stroke="#DA251D"
                  strokeWidth="3"
                />
                <path d="M135,112 L158,115 C164,122 162,132 155,137 L132,135 Z" fill="#006837" />
                <line x1="52" y1="22" x2="112" y2="162" stroke="#DA251D" strokeWidth="7" strokeLinecap="round" />
                <path
                  d="M52,22 C92,10 128,38 175,25 C170,58 182,78 178,102 C132,112 100,85 75,92 Z"
                  fill="#DA251D"
                />
                <polygon
                  points="118,42 124,56 139,56 127,65 131,79 118,70 105,79 109,65 97,56 112,56"
                  fill="#FFD700"
                />
              </svg>
            </div>

            <div className="leading-tight">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#00529C] sm:text-xs">
                Đoàn TNCS Hồ Chí Minh
              </p>
              <p className="mt-0.5 text-xs font-extrabold uppercase tracking-wide text-[#DA251D] sm:text-sm">
                Ban Chấp hành xã Trà Liên
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-[#00529C] transition-all duration-200 hover:border-[#00529C] hover:bg-[#00529C] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>TRANG CHỦ</span>
          </Link>
        </div>
      </nav>

      {/* Khu vực Form Đăng nhập */}
      <div className="mx-auto flex w-full max-w-md flex-grow flex-col justify-center px-4 py-10">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
          {/* Dải màu đặc trưng Đoàn Thanh niên */}
          <div className="h-2 w-full bg-gradient-to-r from-[#00529C] via-[#DA251D] to-[#FFD700]" />

          <div className="p-6 sm:p-8">
            <div className="mb-7 text-center">
              {/* Khung bo tròn trắng chứa ổ khóa 🔒 đồng bộ theo mẫu */}
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-md shadow-blue-900/5">
                <span className="text-3xl">🔒</span>
              </div>

              <h1 className="text-2xl font-black uppercase tracking-normal text-[#00529C] sm:text-3xl">
                Cổng Cán Bộ Đoàn
              </h1>

              <div className="my-3 flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-8 rounded-full bg-[#DA251D]" />
                <span className="h-1.5 w-2 rounded-full bg-[#FFD700]" />
                <span className="h-1.5 w-8 rounded-full bg-[#00529C]" />
              </div>

              <p className="text-sm font-bold text-slate-500">
                Hệ thống quản trị “Điều Em Muốn Nói”
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu..."
                    className="w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 pr-12 font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-lg text-slate-500 transition hover:bg-blue-100/60 hover:text-[#00529C]"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm font-bold text-[#DA251D]"
                  role="alert"
                >
                  ⚠️ {error}
                </div>
              )}

              <div className="mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl border-b-4 border-[#003d75] bg-[#00529C] px-6 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg transition-all hover:brightness-110 active:translate-y-1 active:border-b-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "⏳ ĐANG XỬ LÝ..." : "🔐 ĐĂNG NHẬP HỆ THỐNG"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-xs font-semibold text-slate-400">
              Chỉ dành cho cán bộ Đoàn Thanh niên xã Trà Liên
            </p>
          </div>
        </div>
      </div>

      {/* Footer đồng bộ với Trang chủ */}
      <footer className="mt-auto bg-[#001f3f] py-6 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide">
            Đoàn Thanh niên xã Trà Liên
          </p>
          <p className="text-xs text-slate-400">
            © ĐIỀU EM MUỐN NÓI – Ứng dụng lấy ý kiến trẻ em, thanh thiếu nhi xã Trà Liên
          </p>
        </div>
      </footer>
    </main>
  );
}