import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MerchantAuthService } from '../services/merchant-auth.service';

@Injectable()
export class MerchantApiGuard implements CanActivate {
  constructor(private readonly merchantAuthService: MerchantAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract API key and secret from headers or body
    const apiKey = request.headers['x-api-key'] || request.body.apiKey;
    const apiSecret = request.headers['x-api-secret'] || request.body.apiSecret;
    
    if (!apiKey || !apiSecret) {
      throw new UnauthorizedException('API key and secret are required');
    }
    
    // Get client IP for security logging and rate limiting
    const ipAddress = this.getClientIp(request);
    
    // Validate API credentials
    const merchant = await this.merchantAuthService.validateApiKey(apiKey, apiSecret, ipAddress);
    
    if (!merchant) {
      throw new UnauthorizedException('Invalid API credentials');
    }
    
    // Attach merchant to request for use in controllers
    request.merchant = merchant;
    
    return true;
  }
  
  private getClientIp(request: any): string {
    return request.headers['x-forwarded-for']?.split(',')[0] || 
      request.headers['x-real-ip'] || 
      request.connection?.remoteAddress || 
      'unknown';
  }
}
