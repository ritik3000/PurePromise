-- DropForeignKey
ALTER TABLE "OutputImages" DROP CONSTRAINT "OutputImages_modelId_fkey";

-- CreateIndex
CREATE INDEX "OutputImages_modelId_idx" ON "OutputImages"("modelId");

-- AddForeignKey
ALTER TABLE "OutputImages" ADD CONSTRAINT "OutputImages_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;
