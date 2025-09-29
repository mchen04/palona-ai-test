import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ProductCard } from "@/components/catalog/product-card"
import { getProductById } from "@/lib/products"
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat-messages"

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={isUser ? "bg-secondary" : "bg-primary text-primary-foreground"}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 space-y-2 ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block max-w-[80%] px-4 py-2 rounded-lg text-sm ${
            isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground"
          }`}
        >
          <p className="text-pretty leading-relaxed">{message.content}</p>
          {message.isStreaming && <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1" />}
        </div>

        {/* Product Recommendations */}
        {message.products && message.products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-2xl">
            {message.products.map((productId) => {
              const product = getProductById(productId)
              if (!product) return null
              return (
                <div key={product.id} className="scale-95">
                  <ProductCard product={product} compact />
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
      </div>
    </div>
  )
}
