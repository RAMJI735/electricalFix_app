
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useCart } from '../context/CartContext';
import AuthRequiredModal from '../components/AuthRequiredModal';

import {
    HomeIcon,
    ShopIcon,
    CartIcon,
    ProfileIcon,
} from '../components/Icons';

const Tab = createBottomTabNavigator();

const TABS = [
    { name: 'Home', label: 'Home', Icon: HomeIcon },
    { name: 'Shop', label: 'Shop', Icon: ShopIcon },
    { name: 'Cart', label: 'Cart', Icon: CartIcon },
    { name: 'Profile', label: 'Account', Icon: ProfileIcon },
];

export default function TabsLayout() {
    const navigation = useNavigation();

    const [authModalVisible, setAuthModalVisible] = useState(false);

    const { totalCartCount } = useCart();

    // Custom Tab Bar
    const renderTabBar = ({ state, navigation: tabNav }) => (
        <View style={styles.tabBar}>
            {TABS.map(({ name, label, Icon }) => {
                const focused = state.routes[state.index].name === name;

                return (
                    <TouchableOpacity
                        key={name}
                        style={styles.tabButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            const route = state.routes.find(
                                (item) => item.name === name
                            );

                            const event = tabNav.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!focused && !event.defaultPrevented) {
                                tabNav.navigate(name);
                            }
                        }}
                    >
                        <View style={styles.iconWithBadge}>
                            <Icon size={22} color="#64748b" focused={focused} />

                            {name === 'Cart' && totalCartCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {totalCartCount > 9 ? '9+' : totalCartCount}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={[
                            styles.tabLabel,
                            focused && styles.tabLabelActive,
                        ]}>
                            {label}
                        </Text>

                        {focused && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            <Tab.Navigator
                screenOptions={{ headerShown: false }}
                tabBar={renderTabBar}
                backBehavior="firstRoute"
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Shop" component={ShopScreen} />
                <Tab.Screen name="Cart" component={CartScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>

            {/* Login Required Modal */}
            <AuthRequiredModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
                navigation={navigation}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    tabBar: {
        flexDirection: 'row',
        height: Platform.OS === 'ios' ? 76 : 64,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingTop: 6,
        paddingBottom: Platform.OS === 'ios' ? 18 : 6,
        elevation: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 3,
    },
    tabLabelActive: {
        color: '#2563eb',
        fontWeight: '700',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#2563eb',
        marginTop: 2,
    },
    iconWithBadge: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },
});
