-- CreateTable
CREATE TABLE "TeamStaff" (
    "staff_id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStaff_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "TeamKit" (
    "kit_id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "kit_type" TEXT NOT NULL,
    "name" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamKit_pkey" PRIMARY KEY ("kit_id")
);

-- CreateTable
CREATE TABLE "TeamDocument" (
    "document_id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamDocument_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE INDEX "TeamStaff_team_id_status_idx"
ON "TeamStaff"("team_id", "status");

-- CreateIndex
CREATE INDEX "TeamStaff_team_id_role_idx"
ON "TeamStaff"("team_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TeamKit_team_id_kit_type_key"
ON "TeamKit"("team_id", "kit_type");

-- CreateIndex
CREATE INDEX "TeamKit_team_id_status_idx"
ON "TeamKit"("team_id", "status");

-- CreateIndex
CREATE INDEX "TeamDocument_team_id_status_created_at_idx"
ON "TeamDocument"("team_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "TeamDocument_uploaded_by_created_at_idx"
ON "TeamDocument"("uploaded_by", "created_at");

-- AddForeignKey
ALTER TABLE "TeamStaff"
ADD CONSTRAINT "TeamStaff_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamKit"
ADD CONSTRAINT "TeamKit_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDocument"
ADD CONSTRAINT "TeamDocument_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDocument"
ADD CONSTRAINT "TeamDocument_uploaded_by_fkey"
FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
