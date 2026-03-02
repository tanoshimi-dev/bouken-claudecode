export interface ValidationSection {
  name: string;
  found: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sections: ValidationSection[];
  warnings: string[];
}

const RECOMMENDED_SECTIONS = [
  { name: 'Memory', pattern: /^##\s+Memory/m },
  { name: 'Preferences', pattern: /^##\s+Preferences/m },
  { name: 'Project Rules', pattern: /^##\s+Project Rules/m },
];

export function validateClaudeMd(content: string): ValidationResult {
  const warnings: string[] = [];

  // Check for title heading
  const hasTitle = /^#\s+.+/m.test(content);
  if (!hasTitle) {
    warnings.push('タイトル見出し（# ）がありません');
  }

  // Check recommended sections
  const sections = RECOMMENDED_SECTIONS.map((section) => ({
    name: section.name,
    found: section.pattern.test(content),
  }));

  // Add warnings for missing sections
  for (const section of sections) {
    if (!section.found) {
      warnings.push(`「${section.name}」セクションの追加を推奨します`);
    }
  }

  // Check if content is too short
  if (content.trim().length < 20) {
    warnings.push('内容が短すぎます。プロジェクトの情報を追加しましょう');
  }

  const isValid = hasTitle && sections.every((s) => s.found);

  return { isValid, sections, warnings };
}
