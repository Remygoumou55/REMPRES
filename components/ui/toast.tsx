import { useToast } from "@/components/providers/ToastProvider";

export function useAppToast() {
  const { showSuccess, showError } = useToast();
  return { showSuccess, showError };
}
