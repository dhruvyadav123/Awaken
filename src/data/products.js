export const products = [
  {
    id: "choices-and-voices-of-children",
    title: "Choices and Voices of Children",
    author: "Meheck Mukherjee",
    description: "A digital book by Meheck Mukherjee, created as a thoughtful reading experience for parents, educators, and readers interested in children's perspectives.",
    format: "eBook",
    price: 200,
    currency: "INR",
    cover: "/images/products/choices-voices-of-children.svg",
  },
];

export function formatPrice(product) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 2,
  }).format(product.price);
}