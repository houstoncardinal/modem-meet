import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Rooms from "./pages/Rooms";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import DirectMessages from "./pages/DirectMessages";
import Explore from "./pages/Explore";
import JoinWithCode from "./pages/JoinWithCode";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import MobileNav from "./components/MobileNav";
import { InstallPrompt } from "./components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/messages" element={<DirectMessages />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/join/:code" element={<JoinWithCode />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
