import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ModalContext = React.createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalStack, setModalStack] = React.useState([]);

  const value = React.useMemo(
    () => ({
      modalStack,
      setModalStack,
    }),
    [modalStack]
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModal = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const RoutableModal = ({
  children,
  className,
  backTo,
  width = "max-w-3xl",
  shouldRemoveCloseIcon = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setModalStack } = useModal();

  React.useEffect(() => {
    setModalStack((prev) => [...prev, location.pathname]);
    return () => {
      setModalStack((prev) => prev.slice(0, -1));
    };
  }, [location.pathname, setModalStack]);

  const handleClose = React.useCallback(() => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  }, [navigate, backTo]);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50" onClick={handleClose} />
      <Dialog open={true} onOpenChange={handleClose} modal={false}>
        <DialogContent
          shouldRemoveCloseIcon={shouldRemoveCloseIcon}
          className={cn(
            "p-0 overflow-hidden focus:outline-none",
            width,
            className
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
};
