import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./button";

const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  onConfirm,
  confirmText,
  confirmVariant,
}) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      {open && <div className="bg-black/80 fixed inset-0 z-50 !mt-0" />}
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
