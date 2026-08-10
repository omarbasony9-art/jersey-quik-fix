import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  badge?: string;
  image: string;
};

const products: Product[] = [
  { id: 1, name: 'PlayBox 5 Console', category: 'Consoles', price: 499.99, oldPrice: 549.99, rating: 4.9, badge: 'Best Seller', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Nebula Pro Wireless Controller', category: 'Accessories', price: 69.99, rating: 4.7, image: 'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Monster Quest: Eclipse', category: 'Games', price: 69.99, rating: 4.8, badge: 'New Release', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Elite Gaming Headset', category: 'Accessories', price: 119.99, rating: 4.6, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'Mystic Monsters Booster Box', category: 'Trading Cards', price: 134.99, rating: 4.9, badge: 'Hot', image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80' },
  { id: 6, name: 'Retro Handheld Console', category: 'Retro', price: 149.99, rating: 4.5, image: 'https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?auto=format&fit=crop&w=600&q=80' },
  { id: 7, name: 'Collector Figure — Titan', category: 'Collectibles', price: 39.99, rating: 4.7, image: 'https://images.unsplash.com/photo-1608889476561-6242cfdbf622?auto=format&fit=crop&w=600&q=80' },
  { id: 8, name: 'Velocity Racing 26', category: 'Games', price: 59.99, rating: 4.4, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
];

const categories = ['All', 'Games', 'Consoles', 'Accessories', 'Trading Cards', 'Collectibles', 'Retro'];

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const webTopPad = Platform.OS === 'web' ? 67 : 0;
  const webBottomPad = Platform.OS === 'web' ? 34 : 0;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchQ = p.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [activeCategory, query]);

  const s = makeStyles(colors);

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <ProductCard product={item} colors={colors} s={s} isLeft={index % 2 === 0} />
  );

  return (
    <View style={[s.container, { paddingTop: insets.top + webTopPad }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerBadge}>GAMEVAULT</Text>
          <Text style={s.headerTitle}>The <Text style={{ color: colors.primary }}>Vault</Text></Text>
        </View>
        <View style={s.logoMark}>
          <Ionicons name="game-controller" size={20} color={colors.primaryForeground} />
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search games, consoles, gear..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipScroll}
        contentContainerStyle={s.chipContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.chip, activeCategory === cat && s.chipActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat); }}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, activeCategory === cat && s.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{filtered.length} items</Text>
      </View>

      {/* Product grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={s.columnWrapper}
        contentContainerStyle={[s.gridContent, { paddingBottom: insets.bottom + 90 + webBottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>No loot found</Text>
            <Text style={s.emptyDesc}>Try adjusting your search or category filters.</Text>
          </View>
        }
      />
    </View>
  );
}

function ProductCard({ product, colors, s, isLeft }: { product: Product; colors: ReturnType<typeof useColors>; s: ReturnType<typeof makeStyles>; isLeft: boolean }) {
  return (
    <View style={[s.productCard, !isLeft && { marginLeft: 10 }]}>
      <View style={s.productImageWrap}>
        {product.badge && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{product.badge}</Text>
          </View>
        )}
        <Image source={{ uri: product.image }} style={s.productImage} resizeMode="cover" />
      </View>
      <View style={s.productInfo}>
        <Text style={s.productCategory}>{product.category}</Text>
        <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
        <View style={s.ratingRow}>
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text style={s.ratingText}>{product.rating}</Text>
        </View>
        <View style={s.priceRow}>
          <View>
            {product.oldPrice && <Text style={s.oldPrice}>${product.oldPrice}</Text>}
            <Text style={s.price}>${product.price}</Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Added!', `${product.name} added to cart.`);
            }}
            activeOpacity={0.8}
          >
            <Feather name="shopping-bag" size={16} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
    },
    headerBadge: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter_900Black',
      color: colors.foreground,
    },
    logoMark: {
      width: 40,
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
    },
    clearBtn: {
      padding: 4,
    },
    chipScroll: {
      maxHeight: 44,
    },
    chipContent: {
      paddingHorizontal: 20,
      gap: 8,
      alignItems: 'center',
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
    },
    chipTextActive: {
      color: colors.primaryForeground,
    },
    countRow: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    countText: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
      letterSpacing: 0.5,
    },
    gridContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    columnWrapper: {
      marginBottom: 12,
    },
    productCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    productImageWrap: {
      height: 150,
      backgroundColor: colors.muted,
      position: 'relative',
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      zIndex: 1,
    },
    badgeText: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryForeground,
      letterSpacing: 0.5,
    },
    productInfo: {
      padding: 12,
    },
    productCategory: {
      fontSize: 9,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 1,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    productName: {
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 6,
      lineHeight: 17,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginBottom: 8,
    },
    ratingText: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    oldPrice: {
      fontSize: 10,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textDecorationLine: 'line-through',
    },
    price: {
      fontSize: 16,
      fontFamily: 'Inter_900Black',
      color: colors.primary,
    },
    addBtn: {
      width: 34,
      height: 34,
      backgroundColor: colors.primary,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    emptyDesc: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
  });
}
