import { Toaster as Sonner } from "sonner";

const Toaster = (props) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={{
        "--normal-bg": "#fff",
        "--normal-text": "#000",
        "--normal-border": "#e5e7eb",
      }}
      {...props}
    />
  );
};

export { Toaster };