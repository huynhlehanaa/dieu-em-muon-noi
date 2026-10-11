export const TOPIC_OPTIONS = [
  "Học tập và rèn luyện",
  "Vui chơi và giải trí",
  "Môi trường và cuộc sống",
  "An toàn và bảo vệ trẻ em",
  "Sức khỏe và dinh dưỡng",
  "Gia đình và quan hệ xã hội",
  "Khác",
] as const;

export const LEGACY_TOPIC_ALIASES: Record<string, string> = {
  "Học tập": "Học tập và rèn luyện",
  "An toàn": "An toàn và bảo vệ trẻ em",
  "Môi trường": "Môi trường và cuộc sống",
  "Vui chơi - Giải trí": "Vui chơi và giải trí",
  "Gia đình": "Gia đình và quan hệ xã hội",
  "Sức khỏe": "Sức khỏe và dinh dưỡng",
};

export function normalizeTopicName(name: string): string {
  const trimmed = name.trim();
  return LEGACY_TOPIC_ALIASES[trimmed] ?? trimmed;
}

export type TopicOption = (typeof TOPIC_OPTIONS)[number];
