import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";
import CartItem from "@/components/CartItem";
import LocationDialog from "@/components/LocationDialog";
import OrderSuccess from "@/components/OrderSuccess";
import { cartItems as initialCart, type MenuItem } from "@/data/menuItems";

type Screen = "checkout" | "success";

const Index = () => {
  const [items, setItems] = useState<MenuItem[]>(initialCart);
  const [screen, setScreen] = useState<Screen>("checkout");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = 3.99;
  const total = subtotal + deliveryFee;

  const handleProceed = () => setLocationOpen(true);

  const handleAllowLocation = () => {
    setLocationLoading(true);
    // Simulate geolocation detection
    setTimeout(() => {
      setLocationLoading(false);
      setLocationOpen(false);
      setScreen("success");
    }, 2000);
  };

  const handleNewOrder = () => {
    setItems(initialCart);
    setScreen("checkout");
  };

  if (screen === "success") {
    return <OrderSuccess onNewOrder={handleNewOrder} />;
  }

  return (
    <div className="min-h-screen pb-36">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Order</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} item{items.length !== 1 && "s"} in cart
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingBag size={20} className="text-primary" />
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-lg mx-auto px-5 mt-4 space-y-3">
        <AnimatePresence>
          {items.map((item, i) => (
            <CartItem
              key={item.id}
              item={item}
              index={i}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <ShoppingBag size={48} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </motion.div>
        )}

        {/* Summary */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl bg-card p-5 border border-border/50 shadow-sm space-y-3"
          >
            <h3 className="font-semibold text-foreground">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium text-foreground">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-primary text-lg">${total.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50 p-5">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleProceed}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 transition-all text-lg"
            >
              Proceed to Checkout
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Location Dialog */}
      <LocationDialog
        open={locationOpen}
        onAllow={handleAllowLocation}
        onDeny={() => setLocationOpen(false)}
        loading={locationLoading}
      />
    </div>
  );
};

export default Index;
