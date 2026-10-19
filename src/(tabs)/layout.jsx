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
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AddressScreen from '../screens/AddressScreen';
import ServiceDetailPage from '../screens/serviceDetailPage';
import OrderDetailPage from '../screens/OrderDetailPage';
import { useCart } from '../context/CartContext';
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

    // Access backend-connected Cart Context
    const { totalCartCount, addToCart } = useCart();

    const handleAddToCart = async (product) => {
        try {
            await addToCart(product, 1);
        } catch (err) {
            console.error('Failed to add to cart:', err);
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
});
