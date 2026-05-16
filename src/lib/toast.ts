type ToastType = 'error' | 'success' | 'info';

let addToastExternal: ((text: string, type?: ToastType) => void) | null = null;

/** Register the toast callback (called by ToastContainer on mount) */
export function registerToastHandler(fn: typeof addToastExternal) {
  addToastExternal = fn;
}

/** Call from anywhere to show a toast notification */
export function showToast(text: string, type: ToastType = 'info') {
  if (addToastExternal) {
    addToastExternal(text, type);
  }
}
