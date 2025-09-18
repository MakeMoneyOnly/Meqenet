import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BNPLProduct } from '../../types/bnpl';

interface ProductOption {
  id: BNPLProduct;
  title: string;
  description: string;
  interestRate: number;
  term: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  popular?: boolean;
}

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    id: BNPLProduct.PAY_IN_4,
    title: 'Pay in 4',
    description: 'Split into 4 interest-free payments over 6 weeks',
    interestRate: 0,
    term: '6 weeks',
    icon: '💳',
    minAmount: 100,
    maxAmount: 5000,
    popular: true,
  },
  {
    id: BNPLProduct.PAY_IN_30,
    title: 'Pay in 30',
    description: 'Full payment deferred for 30 days',
    interestRate: 0,
    term: '30 days',
    icon: '🛡️',
    minAmount: 50,
    maxAmount: 10000,
  },
  {
    id: BNPLProduct.PAY_IN_FULL,
    title: 'Pay in Full',
    description: 'Pay now & earn maximum cashback',
    interestRate: 0,
    term: 'Immediate',
    icon: '💰',
    minAmount: 10,
    maxAmount: 100000,
  },
  {
    id: BNPLProduct.FINANCING,
    title: 'Installment Plan',
    description: 'Long-term financing with low rates',
    interestRate: 15,
    term: '3-24 months',
    icon: '📅',
    minAmount: 1000,
    maxAmount: 100000,
  },
];

interface Props {
  route: {
    params: {
      merchantId: string;
      amount: number;
      merchantName: string;
    };
  };
}

export const ProductSelectionScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation();
  const { merchantId, amount, merchantName } = route.params;
  const [selectedProduct, setSelectedProduct] = useState<BNPLProduct | null>(null);

  const handleProductSelect = (productId: BNPLProduct) => {
    setSelectedProduct(productId);
  };

  const handleContinue = () => {
    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please select a payment option to continue.');
      return;
    }

    const selectedOption = PRODUCT_OPTIONS.find(p => p.id === selectedProduct);
    if (!selectedOption) return;

    // Validate amount limits
    if (amount < selectedOption.minAmount || amount > selectedOption.maxAmount) {
      Alert.alert(
        'Amount Not Eligible',
        `This option requires amounts between ${selectedOption.minAmount.toLocaleString()} and ${selectedOption.maxAmount.toLocaleString()} ETB.`
      );
      return;
    }

    // Navigate to contract creation
    navigation.navigate('ContractCreation', {
      merchantId,
      amount,
      merchantName,
      product: selectedProduct,
      productDetails: selectedOption,
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.merchantName}>{merchantName}</Text>
          <Text style={styles.purchaseAmount}>{formatCurrency(amount)}</Text>
          <Text style={styles.subtitle}>Choose your payment option</Text>
        </View>

        {/* Product Options */}
        <View style={styles.productsContainer}>
          {PRODUCT_OPTIONS.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard,
                selectedProduct === product.id && styles.selectedProductCard,
                product.popular && styles.popularProductCard,
              ]}
              onPress={() => handleProductSelect(product.id)}
            >
              {product.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.productHeader}>
                <Text style={styles.productIcon}>{product.icon}</Text>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={styles.productTerm}>{product.term}</Text>
                </View>
              </View>

              <Text style={styles.productDescription}>{product.description}</Text>

              {product.interestRate > 0 && (
                <Text style={styles.interestRate}>
                  {product.interestRate}% APR
                </Text>
              )}

              <View style={styles.amountRange}>
                <Text style={styles.amountRangeText}>
                  {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedProduct && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedProduct}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedProduct && styles.disabledButtonText,
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  purchaseAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  productsContainer: {
    marginBottom: 30,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedProductCard: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f8ff',
  },
  popularProductCard: {
    borderColor: '#ff6b35',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productTerm: {
    fontSize: 14,
    color: '#666',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  interestRate: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '600',
    marginBottom: 8,
  },
  amountRange: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  amountRangeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
});
