-- CreateTable
CREATE TABLE "ResponsibleContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "cpf" TEXT,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibleContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibleContact_phone_key" ON "ResponsibleContact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibleContact_cpf_key" ON "ResponsibleContact"("cpf");
