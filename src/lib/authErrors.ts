// Traducción humana (español de Panamá) de los errores de Firebase Auth.
// Evita mostrar códigos técnicos al productor o comprador.

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'El correo o la contraseña no son correctos. Verifica tus datos e inténtalo de nuevo.',
  'auth/invalid-login-credentials': 'El correo o la contraseña no son correctos. Verifica tus datos e inténtalo de nuevo.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/missing-email': 'Escribe tu correo electrónico para continuar.',
  'auth/missing-password': 'Escribe tu contraseña para continuar.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o recupera tu contraseña.',
  'auth/user-not-found': 'No encontramos una cuenta con este correo electrónico.',
  'auth/wrong-password': 'La contraseña no es correcta. Inténtalo nuevamente.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al equipo de AgroBarú.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
  'auth/network-request-failed': 'No hay conexión con el servidor. Revisa tu internet (o la señal en la finca) e inténtalo de nuevo.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el acceso.',
  'auth/cancelled-popup-request': 'Ya hay una ventana de acceso abierta. Complétala o ciérrala para continuar.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Habilita las ventanas emergentes o usa correo y contraseña.',
  'auth/operation-not-allowed': 'Este método de acceso no está habilitado en el proyecto de Firebase. Un administrador debe activarlo en Authentication → Sign-in method.',
  'auth/configuration-not-found': 'La configuración de autenticación no está disponible. Un administrador debe habilitar los proveedores de acceso en Firebase Console.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión antes de realizar esta acción.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication. Agrégalo en Authentication → Settings → Dominios autorizados.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de acceso. Inicia sesión con correo y contraseña.',
  'auth/internal-error': 'Ocurrió un error inesperado al autenticar. Inténtalo de nuevo en unos segundos.',
  'permission-denied': 'Tu cuenta no tiene permisos para realizar esta acción.',
  'unavailable': 'El servicio no está disponible en este momento. Tus datos se guardarán y se sincronizarán al recuperar la conexión.',
};

function readCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

export function translateAuthError(error: unknown): string {
  const code = readCode(error);
  if (code && MESSAGES[code]) return MESSAGES[code];

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim() && !/^Firebase:/i.test(message)) {
      return message;
    }
  }

  return 'No pudimos completar la operación. Revisa tu conexión e inténtalo de nuevo.';
}

export function isOfflineError(error: unknown): boolean {
  const code = readCode(error);
  return code === 'auth/network-request-failed' || code === 'unavailable';
}
