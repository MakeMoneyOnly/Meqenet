import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentValidationResult {
  isValid: boolean;
  confidence: number;
  extractedData?: {
    documentNumber?: string;
    fullName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    nationality?: string;
    gender?: string;
    address?: string;
    [key: string]: any;
  };
  errors?: string[];
}

/**
 * Service for validating KYC documents
 * In a production environment, this would integrate with a third-party OCR and document validation service
 * For now, we'll simulate document validation
 */
@Injectable()
export class DocumentValidationService {
  private readonly logger = new Logger(DocumentValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate a document image
   * @param documentPath Path to document image
   * @param documentType Type of document
   * @param documentNumber Expected document number
   * @returns Validation result
   */
  async validateDocument(
    documentPath: string,
    documentType: string,
    documentNumber: string,
  ): Promise<DocumentValidationResult> {
    try {
      this.logger.log(`Validating ${documentType} document: ${path.basename(documentPath)}`);

      // Check if file exists
      if (!fs.existsSync(documentPath)) {
        return {
          isValid: false,
          confidence: 0,
          errors: ['Document file not found'],
        };
      }

      // In a real implementation, you would:
      // 1. Send the document to an OCR service to extract text
      // 2. Validate the document structure and security features
      // 3. Extract relevant information (name, DOB, document number, etc.)
      // 4. Compare extracted document number with provided document number

      // For now, we'll simulate document validation with random results
      // In a real implementation, this would be replaced with actual validation logic

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate validation result
      const isValid = Math.random() > 0.2; // 80% chance of success
      const confidence = isValid ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;

      // Generate simulated extracted data
      const extractedData = this.generateSimulatedData(documentType, documentNumber, isValid);

      // Generate simulated errors
      const errors = isValid ? [] : this.generateSimulatedErrors(documentType);

      return {
        isValid,
        confidence,
        extractedData: isValid ? extractedData : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Error validating document: ${error.message}`, error.stack);
      return {
        isValid: false,
        confidence: 0,
        errors: ['Error processing document'],
      };
    }
  }

  /**
   * Generate simulated data for document validation
   * @param documentType Document type
   * @param documentNumber Document number
   * @param isValid Whether the document is valid
   * @returns Simulated extracted data
   */
  private generateSimulatedData(
    documentType: string,
    documentNumber: string,
    isValid: boolean,
  ): any {
    // If not valid, return partial or incorrect data
    if (!isValid) {
      return {
        documentNumber: documentNumber.substring(0, 3) + 'XXXX',
        fullName: 'UNREADABLE',
      };
    }

    // Generate realistic data based on document type
    switch (documentType) {
      case 'FAYDA_ID':
        return {
          documentNumber,
          fullName: 'Abebe Kebede',
          dateOfBirth: '1990-05-15',
          gender: 'M',
          address: 'Addis Ababa, Ethiopia',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01',
        };
      case 'PASSPORT':
        return {
          documentNumber,
          fullName: 'Abebe Kebede',
          dateOfBirth: '1990-05-15',
          nationality: 'Ethiopian',
          gender: 'M',
          issueDate: '2019-03-10',
          expiryDate: '2029-03-09',
          placeOfIssue: 'Addis Ababa',
        };
      case 'RESIDENCE_PERMIT':
        return {
          documentNumber,
          fullName: 'Abebe Kebede',
          dateOfBirth: '1990-05-15',
          nationality: 'Ethiopian',
          gender: 'M',
          issueDate: '2021-06-20',
          expiryDate: '2026-06-19',
          permitType: 'Work',
        };
      default:
        return {
          documentNumber,
          fullName: 'Abebe Kebede',
        };
    }
  }

  /**
   * Generate simulated errors for document validation
   * @param documentType Document type
   * @returns Simulated errors
   */
  private generateSimulatedErrors(documentType: string): string[] {
    const possibleErrors = [
      'Document image is blurry',
      'Document number could not be read clearly',
      'Document appears to be damaged',
      'Document security features could not be verified',
      'Document has expired',
      'Document type does not match expected type',
    ];

    // Return 1-3 random errors
    const numErrors = Math.floor(Math.random() * 3) + 1;
    const errors = [];
    for (let i = 0; i < numErrors; i++) {
      const errorIndex = Math.floor(Math.random() * possibleErrors.length);
      errors.push(possibleErrors[errorIndex]);
      possibleErrors.splice(errorIndex, 1);
    }

    return errors;
  }
}
