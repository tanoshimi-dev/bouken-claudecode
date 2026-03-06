-- CreateTable
CREATE TABLE "tool_tracking_config" (
    "id" TEXT NOT NULL,
    "tool_slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "current_content_version" TEXT NOT NULL,
    "check_source_type" TEXT NOT NULL,
    "check_source_identifier" TEXT NOT NULL,
    "changelog_url" TEXT NOT NULL,
    "documentation_url" TEXT NOT NULL,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_tracking_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_versions" (
    "id" TEXT NOT NULL,
    "tool_slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "release_date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '[]',
    "changelog_url" TEXT,
    "breaking_changes" BOOLEAN NOT NULL DEFAULT false,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_update_impacts" (
    "id" TEXT NOT NULL,
    "tool_version_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "impact_description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_update_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tool_tracking_config_tool_slug_key" ON "tool_tracking_config"("tool_slug");

-- CreateIndex
CREATE UNIQUE INDEX "tool_versions_tool_slug_version_key" ON "tool_versions"("tool_slug", "version");

-- CreateIndex
CREATE UNIQUE INDEX "content_update_impacts_tool_version_id_module_id_lesson_id_key" ON "content_update_impacts"("tool_version_id", "module_id", "lesson_id");

-- AddForeignKey
ALTER TABLE "tool_versions" ADD CONSTRAINT "tool_versions_tool_slug_fkey" FOREIGN KEY ("tool_slug") REFERENCES "tool_tracking_config"("tool_slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_update_impacts" ADD CONSTRAINT "content_update_impacts_tool_version_id_fkey" FOREIGN KEY ("tool_version_id") REFERENCES "tool_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_update_impacts" ADD CONSTRAINT "content_update_impacts_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_update_impacts" ADD CONSTRAINT "content_update_impacts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_update_impacts" ADD CONSTRAINT "content_update_impacts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
