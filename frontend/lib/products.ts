export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: "clothing" | "electronics" | "home" | "sports"
  description: string
}

export const products: Product[] = [
  // Clothing
  {
    id: "1",
    name: "Classic White T-Shirt",
    price: 25,
    image: "/white-t-shirt.png",
    category: "clothing",
    description: "Premium cotton classic white t-shirt",
  },
  {
    id: "2",
    name: "Blue Denim Jeans",
    price: 65,
    image: "/blue-denim-jeans.png",
    category: "clothing",
    description: "Comfortable slim-fit blue denim jeans",
  },
  {
    id: "3",
    name: "Running Shoes - Black",
    price: 120,
    image: "/black-running-shoes.jpg",
    category: "clothing",
    description: "High-performance black running shoes",
  },
  {
    id: "4",
    name: "Winter Jacket - Navy",
    price: 180,
    image: "/navy-winter-jacket.jpg",
    category: "clothing",
    description: "Warm and stylish navy winter jacket",
  },
  {
    id: "5",
    name: "Sports Hoodie",
    price: 55,
    image: "/sports-hoodie.png",
    category: "clothing",
    description: "Comfortable sports hoodie for active wear",
  },
  {
    id: "6",
    name: "Leather Sneakers",
    price: 95,
    image: "/leather-sneakers.png",
    category: "clothing",
    description: "Premium leather sneakers for casual wear",
  },
  {
    id: "7",
    name: "Yoga Pants",
    price: 45,
    image: "/yoga-pants.jpg",
    category: "clothing",
    description: "Flexible and comfortable yoga pants",
  },
  {
    id: "8",
    name: "Baseball Cap",
    price: 30,
    image: "/baseball-cap.png",
    category: "clothing",
    description: "Classic baseball cap with adjustable strap",
  },

  // Electronics
  {
    id: "9",
    name: "Wireless Headphones",
    price: 150,
    image: "/wireless-headphones.png",
    category: "electronics",
    description: "Premium wireless headphones with noise cancellation",
  },
  {
    id: "10",
    name: "Smartphone - Latest Model",
    price: 899,
    image: "/modern-smartphone.png",
    category: "electronics",
    description: "Latest flagship smartphone with advanced features",
  },
  {
    id: "11",
    name: 'Laptop - 15" Pro',
    price: 1299,
    image: "/modern-laptop.png",
    category: "electronics",
    description: "High-performance 15-inch professional laptop",
  },
  {
    id: "12",
    name: "Bluetooth Speaker",
    price: 79,
    image: "/bluetooth-speaker.jpg",
    category: "electronics",
    description: "Portable Bluetooth speaker with rich sound",
  },
  {
    id: "13",
    name: "Smartwatch",
    price: 299,
    image: "/modern-smartwatch.png",
    category: "electronics",
    description: "Advanced smartwatch with health tracking",
  },
  {
    id: "14",
    name: 'Tablet - 10"',
    price: 449,
    image: "/modern-tablet.png",
    category: "electronics",
    description: "10-inch tablet perfect for work and entertainment",
  },
  {
    id: "15",
    name: "Gaming Mouse",
    price: 69,
    image: "/gaming-mouse.png",
    category: "electronics",
    description: "High-precision gaming mouse with RGB lighting",
  },
  {
    id: "16",
    name: "USB-C Hub",
    price: 49,
    image: "/usb-hub.png",
    category: "electronics",
    description: "Multi-port USB-C hub for connectivity",
  },

  // Home
  {
    id: "17",
    name: "Coffee Maker",
    price: 129,
    image: "/modern-coffee-maker.png",
    category: "home",
    description: "Programmable coffee maker with thermal carafe",
  },
  {
    id: "18",
    name: "Throw Pillow Set",
    price: 45,
    image: "/decorative-throw-pillows.png",
    category: "home",
    description: "Set of decorative throw pillows for your sofa",
  },
  {
    id: "19",
    name: "Modern Table Lamp",
    price: 75,
    image: "/modern-table-lamp.jpg",
    category: "home",
    description: "Sleek modern table lamp with LED bulb",
  },
  {
    id: "20",
    name: "Kitchen Knife Set",
    price: 89,
    image: "/kitchen-knife-set.jpg",
    category: "home",
    description: "Professional kitchen knife set with wooden block",
  },
  {
    id: "21",
    name: "Plant Pot - Ceramic",
    price: 35,
    image: "/ceramic-plant-pot.png",
    category: "home",
    description: "Beautiful ceramic plant pot for indoor plants",
  },
  {
    id: "22",
    name: "Wall Art Canvas",
    price: 65,
    image: "/wall-art-canvas.jpg",
    category: "home",
    description: "Modern abstract wall art canvas print",
  },
  {
    id: "23",
    name: "Cozy Blanket",
    price: 55,
    image: "/cozy-blanket.png",
    category: "home",
    description: "Soft and cozy blanket for cold nights",
  },
  {
    id: "24",
    name: "Minimalist Clock",
    price: 40,
    image: "/minimalist-wall-clock.png",
    category: "home",
    description: "Clean minimalist wall clock design",
  },

  // Sports
  {
    id: "25",
    name: "Yoga Mat - Premium",
    price: 65,
    image: "/rolled-yoga-mat.png",
    category: "sports",
    description: "Premium non-slip yoga mat for all practices",
  },
  {
    id: "26",
    name: "Dumbbell Set",
    price: 120,
    image: "/dumbbell-set.png",
    category: "sports",
    description: "Adjustable dumbbell set for home workouts",
  },
  {
    id: "27",
    name: "Water Bottle - Insulated",
    price: 35,
    image: "/insulated-water-bottle.jpg",
    category: "sports",
    description: "Insulated water bottle keeps drinks cold for hours",
  },
  {
    id: "28",
    name: "Gym Bag",
    price: 55,
    image: "/gym-bag.jpg",
    category: "sports",
    description: "Spacious gym bag with multiple compartments",
  },
  {
    id: "29",
    name: "Resistance Bands",
    price: 25,
    image: "/resistance-bands-exercise.png",
    category: "sports",
    description: "Set of resistance bands for strength training",
  },
  {
    id: "30",
    name: "Basketball",
    price: 40,
    image: "/basketball-action.png",
    category: "sports",
    description: "Official size basketball for indoor and outdoor play",
  },
  {
    id: "31",
    name: "Tennis Racket",
    price: 150,
    image: "/tennis-racket.png",
    category: "sports",
    description: "Professional tennis racket for competitive play",
  },
  {
    id: "32",
    name: "Cycling Helmet",
    price: 80,
    image: "/cycling-helmet.png",
    category: "sports",
    description: "Lightweight cycling helmet with ventilation",
  },
]

export const categories = [
  { id: "all", name: "All", count: products.length },
  { id: "clothing", name: "Clothing", count: products.filter((p) => p.category === "clothing").length },
  { id: "electronics", name: "Electronics", count: products.filter((p) => p.category === "electronics").length },
  { id: "home", name: "Home", count: products.filter((p) => p.category === "home").length },
  { id: "sports", name: "Sports", count: products.filter((p) => p.category === "sports").length },
]

export function getProductsByCategory(category: string): Product[] {
  if (category === "all") return products
  return products.filter((product) => product.category === category)
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase()
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery),
  )
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}
