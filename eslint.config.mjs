// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Importe o plugin do Prisma
import eslintPluginPrisma from 'eslint-plugin-prisma';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // --- CORREÇÃO APLICADA AQUI ---
  // Objeto de configuração explícito para o Prisma
  {
    plugins: {
      prisma: eslintPluginPrisma,
    },
    rules: {
      ...eslintPluginPrisma.configs.recommended.rules,
    },
  },
  // -----------------------------

  // O Prettier deve ser o último na parte de "extends"
  eslintPluginPrettierRecommended,

  // Configurações do seu projeto
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  
  // Suas regras customizadas
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);