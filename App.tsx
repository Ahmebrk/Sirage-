import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./lib/cart";
import { StoreShell } from "./components/store";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <StoreShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/product/:slug" component={ProductPage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/track" component={TrackOrder} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </StoreShell>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.title = "SIRAGE SPORT — متجر المعدات الرياضية";
  }, []);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
