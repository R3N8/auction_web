/*AUTH*/
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  apiKey?: string;
  signal?: AbortSignal;
}

export interface ApiErrorRes {
  errors?: Array<{ message: string }>;
  message?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}
/*AUTH - END*/

/* ALERTS */
export type AlertType = "success" | "error" | "warning" | "info";
/* ALERTS - END */

/*LISTING*/
export interface ListingQuery {
  page?: number;
  tag?: string;
  active?: boolean;
  q?: string;
  _seller?: boolean;
  _bids?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  startingPrice?: number;
  tags?: string[];
  media?: Media[];
  createdAt: string;
  endsAt: string;
  _count: ListingCount;
  seller?: Seller;
  bids?: Bid[];
}

export interface Media {
  url: string;
  alt: string;
}

export interface ListingCount {
  bids: number;
}

export interface Seller {
  name: string;
  email: string;
  bio?: string;
  avatar?: Media;
  banner?: Media;
  wins: string[];
}

export interface Bid {
  id: string;
  amount: number;
  created: string;
  bidder: Bidder;
}

export interface Bidder {
  name: string;
  email: string;
  bio?: string;
  avatar?: Media;
  banner?: Media;
}
/*LISTING - END*/

/* PROFILE */
export interface Profile {
  id: string;
  name: string;
  bio?: string;
}
/* PROFILE - END */
