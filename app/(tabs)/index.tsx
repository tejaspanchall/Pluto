// app/(tabs)/index.tsx
// wallet screen - home tab at "/" route
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Linking,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "../../src/stores/wallet-store";
import { FavoriteButton } from "../../src/components/FavoriteButton";

const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;

const timeAgo = (ts: number) => {
    const sec = Math.floor(Date.now() / 1000 - ts);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
};

export default function WalletScreen() {
    const router = useRouter();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [txns, setTxns] = useState<any[]>([]);

    // wallet store
    const addToHistory = useWalletStore((s: any) => s.addToHistory);
    const searchHistory = useWalletStore((s: any) => s.searchHistory);
    const isDevnet = useWalletStore((s: any) => s.isDevnet);
    const toggleNetwork = useWalletStore((s: any) => s.toggleNetwork);

    // use correct rpc based on network
    const RPC = isDevnet
        ? "https://api.devnet.solana.com"
        : "https://api.mainnet-beta.solana.com";

    const rpc = async (method: string, params: any[]) => {
        const res = await fetch(RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.result;
    };

    const getBalance = async (addr: string) => {
        const result = await rpc("getBalance", [addr]);
        return result.value / 1_000_000_000;
    };

    const getTokens = async (addr: string) => {
        const result = await rpc("getTokenAccountsByOwner", [
            addr,
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed" },
        ]);
        return (result.value || [])
            .map((a: any) => ({
                mint: a.account.data.parsed.info.mint,
                amount: a.account.data.parsed.info.tokenAmount.uiAmount,
            }))
            .filter((t: any) => t.amount > 0);
    };

    const getTxns = async (addr: string) => {
        const sigs = await rpc("getSignaturesForAddress", [addr, { limit: 10 }]);
        return sigs.map((s: any) => ({
            sig: s.signature,
            time: s.blockTime,
            ok: !s.err,
        }));
    };

    const search = async () => {
        const addr = address.trim();
        if (!addr) return Alert.alert("Enter a wallet address");

        setLoading(true);
        addToHistory(addr);
        try {
            const [bal, tok, tx] = await Promise.all([
                getBalance(addr),
                getTokens(addr),
                getTxns(addr),
            ]);
            setBalance(bal);
            setTokens(tok);
            setTxns(tx);
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
        setLoading(false);
    };

    const searchFromHistory = (addr: string) => {
        setAddress(addr);
        addToHistory(addr);
        setLoading(true);
        Promise.all([getBalance(addr), getTokens(addr), getTxns(addr)])
            .then(([bal, tok, tx]) => {
                setBalance(bal);
                setTokens(tok);
                setTxns(tx);
            })
            .catch((e: any) => {
                Alert.alert("Error", e.message);
            })
            .finally(() => setLoading(false));
    };

    const clearResults = () => {
        setAddress("");
        setBalance(null);
        setTokens([]);
        setTxns([]);
    };

    return (
        <SafeAreaView style={s.safe} edges={["top"]}>
            <ScrollView style={s.scroll}>
                <View style={s.header}>
                    <Image
                        source={require("../../assets/inicon.png")}
                        style={s.logo}
                        resizeMode="contain"
                    />
                    <TouchableOpacity style={s.networkToggle} onPress={toggleNetwork}>
                        <View style={[s.networkDot, isDevnet && s.networkDotDevnet]} />
                        <Text style={s.networkText}>{isDevnet ? "Devnet" : "Mainnet"}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={s.subtitle}>Explore any Solana wallet</Text>

                <View style={s.inputContainer}>
                    <TextInput
                        style={s.input}
                        placeholder="Enter wallet address..."
                        placeholderTextColor="#6B7280"
                        value={address}
                        onChangeText={setAddress}
                        autoCapitalize="none"
                        autoCorrect={false}
                        contextMenuHidden={false}
                        selectTextOnFocus={true}
                        editable={true}
                    />
                </View>

                <View style={s.btnRow}>
                    <TouchableOpacity
                        style={[s.btn, loading && s.btnDisabled]}
                        onPress={search}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={s.btnText}>Search</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={s.btnGhost} onPress={clearResults}>
                        <Text style={s.btnGhostText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                {searchHistory.length > 0 && balance === null && (
                    <View style={s.historySection}>
                        <Text style={s.historyTitle}>Recent Searches</Text>
                        {searchHistory.slice(0, 5).map((addr) => (
                            <TouchableOpacity
                                key={addr}
                                style={s.historyItem}
                                onPress={() => searchFromHistory(addr)}
                            >
                                <Ionicons name="time-outline" size={16} color="#6B7280" />
                                <Text style={s.historyAddress} numberOfLines={1}>
                                    {short(addr, 8)}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {balance !== null && (
                    <View style={s.card}>
                        <View style={s.favoriteWrapper}>
                            <FavoriteButton address={address.trim()} />
                        </View>
                        <Text style={s.label}>SOL Balance</Text>
                        <View style={s.balanceRow}>
                            <Text style={s.balance}>{balance.toFixed(4)}</Text>
                            <Text style={s.sol}>SOL</Text>
                        </View>
                        <Text style={s.addr}>{short(address.trim(), 6)}</Text>
                    </View>
                )}

                {tokens.length > 0 && (
                    <>
                        <Text style={s.section}>Tokens ({tokens.length})</Text>
                        <FlatList
                            data={tokens}
                            keyExtractor={(t) => t.mint}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={s.row}
                                    onPress={() =>
                                        router.push(`/token/${item.mint}?amount=${item.amount}`)
                                    }
                                >
                                    <Text style={s.mint}>{short(item.mint, 6)}</Text>
                                    <View style={s.tokenRight}>
                                        <Text style={s.amount}>{item.amount}</Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color="#6B7280"
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}

                {txns.length > 0 && (
                    <>
                        <Text style={s.section}>Recent Transactions</Text>
                        <FlatList
                            data={txns}
                            keyExtractor={(t) => t.sig}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={s.row}
                                    onPress={() =>
                                        Linking.openURL(`https://solscan.io/tx/${item.sig}`)
                                    }
                                >
                                    <View>
                                        <Text style={s.mint}>{short(item.sig, 8)}</Text>
                                        <Text style={s.time}>
                                            {item.time ? timeAgo(item.time) : "pending"}
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            color: item.ok ? "#14F195" : "#EF4444",
                                            fontSize: 18,
                                        }}
                                    >
                                        {item.ok ? "+" : "-"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#0D0D12",
    },
    scroll: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    header: {
        marginTop: 8,
        marginBottom: 16,
        alignItems: "flex-start",
    },
    logo: {
        width: 140,
        height: 48,
    },
    networkToggle: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#16161D",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#2A2A35",
        gap: 6,
    },
    networkDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#14F195",
    },
    networkDotDevnet: {
        backgroundColor: "#F59E0B",
    },
    networkText: {
        color: "#9CA3AF",
        fontSize: 12,
        fontWeight: "500",
    },
    subtitle: {
        color: "#6B7280",
        fontSize: 15,
        marginBottom: 28,
    },
    historySection: {
        marginTop: 24,
    },
    historyTitle: {
        color: "#6B7280",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#16161D",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#2A2A35",
        gap: 12,
    },
    historyAddress: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 14,
        fontFamily: "monospace",
    },
    inputContainer: {
        backgroundColor: "#16161D",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#2A2A35",
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    input: {
        color: "#FFFFFF",
        fontSize: 15,
        paddingVertical: 14,
    },
    btnRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16,
    },
    btn: {
        flex: 1,
        backgroundColor: "#14F195",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: "#0D0D12",
        fontWeight: "600",
        fontSize: 16,
    },
    btnGhost: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: "#16161D",
        borderWidth: 1,
        borderColor: "#2A2A35",
    },
    btnGhostText: {
        color: "#9CA3AF",
        fontSize: 15,
    },
    card: {
        backgroundColor: "#16161D",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        marginTop: 28,
        borderWidth: 1,
        borderColor: "#2A2A35",
        position: "relative",
    },
    favoriteWrapper: {
        position: "absolute",
        top: 12,
        right: 12,
    },
    label: {
        color: "#6B7280",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    balanceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 8,
    },
    balance: {
        color: "#FFFFFF",
        fontSize: 48,
        fontWeight: "700",
    },
    sol: {
        color: "#14F195",
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 8,
    },
    addr: {
        color: "#9945FF",
        fontSize: 13,
        fontFamily: "monospace",
        marginTop: 16,
        backgroundColor: "#1E1E28",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    section: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "600",
        marginTop: 32,
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#16161D",
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#2A2A35",
    },
    mint: {
        color: "#FFFFFF",
        fontSize: 14,
        fontFamily: "monospace",
    },
    amount: {
        color: "#14F195",
        fontSize: 15,
        fontWeight: "600",
    },
    tokenRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    time: {
        color: "#6B7280",
        fontSize: 12,
        marginTop: 4,
    },
});
