-- AlterTable: Refatorar campo address para campos separados
-- Remove o campo address e adiciona os novos campos de endereço

ALTER TABLE "Client" 
  DROP COLUMN IF EXISTS "address",
  ADD COLUMN IF NOT EXISTS "logradouro" TEXT,
  ADD COLUMN IF NOT EXISTS "numero" TEXT,
  ADD COLUMN IF NOT EXISTS "complemento" TEXT,
  ADD COLUMN IF NOT EXISTS "bairro" TEXT,
  ADD COLUMN IF NOT EXISTS "cidadeEstado" TEXT;
