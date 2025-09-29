"use client"

import { useState } from "react"

import { CartProvider } from "@/components/cart/cart-context"
import { ProductCatalog } from "@/components/catalog/product-catalog"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Header } from "@/components/layout/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("assistant")

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="assistant" className="text-sm font-medium">
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="catalog" className="text-sm font-medium">
                Shop Catalog
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="mt-0">
              <ChatInterface />
            </TabsContent>

            <TabsContent value="catalog" className="mt-0">
              <ProductCatalog />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </CartProvider>
  )
}
