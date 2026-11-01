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
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AddressScreen from '../screens/AddressScreen';
import ServiceDetailPage from '../screens/serviceDetailPage';
import OrderDetailPage from '../screens/OrderDetailPage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
    HomeIcon,
    ShopIcon,
    CartIcon,
    ProfileIcon,
} from '../components/Icons';

export default function TabsLayout({
    initialTab = 'home',
    onNavigateToAuth,
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedShopCategory, setSelectedShopCategory] = useState('all');
    const [selectedService, setSelectedService] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showingOrders, setShowingOrders] = useState(false);
    const [showingAddresses, setShowingAddresses] = useState(false);

    // Access backend-connected Cart and Auth Context
    const { totalCartCount, addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [authModalVisible, setAuthModalVisible] = useState(false);

    const handleAddToCart = async (product) => {
        if (!isAuthenticated) {
            setAuthModalVisible(true);
            return false;
        }
        try {
            return await addToCart(product, 1);
        } catch (err) {
            if (err?.code === 'AUTH_REQUIRED' || err?.message?.toLowerCase().includes('log in')) {
                setAuthModalVisible(true);
                return false;
            }
            console.error('Failed to add to cart:', err);
            throw err;
        }
    };

    const navigateToCart = () => {
        setSelectedService(null);
        setSelectedOrder(null);
        setShowingOrders(false);
        setShowingAddresses(false);
        setActiveTab('cart');
    };

    const navigateToShopWithCategory = (catId = 'all') => {
        setShowingOrders(false);
        setShowingAddresses(false);
        setSelectedService(null);
        setSelectedOrder(null);
        setSelectedShopCategory(catId);
        setActiveTab('shop');
    };

    // Render current active screen
    const renderScreen = () => {
        if (selectedOrder) {
            return (
                <OrderDetailPage
                    orderId={selectedOrder._id}
                    initialOrder={selectedOrder}
                    onBack={() => setSelectedOrder(null)}
                    onReorderSuccess={() => {
                        setSelectedOrder(null);
                        setShowingOrders(false);
                        setActiveTab('cart');
                    }}
                />
            );
        }

        if (showingAddresses) {
            return (
                <AddressScreen
                    onBack={() => setShowingAddresses(false)}
                />
            );
        }

        if (showingOrders) {
            return (
                <OrdersScreen
                    onBack={() => setShowingOrders(false)}
                    onSelectOrder={(order) => setSelectedOrder(order)}
                    onExploreShop={() => {
                        setShowingOrders(false);
                        setShowingAddresses(false);
                        setSelectedService(null);
                        setSelectedOrder(null);
                        setActiveTab('shop');
                    }}
                    onNavigateToAuth={onNavigateToAuth}
                />
            );
        }

        if (selectedService) {
            return (
                <ServiceDetailPage
                    serviceId={selectedService.id || selectedService._id}
                    initialService={selectedService}
                    onBack={() => setSelectedService(null)}
                    onAddToCart={handleAddToCart}
                    onNavigateToCart={navigateToCart}
                />
            );
        }

        switch (activeTab) {
            case 'home':
                return (
                    <HomeScreen
                        onSelectCategory={(catId) => setSelectedShopCategory(catId)}
                        onNavigateToShop={navigateToShopWithCategory}
                        onAddToCart={handleAddToCart}
                        onSelectService={(service) => setSelectedService(service)}
                        onNavigateToCart={navigateToCart}
                    />
                );
            case 'shop':
                return (
                    <ShopScreen
                        initialCategory={selectedShopCategory}
                        onAddToCart={handleAddToCart}
                        onSelectService={(service) => setSelectedService(service)}
                        onNavigateToCart={navigateToCart}
                    />
                );
            case 'cart':
                return (
                    <CartScreen
                        onExploreShop={() => {
                            setSelectedService(null);
                            setSelectedOrder(null);
                            setActiveTab('shop');
                        }}
                        onNavigateToOrders={(order) => {
                            if (order && (order._id || order.orderNumber)) {
                                setSelectedOrder(order);
                            } else {
                                setShowingOrders(true);
                            }
                        }}
                        onNavigateToAuth={onNavigateToAuth}
                    />
                );
            case 'profile':
                return (
                    <ProfileScreen
                        onNavigateToAuth={onNavigateToAuth}
                        onNavigateToOrders={() => {
                            setSelectedOrder(null);
                            setShowingOrders(true);
                        }}
                        onNavigateToAddresses={() => {
                            setSelectedOrder(null);
                            setShowingAddresses(true);
                        }}
                    />
                );
            default:
                return (
                    <HomeScreen
                        onNavigateToShop={navigateToShopWithCategory}
                        onAddToCart={handleAddToCart}
                        onSelectService={(service) => setSelectedService(service)}
                    />
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Screen Body */}
            <View style={styles.screenContainer}>{renderScreen()}</View>

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                {/* Tab 1: Home */}
                <TouchableOpacity
                    style={styles.tabButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        setShowingOrders(false);
                        setShowingAddresses(false);
                        setSelectedService(null);
                        setSelectedOrder(null);
                        setActiveTab('home');
                    }}
                >
                    <HomeIcon
                        size={22}
                        color="#64748b"
                        focused={!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'home'}
                    />
                    <Text
                        style={[
                            styles.tabLabel,
                            !showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'home' && styles.tabLabelActive,
                        ]}
                    >
                        Home
                    </Text>
                    {!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'home' && <View style={styles.activeDot} />}
                </TouchableOpacity>

                {/* Tab 2: Shop / Categories */}
                <TouchableOpacity
                    style={styles.tabButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        setShowingOrders(false);
                        setShowingAddresses(false);
                        setSelectedService(null);
                        setSelectedOrder(null);
                        setActiveTab('shop');
                    }}
                >
                    <ShopIcon
                        size={22}
                        color="#64748b"
                        focused={!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'shop'}
                    />
                    <Text
                        style={[
                            styles.tabLabel,
                            !showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'shop' && styles.tabLabelActive,
                        ]}
                    >
                        Shop
                    </Text>
                    {!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'shop' && <View style={styles.activeDot} />}
                </TouchableOpacity>

                {/* Tab 3: Cart */}
                <TouchableOpacity
                    style={styles.tabButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        setShowingOrders(false);
                        setShowingAddresses(false);
                        setSelectedService(null);
                        setSelectedOrder(null);
                        setActiveTab('cart');
                    }}
                >
                    <View style={styles.iconWithBadge}>
                        <CartIcon
                            size={22}
                            color="#64748b"
                            focused={!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'cart'}
                        />
                        {totalCartCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {totalCartCount > 9 ? '9+' : totalCartCount}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text
                        style={[
                            styles.tabLabel,
                            !showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'cart' && styles.tabLabelActive,
                        ]}
                    >
                        Cart
                    </Text>
                    {!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'cart' && <View style={styles.activeDot} />}
                </TouchableOpacity>

                {/* Tab 4: Profile / Account */}
                <TouchableOpacity
                    style={styles.tabButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        setShowingOrders(false);
                        setShowingAddresses(false);
                        setSelectedService(null);
                        setSelectedOrder(null);
                        setActiveTab('profile');
                    }}
                >
                    <ProfileIcon
                        size={22}
                        color="#64748b"
                        focused={!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'profile'}
                    />
                    <Text
                        style={[
                            styles.tabLabel,
                            !showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'profile' && styles.tabLabelActive,
                        ]}
                    >
                        Account
                    </Text>
                    {!showingOrders && !showingAddresses && !selectedService && !selectedOrder && activeTab === 'profile' && <View style={styles.activeDot} />}
                </TouchableOpacity>
            </View>

            {/* Login Prompt Modal for Adding to Cart */}
            <Modal
                visible={authModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAuthModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.authModalCard}>
                        {/* Lock Icon Badge */}
                        <View style={styles.modalBadge}>
                            <Text style={styles.modalBadgeIcon}>🔒</Text>
                        </View>

                        <Text style={styles.modalTitle}>Login Required</Text>
                        <Text style={styles.modalSubtitle}>
                            You can explore all electrical products and services freely. Please log in or create an account to add items to your cart and place orders.
                        </Text>

                        {/* Action Buttons */}
                        <TouchableOpacity
                            style={styles.modalLoginButton}
                            activeOpacity={0.85}
                            onPress={() => {
                                setAuthModalVisible(false);
                                if (onNavigateToAuth) {
                                    onNavigateToAuth('login');
                                }
                            }}
                        >
                            <Text style={styles.modalLoginButtonText}>LOG IN TO CONSOLE  →</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalSignupButton}
                            activeOpacity={0.8}
                            onPress={() => {
                                setAuthModalVisible(false);
                                if (onNavigateToAuth) {
                                    onNavigateToAuth('signup');
                                }
                            }}
                        >
                            <Text style={styles.modalSignupButtonText}>Create New Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalDismissButton}
                            activeOpacity={0.7}
                            onPress={() => setAuthModalVisible(false)}
                        >
                            <Text style={styles.modalDismissButtonText}>Continue Browsing (View Only)</Text>
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
    screenContainer: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        height: Platform.OS === 'ios' ? 76 : 64,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 18 : 6,
        paddingTop: 6,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        position: 'relative',
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
        borderColor: '#ffffff',
    },
    badgeText: {
        color: '#ffffff',
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
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 22,
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    modalBadgeIcon: {
        fontSize: 24,
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 22,
        paddingHorizontal: 8,
    },
    modalLoginButton: {
        width: '100%',
        height: 46,
        backgroundColor: '#2563eb',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    modalLoginButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
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
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    modalDismissButtonText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
});
