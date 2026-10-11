import OpinionForm from "@/components/OpinionForm";
import { Nunito } from "next/font/google";

// Khởi tạo font Nunito chuẩn từ Google Fonts có hỗ trợ tiếng Việt
const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export default function HomePage() {
  return (
    <main
      className={`${nunito.className} flex min-h-screen flex-col text-slate-800 antialiased`}
      style={{
        backgroundColor: "#F8FAFC",
        backgroundImage:
          "radial-gradient(at 15% 15%, rgba(0, 82, 156, 0.05) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(218, 37, 29, 0.03) 0px, transparent 50%)",
      }}
    >
      {/* Thanh điều hướng cố định (Sticky Header) */}
      <nav className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Huy hiệu Đoàn Vector (SVG) nhúng trực tiếp - Không bao giờ bị lỗi vỡ ảnh */}
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white p-0.5 shadow-sm">
              <svg viewBox="0 0 200 200" className="h-full w-full">
                {/* Vòng tròn ngoài */}
                <circle cx="100" cy="100" r="96" fill="#ffffff" stroke="#006837" strokeWidth="4" />
                <circle cx="100" cy="100" r="68" fill="#006837" />
                
                {/* Các đường sọc chéo xanh - trắng bên trong */}
                <g stroke="#ffffff" strokeWidth="4.5" opacity="0.9">
                  <line x1="45" y1="75" x2="125" y2="155" />
                  <line x1="35" y1="95" x2="105" y2="165" />
                  <line x1="60" y1="60" x2="140" y2="140" />
                  <line x1="80" y1="50" x2="155" y2="125" />
                </g>

                {/* Vòng cung che phần sọc thừa */}
                <path
                  d="M100,15 A85,85 0 1,0 185,100 A85,85 0 1,0 100,15 Z M100,32 A68,68 0 1,1 32,100 A68,68 0 1,1 100,32 Z"
                  fill="#ffffff"
                />
                <circle cx="100" cy="100" r="68" fill="none" stroke="#006837" strokeWidth="2.5" />

                {/* Đường định hướng chữ vòng cung */}
                <defs>
                  <path id="textArc" d="M 22,100 A 78,78 0 1,0 178,100" />
                </defs>
                <text fill="#DA251D" fontSize="12.5" fontWeight="900" letterSpacing="0.8">
                  <textPath href="#textArc" startOffset="50%" textAnchor="middle">
                    ĐOÀN THANH NIÊN CỘNG SẢN HỒ CHÍ MINH
                  </textPath>
                </text>

                {/* Cánh tay và bàn tay nắm cán cờ */}
                <path
                  d="M148,118 C135,112 115,112 102,115 C92,108 78,110 76,120 C74,130 85,138 100,136 C118,136 136,138 145,135 Z"
                  fill="#ffffff"
                  stroke="#DA251D"
                  strokeWidth="3"
                />
                <path
                  d="M135,112 L158,115 C164,122 162,132 155,137 L132,135 Z"
                  fill="#006837"
                />

                {/* Cán cờ */}
                <line x1="52" y1="22" x2="112" y2="162" stroke="#DA251D" strokeWidth="7" strokeLinecap="round" />

                {/* Lá cờ đỏ tung bay */}
                <path
                  d="M52,22 C92,10 128,38 175,25 C170,58 182,78 178,102 C132,112 100,85 75,92 Z"
                  fill="#DA251D"
                />

                {/* Ngôi sao vàng 5 cánh */}
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
          </div>

          <a
            href="/admin/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold text-[#00529C] transition-all duration-200 hover:border-[#00529C] hover:bg-[#00529C] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>CÁN BỘ</span>
          </a>
        </div>
      </nav>

      {/* Nội dung chính */}
      <div className="mx-auto w-full max-w-3xl flex-grow px-4 pb-10 pt-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-normal text-[#00529C] drop-shadow-sm sm:text-5xl">
            ĐIỀU EM MUỐN NÓI
          </h1>
          <div className="my-4 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-12 rounded-full bg-[#DA251D]" />
            <span className="h-1.5 w-3 rounded-full bg-[#FFD700]" />
            <span className="h-1.5 w-12 rounded-full bg-[#00529C]" />
          </div>
          <p className="mx-auto max-w-xl px-2 text-base font-bold leading-relaxed text-slate-600 sm:text-lg">
            “Nơi lắng nghe tâm tư, nguyện vọng và ý kiến của trẻ em, thanh thiếu nhi xã Trà Liên”
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
          <div className="h-2 w-full bg-gradient-to-r from-[#00529C] via-[#DA251D] to-[#FFD700]" />
          <div className="p-5 sm:p-8">
            <OpinionForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-[#001f3f] py-6 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide">Đoàn Thanh niên xã Trà Liên</p>
          <p className="text-xs text-slate-400">
            © ĐIỀU EM MUỐN NÓI – Ứng dụng lấy ý kiến trẻ em, thanh thiếu nhi xã Trà Liên
          </p>
        </div>
      </footer>
    </main>
  );
}