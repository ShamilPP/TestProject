import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X } from "lucide-react";

interface LocationDialogProps {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
  loading: boolean;
}

const LocationDialog = ({ open, onAllow, onDeny, loading }: LocationDialogProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onDeny}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl border border-border"
          >
            <button onClick={onDeny} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
              >
                <MapPin size={36} className="text-primary" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Enable Location</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                We need your location to verify you're within our delivery area.
                This helps us ensure fresh food reaches you quickly! 🍔
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={onAllow}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Navigation size={18} />
                    </motion.div>
                  ) : (
                    <Navigation size={18} />
                  )}
                  {loading ? "Detecting location..." : "Allow Location Access"}
                </button>
                <button
                  onClick={onDeny}
                  disabled={loading}
                  className="w-full rounded-xl bg-secondary py-3 font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LocationDialog;
