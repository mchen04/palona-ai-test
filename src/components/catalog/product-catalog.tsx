"use client"

import { Search } from "lucide-react"
import { useState, useMemo } from "react"

import { Input } from "@/components/ui/input"
import { products, categories, getProductsByCategory } from "@/lib/products"

import { CategoryFilter } from "./category-filter"
import { ProductGrid } from "./product-grid"

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => {
    let result = products

    // Apply category filter
    if (selectedCategory !== "all") {
      result = getProductsByCategory(selectedCategory)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter((product) => {
        const query = searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        )
      })
    }

    return result
  }, [selectedCategory, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Shop Catalog</h1>
          <p className="text-muted-foreground">Discover our collection of {products.length} premium products</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Category Filters */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== "all" && ` in ${categories.find((c) => c.id === selectedCategory)?.name}`}
        </p>
      </div>

      {/* Product Grid */}
      <ProductGrid products={filteredProducts} />

      {/* No Results */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your search terms or browse different categories to find what you&apos;re looking for.
          </p>
        </div>
      )}
    </div>
  )
}
