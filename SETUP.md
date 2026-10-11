# Hướng dẫn cài đặt – ĐIỀU EM MUỐN NÓI

## Bước 1: Tạo database trên Neon (miễn phí)

1. Truy cập [neon.tech](https://neon.tech) → Đăng ký tài khoản (miễn phí)
2. Tạo project mới → chọn region **Singapore** (gần VN nhất)
3. Copy **Connection String** (bắt đầu bằng `postgresql://...`)

## Bước 2: Cài đặt và chạy local

```bash
# 1. Sao chép file cấu hình
copy .env.example .env.local

# 2. Tạo mật khẩu admin
# Thay "MatKhau123" và "salt-ngau-nhien" bằng giá trị của bạn
node scripts/generate-hash.js MatKhau123 salt-ngau-nhien-cua-ban
```

**Điền vào `.env.local`:**
```
DATABASE_URL=<connection string từ Neon>
JWT_SECRET=<chuỗi random ≥32 ký tự>
ADMIN_USERNAME=admin_doan_tralien
PASSWORD_SALT=<salt đã nhập lúc tạo hash>
ADMIN_PASSWORD_HASH=<hash từ lệnh trên>
```

```bash
# 3. Cài dependencies (nếu chưa)
npm install

# 4. Chạy development server
npm run dev

# 5. Khởi tạo database (chạy 1 lần, mở trình duyệt)
# http://localhost:3000/api/init
```

## Bước 3: Deploy lên Vercel

1. Push code lên GitHub (đảm bảo `.env.local` không được commit)
2. Vào [vercel.com](https://vercel.com) → **New Project** → Import từ GitHub
3. Trong phần **Environment Variables**, thêm:

| Tên biến | Giá trị |
|---|---|
| `DATABASE_URL` | Connection string từ Neon |
| `JWT_SECRET` | Chuỗi random ≥32 ký tự |
| `ADMIN_USERNAME` | `admin_doan_tralien` |
| `PASSWORD_SALT` | Salt đã dùng khi tạo hash |
| `ADMIN_PASSWORD_HASH` | Hash từ bước 2 |

4. Nhấn **Deploy** ✅
5. Sau deploy, mở `https://ten-website.vercel.app/api/init` để khởi tạo DB

## Đăng nhập trang quản trị

URL: `https://ten-website.vercel.app/admin/login`

## Tính năng

| Tính năng | Mô tả |
|---|---|
| ✅ Form gửi ý kiến | Có thể ẩn danh, dropdown thôn/trường |
| ✅ Chủ đề linh hoạt | Dropdown + tự nhập nếu chọn "Khác" |
| ✅ Thông báo xác nhận | Toast notification sau khi gửi |
| ✅ Trang admin bảo mật | JWT cookie HttpOnly |
| ✅ Lọc ý kiến | Theo chủ đề, nơi ở, trạng thái, ngày |
| ✅ Đánh dấu trạng thái | Chờ xử lý / Đã xử lý |
| ✅ Xuất CSV | Tương thích Excel, UTF-8 với BOM |
| ✅ Quản lý chủ đề | Thêm / ẩn / hiện chủ đề |
| ✅ Đổi mật khẩu | Tạo hash mới, copy 1 click |
| ✅ Responsive | Hiển thị tốt trên điện thoại |

## Đổi mật khẩu

1. Đăng nhập admin → tab **Cài đặt**
2. Nhập mật khẩu hiện tại và mật khẩu mới
3. Copy hash mới được tạo
4. Vào Vercel Dashboard → Settings → Environment Variables
5. Cập nhật `ADMIN_PASSWORD_HASH` với hash mới → **Save**
6. Redeploy (tự động)

## Cấu trúc thư mục

```
src/
├── app/
│   ├── page.tsx              # Trang chủ (form gửi ý kiến)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # CSS toàn cục
│   ├── admin/
│   │   ├── login/page.tsx    # Đăng nhập admin
│   │   └── page.tsx          # Dashboard admin
│   └── api/
│       ├── init/route.ts     # Khởi tạo DB
│       ├── submit/route.ts   # Gửi ý kiến (public)
│       ├── opinions/route.ts # Danh sách ý kiến (admin)
│       ├── opinions/[id]/    # Cập nhật/xóa ý kiến
│       ├── topics/route.ts   # Danh sách chủ đề
│       ├── topics/[id]/      # Cập nhật chủ đề
│       ├── export/route.ts   # Xuất CSV
│       └── auth/
│           ├── login/        # Đăng nhập
│           ├── logout/       # Đăng xuất
│           └── change-password/ # Đổi mật khẩu
├── lib/
│   ├── db.ts                 # Kết nối Neon DB
│   └── auth.ts               # JWT utilities
├── components/
│   ├── OpinionForm.tsx       # Form gửi ý kiến
│   └── Toast.tsx             # Thông báo popup
└── middleware.ts             # Bảo vệ route /admin
```
