import { DialogHeader as BaseDialogHeader } from "@/components/ui/dialog";

export const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <BaseDialogHeader>
      {children}
    </BaseDialogHeader>
  );
};