# Phase 3: Seed スクリプト更新

## 目的

コンテンツのディレクトリ構造がすでに `doc/contents/<toolSlug>/module-*` に変更済みのため、Seed スクリプトをこの構造に対応させる。

---

## 現状の問題

Seed スクリプト（`sys/scripts/seed-content.ts`）は `doc/contents/module-*` パターンでモジュールを検索するが、実際のコンテンツは `doc/contents/claudecode/module-*` に配置されている。**現在の Seed スクリプトはコンテンツを見つけられない状態。**

---

## 3.1 seed-content.ts 変更

**ファイル:** `sys/scripts/seed-content.ts`

### main() 関数の変更

```typescript
async function main() {
  console.log('Content Seeder starting...');
  console.log(`Reading from: ${CONTENTS_DIR}`);

  // コンテンツタイプディレクトリを走査
  const contentTypeDirs = fs
    .readdirSync(CONTENTS_DIR)
    .filter((d) => {
      const fullPath = path.join(CONTENTS_DIR, d);
      return fs.statSync(fullPath).isDirectory() && !d.startsWith('.');
    });

  for (const contentTypeSlug of contentTypeDirs) {
    const ctDir = path.join(CONTENTS_DIR, contentTypeSlug);
    const moduleDirs = fs
      .readdirSync(ctDir)
      .filter((d) => d.startsWith('module-'))
      .sort()
      .map((d) => path.join(ctDir, d));

    if (moduleDirs.length === 0) {
      console.log(`  [${contentTypeSlug}] No modules found, skipping.`);
      continue;
    }

    console.log(`\n[${contentTypeSlug}] Seeding ${moduleDirs.length} modules...`);
    for (const dir of moduleDirs) {
      await seedModule(dir, contentTypeSlug);
    }
  }

  console.log('\nContent seeding complete!');
}
```

### seedModule() 関数の変更

```typescript
async function seedModule(moduleDir: string, contentType: string) {
  // ... 既存の README パース処理 ...

  // 複合ユニークキーで upsert
  const module = await prisma.module.upsert({
    where: {
      contentType_number: { contentType, number: meta.number },
    },
    update: { ... },
    create: {
      contentType,  // 追加
      number: meta.number,
      ...
    },
  });

  // Quiz ID をコンテンツタイプスコープに変更
  // 旧: quiz-module-${meta.number}
  // 新: quiz-${contentType}-module-${meta.number}
}
```

---

## 3.2 既存データの Quiz ID マイグレーション

既存の Quiz レコードの ID が `quiz-module-1` 形式なので、`quiz-claudecode-module-1` 形式に更新するか、または Seed スクリプトが ID を自動生成するように変更する。

**推奨:** Seed スクリプトで Quiz の ID 付与ルールを `quiz-${contentType}-module-${number}` に変更し、初回実行時に旧レコードが残る場合は手動削除、または Seed スクリプトに旧 ID → 新 ID のマイグレーションロジックを追加。

---

## 検証

```bash
# 1. マイグレーション適用済みの状態で実行
cd sys && npx tsx scripts/seed-content.ts

# 2. 確認事項
# - [claudecode] Seeding 8 modules... と表示されること
# - [gemini], [codex], [githubcopilot] は No modules found とスキップされること
# - DB 上で Module レコードの content_type が 'claudecode' であること

# 3. DB 確認（Prisma Studio）
pnpm db:studio
# modules テーブルで content_type カラムが正しく設定されていることを確認
```
