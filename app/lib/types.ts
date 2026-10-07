export type Role = "author" | "reader";
export type SignupStatus = "pending" | "approved" | "declined";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  created_at: string;
}

export interface Campaign {
  id: string;
  author_id: string;
  title: string;
  author_name: string;
  description: string;
  genre: string;
  cover_url: string | null;
  book_file_url: string | null;
  start_date: string | null;
  end_date: string | null;
  max_readers: number;
  created_at: string;
}

export interface Signup {
  id: string;
  campaign_id: string;
  reader_id: string | null;
  name: string | null;
  email: string;
  status: SignupStatus;
  downloaded_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  signup_id: string;
  campaign_id: string;
  rating: number | null;
  review_url: string | null;
  review_text: string | null;
  created_at: string;
}

export const GENRES = [
  "Fiction",
  "Romance",
  "Mystery / Thriller",
  "Science Fiction",
  "Fantasy",
  "Horror",
  "Nonfiction",
  "Self-Help",
  "Business",
  "Biography / Memoir",
  "Children's",
  "Poetry",
  "Other",
] as const;
