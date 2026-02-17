import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { MenuItem } from "@/data/menuItems";

interface CartItemProps {
  item: MenuItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  index: number;
}

const CartItem = ({ item, onUpdateQuantity, onRemove, index }: CartItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex items-center gap-4 rounded-xl bg-card p-3 shadow-sm border border-border/50"
    >
      <img
        src={item.image}
        alt={item.name}
        className="h-20 w-20 rounded-lg object-cover shadow-md"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        <p className="text-primary font-bold mt-1">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-2 bg-secondary rounded-full px-1 py-0.5">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-5 text-center font-semibold text-sm">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
