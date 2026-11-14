
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Platform,
    Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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

    const { totalCartCount, addToCart } = useCart();
    const { isAuthenticated } = useAuth();

    // Add to Cart
    const handleAddToCart = async (product) => {
        if (!isAuthenticated) {
            setAuthModalVisible(true);
            return false;
        }

        try {
            return await addToCart(product, 1);
        } catch (error) {
            if (
                error?.code === 'AUTH_REQUIRED' ||
                error?.message?.toLowerCase().includes('log in')
            ) {
                setAuthModalVisible(true);
                return false;
            }

            throw error;
        }
    };

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
                {/* Home */}
                <Tab.Screen name="Home">
                    {({ navigation: tabNav }) => (
                        <HomeScreen
                            onSelectCategory={(id) =>
                                tabNav.navigate('Shop', { categoryId: id })
                            }
                            onNavigateToShop={(id = 'all') =>
                                tabNav.navigate('Shop', { categoryId: id })
                            }
                            onSelectService={(service) =>
                                navigation.navigate('ServiceDetail', {
                                    serviceId: service.id || service._id,
                                })
                            }
                            onNavigateToCart={() => tabNav.navigate('Cart')}
                            onAddToCart={handleAddToCart}
                        />
                    )}
                </Tab.Screen>

                {/* Shop */}
                <Tab.Screen name="Shop">
                    {({ route, navigation: tabNav }) => (
                        <ShopScreen
                            navigation={tabNav}
                            route={route}
                            initialCategory={route.params?.categoryId || 'all'}
                            onBack={() => {
                                if (tabNav?.jumpTo) {
                                    tabNav.jumpTo('Home');
                                } else if (tabNav?.navigate) {
                                    tabNav.navigate('Home');
                                } else {
                                    navigation.navigate('Home');
                                }
                            }}
                            onSelectService={(service) =>
                                navigation.navigate('ServiceDetail', {
                                    serviceId: service.id || service._id,
                                })
                            }
                            onNavigateToCart={() => tabNav.navigate('Cart')}
                            onAddToCart={handleAddToCart}
                        />
                    )}
                </Tab.Screen>

                {/* Cart */}
                <Tab.Screen name="Cart">
                    {({ route, navigation: tabNav }) => (
                        <CartScreen
                            navigation={tabNav}
                            route={route}
                            onBack={() => {
                                if (tabNav?.jumpTo) {
                                    tabNav.jumpTo('Home');
                                } else if (tabNav?.navigate) {
                                    tabNav.navigate('Home');
                                } else {
                                    navigation.navigate('Home');
                                }
                            }}
                            onExploreShop={() =>
                                tabNav.navigate('Shop', { categoryId: 'all' })
                            }
                            onNavigateToOrders={(order) =>
                                navigation.navigate(
                                    order ? 'OrderDetail' : 'Orders',
                                    order
                                        ? { orderId: order._id || order.orderNumber }
                                        : undefined
                                )
                            }
                            onNavigateToAuth={(screen) =>
                                navigation.navigate(
                                    screen === 'signup' ? 'SignUp' : 'Login'
                                )
                            }
                        />
                    )}
                </Tab.Screen>

                {/* Profile */}
                <Tab.Screen name="Profile">
                    {({ route, navigation: tabNav }) => (
                        <ProfileScreen
                            navigation={tabNav}
                            route={route}
                            onBack={() => {
                                if (tabNav?.jumpTo) {
                                    tabNav.jumpTo('Home');
                                } else if (tabNav?.navigate) {
                                    tabNav.navigate('Home');
                                } else {
                                    navigation.navigate('Home');
                                }
                            }}
                            onNavigateToOrders={() =>
                                navigation.navigate('Orders')
                            }
                            onNavigateToAddresses={() =>
                                navigation.navigate('Addresses')
                            }
                            onNavigateToAuth={(screen) =>
                                navigation.navigate(
                                    screen === 'signup' ? 'SignUp' : 'Login'
                                )
                            }
                        />
                    )}
                </Tab.Screen>
            </Tab.Navigator>

            {/* Login Required Modal */}
            <Modal
                visible={authModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAuthModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.authModalCard}>
                        <View style={styles.modalBadge}>
                            <Text style={styles.modalBadgeIcon}>🔒</Text>
                        </View>

                        <Text style={styles.modalTitle}>
                            Login Required
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            You can explore all electrical products and services
                            freely. Please log in or create an account to add
                            items to your cart and place orders.
                        </Text>

                        <TouchableOpacity
                            style={styles.modalLoginButton}
                            onPress={() => {
                                setAuthModalVisible(false);
                                navigation.navigate('Login');
                            }}
                        >
                            <Text style={styles.modalLoginButtonText}>
                                LOG IN TO CONSOLE →
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalSignupButton}
                            onPress={() => {
                                setAuthModalVisible(false);
                                navigation.navigate('SignUp');
                            }}
                        >
                            <Text style={styles.modalSignupButtonText}>
                                Create New Account
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalDismissButton}
                            onPress={() => setAuthModalVisible(false)}
                        >
                            <Text style={styles.modalDismissButtonText}>
                                Continue Browsing (View Only)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    authModalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 12,
    },
    modalBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalBadgeIcon: {
        fontSize: 24,
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 22,
    },
    modalLoginButton: {
        width: '100%',
        height: 46,
        backgroundColor: '#2563eb',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalLoginButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    modalSignupButton: {
        width: '100%',
        height: 42,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalSignupButtonText: {
        color: '#0f172a',
        fontSize: 13,
        fontWeight: '600',
    },
    modalDismissButton: {
        padding: 8,
    },
    modalDismissButtonText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
});
