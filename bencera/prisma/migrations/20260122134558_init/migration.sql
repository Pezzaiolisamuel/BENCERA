-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "availableColors" TEXT NOT NULL,
    "matchingPalette" TEXT NOT NULL,
    "imagesAbove" TEXT NOT NULL,
    "imagesDetailed" TEXT NOT NULL,
    "imagesBackground" TEXT NOT NULL,
    "imagesHowToUse" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "collectionName" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "sizes" TEXT NOT NULL,
    "productsInCollection" INTEGER NOT NULL,
    "unique" BOOLEAN NOT NULL,
    "handmade" BOOLEAN NOT NULL,
    "material" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
