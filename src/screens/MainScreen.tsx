import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WalletScreen } from "./WalletScreen";
import { SwapScreen } from "./SwapScreen";

export function MainScreen() {
    const [activeTab, setActiveTab] = useState<"wallet" | "swap">("wallet");

    return (
        <SafeAreaView style={s.safe}>
            <View style={{ flex: 1 }}>
                {activeTab === "wallet" ? <WalletScreen /> : <SwapScreen />}
            </View>

            <View style={s.tabBar}>
                <TouchableOpacity
                    style={s.tab}
                    onPress={() => setActiveTab("wallet")}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={activeTab === "wallet" ? "wallet" : "wallet-outline"}
                        size={24}
                        color={activeTab === "wallet" ? "#14F195" : "#6B7280"}
                    />
                    <Text style={[s.tabLabel, activeTab === "wallet" && s.tabActive]}>
                        Wallet
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.tab}
                    onPress={() => setActiveTab("swap")}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={activeTab === "swap" ? "swap-horizontal" : "swap-horizontal-outline"}
                        size={24}
                        color={activeTab === "swap" ? "#14F195" : "#6B7280"}
                    />
                    <Text style={[s.tabLabel, activeTab === "swap" && s.tabActive]}>
                        Swap
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#0D0D12",
    },
    tabBar: {
        flexDirection: "row",
        backgroundColor: "#16161D",
        borderTopWidth: 1,
        borderTopColor: "#2A2A35",
        paddingBottom: 24,
        paddingTop: 12,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    tabLabel: {
        color: "#6B7280",
        fontSize: 12,
    },
    tabActive: {
        color: "#14F195",
    },
});
