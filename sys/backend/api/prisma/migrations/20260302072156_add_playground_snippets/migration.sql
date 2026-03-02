-- CreateTable
CREATE TABLE "playground_snippets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playground_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playground_snippets_user_id_type_idx" ON "playground_snippets"("user_id", "type");

-- AddForeignKey
ALTER TABLE "playground_snippets" ADD CONSTRAINT "playground_snippets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
