import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validarCPF } from '@/lib/validators';

const emailSchema = z.string().email('Formato de e-mail inválido');
const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter ao menos um número');
const cpfSchema = z
  .string()
  .length(11, 'Formato de CPF inválido (11 números)')
  .refine((value) => validarCPF(value), 'CPF inválido');

describe('Validações do Front-end (Regras da Rubrica)', () => {
  it('Deve bloquear um e-mail com formato inválido', () => {
    const result = emailSchema.safeParse('email-sem-arroba.com');
    expect(result.success).toBe(false);
  });

  it('Deve aprovar um e-mail com formato válido', () => {
    const result = emailSchema.safeParse('aluno@tads.com.br');
    expect(result.success).toBe(true);
  });

  it('Deve bloquear uma senha com menos de 8 caracteres', () => {
    const result = passwordSchema.safeParse('12345');
    expect(result.success).toBe(false);
  });

  it('Deve aprovar uma senha forte/válida', () => {
    const result = passwordSchema.safeParse('SenhaSegura123');
    expect(result.success).toBe(true);
  });

  it('Deve bloquear um CPF que não tenha exatamente 11 dígitos', () => {
    const cpfCurto = cpfSchema.safeParse('123456789');
    const cpfLongo = cpfSchema.safeParse('123456789012');
    
    expect(cpfCurto.success).toBe(false);
    expect(cpfLongo.success).toBe(false);
  });

  it('Deve aprovar um CPF válido pelo algoritmo', () => {
    const result = cpfSchema.safeParse('52998224725');
    expect(result.success).toBe(true);
  });
});