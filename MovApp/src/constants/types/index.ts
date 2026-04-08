import i18n from "i18n-js";
import { ImageSourcePropType } from "react-native";
import { ITheme } from "./theme";

export * from "./components";
export * from "./theme";
export * from "./api";

import { IApiUser } from "./api";

export interface IUser {
  id: number | string;
  name?: string;
  department?: string;
  avatar?: string;
  stats?: { posts?: number; followers?: number; following?: number };
  social?: { twitter?: string; dribbble?: string };
  about?: string;
}

export interface ICategory {
  id?: number;
  name?: string;
}
export interface IArticleOptions {
  id?: number;
  title?: string;
  description?: string;
  type?: "room" | "apartment" | "house"; // private room | entire apartment | entire house
  sleeping?: { total?: number; type?: "sofa" | "bed" };
  guests?: number;
  price?: number;
  user?: IUser;
  image?: string;
}
export interface IArticle {
  id?: number;
  title?: string;
  description?: string;
  category?: ICategory;
  image?: string;
  location?: ILocation;
  rating?: number;
  user?: IUser;
  offers?: IProduct[];
  options?: IArticleOptions[];
  timestamp?: number;
  onPress?: (event?: any) => void;
}

export interface IProduct {
  id?: number;
  title?: string;
  description?: string;
  image?: string;
  timestamp?: number;
  linkLabel?: string;
  type: "vertical" | "horizontal";
}
export interface ILocation {
  id?: number;
  city?: string;
  country?: string;
}
export interface IUseData {
  isDark: boolean;
  handleIsDark: (isDark?: boolean) => void;
  theme: ITheme;
  setTheme: (theme?: ITheme) => void;
  user: IUser;
  users: IUser[];
  handleUser: (data?: IUser) => void;
  handleUsers: (data?: IUser[]) => void;
  valet_user: IProduct[];
  setValetUser: (data?: IProduct[]) => void;
  valet_driver: IProduct[];
  setValetDriver: (data?: IProduct[]) => void;
  categories: ICategory[];
  setCategories: (data?: ICategory[]) => void;
  articles: IArticle[];
  setArticles: (data?: IArticle[]) => void;
  article: IArticle;
  handleArticle: (data?: IArticle) => void;
  // Auth
  authUser: IApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  handleLogin: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  handleLogout: () => Promise<void>;
  handleUpdateAuthUser: (fields: Partial<IApiUser>) => Promise<void>;
  activeService: null;
  setActiveService: (service: null) => void;
}

export interface ITranslate {
  locale: string;
  setLocale: (locale?: string) => void;
  t: (scope?: i18n.Scope, options?: i18n.TranslateOptions) => string;
  translate: (scope?: i18n.Scope, options?: i18n.TranslateOptions) => string;
}
export interface IExtra {
  id?: number;
  name?: string;
  time?: string;
  image: ImageSourcePropType;
  saved?: boolean;
  booked?: boolean;
  available?: boolean;
  onBook?: () => void;
  onSave?: () => void;
  onTimeSelect?: (id?: number) => void;
}

export interface IBasketItem {
  id?: number;
  image?: string;
  title?: string;
  description?: string;
  stock?: boolean;
  price?: number;
  qty?: number;
  qtys?: number[];
  size?: number | string;
  sizes?: number[] | string[];
}

export interface IBasket {
  subtotal?: number;
  items?: IBasketItem[];
  recommendations?: IBasketItem[];
}

export interface INotification {
  id?: number;
  subject?: string;
  message?: string;
  read?: boolean;
  business?: boolean;
  createdAt?: number | Date;
  type:
    | "document"
    | "documentation"
    | "payment"
    | "notification"
    | "profile"
    | "extras"
    | "office";
}
