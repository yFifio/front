export const validarCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i += 1) {
    soma += Number(clean.substring(i - 1, i)) * (11 - i);
  }

  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(clean.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i += 1) {
    soma += Number(clean.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(clean.substring(10, 11))) return false;

  return true;
};
