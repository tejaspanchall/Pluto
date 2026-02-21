// app/token/[mint].tsx
// dynamic route for token details - uses DexScreener API
import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Image,
    ScrollView,
    TouchableOpacity,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface TokenPair {
    chainId: string;
    dexId: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceUsd: string;
    priceChange: {
        h24: number;
    };
    volume: {
        h24: number;
    };
    liquidity: {
        usd: number;
    };
    fdv: number;
    marketCap: number;
    info?: {
        imageUrl?: string;
    };
}

interface DexScreenerResponse {
    pairs: TokenPair[] | null;
}

export default function TokenDetailScreen() {
    const { mint, amount } = useLocalSearchParams<{ mint: string; amount?: string }>();
    const router = useRouter();
    const [tokenData, setTokenData] = useState<TokenPair | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTokenData();
    }, [mint]);

    const fetchTokenData = async () => {
        if (!mint) return;

        setLoading(true);
        setError(null);

        try {
            // dexscreener api - free, no auth required
            const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status}`);
            }

            const data: DexScreenerResponse = await res.json();

            if (!data.pairs || data.pairs.length === 0) {
                throw new Error("Token not found on DexScreener");
            }

            // get the pair with highest liquidity
            const bestPair = data.pairs.reduce((best, current) => {
                const bestLiq = best.liquidity?.usd || 0;
                const currentLiq = current.liquidity?.usd || 0;
                return currentLiq > bestLiq ? current : best;
            }, data.pairs[0]);

            setTokenData(bestPair);
        } catch (e: any) {
            setError(e.message || "Failed to load token");
        } finally {
            setLoading(false);
        }
    };

    const openDexScreener = () => {
        Linking.openURL(`https://dexscreener.com/solana/${mint}`);
    };

    const openSolscan = () => {
        Linking.openURL(`https://solscan.io/token/${mint}`);
    };

    const short = (s: string, n = 6) => `${s.slice(0, n)}...${s.slice(-n)}`;

    const formatPrice = (p: string | number) => {
        const price = typeof p === "string" ? parseFloat(p) : p;
        if (price < 0.0001) return `$${price.toExponential(4)}`;
        if (price < 1) return `$${price.toFixed(6)}`;
        return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatLargeNumber = (n: number) => {
        if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
        if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
        return `$${n.toFixed(2)}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Token Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#14F195" />
                    <Text style={s.loadingText}>Loading from DexScreener...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !tokenData) {
        return (
            <SafeAreaView style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Token Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={s.center}>
                    <Ionicons name="alert-circle" size={48} color="#EF4444" />
                    <Text style={s.errorText}>{error || "Token not found"}</Text>
                    <Text style={s.mintText}>{short(mint || "", 8)}</Text>
                    <TouchableOpacity style={s.solscanBtn} onPress={openSolscan}>
                        <Text style={s.solscanBtnText}>View on Solscan</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const priceChange = tokenData.priceChange?.h24 || 0;
    const isPositive = priceChange >= 0;
    const price = parseFloat(tokenData.priceUsd || "0");
    const usdValue = price && amount ? price * parseFloat(amount) : null;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Token Details</Text>
                <TouchableOpacity onPress={openDexScreener} style={s.backBtn}>
                    <Ionicons name="open-outline" size={22} color="#14F195" />
                </TouchableOpacity>
            </View>

            <ScrollView style={s.scroll}>
                {/* Token Header */}
                <View style={s.tokenHeader}>
                    {tokenData.info?.imageUrl ? (
                        <Image source={{ uri: tokenData.info.imageUrl }} style={s.tokenLogo} />
                    ) : (
                        <View style={[s.tokenLogo, s.placeholderLogo]}>
                            <Text style={s.placeholderText}>
                                {tokenData.baseToken.symbol?.charAt(0).toUpperCase() || "?"}
                            </Text>
                        </View>
                    )}
                    <Text style={s.tokenName}>{tokenData.baseToken.name}</Text>
                    <Text style={s.tokenSymbol}>{tokenData.baseToken.symbol}</Text>
                </View>

                {/* Price Card */}
                <View style={s.card}>
                    <Text style={s.cardLabel}>Current Price</Text>
                    <View style={s.priceRow}>
                        <Text style={s.priceText}>{formatPrice(tokenData.priceUsd)}</Text>
                        <View style={[s.changeTag, isPositive ? s.changePositive : s.changeNegative]}>
                            <Ionicons
                                name={isPositive ? "caret-up" : "caret-down"}
                                size={14}
                                color={isPositive ? "#14F195" : "#EF4444"}
                            />
                            <Text style={[s.changeText, isPositive ? s.changeTextPositive : s.changeTextNegative]}>
                                {Math.abs(priceChange).toFixed(2)}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Holdings Card */}
                {amount && (
                    <View style={s.card}>
                        <Text style={s.cardLabel}>Your Holdings</Text>
                        <Text style={s.holdingsText}>
                            {parseFloat(amount).toLocaleString()} {tokenData.baseToken.symbol}
                        </Text>
                        {usdValue && (
                            <Text style={s.usdValue}>{formatLargeNumber(usdValue)}</Text>
                        )}
                    </View>
                )}

                {/* Market Data Card */}
                <View style={s.card}>
                    <Text style={s.cardLabel}>Market Data</Text>

                    {tokenData.marketCap > 0 && (
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>Market Cap</Text>
                            <Text style={s.infoValue}>
                                {formatLargeNumber(tokenData.marketCap)}
                            </Text>
                        </View>
                    )}

                    {tokenData.fdv > 0 && (
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>FDV</Text>
                            <Text style={s.infoValue}>
                                {formatLargeNumber(tokenData.fdv)}
                            </Text>
                        </View>
                    )}

                    {tokenData.volume?.h24 > 0 && (
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>24h Volume</Text>
                            <Text style={s.infoValue}>
                                {formatLargeNumber(tokenData.volume.h24)}
                            </Text>
                        </View>
                    )}

                    {tokenData.liquidity?.usd > 0 && (
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>Liquidity</Text>
                            <Text style={s.infoValue}>
                                {formatLargeNumber(tokenData.liquidity.usd)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Token Info Card */}
                <View style={s.card}>
                    <Text style={s.cardLabel}>Token Info</Text>

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Contract</Text>
                        <Text style={s.infoValueMono}>{short(mint || "", 6)}</Text>
                    </View>

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Network</Text>
                        <Text style={s.infoValue}>Solana</Text>
                    </View>

                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>DEX</Text>
                        <Text style={s.infoValue}>{tokenData.dexId}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={s.actionsRow}>
                    <TouchableOpacity style={s.actionBtn} onPress={openDexScreener}>
                        <Ionicons name="stats-chart" size={18} color="#000" />
                        <Text style={s.actionBtnText}>DexScreener</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={openSolscan}>
                        <Ionicons name="search" size={18} color="#14F195" />
                        <Text style={s.actionBtnTextSecondary}>Solscan</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0D0D12",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#2A2A35",
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    loadingText: {
        color: "#6B7280",
        fontSize: 14,
        marginTop: 12,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 16,
        marginTop: 12,
    },
    mintText: {
        color: "#6B7280",
        fontSize: 12,
        fontFamily: "monospace",
        marginTop: 8,
    },
    solscanBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#16161D",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#2A2A35",
    },
    solscanBtnText: {
        color: "#14F195",
        fontSize: 14,
        fontWeight: "500",
    },
    scroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    tokenHeader: {
        alignItems: "center",
        paddingVertical: 32,
    },
    tokenLogo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    placeholderLogo: {
        backgroundColor: "#9945FF",
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "700",
    },
    tokenName: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    tokenSymbol: {
        color: "#6B7280",
        fontSize: 16,
        marginTop: 4,
    },
    card: {
        backgroundColor: "#16161D",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#2A2A35",
    },
    cardLabel: {
        color: "#6B7280",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    priceText: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "700",
    },
    changeTag: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 2,
    },
    changePositive: {
        backgroundColor: "rgba(20, 241, 149, 0.15)",
    },
    changeNegative: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
    },
    changeText: {
        fontSize: 14,
        fontWeight: "600",
    },
    changeTextPositive: {
        color: "#14F195",
    },
    changeTextNegative: {
        color: "#EF4444",
    },
    holdingsText: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "600",
    },
    usdValue: {
        color: "#6B7280",
        fontSize: 16,
        marginTop: 4,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#2A2A35",
    },
    infoLabel: {
        color: "#6B7280",
        fontSize: 14,
    },
    infoValue: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
    },
    infoValueMono: {
        color: "#FFFFFF",
        fontSize: 14,
        fontFamily: "monospace",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#14F195",
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
    },
    actionBtnSecondary: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#14F195",
    },
    actionBtnText: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "600",
    },
    actionBtnTextSecondary: {
        color: "#14F195",
        fontSize: 16,
        fontWeight: "600",
    },
});
