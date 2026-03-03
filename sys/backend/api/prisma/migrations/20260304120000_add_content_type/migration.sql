-- AlterTable: Add content_type to modules
ALTER TABLE "modules" ADD COLUMN "content_type" TEXT NOT NULL DEFAULT 'claudecode';

-- DropIndex: Remove old unique constraint on number
DROP INDEX "modules_number_key";

-- CreateIndex: Compound unique on (content_type, number)
CREATE UNIQUE INDEX "modules_content_type_number_key" ON "modules"("content_type", "number");

-- CreateIndex: Index on content_type for filtering
CREATE INDEX "modules_content_type_idx" ON "modules"("content_type");

-- AlterTable: Add content_type to playground_snippets
ALTER TABLE "playground_snippets" ADD COLUMN "content_type" TEXT NOT NULL DEFAULT 'claudecode';

-- CreateIndex: Index on (user_id, content_type) for playground_snippets
CREATE INDEX "playground_snippets_user_id_content_type_idx" ON "playground_snippets"("user_id", "content_type");
