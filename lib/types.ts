export type BookFormat = "physical" | "epub";
export type BookStatus = "available" | "lent";
export type ReadingStatus = "owned" | "reading" | "read" | "to-read";
export type RequestStatus = "pending" | "approved" | "declined";

export type Book = {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  synopsis: string | null;
  genre: string;
  format: BookFormat;
  rating: number | null;
  review: string | null;
  isbn: string | null;
  status: BookStatus;
  created_at: string;
  /** Every list this book belongs to; the first is where it stands. Absent on old data. */
  shelves?: string[];
  /** Subgenre words, as the owner (or the classifier) wrote them. */
  subgenres?: string[];
  reading_status?: ReadingStatus;
  started_at?: string | null;
  finished_at?: string | null;
};

export type Room = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  visibility: "private" | "unlisted" | "public";
  claimed: boolean;
};

export type BorrowRequest = {
  id: string;
  owner_id: string;
  book_id: string;
  requester_name: string;
  requester_contact: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
};

export type BorrowRequestView = BorrowRequest & {
  book_title: string;
  book_author: string;
};

export type BookInput = {
  title: string;
  author: string;
  cover_url?: string | null;
  synopsis?: string | null;
  genre: string;
  format: BookFormat;
  rating?: number | null;
  review?: string | null;
  isbn?: string | null;
  status?: BookStatus;
};
