// =============================================================
// FILE: src/components/ui/Modal.jsx
// PURPOSE: Accessible modal dialog with overlay. Closes on
//          overlay click and Escape key press. Sizes: sm, md, lg.
//          Props: open, onClose, title, children, footer, size.
// =============================================================

import { useEffect } from "react";
import "./Modal.css";

const Modal = ({ open, onClose, title, children, footer, size = "md" }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === "lg" ? "700px" : size === "sm" ? "380px" : "520px";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;