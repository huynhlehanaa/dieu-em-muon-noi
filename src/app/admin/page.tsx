"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nunito } from "next/font/google";


const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

interface Opinion {
  id: number;
  full_name: string | null;
  age: number;
  location_type: string;
  location_name: string;
  topic_name: string | null;
  topic_other: string | null;
  content: string;
  evidence_image: string | null;
  is_anonymous: boolean;
  status: "pending" | "resolved";
  created_at: string;
}

interface Topic {
  id: number;
  name: string;
  is_active: boolean;
}

type Tab = "opinions" | "topics" | "settings";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("opinions");
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);

  // Filters
  const [filterTopic, setFilterTopic] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Topic management
  const [newTopicName, setNewTopicName] = useState("");
  const [topicMsg, setTopicMsg] = useState("");

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  const fetchOpinions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (filterTopic) params.set("topic", filterTopic);
      if (filterLocation) params.set("location", filterLocation);
      if (filterStatus) params.set("status", filterStatus);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      const res = await fetch(`/api/opinions?${params}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setOpinions(data.opinions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching opinions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterTopic, filterLocation, filterStatus, filterDateFrom, filterDateTo, router]);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/topics?all=1", { cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      // Dùng trực tiếp dữ liệu từ DB (đã bao gồm cả chủ đề mới)
      // Không merge với TOPIC_OPTIONS tĩnh để tránh mất chủ đề mới
      const topicMap = new Map<string, Topic>();
      for (const item of data) {
        if (!item?.name || typeof item.name !== "string") continue;
        const cleanedName = item.name.trim();
        if (!cleanedName) continue;
        topicMap.set(cleanedName, {
          id: Number(item.id ?? 0),
          name: cleanedName,
          is_active: item.is_active !== false,
        });
      }

      setTopics(Array.from(topicMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  }, []);

  useEffect(() => {
    fetchOpinions();
  }, [fetchOpinions]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const updateStatus = async (id: number, status: "pending" | "resolved") => {
    const res = await fetch(`/api/opinions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOpinions((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
      if (selectedOpinion?.id === id) {
        setSelectedOpinion((prev) => (prev ? { ...prev, status } : null));
      }
    }
  };

  const handleAddTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTopicMsg("");
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTopicName }),
    });
    const data = await res.json();
    if (res.ok) {
      setTopicMsg("✅ Thêm chủ đề thành công!");
      setNewTopicName("");
      await fetchTopics();
      router.refresh();
    } else {
      setTopicMsg("❌ " + (data.error || "Thêm thất bại"));
    }
  };

  const toggleTopic = async (id: number, is_active: boolean) => {
    await fetch(`/api/topics/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    await fetchTopics();
    router.refresh();
  };

  const deleteTopic = async (id: number, name: string) => {
    if (id === 0) {
      setTopicMsg("❌ Không thể xóa chủ đề mặc định của hệ thống.");
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc muốn XÓA VĨNH VIỄN chủ đề "${name}" không?\n\nHành động này không thể hoàn tác.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/topics/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setTopicMsg(`✅ ${data.message}`);
      await fetchTopics();
      router.refresh();
    } else {
      setTopicMsg("❌ " + (data.error || "Xóa thất bại"));
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwdMsg("");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: currentPwd,
        newPassword: newPwd,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwdMsg(data.message);
      setCurrentPwd("");
      setNewPwd("");
    } else {
      setPwdMsg("❌ " + data.error);
    }
  };

  const handleExport = () => {
    window.open("/api/export?format=csv", "_blank");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const topicFilterOptions = useMemo(() => {
    const values = new Set<string>();

    // Lấy từ danh sách chủ đề DB (bao gồm cả chủ đề mới)
    topics.forEach((topic) => {
      if (topic.name) values.add(topic.name);
    });

    // Bổ sung từ các ý kiến đã gửi (phòng trường hợp chủ đề đã bị xóa khỏi DB)
    opinions.forEach((opinion) => {
      if (opinion.topic_name) values.add(opinion.topic_name);
      if (opinion.topic_other) values.add(opinion.topic_other);
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [topics, opinions]);

  const locationFilterOptions = [
    "Phương Đông",
    "Ba Hương",
    "Tak Nú",
    "Làng Gạch",
    "Tak Kót",
    "Tak Ngưi",
    "Tiểu học Và THCS Phương Đông",
    "PTDTBT TH&THCS Trần Phú",
  ];

  const totalPages = Math.ceil(total / LIMIT);

  const getTopicLabel = (opinion: Opinion) =>
    opinion.topic_name || opinion.topic_other || "Không xác định";

  const getSenderLabel = (opinion: Opinion) =>
    opinion.is_anonymous ? "Ẩn danh" : opinion.full_name || "Không tên";

  const inputStyle =
    "min-h-[44px] w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15";

  return (
    <main
      className={`${nunito.className} flex min-h-screen flex-col text-slate-800 antialiased`}
      style={{
        backgroundColor: "#F8FAFC",
        backgroundImage:
          "radial-gradient(at 15% 15%, rgba(0, 82, 156, 0.05) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(218, 37, 29, 0.03) 0px, transparent 50%)",
      }}
    >
      {/* Thanh điều hướng cố định đồng bộ */}
      <nav className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white p-0.5 shadow-sm"
            >
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
                  <path id="textArcAdmin" d="M 22,100 A 78,78 0 1,0 178,100" />
                </defs>
                <text fill="#DA251D" fontSize="12.5" fontWeight="900" letterSpacing="0.8">
                  <textPath href="#textArcAdmin" startOffset="50%" textAnchor="middle">
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
            </Link>

            <div className="leading-tight">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#00529C] sm:text-xs">
                Quản trị – ĐIỀU EM MUỐN NÓI
              </p>
              <p className="mt-0.5 text-xs font-extrabold uppercase tracking-wide text-[#DA251D] sm:text-sm">
                Đoàn Thanh niên xã Trà Liên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-[#00529C] transition-all hover:bg-[#00529C] hover:text-white sm:inline-flex"
            >
              <span>🏠 TRANG CHỦ</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-extrabold text-[#DA251D] transition-all duration-200 hover:border-[#DA251D] hover:bg-[#DA251D] hover:text-white sm:text-sm"
            >
              <span>🚪 ĐĂNG XUẤT</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Nội dung chính */}
      <div className="mx-auto w-full max-w-7xl flex-grow px-4 py-6 sm:px-6">
        {/* Thanh chuyển đổi Tab kiểu Segmented Control đồng bộ */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div
            className="inline-flex w-full rounded-2xl border border-blue-100 bg-blue-50/80 p-1.5 sm:w-auto"
            role="tablist"
          >
            {(
              [
                { id: "opinions", label: "💬 Ý kiến", count: total },
                { id: "topics", label: "🏷️ Chủ đề", count: null },
                { id: "settings", label: "⚙️ Cài đặt", count: null },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all sm:flex-initial ${
                  activeTab === tab.id
                    ? "bg-[#00529C] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#00529C]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-black ${
                      activeTab === tab.id
                        ? "bg-white text-[#00529C]"
                        : "bg-blue-100 text-[#00529C]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ======= OPINIONS TAB ======= */}
        {activeTab === "opinions" && (
          <div className="space-y-5">
            {/* Bộ lọc */}
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00529C] via-[#DA251D] to-[#FFD700]" />
              <div className="p-5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                  <select
                    value={filterTopic}
                    onChange={(e) => {
                      setFilterTopic(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Lọc theo chủ đề"
                    className={inputStyle}
                  >
                    <option value="">📚 Tất cả chủ đề</option>
                    {topicFilterOptions.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterLocation}
                    onChange={(e) => {
                      setFilterLocation(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Lọc theo thôn hoặc trường"
                    className={inputStyle}
                  >
                    <option value="">📍 Tất cả thôn/trường</option>
                    {locationFilterOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Lọc theo trạng thái"
                    className={inputStyle}
                  >
                    <option value="">⚡ Tất cả trạng thái</option>
                    <option value="pending">⏳ Chờ xử lý</option>
                    <option value="resolved">✅ Đã xử lý</option>
                  </select>

                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Từ ngày"
                    className={inputStyle}
                  />

                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Đến ngày"
                    className={inputStyle}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-blue-50 pt-4">
                  <p className="text-sm font-bold text-slate-600">
                    Tổng số:{" "}
                    <strong className="text-base font-black text-[#00529C]">{total}</strong> ý kiến
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => {
                        setFilterTopic("");
                        setFilterLocation("");
                        setFilterStatus("");
                        setFilterDateFrom("");
                        setFilterDateTo("");
                        setPage(1);
                      }}
                      className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-blue-100/70"
                    >
                      🔄 Xóa bộ lọc
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 rounded-xl border-b-4 border-emerald-800 bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-all hover:brightness-110 active:translate-y-0.5 active:border-b-0"
                    >
                      📥 Xuất CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng danh sách */}
            {isLoading ? (
              <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center shadow-xl shadow-blue-900/5">
                <div className="mb-4 animate-spin text-5xl">⏳</div>
                <p className="font-bold text-slate-500">Đang tải dữ liệu ý kiến...</p>
              </div>
            ) : opinions.length === 0 ? (
              <div className="rounded-3xl border border-blue-100 bg-white py-16 text-center shadow-xl shadow-blue-900/5">
                <div className="mb-4 text-5xl">📭</div>
                <p className="text-lg font-black text-[#00529C]">Chưa có ý kiến nào</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Thử thay đổi bộ lọc hoặc chờ các em gửi ý kiến mới nhé
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-blue-100 bg-blue-50/70">
                        {[
                          "Người gửi",
                          "Tuổi",
                          "Thôn / Trường",
                          "Chủ đề",
                          "Nội dung",
                          "Thời gian",
                          "Trạng thái",
                          "Thao tác",
                        ].map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-black uppercase tracking-wider text-[#00529C]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {opinions.map((opinion) => (
                        <tr
                          key={opinion.id}
                          className="transition-colors hover:bg-blue-50/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-800">
                            {getSenderLabel(opinion)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-600">
                            {opinion.age} tuổi
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-700">
                            <span className="text-xs">
                              {opinion.location_type === "thon" ? "🏡" : "🏫"}{" "}
                              {opinion.location_name}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className=" inline-block whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#00529C]">
                              {getTopicLabel(opinion)}
                            </span>
                          </td>
                          <td className="max-w-[240px] px-4 py-3.5">
                            <div className="space-y-1.5">
                              <button
                                onClick={() => setSelectedOpinion(opinion)}
                                className="line-clamp-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-[#00529C] hover:underline"
                              >
                                {opinion.content}
                              </button>
                              {opinion.evidence_image && (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                                  🖼️ Có ảnh
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-slate-500">
                            {formatDate(opinion.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${
                                opinion.status === "pending"
                                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {opinion.status === "pending" ? "⏳ Chờ xử lý" : "✅ Đã xử lý"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <button
                              onClick={() =>
                                updateStatus(
                                  opinion.id,
                                  opinion.status === "pending" ? "resolved" : "pending"
                                )
                              }
                              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                                opinion.status === "pending"
                                  ? "border border-blue-200 bg-blue-50 text-[#00529C] hover:bg-[#00529C] hover:text-white"
                                  : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {opinion.status === "pending" ? "Đánh dấu xong" : "Chuyển về chờ"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 border-t border-blue-100 bg-blue-50/30 p-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-[#00529C] transition-all hover:bg-blue-50 disabled:opacity-40"
                    >
                      ‹ Trước
                    </button>
                    <span className="px-2 text-sm font-extrabold text-slate-700">
                      Trang {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-[#00529C] transition-all hover:bg-blue-50 disabled:opacity-40"
                    >
                      Sau ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======= TOPICS TAB ======= */}
        {activeTab === "topics" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
              <div className="h-2 w-full bg-gradient-to-r from-[#00529C] via-[#DA251D] to-[#FFD700]" />
              <div className="p-6 sm:p-8">
                <h2 className="mb-4 text-lg font-black uppercase text-[#00529C]">
                  ➕ Thêm chủ đề mới
                </h2>
                <form onSubmit={handleAddTopic} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Nhập tên chủ đề mới..."
                    required
                    maxLength={100}
                    aria-label="Tên chủ đề mới"
                    className={inputStyle}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-2xl border-b-4 border-[#003d75] bg-[#00529C] px-6 py-3 text-sm font-black text-white shadow-md transition-all hover:brightness-110 active:translate-y-0.5 active:border-b-0"
                  >
                    + THÊM CHỦ ĐỀ
                  </button>
                </form>
                {topicMsg && (
                  <p className="mt-3 text-sm font-bold text-slate-700">{topicMsg}</p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
              <div className="p-6 sm:p-8">
                <h2 className="mb-4 text-lg font-black uppercase text-[#00529C]">
                  🏷️ Danh sách chủ đề hiện có
                </h2>
                <ul className="space-y-2.5">
                  {topics.map((topic) => (
                    <li
                      key={topic.id || topic.name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3"
                    >
                      <span
                        className={`flex-1 text-sm font-bold ${
                          !topic.is_active ? "text-slate-400 line-through" : "text-slate-800"
                        }`}
                      >
                        {topic.name}
                        {!topic.is_active && (
                          <span className="ml-2 text-xs font-semibold text-slate-400">
                            (đã ẩn)
                          </span>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => toggleTopic(topic.id, topic.is_active)}
                          className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition-all ${
                            topic.is_active
                              ? "border border-red-200 bg-red-50 text-[#DA251D] hover:bg-[#DA251D] hover:text-white"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          {topic.is_active ? "Ẩn chủ đề" : "Hiện chủ đề"}
                        </button>
                        {topic.id !== 0 && (
                          <button
                            onClick={() => deleteTopic(topic.id, topic.name)}
                            title="Xóa vĩnh viễn chủ đề này"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-500 transition-all hover:border-red-400 hover:bg-red-600 hover:text-white"
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ======= SETTINGS TAB ======= */}
        {activeTab === "settings" && (
          <div className="mx-auto max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
              <div className="h-2 w-full bg-gradient-to-r from-[#00529C] via-[#DA251D] to-[#FFD700]" />
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/70 text-2xl shadow-sm">
                    🔒
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase text-[#00529C]">
                      Đổi mật khẩu quản trị
                    </h2>
                    <p className="text-xs font-bold text-slate-500">
                      Mật khẩu mới có hiệu lực ngay, không cần cập nhật Vercel
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="currentPwd"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="currentPwd"
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu hiện tại..."
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newPwd"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Mật khẩu mới{" "}
                      <span className="font-normal text-slate-400">(ít nhất 8 ký tự)</span>{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="newPwd"
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Nhập mật khẩu mới..."
                      className={inputStyle}
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full rounded-2xl border-b-4 border-[#003d75] bg-[#00529C] py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:brightness-110 active:translate-y-0.5 active:border-b-0"
                    >
                      🔑 Đổi mật khẩu
                    </button>
                  </div>
                </form>

                {pwdMsg && (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                    <p className="text-sm font-bold text-slate-700">{pwdMsg}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Xem chi tiết ý kiến */}
      {selectedOpinion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedOpinion(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết ý kiến"
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 w-full bg-gradient-to-r from-[#00529C] via-[#DA251D] to-[#FFD700]" />
            <div className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <h3 className="text-xl font-black text-[#00529C]">
                  💬 Chi tiết ý kiến #{selectedOpinion.id}
                </h3>
                <button
                  onClick={() => setSelectedOpinion(null)}
                  aria-label="Đóng"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-[#DA251D]"
                >
                  ×
                </button>
              </div>

              <dl className="space-y-3.5 text-sm">
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-bold text-slate-500">Người gửi:</dt>
                  <dd className="font-extrabold text-slate-800">
                    {getSenderLabel(selectedOpinion)}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-bold text-slate-500">Độ tuổi:</dt>
                  <dd className="font-semibold text-slate-700">{selectedOpinion.age} tuổi</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-bold text-slate-500">Thôn/Trường:</dt>
                  <dd className="font-semibold text-slate-700">
                    {selectedOpinion.location_type === "thon" ? "🏡 Thôn " : "🏫 "}
                    {selectedOpinion.location_name}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-bold text-slate-500">Chủ đề:</dt>
                  <dd>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-extrabold text-[#00529C]">
                      {getTopicLabel(selectedOpinion)}
                    </span>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-bold text-slate-500">Thời gian:</dt>
                  <dd className="font-semibold text-slate-600">
                    {formatDate(selectedOpinion.created_at)}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 font-bold text-slate-500">Trạng thái:</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        selectedOpinion.status === "pending"
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {selectedOpinion.status === "pending" ? "⏳ Chờ xử lý" : "✅ Đã xử lý"}
                    </span>
                  </dd>
                </div>
                <div className="pt-1">
                  <dt className="mb-2 font-bold text-slate-600">Nội dung chia sẻ:</dt>
                  <dd className="whitespace-pre-wrap rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm font-semibold leading-relaxed text-slate-800">
                    {selectedOpinion.content}
                  </dd>
                </div>
                {selectedOpinion.evidence_image && (
                  <div className="pt-1">
                    <dt className="mb-2 font-bold text-slate-600">Ảnh minh chứng:</dt>
                    <dd className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/70 p-2">
                      <img
                        src={selectedOpinion.evidence_image}
                        alt="Ảnh minh chứng ý kiến"
                        className="max-h-80 w-full rounded-xl object-contain"
                      />
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() =>
                    updateStatus(
                      selectedOpinion.id,
                      selectedOpinion.status === "pending" ? "resolved" : "pending"
                    )
                  }
                  className={`flex-1 rounded-2xl border-b-4 py-3 text-sm font-black text-white shadow-md transition-all hover:brightness-110 active:translate-y-0.5 active:border-b-0 ${
                    selectedOpinion.status === "pending"
                      ? "border-emerald-800 bg-emerald-600"
                      : "border-amber-700 bg-amber-500"
                  }`}
                >
                  {selectedOpinion.status === "pending"
                    ? "✅ ĐÁNH DẤU ĐÃ XỬ LÝ"
                    : "⏳ CHUYỂN VỀ CHỜ XỬ LÝ"}
                </button>
                <button
                  onClick={() => setSelectedOpinion(null)}
                  className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-extrabold text-slate-600 transition-all hover:bg-slate-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer đồng bộ */}
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