import burgerImg from "@/assets/burger.jpg";
import pizzaImg from "@/assets/pizza.jpg";
import sushiImg from "@/assets/sushi.jpg";
import dessertImg from "@/assets/dessert.jpg";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
}

export const cartItems: MenuItem[] = [
  {
    id: "1",
    name: "Smoked Wagyu Burger",
    description: "Wagyu beef, aged cheddar, truffle aioli, brioche bun",
    price: 18.99,
    image: burgerImg,
    quantity: 1,
  },
  {
    id: "2",
    name: "Margherita Classica",
    description: "San Marzano tomato, fresh mozzarella, basil, EVOO",
    price: 14.50,
    image: pizzaImg,
    quantity: 2,
  },
  {
    id: "3",
    name: "Salmon Avocado Roll",
    description: "Fresh Atlantic salmon, avocado, cucumber, sesame",
    price: 22.00,
    image: sushiImg,
    quantity: 1,
  },
  {
    id: "4",
    name: "Chocolate Lava Cake",
    description: "Molten dark chocolate, berry compote, vanilla cream",
    price: 12.00,
    image: dessertImg,
    quantity: 1,
  },
];
