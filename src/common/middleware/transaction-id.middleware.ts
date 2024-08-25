import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    req.transactionId = uuidv4(); // Genera un identificador único
    next();
  }
}
