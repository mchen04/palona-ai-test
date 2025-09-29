"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  count: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className="relative"
        >
          {category.name}
          <Badge
            variant="secondary"
            className={`ml-2 text-xs ${
              selectedCategory === category.id
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {category.count}
          </Badge>
        </Button>
      ))}
    </div>
  )
}
