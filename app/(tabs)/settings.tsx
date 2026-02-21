import {
    StyleSheet,
    Text,
    View,
    Switch,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWalletStore } from "../../src/stores/wallet-store";
import { useWallet } from "../../src/hooks/useWallet";
import { ConnectButton } from "../../src/components/ConnectButton";

export default function SettingsScreen() {
    const router = useRouter();
    const isDevnet = useWalletStore((s) => s.isDevnet);
    const toggleNetwork = useWalletStore((s) => s.toggleNetwork);
    const favorites = useWalletStore((s) => s.favorites);
    const searchHistory = useWalletStore((s) => s.searchHistory);
    const clearHistory = useWalletStore((s) => s.clearHistory);

    const { publicKey, connected, connecting, connect, disconnect } = useWallet();

    return (
        <SafeAreaView style={s.safe} edges={["top"]}>
            <ScrollView style={s.scroll}>
                <Text style={s.title}>Settings</Text>
                <Text style={s.subtitle}>Configure your wallet explorer</Text>

                {/* wallet connection section */}
                <Text style={s.sectionTitle}>Wallet</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={s.rowLeft}>
                            <View style={s.iconBox}>
                                <Ionicons
                                    name="wallet"
                                    size={20}
                                    color="#14F195"
                                />
                            </View>
                            <View>
                                <Text style={s.label}>
                                    {connected ? "Wallet Connected" : "Connect Wallet"}
                                </Text>
                                <Text style={s.sublabel}>
                                    {connected
                                        ? `${publicKey?.toBase58().slice(0, 8)}...${publicKey?.toBase58().slice(-8)}`
                                        : "Link your Solana wallet"}
                                </Text>
                            </View>
                        </View>
                        <ConnectButton
                            connected={connected}
                            connecting={connecting}
                            publicKey={publicKey?.toBase58() || null}
                            onConnect={connect}
                            onDisconnect={disconnect}
                        />
                    </View>
                </View>

                {/* network section */}
                <Text style={s.sectionTitle}>Network</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={s.rowLeft}>
                            <View style={[s.iconBox, isDevnet && s.iconBoxDevnet]}>
                                <Ionicons
                                    name={isDevnet ? "flask" : "globe"}
                                    size={20}
                                    color={isDevnet ? "#F59E0B" : "#14F195"}
                                />
                            </View>
                            <View>
                                <Text style={s.label}>{isDevnet ? "Devnet" : "Mainnet"}</Text>
                                <Text style={s.sublabel}>
                                    {isDevnet ? "Testing network (free SOL)" : "Production network"}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDevnet}
                            onValueChange={toggleNetwork}
                            trackColor={{ true: "#14F195", false: "#2A2A35" }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* stats section */}
                <Text style={s.sectionTitle}>Data</Text>
                <View style={s.card}>
                    <TouchableOpacity style={s.row} onPress={() => router.push("/watchlist")}>
                        <View style={s.rowLeft}>
                            <View style={s.iconBox}>
                                <Ionicons name="heart" size={20} color="#14F195" />
                            </View>
                            <Text style={s.label}>Saved Wallets</Text>
                        </View>
                        <View style={s.rowRight}>
                            <View style={s.badge}>
                                <Text style={s.badgeText}>{favorites.length}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </View>
                    </TouchableOpacity>

                    <View style={s.divider} />

                    <View style={s.row}>
                        <View style={s.rowLeft}>
                            <View style={s.iconBox}>
                                <Ionicons name="time" size={20} color="#14F195" />
                            </View>
                            <Text style={s.label}>Search History</Text>
                        </View>
                        <View style={s.badge}>
                            <Text style={s.badgeText}>{searchHistory.length}</Text>
                        </View>
                    </View>
                </View>

                {/* danger zone */}
                <Text style={s.sectionTitle}>Danger Zone</Text>
                <TouchableOpacity
                    style={s.dangerButton}
                    onPress={() => {
                        Alert.alert(
                            "Clear History",
                            "This will remove all your search history. Favorites won't be affected.",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Clear", style: "destructive", onPress: clearHistory },
                            ]
                        );
                    }}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={s.dangerText}>Clear Search History</Text>
                </TouchableOpacity>

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
    title: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 8,
    },
    subtitle: {
        color: "#6B7280",
        fontSize: 15,
        marginBottom: 32,
    },
    sectionTitle: {
        color: "#6B7280",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: "#16161D",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#2A2A35",
        padding: 4,
        marginBottom: 24,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#1E1E28",
        alignItems: "center",
        justifyContent: "center",
    },
    iconBoxDevnet: {
        backgroundColor: "#2D2310",
    },
    label: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "500",
    },
    sublabel: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    badge: {
        backgroundColor: "#1E1E28",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: "#14F195",
        fontSize: 14,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: "#2A2A35",
        marginHorizontal: 14,
    },
    dangerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#1A1215",
        borderWidth: 1,
        borderColor: "#3D2023",
        paddingVertical: 16,
        borderRadius: 14,
    },
    dangerText: {
        color: "#EF4444",
        fontSize: 16,
        fontWeight: "600",
    },
    rowRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
});
