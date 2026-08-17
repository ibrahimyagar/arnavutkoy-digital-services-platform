/** Demo ortamında e-posta doğrulama kapalıdır; SMTP bağlanınca `enabled` true yapılır. */
export const EMAIL_VERIFICATION = {
  enabled: false,
  tooltip: 'Demo ortamında doğrulama e-postası gönderilmez. Giriş bu adresle yapılır.',
} as const
