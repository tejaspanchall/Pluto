import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WalletState {
    favorites: string[];
    searchHistory: string[];
    isDevnet: boolean;
    connectedPublicKey: string | null;

    addFavorite: (address: string) => void;
    removeFavorite: (address: string) => void;
    isFavorite: (address: string) => boolean;
    addToHistory: (address: string) => void;
    clearHistory: () => void;
    toggleNetwork: () => void;
    setConnectedPublicKey: (publicKey: string | null) => void;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            favorites: [],
            searchHistory: [],
            isDevnet: false,
            connectedPublicKey: null,
            addFavorite: (address: string) =>
                set((state: WalletState) => ({
                    favorites: state.favorites.includes(address)
                        ? state.favorites
                        : [address, ...state.favorites],
                })),

            removeFavorite: (address: string) =>
                set((state: WalletState) => ({
                    favorites: state.favorites.filter((a: string) => a !== address),
                })),

            isFavorite: (address: string) => get().favorites.includes(address),

            addToHistory: (address: string) =>
                set((state: WalletState) => ({
                    searchHistory: [
                        address,
                        ...state.searchHistory.filter((a: string) => a !== address),
                    ].slice(0, 20),
                })),

            clearHistory: () => set({ searchHistory: [] }),

            toggleNetwork: () => set((state: WalletState) => ({ isDevnet: !state.isDevnet })),

            setConnectedPublicKey: (publicKey) => set({ connectedPublicKey: publicKey }),
        }),
        {
            name: "wallet-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
