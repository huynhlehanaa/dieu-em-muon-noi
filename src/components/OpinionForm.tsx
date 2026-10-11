"use client";

import React, { useState, useEffect } from "react";
import { TOPIC_OPTIONS } from "@/lib/topicOptions";

const VILLAGES = ["Phương Đông", "Ba Hương", "Tak Nú", "Làng Gạch", "Tak Kót", "Tak Ngưi"];
const SCHOOLS = ["Tiểu học Và THCS Phương Đông", "PTDTBT TH&THCS Trần Phú"];

export default function OpinionForm() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [locType, setLocType] = useState<"thon" | "truong">("thon");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    location: "",
    topic: "",
    content: "",
  });
  const [evidenceImage, setEvidenceImage] = useState("");
  const [evidenceImageName, setEvidenceImageName] = useState("");
  const [evidenceImageUrl, setEvidenceImageUrl] = useState("");
  const [topicOptions, setTopicOptions] = useState<string[]>([...TOPIC_OPTIONS]);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await fetch("/api/topics", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          // Chỉ lấy chủ đề đang active
          const names = data
            .filter((item: { is_active?: boolean }) => item?.is_active !== false)
            .map((item: { name?: string }) => item?.name)
            .filter((name): name is string => Boolean(name && name.trim()));

          if (names.length > 0) {
            // Ưu tiên danh sách từ DB (bao gồm chủ đề mới), bổ sung TOPIC_OPTIONS nếu thiếu
            const merged = [...new Set([...names, ...TOPIC_OPTIONS])];
            setTopicOptions(merged.sort((a, b) => a.localeCompare(b)));
          }
        }
      } catch {
        // Keep the built-in fallback list when the API is unavailable.
      }
    };

    loadTopics();
  }, []);

  const evidenceImageValue = (evidenceImage || evidenceImageUrl.trim()).trim();

  const handleEvidenceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setEvidenceImage("");
      setEvidenceImageName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSubmitError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSubmitError("Ảnh minh chứng tối đa 2MB để đảm bảo tốc độ gửi ý kiến.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEvidenceImage(reader.result);
        setEvidenceImageName(file.name);
        setSubmitError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const payload = {
      full_name: isAnonymous ? "" : formData.fullName.trim(),
      age: formData.age,
      location_type: locType,
      location_name: formData.location,
      topic_id: null,
      topic_other: formData.topic,
      content: formData.content,
      evidence_image: evidenceImageValue || null,
      is_anonymous: isAnonymous,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gửi ý kiến thất bại");
      }

      setIsSubmitted(true);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Gửi ý kiến thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError("");
    setIsAnonymous(false);
    setLocType("thon");
    setFormData({
      fullName: "",
      age: "",
      location: "",
      topic: "",
      content: "",
    });
    setEvidenceImage("");
    setEvidenceImageName("");
    setEvidenceImageUrl("");
  };

  if (isSubmitted) {
    return (
      <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <span className="text-4xl text-blue-500">🌟</span>
        </div>
        <h2 className="mb-2 text-2xl font-black text-[#00529C]">Đã Gửi Thành Công!</h2>
        <p className="mb-8 text-slate-600">
          Cảm ơn em đã chia sẻ. Ý kiến của em rất quan trọng và đã được Đoàn thanh niên ghi nhận.
        </p>
        <button
          onClick={resetForm}
          className="rounded-full bg-blue-50 px-6 py-2.5 font-bold text-[#00529C] transition-colors hover:bg-blue-100"
        >
          Gửi thêm ý kiến khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-slate-700 antialiased">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-extrabold text-slate-700">
            Họ và tên của em {isAnonymous ? "" : "(Không bắt buộc)"}
          </label>
          <input
            type="text"
            disabled={isAnonymous}
            value={formData.fullName}
            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder={isAnonymous ? "Đang ở chế độ ẩn danh..." : "Nhập họ tên của em..."}
            className={`w-full rounded-2xl border px-4 py-3.5 text-base font-semibold outline-none transition-all ${
              isAnonymous
                ? "border-dashed border-red-300 bg-red-50/60 text-red-500 placeholder-red-300"
                : "border-blue-200 bg-blue-50/70 text-slate-800 placeholder-slate-400 hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
            }`}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-extrabold text-slate-700">
            Độ tuổi <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min={5}
            max={25}
            value={formData.age}
            onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
            placeholder="Ví dụ: 12"
            className="w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-base font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-extrabold text-slate-700">
          Thôn hoặc trường học <span className="text-red-500">*</span>
        </label>
        <div className="mb-3 flex rounded-2xl border border-blue-100 bg-blue-50/60 p-1.5">
          <button
            type="button"
            onClick={() => {
              setLocType("thon");
              setFormData((prev) => ({ ...prev, location: "" }));
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-all ${
              locType === "thon"
                ? "bg-[#00529C] text-white shadow-sm"
                : "text-slate-600 hover:text-[#00529C]"
            }`}
          >
            🏡 Thôn
          </button>
          <button
            type="button"
            onClick={() => {
              setLocType("truong");
              setFormData((prev) => ({ ...prev, location: "" }));
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-all ${
              locType === "truong"
                ? "bg-[#00529C] text-white shadow-sm"
                : "text-slate-600 hover:text-[#00529C]"
            }`}
          >
            🏫 Trường học
          </button>
        </div>
        <select
          required
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          className="w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-base font-semibold text-slate-800 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
        >
          <option value="">-- Chọn {locType === "thon" ? "thôn của em" : "trường của em"} --</option>
          {(locType === "thon" ? VILLAGES : SCHOOLS).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-extrabold text-slate-700">
          Chủ đề em muốn nói là gì ? <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.topic}
          onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
          className="w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-base font-semibold text-slate-800 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
        >
          <option value="">-- 💡 Chọn chủ đề --</option>
          {topicOptions.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-extrabold text-slate-700">
          Nội dung điều em muốn nói <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={6}
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="✍️ Em hãy mạnh dạn viết ra suy nghĩ, mong muốn hoặc những điều làm em lo lắng nhé. Các anh chị Đoàn Thanh niên luôn lắng nghe em..."
          className="w-full rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-base font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
        />
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <label className="text-sm font-extrabold text-slate-700">
            Ảnh minh chứng <span className="font-normal text-slate-500">(tùy chọn)</span>
          </label>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Không bắt buộc
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-blue-300 bg-white px-4 py-2.5 text-sm font-extrabold text-[#00529C] transition-colors hover:bg-blue-50">
            <input type="file" accept="image/*" className="hidden" onChange={handleEvidenceImageChange} />
            📷 Chọn ảnh
          </label>
          {evidenceImageName && (
            <span className="truncate text-sm font-semibold text-slate-600">{evidenceImageName}</span>
          )}
        </div>

        <input
          type="url"
          value={evidenceImageUrl}
          onChange={(e) => {
            setEvidenceImageUrl(e.target.value);
            if (e.target.value.trim()) {
              setEvidenceImage("");
              setEvidenceImageName("");
            }
          }}
          placeholder="Hoặc dán đường dẫn ảnh minh chứng (nếu có)"
          className="mt-3 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all hover:bg-blue-50 focus:border-[#00529C] focus:bg-white focus:ring-2 focus:ring-[#00529C]/15"
        />

        {evidenceImageValue && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-blue-200 bg-white p-2">
            <img
              src={evidenceImageValue}
              alt="Ảnh minh chứng gửi kèm"
              className="max-h-60 w-full rounded-xl object-contain"
            />
          </div>
        )}
      </div>

      <div
        className={`mt-1 rounded-2xl border p-4 transition-all ${
          isAnonymous ? "border-red-200 bg-red-50/60" : "border-blue-200 bg-blue-50/70"
        }`}
      >
        <label className="flex cursor-pointer items-center gap-3">
          <div
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              isAnonymous ? "bg-[#DA251D]" : "bg-slate-300"
            }`}
          >
            <div
              className={`absolute left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                isAnonymous ? "translate-x-5" : "translate-x-0"
              }`}
            />
            <input
              type="checkbox"
              className="sr-only"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
          </div>
          <span className="text-sm font-bold text-slate-700">
            🔒 Gửi ẩn danh <span className="font-normal text-slate-500">– Bật nút này nếu em muốn giấu tên khi gửi ý kiến nhé!</span>
          </span>
        </label>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {submitError}
        </div>
      )}

      <div className="mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl border-b-4 border-[#003d75] bg-[#00529C] px-6 py-4 text-lg font-black text-white shadow-lg transition-all hover:brightness-110 active:translate-y-1 active:border-b-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "ĐANG GỬI..." : "GỬI Ý KIẾN CỦA EM"}
        </button>
      </div>
    </form>
  );
}