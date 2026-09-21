/** Thai labels for class categories. Unknown categories fall back to the raw code. */
export const CLASS_CATEGORIES: Record<string, string> = {
  YOGA: "โยคะ",
  HIIT: "HIIT",
  STRENGTH: "เวทเทรนนิ่ง",
  PILATES: "พิลาทิส",
  CYCLING: "ปั่นจักรยาน",
  COMBAT: "คอมแบต",
  FUNCTIONAL: "ฟังก์ชันนัล",
  MOBILITY: "โมบิลิตี้",
  HYROX: "HYROX",
};

export const categoryLabel = (code: string) => CLASS_CATEGORIES[code] ?? code;
