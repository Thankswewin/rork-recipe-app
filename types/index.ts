export interface Recipe {
  id: string;
  title: string;
  image: string;
  category: string;
  categoryColor: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  isFavorite: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  backgroundColor: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  notifications: number;
}