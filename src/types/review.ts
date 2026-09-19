export interface ReviewBreakdown {
  stars: 5 | 4 | 3 | 2 | 1;
  percent: number;
}

export interface Review {
  id: string;
  productSlug: string;
  author: string;
  isVerifiedBuyer: boolean;
  rating: number;
  title: string;
  body: string;
  date: string;
  photos: string[];
  helpfulCount: number;
}
