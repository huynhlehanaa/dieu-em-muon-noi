import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

type ExportRow = {
  id: number;
  ho_ten: string;
  tuoi: number;
  loai_noi_o: string;
  noi_o: string;
  chu_de: string;
  noi_dung: string;
  trang_thai: string;
  thoi_gian_gui: string;
};

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const db = getSql();
    const opinions = (await db`
      SELECT
        o.id,
        CASE
          WHEN o.is_anonymous THEN 'Ẩn danh'
          ELSE COALESCE(o.full_name, 'Không cung cấp')
        END as ho_ten,
        o.age as tuoi,
        CASE
          WHEN o.location_type = 'thon' THEN 'Thôn'
          ELSE 'Trường'
        END as loai_noi_o,
        o.location_name as noi_o,
        COALESCE(t.name, o.topic_other, 'Không xác định') as chu_de,
        o.content as noi_dung,
        CASE
          WHEN o.status = 'pending' THEN 'Chờ xử lý'
          ELSE 'Đã xử lý'
        END as trang_thai,
        TO_CHAR(
          o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh',
          'DD/MM/YYYY HH24:MI'
        ) as thoi_gian_gui
      FROM opinions o
      LEFT JOIN topics t ON o.topic_id = t.id
      ORDER BY o.created_at DESC
    `) as ExportRow[];

    if (format === "csv") {
      const headers = [
        "STT",
        "Họ tên",
        "Tuổi",
        "Loại nơi ở",
        "Nơi ở/Trường",
        "Chủ đề",
        "Nội dung",
        "Trạng thái",
        "Thời gian gửi",
      ];

      const rows = opinions.map((o: ExportRow, i: number) => [
        i + 1,
        `"${String(o.ho_ten).replace(/"/g, '""')}"`,
        o.tuoi,
        o.loai_noi_o,
        `"${String(o.noi_o).replace(/"/g, '""')}"`,
        `"${String(o.chu_de).replace(/"/g, '""')}"`,
        `"${String(o.noi_dung).replace(/"/g, '""').replace(/\n/g, " ")}"`,
        o.trang_thai,
        o.thoi_gian_gui,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const bom = "\uFEFF"; // UTF-8 BOM for Excel Vietnamese support
      const today = new Date().toISOString().split("T")[0];

      return new NextResponse(bom + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="y-kien-tra-lien-${today}.csv"`,
        },
      });
    }

    return NextResponse.json(opinions);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Xuất dữ liệu thất bại" },
      { status: 500 }
    );
  }
}
