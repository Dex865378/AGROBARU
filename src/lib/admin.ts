/**
 * Cuenta con privilegios de administración de AgroBarú.
 * El acceso se valida contra el correo autenticado de Firebase, no contra
 * un rol editable por el usuario.
 */
export const ADMIN_EMAIL = 'e.milsa.c.cruba18@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === ADMIN_EMAIL;
}
