const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

function loadEnvFile(filePath) {
  const env = { ...process.env };

  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function main() {
  const env = loadEnvFile(path.resolve(__dirname, '..', '.env.local'));
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in .env.local');
  }

  const sql = neon(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS opinions (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(200),
      age INTEGER,
      location_type VARCHAR(10) NOT NULL,
      location_name VARCHAR(200) NOT NULL,
      topic_id INTEGER REFERENCES topics(id),
      topic_other VARCHAR(200),
      content TEXT NOT NULL,
      evidence_image TEXT,
      is_anonymous BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  const topicNames = [
    'Học tập và rèn luyện',
    'Vui chơi và giải trí',
    'Môi trường và cuộc sống',
    'An toàn và bảo vệ trẻ em',
    'Sức khỏe và dinh dưỡng',
    'Gia đình và quan hệ xã hội',
    'Khác',
  ];

  for (const name of topicNames) {
    await sql`
      INSERT INTO topics (name)
      VALUES (${name})
      ON CONFLICT (name) DO NOTHING
    `;
  }

  const existingTopics = await sql`SELECT id, name FROM topics`;
  const topicIdByName = Object.fromEntries(existingTopics.map((row) => [row.name, row.id]));

  const samples = [
    { full_name: 'Nguyễn Thị Lan', age: 13, location_type: 'thon', location_name: 'Phương Đông', topic: 'Học tập và rèn luyện', content: 'Em muốn có thêm lớp học kỹ năng tin học ở thôn để em có thể học thêm ngoài giờ', status: 'resolved', created_at: daysAgo(1) },
    { full_name: 'Lê Hoàng Nam', age: 15, location_type: 'thon', location_name: 'Ba Hương', topic: 'Vui chơi và giải trí', content: 'Em mong có sân chơi cho thiếu nhi vào cuối tuần để tránh ngồi ở nhà cả ngày', status: 'pending', created_at: daysAgo(3) },
    { full_name: 'Trần Thị Hòa', age: 12, location_type: 'thon', location_name: 'Tak Nú', topic: 'Sức khỏe và dinh dưỡng', content: 'Em thấy nhiều bạn trong thôn thiếu đồ ăn dinh dưỡng và thuốc sơ cứu cơ bản', status: 'resolved', created_at: daysAgo(5) },
    { full_name: 'Phạm Văn Dũng', age: 16, location_type: 'truong', location_name: 'Tiểu học Và THCS Phương Đông', topic: 'Môi trường và cuộc sống', content: 'Em muốn khuôn viên trường sạch hơn, có thùng rác hợp lý và vệ sinh tốt hơn', status: 'pending', created_at: daysAgo(7) },
    { full_name: 'Mai Thuý', age: 14, location_type: 'thon', location_name: 'Làng Gạch', topic: 'An toàn và bảo vệ trẻ em', content: 'Em lo ngại về an toàn khi đi đường về khuya nên mong có đèn chiếu sáng ở các ngã ba', status: 'resolved', created_at: daysAgo(9) },
    { full_name: 'Bùi Minh Châu', age: 11, location_type: 'truong', location_name: 'PTDTBT TH&THCS Trần Phú', topic: 'Gia đình và quan hệ xã hội', content: 'Em muốn được có nhiều hoạt động giao lưu giữa các bạn để cùng nhau học hỏi và đoàn kết hơn', status: 'pending', created_at: daysAgo(12) },
    { full_name: 'Nguyễn Quốc Anh', age: 17, location_type: 'thon', location_name: 'Tak Kót', topic: 'Khác', content: 'Em muốn có thêm nơi sinh hoạt cộng đồng cho các bạn thiếu nhi trong thôn', status: 'resolved', created_at: daysAgo(14) },
    { full_name: 'Hoàng Thị Kim', age: 10, location_type: 'thon', location_name: 'Tak Ngưi', topic: 'Học tập và rèn luyện', content: 'Em muốn có thêm sách, tài liệu đọc và hỗ trợ học nhóm để nâng cao kết quả học tập', status: 'pending', created_at: daysAgo(18) },
    { full_name: 'Đặng Văn Tài', age: 15, location_type: 'thon', location_name: 'Phương Đông', topic: 'Vui chơi và giải trí', content: 'Em mong có thêm câu lạc bộ âm nhạc và bóng đá cho thiếu nhi tại địa phương', status: 'resolved', created_at: daysAgo(21) },
    { full_name: 'Võ Thị Nhi', age: 13, location_type: 'truong', location_name: 'Tiểu học Và THCS Phương Đông', topic: 'Môi trường và cuộc sống', content: 'Em muốn các bồn rửa tay ở trường được vệ sinh thường xuyên hơn và có thêm nước sạch', status: 'pending', created_at: daysAgo(25) },
    { full_name: 'Lý Văn Khoa', age: 16, location_type: 'thon', location_name: 'Ba Hương', topic: 'Sức khỏe và dinh dưỡng', content: 'Em muốn có thêm kiến thức về dinh dưỡng và khám sức khỏe định kỳ cho học sinh', status: 'resolved', created_at: daysAgo(30) },
    { full_name: 'Huỳnh Thị Yến', age: 12, location_type: 'thon', location_name: 'Tak Nú', topic: 'An toàn và bảo vệ trẻ em', content: 'Em muốn có thêm các buổi tuyên truyền về phòng tránh tai nạn, bạo lực và bảo vệ bản thân', status: 'pending', created_at: daysAgo(35) },
    { full_name: 'Nguyễn Văn Đức', age: 14, location_type: 'thon', location_name: 'Làng Gạch', topic: 'Học tập và rèn luyện', content: 'Em muốn được hỗ trợ kỹ năng mềm như thuyết trình, làm việc nhóm và kỹ năng sống', status: 'resolved', created_at: daysAgo(40) },
    { full_name: 'Đoàn Thanh Trúc', age: 11, location_type: 'truong', location_name: 'PTDTBT TH&THCS Trần Phú', topic: 'Gia đình và quan hệ xã hội', content: 'Em mong các hoạt động cộng đồng sẽ tạo cơ hội cho các bạn giao lưu và hiểu nhau hơn', status: 'pending', created_at: daysAgo(45) },
    { full_name: 'Phan Thị Hạnh', age: 15, location_type: 'thon', location_name: 'Tak Kót', topic: 'Vui chơi và giải trí', content: 'Em kiến nghị mở rộng sân chơi và có thêm hoạt động ngoại khóa bổ ích cho trẻ em', status: 'resolved', created_at: daysAgo(50) },
    { full_name: 'Vũ Hoàng Long', age: 13, location_type: 'thon', location_name: 'Phương Đông', topic: 'Môi trường và cuộc sống', content: 'Em muốn các bờ rào và lối đi trong thôn được giữ vệ sinh, sạch sẽ và an toàn hơn', status: 'pending', created_at: daysAgo(60) },
    { full_name: 'Tạ Ngọc Linh', age: 10, location_type: 'thon', location_name: 'Tak Ngưi', topic: 'Khác', content: 'Em mong được có thêm các buổi chia sẻ của anh chị Đoàn để hiểu rõ hơn về hoạt động xã hội', status: 'resolved', created_at: daysAgo(70) },
    { full_name: 'Hứa Thị Nụ', age: 12, location_type: 'truong', location_name: 'Tiểu học Và THCS Phương Đông', topic: 'Sức khỏe và dinh dưỡng', content: 'Em muốn có thêm kiến thức về vệ sinh cá nhân và dinh dưỡng để khỏe mạnh hơn', status: 'pending', created_at: daysAgo(80) },
    { full_name: 'Ngô Bảo Hân', age: 16, location_type: 'thon', location_name: 'Ba Hương', topic: 'An toàn và bảo vệ trẻ em', content: 'Em rất muốn có thông tin và phòng ngừa an toàn về giao thông và internet trong cuộc sống hàng ngày', status: 'resolved', created_at: daysAgo(90) },
    { full_name: 'Cao Minh Khang', age: 14, location_type: 'thon', location_name: 'Làng Gạch', topic: 'Học tập và rèn luyện', content: 'Em muốn có nhiều hoạt động học tập nhóm, đóng góp ý tưởng và rèn kỹ năng thuyết trình', status: 'pending', created_at: daysAgo(100) },
    { full_name: 'Lưu Thị Thu', age: 11, location_type: 'truong', location_name: 'PTDTBT TH&THCS Trần Phú', topic: 'Vui chơi và giải trí', content: 'Em mong trường có thêm sân chơi, hoạt động ngoài giờ, và những trò chơi gần gũi với thiếu nhi', status: 'resolved', created_at: daysAgo(110) },
    { full_name: 'Nghiêm Trường Giang', age: 17, location_type: 'thon', location_name: 'Tak Kót', topic: 'Môi trường và cuộc sống', content: 'Em muốn xung quanh khu sinh hoạt có nhiều cây xanh hơn và không gian sạch đẹp hơn', status: 'pending', created_at: daysAgo(120) },
    { full_name: 'Phan Gia Huy', age: 15, location_type: 'thon', location_name: 'Phương Đông', topic: 'Khác', content: 'Em muốn có thêm những buổi thông tin, tọa đàm để các bạn có thể chia sẻ điều mình muốn', status: 'resolved', created_at: daysAgo(130) },
    { full_name: 'Quách Thị Sương', age: 9, location_type: 'thon', location_name: 'Tak Ngưi', topic: 'Sức khỏe và dinh dưỡng', content: 'Em cần có thêm kiến thức về ăn uống khoa học và cách giữ gìn sức khỏe cho bản thân', status: 'pending', created_at: daysAgo(140) },
    { full_name: 'Phạm Kiều Anh', age: 13, location_type: 'thon', location_name: 'Ba Hương', topic: 'Gia đình và quan hệ xã hội', content: 'Em mong các buổi sinh hoạt sẽ giúp các bạn gần gũi, biết cách giao tiếp và giúp đỡ nhau hơn', status: 'resolved', created_at: daysAgo(150) }
  ];

  const now = new Date();

  for (const sample of samples) {
    const createdAt = sample.created_at instanceof Date ? sample.created_at.toISOString() : new Date(sample.created_at).toISOString();

    await sql`
      INSERT INTO opinions (
        full_name,
        age,
        location_type,
        location_name,
        topic_id,
        topic_other,
        content,
        evidence_image,
        is_anonymous,
        status,
        created_at
      ) VALUES (
        ${sample.full_name},
        ${sample.age},
        ${sample.location_type},
        ${sample.location_name},
        ${topicIdByName[sample.topic] ?? null},
        ${sample.topic},
        ${sample.content},
        ${Math.random() > 0.7 ? 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80' : null},
        ${false},
        ${sample.status},
        ${createdAt}
      )
    `;
  }

  const count = await sql`SELECT COUNT(*)::int AS total FROM opinions`;
  console.log(`Seeded historical opinions successfully. Total rows: ${count[0].total}`);
}

function daysAgo(days) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

main().catch((error) => {
  console.error('Historical seed failed:', error);
  process.exit(1);
});
