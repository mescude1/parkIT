import React, { useCallback, useContext, useEffect, useState } from "react";
import Storage from "@react-native-async-storage/async-storage";

import {
  IArticle,
  ICategory,
  IProduct,
  IUser,
  IUseData,
  ITheme,
  IApiUser,
  IStartServiceResponse,
} from "../constants/types";

import {
  USERS,
  VALET_USER,
  VALET_DRIVER,
  CATEGORIES,
  ARTICLES,
} from "../constants/mocks";
import { light } from "../constants";
import { authService } from "../services/authService";

export const DataContext = React.createContext({});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<ITheme>(light);
  const [user, setUser] = useState<IUser>(USERS[0]);
  const [users, setUsers] = useState<IUser[]>(USERS);
  const [valet_user, setValetUser] = useState<IProduct[]>(VALET_USER);
  const [valet_driver, setValetDriver] = useState<IProduct[]>(VALET_DRIVER);
  const [categories, setCategories] = useState<ICategory[]>(CATEGORIES);
  const [articles, setArticles] = useState<IArticle[]>(ARTICLES);
  const [article, setArticle] = useState<IArticle>({});

  // Auth state
  const [authUser, setAuthUser] = useState<IApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeService, setActiveService] =
    useState<IStartServiceResponse | null>(null);

  // get isDark mode from storage
  const getIsDark = useCallback(async () => {
    const isDarkJSON = await Storage.getItem("isDark");
    if (isDarkJSON !== null) {
      setIsDark(JSON.parse(isDarkJSON));
    }
  }, [setIsDark]);

  // Restore persisted auth session on mount
  const getStoredAuth = useCallback(async () => {
    const storedToken = await Storage.getItem("access_token");
    const storedUser = await Storage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setAuthUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // handle isDark mode
  const handleIsDark = useCallback(
    (payload: boolean) => {
      setIsDark(payload);
      Storage.setItem("isDark", JSON.stringify(payload));
    },
    [setIsDark]
  );

  // handle users / profiles
  const handleUsers = useCallback(
    (payload: IUser[]) => {
      if (JSON.stringify(payload) !== JSON.stringify(users)) {
        setUsers({ ...users, ...payload });
      }
    },
    [users, setUsers]
  );

  // handle user
  const handleUser = useCallback(
    (payload: IUser) => {
      if (JSON.stringify(payload) !== JSON.stringify(user)) {
        setUser(payload);
      }
    },
    [user, setUser]
  );

  // handle Article
  const handleArticle = useCallback(
    (payload: IArticle) => {
      if (JSON.stringify(payload) !== JSON.stringify(article)) {
        setArticle(payload);
      }
    },
    [article, setArticle]
  );

  // Login — calls /autho/login, persists token + user, returns success flag
  const handleLogin = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const response = await authService.login({ username, password });
        const { access_token, user: apiUser } = response.data;
        await Storage.setItem("access_token", access_token);
        await Storage.setItem("auth_user", JSON.stringify(apiUser));
        setToken(access_token);
        setAuthUser(apiUser);
        setIsAuthenticated(true);
        return { success: true };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Login failed";
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout — blacklists token server-side, clears local state
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // token may already be expired — ignore
    }
    await Storage.removeItem("access_token");
    await Storage.removeItem("auth_user");
    setToken(null);
    setAuthUser(null);
    setIsAuthenticated(false);
    setActiveService(null);
  }, []);

  // get initial data for: isDark & stored auth; hide splash after both resolve
  useEffect(() => {
    Promise.all([getIsDark(), getStoredAuth()]).finally(() => {
      setIsInitializing(false);
    });
  }, [getIsDark, getStoredAuth]);

  // change theme based on isDark updates
  useEffect(() => {
    setTheme(isDark ? light : light);
  }, [isDark]);

  const contextValue = {
    isDark,
    handleIsDark,
    theme,
    setTheme,
    user,
    users,
    handleUsers,
    handleUser,
    valet_user,
    setValetUser,
    valet_driver,
    setValetDriver,
    categories,
    setCategories,
    articles,
    setArticles,
    article,
    handleArticle,
    // Auth
    authUser,
    token,
    isAuthenticated,
    isInitializing,
    isLoading,
    handleLogin,
    handleLogout,
    activeService,
    setActiveService,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext) as IUseData;
