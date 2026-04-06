// =============================================================
// FILE: src/components/ui/Spinner.jsx
// PURPOSE: Loading spinner. Use <Spinner /> for inline loading.
//          Use <Spinner full /> for full-page centered loading.
//          Use size="lg" for a bigger spinner.
// =============================================================

import "./Spinner.css";

const Spinner = ({ full = false, size = "md" }) => {
  const cls = `spinner ${size === "lg" ? "spinner-lg" : ""}`;
  if (full) {
    return (
      <div className="spinner-full">
        <div className={cls} />
      </div>
    );
  }
  return <div className={cls} />;
};

export default Spinner;