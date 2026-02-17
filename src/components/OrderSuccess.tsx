import { motion } from "framer-motion";
import { CheckCircle2, Clock, MapPin } from "lucide-react";

interface OrderSuccessProps {
  onNewOrder: () => void;
}

const OrderSuccess = ({ onNewOrder }: OrderSuccessProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
        className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-accent/15"
      >
        <CheckCircle2 size={64} className="text-accent" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold text-foreground mb-2"
      >
        Order Placed! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground max-w-sm mb-8"
      >
        Your delicious food is being prepared. Sit back and relax!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3 mb-8"
      >
        <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border/50 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock size={20} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Estimated Delivery</p>
            <p className="text-xs text-muted-foreground">25 – 35 minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border/50 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <MapPin size={20} className="text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Delivery Address</p>
            <p className="text-xs text-muted-foreground">Detected via GPS — 2.3 km from restaurant</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        <div className="w-full rounded-xl bg-primary/10 py-3 text-center">
          <p className="text-sm font-semibold text-primary">Order #FD-20482</p>
        </div>
        <button
          onClick={onNewOrder}
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
        >
          Order Again
        </button>
      </motion.div>
    </motion.div>
  );
};

export default OrderSuccess;
