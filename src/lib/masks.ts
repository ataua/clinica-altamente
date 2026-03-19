export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  
  if (digits.length <= 11) {
    if (digits.length <= 10) {
      if (digits.length <= 6) {
        return digits
      }
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '')
  
  if (digits.length <= 11) {
    if (digits.length <= 9) {
      if (digits.length <= 3) {
        return digits
      }
      if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`
      }
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  
  if (digits.length <= 5) {
    return digits
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  
  if (digits.length <= 14) {
    if (digits.length <= 12) {
      if (digits.length <= 8) {
        return digits
      }
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}`
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}`
  }
  
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

export function getDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidPhone(phone: string): boolean {
  const digits = getDigits(phone)
  return digits.length >= 10 && digits.length <= 11
}

export function isValidCpf(cpf: string): boolean {
  const digits = getDigits(cpf)
  
  if (digits.length !== 11) return false
  
  if (/^(\d)\1{10}$/.test(digits)) return false
  
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits.substring(10, 11))) return false
  
  return true
}

export function isValidCep(cep: string): boolean {
  const digits = getDigits(cep)
  return digits.length === 8
}
