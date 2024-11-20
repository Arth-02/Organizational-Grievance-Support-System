import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./button";
import React from "react";

const Modal = ({
  open = true,
  onOpenChange,
  title,
  description,
  children,
  className,
  onConfirm,
  confirmText,
  confirmVariant,
  shoudlShowCancel = true,
}) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      {open && <div className="bg-black/80 fixed inset-0 z-50 !mt-0" />}
      <DialogContent className={`${className} !px-0`}>
        <DialogHeader className="px-6">
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {React.isValidElement(children) && React.cloneElement(children, {
          className: `${children.props.className || ""} pr-0 pl-6`.trim(),
        })}
        <DialogFooter className="px-6 mt-2">
          {shoudlShowCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
