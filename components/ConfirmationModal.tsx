import React, { useEffect } from "react";

interface BuyConfirmationModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  handleClose: () => void;
  // name: string;
  // quantity: number;
  // variant: {
  //     id: number;
  //     name: string;
  //     picture_url: string;
  //     original_price: number;
  //     membership_price: number;
  //     sizes: {
  //         id: number;
  //         variant_id: number;
  //         name: string;
  //         original_price: number;
  //         membership_price: number;
  //     }[];
  // };
  // size: number | null;
}

const ConfirmationModal = ({
  children,
  isOpen,
  handleClose,
}: BuyConfirmationModalProps) => {
  useEffect(() => {
    const closeOnEscapeKey = (e: KeyboardEvent) =>
      e.key === "Escape" ? handleClose() : null;
    document.body.addEventListener("keydown", closeOnEscapeKey);
    return () => {
      document.body.removeEventListener("keydown", closeOnEscapeKey);
    };
  }, [handleClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return (): void => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="absolute left-0 top-0 z-40 h-screen w-screen bg-black opacity-50"></div>
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="rounded-lg bg-zinc-200 p-8 shadow-lg">
            <button onClick={handleClose}>Close</button>
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
