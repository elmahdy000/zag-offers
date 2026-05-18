export type ErrorPayload = {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
};

type ErrorListener = (payload: ErrorPayload) => void;

let listener: ErrorListener | null = null;

export const onGlobalError = (fn: ErrorListener) => {
  listener = fn;
  return () => { listener = null; };
};

export const emitGlobalError = (payload: ErrorPayload) => {
  listener?.(payload);
};
