type FormDialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function FormDialog({ title, open, onClose, children }: FormDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-darktext">{title}</h4>
          <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

