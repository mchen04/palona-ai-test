"use client"

import Image from "next/image"
import { ShoppingCart, Heart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/components/cart/cart-context"
import type { Product } from "@/lib/products"
import { useState } from "react"

interface ProductCardProps {
  product: Product
  compact?: boolean
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem } = useCart()
  const [isLiked, setIsLiked] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })

    // Simulate loading state
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsAdding(false)
  }

  const cardSize = compact ? "w-full max-w-sm" : "w-full"
  const imageHeight = compact ? "h-32" : "h-48"

  return (
    <Card className={`${cardSize} group hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <CardContent className="p-0">
        <div className={`relative ${imageHeight} overflow-hidden rounded-t-lg bg-muted`}>
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
              {product.category}
            </Badge>
          </div>
          {compact && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                className="h-8 w-8 p-0 bg-primary/90 backdrop-blur-sm hover:bg-primary"
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-medium text-foreground line-clamp-2 text-pretty leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">{formatPrice(product.price)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} disabled={isAdding} className="w-full" size={compact ? "sm" : "default"}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isAdding ? "Adding..." : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
