import { Product } from '../types';

export interface Rating {
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function addRating(productId: string, userId: string, rating: number, comment: string) {
  const ratings = getRatings();
  const newRating: Rating = {
    productId,
    userId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };
  
  ratings.push(newRating);
  localStorage.setItem('ratings', JSON.stringify(ratings));
  return newRating;
}

export function getProductRatings(productId: string): Rating[] {
  const ratings = getRatings();
  return ratings.filter(r => r.productId === productId);
}

export function getAverageRating(productId: string): number {
  const productRatings = getProductRatings(productId);
  if (productRatings.length === 0) return 0;
  
  const sum = productRatings.reduce((acc, curr) => acc + curr.rating, 0);
  return sum / productRatings.length;
}

function getRatings(): Rating[] {
  if (typeof window === 'undefined') return [];
  const ratings = localStorage.getItem('ratings');
  return ratings ? JSON.parse(ratings) : [];
} 