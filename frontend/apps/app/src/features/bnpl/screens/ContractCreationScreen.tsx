import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BNPLProduct, BNPLProductOption, CreateContractRequest } from '../types/bnpl';
import { bnplApi } from '../services/bnplApi';

interface Props {
  route: {
    params: {
      merchantId: string;
      amount: number;
      merchantName: string;
      product: BNPLProduct;
      productDetails: BNPLProductOption;
    };
  };
}

interface InstallmentPreview {
  number: number;
  amount: number;
  dueDate: Date;
}

export const ContractCreationScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation();
  const { merchantId, amount, merchantName, product, productDetails } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [installmentPreview, setInstallmentPreview] = useState<InstallmentPreview[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    generateInstallmentPreview();
  }, []);

  const generateInstallmentPreview = () => {
    const installments: InstallmentPreview[] = [];
    const now = new Date();

    if (product === BNPLProduct.PAY_IN_4) {
      // 4 payments over 6 weeks
      for (let i = 1; i <= 4; i++) {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + (i - 1) * 14); // Every 2 weeks
        installments.push({
          number: i,
          amount: Math.round(amount / 4),
          dueDate,
        });
      }
    } else if (product === BNPLProduct.PAY_IN_30) {
      // Single payment in 30 days
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);
      installments.push({
        number: 1,
        amount: amount,
        dueDate,
      });
    } else if (product === BNPLProduct.PAY_IN_FULL) {
      // Immediate payment
      installments.push({
        number: 1,
        amount: amount,
        dueDate: now,
      });
    } else if (product === BNPLProduct.FINANCING) {
      // 12 monthly payments (example)
      const monthlyAmount = Math.round(amount * 1.15 / 12); // 15% APR over 12 months
      for (let i = 1; i <= 12; i++) {
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + i);
        installments.push({
          number: i,
          amount: monthlyAmount,
          dueDate,
        });
      }
    }

    setInstallmentPreview(installments);
  };

  const handleCreateContract = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const contractRequest: CreateContractRequest = {
        customerId: 'current-user-id', // This would come from auth context
        merchantId,
        product,
        amount,
        description: `Purchase from ${merchantName}`,
        merchantReference: `ORDER-${Date.now()}`,
        ipAddress: '192.168.1.1', // This would come from device info
        userAgent: 'Meqenet-Mobile/1.0',
        deviceFingerprint: 'device-fingerprint', // This would be generated
      };

      const response = await bnplApi.createContract(contractRequest);

      if (response.success) {
        Alert.alert(
          'Contract Created!',
          `Your ${productDetails.name} contract has been created successfully.`,
          [
            {
              text: 'View Details',
              onPress: () => {
                navigation.navigate('ContractDetails', {
                  contractId: response.data.contractId,
                });
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to create contract');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to create contract. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTotalInterest = () => {
    if (product === BNPLProduct.PAY_IN_4 || product === BNPLProduct.PAY_IN_30 || product === BNPLProduct.PAY_IN_FULL) {
      return 0;
    }
    return Math.round(amount * 0.15); // 15% APR for financing
  };

  const getTotalAmount = () => {
    return amount + getTotalInterest();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Review Your Contract</Text>
          <Text style={styles.merchantName}>{merchantName}</Text>
          <Text style={styles.productName}>{productDetails.name}</Text>
        </View>

        {/* Contract Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Purchase Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
          </View>

          {getTotalInterest() > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interest ({productDetails.interestRate}% APR)</Text>
              <Text style={styles.interestValue}>{formatCurrency(getTotalInterest())}</Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(getTotalAmount())}</Text>
          </View>
        </View>

        {/* Installment Schedule */}
        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>Payment Schedule</Text>

          {installmentPreview.map((installment, index) => (
            <View key={index} style={styles.installmentRow}>
              <View style={styles.installmentInfo}>
                <Text style={styles.installmentNumber}>
                  Payment {installment.number}
                </Text>
                <Text style={styles.installmentDate}>
                  Due: {formatDate(installment.dueDate)}
                </Text>
              </View>
              <Text style={styles.installmentAmount}>
                {formatCurrency(installment.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsCard}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>

          <View style={styles.termsList}>
            <Text style={styles.termItem}>
              • Interest rate: {productDetails.interestRate}% APR
            </Text>
            <Text style={styles.termItem}>
              • Late payment fee: 50 ETB per missed payment
            </Text>
            <Text style={styles.termItem}>
              • Buyer protection included for eligible purchases
            </Text>
            <Text style={styles.termItem}>
              • Cashback rewards available on qualifying purchases
            </Text>
          </View>

          <TouchableOpacity
            style={styles.termsCheckbox}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkedCheckbox]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the terms and conditions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Contract Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (!acceptedTerms || isLoading) && styles.disabledButton,
          ]}
          onPress={handleCreateContract}
          disabled={!acceptedTerms || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[
              styles.createButtonText,
              (!acceptedTerms || isLoading) && styles.disabledButtonText,
            ]}>
              Create Contract
            </Text>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 12,
    marginTop: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  interestValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066cc',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  installmentInfo: {
    flex: 1,
  },
  installmentNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  installmentDate: {
    fontSize: 14,
    color: '#666',
  },
  installmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  termsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  termsList: {
    marginBottom: 20,
  },
  termItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#0066cc',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  createButton: {
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
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
});
