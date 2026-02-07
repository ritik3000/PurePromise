-- AlterTable: make OutputImages.modelId optional for image-based pack generation
ALTER TABLE "OutputImages" ALTER COLUMN "modelId" DROP NOT NULL;
